/**
 * Google Calendar Sync Settings Endpoint
 * GET /api/admin/calendar/settings - Get sync preferences
 * PUT /api/admin/calendar/settings - Update sync preferences
 * Task 0011: Manage calendar sync settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection } from '@/lib/calendar/connection';
import { calendarSyncSettingsSchema } from '@/types/calendar';
import type { CalendarSyncSettings } from '@/types/calendar';

/**
 * GET - Retrieve current sync settings
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Calendar Sync Settings] GET - Admin user:', adminUser.email);

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection) {
      console.log('[Calendar Sync Settings] No active connection for admin:', adminUser.id);
      return NextResponse.json(
        {
          error: 'No calendar connection found',
          message: 'Please connect Google Calendar first.',
        },
        { status: 404 }
      );
    }

    // Retrieve sync settings from settings table
    const { data: settingsData, error: settingsError } = await (supabase as AppSupabaseClient)
      .from('settings')
      .select('value')
      .eq('key', 'calendar_sync_settings')
      .single();

    let syncSettings: CalendarSyncSettings;

    if (settingsError || !settingsData) {
      // Return default settings if not found
      console.log('[Calendar Sync Settings] No settings found, returning defaults');
      syncSettings = {
        sync_statuses: ['confirmed', 'checked_in', 'in_progress'],
        auto_sync_enabled: true,
        sync_past_appointments: false,
        sync_completed_appointments: false,
        notification_preferences: {
          send_success_notifications: false,
          send_failure_notifications: true,
        },
      };
    } else {
      syncSettings = settingsData.value as CalendarSyncSettings;
    }

    console.log('[Calendar Sync Settings] Returning sync settings');

    return NextResponse.json({
      settings: syncSettings,
      connection_id: connection.id,
    });
  } catch (error) {
    console.error('[Calendar Sync Settings] GET Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch sync settings',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update sync settings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Calendar Sync Settings] PUT - Admin user:', adminUser.email);

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection) {
      console.log('[Calendar Sync Settings] No active connection for admin:', adminUser.id);
      return NextResponse.json(
        {
          error: 'No calendar connection found',
          message: 'Please connect Google Calendar first.',
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = calendarSyncSettingsSchema.safeParse(body);

    if (!validation.success) {
      console.log('[Calendar Sync Settings] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const syncSettings = validation.data;

    console.log('[Calendar Sync Settings] Updating settings:', syncSettings);

    // Check if settings already exist
    const { data: existingSettings } = await (supabase as AppSupabaseClient)
      .from('settings')
      .select('id')
      .eq('key', 'calendar_sync_settings')
      .single();

    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await (supabase as AppSupabaseClient)
        .from('settings')
        .update({
          value: syncSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'calendar_sync_settings');

      if (updateError) {
        console.error('[Calendar Sync Settings] Failed to update settings:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update sync settings',
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    } else {
      // Insert new settings
      const { error: insertError } = await (supabase as AppSupabaseClient)
        .from('settings')
        .insert({
          key: 'calendar_sync_settings',
          value: syncSettings,
          category: 'calendar',
          description: 'Google Calendar sync preferences',
        });

      if (insertError) {
        console.error('[Calendar Sync Settings] Failed to insert settings:', insertError);
        return NextResponse.json(
          {
            error: 'Failed to create sync settings',
            details: insertError.message,
          },
          { status: 500 }
        );
      }
    }

    console.log('[Calendar Sync Settings] Settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated successfully',
      settings: syncSettings,
    });
  } catch (error) {
    console.error('[Calendar Sync Settings] PUT Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to update sync settings',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
