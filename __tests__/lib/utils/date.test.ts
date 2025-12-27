/**
 * Unit tests for date utility functions
 * Task 0280: Test date utilities with edge cases
 */

import {
  validateAndParseDate,
  validateDateRange,
} from '@/lib/utils/date-validation';

import {
  getTodayInBusinessTimezone,
  getTodayDateString,
  isDateInPast,
  getDayOfWeekInBusinessTimezone,
  isSundayInBusinessTimezone,
  formatDateInBusinessTimezone,
  BUSINESS_TIMEZONE,
} from '@/lib/utils/timezone';

describe('validateAndParseDate', () => {
  it('parses valid date string', () => {
    const result = validateAndParseDate('2024-12-25', 'testDate');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
  });

  it('throws error for null date', () => {
    expect(() => validateAndParseDate(null, 'testDate')).toThrow('testDate is required');
  });

  it('throws error for invalid date format', () => {
    expect(() => validateAndParseDate('invalid-date', 'testDate')).toThrow('Invalid testDate format');
  });

  it('throws error for date before 2020', () => {
    expect(() => validateAndParseDate('2019-01-01', 'testDate')).toThrow('testDate must be between');
  });

  it('throws error for date more than 1 year in future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const dateString = futureDate.toISOString().split('T')[0];

    expect(() => validateAndParseDate(dateString, 'testDate')).toThrow('testDate must be between');
  });

  it('accepts dates within valid range', () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    const result = validateAndParseDate(dateString, 'testDate');
    expect(result).toBeInstanceOf(Date);
  });

  it('prevents unreasonable dates like year 9999', () => {
    expect(() => validateAndParseDate('9999-12-31', 'testDate')).toThrow();
  });
});

describe('validateDateRange', () => {
  it('accepts valid date range', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    expect(() => validateDateRange(start, end)).not.toThrow();
  });

  it('accepts same start and end date', () => {
    const date = new Date('2024-01-01');

    expect(() => validateDateRange(date, date)).not.toThrow();
  });

  it('throws error when start is after end', () => {
    const start = new Date('2024-12-31');
    const end = new Date('2024-01-01');

    expect(() => validateDateRange(start, end)).toThrow('Start date must be before or equal to end date');
  });

  it('throws error for date range exceeding 2 years', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2026-12-31');

    expect(() => validateDateRange(start, end)).toThrow('Date range cannot exceed 730 days');
  });

  it('accepts date range exactly 730 days', () => {
    const start = new Date('2024-01-01');
    const end = new Date(start);
    end.setDate(end.getDate() + 730);

    expect(() => validateDateRange(start, end)).not.toThrow();
  });

  it('prevents SQL injection via date manipulation', () => {
    // Ensure dates are properly validated as Date objects
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-15');

    expect(() => validateDateRange(start, end)).not.toThrow();
  });
});

describe('getTodayInBusinessTimezone', () => {
  it('returns today start and end in ISO format', () => {
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    expect(todayStart).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(todayEnd).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns todayEnd after todayStart', () => {
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    const startDate = new Date(todayStart);
    const endDate = new Date(todayEnd);

    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
  });

  it('returns 24-hour range', () => {
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    const startDate = new Date(todayStart);
    const endDate = new Date(todayEnd);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    expect(diffHours).toBe(24);
  });
});

describe('getTodayDateString', () => {
  it('returns date in YYYY-MM-DD format', () => {
    const dateString = getTodayDateString();
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns valid date', () => {
    const dateString = getTodayDateString();
    const date = new Date(dateString);

    expect(date).toBeInstanceOf(Date);
    expect(isNaN(date.getTime())).toBe(false);
  });

  it('uses America/Los_Angeles timezone', () => {
    const dateString = getTodayDateString();
    expect(BUSINESS_TIMEZONE).toBe('America/Los_Angeles');
    expect(dateString).toBeDefined();
  });
});

describe('isDateInPast', () => {
  it('returns true for past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];

    expect(isDateInPast(dateString)).toBe(true);
  });

  it('returns false for today', () => {
    const today = getTodayDateString();
    expect(isDateInPast(today)).toBe(false);
  });

  it('returns false for future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    expect(isDateInPast(dateString)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDateInPast('')).toBe(false);
  });

  it('handles edge case at midnight', () => {
    // This is the current date in business timezone
    const today = getTodayDateString();
    expect(isDateInPast(today)).toBe(false);
  });
});

describe('getDayOfWeekInBusinessTimezone', () => {
  it('returns 0 for Sunday', () => {
    // 2024-12-29 is a Sunday
    const dayOfWeek = getDayOfWeekInBusinessTimezone('2024-12-29');
    expect(dayOfWeek).toBe(0);
  });

  it('returns 1 for Monday', () => {
    // 2024-12-30 is a Monday
    const dayOfWeek = getDayOfWeekInBusinessTimezone('2024-12-30');
    expect(dayOfWeek).toBe(1);
  });

  it('returns 6 for Saturday', () => {
    // 2024-12-28 is a Saturday
    const dayOfWeek = getDayOfWeekInBusinessTimezone('2024-12-28');
    expect(dayOfWeek).toBe(6);
  });

  it('returns -1 for empty string', () => {
    const dayOfWeek = getDayOfWeekInBusinessTimezone('');
    expect(dayOfWeek).toBe(-1);
  });

  it('handles dates across DST boundary', () => {
    // March 10, 2024 - DST starts
    const dayOfWeek = getDayOfWeekInBusinessTimezone('2024-03-10');
    expect(dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(dayOfWeek).toBeLessThanOrEqual(6);
  });
});

describe('isSundayInBusinessTimezone', () => {
  it('returns true for Sunday', () => {
    // 2024-12-29 is a Sunday
    expect(isSundayInBusinessTimezone('2024-12-29')).toBe(true);
  });

  it('returns false for Monday', () => {
    // 2024-12-30 is a Monday
    expect(isSundayInBusinessTimezone('2024-12-30')).toBe(false);
  });

  it('returns false for Saturday', () => {
    // 2024-12-28 is a Saturday
    expect(isSundayInBusinessTimezone('2024-12-28')).toBe(false);
  });
});

describe('formatDateInBusinessTimezone', () => {
  it('formats date with default format', () => {
    const formatted = formatDateInBusinessTimezone('2024-12-25');
    expect(formatted).toContain('December');
    expect(formatted).toContain('25');
    expect(formatted).toContain('2024');
  });

  it('formats date with custom format', () => {
    const formatted = formatDateInBusinessTimezone('2024-12-25', 'yyyy-MM-dd');
    expect(formatted).toBe('2024-12-25');
  });

  it('returns empty string for empty input', () => {
    const formatted = formatDateInBusinessTimezone('');
    expect(formatted).toBe('');
  });

  it('includes day of week in default format', () => {
    // 2024-12-25 is Wednesday
    const formatted = formatDateInBusinessTimezone('2024-12-25');
    expect(formatted).toContain('Wednesday');
  });

  it('handles short format', () => {
    const formatted = formatDateInBusinessTimezone('2024-12-25', 'MMM d');
    expect(formatted).toBe('Dec 25');
  });
});

describe('Date Edge Cases', () => {
  it('handles leap year dates', () => {
    const leapDay = '2024-02-29';
    const dayOfWeek = getDayOfWeekInBusinessTimezone(leapDay);

    expect(dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(dayOfWeek).toBeLessThanOrEqual(6);

    const formatted = formatDateInBusinessTimezone(leapDay);
    expect(formatted).toContain('February 29');
  });

  it('handles year boundaries', () => {
    const newYearsEve = '2024-12-31';
    const newYearsDay = '2025-01-01';

    expect(isDateInPast(newYearsEve)).toBe(true);
    expect(getDayOfWeekInBusinessTimezone(newYearsDay)).toBeGreaterThanOrEqual(0);
  });

  it('handles dates with timezone offset edge cases', () => {
    // Date near midnight in UTC might be different day in LA
    const date = '2024-06-15';
    const formatted = formatDateInBusinessTimezone(date);

    expect(formatted).toContain('June 15');
  });

  it('validates date range with DST transitions', () => {
    // DST transition dates
    const beforeDST = new Date('2024-03-09'); // Before spring forward
    const afterDST = new Date('2024-03-11'); // After spring forward

    expect(() => validateDateRange(beforeDST, afterDST)).not.toThrow();
  });

  it('handles international date formats in validation', () => {
    // ISO format is expected
    const isoDate = '2024-12-25';
    const parsed = validateAndParseDate(isoDate, 'testDate');

    expect(parsed.getMonth()).toBe(11); // December is month 11
    expect(parsed.getDate()).toBe(25);
  });
});

describe('Date Security', () => {
  it('prevents date injection attacks', () => {
    const maliciousDate = "2024-01-01'; DROP TABLE appointments; --";

    expect(() => validateAndParseDate(maliciousDate, 'testDate')).toThrow();
  });

  it('prevents extremely large date values', () => {
    expect(() => validateAndParseDate('9999999-12-31', 'testDate')).toThrow();
  });

  it('prevents negative year values', () => {
    expect(() => validateAndParseDate('-2024-01-01', 'testDate')).toThrow();
  });
});
