/**
 * Error Classifier
 * Classifies calendar sync errors as transient or permanent
 */

/**
 * Error type classification
 */
export type ErrorType = 'transient' | 'permanent';

/**
 * Classified error information
 */
export interface ClassifiedError {
  type: ErrorType;
  code: string;
  message: string;
  userMessage: string;
  httpStatus?: number;
}

/**
 * HTTP status codes that indicate transient errors (should retry)
 */
const TRANSIENT_HTTP_CODES = [
  408, // Request Timeout
  429, // Too Many Requests (Rate Limit)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * HTTP status codes that indicate permanent errors (should not retry)
 */
const PERMANENT_HTTP_CODES = [
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  409, // Conflict
  410, // Gone
  422, // Unprocessable Entity
];

/**
 * Check if an error is transient (should retry)
 *
 * Transient errors are temporary issues that might resolve on retry:
 * - Network timeouts
 * - Rate limiting (429)
 * - Server errors (500, 502, 503, 504)
 *
 * @param error - Error object (can be any type)
 * @returns True if error is transient and should be retried
 *
 * @example
 * ```typescript
 * if (isTransientError(error)) {
 *   // Add to retry queue
 *   await queueForRetry(appointmentId, operation, errorDetails);
 * } else {
 *   // Log as permanent failure
 *   console.error('Permanent sync failure:', error);
 * }
 * ```
 */
export function isTransientError(error: any): boolean {
  // Check for HTTP status in error response
  const httpStatus = extractHttpStatus(error);

  if (httpStatus) {
    return TRANSIENT_HTTP_CODES.includes(httpStatus);
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return true;
  }

  // Check for timeout errors
  if (isTimeoutError(error)) {
    return true;
  }

  // Default to permanent error for safety
  return false;
}

/**
 * Classify error and provide user-friendly message
 *
 * @param error - Error object (can be any type)
 * @returns Classified error information
 *
 * @example
 * ```typescript
 * const classified = classifyError(error);
 * console.log(`Error type: ${classified.type}, Message: ${classified.userMessage}`);
 * ```
 */
export function classifyError(error: any): ClassifiedError {
  const httpStatus = extractHttpStatus(error);
  const errorMessage = extractErrorMessage(error);
  const errorCode = extractErrorCode(error);

  // Classify by HTTP status
  if (httpStatus) {
    if (TRANSIENT_HTTP_CODES.includes(httpStatus)) {
      return {
        type: 'transient',
        code: errorCode,
        message: errorMessage,
        userMessage: getTransientErrorMessage(httpStatus),
        httpStatus,
      };
    }

    if (PERMANENT_HTTP_CODES.includes(httpStatus)) {
      return {
        type: 'permanent',
        code: errorCode,
        message: errorMessage,
        userMessage: getPermanentErrorMessage(httpStatus),
        httpStatus,
      };
    }
  }

  // Classify by error type
  if (isNetworkError(error) || isTimeoutError(error)) {
    return {
      type: 'transient',
      code: errorCode,
      message: errorMessage,
      userMessage:
        'Network connection issue. The sync will be retried automatically.',
      httpStatus,
    };
  }

  // Default to permanent error with generic message
  return {
    type: 'permanent',
    code: errorCode,
    message: errorMessage,
    userMessage:
      'An unexpected error occurred. Please check the connection settings or contact support.',
    httpStatus,
  };
}

/**
 * Extract HTTP status code from error object
 *
 * @param error - Error object
 * @returns HTTP status code or undefined
 */
function extractHttpStatus(error: any): number | undefined {
  // Check standard error response formats
  if (error?.response?.status) {
    return error.response.status;
  }

  if (error?.status) {
    return error.status;
  }

  if (error?.statusCode) {
    return error.statusCode;
  }

  // Check error code format (e.g., "HTTP_429")
  if (typeof error?.code === 'string' && error.code.startsWith('HTTP_')) {
    const status = parseInt(error.code.replace('HTTP_', ''), 10);
    if (!isNaN(status)) {
      return status;
    }
  }

  return undefined;
}

/**
 * Extract error message from error object
 *
 * @param error - Error object
 * @returns Error message
 */
function extractErrorMessage(error: any): string {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}

/**
 * Extract error code from error object
 *
 * @param error - Error object
 * @returns Error code
 */
function extractErrorCode(error: any): string {
  const httpStatus = extractHttpStatus(error);
  if (httpStatus) {
    return `HTTP_${httpStatus}`;
  }

  if (error?.code) {
    return String(error.code);
  }

  if (error?.name) {
    return error.name;
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Check if error is a network error
 *
 * @param error - Error object
 * @returns True if network error
 */
function isNetworkError(error: any): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  const code = extractErrorCode(error).toUpperCase();

  return (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset') ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'NETWORK_ERROR'
  );
}

/**
 * Check if error is a timeout error
 *
 * @param error - Error object
 * @returns True if timeout error
 */
function isTimeoutError(error: any): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  const code = extractErrorCode(error).toUpperCase();

  return (
    message.includes('timeout') ||
    message.includes('etimedout') ||
    code === 'ETIMEDOUT' ||
    code === 'TIMEOUT' ||
    code === 'REQUEST_TIMEOUT'
  );
}

/**
 * Get user-friendly message for transient errors
 *
 * @param httpStatus - HTTP status code
 * @returns User-friendly message
 */
function getTransientErrorMessage(httpStatus: number): string {
  switch (httpStatus) {
    case 408:
      return 'Request timed out. The sync will be retried automatically.';
    case 429:
      return 'Rate limit reached. The sync will be retried after a short delay.';
    case 500:
      return 'Google Calendar server error. The sync will be retried automatically.';
    case 502:
      return 'Google Calendar gateway error. The sync will be retried automatically.';
    case 503:
      return 'Google Calendar temporarily unavailable. The sync will be retried automatically.';
    case 504:
      return 'Google Calendar gateway timeout. The sync will be retried automatically.';
    default:
      return 'Temporary error occurred. The sync will be retried automatically.';
  }
}

/**
 * Get user-friendly message for permanent errors
 *
 * @param httpStatus - HTTP status code
 * @returns User-friendly message
 */
function getPermanentErrorMessage(httpStatus: number): string {
  switch (httpStatus) {
    case 400:
      return 'Invalid request data. Please check the appointment details.';
    case 401:
      return 'Authentication failed. Please reconnect your Google Calendar.';
    case 403:
      return 'Permission denied. Please check calendar access permissions.';
    case 404:
      return 'Calendar or event not found. Please verify the calendar connection.';
    case 405:
      return 'Operation not allowed. Please contact support.';
    case 409:
      return 'Conflict detected. The event may have been modified externally.';
    case 410:
      return 'Event no longer exists. It may have been deleted from Google Calendar.';
    case 422:
      return 'Invalid data format. Please check the appointment details.';
    default:
      return 'Unable to sync. Please check the connection settings or contact support.';
  }
}
