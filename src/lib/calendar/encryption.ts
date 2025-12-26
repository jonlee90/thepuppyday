/**
 * Token Encryption Utilities
 * Provides AES-256-GCM encryption for OAuth tokens
 */

import crypto from 'crypto';

// AES-256-GCM constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * @throws Error if encryption key is not configured
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'CALENDAR_TOKEN_ENCRYPTION_KEY environment variable is not set. ' +
      'Please configure a 32-byte (256-bit) encryption key.'
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid encryption key length. Expected ${KEY_LENGTH} bytes (64 hex characters), ` +
      `got ${keyBuffer.length} bytes.`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * @param plaintext - Token to encrypt
 * @returns Encrypted token in format: iv:authTag:ciphertext (all hex-encoded)
 *
 * @example
 * ```typescript
 * const encrypted = encryptToken('my-secret-token');
 * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 * ```
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  try {
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Get encryption key
    const key = getEncryptionKey();

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    // Never log the plaintext token in error messages
    throw new Error(
      `Token encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypt a token using AES-256-GCM
 *
 * @param ciphertext - Encrypted token in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext token
 *
 * @throws Error if decryption fails (wrong key, corrupted data, invalid format)
 *
 * @example
 * ```typescript
 * const decrypted = decryptToken('a1b2c3d4....:e5f6g7h8....:i9j0k1l2....');
 * // Returns: "my-secret-token"
 * ```
 */
export function decryptToken(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty ciphertext');
  }

  try {
    // Parse encrypted token format: iv:authTag:ciphertext
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted token format. Expected format: iv:authTag:ciphertext'
      );
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Convert hex strings to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Validate buffer lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length} bytes`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length} bytes`);
    }

    // Get encryption key
    const key = getEncryptionKey();

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the ciphertext
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    // Never log the ciphertext in error messages (it may contain sensitive data)
    if (error instanceof Error) {
      // Provide helpful error messages without exposing data
      if (error.message.includes('Unsupported state or unable to authenticate data')) {
        throw new Error('Token decryption failed: Invalid authentication tag (data may be corrupted or key is wrong)');
      }
      if (error.message.includes('Invalid encrypted token format')) {
        throw error; // Re-throw format errors as-is
      }
    }
    throw new Error(
      `Token decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a new random encryption key
 * This is a utility function for setting up the encryption key
 *
 * @returns 32-byte (256-bit) key as hex string
 *
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * console.log(`CALENDAR_TOKEN_ENCRYPTION_KEY=${key}`);
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Validate that encryption is properly configured
 *
 * @throws Error if encryption is not properly configured
 */
export function validateEncryptionConfig(): void {
  try {
    getEncryptionKey();
  } catch (error) {
    throw new Error(
      'Encryption configuration validation failed: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
