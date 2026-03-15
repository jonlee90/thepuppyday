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

const POLL_INTERVAL_MS = 300_000; // 2 minutes

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
  // Guard to prevent concurrent fetches from overlapping triggers
  const isFetchingRef = useRef(false);
  // Track whether polling is logically active (for visibility change handler)
  const isPollingRef = useRef(false);
  // Track whether initial fetch has completed (skip loading flicker on background refetches)
  const hasLoadedRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (isFetchingRef.current) return; // Skip if already fetching
    isFetchingRef.current = true;

    try {
    // Only show loading skeletons on initial fetch, not background refetches
    if (!hasLoadedRef.current) {
      setLoading({ revenue: true, appointments: true, pending: true });
    }

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
    } finally {
      isFetchingRef.current = false;
      hasLoadedRef.current = true;
    }
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
      isPollingRef.current = true;
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
      isPollingRef.current = false;
    };

    // Visibility change handler: resume fetching immediately when tab becomes visible
    // and reset the polling timer to prevent overlap with the next scheduled poll
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Reset polling interval to prevent overlap with the immediate fetch
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        fetchAllRef.current();
        // Restart polling if it was active
        if (isPollingRef.current) {
          pollTimer = setInterval(() => {
            if (!document.hidden) {
              fetchAllRef.current();
            }
          }, POLL_INTERVAL_MS);
        }
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
            fetchAllRef.current();
          }
        )
        .subscribe((status: string) => {
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
