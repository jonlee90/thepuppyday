/**
 * Mock authentication helper for development mode
 */

import { NextRequest } from 'next/server';

/**
 * Get authenticated user ID from request
 * In mock mode, we'll use a header or return null
 * In production, this would check session/JWT
 */
export async function getAuthenticatedUserId(
  req: NextRequest
): Promise<string | null> {
  // Check for mock auth header
  const userId = req.headers.get('x-mock-user-id');
  if (userId) {
    return userId;
  }

  // In mock mode, return null (guest/unauthenticated)
  return null;
}

/**
 * Get user ID from request, either from auth or from request body
 * Used for endpoints that support both authenticated and guest flows
 */
export async function getUserIdFromRequest(
  req: NextRequest,
  bodyUserId?: string
): Promise<string | null> {
  const authUserId = await getAuthenticatedUserId(req);
  return authUserId || bodyUserId || null;
}
