/**
 * Timezone utilities for The Puppy Day
 * Business is located in La Mirada, CA (America/Los_Angeles timezone)
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';

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
