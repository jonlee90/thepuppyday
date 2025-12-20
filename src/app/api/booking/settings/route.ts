/**
 * API Route: GET /api/booking/settings
 * Public endpoint for customer-facing booking widget to fetch booking configuration
 * Task 0214: Integration with Booking Flow
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { BookingSettings } from '@/types/settings';
import { BookingSettingsSchema } from '@/types/settings';

/**
 * Default booking settings
 */
const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  min_advance_hours: 2,
  max_advance_days: 90,
  cancellation_cutoff_hours: 24,
  buffer_minutes: 15,
  blocked_dates: [],
  recurring_blocked_days: [0], // Sundays blocked by default
};

// Enable Next.js 5-second cache revalidation
export const revalidate = 5;

/**
 * GET /api/booking/settings
 * Fetch booking settings for customer-facing booking widget
 * No authentication required - this is public data
 * Cached for 5 seconds to reduce database load
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch booking settings from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error } = await (supabase as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'booking_settings')
      .single();

    // PGRST116 = No rows found (not an error, just means using defaults)
    if (error && error.code !== 'PGRST116') {
      console.error('[Booking Settings API] Error fetching settings:', error);
      // Return defaults on error to prevent breaking booking flow
      return NextResponse.json(
        {
          data: DEFAULT_BOOKING_SETTINGS,
          last_updated: null,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          },
        }
      );
    }

    // If no settings found, return defaults
    if (!settingRecord) {
      return NextResponse.json(
        {
          data: DEFAULT_BOOKING_SETTINGS,
          last_updated: null,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          },
        }
      );
    }

    // Validate and parse settings
    const settingsValue = settingRecord.value;
    const parseResult = BookingSettingsSchema.safeParse(settingsValue);

    if (!parseResult.success) {
      console.error(
        '[Booking Settings API] Invalid settings in database:',
        parseResult.error
      );
      // Return defaults if database has invalid data (log server-side only)
      return NextResponse.json(
        {
          data: DEFAULT_BOOKING_SETTINGS,
          last_updated: null,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
          },
        }
      );
    }

    return NextResponse.json(
      {
        data: parseResult.data,
        last_updated: settingRecord.updated_at,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('[Booking Settings API] Unexpected error in GET:', error);

    return NextResponse.json(
      {
        data: DEFAULT_BOOKING_SETTINGS,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
