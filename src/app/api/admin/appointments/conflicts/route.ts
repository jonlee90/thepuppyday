/**
 * GET /api/admin/appointments/conflicts
 * Returns count of existing appointments at a given date/time for the non-blocking conflict indicator.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Missing required params: date, time' },
        { status: 400 }
      );
    }

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        status,
        customer:users!customer_id(first_name, last_name),
        service:services(name)
      `)
      .eq('scheduled_at', scheduledAt)
      .not('status', 'in', '(cancelled,no_show)');

    if (error) {
      console.error('[Conflicts API] Query error:', error);
      return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appointments = (data || []).map((apt: any) => ({
      id: apt.id,
      customer_name: apt.customer
        ? `${apt.customer.first_name} ${apt.customer.last_name}`
        : 'Unknown',
      service_name: apt.service?.name || 'Unknown',
      status: apt.status,
    }));

    return NextResponse.json({ count: appointments.length, appointments });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Conflicts API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
