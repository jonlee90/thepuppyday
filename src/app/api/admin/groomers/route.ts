/**
 * Admin API - Get Groomers
 * GET /api/admin/groomers
 * Returns all users with 'admin' or 'groomer' roles for assignment to appointments
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Require admin authentication
    await requireAdmin(supabase);

    // Mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Fetch users with admin or groomer roles
      const allUsers = store.select('users') as any[];
      const groomers = allUsers
        .filter((user: any) =>
          (user.role === 'admin' || user.role === 'groomer') && user.is_active
        )
        .map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        }))
        .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));

      return NextResponse.json({ groomers });
    }

    // Production: Fetch users with admin or groomer roles
    const { data: groomers, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .in('role', ['admin', 'groomer'])
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching groomers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch groomers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ groomers });
  } catch (error) {
    console.error('Error in GET /api/admin/groomers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
