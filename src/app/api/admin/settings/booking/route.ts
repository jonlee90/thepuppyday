/**
 * API Route: GET/PUT /api/admin/settings/booking
 * Manages booking configuration settings
 *
 * Task 0180: Booking settings API routes
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { BookingSettings } from '@/types/settings';
import { BookingSettingsSchema } from '@/types/settings';

/**
 * Default booking settings
 */
const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  min_advance_hours: 2, // 2 hours minimum advance booking
  max_advance_days: 90, // 90 days maximum advance booking
  cancellation_cutoff_hours: 24, // 24 hours before appointment
  buffer_minutes: 15, // 15 minutes buffer between appointments
  blocked_dates: [], // No specific blocked dates by default
  recurring_blocked_days: [0], // Sundays blocked by default (0=Sunday)
};

/**
 * GET /api/admin/settings/booking
 * Fetch booking settings from database
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch booking settings from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error } = (await (supabase as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'booking_settings')
      .single()) as {
      data: { value: unknown; updated_at: string } | null;
      error: Error | null;
    };

    if (error && error.message !== 'No rows found') {
      console.error('[Booking Settings API] Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booking settings' },
        { status: 500 }
      );
    }

    // If no settings found, return defaults
    if (!settingRecord) {
      console.log('[Booking Settings API] No settings found, returning defaults');
      return NextResponse.json({
        data: DEFAULT_BOOKING_SETTINGS,
        last_updated: null,
      });
    }

    // Validate and parse settings
    const settingsValue = settingRecord.value;
    const parseResult = BookingSettingsSchema.safeParse(settingsValue);

    if (!parseResult.success) {
      console.error(
        '[Booking Settings API] Invalid settings in database:',
        parseResult.error
      );
      // Return defaults if database has invalid data
      return NextResponse.json({
        data: DEFAULT_BOOKING_SETTINGS,
        last_updated: settingRecord.updated_at,
        warning: 'Database settings were invalid, returning defaults',
      });
    }

    return NextResponse.json({
      data: parseResult.data,
      last_updated: settingRecord.updated_at,
    });
  } catch (error) {
    console.error('[Booking Settings API] Unexpected error in GET:', error);

    // Check for authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/booking
 * Update booking settings with validation
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod schema
    const parseResult = BookingSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        '[Booking Settings API] Validation error:',
        parseResult.error.errors
      );

      // Format validation errors for user-friendly response
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const newSettings = parseResult.data;

    // Additional business logic validations
    const businessValidationError = validateBusinessLogic(newSettings);
    if (businessValidationError) {
      return NextResponse.json(
        { error: businessValidationError },
        { status: 400 }
      );
    }

    // Fetch old settings for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldSettingRecord } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as { data: { value: unknown } | null; error: Error | null };

    const oldSettings = oldSettingRecord?.value || null;

    // Update or insert booking settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSetting } = (await (supabase as any)
      .from('settings')
      .select('id')
      .eq('key', 'booking_settings')
      .single()) as { data: { id: string } | null; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = (await (supabase as any)
        .from('settings')
        .update({
          value: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'booking_settings')) as { error: Error | null };

      if (updateError) {
        console.error('[Booking Settings API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update booking settings' },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = (await (supabase as any)
        .from('settings')
        .insert({
          key: 'booking_settings',
          value: newSettings,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Booking Settings API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create booking settings' },
          { status: 500 }
        );
      }
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'booking',
      'booking_settings',
      oldSettings,
      newSettings
    );

    // Return updated settings
    return NextResponse.json({
      data: newSettings,
      message: 'Booking settings updated successfully',
    });
  } catch (error) {
    console.error('[Booking Settings API] Unexpected error in PUT:', error);

    // Check for authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate business logic rules for booking settings
 */
function validateBusinessLogic(settings: BookingSettings): string | null {
  // Validate buffer_minutes is divisible by 5
  if (settings.buffer_minutes % 5 !== 0) {
    return 'Buffer minutes must be divisible by 5';
  }

  // Validate min_advance_hours is less than max_advance_days
  const minAdvanceInHours = settings.min_advance_hours;
  const maxAdvanceInHours = settings.max_advance_days * 24;

  if (minAdvanceInHours >= maxAdvanceInHours) {
    return 'Minimum advance hours must be less than maximum advance days';
  }

  // Validate blocked_dates are valid dates
  for (const blockedDate of settings.blocked_dates) {
    if (!isValidDate(blockedDate.date)) {
      return `Invalid blocked date: ${blockedDate.date}`;
    }

    // Validate end_date if provided
    if (blockedDate.end_date && !isValidDate(blockedDate.end_date)) {
      return `Invalid blocked end date: ${blockedDate.end_date}`;
    }

    // Validate end_date is after start date
    if (
      blockedDate.end_date &&
      new Date(blockedDate.end_date) < new Date(blockedDate.date)
    ) {
      return `Blocked end date must be after start date: ${blockedDate.date}`;
    }
  }

  // Validate recurring_blocked_days are unique
  const uniqueDays = new Set(settings.recurring_blocked_days);
  if (uniqueDays.size !== settings.recurring_blocked_days.length) {
    return 'Recurring blocked days must be unique';
  }

  return null;
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
