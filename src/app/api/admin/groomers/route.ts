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

    // Fetch users with admin or groomer roles
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
