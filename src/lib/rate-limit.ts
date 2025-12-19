/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Current count of requests in the window
   */
  currentCount: number;

  /**
   * Maximum allowed requests
   */
  limit: number;

  /**
   * Time when the rate limit resets (Unix timestamp)
   */
  resetTime: number;
}

/**
 * Check if a request is within rate limits
 * @param key - Unique identifier for the rate limit (e.g., IP address)
 * @param options - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or expired entry - create new
  if (!entry || now > entry.resetTime) {
    const resetTime = now + options.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });

    return {
      allowed: 1 <= options.limit,
      currentCount: 1,
      limit: options.limit,
      resetTime,
    };
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= options.limit;

  return {
    allowed,
    currentCount: entry.count,
    limit: options.limit,
    resetTime: entry.resetTime,
  };
}

/**
 * Extract IP address from Next.js request
 * Checks x-forwarded-for header (for proxies) and x-real-ip header
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check x-forwarded-for (may contain multiple IPs, take first)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  // Check x-real-ip
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to "unknown" (should not happen in production)
  return 'unknown';
}

/**
 * Reset the rate limit store (for testing only)
 * @internal
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
