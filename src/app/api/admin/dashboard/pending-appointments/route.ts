/**
 * Admin Dashboard Pending Appointments API Route
 * Returns all pending appointments (not limited to today)
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch all pending appointments with joined data
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        pet:pets!pet_id(
          id,
          name,
          size,
          breed:breeds(name)
        ),
        service:services!service_id(
          id,
          name
        )
      `)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[Admin Dashboard Pending Appointments] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Admin Dashboard Pending Appointments] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch pending appointments' },
      { status: 500 }
    );
  }
}
