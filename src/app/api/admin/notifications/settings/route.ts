/**
 * Admin API - Notification Settings Management
 * GET /api/admin/notifications/settings - List all notification settings
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

/**
 * GET /api/admin/notifications/settings
 * List all notification settings with their configuration
 * Returns all notification types ordered by notification_type ascending
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all notification settings
    const { data: settings, error } = (await (supabase as any)
      .from('notification_settings')
      .select(
        'notification_type, email_enabled, sms_enabled, schedule_enabled, schedule_cron, max_retries, retry_delays_seconds, last_sent_at, total_sent_count, total_failed_count, created_at, updated_at'
      )
      .order('notification_type', { ascending: true })) as {
      data: NotificationSettingsRow[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings: settings || [] });
  } catch (error) {
    console.error('[Admin API] Error fetching notification settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';

    // Check for unauthorized error
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
