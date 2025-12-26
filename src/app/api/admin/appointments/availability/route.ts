/**
 * Admin Availability Check API
 * GET /api/admin/appointments/availability
 *
 * Checks time slot availability for a specific date and duration
 * Respects all booking settings: business hours, blocked dates, recurring blocked days, buffer time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, type AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  getAvailableSlots,
  DEFAULT_BUSINESS_HOURS,
  getDayName,
  type TimeSlot,
  type BusinessHours,
} from '@/lib/booking/availability';
import type { Appointment } from '@/types/database';
import type { BookingSettings, BlockedDate } from '@/types/settings';

export const dynamic = 'force-dynamic';

interface NewFormatHours {
  [key: string]: {
    isOpen?: boolean;
    is_open?: boolean;
    ranges?: Array<{ start: string; end: string }>;
    open?: string;
    close?: string;
  };
}

/**
 * Convert new booking hours format to legacy format for getAvailableSlots
 * New format: { isOpen: boolean, ranges: [{ start: string, end: string }] }
 * Legacy format: { is_open: boolean, open: string, close: string }
 */
function convertToLegacyFormat(newFormatHours: NewFormatHours): BusinessHours {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const result: Partial<BusinessHours> = {};

  for (const day of days) {
    const dayData = newFormatHours[day];
    if (dayData && typeof dayData.isOpen === 'boolean') {
      // New format - convert to legacy
      const firstRange = dayData.ranges?.[0];
      result[day] = {
        is_open: dayData.isOpen,
        open: firstRange?.start || '09:00',
        close: firstRange?.end || '17:00',
      };
    } else if (dayData && typeof dayData.is_open === 'boolean') {
      // Already in legacy format
      result[day] = dayData as { is_open: boolean; open: string; close: string };
    } else {
      // Fallback to default
      result[day] = DEFAULT_BUSINESS_HOURS[day];
    }
  }

  return result as BusinessHours;
}

/**
 * Check if a date falls within any blocked date range
 */
function isDateBlocked(date: string, blockedDates: BlockedDate[]): { blocked: boolean; reason?: string } {
  const checkDate = new Date(date + 'T00:00:00');

  for (const blocked of blockedDates) {
    const startDate = new Date(blocked.date + 'T00:00:00');
    const endDate = blocked.end_date
      ? new Date(blocked.end_date + 'T23:59:59')
      : new Date(blocked.date + 'T23:59:59');

    if (checkDate >= startDate && checkDate <= endDate) {
      return { blocked: true, reason: blocked.reason };
    }
  }

  return { blocked: false };
}

/**
 * Check if a day of week is in recurring blocked days
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
function isDayRecurringBlocked(date: string, recurringBlockedDays: number[]): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  return recurringBlockedDays.includes(dayOfWeek);
}

/**
 * GET handler for checking appointment availability
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const durationMinutes = searchParams.get('duration_minutes');

    // Validate required parameters
    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required parameter: duration_minutes' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: 'Invalid duration_minutes. Must be a positive number' },
        { status: 400 }
      );
    }

    // Fetch booking settings (all settings including business hours, blocked dates, etc.)
    const { data: bookingSettingsData } = await (supabase as AppSupabaseClient)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single();

    const bookingSettings: BookingSettings = bookingSettingsData?.value || {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0], // Sunday by default
    };

    // Extract and convert booking hours from settings
    const rawBookingHours = bookingSettings.business_hours;
    const businessHours = rawBookingHours
      ? convertToLegacyFormat(rawBookingHours)
      : DEFAULT_BUSINESS_HOURS;

    // Parse date and check day of week
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // Parse as local date
    const dayName = getDayName(dateObj);
    const dayHours = businessHours[dayName];

    // Check if day is in recurring blocked days (e.g., Sundays)
    if (isDayRecurringBlocked(date, bookingSettings.recurring_blocked_days || [])) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const blockedDayName = dayNames[dateObj.getDay()];
      return NextResponse.json({
        date,
        is_closed: true,
        reason: `${blockedDayName}s are blocked for appointments`,
        time_slots: [],
      });
    }

    // Check if date is specifically blocked
    const blockedCheck = isDateBlocked(date, bookingSettings.blocked_dates || []);
    if (blockedCheck.blocked) {
      return NextResponse.json({
        date,
        is_closed: true,
        reason: blockedCheck.reason || 'This date is blocked',
        time_slots: [],
      });
    }

    // Check if business is closed on this day (from business hours)
    if (!dayHours.is_open) {
      return NextResponse.json({
        date,
        is_closed: true,
        reason: 'Business is closed on this day',
        business_hours: {
          start: dayHours.open,
          end: dayHours.close,
        },
        time_slots: [],
      });
    }

    // Fetch existing appointments for the date
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, status')
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress']);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get buffer minutes from settings
    const bufferMinutes = bookingSettings.buffer_minutes || 0;

    // Get available time slots (duration + buffer must fit within closing time)
    const effectiveDuration = duration + bufferMinutes;
    const slots = getAvailableSlots(
      date,
      effectiveDuration,
      appointments as Appointment[],
      businessHours
    );

    // Count existing appointments per slot for additional info
    // Account for buffer time when checking for overlap
    const slotsWithCounts = slots.map((slot: TimeSlot) => {
      const slotTime = new Date(`${date}T${slot.time}:00`);
      const slotEndTime = new Date(slotTime.getTime() + effectiveDuration * 60000);

      const existingCount = (appointments || []).filter((apt: Appointment) => {
        const aptStart = new Date(apt.scheduled_at);
        // Each existing appointment also has buffer after it
        const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes + bufferMinutes) * 60000);

        // Check for overlap including buffer
        return aptStart < slotEndTime && aptEnd > slotTime;
      }).length;

      return {
        time: slot.time,
        available: slot.available,
        booked_count: existingCount,
        max_concurrent: 3, // Configurable - could come from settings
      };
    });

    return NextResponse.json({
      date,
      is_closed: false,
      business_hours: {
        start: dayHours.open,
        end: dayHours.close,
      },
      time_slots: slotsWithCounts,
    });
  } catch (error) {
    console.error('Error in availability API:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
