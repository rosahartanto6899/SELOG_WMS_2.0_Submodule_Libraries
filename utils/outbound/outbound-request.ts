import axios, { AxiosResponse } from 'axios';
import cache from '@/shared-libs/utils/cache.util';
import { buildOutboundCacheKey } from './cache-key';
import {
  circuitBreakerRegistry,
  OutboundCircuitOpenError,
} from './circuit-breaker';
import { DEFAULT_OUTBOUND_CACHE_TTL_SECONDS } from './constants';
import { mergeOutboundHooks } from './default-hooks';
import {
  OutboundCacheConfig,
  OutboundHookContext,
  OutboundRequestOptions,
  resolveCacheConfig,
  resolveCircuitBreakerConfig,
  resolveRetryConfig,
  resolveTimeout,
} from './types';
import { withOutboundRetry } from './with-retry';

/** In-flight coalescing keyed by cache key (process-local). */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Execute an outbound HTTP request with optional timeout, retry,
 * circuit breaker, Redis cache, fallback, and lifecycle hooks.
 *
 * All resilience features are opt-in except timeout (always applied).
 */
export async function executeOutboundRequest<T>(
  options: OutboundRequestOptions<T>,
): Promise<T> {
  const {
    serviceName,
    config,
    timeout,
    mapResponse = defaultMapResponse as (response: AxiosResponse) => T,
  } = options;

  const hooks = mergeOutboundHooks(serviceName, options.hooks);

  const retryConfig = resolveRetryConfig(options.retry);
  const circuitConfig = resolveCircuitBreakerConfig(options.circuitBreaker);
  const cacheConfig = resolveCacheConfig(options.cache);
  const resolvedTimeout = resolveTimeout(config.timeout, timeout);

  const axiosConfig = {
    ...config,
    timeout: resolvedTimeout,
  };
  const cacheKey = cacheConfig
    ? buildOutboundCacheKey(serviceName, axiosConfig, cacheConfig)
    : undefined;

  const baseCtx: OutboundHookContext = {
    serviceName,
    method: (axiosConfig.method ?? 'GET').toString().toUpperCase(),
    url: axiosConfig.url,
    cacheKey,
  };

  if (cacheConfig && cacheKey) {
    try {
      const cached = await cache.get<T>(cacheKey);
      if (cached !== null && cached !== undefined) {
        hooks?.onCacheHit?.(baseCtx);
        return cached;
      }
    } catch {
      // Cache read failures must not block the outbound call.
    }

    if (cacheConfig.coalesce && pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)! as Promise<T>;
    }
  }

  const execute = async (): Promise<T> => {
    if (circuitConfig) {
      if (!circuitBreakerRegistry.canRequest(serviceName, circuitConfig)) {
        const openError = new OutboundCircuitOpenError(serviceName);
        hooks?.onCircuitOpen?.({ ...baseCtx, error: openError });
        return resolveFallbackOrThrow(options, openError, hooks, baseCtx);
      }
    }

    const startedAt = Date.now();
    hooks?.onStart?.(baseCtx);

    try {
      const response = await performRequest(
        axiosConfig,
        retryConfig,
        hooks,
        baseCtx,
      );
      const mapped = mapResponse(response);

      if (circuitConfig) {
        circuitBreakerRegistry.recordSuccess(serviceName, circuitConfig);
      }

      await persistCache(cacheKey, cacheConfig, mapped);

      hooks?.onSuccess?.({
        ...baseCtx,
        durationMs: Date.now() - startedAt,
      });

      return mapped;
    } catch (error) {
      if (circuitConfig) {
        circuitBreakerRegistry.recordFailure(serviceName, circuitConfig);
      }

      hooks?.onError?.({
        ...baseCtx,
        error,
        durationMs: Date.now() - startedAt,
      });

      return resolveFallbackOrThrow(options, error, hooks, baseCtx);
    }
  };

  if (cacheConfig?.coalesce && cacheKey) {
    const pending = execute().finally(() => {
      pendingRequests.delete(cacheKey);
    });
    pendingRequests.set(cacheKey, pending);
    return pending;
  }

  return execute();
}

async function performRequest(
  axiosConfig: OutboundRequestOptions<unknown>['config'],
  retryConfig: ReturnType<typeof resolveRetryConfig>,
  hooks: OutboundRequestOptions<unknown>['hooks'],
  baseCtx: OutboundHookContext,
): Promise<AxiosResponse> {
  const request = () => axios.request(axiosConfig);

  if (!retryConfig) {
    return request();
  }

  return withOutboundRetry(request, retryConfig, (attempt, error) => {
    hooks?.onRetry?.({ ...baseCtx, attempt, error });
  });
}

async function persistCache<T>(
  cacheKey: string | undefined,
  cacheConfig: OutboundCacheConfig<T> | null,
  data: T,
): Promise<void> {
  if (!cacheConfig || !cacheKey) return;

  if (cacheConfig.shouldSet && !cacheConfig.shouldSet(data)) {
    return;
  }

  const ttl =
    typeof cacheConfig.ttl === 'function'
      ? cacheConfig.ttl(data)
      : (cacheConfig.ttl ?? DEFAULT_OUTBOUND_CACHE_TTL_SECONDS);

  try {
    await cache.set(cacheKey, data, ttl);
  } catch {
    // Fail-safe: never fail the caller because Redis write failed.
  }
}

async function resolveFallbackOrThrow<T>(
  options: OutboundRequestOptions<T>,
  error: unknown,
  hooks: OutboundRequestOptions<T>['hooks'],
  baseCtx: OutboundHookContext,
): Promise<T> {
  if (options.fallback === undefined) {
    throw error;
  }

  hooks?.onFallback?.({ ...baseCtx, error });

  if (typeof options.fallback === 'function') {
    return (options.fallback as (err: unknown) => T | Promise<T>)(error);
  }

  return options.fallback;
}

function defaultMapResponse(response: AxiosResponse): unknown {
  return response.data;
}
