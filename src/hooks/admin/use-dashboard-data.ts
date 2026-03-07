/**
 * useDashboardData Hook
 * Centralized data fetching for all dashboard widgets.
 *
 * Features:
 * - Parallel fetch of revenue, appointments, and pending-appointments via Promise.allSettled
 * - Independent loading/error state per endpoint (partial failures don't block others)
 * - 30-second polling with document.visibilityState awareness (pauses when tab hidden)
 * - Supabase realtime subscription in production (falls back to polling on failure)
 * - Manual refetch() for post-action refresh
 *
 * Replaces: use-dashboard-realtime.ts (retained for migration verification)
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/types/supabase';
import type { RevenueOverviewResponse } from '@/app/api/admin/dashboard/revenue-overview/route';

// Appointment type with joined relations (same shape returned by dashboard API routes)
type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

// Re-export for convenience
export type RevenueData = RevenueOverviewResponse;

export interface DashboardData {
  revenue: RevenueData | null;
  appointments: Appointment[];
  pendingAppointments: Appointment[];
  loading: {
    revenue: boolean;
    appointments: boolean;
    pending: boolean;
  };
  errors: {
    revenue: boolean;
    appointments: boolean;
    pending: boolean;
  };
  isConnected: boolean;
  isPolling: boolean;
  refetch: () => void;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useDashboardData(): DashboardData {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState({
    revenue: true,
    appointments: true,
    pending: true,
  });
  const [errors, setErrors] = useState({
    revenue: false,
    appointments: false,
    pending: false,
  });

  const [isConnected, setIsConnected] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  // Use a ref to avoid stale-closure issues in the polling/realtime callbacks
  const fetchAllRef = useRef<() => void>(() => {});

  const fetchAll = useCallback(async () => {
    // Set loading true for all endpoints at the start of a fetch cycle
    setLoading({ revenue: true, appointments: true, pending: true });

    const [revenueResult, appointmentsResult, pendingResult] = await Promise.allSettled([
      fetch('/api/admin/dashboard/revenue-overview').then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RevenueData>;
      }),
      fetch('/api/admin/dashboard/appointments').then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Appointment[]>;
      }),
      fetch('/api/admin/dashboard/pending-appointments').then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Appointment[]>;
      }),
    ]);

    // Handle revenue result independently
    if (revenueResult.status === 'fulfilled') {
      setRevenue(revenueResult.value);
      setErrors((prev) => ({ ...prev, revenue: false }));
    } else {
      console.error('[useDashboardData] Revenue fetch failed:', revenueResult.reason);
      setErrors((prev) => ({ ...prev, revenue: true }));
    }
    setLoading((prev) => ({ ...prev, revenue: false }));

    // Handle appointments result independently
    if (appointmentsResult.status === 'fulfilled') {
      setAppointments(appointmentsResult.value);
      setErrors((prev) => ({ ...prev, appointments: false }));
    } else {
      console.error('[useDashboardData] Appointments fetch failed:', appointmentsResult.reason);
      setErrors((prev) => ({ ...prev, appointments: true }));
    }
    setLoading((prev) => ({ ...prev, appointments: false }));

    // Handle pending result independently
    if (pendingResult.status === 'fulfilled') {
      setPendingAppointments(pendingResult.value);
      setErrors((prev) => ({ ...prev, pending: false }));
    } else {
      console.error('[useDashboardData] Pending fetch failed:', pendingResult.reason);
      setErrors((prev) => ({ ...prev, pending: true }));
    }
    setLoading((prev) => ({ ...prev, pending: false }));
  }, []);

  // Keep ref in sync so intervals/subscriptions always call the latest version
  fetchAllRef.current = fetchAll;

  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    // Initial fetch
    fetchAllRef.current();

    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // ---- Polling setup (used in mock mode and as realtime fallback) ----
    const startPolling = () => {
      if (pollTimer) return; // already polling
      setIsPolling(true);
      pollTimer = setInterval(() => {
        // Respect tab visibility — skip fetch when hidden, it will resume on show
        if (!document.hidden) {
          fetchAllRef.current();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      setIsPolling(false);
    };

    // Visibility change handler: resume fetching immediately when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isMock) {
      // Mock mode: polling only, no realtime subscription
      setIsConnected(false);
      startPolling();

      return () => {
        stopPolling();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    // ---- Production: Supabase realtime subscription ----
    const supabase = createClient();

    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    const todayStart = todayMidnight.toISOString();

    const tomorrow = new Date(todayMidnight);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    // Type assertion: realtime API not present on mock client typing
    const realtimeClient = supabase as any;

    let channel: any;
    try {
      channel = realtimeClient
        .channel('dashboard-data-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `scheduled_at=gte.${todayStart},scheduled_at=lt.${todayEnd}`,
          },
          (_payload: unknown) => {
            console.log('[useDashboardData] Appointment change detected, refetching...');
            fetchAllRef.current();
          }
        )
        .subscribe((status: string) => {
          console.log('[useDashboardData] Realtime status:', status);

          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            stopPolling(); // realtime is working, don't need polling
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            startPolling(); // fallback to polling
          }
        });
    } catch (err) {
      console.error('[useDashboardData] Failed to set up realtime subscription:', err);
      setIsConnected(false);
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (realtimeClient.removeChannel && channel) {
        realtimeClient.removeChannel(channel);
      }
    };
    // fetchAll is stable due to useCallback with no deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(() => {
    fetchAllRef.current();
  }, []);

  return {
    revenue,
    appointments,
    pendingAppointments,
    loading,
    errors,
    isConnected,
    isPolling,
    refetch,
  };
}
