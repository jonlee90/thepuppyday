/**
 * API Route: GET/POST/DELETE /api/admin/settings/booking/blocked-dates
 * Manages blocked dates for booking calendar
 *
 * Task 0185: Blocked dates API routes
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { BlockedDate, BookingSettings } from '@/types/settings';
import { z, type ZodIssue } from 'zod';

/**
 * Validation schemas
 */
const BlockedDateInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  reason: z.string().max(200, 'Reason must be 200 characters or less').optional().default(''),
  force: z.boolean().optional().default(false), // Force block despite conflicts
}).refine(
  (data) => {
    if (!data.end_date) return true;
    return new Date(data.end_date) >= new Date(data.date);
  },
  { message: 'End date must be on or after start date' }
);

const DeleteBlockedDateSchema = z.object({
  date: z.string().optional(),
  dates: z.array(z.string()).optional(),
}).refine(
  (data) => data.date || (data.dates && data.dates.length > 0),
  { message: 'Either date or dates array must be provided' }
);

/**
 * Interface for appointment conflict details
 */
interface DateConflict {
  date: string;
  count: number;
}

interface ConflictResponse {
  error: string;
  affected_appointments: number;
  conflicts: DateConflict[];
}

/**
 * GET /api/admin/settings/booking/blocked-dates
 * Fetch blocked dates from booking settings
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
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as {
      data: { value: BookingSettings } | null;
      error: Error | null;
    };

    if (error && error.message !== 'No rows found') {
      console.error('[Blocked Dates API] Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blocked dates' },
        { status: 500 }
      );
    }

    // Return empty array if no settings found or no blocked_dates
    const blockedDates = settingRecord?.value?.blocked_dates || [];

    return NextResponse.json({
      blocked_dates: blockedDates,
    });
  } catch (error) {
    console.error('[Blocked Dates API] Unexpected error in GET:', error);

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
 * POST /api/admin/settings/booking/blocked-dates
 * Add new blocked date(s) after checking for conflicts
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = BlockedDateInputSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        '[Blocked Dates API] Validation error:',
        parseResult.error
      );

      // Format validation errors for user-friendly response
      const errors = parseResult.error?.errors?.map((err: ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [];

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { date, end_date, reason, force } = parseResult.data;

    // Check for existing appointments in the date range (unless force is true)
    if (!force) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = end_date ? new Date(end_date) : new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Query appointments table for conflicts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: appointments, error: appointmentsError } = (await (supabase as any)
        .from('appointments')
        .select('scheduled_at, status')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .in('status', ['pending', 'confirmed'])) as {
        data: Array<{ scheduled_at: string; status: string }> | null;
        error: Error | null;
      };

      if (appointmentsError) {
        console.error('[Blocked Dates API] Error checking appointments:', appointmentsError);
        return NextResponse.json(
          { error: 'Failed to check for appointment conflicts' },
          { status: 500 }
        );
      }

      // If conflicts found and not forcing, return 409 with details
      if (appointments && appointments.length > 0) {
        // Group by date
        const conflictsByDate = new Map<string, number>();

        appointments.forEach((apt) => {
          const aptDate = new Date(apt.scheduled_at).toISOString().split('T')[0];
          conflictsByDate.set(aptDate, (conflictsByDate.get(aptDate) || 0) + 1);
        });

        const conflicts: DateConflict[] = Array.from(conflictsByDate.entries()).map(
          ([date, count]) => ({ date, count })
        );

        const response: ConflictResponse = {
          error: 'Cannot block dates with existing appointments',
          affected_appointments: appointments.length,
          conflicts,
        };

        return NextResponse.json(response, { status: 409 });
      }
    }

    // Fetch current booking settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error: fetchError } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as {
      data: { value: BookingSettings } | null;
      error: Error | null;
    };

    if (fetchError && fetchError.message !== 'No rows found') {
      console.error('[Blocked Dates API] Error fetching settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    // Get current settings or use defaults
    const currentSettings: BookingSettings = settingRecord?.value || {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    // Get old blocked_dates for audit log
    const oldBlockedDates = [...(currentSettings.blocked_dates || [])];

    // Add new blocked date to array
    const newBlockedDate: BlockedDate = {
      date,
      end_date: end_date || null,
      reason: reason || '',
    };

    const updatedBlockedDates = [...oldBlockedDates, newBlockedDate];

    // Update settings with new blocked dates
    const updatedSettings: BookingSettings = {
      ...currentSettings,
      blocked_dates: updatedBlockedDates,
    };

    // Check if settings record exists
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
          value: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'booking_settings')) as { error: Error | null };

      if (updateError) {
        console.error('[Blocked Dates API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update blocked dates' },
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
          value: updatedSettings,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Blocked Dates API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create blocked dates' },
          { status: 500 }
        );
      }
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'booking',
      'blocked_dates',
      oldBlockedDates,
      updatedBlockedDates
    );

    // Return updated blocked dates array
    return NextResponse.json(
      {
        blocked_dates: updatedBlockedDates,
        message: 'Blocked date added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Blocked Dates API] Unexpected error in POST:', error);

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
 * DELETE /api/admin/settings/booking/blocked-dates
 * Remove blocked date(s)
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const parseResult = DeleteBlockedDateSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        '[Blocked Dates API] Validation error:',
        parseResult.error
      );

      // Format validation errors for user-friendly response
      const errors = parseResult.error?.errors?.map((err: ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [];

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { date, dates } = parseResult.data;

    // Build array of dates to remove
    const datesToRemove: string[] = [];
    if (date) {
      datesToRemove.push(date);
    }
    if (dates && dates.length > 0) {
      datesToRemove.push(...dates);
    }

    // Fetch current booking settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error: fetchError } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as {
      data: { value: BookingSettings } | null;
      error: Error | null;
    };

    if (fetchError) {
      console.error('[Blocked Dates API] Error fetching settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    if (!settingRecord?.value?.blocked_dates) {
      return NextResponse.json(
        { error: 'No blocked dates found' },
        { status: 404 }
      );
    }

    const currentSettings: BookingSettings = settingRecord.value;
    const oldBlockedDates = [...(currentSettings.blocked_dates || [])];

    // Filter out dates to remove (compare by date field)
    const updatedBlockedDates = oldBlockedDates.filter(
      (blockedDate) => !datesToRemove.includes(blockedDate.date)
    );

    // Check if any dates were actually removed
    if (updatedBlockedDates.length === oldBlockedDates.length) {
      return NextResponse.json(
        { error: 'No matching blocked dates found to remove' },
        { status: 404 }
      );
    }

    // Update settings with filtered blocked dates
    const updatedSettings: BookingSettings = {
      ...currentSettings,
      blocked_dates: updatedBlockedDates,
    };

    // Update settings in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = (await (supabase as any)
      .from('settings')
      .update({
        value: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'booking_settings')) as { error: Error | null };

    if (updateError) {
      console.error('[Blocked Dates API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update blocked dates' },
        { status: 500 }
      );
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'booking',
      'blocked_dates',
      oldBlockedDates,
      updatedBlockedDates
    );

    // Return updated blocked dates array
    return NextResponse.json({
      blocked_dates: updatedBlockedDates,
      message: `Successfully removed ${oldBlockedDates.length - updatedBlockedDates.length} blocked date(s)`,
    });
  } catch (error) {
    console.error('[Blocked Dates API] Unexpected error in DELETE:', error);

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
