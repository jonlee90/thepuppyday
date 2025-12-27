/**
 * CSRF Protection Middleware
 * Tasks 0241-0242: Implement CSRF protection middleware
 *
 * Validates CSRF tokens for state-changing requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from '../api/errors';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://thepuppyday.com',
  'https://www.thepuppyday.com',
];

/**
 * Validate CSRF token for state-changing requests
 */
export function validateCsrf(request: NextRequest): boolean {
  // Skip validation for safe methods
  if (SAFE_METHODS.includes(request.method)) {
    return true;
  }

  // Check Origin header first (most reliable)
  const origin = request.headers.get('origin');
  if (origin) {
    const isAllowedOrigin = ALLOWED_ORIGINS.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        const originUrl = new URL(origin);
        return (
          allowedUrl.protocol === originUrl.protocol &&
          allowedUrl.host === originUrl.host
        );
      } catch {
        return false;
      }
    });

    if (isAllowedOrigin) {
      return true;
    }

    console.warn(`CSRF validation failed: Origin '${origin}' not allowed`);
    return false;
  }

  // Fall back to Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    const isAllowedReferer = ALLOWED_ORIGINS.some((allowed) => {
      try {
        return referer.startsWith(allowed);
      } catch {
        return false;
      }
    });

    if (isAllowedReferer) {
      return true;
    }

    console.warn(`CSRF validation failed: Referer '${referer}' not allowed`);
    return false;
  }

  // No Origin or Referer header - fail validation
  console.warn('CSRF validation failed: No Origin or Referer header');
  return false;
}

/**
 * Wrapper to add CSRF protection to API routes
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    // Validate CSRF for state-changing requests
    if (!SAFE_METHODS.includes(request.method)) {
      if (!validateCsrf(request)) {
        throw new ApiError(
          ApiErrorCode.CSRF_TOKEN_INVALID,
          'CSRF validation failed',
          403
        );
      }
    }

    // Call the original handler
    return await handler(request, ...args);
  }) as T;
}

/**
 * Get CSRF configuration for cookie settings
 */
export function getCsrfCookieConfig(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('strict' as const) : ('lax' as const),
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
