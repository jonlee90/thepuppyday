/**
 * Dashboard Realtime Hook
 * Handles real-time updates for dashboard data
 * Falls back to polling in mock mode
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Appointment } from '@/types/database';
import type { DashboardStats } from '@/app/api/admin/dashboard/stats/route';

interface DashboardRealtimeOptions {
  onStatsUpdate?: (stats: DashboardStats) => void;
  onAppointmentsUpdate?: (appointments: Appointment[]) => void;
  pollInterval?: number; // ms, default 30000 (30 seconds)
}

export function useDashboardRealtime({
  onStatsUpdate,
  onAppointmentsUpdate,
  pollInterval = 30000,
}: DashboardRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        onStatsUpdate?.(data);
      }
    } catch (error) {
      console.error('[Dashboard Realtime] Failed to fetch stats:', error);
    }
  }, [onStatsUpdate]);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard/appointments');
      if (response.ok) {
        const data = await response.json();
        onAppointmentsUpdate?.(data);
      }
    } catch (error) {
      console.error('[Dashboard Realtime] Failed to fetch appointments:', error);
    }
  }, [onAppointmentsUpdate]);

  useEffect(() => {
    const supabase = createClient();
    let pollTimer: NodeJS.Timeout | null = null;

    // In mock mode, we use polling instead of realtime
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      setIsPolling(true);

      pollTimer = setInterval(() => {
        fetchStats();
        fetchAppointments();
      }, pollInterval);

      return () => {
        if (pollTimer) clearInterval(pollTimer);
      };
    }

    // Real Supabase Realtime subscription (for production)
    // Subscribe to appointments table for today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    // Type assertion for realtime methods (not available in mock client)
    const realtimeClient = supabase as any;

    const channel = realtimeClient
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `scheduled_at=gte.${todayStart},scheduled_at=lt.${todayEnd}`,
        },
        (payload: any) => {
          console.log('[Dashboard Realtime] Appointment change:', payload);

          // Refetch data on any change
          fetchStats();
          fetchAppointments();
        }
      )
      .subscribe((status: string) => {
        console.log('[Dashboard Realtime] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setIsPolling(false);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          // Fallback to polling if not already polling
          if (!pollTimer) {
            setIsPolling(true);
            pollTimer = setInterval(() => {
              fetchStats();
              fetchAppointments();
            }, pollInterval);
          }
        }
      });

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (realtimeClient.removeChannel) {
        realtimeClient.removeChannel(channel);
      }
    };
  }, [fetchStats, fetchAppointments, pollInterval]);

  return {
    isConnected,
    isPolling,
  };
}
