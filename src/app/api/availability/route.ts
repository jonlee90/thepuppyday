/**
 * GET /api/availability - Calculate available time slots for a specific date and service
 * Respects all booking settings: business hours, blocked dates, recurring blocked days, buffer time
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getAvailableSlots,
  DEFAULT_BUSINESS_HOURS,
  timeToMinutes,
  getDayName,
  type BusinessHours,
  type TimeSlot,
} from '@/lib/booking';
import type { BookingSettings, BlockedDate } from '@/types/settings';

/**
 * Convert new booking hours format to legacy format for getAvailableSlots
 * New format: { isOpen: boolean, ranges: [{ start: string, end: string }] }
 * Legacy format: { is_open: boolean, open: string, close: string }
 */
function convertToLegacyFormat(newFormatHours: any): BusinessHours {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const result: any = {};

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
      result[day] = dayData;
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

    // Check if business is closed on this day (from business hours)
    if (!dayHours.is_open) {
      return NextResponse.json({
        date,
        slots: [],
        is_closed: true,
        reason: 'Business is closed on this day',
      });
    }

    // Get appointments for the requested date
    const dateStart = new Date(date + 'T00:00:00').toISOString();
    const dateEnd = new Date(date + 'T23:59:59').toISOString();

    const { data: appointments, error: apptError } = await (supabase as any)
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

    // Generate available slots using utility function (duration + buffer must fit)
    const effectiveDuration = service.duration_minutes + bufferMinutes;
    const slots = getAvailableSlots(
      date,
      effectiveDuration,
      appointments || [],
      businessHours,
      bookingSettings
    );

    // Get waitlist counts for unavailable slots
    const { data: waitlistEntries } = await (supabase as any)
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
