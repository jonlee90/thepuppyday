/**
 * Dashboard Client Component
 * Handles client-side realtime updates for dashboard data
 */

'use client';

import { useState, useCallback } from 'react';
import { DashboardStats } from '@/components/admin/dashboard/DashboardStats';
import { TodayAppointments } from '@/components/admin/dashboard/TodayAppointments';
import { PendingAppointments } from '@/components/admin/dashboard/PendingAppointments';
import { DashboardWalkInButton } from '@/components/admin/dashboard/DashboardWalkInButton';
import { useDashboardRealtime } from '@/hooks/admin/use-dashboard-realtime';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import type { DashboardStats as StatsData } from '@/app/api/admin/dashboard/stats/route';

type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

interface DashboardClientProps {
  initialStats: StatsData | null;
  initialAppointments: Appointment[];
  initialPendingAppointments: Appointment[];
  errors?: {
    stats: boolean;
    appointments: boolean;
    pendingAppointments: boolean;
  };
}

export function DashboardClient({
  initialStats,
  initialAppointments,
  initialPendingAppointments,
  errors,
}: DashboardClientProps) {
  const [stats, setStats] = useState<StatsData | null>(initialStats);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>(initialPendingAppointments);
  const [hasInitialErrors, setHasInitialErrors] = useState(
    errors?.stats || errors?.appointments || errors?.pendingAppointments
  );

  const handleStatsUpdate = useCallback((newStats: StatsData) => {
    setStats(newStats);
  }, []);

  const handleAppointmentsUpdate = useCallback((newAppointments: Appointment[]) => {
    setAppointments(newAppointments);
  }, []);

  const { isConnected, isPolling } = useDashboardRealtime({
    onStatsUpdate: handleStatsUpdate,
    onAppointmentsUpdate: handleAppointmentsUpdate,
    pollInterval: 30000, // 30 seconds
  });

  const handleRetry = async () => {
    // Manually refetch stats
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to retry stats fetch:', error);
    }
  };

  return (
    <>
      {/* Walk-In Button (FAB on mobile, inline on desktop) - Uses booking modal */}
      <DashboardWalkInButton />

      {/* Initial Load Error Banner */}
      {hasInitialErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Some data failed to load during initial page load
            </p>
            <p className="text-xs text-red-600 mt-1">
              {errors?.stats && 'Statistics unavailable. '}
              {errors?.appointments && 'Appointments list unavailable. '}
              {errors?.pendingAppointments && 'Pending appointments unavailable. '}
              Try refreshing the page.
            </p>
          </div>
        </div>
      )}

      {/* Connection Status Banner */}
      {!isConnected && isPolling && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Connection lost - using fallback polling
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Data will refresh every 30 seconds
            </p>
          </div>
        </div>
      )}

      {isConnected && process.env.NEXT_PUBLIC_USE_MOCKS !== 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">Real-time updates active</p>
        </div>
      )}

      {/* Stats Grid */}
      <DashboardStats initialStats={stats} onRetry={handleRetry} />

      {/* Appointments Grid - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <TodayAppointments initialAppointments={appointments} />

        {/* Pending Appointments */}
        <PendingAppointments initialAppointments={pendingAppointments} />
      </div>
    </>
  );
}
