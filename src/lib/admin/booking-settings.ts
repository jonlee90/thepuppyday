/**
 * Booking settings utilities
 * Provides cached access to booking settings for availability calculations
 */

import type { BookingSettings } from '@/types/settings';

// Simple in-memory cache
let cachedSettings: BookingSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Fetch booking settings from API with caching
 */
export async function getBookingSettings(): Promise<BookingSettings> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedSettings;
  }

  // Fetch from API
  const response = await fetch('/api/admin/settings/booking');

  if (!response.ok) {
    throw new Error('Failed to fetch booking settings');
  }

  const { data } = await response.json();

  // Update cache
  cachedSettings = data;
  cacheTimestamp = now;

  return data;
}

/**
 * Clear settings cache (call after updating settings)
 */
export function clearBookingSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

/**
 * Check if a date is blocked
 */
export function isDateBlocked(
  date: string,
  blockedDates: BookingSettings['blocked_dates'],
  recurringBlockedDays: BookingSettings['recurring_blocked_days']
): boolean {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  // Check recurring blocks
  if (recurringBlockedDays.includes(dayOfWeek)) {
    return true;
  }

  // Check specific blocked dates
  for (const blocked of blockedDates) {
    if (blocked.end_date) {
      // Date range
      if (date >= blocked.date && date <= blocked.end_date) {
        return true;
      }
    } else {
      // Single date
      if (date === blocked.date) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get earliest bookable datetime based on min_advance_hours
 */
export function getEarliestBookableTime(minAdvanceHours: number): Date {
  const now = new Date();
  const earliest = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  return earliest;
}

/**
 * Get latest bookable date based on max_advance_days
 */
export function getLatestBookableDate(maxAdvanceDays: number): string {
  const now = new Date();
  const latest = new Date(now);
  latest.setDate(latest.getDate() + maxAdvanceDays);
  return latest.toISOString().split('T')[0];
}

/**
 * Check if a datetime is within booking window
 */
export function isWithinBookingWindow(
  date: string,
  time: string,
  minAdvanceHours: number,
  maxAdvanceDays: number
): {
  allowed: boolean;
  reason?: 'too_soon' | 'too_far' | 'blocked';
} {
  const slotDateTime = new Date(`${date}T${time}:00`);
  const now = new Date();

  // Check min advance
  const earliest = getEarliestBookableTime(minAdvanceHours);
  if (slotDateTime < earliest) {
    return { allowed: false, reason: 'too_soon' };
  }

  // Check max advance
  const latestDate = getLatestBookableDate(maxAdvanceDays);
  if (date > latestDate) {
    return { allowed: false, reason: 'too_far' };
  }

  return { allowed: true };
}
