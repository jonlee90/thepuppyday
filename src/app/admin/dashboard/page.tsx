/**
 * Admin Dashboard Page
 * Overview of key metrics and recent activity
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';
import { DashboardClient } from './DashboardClient';
import type { Appointment } from '@/types/database';
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
      appointmentsResult,
      pendingAppointmentsResult,
    ] = await Promise.all([
      // Revenue calculations - appointments scheduled today with pricing
      (supabase as any)
        .from('appointments')
        .select('id, status, total_price')
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd)
        .not('status', 'in', '(cancelled,no_show)'),

      // Today's Appointments with relations
      (supabase as any)
        .from('appointments')
        .select(`
          *,
          pet:pets (
            id,
            name,
            size,
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

      // Pending Appointments (all dates)
      (supabase as any)
        .from('appointments')
        .select(`
          *,
          pet:pets (
            id,
            name,
            size,
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
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true }),
    ]);

    // Calculate revenue metrics
    let completedRevenue: number | null = null;
    let pendingRevenue: number | null = null;
    let estimatedRevenue: number | null = null;

    if (!revenueResult.error && revenueResult.data) {
      const appointments = revenueResult.data;

      completedRevenue = appointments
        .filter((apt: any) => apt.status === 'completed')
        .reduce((sum: number, apt: any) => sum + (apt.total_price || 0), 0);

      pendingRevenue = appointments
        .filter((apt: any) =>
          apt.status === 'pending' ||
          apt.status === 'confirmed' ||
          apt.status === 'checked_in' ||
          apt.status === 'in_progress'
        )
        .reduce((sum: number, apt: any) => sum + (apt.total_price || 0), 0);

      estimatedRevenue = completedRevenue + pendingRevenue;
    }

    const stats: DashboardStats = {
      completedRevenue,
      pendingRevenue,
      estimatedRevenue,
    };

    const appointments: Appointment[] = appointmentsResult.error ? [] : (appointmentsResult.data || []);
    const pendingAppointments: Appointment[] = pendingAppointmentsResult.error ? [] : (pendingAppointmentsResult.data || []);

    console.log('[Dashboard] Data fetched successfully:', {
      stats,
      appointmentsCount: appointments.length,
      pendingAppointmentsCount: pendingAppointments.length,
    });

    return {
      stats,
      appointments,
      pendingAppointments,
      errors: {
        stats: !!revenueResult.error,
        appointments: !!appointmentsResult.error,
        pendingAppointments: !!pendingAppointmentsResult.error,
      },
    };
  } catch (error) {
    console.error('[Dashboard] Error fetching data:', error);
    return {
      stats: null,
      appointments: [],
      pendingAppointments: [],
      errors: {
        stats: true,
        appointments: true,
        pendingAppointments: true,
      },
    };
  }
}

export default async function AdminDashboard() {
  const { stats, appointments, pendingAppointments, errors } = await getDashboardData();

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
        initialPendingAppointments={pendingAppointments}
        errors={errors}
      />
    </div>
  );
}
