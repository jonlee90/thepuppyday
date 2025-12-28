/**
 * Admin Dashboard Stats API Route
 * Returns aggregated statistics for today's dashboard
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';

export interface DashboardStats {
  completedRevenue: number | null;
  pendingRevenue: number | null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Get today's date range in business timezone (America/Los_Angeles)
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    // Fetch all appointments scheduled today with their pricing details
    const appointmentsResult = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        status,
        total_price
      `)
      .gte('scheduled_at', todayStart)
      .lt('scheduled_at', todayEnd)
      .not('status', 'in', '(cancelled,no_show)');

    let completedRevenue: number | null = null;
    let pendingRevenue: number | null = null;

    if (!appointmentsResult.error && appointmentsResult.data) {
      const appointments = appointmentsResult.data;

      // Completed Revenue: appointments with status = 'completed'
      completedRevenue = appointments
        .filter((apt: any) => apt.status === 'completed')
        .reduce((sum: number, apt: any) => sum + (apt.total_price || 0), 0);

      // Pending Revenue: appointments with status BEFORE 'completed'
      // (pending, confirmed, in_progress)
      pendingRevenue = appointments
        .filter((apt: any) =>
          apt.status === 'pending' ||
          apt.status === 'confirmed' ||
          apt.status === 'in_progress'
        )
        .reduce((sum: number, apt: any) => sum + (apt.total_price || 0), 0);
    }

    const stats: DashboardStats = {
      completedRevenue,
      pendingRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin Dashboard Stats] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
