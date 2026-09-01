import { OutboundRetryConfig } from './types';
import { isTransientOutboundError } from './is-transient-error';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff for transient failures only.
 * No external dependency — avoids requiring async-retry in host services.
 */
export async function withOutboundRetry<T>(
  fn: () => Promise<T>,
  retryConfig: OutboundRetryConfig,
  onRetry?: (attempt: number, error: unknown) => void,
): Promise<T> {
  const { retries = 0, minTimeout = 200, factor = 2 } = retryConfig;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === retries;
      if (!isTransientOutboundError(error) || isLastAttempt) {
        throw error;
      }

      onRetry?.(attempt + 1, error);
      await sleep(minTimeout * factor ** attempt);
    }
  }

  throw lastError;
}
