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

/**
 * Overlap layout info for a single appointment within a cluster
 */
export interface OverlapLayout {
  columnIndex: number;   // 0-based position within cluster
  totalColumns: number;  // total concurrent appointments in cluster
}

/**
 * Compute overlap layout for appointments using an interval-graph algorithm.
 * Groups overlapping appointments into clusters and assigns column indices
 * so they render side-by-side (Google Calendar style).
 */
export function computeOverlapLayout(appointments: CalendarAppointment[]): Map<string, OverlapLayout> {
  const result = new Map<string, OverlapLayout>();
  if (appointments.length === 0) return result;

  // Sort by start time, then longer duration first (so wider appointments get earlier columns)
  const sorted = [...appointments].sort((a, b) => {
    const startDiff = new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    if (startDiff !== 0) return startDiff;
    return b.duration_minutes - a.duration_minutes;
  });

  // Build clusters of overlapping appointments
  const clusters: CalendarAppointment[][] = [];
  let currentCluster: CalendarAppointment[] = [];
  let clusterEnd = 0;

  for (const apt of sorted) {
    const start = new Date(apt.scheduled_at).getTime();
    const end = start + apt.duration_minutes * 60_000;

    if (currentCluster.length === 0 || start < clusterEnd) {
      // Overlaps with current cluster
      currentCluster.push(apt);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      // No overlap — finalize current cluster and start new one
      clusters.push(currentCluster);
      currentCluster = [apt];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign columns within each cluster
  for (const cluster of clusters) {
    if (cluster.length === 1) {
      result.set(cluster[0].id, { columnIndex: 0, totalColumns: 1 });
      continue;
    }

    // Greedy column assignment
    const columns: number[] = []; // end times per column
    const assignments = new Map<string, number>();

    for (const apt of cluster) {
      const start = new Date(apt.scheduled_at).getTime();

      // Find first column where the appointment fits (column's last end <= this start)
      let col = -1;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= start) {
          col = c;
          break;
        }
      }

      if (col === -1) {
        col = columns.length;
        columns.push(0);
      }

      const end = start + apt.duration_minutes * 60_000;
      columns[col] = end;
      assignments.set(apt.id, col);
    }

    const totalColumns = columns.length;
    for (const apt of cluster) {
      result.set(apt.id, {
        columnIndex: assignments.get(apt.id)!,
        totalColumns,
      });
    }
  }

  return result;
}
