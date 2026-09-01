import axios from 'axios';
import { HTTP_STATUS } from '@/shared-libs/constants/http-status.constant';

/**
 * Returns true for failures that are safe to retry:
 * network errors, timeouts, HTTP 429, HTTP 5xx.
 */
export function isTransientOutboundError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('socket hang up')
      );
    }
    return false;
  }

  if (!error.response) {
    // No response → network / timeout / DNS / connection reset
    return true;
  }

  const status = error.response.status;
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) return true;
  if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) return true;

  return false;
}
