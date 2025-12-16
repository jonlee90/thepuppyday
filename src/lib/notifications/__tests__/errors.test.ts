/**
 * Phase 8: Error Classification and Retry Logic Tests
 * Unit tests for error classification, retry delay calculation, and backoff
 */

import { describe, it, expect } from 'vitest';
import {
  classifyError,
  shouldRetry,
  getErrorMessage,
  getErrorType,
  calculateRetryDelay,
  calculateRetryTimestamp,
  hasExceededMaxRetries,
} from '../errors';
import { ErrorType, DEFAULT_RETRY_CONFIG } from '../types';

describe('Error Classification', () => {
  // ==========================================================================
  // NETWORK ERRORS (TRANSIENT)
  // ==========================================================================

  describe('network errors', () => {
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENOTFOUND',
      'network error occurred',
      'timeout exceeded',
      'connection refused',
      'connection reset by peer',
      'socket hang up',
    ];

    networkErrors.forEach((errorMsg) => {
      it(`should classify "${errorMsg}" as TRANSIENT`, () => {
        const classified = classifyError(new Error(errorMsg));

        expect(classified.type).toBe(ErrorType.TRANSIENT);
        expect(classified.retryable).toBe(true);
      });
    });
  });

  // ==========================================================================
  // RATE LIMIT ERRORS
  // ==========================================================================

  describe('rate limit errors', () => {
    const rateLimitErrors = [
      'rate limit exceeded',
      'too many requests',
      'Error 429',
      'throttled',
      'quota exceeded',
    ];

    rateLimitErrors.forEach((errorMsg) => {
      it(`should classify "${errorMsg}" as RATE_LIMIT`, () => {
        const classified = classifyError(new Error(errorMsg));

        expect(classified.type).toBe(ErrorType.RATE_LIMIT);
        expect(classified.retryable).toBe(true);
      });
    });

    it('should classify 429 status code as RATE_LIMIT', () => {
      const error = { message: 'Too many requests', statusCode: 429 };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.RATE_LIMIT);
      expect(classified.retryable).toBe(true);
      expect(classified.statusCode).toBe(429);
    });
  });

  // ==========================================================================
  // VALIDATION ERRORS (PERMANENT)
  // ==========================================================================

  describe('validation errors', () => {
    const validationErrors = [
      'invalid email address',
      'validation failed',
      'malformed request',
      'bad request',
      'missing required field',
      'format error',
      'not valid',
      'unprocessable entity',
    ];

    validationErrors.forEach((errorMsg) => {
      it(`should classify "${errorMsg}" as VALIDATION`, () => {
        const classified = classifyError(new Error(errorMsg));

        expect(classified.type).toBe(ErrorType.VALIDATION);
        expect(classified.retryable).toBe(false);
      });
    });

    it('should classify 400 status code as VALIDATION', () => {
      const error = { message: 'Bad request', statusCode: 400 };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.VALIDATION);
      expect(classified.retryable).toBe(false);
    });

    it('should classify 422 status code as VALIDATION', () => {
      const error = { message: 'Unprocessable entity', statusCode: 422 };
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.VALIDATION);
      expect(classified.retryable).toBe(false);
    });
  });

  // ==========================================================================
  // SERVER ERRORS (TRANSIENT)
  // ==========================================================================

  describe('server errors', () => {
    [500, 502, 503, 504].forEach((statusCode) => {
      it(`should classify ${statusCode} status code as TRANSIENT`, () => {
        const error = { message: 'Server error', statusCode };
        const classified = classifyError(error);

        expect(classified.type).toBe(ErrorType.TRANSIENT);
        expect(classified.retryable).toBe(true);
        expect(classified.statusCode).toBe(statusCode);
      });
    });
  });

  // ==========================================================================
  // PERMANENT ERRORS
  // ==========================================================================

  describe('permanent errors', () => {
    [401, 403, 404].forEach((statusCode) => {
      it(`should classify ${statusCode} status code as PERMANENT`, () => {
        const error = { message: 'Client error', statusCode };
        const classified = classifyError(error);

        expect(classified.type).toBe(ErrorType.PERMANENT);
        expect(classified.retryable).toBe(false);
      });
    });

    it('should classify unknown errors as PERMANENT', () => {
      const error = new Error('Unknown weird error');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.PERMANENT);
      expect(classified.retryable).toBe(false);
    });
  });

  // ==========================================================================
  // ERROR TYPE HANDLING
  // ==========================================================================

  describe('error type handling', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error');
      const classified = classifyError(error);

      expect(classified).toBeDefined();
      expect(classified.message).toBe('Test error');
    });

    it('should handle string errors', () => {
      const classified = classifyError('String error message');

      expect(classified).toBeDefined();
      expect(classified.message).toBe('String error message');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Object error' };
      const classified = classifyError(error);

      expect(classified).toBeDefined();
      expect(classified.message).toBe('Object error');
    });

    it('should handle unknown error types', () => {
      const classified = classifyError(null);

      expect(classified).toBeDefined();
      expect(classified.type).toBe(ErrorType.PERMANENT);
      expect(classified.message).toBe('Unknown error occurred');
    });
  });
});

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

describe('Utility Functions', () => {
  describe('shouldRetry', () => {
    it('should return true for transient errors', () => {
      const error = new Error('ETIMEDOUT');
      expect(shouldRetry(error)).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      const error = new Error('rate limit exceeded');
      expect(shouldRetry(error)).toBe(true);
    });

    it('should return false for validation errors', () => {
      const error = new Error('invalid email');
      expect(shouldRetry(error)).toBe(false);
    });

    it('should return false for permanent errors', () => {
      const error = new Error('unauthorized');
      expect(shouldRetry(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should get message from Error instance', () => {
      const error = new Error('Test message');
      expect(getErrorMessage(error)).toBe('Test message');
    });

    it('should get message from string', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should get message from object', () => {
      expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
    });
  });

  describe('getErrorType', () => {
    it('should get error type', () => {
      expect(getErrorType(new Error('ETIMEDOUT'))).toBe(ErrorType.TRANSIENT);
      expect(getErrorType(new Error('rate limit'))).toBe(ErrorType.RATE_LIMIT);
      expect(getErrorType(new Error('invalid'))).toBe(ErrorType.VALIDATION);
      expect(getErrorType(new Error('unknown'))).toBe(ErrorType.PERMANENT);
    });
  });
});

// ==============================================================================
// RETRY DELAY CALCULATION
// ==============================================================================

describe('Retry Delay Calculation', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate delay for first retry (attempt 0)', () => {
      const delay = calculateRetryDelay(0);

      // First retry: baseDelay * 2^0 = 30 seconds
      // With jitter (±30%): 21-39 seconds
      expect(delay).toBeGreaterThanOrEqual(21);
      expect(delay).toBeLessThanOrEqual(39);
    });

    it('should calculate delay for second retry (attempt 1)', () => {
      const delay = calculateRetryDelay(1);

      // Second retry: 30 * 2^1 = 60 seconds
      // With jitter (±30%): 42-78 seconds
      expect(delay).toBeGreaterThanOrEqual(42);
      expect(delay).toBeLessThanOrEqual(78);
    });

    it('should calculate delay for third retry (attempt 2)', () => {
      const delay = calculateRetryDelay(2);

      // Third retry: 30 * 2^2 = 120 seconds
      // With jitter (±30%): 84-156 seconds
      expect(delay).toBeGreaterThanOrEqual(84);
      expect(delay).toBeLessThanOrEqual(156);
    });

    it('should cap delay at maxDelay', () => {
      // With default config (maxDelay = 300)
      // Attempt 10: 30 * 2^10 = 30720 seconds, but capped at 300
      const delay = calculateRetryDelay(10);

      // With jitter (±30%): 210-390 seconds, but capped
      expect(delay).toBeGreaterThanOrEqual(210);
      expect(delay).toBeLessThanOrEqual(390);
    });

    it('should use custom config', () => {
      const customConfig = {
        baseDelay: 10,
        maxDelay: 100,
        maxRetries: 3,
        jitterFactor: 0.2,
      };

      const delay = calculateRetryDelay(0, customConfig);

      // First retry: 10 * 2^0 = 10 seconds
      // With jitter (±20%): 8-12 seconds
      expect(delay).toBeGreaterThanOrEqual(8);
      expect(delay).toBeLessThanOrEqual(12);
    });

    it('should never return negative delay', () => {
      for (let i = 0; i < 10; i++) {
        const delay = calculateRetryDelay(i);
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });

    it('should add randomness (jitter)', () => {
      const delays = new Set<number>();

      // Generate 20 delays - they should not all be the same due to jitter
      for (let i = 0; i < 20; i++) {
        delays.add(calculateRetryDelay(0));
      }

      // With jitter, we should get multiple different values
      expect(delays.size).toBeGreaterThan(1);
    });
  });

  describe('calculateRetryTimestamp', () => {
    it('should calculate future timestamp', () => {
      const now = new Date();
      const retryAt = calculateRetryTimestamp(0);

      expect(retryAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should add correct delay', () => {
      const now = new Date();
      const retryAt = calculateRetryTimestamp(0);

      const delayMs = retryAt.getTime() - now.getTime();
      const delaySeconds = Math.floor(delayMs / 1000);

      // Should be approximately 21-39 seconds (30 ± 30%)
      expect(delaySeconds).toBeGreaterThanOrEqual(20);
      expect(delaySeconds).toBeLessThanOrEqual(40);
    });
  });

  describe('hasExceededMaxRetries', () => {
    it('should return false when under max retries', () => {
      expect(hasExceededMaxRetries(0, 2)).toBe(false);
      expect(hasExceededMaxRetries(1, 2)).toBe(false);
    });

    it('should return true when at max retries', () => {
      expect(hasExceededMaxRetries(2, 2)).toBe(true);
    });

    it('should return true when over max retries', () => {
      expect(hasExceededMaxRetries(3, 2)).toBe(true);
      expect(hasExceededMaxRetries(10, 2)).toBe(true);
    });

    it('should use default max retries from config', () => {
      expect(hasExceededMaxRetries(0)).toBe(false);
      expect(hasExceededMaxRetries(1)).toBe(false);
      expect(hasExceededMaxRetries(2)).toBe(true); // Default is 2
    });
  });
});
