/**
 * Admin API - Notification Settings Detail Management
 * PUT /api/admin/notifications/settings/[notification_type] - Update settings for a specific notification type
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { NotificationSettingsRow } from '@/lib/notifications/database-types';

/**
 * Validate retry delays array
 */
function validateRetryDelays(delays: unknown): delays is number[] {
  if (!Array.isArray(delays)) {
    return false;
  }

  return delays.every((delay) => typeof delay === 'number' && delay > 0 && Number.isInteger(delay));
}

/**
 * Validate max retries value
 */
function validateMaxRetries(retries: unknown): retries is number {
  return typeof retries === 'number' && retries >= 0 && Number.isInteger(retries);
}

/**
 * Basic cron expression validation
 * Validates that the cron string has 5 parts (minute hour day month weekday)
 */
function validateCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  return parts.length === 5;
}

/**
 * PUT /api/admin/notifications/settings/[notification_type]
 * Update settings for a specific notification type
 * Accepts: email_enabled, sms_enabled, schedule_enabled, schedule_cron, max_retries, retry_delays_seconds
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notification_type: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { notification_type } = await params;

    // Validate notification_type is not empty
    if (!notification_type || notification_type.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      email_enabled,
      sms_enabled,
      schedule_enabled,
      schedule_cron,
      max_retries,
      retry_delays_seconds,
    } = body;

    // Check if notification_type exists
    const { data: existingSettings, error: fetchError } = (await (supabase as any)
      .from('notification_settings')
      .select('notification_type')
      .eq('notification_type', notification_type)
      .single()) as {
      data: { notification_type: string } | null;
      error: Error | null;
    };

    if (fetchError || !existingSettings) {
      return NextResponse.json(
        { error: 'Notification type not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Partial<NotificationSettingsRow> = {};

    // Validate and add boolean fields
    if (email_enabled !== undefined) {
      if (typeof email_enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'email_enabled must be a boolean' },
          { status: 400 }
        );
      }
      updateData.email_enabled = email_enabled;
    }

    if (sms_enabled !== undefined) {
      if (typeof sms_enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'sms_enabled must be a boolean' },
          { status: 400 }
        );
      }
      updateData.sms_enabled = sms_enabled;
    }

    if (schedule_enabled !== undefined) {
      if (typeof schedule_enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'schedule_enabled must be a boolean' },
          { status: 400 }
        );
      }
      updateData.schedule_enabled = schedule_enabled;
    }

    // Validate and add schedule_cron
    if (schedule_cron !== undefined) {
      if (schedule_cron !== null && typeof schedule_cron !== 'string') {
        return NextResponse.json(
          { error: 'schedule_cron must be a string or null' },
          { status: 400 }
        );
      }

      // If schedule_cron is provided and not null, validate format
      if (schedule_cron !== null && !validateCronExpression(schedule_cron)) {
        return NextResponse.json(
          { error: 'Invalid cron expression format. Expected: "minute hour day month weekday"' },
          { status: 400 }
        );
      }

      updateData.schedule_cron = schedule_cron;
    }

    // Validate and add max_retries
    if (max_retries !== undefined) {
      if (!validateMaxRetries(max_retries)) {
        return NextResponse.json(
          { error: 'max_retries must be a non-negative integer' },
          { status: 400 }
        );
      }
      updateData.max_retries = max_retries;
    }

    // Validate and add retry_delays_seconds
    if (retry_delays_seconds !== undefined) {
      if (!validateRetryDelays(retry_delays_seconds)) {
        return NextResponse.json(
          { error: 'retry_delays_seconds must be an array of positive integers' },
          { status: 400 }
        );
      }
      updateData.retry_delays_seconds = retry_delays_seconds;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Update the settings
    const { data: settings, error: updateError } = (await (supabase as any)
      .from('notification_settings')
      .update(updateData)
      .eq('notification_type', notification_type)
      .select()
      .single()) as {
      data: NotificationSettingsRow | null;
      error: Error | null;
    };

    if (updateError || !settings) {
      console.error('[Admin API] Error updating notification settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Admin API] Error updating notification settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
