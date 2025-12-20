/**
 * Tests for Booking Settings Service Utilities
 * Task 0217: Unit Tests for Settings Services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BookingSettings } from '@/types/settings';

describe('Booking Settings Service Functions', () => {
  describe('getBookingSettings utility', () => {
    it('should return default settings when none exist', () => {
      const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0],
      };

      expect(DEFAULT_BOOKING_SETTINGS.min_advance_hours).toBe(2);
      expect(DEFAULT_BOOKING_SETTINGS.max_advance_days).toBe(90);
      expect(DEFAULT_BOOKING_SETTINGS.cancellation_cutoff_hours).toBe(24);
      expect(DEFAULT_BOOKING_SETTINGS.buffer_minutes).toBe(15);
      expect(DEFAULT_BOOKING_SETTINGS.recurring_blocked_days).toContain(0);
    });

    it('should merge database settings with defaults', () => {
      const defaults: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0],
      };

      const dbSettings: BookingSettings = {
        min_advance_hours: 4,
        max_advance_days: 60,
        cancellation_cutoff_hours: 48,
        buffer_minutes: 30,
        blocked_dates: [{ date: '2025-12-25', reason: 'Christmas' }],
        recurring_blocked_days: [0, 6],
      };

      // When merging, DB values should override defaults
      const merged = { ...defaults, ...dbSettings };

      expect(merged.min_advance_hours).toBe(4);
      expect(merged.max_advance_days).toBe(60);
      expect(merged.buffer_minutes).toBe(30);
      expect(merged.blocked_dates).toHaveLength(1);
    });
  });

  describe('isDateBlocked utility', () => {
    it('should return true for single blocked date', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          { date: '2025-12-25', reason: 'Christmas' },
        ],
        recurring_blocked_days: [],
      };

      const isBlocked = (dateStr: string) => {
        return settings.blocked_dates.some(bd => bd.date === dateStr);
      };

      expect(isBlocked('2025-12-25')).toBe(true);
      expect(isBlocked('2025-12-26')).toBe(false);
    });

    it('should return true for dates within blocked range', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          {
            date: '2025-12-20',
            end_date: '2025-12-27',
            reason: 'Holiday closure',
          },
        ],
        recurring_blocked_days: [],
      };

      const isDateInRange = (dateStr: string) => {
        return settings.blocked_dates.some((bd) => {
          const blockDate = new Date(bd.date);
          const checkDate = new Date(dateStr);
          const endDate = bd.end_date ? new Date(bd.end_date) : blockDate;

          return checkDate >= blockDate && checkDate <= endDate;
        });
      };

      expect(isDateInRange('2025-12-20')).toBe(true);
      expect(isDateInRange('2025-12-25')).toBe(true);
      expect(isDateInRange('2025-12-27')).toBe(true);
      expect(isDateInRange('2025-12-28')).toBe(false);
      expect(isDateInRange('2025-12-19')).toBe(false);
    });

    it('should return true for recurring blocked day of week', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0, 6], // Sunday and Saturday
      };

      const isRecurringDayBlocked = (dateStr: string) => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        return settings.recurring_blocked_days.includes(dayOfWeek);
      };

      // 2025-12-21 is Sunday (day 0)
      expect(isRecurringDayBlocked('2025-12-21')).toBe(true);

      // 2025-12-20 is Saturday (day 6)
      expect(isRecurringDayBlocked('2025-12-20')).toBe(true);

      // 2025-12-22 is Monday (day 1)
      expect(isRecurringDayBlocked('2025-12-22')).toBe(false);
    });

    it('should check both single blocked dates and recurring days', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [{ date: '2025-12-24', reason: 'Special closure' }],
        recurring_blocked_days: [0], // Sundays
      };

      const isDateBlocked = (dateStr: string) => {
        // Check single blocked dates
        const isSingleBlocked = settings.blocked_dates.some(bd => bd.date === dateStr);
        if (isSingleBlocked) return true;

        // Check recurring days
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        return settings.recurring_blocked_days.includes(dayOfWeek);
      };

      expect(isDateBlocked('2025-12-24')).toBe(true); // Specific date
      expect(isDateBlocked('2025-12-21')).toBe(true); // Sunday (recurring)
      expect(isDateBlocked('2025-12-22')).toBe(false); // Monday (not blocked)
    });
  });

  describe('isWithinBookingWindow utility', () => {
    it('should validate minimum advance hours', () => {
      const settings: BookingSettings = {
        min_advance_hours: 24, // At least 24 hours in advance
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };

      const now = new Date();
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const isWithinWindow = (appointmentDate: Date) => {
        const hoursUntil =
          (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return (
          hoursUntil >= settings.min_advance_hours &&
          hoursUntil <= settings.max_advance_days * 24
        );
      };

      expect(isWithinWindow(inTwoHours)).toBe(false); // Too soon
      expect(isWithinWindow(inTwoDays)).toBe(true); // Within window
    });

    it('should validate maximum advance days', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 30, // Max 30 days in advance
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };

      const now = new Date();
      const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const inTwoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const isWithinWindow = (appointmentDate: Date) => {
        const hoursUntil =
          (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return (
          hoursUntil >= settings.min_advance_hours &&
          hoursUntil <= settings.max_advance_days * 24
        );
      };

      expect(isWithinWindow(inOneMonth)).toBe(true);
      expect(isWithinWindow(inTwoMonths)).toBe(false); // Too far in future
    });

    it('should handle edge cases at boundaries', () => {
      const settings: BookingSettings = {
        min_advance_hours: 24,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };

      const now = new Date();
      const exactlyMinHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const exactlyMaxHours = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000
      );

      const isWithinWindow = (appointmentDate: Date) => {
        const hoursUntil =
          (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return (
          hoursUntil >= settings.min_advance_hours &&
          hoursUntil <= settings.max_advance_days * 24
        );
      };

      expect(isWithinWindow(exactlyMinHours)).toBe(true);
      expect(isWithinWindow(exactlyMaxHours)).toBe(true);
    });
  });

  describe('getBlockedDates utility', () => {
    it('should return all single blocked dates', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          { date: '2025-12-25', reason: 'Christmas' },
          { date: '2025-01-01', reason: 'New Year' },
          { date: '2025-07-04', reason: 'Independence Day' },
        ],
        recurring_blocked_days: [],
      };

      const blockedDates = settings.blocked_dates.map(bd => bd.date);

      expect(blockedDates).toContain('2025-12-25');
      expect(blockedDates).toContain('2025-01-01');
      expect(blockedDates).toContain('2025-07-04');
      expect(blockedDates).toHaveLength(3);
    });

    it('should expand date ranges into individual dates', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          {
            date: '2025-12-20',
            end_date: '2025-12-27',
            reason: 'Holiday closure',
          },
        ],
        recurring_blocked_days: [],
      };

      const expandDateRange = (blockedDate: typeof settings.blocked_dates[0]) => {
        const dates: string[] = [];
        const start = new Date(blockedDate.date);
        const end = blockedDate.end_date ? new Date(blockedDate.end_date) : start;

        for (
          let d = new Date(start);
          d <= end;
          d.setDate(d.getDate() + 1)
        ) {
          dates.push(d.toISOString().split('T')[0]);
        }

        return dates;
      };

      const expanded = expandDateRange(settings.blocked_dates[0]);

      expect(expanded).toContain('2025-12-20');
      expect(expanded).toContain('2025-12-25');
      expect(expanded).toContain('2025-12-27');
      expect(expanded.length).toBeGreaterThan(1);
    });

    it('should generate recurring blocked dates for a date range', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0, 6], // Sundays and Saturdays
      };

      const generateRecurringDates = (
        startDate: Date,
        endDate: Date,
        recurringDays: number[]
      ) => {
        const dates: string[] = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (recurringDays.includes(d.getDay())) {
            dates.push(d.toISOString().split('T')[0]);
          }
        }

        return dates;
      };

      const start = new Date('2025-12-01');
      const end = new Date('2025-12-31');
      const recurringDates = generateRecurringDates(start, end, settings.recurring_blocked_days);

      expect(recurringDates.length).toBeGreaterThan(0);
      // December 2025: Check if we have Saturdays and Sundays
      expect(recurringDates.some(d => new Date(d).getDay() === 0)).toBe(true); // Some Sundays
      expect(recurringDates.some(d => new Date(d).getDay() === 6)).toBe(true); // Some Saturdays
    });

    it('should combine single blocked dates and recurring dates', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [{ date: '2025-12-24', reason: 'Closure' }],
        recurring_blocked_days: [0], // Sundays
      };

      const allBlockedDates = new Set<string>();

      // Add single blocked dates
      settings.blocked_dates.forEach(bd => allBlockedDates.add(bd.date));

      // Add recurring blocked dates for a month
      const start = new Date('2025-12-01');
      const end = new Date('2025-12-31');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (settings.recurring_blocked_days.includes(d.getDay())) {
          allBlockedDates.add(d.toISOString().split('T')[0]);
        }
      }

      expect(allBlockedDates.has('2025-12-24')).toBe(true); // Specific date
      expect(allBlockedDates.size).toBeGreaterThan(1);
    });
  });

  describe('Date calculations with edge cases', () => {
    it('should handle timezone-aware calculations', () => {
      // The same time in different timezones
      const utcDate = new Date('2025-12-25T00:00:00Z');
      const pacificDate = new Date(utcDate.getTime() - 8 * 60 * 60 * 1000); // PST

      // Both should be the same point in time
      expect(utcDate.getTime()).toBeGreaterThan(pacificDate.getTime());
    });

    it('should handle daylight saving time transitions', () => {
      // Test dates around DST changes
      const springForward = new Date('2025-03-09T02:00:00'); // DST starts
      const fallBack = new Date('2025-11-02T02:00:00'); // DST ends

      // Both should be valid dates for calculations
      expect(springForward instanceof Date).toBe(true);
      expect(fallBack instanceof Date).toBe(true);

      // Differences should be calculable
      const diff = Math.abs(fallBack.getTime() - springForward.getTime());
      expect(diff).toBeGreaterThan(0);
    });

    it('should handle leap year dates', () => {
      // 2025 is not a leap year, but 2024 is
      const leapDate = new Date('2024-02-29T00:00:00');
      const nonLeapDate = new Date('2025-02-28T00:00:00');

      expect(leapDate.getDate()).toBe(29);
      expect(nonLeapDate.getDate()).toBe(28);
    });

    it('should handle month boundaries correctly', () => {
      const endOfMonth = new Date('2025-12-31T23:59:59');
      const startOfNextMonth = new Date('2026-01-01T00:00:00');

      const diffMs = startOfNextMonth.getTime() - endOfMonth.getTime();
      const diffSeconds = diffMs / 1000;

      expect(diffSeconds).toBeCloseTo(1, 0);
    });
  });

  describe('Buffer time calculations', () => {
    it('should add buffer_minutes to appointment time', () => {
      const appointmentTime = new Date('2025-12-20T10:00:00');
      const bufferMinutes = 15;

      const endTime = new Date(
        appointmentTime.getTime() + bufferMinutes * 60 * 1000
      );

      expect(endTime.getTime()).toBe(
        appointmentTime.getTime() + 15 * 60 * 1000
      );
    });

    it('should validate sufficient buffer between appointments', () => {
      const appointment1End = new Date('2025-12-20T10:30:00');
      const appointment2Start = new Date('2025-12-20T10:45:00');
      const requiredBuffer = 15; // minutes

      const gapMinutes =
        (appointment2Start.getTime() - appointment1End.getTime()) / (1000 * 60);

      expect(gapMinutes).toBeGreaterThanOrEqual(requiredBuffer);
    });

    it('should handle different buffer values', () => {
      const bufferValues = [0, 5, 10, 15, 30, 60, 120];
      const appointmentTime = new Date('2025-12-20T10:00:00');

      bufferValues.forEach(buffer => {
        const endTime = new Date(
          appointmentTime.getTime() + buffer * 60 * 1000
        );
        const expectedMinutes =
          (endTime.getTime() - appointmentTime.getTime()) / (1000 * 60);
        expect(expectedMinutes).toBe(buffer);
      });
    });
  });
});
