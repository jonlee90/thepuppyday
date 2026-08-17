/**
 * GET /api/availability - Calculate available time slots for a specific date and service
 * Respects all booking settings: business hours, blocked dates, recurring blocked days, buffer time
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import {
  getAvailableSlots,
  normalizeBusinessHours,
  timeToMinutes,
  getDayName,
  type TimeSlot,
} from '@/lib/booking';
import type { BookingSettings, BlockedDate } from '@/types/settings';
import { config } from '@/lib/config';

/**
 * Check if a date falls within any blocked date range.
 * Returns `partial: true` with `blocked_hours` when only specific hours are blocked.
 */
function isDateBlocked(date: string, blockedDates: BlockedDate[]): {
  blocked: boolean;
  partial?: boolean;
  blocked_hours?: Array<{ start: string; end: string }>;
  reason?: string;
} {
  const checkDate = new Date(date + 'T00:00:00');

  for (const blocked of blockedDates) {
    const startDate = new Date(blocked.date + 'T00:00:00');
    const endDate = blocked.end_date
      ? new Date(blocked.end_date + 'T23:59:59')
      : new Date(blocked.date + 'T23:59:59');

    if (checkDate >= startDate && checkDate <= endDate) {
      // If this blocked entry has specific hours, it's a partial block
      if (blocked.blocked_hours && blocked.blocked_hours.length > 0 && !blocked.end_date) {
        return {
          blocked: false,
          partial: true,
          blocked_hours: blocked.blocked_hours,
          reason: blocked.reason,
        };
      }
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');

    // Validate parameters
    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date and service_id' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const requestedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json(
        { error: 'Cannot query availability for past dates' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get service to check duration
    const { data: service, error: serviceError } = await (supabase as any)
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch booking settings (all settings including business hours, blocked dates, etc.)
    const { data: bookingSettingsData } = await (supabase as any)
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

    const businessHours = normalizeBusinessHours(bookingSettings.business_hours);

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
        slots: [],
        is_closed: true,
        reason: `${blockedDayName}s are not available for appointments`,
      });
    }

    // Check if date is specifically blocked
    const blockedCheck = isDateBlocked(date, bookingSettings.blocked_dates || []);
    if (blockedCheck.blocked) {
      return NextResponse.json({
        date,
        slots: [],
        is_closed: true,
        reason: blockedCheck.reason || 'This date is not available',
      });
    }

    // Collect blocked hours for partial blocks
    const blockedHoursForDate = blockedCheck.partial ? blockedCheck.blocked_hours : undefined;

    // Check if business is closed on this day (from business hours)
    if (!dayHours.is_open) {
      return NextResponse.json({
        date,
        slots: [],
        is_closed: true,
        reason: 'Business is closed on this day',
      });
    }

    // Get ALL appointments for the requested date (bypass RLS to see all users' appointments)
    const serviceClient = createServiceRoleClient();
    // Use local midnight boundaries with timezone offset to query the correct calendar day
    const localRef = new Date(date + 'T00:00:00');
    const tzOffset = -localRef.getTimezoneOffset();
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const tzPad = (n: number) => String(Math.abs(n)).padStart(2, '0');
    const tz = `${tzSign}${tzPad(Math.floor(Math.abs(tzOffset) / 60))}:${tzPad(Math.abs(tzOffset) % 60)}`;
    const dateStart = new Date(`${date}T00:00:00${tz}`).toISOString();
    const dateEnd = new Date(`${date}T23:59:59${tz}`).toISOString();

    const { data: appointments, error: apptError } = await (serviceClient as any)
      .from('appointments')
      .select('*')
      .gte('scheduled_at', dateStart)
      .lte('scheduled_at', dateEnd);

    if (apptError) {
      console.error('Error fetching appointments:', apptError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get buffer minutes from settings
    const bufferMinutes = bookingSettings.buffer_minutes || 0;

    // Generate available slots — getAvailableSlots handles buffer internally
    const slots = getAvailableSlots(
      date,
      service.duration_minutes,
      appointments || [],
      businessHours,
      bookingSettings,
      blockedHoursForDate
    );

    // Get waitlist counts for unavailable slots (only when waitlist is enabled)
    if (!config.features.waitlistEnabled) {
      return NextResponse.json({ date, slots });
    }

    const { data: waitlistEntries } = await (serviceClient as any)
      .from('waitlist')
      .select('*')
      .eq('requested_date', date)
      .eq('status', 'active');

    // Helper function to check if a time slot matches a time preference
    const matchesTimePreference = (slotTime: string, preference: 'morning' | 'afternoon' | 'any'): boolean => {
      if (preference === 'any') {
        return true;
      }

      const slotMinutes = timeToMinutes(slotTime);
      const noonMinutes = 12 * 60; // 720 minutes

      if (preference === 'morning') {
        return slotMinutes < noonMinutes;
      } else {
        // afternoon
        return slotMinutes >= noonMinutes;
      }
    };

    // Map waitlist counts to slots
    const slotsWithWaitlist: TimeSlot[] = slots.map((slot) => {
      if (slot.available) {
        return slot;
      }

      // Count waitlist entries that match this slot's time preference
      const waitlistCount = (waitlistEntries || []).filter((entry: any) =>
        matchesTimePreference(slot.time, entry.time_preference)
      ).length;

      return {
        ...slot,
        waitlistCount,
      };
    });

    return NextResponse.json({ date, slots: slotsWithWaitlist });
  } catch (error) {
    console.error('Error calculating availability:', error);
    return NextResponse.json(
      { error: 'Failed to calculate availability' },
      { status: 500 }
    );
  }
}
