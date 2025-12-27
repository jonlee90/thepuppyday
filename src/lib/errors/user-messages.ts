/**
 * User-Friendly Error Messages
 * Task 0253: Create user-friendly error message mapping
 *
 * Translates technical errors into user-friendly messages
 */

import { ApiErrorCode } from '../api/errors';

/**
 * User-friendly error messages for each error code
 */
export const errorMessages: Record<ApiErrorCode, string> = {
  // Authentication & Authorization
  [ApiErrorCode.UNAUTHORIZED]:
    'You need to be logged in to access this. Please log in and try again.',
  [ApiErrorCode.FORBIDDEN]:
    "You don't have permission to perform this action.",
  [ApiErrorCode.INVALID_CREDENTIALS]:
    'The email or password you entered is incorrect. Please try again.',
  [ApiErrorCode.SESSION_EXPIRED]:
    'Your session has expired. Please log in again to continue.',
  [ApiErrorCode.EMAIL_NOT_VERIFIED]:
    'Please verify your email address before continuing. Check your inbox for the verification link.',

  // Validation
  [ApiErrorCode.VALIDATION_ERROR]:
    'Some of the information you entered is invalid. Please check and try again.',
  [ApiErrorCode.INVALID_INPUT]:
    'The information you provided is invalid. Please check your input.',
  [ApiErrorCode.MISSING_REQUIRED_FIELD]:
    'Please fill in all required fields.',
  [ApiErrorCode.INVALID_FILE_TYPE]:
    'This file type is not supported. Please upload a JPG, PNG, or WebP image.',
  [ApiErrorCode.FILE_TOO_LARGE]:
    'The file you selected is too large. Please choose a smaller file (max 5MB).',

  // Resources
  [ApiErrorCode.NOT_FOUND]:
    "We couldn't find what you're looking for. It may have been moved or deleted.",
  [ApiErrorCode.ALREADY_EXISTS]:
    'This already exists. Please try a different value.',
  [ApiErrorCode.CONFLICT]:
    'There was a conflict with your request. Please refresh and try again.',

  // Business Logic
  [ApiErrorCode.SLOT_UNAVAILABLE]:
    "Sorry, this time slot just became unavailable. Let's find you another time!",
  [ApiErrorCode.BOOKING_CONFLICT]:
    'You already have an appointment at this time. Please choose a different slot.',
  [ApiErrorCode.CANCELLATION_WINDOW_EXPIRED]:
    'This appointment is within 24 hours and cannot be cancelled online. Please call us at (657) 252-2903.',
  [ApiErrorCode.INSUFFICIENT_LOYALTY_POINTS]:
    "You don't have enough loyalty points for this reward. Keep grooming to earn more!",
  [ApiErrorCode.WAITLIST_FULL]:
    'The waitlist for this day is currently full. Please try booking for a different date.',

  // Rate Limiting
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]:
    "Whoa, slow down! You're making too many requests. Please wait a moment and try again.",
  [ApiErrorCode.TOO_MANY_REQUESTS]:
    'Too many requests. Please wait a few minutes before trying again.',

  // Payment
  [ApiErrorCode.PAYMENT_FAILED]:
    'Your payment could not be processed. Please check your payment information and try again.',
  [ApiErrorCode.PAYMENT_REQUIRED]:
    'Payment is required to complete this action.',
  [ApiErrorCode.INVALID_PAYMENT_METHOD]:
    'The payment method is invalid. Please update your payment information.',

  // Server Errors
  [ApiErrorCode.INTERNAL_SERVER_ERROR]:
    "Something went wrong on our end. We've been notified and are working to fix it.",
  [ApiErrorCode.DATABASE_ERROR]:
    "We're having trouble accessing our database. Please try again in a few moments.",
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]:
    "We're experiencing issues with one of our services. Please try again shortly.",
  [ApiErrorCode.SERVICE_UNAVAILABLE]:
    "We're temporarily down for maintenance. We'll be back shortly!",

  // Security
  [ApiErrorCode.CSRF_TOKEN_INVALID]:
    'Your session security token is invalid. Please refresh the page and try again.',
  [ApiErrorCode.CSRF_TOKEN_MISSING]:
    'Missing security token. Please refresh the page.',
};

/**
 * Get user-friendly message for an error code
 */
export function getUserFriendlyMessage(
  code: ApiErrorCode,
  fallback?: string
): string {
  return errorMessages[code] || fallback || 'An unexpected error occurred. Please try again.';
}

/**
 * Get user-friendly message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // API error response
    if ('error' in error && error.error && typeof error.error === 'object') {
      const apiError = error.error as { code?: ApiErrorCode; message?: string };
      if (apiError.code) {
        return getUserFriendlyMessage(apiError.code, apiError.message);
      }
      if (apiError.message) {
        return apiError.message;
      }
    }

    // Error object
    if (error instanceof Error) {
      return error.message;
    }

    // Generic object with message
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Field-specific error messages for form validation
 */
export function getFieldErrorMessage(field: string, error: string): string {
  const fieldMessages: Record<string, Record<string, string>> = {
    email: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
      taken: 'This email is already registered',
    },
    password: {
      required: 'Password is required',
      min: 'Password must be at least 8 characters',
      weak: 'Password must contain uppercase, lowercase, and a number',
      mismatch: 'Passwords do not match',
    },
    phone: {
      required: 'Phone number is required',
      invalid: 'Please enter a valid phone number',
    },
    firstName: {
      required: 'First name is required',
      min: 'First name is too short',
      max: 'First name is too long',
    },
    lastName: {
      required: 'Last name is required',
      min: 'Last name is too short',
      max: 'Last name is too long',
    },
    petName: {
      required: 'Pet name is required',
      min: 'Pet name is too short',
    },
    service: {
      required: 'Please select a service',
    },
    date: {
      required: 'Please select a date',
      past: 'Date cannot be in the past',
      invalid: 'Please select a valid date',
    },
    time: {
      required: 'Please select a time',
      unavailable: 'This time slot is not available',
    },
  };

  if (fieldMessages[field] && fieldMessages[field][error]) {
    return fieldMessages[field][error];
  }

  return error;
}

/**
 * Network error messages
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Please check your internet connection and try again.';
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message).toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return 'Please check your internet connection and try again.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'The request took too long. Please try again.';
    }

    if (message.includes('abort')) {
      return 'The request was cancelled. Please try again.';
    }
  }

  return 'A network error occurred. Please try again.';
}

/**
 * Booking-specific error messages with context
 */
export function getBookingErrorMessage(
  code: ApiErrorCode,
  context?: { date?: string; time?: string; service?: string }
): string {
  switch (code) {
    case ApiErrorCode.SLOT_UNAVAILABLE:
      if (context?.date && context?.time) {
        return `Sorry, ${context.time} on ${context.date} just became unavailable. Let's find you another time!`;
      }
      return errorMessages[code];

    case ApiErrorCode.BOOKING_CONFLICT:
      if (context?.date && context?.time) {
        return `You already have an appointment on ${context.date} at ${context.time}. Please choose a different time.`;
      }
      return errorMessages[code];

    case ApiErrorCode.WAITLIST_FULL:
      if (context?.date) {
        return `The waitlist for ${context.date} is currently full. Please try booking for a different date.`;
      }
      return errorMessages[code];

    default:
      return getUserFriendlyMessage(code);
  }
}
