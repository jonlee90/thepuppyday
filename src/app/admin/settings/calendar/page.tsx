/**
 * Calendar Integration Settings Page
 * Task 0042: Main settings page with all calendar components
 * FIXED: Critical #1 - Direct Supabase queries instead of HTTP fetch
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { CalendarSettingsClient } from './CalendarSettingsClient';
import { getActiveConnection } from '@/lib/calendar/connection';
import { getValidAccessToken } from '@/lib/calendar/token-manager';
import { google } from 'googleapis';
import type {
  CalendarConnectionStatus,
  CalendarSyncSettings,
  GoogleCalendarInfo,
  AppointmentStatusType,
} from '@/types/calendar';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get calendar connection status from database
 */
async function getConnectionStatus(
  supabase: SupabaseClient,
  adminId: string
): Promise<CalendarConnectionStatus> {
  try {
    // Direct database query for connection
    const connection = await getActiveConnection(supabase, adminId);

    if (!connection) {
      return { connected: false };
    }

    // Query sync log for stats
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [totalSyncedResult, last24hResult, failedLast24hResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('calendar_event_mapping')
        .select('id', { count: 'exact', head: true })
        .eq('connection_id', connection.id),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('calendar_sync_log')
        .select('id', { count: 'exact', head: true })
        .eq('connection_id', connection.id)
        .eq('status', 'success')
        .gte('created_at', twentyFourHoursAgo),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('calendar_sync_log')
        .select('id', { count: 'exact', head: true })
        .eq('connection_id', connection.id)
        .eq('status', 'failed')
        .gte('created_at', twentyFourHoursAgo),
    ]);

    return {
      connected: true,
      connection: {
        id: connection.id,
        calendar_email: connection.calendar_email,
        calendar_id: connection.calendar_id,
        last_sync_at: connection.last_sync_at,
        is_active: connection.is_active,
      },
      sync_stats: {
        total_synced: totalSyncedResult.count || 0,
        last_24h: last24hResult.count || 0,
        failed_last_24h: failedLast24hResult.count || 0,
      },
    };
  } catch (error) {
    console.error('[Calendar Settings] Error fetching connection status:', error);
    throw error;
  }
}

/**
 * Get sync settings from database
 */
async function getSyncSettings(supabase: SupabaseClient): Promise<CalendarSyncSettings> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'calendar_sync_settings')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch sync settings: ${error.message}`);
    }

    // Return settings or defaults
    if (data?.value) {
      return data.value as CalendarSyncSettings;
    }

    // Default settings
    return {
      sync_statuses: ['confirmed', 'checked_in'] as AppointmentStatusType[],
      auto_sync_enabled: true,
      sync_past_appointments: false,
      sync_completed_appointments: false,
      notification_preferences: {
        send_success_notifications: false,
        send_failure_notifications: true,
      },
    };
  } catch (error) {
    console.error('[Calendar Settings] Error fetching sync settings:', error);
    throw error;
  }
}

/**
 * Get available Google Calendars using Google Calendar API
 */
async function getAvailableCalendars(
  supabase: SupabaseClient,
  connectionId: string
): Promise<GoogleCalendarInfo[]> {
  try {
    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(supabase, connectionId);

    // Create OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Fetch calendars from Google Calendar API
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list({
      minAccessRole: 'writer', // Only calendars user can write to
    });

    if (!response.data.items) {
      return [];
    }

    // Map to GoogleCalendarInfo format
    return response.data.items.map((cal) => ({
      id: cal.id || '',
      summary: cal.summary || 'Unnamed Calendar',
      description: cal.description,
      timeZone: cal.timeZone || 'America/Los_Angeles',
      primary: cal.primary || false,
    }));
  } catch (error) {
    console.error('[Calendar Settings] Error fetching calendars:', error);
    // Return empty array instead of throwing - calendars are optional
    return [];
  }
}

/**
 * Fetch all calendar data from database and Google API
 */
async function getCalendarData(): Promise<{
  connectionStatus: CalendarConnectionStatus;
  syncSettings: CalendarSyncSettings | null;
  calendars: GoogleCalendarInfo[];
  error: string | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        connectionStatus: { connected: false },
        syncSettings: null,
        calendars: [],
        error: 'User not authenticated',
      };
    }

    // Fetch connection status (direct DB query)
    const connectionStatus = await getConnectionStatus(supabase, user.id);

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
    const [syncSettings, calendars] = await Promise.all([
      getSyncSettings(supabase),
      getAvailableCalendars(supabase, connectionStatus.connection!.id),
    ]);

    return {
      connectionStatus,
      syncSettings,
      calendars,
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
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();

  // Verify admin access
  await requireAdmin(supabase);

  // Fetch calendar data (using direct DB queries, not HTTP fetch)
  const { connectionStatus, syncSettings, calendars, error } = await getCalendarData();

  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams;

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
        oauthSuccess={params.success === 'true'}
        oauthError={params.error}
      />
    </div>
  );
}
