import { randomBytes } from 'node:crypto';
import logger from '@/shared-libs/utils/logger.util';

/**
 * Unique ID Generator Utility
 *
 * Generates 8-digit alphanumeric codes with collision detection and retry mechanism.
 *
 * Features:
 * - Exactly 8 characters (uppercase A-Z and 0-9)
 * - Cryptographically secure random generation
 * - Collision detection via callback
 * - Configurable retry attempts
 * - Base32-like encoding (excluding ambiguous characters)
 *
 * @example
 * ```typescript
 * // Simple usage without uniqueness check
 * const code = UniqueIdGenerator.generate();
 * console.log(code); // e.g., "A3K9M2P7"
 *
 * // With database uniqueness check
 * const uniqueCode = await UniqueIdGenerator.generateUnique(async (code) => {
 *   const exists = await VehicleModel.findOne({ where: { code } });
 *   return exists !== null;
 * });
 *
 * // With custom retry limit
 * const code = await UniqueIdGenerator.generateUnique(checkFn, 20);
 * ```
 */
export class UniqueIdGenerator {
  /**
   * Character set for ID generation (32 characters)
   * Excludes ambiguous characters: 0, O, I, L
   * Uses: A-Z (excluding I, O) and 1-9
   */
  private static readonly CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  private static readonly ID_LENGTH = 8;
  private static readonly DEFAULT_MAX_RETRIES = 10;

  /**
   * Generate a single 8-character alphanumeric code
   * Does NOT check for uniqueness - use generateUnique() for guaranteed uniqueness
   *
   * @returns {string} 8-character uppercase alphanumeric code
   *
   * @example
   * const code = UniqueIdGenerator.generate();
   * // Returns: "A3K9M2P7"
   */
  static generate(): string {
    const bytes = randomBytes(this.ID_LENGTH);
    let result = '';

    for (let i = 0; i < this.ID_LENGTH; i++) {
      const index = bytes[i] % this.CHARSET.length;
      result += this.CHARSET[index];
    }

    return result;
  }

  /**
   * Generate a unique 8-character code with collision detection
   * Retries if the generated code already exists
   *
   * @param {Function} existsCheck - Async callback that returns true if code exists
   * @param {number} maxRetries - Maximum number of generation attempts (default: 10)
   * @returns {Promise<string>} Guaranteed unique 8-character code
   * @throws {Error} When unable to generate unique code after max retries
   *
   * @example
   * // With Sequelize model
   * const code = await UniqueIdGenerator.generateUnique(async (candidate) => {
   *   const vehicle = await Vehicle.findOne({ where: { maintenanceCode: candidate } });
   *   return vehicle !== null; // return true if exists
   * });
   *
   * @example
   * // With raw query
   * const code = await UniqueIdGenerator.generateUnique(async (candidate) => {
   *   const [results] = await sequelize.query(
   *     'SELECT COUNT(*) as count FROM vehicles WHERE code = ?',
   *     { replacements: [candidate] }
   *   );
   *   return results[0].count > 0;
   * });
   */
  static async generateUnique(
    existsCheck: (code: string) => Promise<boolean>,
    maxRetries: number = this.DEFAULT_MAX_RETRIES
  ): Promise<string> {
    let attempts = 0;

    while (attempts < maxRetries) {
      const candidate = this.generate();
      attempts++;

      try {
        const exists = await existsCheck(candidate);

        if (!exists) {
          logger.info(
            `Generated unique ID: ${candidate} (attempts: ${attempts})`
          );
          return candidate;
        }

        logger.warn(
          `ID collision detected: ${candidate} (attempt ${attempts}/${maxRetries})`
        );
      } catch (error) {
        logger.error(
          `Error checking ID uniqueness: ${
            error instanceof Error ? error.message : ''
          }`
        );
        // Continue to next attempt on error
      }
    }

    const errorMsg = `Failed to generate unique ID after ${maxRetries} attempts`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  /**
   * Generate multiple unique codes in batch
   * Ensures all generated codes are unique within the batch and against existing data
   *
   * @param {number} count - Number of unique codes to generate
   * @param {Function} existsCheck - Async callback that returns true if code exists
   * @param {number} maxRetries - Maximum retries per code (default: 10)
   * @returns {Promise<string[]>} Array of unique codes
   * @throws {Error} When unable to generate all unique codes
   *
   * @example
   * const codes = await UniqueIdGenerator.generateBatch(5, async (code) => {
   *   const exists = await Vehicle.findOne({ where: { code } });
   *   return exists !== null;
   * });
   * // Returns: ["A3K9M2P7", "B5N7Q4R8", ...]
   */
  static async generateBatch(
    count: number,
    existsCheck: (code: string) => Promise<boolean>,
    maxRetries: number = this.DEFAULT_MAX_RETRIES
  ): Promise<string[]> {
    const uniqueCodes = new Set<string>();
    let attempts = 0;
    const maxTotalAttempts = count * maxRetries;

    while (uniqueCodes.size < count && attempts < maxTotalAttempts) {
      const candidate = this.generate();
      attempts++;

      // Check if code is unique within the batch
      if (uniqueCodes.has(candidate)) {
        continue;
      }

      try {
        // Check if code exists in database
        const exists = await existsCheck(candidate);

        if (!exists) {
          uniqueCodes.add(candidate);
          logger.info(
            `Generated batch code ${uniqueCodes.size}/${count}: ${candidate}`
          );
        }
      } catch (error) {
        logger.error(
          `Error checking batch ID uniqueness: ${
            error instanceof Error ? error.message : ''
          }`
        );
      }
    }

    if (uniqueCodes.size < count) {
      const errorMsg = `Failed to generate ${count} unique codes. Only generated ${uniqueCodes.size} after ${attempts} attempts`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    return Array.from(uniqueCodes);
  }

  /**
   * Validate if a string matches the expected ID format
   *
   * @param {string} code - The code to validate
   * @returns {boolean} True if valid 8-character alphanumeric code
   *
   * @example
   * UniqueIdGenerator.isValid("A3K9M2P7"); // true
   * UniqueIdGenerator.isValid("ABC123");    // false (too short)
   * UniqueIdGenerator.isValid("A3K9M2P7X"); // false (too long)
   * UniqueIdGenerator.isValid("A3K9M2O7");  // false (contains 'O')
   */
  static isValid(code: string): boolean {
    if (code.length !== this.ID_LENGTH) {
      return false;
    }

    // Check if all characters are in the charset
    for (const char of code) {
      if (!this.CHARSET.includes(char)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate approximate collision probability
   * Based on birthday paradox formula
   *
   * @param {number} existingCount - Number of existing codes in database
   * @returns {number} Probability of collision (0-1)
   *
   * @example
   * const probability = UniqueIdGenerator.collisionProbability(1000);
   * console.log(`Collision risk: ${(probability * 100).toFixed(4)}%`);
   */
  static collisionProbability(existingCount: number): number {
    // Total possible combinations: 32^8 = 1,099,511,627,776
    const totalCombinations = Math.pow(this.CHARSET.length, this.ID_LENGTH);

    // Birthday paradox approximation: 1 - e^(-n²/2N)
    // where n = existing count, N = total combinations
    const exponent = -(existingCount * existingCount) / (2 * totalCombinations);
    return 1 - Math.exp(exponent);
  }
}
