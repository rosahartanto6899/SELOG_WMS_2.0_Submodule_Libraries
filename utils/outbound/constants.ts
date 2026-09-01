/**
 * Defaults for the outbound request pipeline.
 * Prefer SecretManager / env overrides at call sites when present.
 */

/** Matches InternalService.timeout (10s). */
export const DEFAULT_OUTBOUND_TIMEOUT_MS = 1000 * 10;

/**
 * Project-wide default Redis TTL for outbound responses (seconds).
 * Aligns with common enrichment cache usage; override per request when needed.
 */
export const DEFAULT_OUTBOUND_CACHE_TTL_SECONDS = 60;

/** Retry: transient failures only. Total attempts = retries + 1. */
export const DEFAULT_OUTBOUND_RETRIES = 2;
export const DEFAULT_OUTBOUND_RETRY_MIN_TIMEOUT_MS = 200;
export const DEFAULT_OUTBOUND_RETRY_FACTOR = 2;

/** Circuit breaker: per downstream serviceName. */
export const DEFAULT_CIRCUIT_FAILURE_THRESHOLD = 5;
export const DEFAULT_CIRCUIT_RESET_TIMEOUT_MS = 30_000;
