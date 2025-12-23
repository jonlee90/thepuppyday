/**
 * Users API Route
 * GET /api/admin/users - Get users by role
 * Used by components like GroomerSelector to fetch staff members
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { User } from '@/types/database';

interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
}

/**
 * GET - List users filtered by role
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Build query
    let query = (supabase as any).from('users').select('*');

    // Filter by role if specified
    if (role) {
      query = query.eq('role', role);
    }

    // Only active users
    query = query.eq('is_active', true);

    // Order by name
    query = query.order('first_name', { ascending: true });

    const { data: users, error } = await query;

    if (error) {
      console.error('[Users API] Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Format response with full_name for convenience
    const formattedUsers: UserResponse[] = (users || []).map((user: User) => ({
      id: user.id,
      full_name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
      is_active: user.is_active,
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    console.error('[Users API] GET error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
