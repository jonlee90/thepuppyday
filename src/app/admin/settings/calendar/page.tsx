/**
 * Calendar Integration Settings Page
 * Task 0042: Main settings page with all calendar components
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { CalendarSettingsClient } from './CalendarSettingsClient';
import type { CalendarConnectionStatus, CalendarSyncSettings, GoogleCalendarInfo } from '@/types/calendar';

async function getCalendarData(): Promise<{
  connectionStatus: CalendarConnectionStatus;
  syncSettings: CalendarSyncSettings | null;
  calendars: GoogleCalendarInfo[];
  error: string | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        connectionStatus: { connected: false },
        syncSettings: null,
        calendars: [],
        error: 'User not authenticated',
      };
    }

    // Fetch connection status
    const statusResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/calendar/connection/status`,
      {
        headers: {
          'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        cache: 'no-store',
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to fetch connection status');
    }

    const connectionStatus: CalendarConnectionStatus = await statusResponse.json();

    // If not connected, return early
    if (!connectionStatus.connected) {
      return {
        connectionStatus,
        syncSettings: null,
        calendars: [],
        error: null,
      };
    }

    // Fetch sync settings and calendars in parallel
    const [settingsResponse, calendarsResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/calendar/settings`,
        {
          headers: {
            'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          cache: 'no-store',
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/calendar/calendars`,
        {
          headers: {
            'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          cache: 'no-store',
        }
      ),
    ]);

    const syncSettings: CalendarSyncSettings = settingsResponse.ok
      ? await settingsResponse.json()
      : {
          sync_statuses: ['confirmed', 'checked_in'],
          auto_sync_enabled: true,
          sync_past_appointments: false,
          sync_completed_appointments: false,
          notification_preferences: {
            send_success_notifications: false,
            send_failure_notifications: true,
          },
        };

    const calendarsData = calendarsResponse.ok ? await calendarsResponse.json() : { calendars: [] };

    return {
      connectionStatus,
      syncSettings,
      calendars: calendarsData.calendars || [],
      error: null,
    };
  } catch (error) {
    console.error('[Calendar Settings] Error fetching data:', error);
    return {
      connectionStatus: { connected: false },
      syncSettings: null,
      calendars: [],
      error: error instanceof Error ? error.message : 'Failed to load calendar settings',
    };
  }
}

export const metadata = {
  title: 'Calendar Integration Settings | The Puppy Day Admin',
  description: 'Manage Google Calendar connection and sync settings',
};

// Force dynamic rendering for authentication and fresh data
export const dynamic = 'force-dynamic';

export default async function CalendarSettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Verify admin access
  await requireAdmin(supabase);

  // Fetch calendar data
  const { connectionStatus, syncSettings, calendars, error } = await getCalendarData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="text-sm breadcrumbs mb-2">
          <ul className="text-[#9CA3AF]">
            <li>
              <a href="/admin/settings" className="hover:text-[#434E54] hover:underline">
                Settings
              </a>
            </li>
            <li className="text-[#434E54]">Calendar Integration</li>
          </ul>
        </div>

        <h1 className="text-3xl font-bold text-[#434E54]">Calendar Integration Settings</h1>
        <p className="mt-2 text-[#6B7280]">
          Manage your Google Calendar connection and sync settings.
        </p>
      </div>

      {/* Client Component with all interactive functionality */}
      <CalendarSettingsClient
        initialConnectionStatus={connectionStatus}
        initialSyncSettings={syncSettings}
        initialCalendars={calendars}
        initialError={error}
        oauthSuccess={searchParams.success === 'true'}
        oauthError={searchParams.error}
      />
    </div>
  );
}
