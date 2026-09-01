export {
  DEFAULT_OUTBOUND_TIMEOUT_MS,
  DEFAULT_OUTBOUND_CACHE_TTL_SECONDS,
  DEFAULT_OUTBOUND_RETRIES,
  DEFAULT_OUTBOUND_RETRY_MIN_TIMEOUT_MS,
  DEFAULT_OUTBOUND_RETRY_FACTOR,
  DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
  DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
} from './constants';

export { executeOutboundRequest } from './outbound-request';
export {
  createDefaultOutboundHooks,
  mergeOutboundHooks,
} from './default-hooks';
export { buildOutboundCacheKey } from './cache-key';
export { isTransientOutboundError } from './is-transient-error';
export {
  circuitBreakerRegistry,
  OutboundCircuitOpenError,
} from './circuit-breaker';

export type {
  OutboundRequestOptions,
  OutboundRetryConfig,
  OutboundCircuitBreakerConfig,
  OutboundCacheConfig,
  OutboundHooks,
  OutboundHookContext,
} from './types';
