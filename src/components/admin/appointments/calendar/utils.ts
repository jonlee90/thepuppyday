/**
 * Calendar utility functions - date grid generation, slot position math
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMinutes,
  differenceInMinutes,
  startOfDay,
  isSameDay,
  setHours,
  setMinutes,
} from 'date-fns';
import type { CalendarAppointment, DayCell, TimeSlot } from './types';
import { DISPLAY_HOURS, SLOT_CONFIG, BUSINESS_HOURS } from './constants';

/**
 * Generate time slots for the time column
 */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = DISPLAY_HOURS.start; hour < DISPLAY_HOURS.end; hour++) {
    slots.push({
      hour,
      minute: 0,
      label: format(setMinutes(setHours(new Date(), hour), 0), 'h a'),
    });
  }
  return slots;
}

/**
 * Generate 30-min sub-slots for the grid background
 */
export function generateSubSlots(): { hour: number; minute: number }[] {
  const slots: { hour: number; minute: number }[] = [];
  for (let hour = DISPLAY_HOURS.start; hour < DISPLAY_HOURS.end; hour++) {
    slots.push({ hour, minute: 0 });
    slots.push({ hour, minute: 30 });
  }
  return slots;
}

/**
 * Calculate the total display minutes (for sizing the grid)
 */
export function getTotalDisplayMinutes(): number {
  return (DISPLAY_HOURS.end - DISPLAY_HOURS.start) * 60;
}

/**
 * Calculate pixel position from a time
 */
export function getPositionFromTime(date: Date): number {
  const dayStart = startOfDay(date);
  const displayStart = addMinutes(dayStart, DISPLAY_HOURS.start * 60);
  const minutes = differenceInMinutes(date, displayStart);
  return Math.max(0, minutes * SLOT_CONFIG.pixelsPerMinute);
}

/**
 * Calculate height in pixels from duration in minutes
 */
export function getHeightFromDuration(durationMinutes: number): number {
  return durationMinutes * SLOT_CONFIG.pixelsPerMinute;
}

/**
 * Calculate time from pixel position
 */
export function getTimeFromPosition(pixelY: number, referenceDate: Date): Date {
  const minutes = pixelY / SLOT_CONFIG.pixelsPerMinute;
  const dayStart = startOfDay(referenceDate);
  return addMinutes(dayStart, DISPLAY_HOURS.start * 60 + minutes);
}

/**
 * Snap a date to the nearest N-minute increment
 */
export function snapToInterval(date: Date, intervalMinutes: number = SLOT_CONFIG.snapMinutes): Date {
  const minutes = date.getMinutes();
  const snapped = Math.round(minutes / intervalMinutes) * intervalMinutes;
  const result = new Date(date);
  result.setMinutes(snapped, 0, 0);
  return result;
}

/**
 * Check if a time is within business hours
 */
export function isBusinessHour(hour: number, dayOfWeek: number): boolean {
  return (
    BUSINESS_HOURS.daysOfWeek.includes(dayOfWeek) &&
    hour >= BUSINESS_HOURS.start &&
    hour < BUSINESS_HOURS.end
  );
}

/**
 * Generate the month grid (6 weeks × 7 days)
 */
export function generateMonthGrid(
  currentDate: Date,
  appointments: CalendarAppointment[]
): DayCell[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, currentDate),
    isToday: isToday(date),
    appointments: appointments.filter((apt) =>
      isSameDay(new Date(apt.scheduled_at), date)
    ),
  }));
}

/**
 * Group appointments by groomer ID
 */
export function groupByGroomer(
  appointments: CalendarAppointment[]
): Record<string, CalendarAppointment[]> {
  const groups: Record<string, CalendarAppointment[]> = {};
  for (const apt of appointments) {
    const key = apt.groomer_id || 'unassigned';
    if (!groups[key]) groups[key] = [];
    groups[key].push(apt);
  }
  return groups;
}

/**
 * Filter appointments for a specific day
 */
export function filterAppointmentsForDay(
  appointments: CalendarAppointment[],
  date: Date
): CalendarAppointment[] {
  return appointments.filter((apt) =>
    isSameDay(new Date(apt.scheduled_at), date)
  );
}

/**
 * Format appointment time for display
 */
export function formatAppointmentTime(scheduledAt: string): string {
  return format(new Date(scheduledAt), 'h:mm a');
}

/**
 * Format appointment end time
 */
export function formatAppointmentEndTime(scheduledAt: string, durationMinutes: number): string {
  const end = addMinutes(new Date(scheduledAt), durationMinutes);
  return format(end, 'h:mm a');
}

/**
 * Get display name for a groomer
 */
export function getGroomerDisplayName(groomer: { first_name: string; last_name: string } | null): string {
  if (!groomer) return 'Unassigned';
  return `${groomer.first_name} ${groomer.last_name}`;
}

/**
 * Get customer display name
 */
export function getCustomerDisplayName(customer: { first_name: string; last_name: string } | null): string {
  if (!customer) return 'Unknown';
  return `${customer.first_name} ${customer.last_name}`;
}
