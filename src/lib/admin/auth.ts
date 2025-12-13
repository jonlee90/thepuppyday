/**
 * Admin authentication helper functions
 * Used by middleware and server components to verify admin/staff access
 */

import type { User, UserRole } from '@/types/database';
import type { AppSupabaseClient } from '@/lib/supabase/server';

/**
 * Check if user has admin or staff role
 */
export function isAdminOrStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'groomer';
}

/**
 * Check if user has owner/admin role (full access)
 */
export function isOwner(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user has staff/groomer role (limited access)
 */
export function isStaff(role: UserRole): boolean {
  return role === 'groomer';
}

/**
 * Get authenticated user with role verification
 * Returns null if not authenticated or not admin/staff
 */
export async function getAuthenticatedAdmin(
  supabase: AppSupabaseClient
): Promise<{ user: User; role: UserRole } | null> {
  try {
    // Get current session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[Admin Auth] Auth user result:', {
      hasUser: !!authUser,
      userId: authUser?.id,
      authError: authError?.message
    });

    if (authError || !authUser) {
      console.log('[Admin Auth] No authenticated user found');
      return null;
    }

    // Fetch user data from database to get role
    // Type assertion is safe here as we're querying the users table
    const { data: userData, error: userError } = (await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()) as { data: User | null; error: Error | null };

    console.log('[Admin Auth] User data result:', {
      hasData: !!userData,
      role: userData?.role,
      email: userData?.email,
      userError: userError?.message
    });

    if (userError || !userData) {
      console.log('[Admin Auth] Failed to fetch user data');
      return null;
    }

    const user = userData as User;

    // Verify user has admin or staff role
    if (!isAdminOrStaff(user.role)) {
      console.log('[Admin Auth] User does not have admin/staff role:', user.role);
      return null;
    }

    console.log('[Admin Auth] Admin access granted for:', user.email, 'role:', user.role);
    return { user, role: user.role };
  } catch (error) {
    console.error('[Admin Auth] Error getting authenticated admin:', error);
    return null;
  }
}

/**
 * Verify admin access for API routes
 * Throws error if not authenticated or not admin/staff
 */
export async function requireAdmin(
  supabase: AppSupabaseClient
): Promise<{ user: User; role: UserRole }> {
  const result = await getAuthenticatedAdmin(supabase);

  if (!result) {
    throw new Error('Unauthorized: Admin or staff access required');
  }

  return result;
}

/**
 * Verify owner access for sensitive operations
 * Throws error if not authenticated or not owner/admin
 */
export async function requireOwner(
  supabase: AppSupabaseClient
): Promise<{ user: User; role: UserRole }> {
  const result = await getAuthenticatedAdmin(supabase);

  if (!result || !isOwner(result.role)) {
    throw new Error('Unauthorized: Owner access required');
  }

  return result;
}
