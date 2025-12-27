/**
 * Rate Limiting Implementation
 * Task 0243: Enhance rate limiting with predefined configurations
 *
 * Sliding window rate limiter with configurable limits per endpoint type
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from '../api/errors';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  booking: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  availability: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  waitlist: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
  admin: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  webhook: { maxRequests: 500, windowMs: 60 * 1000 }, // 500 per minute
  default: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute
};

// In-memory store for development
// In production, use Redis or similar distributed cache
const requestCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to generic identifier
  return 'unknown';
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS = 'default'
): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default;
  const clientId = getClientId(request);
  const key = `${limitType}:${clientId}`;

  const now = Date.now();
  const record = requestCounts.get(key);

  // No record or window expired - create new record
  if (!record || now >= record.resetAt) {
    const resetAt = now + config.windowMs;
    requestCounts.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Within window - check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  requestCounts.set(key, record);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  limitType: keyof typeof RATE_LIMITS = 'default'
) {
  return (handler: T): T => {
    return (async (request: NextRequest, ...args: any[]) => {
      const rateLimit = checkRateLimit(request, limitType);

      // Create response (either from handler or rate limit error)
      let response: NextResponse;

      if (!rateLimit.allowed) {
        const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);

        // Log rate limit hit
        console.warn(`Rate limit exceeded for ${limitType}:`, {
          clientId: getClientId(request),
          endpoint: request.url,
        });

        response = NextResponse.json(
          new ApiError(
            ApiErrorCode.RATE_LIMIT_EXCEEDED,
            'Too many requests. Please try again later.',
            429,
            { retryAfter }
          ).toJSON(),
          { status: 429 }
        );

        // Add Retry-After header
        response.headers.set('Retry-After', String(retryAfter));
      } else {
        // Call the original handler
        response = await handler(request, ...args);
      }

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));

      return response;
    }) as T;
  };
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitCache() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of requestCounts.entries()) {
    if (now >= record.resetAt) {
      requestCounts.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired rate limit entries`);
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
}
