import logger from '@/shared-libs/utils/logger.util';
import { OutboundHookContext, OutboundHooks } from './types';

/**
 * Default outbound lifecycle hooks using the shared Winston logger.
 * Matches existing integration log patterns: [ServiceName] method url detail.
 */
export function createDefaultOutboundHooks(
  serviceName: string,
): OutboundHooks {
  return {
    onError: (ctx: OutboundHookContext) => {
      const detail =
        ctx.error instanceof Error ? ctx.error.message : String(ctx.error);
      logger.error(
        `[${serviceName}] ${ctx.method ?? 'REQUEST'} ${ctx.url ?? ''} failed: ${detail}`,
      );
    },
    onRetry: (ctx: OutboundHookContext) => {
      logger.warn(
        `[${serviceName}] retry attempt ${ctx.attempt} for ${ctx.method ?? ''} ${ctx.url ?? ''}`,
      );
    },
    onCircuitOpen: (ctx: OutboundHookContext) => {
      logger.warn(
        `[${serviceName}] circuit open — skipping ${ctx.method ?? ''} ${ctx.url ?? ''}`,
      );
    },
    onFallback: (ctx: OutboundHookContext) => {
      logger.warn(
        `[${serviceName}] using fallback for ${ctx.method ?? ''} ${ctx.url ?? ''}`,
      );
    },
  };
}

type HookFn = ((ctx: OutboundHookContext) => void) | undefined;

function composeHooks(defaultFn: HookFn, customFn: HookFn): HookFn {
  if (!defaultFn && !customFn) return undefined;
  if (!customFn) return defaultFn;
  if (!defaultFn) return customFn;
  return (ctx) => {
    defaultFn(ctx);
    customFn(ctx);
  };
}

/**
 * Merge default logger hooks with optional custom hooks.
 * Both run when provided — custom hooks extend, not replace, defaults.
 */
export function mergeOutboundHooks(
  serviceName: string,
  custom?: OutboundHooks,
): OutboundHooks {
  const defaults = createDefaultOutboundHooks(serviceName);
  if (!custom) return defaults;

  return {
    onStart: composeHooks(defaults.onStart, custom.onStart),
    onSuccess: composeHooks(defaults.onSuccess, custom.onSuccess),
    onError: composeHooks(defaults.onError, custom.onError),
    onRetry: composeHooks(defaults.onRetry, custom.onRetry),
    onCacheHit: composeHooks(defaults.onCacheHit, custom.onCacheHit),
    onCircuitOpen: composeHooks(defaults.onCircuitOpen, custom.onCircuitOpen),
    onFallback: composeHooks(defaults.onFallback, custom.onFallback),
  };
}
