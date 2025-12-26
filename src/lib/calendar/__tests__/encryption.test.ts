/**
 * Unit tests for token encryption utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptToken, decryptToken, generateEncryptionKey, validateEncryptionConfig } from '../encryption';

describe('Token Encryption Utilities', () => {
  const originalEnv = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    // Set a valid test encryption key (32 bytes = 64 hex characters)
    process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = generateEncryptionKey();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
    }
  });

  describe('encryptToken', () => {
    it('should encrypt a token successfully', () => {
      const plaintext = 'my-secret-access-token';
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':').length).toBe(3); // iv:authTag:ciphertext
    });

    it('should produce different ciphertexts for the same plaintext (due to random IV)', () => {
      const plaintext = 'my-secret-token';
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for empty token', () => {
      expect(() => encryptToken('')).toThrow('Cannot encrypt empty token');
    });

    it('should handle special characters', () => {
      const plaintext = 'token!@#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':').length).toBe(3);
    });

    it('should handle long tokens', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encryptToken(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':').length).toBe(3);
    });

    it('should throw error if encryption key is not set', () => {
      delete process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

      expect(() => encryptToken('test')).toThrow(
        'CALENDAR_TOKEN_ENCRYPTION_KEY environment variable is not set'
      );
    });

    it('should throw error if encryption key has invalid length', () => {
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = 'invalid-short-key';

      expect(() => encryptToken('test')).toThrow('Invalid encryption key length');
    });
  });

  describe('decryptToken', () => {
    it('should decrypt a token successfully', () => {
      const plaintext = 'my-secret-refresh-token';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle round-trip encryption/decryption', () => {
      const originalToken = 'ya29.a0AfH6SMBxyz...';
      const encrypted = encryptToken(originalToken);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should throw error for empty ciphertext', () => {
      expect(() => decryptToken('')).toThrow('Cannot decrypt empty ciphertext');
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => decryptToken('invalid-format')).toThrow(
        'Invalid encrypted token format'
      );
    });

    it('should throw error for ciphertext with wrong number of parts', () => {
      expect(() => decryptToken('part1:part2')).toThrow(
        'Invalid encrypted token format'
      );
    });

    it('should throw error for corrupted IV', () => {
      const plaintext = 'test-token';
      const encrypted = encryptToken(plaintext);
      const [, authTag, ciphertext] = encrypted.split(':');
      const corrupted = `0000000000000000:${authTag}:${ciphertext}`;

      expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
    });

    it('should throw error for corrupted auth tag', () => {
      const plaintext = 'test-token';
      const encrypted = encryptToken(plaintext);
      const [iv, , ciphertext] = encrypted.split(':');
      // Create a valid-length but wrong auth tag (16 bytes = 32 hex chars)
      const corrupted = `${iv}:${'00'.repeat(16)}:${ciphertext}`;

      expect(() => decryptToken(corrupted)).toThrow('Invalid authentication tag');
    });

    it('should throw error for corrupted ciphertext', () => {
      const plaintext = 'test-token';
      const encrypted = encryptToken(plaintext);
      const [iv, authTag] = encrypted.split(':');
      const corrupted = `${iv}:${authTag}:000000000000`;

      expect(() => decryptToken(corrupted)).toThrow('Invalid authentication tag');
    });

    it('should throw error if wrong encryption key is used', () => {
      const plaintext = 'test-token';
      const encrypted = encryptToken(plaintext);

      // Change the encryption key
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = generateEncryptionKey();

      expect(() => decryptToken(encrypted)).toThrow('Invalid authentication tag');
    });

    it('should throw error if decryption key is not set', () => {
      delete process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

      // Use valid hex format to ensure we reach the encryption key check
      const validHexFormat = `${'00'.repeat(16)}:${'00'.repeat(16)}:${'00'.repeat(16)}`;

      expect(() => decryptToken(validHexFormat)).toThrow(
        'CALENDAR_TOKEN_ENCRYPTION_KEY environment variable is not set'
      );
    });

    it('should handle special characters in round-trip', () => {
      const plaintext = 'token!@#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long tokens in round-trip', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters in round-trip', () => {
      const plaintext = '你好世界 🚀 مرحبا العالم';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid 64-character hex string', () => {
      const key = generateEncryptionKey();

      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    it('should generate keys that work for encryption/decryption', () => {
      const newKey = generateEncryptionKey();
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = newKey;

      const plaintext = 'test-token-with-new-key';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('validateEncryptionConfig', () => {
    it('should not throw error when encryption is properly configured', () => {
      expect(() => validateEncryptionConfig()).not.toThrow();
    });

    it('should throw error when encryption key is not set', () => {
      delete process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;

      expect(() => validateEncryptionConfig()).toThrow(
        'Encryption configuration validation failed'
      );
    });

    it('should throw error when encryption key has invalid length', () => {
      process.env.CALENDAR_TOKEN_ENCRYPTION_KEY = 'too-short';

      expect(() => validateEncryptionConfig()).toThrow(
        'Encryption configuration validation failed'
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle multiple tokens independently', () => {
      const token1 = 'access-token-1';
      const token2 = 'refresh-token-2';

      const encrypted1 = encryptToken(token1);
      const encrypted2 = encryptToken(token2);

      expect(decryptToken(encrypted1)).toBe(token1);
      expect(decryptToken(encrypted2)).toBe(token2);
    });

    it('should maintain data integrity for realistic OAuth tokens', () => {
      const accessToken = 'ya29.a0AfH6SMBxyz123456789abcdefghijklmnopqrstuvwxyz';
      const refreshToken = '1//0gWxyz123456789abcdefghijklmnopqrstuvwxyz';

      const encryptedAccess = encryptToken(accessToken);
      const encryptedRefresh = encryptToken(refreshToken);

      expect(decryptToken(encryptedAccess)).toBe(accessToken);
      expect(decryptToken(encryptedRefresh)).toBe(refreshToken);
    });

    it('should handle rapid consecutive encryptions', () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token-${i}`);
      const encrypted = tokens.map(encryptToken);
      const decrypted = encrypted.map(decryptToken);

      expect(decrypted).toEqual(tokens);
    });
  });
});
