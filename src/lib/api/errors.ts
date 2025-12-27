/**
 * API Error Response Standardization
 * Task 0249: Create API error response standardization utilities
 *
 * Provides consistent error handling across all API routes
 */

export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business Logic
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  CANCELLATION_WINDOW_EXPIRED = 'CANCELLATION_WINDOW_EXPIRED',
  INSUFFICIENT_LOYALTY_POINTS = 'INSUFFICIENT_LOYALTY_POINTS',
  WAITLIST_FULL = 'WAITLIST_FULL',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Payment
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Security
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    field?: string; // For validation errors
    timestamp: string;
  };
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly field?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
    field?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        field: this.field,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Maps error codes to HTTP status codes
 */
export function getStatusCodeForError(code: ApiErrorCode): number {
  const statusCodeMap: Record<ApiErrorCode, number> = {
    // 401 Unauthorized
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.INVALID_CREDENTIALS]: 401,
    [ApiErrorCode.SESSION_EXPIRED]: 401,
    [ApiErrorCode.EMAIL_NOT_VERIFIED]: 401,

    // 403 Forbidden
    [ApiErrorCode.FORBIDDEN]: 403,

    // 404 Not Found
    [ApiErrorCode.NOT_FOUND]: 404,

    // 409 Conflict
    [ApiErrorCode.ALREADY_EXISTS]: 409,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.BOOKING_CONFLICT]: 409,
    [ApiErrorCode.SLOT_UNAVAILABLE]: 409,

    // 400 Bad Request
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.INVALID_INPUT]: 400,
    [ApiErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ApiErrorCode.INVALID_FILE_TYPE]: 400,
    [ApiErrorCode.FILE_TOO_LARGE]: 400,
    [ApiErrorCode.CANCELLATION_WINDOW_EXPIRED]: 400,
    [ApiErrorCode.INSUFFICIENT_LOYALTY_POINTS]: 400,
    [ApiErrorCode.WAITLIST_FULL]: 400,
    [ApiErrorCode.CSRF_TOKEN_INVALID]: 400,
    [ApiErrorCode.CSRF_TOKEN_MISSING]: 400,

    // 402 Payment Required
    [ApiErrorCode.PAYMENT_REQUIRED]: 402,

    // 429 Too Many Requests
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ApiErrorCode.TOO_MANY_REQUESTS]: 429,

    // 402 Payment Required / 400 Bad Request
    [ApiErrorCode.PAYMENT_FAILED]: 400,
    [ApiErrorCode.INVALID_PAYMENT_METHOD]: 400,

    // 500 Internal Server Error
    [ApiErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ApiErrorCode.DATABASE_ERROR]: 500,
    [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 500,

    // 503 Service Unavailable
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
  };

  return statusCodeMap[code] || 500;
}

/**
 * Formats error response for API routes
 */
export function formatErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  field?: string
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      field,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Common error factories
 */
export const ErrorFactories = {
  unauthorized: (message = 'Unauthorized') =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Forbidden') =>
    new ApiError(ApiErrorCode.FORBIDDEN, message, 403),

  notFound: (resource: string, id?: string) =>
    new ApiError(
      ApiErrorCode.NOT_FOUND,
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404
    ),

  validationError: (message: string, field?: string, details?: Record<string, unknown>) =>
    new ApiError(ApiErrorCode.VALIDATION_ERROR, message, 400, details, field),

  conflict: (message: string) =>
    new ApiError(ApiErrorCode.CONFLICT, message, 409),

  rateLimitExceeded: (retryAfter?: number) =>
    new ApiError(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      429,
      retryAfter ? { retryAfter } : undefined
    ),

  internalError: (message = 'Internal server error') =>
    new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, message, 500),

  slotUnavailable: (date: string, time: string) =>
    new ApiError(
      ApiErrorCode.SLOT_UNAVAILABLE,
      `The selected time slot is no longer available`,
      409,
      { date, time }
    ),
};
