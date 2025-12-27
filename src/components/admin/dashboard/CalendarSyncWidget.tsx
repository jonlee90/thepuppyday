'use client';

import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface SyncStatus {
  connected: boolean;
  sync_stats?: {
    total_synced: number;
    last_24h: number;
    failed_last_24h: number;
    last_sync_at: string | null;
  };
  health?: {
    status: 'healthy' | 'warning';
    message: string;
  };
}

export function CalendarSyncWidget() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSyncStatus = useCallback(async (isAutoRefresh = false, signal?: AbortSignal) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/calendar/sync/status', { signal });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setSyncStatus(data);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load sync data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    // Initial fetch
    fetchSyncStatus(false, abortController.signal);

    // Auto-refresh every 60 seconds, but only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSyncStatus(true, abortController.signal);
      }
    }, 60000);

    // Pause auto-refresh when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Resume - fetch immediately when tab becomes visible again
        fetchSyncStatus(true, abortController.signal);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      abortController.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSyncStatus]);

  const handleSyncAll = async () => {
    setIsSyncing(true);

    try {
      const response = await fetch('/api/admin/calendar/sync/bulk', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Sync failed');
      }

      // Refresh status after sync
      await fetchSyncStatus();

      // Show success toast
      toast.success('Calendar sync completed', {
        description: 'All appointments have been synced to Google Calendar',
      });

      // Show brief success feedback
      setTimeout(() => {
        setIsSyncing(false);
      }, 500);
    } catch (error) {
      setIsSyncing(false);
      const message = error instanceof Error ? error.message : 'Sync failed';
      toast.error('Sync failed', {
        description: message,
      });
    }
  };

  const handleRetry = () => {
    fetchSyncStatus();
  };

  // Don't render if calendar is not connected
  if (!isLoading && (!syncStatus || !syncStatus.connected)) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Calendar sync health widget"
      className="
        card bg-white
        border border-[#E5E5E5]
        shadow-md hover:shadow-lg
        transition-all duration-200
        p-6
        w-full
        max-w-[500px]
      "
    >
      {/* Loading State */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
            <div className="h-5 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-full" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-sm font-medium text-[#434E54] mb-1">
            Failed to load sync data
          </p>
          <p className="text-xs text-[#9CA3AF] mb-4">
            Please refresh the page or check your connection
          </p>
          <button onClick={handleRetry} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && syncStatus && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#434E54]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-[#434E54]">
              Calendar Sync Health
            </h3>
          </div>

          {/* Connection Status */}
          <div
            className="
              bg-green-500/10 border-l-4 border-green-600
              px-3 py-2
              rounded-lg
              flex items-center gap-2
            "
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              Connected to Google Calendar
            </span>
          </div>

          {/* Stats Grid */}
          <div
            role="group"
            aria-label="Sync statistics"
            aria-live="polite"
            aria-atomic="true"
            className={`
              grid grid-cols-1 md:grid-cols-3 gap-3
              ${isRefreshing ? 'opacity-60' : 'opacity-100'}
              transition-opacity duration-200
            `}
          >
            {/* Synced */}
            <div className="bg-[#F9FAFB] rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {syncStatus.sync_stats?.total_synced || 0}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Total Synced</p>
            </div>

            {/* Last 24h */}
            <div className="bg-[#F9FAFB] rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {syncStatus.sync_stats?.last_24h || 0}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Last 24h</p>
            </div>

            {/* Failed */}
            <div className="bg-[#F9FAFB] rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {syncStatus.sync_stats?.failed_last_24h || 0}
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Failed (24h)</p>
            </div>
          </div>

          {/* Last Sync Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>
              Last sync:{' '}
              {syncStatus.sync_stats?.last_sync_at
                ? formatDistanceToNow(new Date(syncStatus.sync_stats.last_sync_at), {
                    addSuffix: true,
                  })
                : 'Never'}
            </span>
          </div>

          {/* Sync All Now Button */}
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            aria-label="Sync all appointments now"
            className="
              btn btn-primary
              w-full
              bg-[#434E54] hover:bg-[#363F44]
              border-none
              text-white text-sm font-medium
              shadow-sm hover:shadow-md
              disabled:bg-gray-300 disabled:cursor-not-allowed
            "
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Syncing...' : 'Sync All Now'}
          </button>

          {/* Settings Link */}
          <Link
            href="/admin/settings?tab=calendar"
            aria-label="View calendar settings"
            className="
              flex items-center justify-center gap-1
              text-xs font-medium text-[#434E54]
              hover:underline hover:text-[#5A6670]
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[#434E54] focus:ring-offset-2
              rounded
            "
          >
            View Calendar Settings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
