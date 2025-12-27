/**
 * Calendar Settings Client Component
 * Handles all interactive functionality for calendar settings
 * FIXED: Critical #2 - Using Server Actions instead of fetch
 */

'use client';

import { useState, useEffect } from 'react';
import { CalendarConnectionCard } from '@/components/admin/calendar/CalendarConnectionCard';
import { CalendarSelector } from '@/components/admin/calendar/CalendarSelector';
import { SyncSettingsForm } from '@/components/admin/calendar/SyncSettingsForm';
import { QuotaWarning } from '@/components/admin/calendar/QuotaWarning';
import { PausedSyncBanner } from '@/components/admin/calendar/PausedSyncBanner';
import { SyncErrorRecovery } from '@/components/admin/calendar/SyncErrorRecovery';
import { toast } from '@/hooks/use-toast';
import {
  disconnectCalendar,
  updateSyncSettings,
  updateSelectedCalendar,
  refreshConnectionStatus,
  getQuotaStatus as getQuotaStatusAction,
  resumeAutoSync as resumeAutoSyncAction,
} from './actions';
import type {
  CalendarConnectionStatus,
  CalendarSyncSettings,
  GoogleCalendarInfo,
} from '@/types/calendar';

interface CalendarSettingsClientProps {
  initialConnectionStatus: CalendarConnectionStatus;
  initialSyncSettings: CalendarSyncSettings | null;
  initialCalendars: GoogleCalendarInfo[];
  initialError: string | null;
  oauthSuccess?: boolean;
  oauthError?: string;
}

export function CalendarSettingsClient({
  initialConnectionStatus,
  initialSyncSettings,
  initialCalendars,
  initialError,
  oauthSuccess = false,
  oauthError,
}: CalendarSettingsClientProps) {
  const [connectionStatus, setConnectionStatus] = useState(initialConnectionStatus);
  const [syncSettings, setSyncSettings] = useState(initialSyncSettings);
  const [calendars, setCalendars] = useState(initialCalendars);
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    initialConnectionStatus.connection?.calendar_id || ''
  );
  const [isLoading, setIsLoading] = useState(false);

  // Error recovery state
  const [quotaData, setQuotaData] = useState<{
    current: number;
    limit: number;
    percentage: number;
    resetAt: string;
  } | null>(null);
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);

  // Fetch quota status when connected
  useEffect(() => {
    if (connectionStatus.connected) {
      fetchQuotaStatus();

      // Refresh quota every 5 minutes
      const interval = setInterval(fetchQuotaStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus.connected]);

  // Show OAuth success/error toasts
  useEffect(() => {
    if (oauthSuccess) {
      toast.success('Calendar Connected', {
        description: 'Google Calendar connected successfully!',
        duration: 5000,
      });

      // Refresh data after successful connection
      handleRefreshStatus();
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Permission denied. Calendar integration requires calendar access.',
        invalid_token: 'Invalid or expired token. Please try connecting again.',
        calendar_not_found: 'Selected calendar was not found or deleted.',
        network_error: 'Connection failed due to network issues.',
      };

      toast.error('Connection Failed', {
        description: errorMessages[oauthError] || 'Failed to connect. Please try again.',
        duration: 8000,
      });
    }
  }, [oauthSuccess, oauthError]);

  const fetchQuotaStatus = async () => {
    try {
      // FIXED: Critical #1 - Using Server Action instead of fetch for CSRF protection
      const result = await getQuotaStatusAction();

      if (result.success && result.data) {
        setQuotaData(result.data);
      }
    } catch (error) {
      console.error('[CalendarSettings] Failed to fetch quota status:', error);
    }
  };

  const handleResumeAutoSync = async () => {
    if (!connectionStatus.connection?.id) return;

    try {
      // FIXED: Critical #1 - Using Server Action instead of fetch for CSRF protection
      const result = await resumeAutoSyncAction(connectionStatus.connection.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to resume auto-sync');
      }

      toast({
        title: 'Auto-Sync Resumed',
        description: 'Auto-sync has been successfully resumed',
      });

      // Refresh connection status
      await handleRefreshStatus();
    } catch (error) {
      console.error('[CalendarSettings] Failed to resume auto-sync:', error);
      toast({
        title: 'Resume Failed',
        description: error instanceof Error ? error.message : 'Failed to resume auto-sync',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshStatus = async () => {
    try {
      // Use Server Action for CSRF protection
      const result = await refreshConnectionStatus();

      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh status');
      }

      if (result.connectionStatus) {
        setConnectionStatus(result.connectionStatus);

        if (result.connectionStatus.connected && result.connectionStatus.connection) {
          setSelectedCalendarId(result.connectionStatus.connection.calendar_id);
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh connection status',
        variant: 'destructive',
      });
    }
  };

  const handleConnect = () => {
    // OAuth flow is handled by GoogleOAuthButton
    // This is a no-op callback
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      // Use Server Action for CSRF protection
      const result = await disconnectCalendar();

      if (!result.success) {
        throw new Error(result.error || 'Failed to disconnect');
      }

      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected',
      });

      // Reset state
      setConnectionStatus({ connected: false });
      setSyncSettings(null);
      setCalendars([]);
      setSelectedCalendarId('');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Disconnect Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect calendar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCalendar = async (calendarId: string) => {
    try {
      // Use Server Action for CSRF protection
      const result = await updateSelectedCalendar(calendarId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update calendar');
      }

      setSelectedCalendarId(calendarId);

      // Update connection status
      if (connectionStatus.connection) {
        setConnectionStatus({
          ...connectionStatus,
          connection: {
            ...connectionStatus.connection,
            calendar_id: calendarId,
          },
        });
      }
    } catch (error) {
      console.error('Failed to select calendar:', error);
      throw error; // Re-throw to be handled by CalendarSelector
    }
  };

  const handleRefreshCalendars = async () => {
    try {
      // Use Server Action for CSRF protection
      const result = await refreshConnectionStatus();

      if (!result.success || !result.connectionStatus?.connection) {
        throw new Error('Failed to refresh calendars');
      }

      // Fetch calendars would need to be done server-side
      // For now, trigger a full page refresh to reload calendars
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh calendars:', error);
      throw error; // Re-throw to be handled by CalendarSelector
    }
  };

  const handleSaveSyncSettings = async (settings: CalendarSyncSettings) => {
    try {
      // Use Server Action for CSRF protection
      const result = await updateSyncSettings(settings);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSyncSettings(settings);
    } catch (error) {
      console.error('Failed to save sync settings:', error);
      throw error; // Re-throw to be handled by SyncSettingsForm
    }
  };

  // Show error state
  if (initialError) {
    return (
      <div className="alert alert-error bg-[#FEE2E2] border-[#EF4444]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-bold text-[#7F1D1D]">Failed to Load Settings</h3>
          <div className="text-sm text-[#991B1B]">{initialError}</div>
        </div>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paused Sync Banner - Critical Alert (top priority) */}
      {connectionStatus.connected &&
       connectionStatus.connection?.auto_sync_paused && (
        <PausedSyncBanner
          pausedAt={connectionStatus.connection.paused_at || new Date().toISOString()}
          pauseReason={connectionStatus.connection.pause_reason || 'Auto-paused due to consecutive failures'}
          errorCount={connectionStatus.connection.consecutive_failures || 0}
          onResume={handleResumeAutoSync}
          onViewErrors={() => setShowErrorRecovery(true)}
        />
      )}

      {/* Quota Warning - Proactive Monitor */}
      {connectionStatus.connected &&
       quotaData &&
       quotaData.percentage >= 80 && (
        <QuotaWarning
          current={quotaData.current}
          limit={quotaData.limit}
          percentage={quotaData.percentage}
          resetAt={quotaData.resetAt}
        />
      )}

      {/* Connection Card */}
      <CalendarConnectionCard
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isLoading={isLoading}
      />

      {/* Connected-only sections */}
      {connectionStatus.connected && (
        <>
          {/* Calendar Selector */}
          <CalendarSelector
            calendars={calendars}
            selectedCalendarId={selectedCalendarId}
            onSelect={handleSelectCalendar}
            onRefresh={handleRefreshCalendars}
            isLoading={isLoading}
          />

          {/* Sync Settings Form */}
          {syncSettings && (
            <SyncSettingsForm
              initialSettings={syncSettings}
              onSave={handleSaveSyncSettings}
              isLoading={isLoading}
            />
          )}

          {/* Error Recovery Section */}
          {showErrorRecovery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#434E54]">
                  Sync Error Recovery
                </h3>
                <button
                  onClick={() => setShowErrorRecovery(false)}
                  className="btn btn-sm btn-ghost text-[#6B7280]"
                >
                  Hide
                </button>
              </div>
              <SyncErrorRecovery />
            </div>
          )}

          {!showErrorRecovery && (
            <button
              onClick={() => setShowErrorRecovery(true)}
              className="btn btn-outline btn-sm text-[#434E54] border-[#E5E7EB] hover:bg-[#F8EEE5]"
            >
              View Sync Errors
            </button>
          )}

          {/* Info Section */}
          <div className="card bg-white shadow-md">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-[#434E54] mb-4">
                How Calendar Sync Works
              </h3>
              <div className="space-y-3 text-sm text-[#6B7280]">
                <p>
                  <strong className="text-[#434E54]">Automatic Sync:</strong> When enabled,
                  appointments are automatically synced to your Google Calendar when created,
                  updated, or cancelled based on your sync settings.
                </p>
                <p>
                  <strong className="text-[#434E54]">Two-Way Sync:</strong> Changes made in
                  Google Calendar are imported back into The Puppy Day (coming soon).
                </p>
                <p>
                  <strong className="text-[#434E54]">Status Filtering:</strong> Only appointments
                  with the selected statuses will be synced. This helps keep your calendar clean
                  and focused on confirmed appointments.
                </p>
                <p>
                  <strong className="text-[#434E54]">Privacy:</strong> Calendar events include
                  customer name, pet name, and service details. Sensitive information like
                  payment details are never synced.
                </p>
                <p>
                  <strong className="text-[#434E54]">Error Recovery:</strong> Failed syncs are
                  automatically retried with exponential backoff. After 3 failed attempts,
                  manual intervention may be required.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
