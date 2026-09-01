import { createHash } from 'node:crypto';
import { AxiosRequestConfig } from 'axios';
import { OutboundCacheConfig } from './types';

/**
 * Build a deterministic Redis cache key from the outbound request.
 * Prefer an explicit `cache.key` when the domain already has a key convention.
 */
export function buildOutboundCacheKey(
  serviceName: string,
  config: AxiosRequestConfig,
  cacheConfig: Pick<OutboundCacheConfig<unknown>, 'key' | 'keyPrefix'>,
): string {
  if (cacheConfig.key) {
    return cacheConfig.key;
  }

  const method = (config.method ?? 'GET').toUpperCase();
  const url = config.url ?? '';
  const paramsFingerprint = stableSerialize(config.params);
  const dataFingerprint = stableSerialize(config.data);
  const fingerprint = createHash('sha1')
    .update(`${method}|${url}|${paramsFingerprint}|${dataFingerprint}`)
    .digest('hex')
    .slice(0, 16);

  const prefix = cacheConfig.keyPrefix ?? `outbound:${serviceName}`;
  return `${prefix}:${method}:${fingerprint}`;
}

function stableSerialize(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'object') return String(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${key}:${stableSerialize(record[key])}`)
    .join(',')}}`;
}
