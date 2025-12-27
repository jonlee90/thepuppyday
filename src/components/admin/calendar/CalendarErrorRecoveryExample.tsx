'use client';

import { useState, useEffect } from 'react';
import { QuotaWarning } from './QuotaWarning';
import { SyncErrorRecovery } from './SyncErrorRecovery';
import { PausedSyncBanner } from './PausedSyncBanner';

/**
 * Example implementation showing how to integrate all three
 * Google Calendar error recovery components together.
 *
 * This demonstrates:
 * - Fetching sync status from API
 * - Conditional rendering based on sync state
 * - Component orchestration and placement
 * - Event handler wiring
 */

interface SyncStatus {
  quotaUsage: {
    current: number;
    limit: number;
    percentage: number;
    resetAt: string;
  };
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: string;
  errorCount: number;
  lastSyncSuccess?: string;
}

export function CalendarErrorRecoveryExample() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuotaWarning, setShowQuotaWarning] = useState(true);

  // Fetch sync status from API
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await fetch('/api/admin/calendar/sync-status');
        const data = await response.json();
        setSyncStatus(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
        setIsLoading(false);
      }
    };

    fetchSyncStatus();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle resume sync
  const handleResume = async () => {
    try {
      const response = await fetch('/api/admin/calendar/connection/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to resume sync');
      }

      // Refresh sync status
      const statusResponse = await fetch('/api/admin/calendar/sync-status');
      const data = await statusResponse.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to resume sync:', error);
      throw error;
    }
  };

  // Handle view errors (scroll to error recovery panel)
  const handleViewErrors = () => {
    const errorPanel = document.getElementById('sync-error-recovery');
    if (errorPanel) {
      errorPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-neutral-200 rounded-xl" />
          <div className="h-64 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Critical: Paused Sync Banner (highest priority) */}
      {syncStatus?.isPaused && (
        <PausedSyncBanner
          pausedAt={syncStatus.pausedAt || new Date().toISOString()}
          pauseReason={syncStatus.pauseReason || 'Unknown error'}
          errorCount={syncStatus.errorCount}
          onResume={handleResume}
          onViewErrors={handleViewErrors}
        />
      )}

      {/* Warning: Quota Usage (if above 80%) */}
      {syncStatus?.quotaUsage.percentage >= 80 && showQuotaWarning && (
        <QuotaWarning
          current={syncStatus.quotaUsage.current}
          limit={syncStatus.quotaUsage.limit}
          percentage={syncStatus.quotaUsage.percentage}
          resetAt={syncStatus.quotaUsage.resetAt}
          onDismiss={() => setShowQuotaWarning(false)}
        />
      )}

      {/* Calendar Settings Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-semibold text-[#434E54] mb-2">Calendar Settings</h1>
        <p className="text-[#6B7280]">Manage your Google Calendar integration</p>
      </div>

      {/* Calendar Configuration Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-[#434E54] mb-4">Calendar Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text font-medium">Calendar ID</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="your-calendar@gmail.com"
              readOnly
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text font-medium">Sync Frequency</span>
            </label>
            <select className="select select-bordered w-full">
              <option>Every 5 minutes</option>
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sync Error Recovery Panel */}
      <div id="sync-error-recovery">
        <SyncErrorRecovery />
      </div>

      {/* Last Sync Status */}
      {syncStatus?.lastSyncSuccess && (
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-sm text-[#6B7280]">
            Last successful sync:{' '}
            <span className="font-medium text-[#434E54]">
              {new Date(syncStatus.lastSyncSuccess).toLocaleString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
