/**
 * Admin Dashboard Appointments API Route
 * Returns today's appointments with full details
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import type { Appointment } from '@/types/database';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Get today's date range in business timezone (America/Los_Angeles)
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    // Fetch today's appointments with joined data
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
      .gte('scheduled_at', todayStart)
      .lt('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('[Admin Dashboard Appointments] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Admin Dashboard Appointments] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
