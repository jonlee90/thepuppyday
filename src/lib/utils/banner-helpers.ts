/**
 * Banner management helper functions
 * Tasks 0173-0176: Timezone conversions and formatting
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { BUSINESS_TIMEZONE } from './timezone';

/**
 * Convert datetime-local string (in Pacific Time) to ISO UTC string for API
 * Input: "2025-12-18T14:30" (Pacific Time)
 * Output: "2025-12-18T22:30:00.000Z" (UTC)
 */
export function localDateTimeToUTC(localDateTime: string): string | null {
  if (!localDateTime) return null;

  // Parse as Pacific Time
  const date = new Date(localDateTime);

  // Convert to UTC
  const utcDate = fromZonedTime(date, BUSINESS_TIMEZONE);

  return utcDate.toISOString();
}

/**
 * Convert ISO UTC string from API to datetime-local format (Pacific Time)
 * Input: "2025-12-18T22:30:00.000Z" (UTC)
 * Output: "2025-12-18T14:30" (Pacific Time, datetime-local format)
 */
export function utcToLocalDateTime(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);

  // Convert to Pacific Time
  const pacificDate = toZonedTime(date, BUSINESS_TIMEZONE);

  // Format as datetime-local input value
  return format(pacificDate, "yyyy-MM-dd'T'HH:mm", { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Format date for display with timezone indicator
 */
export function formatDateTimeWithTZ(isoString: string): string {
  const date = new Date(isoString);
  const pacificDate = toZonedTime(date, BUSINESS_TIMEZONE);

  return format(pacificDate, 'PPp', { timeZone: BUSINESS_TIMEZONE }) + ' PT';
}

/**
 * Format date/time in Pacific timezone for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
