import crypto from 'node:crypto';
import SecretManager from './secret-manager.util';
import { InternalServerErrorException } from '@/shared-libs/exceptions';

/**
 * Token encryption utility using AES-256-GCM encryption
 * Provides secure encryption and decryption of access tokens
 */
export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Get encryption key from secret manager
   * Uses direct key derivation without salt for AES-256-GCM
   */
  private static getKey(): Buffer {
    try {
      const secret =
        SecretManager.env.JWT_SECRET ||
        'fallback-secret-key-32-characters-long';

      // For AES-256-GCM, use SHA-256 to derive a consistent 32-byte key
      // The IV provides sufficient uniqueness for each encryption
      return crypto.createHash('sha256').update(secret).digest();
    } catch (error) {
      throw new InternalServerErrorException('Failed to derive encryption key');
    }
  }

  /**
   * Encrypts an access token using AES-256-GCM
   * @param token - The JWT token to encrypt
   * @returns Encrypted token in format: iv:tag:encrypted
   */
  public static encrypt(token: string): string {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token provided for encryption');
      }

      const key = this.getKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('accessToken', 'utf8')); // Additional authenticated data

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException(
        `Token encryption failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Decrypts an encrypted access token
   * @param encryptedToken - Encrypted token in format: iv:tag:encrypted
   * @returns Decrypted JWT token
   */
  public static decrypt(encryptedToken: string): string {
    try {
      if (!encryptedToken || typeof encryptedToken !== 'string') {
        throw new Error('Invalid encrypted token provided');
      }

      const parts = encryptedToken.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const key = this.getKey();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('accessToken', 'utf8')); // Same AAD used in encryption

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException(
        `Token decryption failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Validates if a string appears to be an encrypted token
   * @param token - Token string to validate
   * @returns True if token appears to be encrypted
   */
  public static isEncryptedToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split(':');
    return (
      parts.length === 3 &&
      parts[0].length === this.IV_LENGTH * 2 && // IV in hex
      parts[1].length === this.TAG_LENGTH * 2
    ); // Auth tag in hex
  }

  /**
   * Safe decrypt that returns null on failure instead of throwing
   * @param encryptedToken - Encrypted token to decrypt
   * @returns Decrypted token or null on failure
   */
  public static safeDecrypt(encryptedToken: string): string | null {
    try {
      return this.decrypt(encryptedToken);
    } catch {
      return null;
    }
  }
}

export default TokenEncryption;
