import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
  DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
  DEFAULT_OUTBOUND_CACHE_TTL_SECONDS,
  DEFAULT_OUTBOUND_RETRIES,
  DEFAULT_OUTBOUND_RETRY_FACTOR,
  DEFAULT_OUTBOUND_RETRY_MIN_TIMEOUT_MS,
  DEFAULT_OUTBOUND_TIMEOUT_MS,
} from './constants';

export type OutboundRetryConfig = {
  /** Number of retries after the first attempt (default: 2). */
  retries?: number;
  /** Initial backoff delay in ms (default: 200). */
  minTimeout?: number;
  /** Exponential backoff factor (default: 2). */
  factor?: number;
};

export type OutboundCircuitBreakerConfig = {
  failureThreshold?: number;
  resetTimeoutMs?: number;
};

export type OutboundCacheConfig<T = unknown> = {
  /**
   * Manual cache key override.
   * When omitted, a deterministic key is generated from the request.
   */
  key?: string;
  /**
   * Optional prefix for auto-generated keys (e.g. `order:bulk-eta`).
   * Ignored when `key` is provided.
   */
  keyPrefix?: string;
  /**
   * TTL in seconds, or a function of the mapped response.
   * Default: DEFAULT_OUTBOUND_CACHE_TTL_SECONDS (60).
   */
  ttl?: number | ((data: T) => number);
  /**
   * When false, skip writing to cache for this response.
   * Default: always write on success.
   */
  shouldSet?: (data: T) => boolean;
  /**
   * Coalesce concurrent in-flight requests that share the same cache key.
   */
  coalesce?: boolean;
};

export type OutboundHookContext = {
  serviceName: string;
  method?: string;
  url?: string;
  cacheKey?: string;
  attempt?: number;
  error?: unknown;
  durationMs?: number;
};

export type OutboundHooks = {
  onStart?: (ctx: OutboundHookContext) => void;
  onSuccess?: (ctx: OutboundHookContext) => void;
  onError?: (ctx: OutboundHookContext) => void;
  onRetry?: (ctx: OutboundHookContext) => void;
  onCacheHit?: (ctx: OutboundHookContext) => void;
  onCircuitOpen?: (ctx: OutboundHookContext) => void;
  onFallback?: (ctx: OutboundHookContext) => void;
};

export type OutboundRequestOptions<T> = {
  /** Downstream service identifier (circuit breaker + logging). */
  serviceName: string;
  /** Axios request config (timeout may be overridden by `timeout`). */
  config: AxiosRequestConfig;
  /** Request timeout in ms (default: 10s). */
  timeout?: number;
  /**
   * Retry transient failures with exponential backoff.
   * Pass `true` for defaults, or a config object.
   */
  retry?: boolean | OutboundRetryConfig;
  /**
   * In-memory circuit breaker scoped by `serviceName`.
   * Pass `true` for defaults, or a config object.
   */
  circuitBreaker?: boolean | OutboundCircuitBreakerConfig;
  /**
   * Optional Redis cache-aside.
   * Pass `true` for auto key + default TTL, or a config object.
   */
  cache?: boolean | OutboundCacheConfig<T>;
  /**
   * Soft-fail value (or factory) when the request ultimately fails
   * or the circuit is open.
   */
  fallback?: T | ((error: unknown) => T | Promise<T>);
  /** Lifecycle hooks (logging, metrics). Pipeline stays logger-agnostic. */
  hooks?: OutboundHooks;
  /**
   * Map Axios response → consumer value.
   * Default: `response.data`.
   */
  mapResponse?: (response: AxiosResponse) => T;
};

export function resolveRetryConfig(
  retry?: boolean | OutboundRetryConfig,
): OutboundRetryConfig | null {
  if (!retry) return null;
  if (retry === true) {
    return {
      retries: DEFAULT_OUTBOUND_RETRIES,
      minTimeout: DEFAULT_OUTBOUND_RETRY_MIN_TIMEOUT_MS,
      factor: DEFAULT_OUTBOUND_RETRY_FACTOR,
    };
  }
  return {
    retries: retry.retries ?? DEFAULT_OUTBOUND_RETRIES,
    minTimeout: retry.minTimeout ?? DEFAULT_OUTBOUND_RETRY_MIN_TIMEOUT_MS,
    factor: retry.factor ?? DEFAULT_OUTBOUND_RETRY_FACTOR,
  };
}

export function resolveCircuitBreakerConfig(
  circuitBreaker?: boolean | OutboundCircuitBreakerConfig,
): OutboundCircuitBreakerConfig | null {
  if (!circuitBreaker) return null;
  if (circuitBreaker === true) {
    return {
      failureThreshold: DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
      resetTimeoutMs: DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
    };
  }
  return {
    failureThreshold:
      circuitBreaker.failureThreshold ?? DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
    resetTimeoutMs:
      circuitBreaker.resetTimeoutMs ?? DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
  };
}

export function resolveCacheConfig<T>(
  cache?: boolean | OutboundCacheConfig<T>,
): OutboundCacheConfig<T> | null {
  if (!cache) return null;
  if (cache === true) {
    return { ttl: DEFAULT_OUTBOUND_CACHE_TTL_SECONDS };
  }
  return {
    ...cache,
    ttl: cache.ttl ?? DEFAULT_OUTBOUND_CACHE_TTL_SECONDS,
  };
}

export function resolveTimeout(
  configTimeout: number | undefined,
  optionTimeout: number | undefined,
): number {
  return optionTimeout ?? configTimeout ?? DEFAULT_OUTBOUND_TIMEOUT_MS;
}
