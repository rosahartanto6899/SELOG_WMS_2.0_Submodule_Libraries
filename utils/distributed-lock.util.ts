import logger from '@/shared-libs/utils/logger.util';
import { RedisCache } from '@/integrations/thrid-party/redis.third';
import { randomBytes } from 'node:crypto';

/**
 * Distributed Lock Utility
 *
 * Provides Redis-based distributed locking mechanism for coordinating
 * operations across multiple Kubernetes replicas.
 *
 * Features:
 * - Atomic lock acquisition using Redis SET NX
 * - Auto-expiring locks to prevent deadlocks
 * - Ownership verification for safe lock release
 * - Retry mechanism with configurable backoff
 */
export class DistributedLock {
  private readonly lockTtl: number;
  private readonly retryDelay: number;
  private readonly maxRetries: number;

  /**
   * @param {number} lockTtl - Lock time-to-live in seconds (default: 30)
   * @param {number} retryDelay - Delay between retries in milliseconds (default: 100)
   * @param {number} maxRetries - Maximum retry attempts (default: 50)
   */
  constructor(lockTtl = 30, retryDelay = 100, maxRetries = 50) {
    this.lockTtl = lockTtl;
    this.retryDelay = retryDelay;
    this.maxRetries = maxRetries;
  }

  /**
   * Acquire distributed lock using Redis
   * @param {string} lockKey - The lock key to acquire
   * @returns {Promise<string>} Lock identifier for releasing the lock
   * @throws {Error} When lock cannot be acquired
   */
  async acquire(lockKey: string): Promise<string> {
    // Use a cryptographically-secure random identifier instead of Math.random()
    // Format: <timestamp>-<hex-random>
    const lockId = `${Date.now()}-${randomBytes(16).toString('hex')}`;
    const redis = RedisCache.getInstance();

    // Use SET NX (set if not exists) with expiry for atomic lock acquisition
    const result = await redis.set(lockKey, lockId, 'EX', this.lockTtl, 'NX');

    if (result === 'OK') {
      logger.info(`Acquired distributed lock: ${lockKey}`);
      return lockId;
    }

    throw new Error('Failed to acquire lock');
  }

  /**
   * Release distributed lock
   * Uses Lua script to atomically verify ownership and delete
   * @param {string} lockKey - The lock key to release
   * @param {string} lockId - Lock identifier to verify ownership
   */
  async release(lockKey: string, lockId: string): Promise<void> {
    const redis = RedisCache.getInstance();

    // Lua script to atomically check and delete the lock only if we own it
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      await redis.eval(luaScript, 1, lockKey, lockId);
      logger.info(`Released distributed lock: ${lockKey}`);
    } catch (error) {
      logger.warn(
        `Failed to release lock ${lockKey}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Handle retry delay between lock acquisition attempts
   * @private
   */
  private async _delayRetry(attempt: number): Promise<void> {
    logger.info(
      `Lock held by another instance, retrying in ${
        this.retryDelay
      }ms (attempt ${attempt + 1}/${this.maxRetries})`
    );
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
  }

  /**
   * Execute short-circuit check to determine if lock is still needed
   * @private
   */
  private async _executeShortCircuitCheck(
    shortCircuitCheck: () => Promise<boolean>,
    attempt: number
  ): Promise<void> {
    try {
      const shouldSkip = await shortCircuitCheck();
      if (shouldSkip) {
        throw new Error('LOCK_NO_LONGER_NEEDED');
      }
    } catch (err) {
      // If it's the special LOCK_NO_LONGER_NEEDED error, re-throw it
      if (err instanceof Error && err.message === 'LOCK_NO_LONGER_NEEDED') {
        throw err;
      }
      // Otherwise, log and continue retrying
      logger.warn(
        `shortCircuitCheck failed on attempt ${attempt + 1}: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Handle lock acquisition failure on last attempt
   * @private
   */
  private _handleMaxRetriesReached(lockError: unknown): never {
    logger.error(
      `Failed to acquire lock after maximum retries: ${
        lockError instanceof Error ? lockError.message : 'Unknown error'
      }`
    );
    throw new Error('Unable to acquire lock after maximum retries');
  }

  /**
   * Attempt to acquire lock with retry mechanism
   * @param {string} lockKey - The lock key to acquire
   * @param {() => Promise<boolean>} shortCircuitCheck - Optional function to check if lock is still needed
   * @returns {Promise<string>} Lock identifier
   * @throws {Error} When lock cannot be acquired after max retries
   */
  async acquireWithRetry(
    lockKey: string,
    shortCircuitCheck?: () => Promise<boolean>
  ): Promise<string> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const lockId = await this.acquire(lockKey);
        return lockId;
      } catch (lockError) {
        const isLastAttempt = attempt === this.maxRetries - 1;

        if (isLastAttempt) {
          this._handleMaxRetriesReached(lockError);
        }

        await this._delayRetry(attempt);

        if (shortCircuitCheck) {
          await this._executeShortCircuitCheck(shortCircuitCheck, attempt);
        }
      }
    }

    throw new Error('Unable to acquire lock after maximum retries');
  }

  /**
   * Execute a function with distributed lock protection
   * Automatically acquires and releases lock
   * @param {string} lockKey - The lock key to use
   * @param {() => Promise<T>} fn - Function to execute while holding the lock
   * @param {() => Promise<boolean>} preCheck - Optional check before acquiring lock
   * @returns {Promise<T>} Result of the executed function
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    preCheck?: () => Promise<T | null>
  ): Promise<T> {
    // Check if lock is needed before acquiring
    if (preCheck) {
      const preCheckResult = await preCheck();
      if (preCheckResult !== null) {
        logger.info('Pre-check successful, skipping lock acquisition');
        return preCheckResult;
      }
    }

    let lockId: string | null = null;

    try {
      // Acquire lock with retry
      lockId = await this.acquireWithRetry(lockKey);

      // Execute the protected function
      const result = await fn();

      return result;
    } finally {
      // Always release lock
      if (lockId) {
        await this.release(lockKey, lockId);
      }
    }
  }
}
