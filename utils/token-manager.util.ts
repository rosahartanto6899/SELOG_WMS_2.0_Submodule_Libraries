import logger from '@/shared-libs/utils/logger.util';
import { RedisCache } from '@/integrations/thrid-party/redis.third';

/**
 * Token Manager for Third-Party API Authentication
 *
 * Manages access tokens with:
 * - In-memory + Redis caching for multi-replica support
 * - Automatic expiry tracking
 * - Token validation with configurable buffer
 */
export class TokenManager {
  private accessToken = '';
  private tokenExpiry = 0;
  private readonly redisCache: RedisCache;
  private readonly tokenCacheKey: string;
  private readonly tokenExpiryCacheKey: string;
  private readonly expiryBuffer: number;

  /**
   * @param {string} serviceName - Name of the service (used for Redis keys)
   * @param {number} expiryBuffer - Buffer time in seconds before expiry (default: 300 = 5 minutes)
   */
  constructor(serviceName: string, expiryBuffer = 300) {
    this.redisCache = new RedisCache();
    this.tokenCacheKey = `integration:${serviceName}:token`;
    this.tokenExpiryCacheKey = `integration:${serviceName}:token_expiry`;
    this.expiryBuffer = expiryBuffer;
  }

  /**
   * Get the current access token from memory
   */
  getToken(): string {
    return this.accessToken;
  }

  /**
   * Get the token expiry timestamp
   */
  getExpiry(): number {
    return this.tokenExpiry;
  }

  /**
   * Check if current token is valid (not expired)
   */
  isTokenValid(): boolean {
    if (!this.accessToken) {
      return false;
    }

    const now = Date.now();
    const isValid = this.tokenExpiry - now > this.expiryBuffer * 1000;

    return isValid;
  }

  /**
   * Set new token and cache it in Redis
   * @param {string} token - The access token
   * @param {number} expiryTimestamp - Token expiry timestamp in milliseconds
   */
  async setToken(token: string, expiryTimestamp: number): Promise<void> {
    this.accessToken = token;
    this.tokenExpiry = expiryTimestamp;

    // Calculate TTL for Redis cache (in seconds)
    const cacheTtlMs = expiryTimestamp - Date.now() - this.expiryBuffer * 1000;
    const cacheTtl = Math.max(Math.floor(cacheTtlMs / 1000), 60); // Minimum 60 seconds

    try {
      await this.redisCache.set(this.tokenCacheKey, token, cacheTtl);
      await this.redisCache.set(
        this.tokenExpiryCacheKey,
        expiryTimestamp.toString(),
        cacheTtl
      );
      logger.info(
        `Token cached in Redis with TTL: ${cacheTtl} seconds (${this.tokenCacheKey})`
      );
    } catch (error) {
      logger.warn(
        `Failed to cache token in Redis: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Don't throw - caching is optional, service can continue without it
    }
  }

  /**
   * Retrieve token from Redis cache if valid
   * @returns {Promise<string | null>} Token if found and valid, null otherwise
   */
  async getTokenFromCache(): Promise<string | null> {
    try {
      const cachedToken = await this.redisCache.get<string>(this.tokenCacheKey);
      const cachedExpiry = await this.redisCache.get<string>(
        this.tokenExpiryCacheKey
      );

      if (cachedToken && cachedExpiry) {
        const expiry = Number.parseInt(cachedExpiry, 10);
        const isValid = expiry - Date.now() > this.expiryBuffer * 1000;

        if (isValid) {
          this.accessToken = cachedToken;
          this.tokenExpiry = expiry;
          logger.info(
            `Token restored from Redis cache (${this.tokenCacheKey})`
          );
          return cachedToken;
        } else {
          logger.info('Cached token is expired, will refresh');
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to retrieve token from Redis: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    return null;
  }

  /**
   * Clear token from memory and cache
   */
  async clearToken(): Promise<void> {
    this.accessToken = '';
    this.tokenExpiry = 0;

    try {
      await this.redisCache.delete(this.tokenCacheKey);
      await this.redisCache.delete(this.tokenExpiryCacheKey);
      logger.info(`Token cleared from cache (${this.tokenCacheKey})`);
    } catch (error) {
      logger.warn(
        `Failed to clear token from Redis: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Force token refresh by clearing current token
   */
  invalidate(): void {
    this.accessToken = '';
    this.tokenExpiry = 0;
  }
}
