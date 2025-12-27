/**
 * API Error Handler Wrapper
 * Task 0250: Create API error handler wrapper
 *
 * Wraps API routes with consistent error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ApiErrorCode, formatErrorResponse } from './errors';
import { ZodError } from 'zod';

type ApiHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with standardized error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, request);
    }
  };
}

/**
 * Centralized error handling logic
 */
function handleError(error: unknown, request: NextRequest): NextResponse {
  // Log error for monitoring
  console.error('API Error:', {
    url: request.url,
    method: request.method,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const field = err.path.join('.');
      fieldErrors[field] = err.message;
    });

    return NextResponse.json(
      formatErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Validation failed',
        { fields: fieldErrors }
      ),
      { status: 400 }
    );
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Database errors
    if (error.message.includes('violates') || error.message.includes('constraint')) {
      return NextResponse.json(
        formatErrorResponse(
          ApiErrorCode.CONFLICT,
          'A conflict occurred with existing data'
        ),
        { status: 409 }
      );
    }

    // Network/timeout errors
    if (
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return NextResponse.json(
        formatErrorResponse(
          ApiErrorCode.EXTERNAL_SERVICE_ERROR,
          'External service is temporarily unavailable'
        ),
        { status: 503 }
      );
    }
  }

  // Generic 500 error (never expose stack trace in production)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment && error instanceof Error
    ? error.message
    : 'An unexpected error occurred';

  return NextResponse.json(
    formatErrorResponse(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      errorMessage,
      isDevelopment && error instanceof Error
        ? { stack: error.stack }
        : undefined
    ),
    { status: 500 }
  );
}

/**
 * Helper to create success responses
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * Helper to create paginated responses
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
