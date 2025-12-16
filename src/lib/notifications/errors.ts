/**
 * Phase 8: Notification Error Classification System
 * Classifies errors into types for appropriate retry handling
 * Also includes retry delay calculation with exponential backoff and jitter
 */

import { ErrorType, type ClassifiedError, type RetryConfig, DEFAULT_RETRY_CONFIG } from './types';

// Re-export for convenience
export { DEFAULT_RETRY_CONFIG };

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Classify an error to determine if it should be retried
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle Error instances
  if (error instanceof Error) {
    return classifyErrorObject(error);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return classifyErrorString(error);
  }

  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    const statusCode = 'statusCode' in error
      ? Number((error as { statusCode: unknown }).statusCode)
      : undefined;

    return classifyByMessageAndStatus(message, statusCode);
  }

  // Unknown error type
  return {
    type: ErrorType.PERMANENT,
    message: 'Unknown error occurred',
    retryable: false,
  };
}

/**
 * Classify an Error object
 */
function classifyErrorObject(error: Error): ClassifiedError {
  const message = error.message;

  // Check for network errors (transient)
  if (isNetworkError(message)) {
    return {
      type: ErrorType.TRANSIENT,
      message,
      retryable: true,
      originalError: error,
    };
  }

  // Check for rate limit errors
  if (isRateLimitError(message)) {
    return {
      type: ErrorType.RATE_LIMIT,
      message,
      retryable: true,
      originalError: error,
    };
  }

  // Check for validation errors (permanent)
  if (isValidationError(message)) {
    return {
      type: ErrorType.VALIDATION,
      message,
      retryable: false,
      originalError: error,
    };
  }

  // Check if error has statusCode property
  const statusCode = 'statusCode' in error
    ? Number((error as { statusCode?: number }).statusCode)
    : undefined;

  return classifyByMessageAndStatus(message, statusCode);
}

/**
 * Classify a string error message
 */
function classifyErrorString(error: string): ClassifiedError {
  return classifyByMessageAndStatus(error, undefined);
}

/**
 * Classify based on message content and HTTP status code
 */
function classifyByMessageAndStatus(
  message: string,
  statusCode?: number
): ClassifiedError {
  // Classify by HTTP status code
  if (statusCode) {
    if (statusCode === 429) {
      return {
        type: ErrorType.RATE_LIMIT,
        message,
        retryable: true,
        statusCode,
      };
    }

    if (statusCode >= 500) {
      return {
        type: ErrorType.TRANSIENT,
        message,
        retryable: true,
        statusCode,
      };
    }

    if (statusCode >= 400 && statusCode < 500) {
      // 4xx errors are generally permanent (except 429)
      const isValidation = statusCode === 400 || statusCode === 422;
      return {
        type: isValidation ? ErrorType.VALIDATION : ErrorType.PERMANENT,
        message,
        retryable: false,
        statusCode,
      };
    }
  }

  // Classify by message content
  if (isNetworkError(message)) {
    return {
      type: ErrorType.TRANSIENT,
      message,
      retryable: true,
      statusCode,
    };
  }

  if (isRateLimitError(message)) {
    return {
      type: ErrorType.RATE_LIMIT,
      message,
      retryable: true,
      statusCode,
    };
  }

  if (isValidationError(message)) {
    return {
      type: ErrorType.VALIDATION,
      message,
      retryable: false,
      statusCode,
    };
  }

  // Default to permanent error (don't retry unknown errors)
  return {
    type: ErrorType.PERMANENT,
    message,
    retryable: false,
    statusCode,
  };
}

// ============================================================================
// ERROR DETECTION HELPERS
// ============================================================================

/**
 * Check if error is a network error (transient)
 */
function isNetworkError(message: string): boolean {
  const networkErrors = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'network',
    'timeout',
    'connection refused',
    'connection reset',
    'socket hang up',
  ];

  const lowerMessage = message.toLowerCase();
  return networkErrors.some((error) => lowerMessage.includes(error.toLowerCase()));
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(message: string): boolean {
  const rateLimitErrors = [
    'rate limit',
    'too many requests',
    '429',
    'throttled',
    'quota exceeded',
  ];

  const lowerMessage = message.toLowerCase();
  return rateLimitErrors.some((error) => lowerMessage.includes(error));
}

/**
 * Check if error is a validation error (permanent)
 */
function isValidationError(message: string): boolean {
  const validationErrors = [
    'invalid',
    'validation',
    'malformed',
    'bad request',
    'missing required',
    'format',
    'not valid',
    'unprocessable',
  ];

  const lowerMessage = message.toLowerCase();
  return validationErrors.some((error) => lowerMessage.includes(error));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an error should be retried
 */
export function shouldRetry(error: unknown): boolean {
  const classified = classifyError(error);
  return classified.retryable;
}

/**
 * Get error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'Unknown error occurred';
}

/**
 * Get error type from any error
 */
export function getErrorType(error: unknown): ErrorType {
  const classified = classifyError(error);
  return classified.type;
}

// ============================================================================
// RETRY DELAY CALCULATION
// ============================================================================

/**
 * Calculate retry delay using exponential backoff with jitter
 *
 * Formula: delay = min(baseDelay * 2^retryCount, maxDelay) * (1 ± jitterFactor)
 *
 * @param retryCount - Current retry attempt number (0-based)
 * @param config - Retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @returns Delay in seconds before next retry
 *
 * @example
 * // First retry: ~30s (30 * 2^0 * 0.7-1.3)
 * calculateRetryDelay(0) // Returns 21-39 seconds
 *
 * // Second retry: ~60s (30 * 2^1 * 0.7-1.3)
 * calculateRetryDelay(1) // Returns 42-78 seconds
 *
 * // Third retry: ~120s (30 * 2^2 * 0.7-1.3)
 * calculateRetryDelay(2) // Returns 84-156 seconds
 */
export function calculateRetryDelay(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  // Exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = config.baseDelay * Math.pow(2, retryCount);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelay);

  // Add jitter to prevent thundering herd
  // jitterFactor of 0.3 means ±30% randomness
  const jitterRange = cappedDelay * config.jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange; // Random between -jitterRange and +jitterRange

  // Final delay with jitter (ensure it's not negative)
  const finalDelay = Math.max(0, cappedDelay + jitter);

  return Math.round(finalDelay);
}

/**
 * Calculate retry timestamp (current time + delay)
 *
 * @param retryCount - Current retry attempt number
 * @param config - Retry configuration
 * @returns Date object representing when to retry
 */
export function calculateRetryTimestamp(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Date {
  const delaySeconds = calculateRetryDelay(retryCount, config);
  const retryAt = new Date();
  retryAt.setSeconds(retryAt.getSeconds() + delaySeconds);
  return retryAt;
}

/**
 * Check if maximum retries have been exceeded
 *
 * @param retryCount - Current retry count
 * @param maxRetries - Maximum number of retries allowed
 * @returns True if retry count has exceeded maximum
 */
export function hasExceededMaxRetries(
  retryCount: number,
  maxRetries: number = DEFAULT_RETRY_CONFIG.maxRetries
): boolean {
  return retryCount >= maxRetries;
}
