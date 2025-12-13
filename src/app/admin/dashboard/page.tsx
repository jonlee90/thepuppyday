/**
 * Admin Dashboard Page
 * Overview of key metrics and recent activity
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';
import { DashboardClient } from './DashboardClient';
import type { Appointment, NotificationLog } from '@/types/database';
import type { DashboardStats } from '@/app/api/admin/dashboard/stats/route';

async function getDashboardData() {
  console.log('[Dashboard] Starting getDashboardData...');
  try {
    console.log('[Dashboard] Creating Supabase client...');
    const supabase = await createServerSupabaseClient();
    console.log('[Dashboard] Supabase client created');

    // Note: Admin access is already verified by the layout
    // No need to call requireAdmin() again

    // Get today's date range in business timezone (America/Los_Angeles)
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();
    console.log('[Dashboard] Date range:', { todayStart, todayEnd });

    // Fetch all data in parallel
    const [
      revenueResult,
      pendingResult,
      totalResult,
      completedResult,
      appointmentsResult,
      activityResult,
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

      // Today's Appointments with relations
      (supabase as any)
        .from('appointments')
        .select(`
          *,
          pet:pets (
            id,
            name,
            breed:breeds (
              id,
              name
            )
          ),
          service:services (
            id,
            name
          ),
          customer:users!customer_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd)
        .not('status', 'in', '(cancelled,no_show)')
        .order('scheduled_at', { ascending: true }),

      // Recent Activity - last 20 notifications
      (supabase as any)
        .from('notifications_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
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

    const appointments: Appointment[] = appointmentsResult.error ? [] : (appointmentsResult.data || []);
    const activity: NotificationLog[] = activityResult.error ? [] : (activityResult.data || []);

    console.log('[Dashboard] Data fetched successfully:', {
      stats,
      appointmentsCount: appointments.length,
      activityCount: activity.length,
    });

    return {
      stats,
      appointments,
      activity,
      errors: {
        stats: !!revenueResult.error || !!pendingResult.error || !!totalResult.error || !!completedResult.error,
        appointments: !!appointmentsResult.error,
        activity: !!activityResult.error,
      },
    };
  } catch (error) {
    console.error('[Dashboard] Error fetching data:', error);
    return {
      stats: null,
      appointments: [],
      activity: [],
      errors: {
        stats: true,
        appointments: true,
        activity: true,
      },
    };
  }
}

export default async function AdminDashboard() {
  const { stats, appointments, activity, errors } = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Dashboard</h1>
        <p className="mt-2 text-[#434E54]/60">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Dashboard Client Component with Realtime */}
      <DashboardClient
        initialStats={stats}
        initialAppointments={appointments}
        initialActivity={activity}
        errors={errors}
      />
    </div>
  );
}
