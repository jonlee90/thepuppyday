/**
 * Calendar Settings Client Component
 * Handles all interactive functionality for calendar settings
 */

'use client';

import { useState, useEffect } from 'react';
import { CalendarConnectionCard } from '@/components/admin/calendar/CalendarConnectionCard';
import { CalendarSelector } from '@/components/admin/calendar/CalendarSelector';
import { SyncSettingsForm } from '@/components/admin/calendar/SyncSettingsForm';
import { toast } from '@/hooks/use-toast';
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

  const handleRefreshStatus = async () => {
    try {
      const response = await fetch('/api/admin/calendar/connection/status');
      if (!response.ok) throw new Error('Failed to fetch status');

      const status: CalendarConnectionStatus = await response.json();
      setConnectionStatus(status);

      if (status.connected && status.connection) {
        setSelectedCalendarId(status.connection.calendar_id);

        // Fetch additional data
        const [settingsRes, calendarsRes] = await Promise.all([
          fetch('/api/admin/calendar/settings'),
          fetch('/api/admin/calendar/calendars'),
        ]);

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setSyncSettings(settings);
        }

        if (calendarsRes.ok) {
          const calendarsData = await calendarsRes.json();
          setCalendars(calendarsData.calendars || []);
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
      toast.error('Refresh Failed', {
        description: 'Failed to refresh connection status',
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
      const response = await fetch('/api/admin/calendar/auth/disconnect', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Disconnected', {
        description: 'Google Calendar has been disconnected',
      });

      // Reset state
      setConnectionStatus({ connected: false });
      setSyncSettings(null);
      setCalendars([]);
      setSelectedCalendarId('');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Disconnect Failed', {
        description: 'Failed to disconnect calendar. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCalendar = async (calendarId: string) => {
    try {
      const response = await fetch('/api/admin/calendar/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendar_id: calendarId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar');
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
      const response = await fetch('/api/admin/calendar/calendars');
      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }

      const data = await response.json();
      setCalendars(data.calendars || []);
    } catch (error) {
      console.error('Failed to refresh calendars:', error);
      throw error; // Re-throw to be handled by CalendarSelector
    }
  };

  const handleSaveSyncSettings = async (settings: CalendarSyncSettings) => {
    try {
      const response = await fetch('/api/admin/calendar/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
