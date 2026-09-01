import { randomBytes } from 'crypto';

/**
 * Utility class for generating cryptographically secure One-Time Passwords (OTPs).
 *
 * Uses `crypto.randomBytes` to ensure secure random number generation,
 * suitable for authentication and verification workflows.
 *
 * @example
 * const generator = new OTPGenerator();
 * const otp = generator.generateRandomNumber(6); // e.g. "482951"
 */
export class OTPGenerator {
  private static readonly DEFAULT_LENGTH = 6;

  /**
   * Generates a cryptographically secure numeric OTP of a given digit length.
   *
   * @param {number} [length=6] - The number of digits in the OTP. Must be an integer between 1 and 10.
   * @returns {string} A numeric string of the requested length.
   * @throws {RangeError} If `length` is not an integer or is outside the range [1, 10].
   *
   * @example
   * const generator = new OTPGenerator();
   * generator.generateRandomNumber();  // default 6-digit OTP, e.g. "482951"
   * generator.generateRandomNumber(4); // 4-digit OTP, e.g. "7382"
   */
  public generateRandomNumber(
    length: number = OTPGenerator.DEFAULT_LENGTH,
  ): string {
    if (!Number.isInteger(length) || length < 1 || length > 10) {
      throw new RangeError('OTP length must be an integer between 1 and 10.');
    }

    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const range = max - min + 1;

    const randomValue = parseInt(randomBytes(4).toString('hex'), 16);
    const otp = (randomValue % range) + min;

    return otp.toString();
  }
}
