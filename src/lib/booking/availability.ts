/**
 * Availability calculation utilities for booking system
 */

import type { Appointment } from '@/types/database';
import type { BookingSettings } from '@/types/settings';
import { isDateBlocked, isWithinBookingWindow } from '@/lib/admin/booking-settings';

export interface BusinessHoursDay {
  open: string; // "09:00"
  close: string; // "17:00"
  is_open: boolean;
}

export interface BusinessHours {
  monday: BusinessHoursDay;
  tuesday: BusinessHoursDay;
  wednesday: BusinessHoursDay;
  thursday: BusinessHoursDay;
  friday: BusinessHoursDay;
  saturday: BusinessHoursDay;
  sunday: BusinessHoursDay;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  waitlistCount?: number;
}

const SLOT_INTERVAL_MINUTES = 30;

/**
 * Default business hours configuration
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '17:00', is_open: true },
  tuesday: { open: '09:00', close: '17:00', is_open: true },
  wednesday: { open: '09:00', close: '17:00', is_open: true },
  thursday: { open: '09:00', close: '17:00', is_open: true },
  friday: { open: '09:00', close: '17:00', is_open: true },
  saturday: { open: '09:00', close: '17:00', is_open: true },
  sunday: { open: '09:00', close: '17:00', is_open: false },
};

/**
 * Get day name from date
 */
export function getDayName(date: Date): keyof BusinessHours {
  const days: (keyof BusinessHours)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

/**
 * Parse time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate time slots for a day within business hours
 */
export function generateTimeSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  for (let minutes = openMinutes; minutes < closeMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
}

/**
 * Check if a proposed appointment conflicts with existing appointments
 */
export function hasConflict(
  slotStart: string,
  slotDuration: number,
  existingAppointments: Appointment[],
  date: string
): boolean {
  const slotStartMinutes = timeToMinutes(slotStart);
  const slotEndMinutes = slotStartMinutes + slotDuration;

  for (const appointment of existingAppointments) {
    // Parse appointment date and time
    const appointmentDate = new Date(appointment.scheduled_at);
    const appointmentDateStr = appointmentDate.toISOString().split('T')[0];

    // Skip if different date
    if (appointmentDateStr !== date) continue;

    // Skip cancelled/no-show appointments
    if (appointment.status === 'cancelled' || appointment.status === 'no_show') continue;

    // Get appointment time in minutes
    const appointmentHours = appointmentDate.getHours();
    const appointmentMinutes = appointmentDate.getMinutes();
    const appointmentStartMinutes = appointmentHours * 60 + appointmentMinutes;
    const appointmentEndMinutes = appointmentStartMinutes + appointment.duration_minutes;

    // Check for overlap
    const hasOverlap =
      slotStartMinutes < appointmentEndMinutes && slotEndMinutes > appointmentStartMinutes;

    if (hasOverlap) return true;
  }

  return false;
}

/**
 * Get available time slots for a specific date
 */
export function getAvailableSlots(
  date: string,
  serviceDuration: number,
  existingAppointments: Appointment[],
  businessHours: BusinessHours,
  bookingSettings?: BookingSettings
): TimeSlot[] {
  const dateObj = new Date(date + 'T00:00:00');
  const dayName = getDayName(dateObj);
  const dayHours = businessHours[dayName];

  // If business is closed, return empty
  if (!dayHours.is_open) {
    return [];
  }

  // Check if date is blocked
  if (bookingSettings && isDateBlocked(date, bookingSettings.blocked_dates, bookingSettings.recurring_blocked_days)) {
    return [];
  }

  // Generate all possible slots
  const allSlots = generateTimeSlots(dayHours.open, dayHours.close);

  // Check if today and filter past slots
  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();

  // Use min_advance_hours from settings or default 30 min
  const minAdvanceMinutes = bookingSettings
    ? bookingSettings.min_advance_hours * 60
    : 30;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter and check availability
  const slots: TimeSlot[] = allSlots
    .filter((slotTime) => {
      const slotMinutes = timeToMinutes(slotTime);

      // Filter out past slots if today with min advance
      if (isToday) {
        if (slotMinutes <= currentMinutes + minAdvanceMinutes) return false;
      }

      // Check booking window
      if (bookingSettings) {
        const windowCheck = isWithinBookingWindow(
          date,
          slotTime,
          bookingSettings.min_advance_hours,
          bookingSettings.max_advance_days
        );
        if (!windowCheck.allowed) return false;
      }

      // Check if slot + duration fits within business hours
      const closeMinutes = timeToMinutes(dayHours.close);

      // Add buffer_minutes from settings
      const bufferMinutes = bookingSettings?.buffer_minutes || 0;
      if (slotMinutes + serviceDuration + bufferMinutes > closeMinutes) return false;

      return true;
    })
    .map((slotTime) => {
      // Pass buffer to conflict check
      const bufferMinutes = bookingSettings?.buffer_minutes || 0;
      const isAvailable = !hasConflict(
        slotTime,
        serviceDuration + bufferMinutes,
        existingAppointments,
        date
      );

      return {
        time: slotTime,
        available: isAvailable,
        waitlistCount: isAvailable ? undefined : 0, // TODO: Count actual waitlist entries
      };
    });

  return slots;
}

/**
 * Check if a date is available for booking (not in past, business is open)
 */
export function isDateAvailable(date: string, businessHours: BusinessHours): boolean {
  const dateObj = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Past dates are not available
  if (dateObj < today) return false;

  // Check if business is open on this day
  const dayName = getDayName(dateObj);
  return businessHours[dayName].is_open;
}

/**
 * Get disabled dates for calendar (past dates and closed days)
 */
export function getDisabledDates(
  startDate: Date,
  endDate: Date,
  businessHours: BusinessHours,
  bookingSettings?: BookingSettings
): string[] {
  const disabled: string[] = [];
  const current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate max bookable date
  const maxDate = bookingSettings
    ? new Date(today.getTime() + bookingSettings.max_advance_days * 24 * 60 * 60 * 1000)
    : null;

  while (current <= endDate) {
    // Format as YYYY-MM-DD without UTC conversion
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Past dates
    if (current < today) {
      disabled.push(dateStr);
    }
    // Dates beyond max advance
    else if (maxDate && current > maxDate) {
      disabled.push(dateStr);
    }
    // Closed days
    else {
      const dayName = getDayName(current);
      if (!businessHours[dayName].is_open) {
        disabled.push(dateStr);
      }

      // Blocked dates
      if (bookingSettings && isDateBlocked(dateStr, bookingSettings.blocked_dates, bookingSettings.recurring_blocked_days)) {
        disabled.push(dateStr);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return disabled;
}

/**
 * Format time for display (24h to 12h)
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get the next available date from today
 */
export function getNextAvailableDate(businessHours: BusinessHours): string {
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  // Check up to 60 days ahead
  for (let i = 0; i < 60; i++) {
    const dateStr = current.toISOString().split('T')[0];
    if (isDateAvailable(dateStr, businessHours)) {
      return dateStr;
    }
    current.setDate(current.getDate() + 1);
  }

  // Fallback to today if no available date found
  return new Date().toISOString().split('T')[0];
}

/**
 * Alias for isDateAvailable to match task spec
 */
export function isBusinessDay(date: string, businessHours: BusinessHours): boolean {
  return isDateAvailable(date, businessHours);
}

/**
 * Filter past time slots when date is today
 */
export function filterPastSlots(slots: string[], date: string): string[] {
  const dateObj = new Date(date + 'T00:00:00');
  const now = new Date();
  const isToday = dateObj.toDateString() === now.toDateString();

  if (!isToday) {
    return slots;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slotTime) => {
    const slotMinutes = timeToMinutes(slotTime);
    // Add 30 min buffer for booking ahead
    return slotMinutes > currentMinutes + 30;
  });
}
