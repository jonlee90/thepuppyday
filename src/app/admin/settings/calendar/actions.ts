/**
 * Server Actions for Calendar Settings
 * FIXED: Critical #2 - CSRF protection with Next.js Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection, deactivateConnection } from '@/lib/calendar/connection';
import { revokeTokens } from '@/lib/calendar/oauth';
import { getValidAccessToken } from '@/lib/calendar/token-manager';
import { getQuotaStatus as getQuotaStatusUtil } from '@/lib/calendar/quota/tracker';
import { resumeAutoSync as resumeAutoSyncUtil } from '@/lib/calendar/sync/pause-manager';
import type { CalendarSyncSettings, CalendarConnectionStatus } from '@/types/calendar';

/**
 * Disconnect Google Calendar
 * Deactivates connection and revokes OAuth tokens
 */
export async function disconnectCalendar(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    // Get active connection
    const connection = await getActiveConnection(supabase, adminUser.id);
    if (!connection) {
      return { success: false, error: 'No active calendar connection found' };
    }

    // Get access token for revocation
    const accessToken = await getValidAccessToken(supabase, connection.id);

    // Revoke OAuth tokens with Google
    try {
      await revokeTokens(accessToken);
    } catch (revokeError) {
      // Log but continue - token may already be invalid
      console.error('Token revocation warning:', revokeError);
    }

    // Deactivate connection in database
    await deactivateConnection(supabase, connection.id);

    // Revalidate the page to show updated state
    revalidatePath('/admin/settings/calendar');

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect calendar',
    };
  }
}

/**
 * Update calendar sync settings
 * Saves settings to database
 */
export async function updateSyncSettings(
  settings: CalendarSyncSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Validate settings
    if (!settings.sync_statuses || settings.sync_statuses.length === 0) {
      return {
        success: false,
        error: 'At least one appointment status must be selected for sync',
      };
    }

    // Upsert settings in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('settings')
      .upsert({
        key: 'calendar_sync_settings',
        value: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    // Revalidate the page
    revalidatePath('/admin/settings/calendar');

    return { success: true };
  } catch (error) {
    console.error('Failed to update sync settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sync settings',
    };
  }
}

/**
 * Update selected calendar
 * Updates the calendar_id in the connection
 */
export async function updateSelectedCalendar(
  calendarId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    // Get active connection
    const connection = await getActiveConnection(supabase, adminUser.id);
    if (!connection) {
      return { success: false, error: 'No active calendar connection found' };
    }

    // Update calendar_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('calendar_connections')
      .update({
        calendar_id: calendarId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (error) {
      throw new Error(`Failed to update calendar: ${error.message}`);
    }

    // Revalidate the page
    revalidatePath('/admin/settings/calendar');

    return { success: true };
  } catch (error) {
    console.error('Failed to update selected calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update selected calendar',
    };
  }
}

/**
 * Refresh calendar connection status
 * Returns updated connection status
 */
export async function refreshConnectionStatus(): Promise<{
  success: boolean;
  connectionStatus?: CalendarConnectionStatus;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    // Get active connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection) {
      return {
        success: true,
        connectionStatus: { connected: false },
      };
    }

    // Query sync stats
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

    const connectionStatus = {
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

    return { success: true, connectionStatus };
  } catch (error) {
    console.error('Failed to refresh connection status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh status',
    };
  }
}

/**
 * Get Quota Status
 * Returns current API quota usage with CSRF protection
 * FIXED: Critical #1 - CSRF protection via Server Action
 */
export async function getQuotaStatus(): Promise<{
  success: boolean;
  data?: {
    current: number;
    limit: number;
    percentage: number;
    resetAt: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const quotaStatus = await getQuotaStatusUtil(supabase);

    return { success: true, data: quotaStatus };
  } catch (error) {
    console.error('[Actions] Failed to get quota status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quota status',
    };
  }
}

/**
 * Resume Auto-Sync
 * Resumes auto-sync for paused connection with CSRF protection
 * FIXED: Critical #1 - CSRF protection via Server Action
 */
export async function resumeAutoSync(connectionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Validate connection belongs to admin
    const { user: adminUser } = await requireAdmin(supabase);
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection || connection.id !== connectionId) {
      return { success: false, error: 'Connection not found or unauthorized' };
    }

    // Resume auto-sync using utility function
    await resumeAutoSyncUtil(supabase, connectionId);

    // Revalidate the page to show updated state
    revalidatePath('/admin/settings/calendar');

    return { success: true };
  } catch (error) {
    console.error('[Actions] Failed to resume auto-sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume auto-sync',
    };
  }
}
