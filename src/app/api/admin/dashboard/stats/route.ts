/**
 * Admin Dashboard Stats API Route
 * Returns aggregated statistics for today's dashboard
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';

export interface DashboardStats {
  todayRevenue: number | null;
  pendingConfirmations: number | null;
  totalAppointments: number | null;
  completedAppointments: number | null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Get today's date range in business timezone (America/Los_Angeles)
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    // Fetch all data in parallel
    const [
      revenueResult,
      pendingResult,
      totalResult,
      completedResult,
    ] = await Promise.all([
      // Today's Revenue - sum of completed payments
      (supabase as any)
        .from('payments')
        .select('amount, tip_amount')
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)
        .eq('status', 'succeeded'),

      // Pending Confirmations - appointments awaiting confirmation
      (supabase as any)
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd)
        .eq('status', 'pending'),

      // Total Appointments - all appointments today (excluding cancelled/no_show)
      (supabase as any)
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd)
        .not('status', 'in', '(cancelled,no_show)'),

      // Completed Appointments
      (supabase as any)
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd)
        .eq('status', 'completed'),
    ]);

    // Calculate today's revenue
    let todayRevenue: number | null = null;
    if (!revenueResult.error && revenueResult.data) {
      todayRevenue = revenueResult.data.reduce((sum: number, payment: any) => {
        const amount = typeof payment.amount === 'number' ? payment.amount : 0;
        const tip = typeof payment.tip_amount === 'number' ? payment.tip_amount : 0;
        return sum + amount + tip;
      }, 0);
    }

    const stats: DashboardStats = {
      todayRevenue,
      pendingConfirmations: pendingResult.error ? null : (pendingResult.count ?? 0),
      totalAppointments: totalResult.error ? null : (totalResult.count ?? 0),
      completedAppointments: completedResult.error ? null : (completedResult.count ?? 0),
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
