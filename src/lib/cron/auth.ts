/**
 * Cron Job Authentication Utilities
 * Provides secure authentication for Vercel cron jobs
 */

import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Validate cron secret from request headers using constant-time comparison
 * to prevent timing attacks
 *
 * @param request - The incoming Next.js request
 * @returns true if authentication is valid, false otherwise
 */
export function validateCronSecret(request: NextRequest): boolean {
  // Skip validation in development/mock mode
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron Auth] CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    console.error('[Cron Auth] No authorization header provided');
    return false;
  }

  // Support both "Bearer <token>" and just "<token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  try {
    // Use constant-time comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(token, 'utf8');
    const secretBuffer = Buffer.from(cronSecret, 'utf8');

    if (tokenBuffer.length !== secretBuffer.length) {
      console.error('[Cron Auth] Invalid token length');
      return false;
    }

    return timingSafeEqual(tokenBuffer, secretBuffer);
  } catch (error) {
    console.error('[Cron Auth] Error during token comparison:', error);
    return false;
  }
}
