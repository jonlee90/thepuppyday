/**
 * Timezone utilities for The Puppy Day
 * Business is located in La Mirada, CA (America/Los_Angeles timezone)
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

/**
 * The business's timezone (La Mirada, CA)
 */
export const BUSINESS_TIMEZONE = 'America/Los_Angeles';

/**
 * Get the start and end of "today" in the business's timezone
 * Returns ISO strings in UTC for database queries
 */
export function getTodayInBusinessTimezone(): {
  todayStart: string;
  todayEnd: string;
} {
  const now = new Date();

  // Get current time in business timezone
  const nowInBusinessTZ = toZonedTime(now, BUSINESS_TIMEZONE);

  // Create midnight today in business timezone
  const todayMidnight = new Date(
    nowInBusinessTZ.getFullYear(),
    nowInBusinessTZ.getMonth(),
    nowInBusinessTZ.getDate(),
    0, // hours
    0, // minutes
    0, // seconds
    0  // milliseconds
  );

  // Convert to UTC
  const todayStart = fromZonedTime(todayMidnight, BUSINESS_TIMEZONE).toISOString();

  // Create midnight tomorrow in business timezone
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  const todayEnd = fromZonedTime(tomorrowMidnight, BUSINESS_TIMEZONE).toISOString();

  return {
    todayStart,
    todayEnd,
  };
}

/**
 * Get today's date string (YYYY-MM-DD) in the business timezone
 * This is useful for date input min values
 */
export function getTodayDateString(): string {
  const now = new Date();
  const nowInBusinessTZ = toZonedTime(now, BUSINESS_TIMEZONE);
  return format(nowInBusinessTZ, 'yyyy-MM-dd', { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Check if a date string (YYYY-MM-DD) is in the past relative to business timezone
 * @param dateString - Date in YYYY-MM-DD format
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false;

  const todayString = getTodayDateString();
  return dateString < todayString;
}

/**
 * Get the day of week (0-6, Sunday-Saturday) for a date string in business timezone
 * @param dateString - Date in YYYY-MM-DD format
 */
export function getDayOfWeekInBusinessTimezone(dateString: string): number {
  if (!dateString) return -1;

  // Parse the date string as a local date in business timezone
  // Add time component to avoid timezone issues with Date parsing
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid DST issues

  // Convert to business timezone and get day of week
  const dateInBusinessTZ = toZonedTime(date, BUSINESS_TIMEZONE);
  return dateInBusinessTZ.getDay();
}

/**
 * Check if a date string falls on a Sunday in business timezone
 * @param dateString - Date in YYYY-MM-DD format
 */
export function isSundayInBusinessTimezone(dateString: string): boolean {
  return getDayOfWeekInBusinessTimezone(dateString) === 0;
}

/**
 * Format a date string for display in business timezone
 * @param dateString - Date in YYYY-MM-DD format
 * @param formatStr - Format string (date-fns format)
 */
export function formatDateInBusinessTimezone(dateString: string, formatStr: string = 'EEEE, MMMM d, yyyy'): string {
  if (!dateString) return '';

  // Parse the date string
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  return format(date, formatStr, { timeZone: BUSINESS_TIMEZONE });
}
