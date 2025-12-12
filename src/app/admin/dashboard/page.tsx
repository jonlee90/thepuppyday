/**
 * Admin Dashboard Page
 * Overview of key metrics and recent activity
 */

import { DashboardStats } from '@/components/admin/dashboard/DashboardStats';
import { TodayAppointments } from '@/components/admin/dashboard/TodayAppointments';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';
import { DashboardClient } from './DashboardClient';

async function getDashboardData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    // Fetch all data in parallel
    const [statsRes, appointmentsRes, activityRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/dashboard/stats`, {
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/admin/dashboard/appointments`, {
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/admin/dashboard/activity`, {
        cache: 'no-store',
      }),
    ]);

    const stats = statsRes.ok ? await statsRes.json() : null;
    const appointments = appointmentsRes.ok ? await appointmentsRes.json() : [];
    const activity = activityRes.ok ? await activityRes.json() : [];

    return {
      stats,
      appointments,
      activity,
      errors: {
        stats: !statsRes.ok,
        appointments: !appointmentsRes.ok,
        activity: !activityRes.ok,
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
