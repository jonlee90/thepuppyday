/**
 * Tests for Booking Settings Validation Schema
 * Task 0216: Unit Tests for Validation Logic
 */

import { describe, it, expect } from 'vitest';
import { BookingSettingsSchema, type BookingSettings } from '@/types/settings';

describe('BookingSettings Validation Schema', () => {
  describe('Valid booking window validation', () => {
    it('should accept valid min_advance_hours (0-168)', () => {
      const validValues = [0, 1, 24, 72, 168];
      validValues.forEach((hours) => {
        const settings = {
          min_advance_hours: hours,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid max_advance_days (7-365)', () => {
      const validValues = [7, 30, 90, 180, 365];
      validValues.forEach((days) => {
        const settings = {
          min_advance_hours: 2,
          max_advance_days: days,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid cancellation_cutoff_hours (0-72)', () => {
      const validValues = [0, 12, 24, 48, 72];
      validValues.forEach((hours) => {
        const settings = {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: hours,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Buffer time validation', () => {
    it('should accept buffer_minutes divisible by 5', () => {
      const validValues = [0, 5, 10, 15, 30, 60, 120];
      validValues.forEach((minutes) => {
        const settings = {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: minutes,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should accept 0-120 range for buffer_minutes', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 120,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  describe('Blocked dates validation', () => {
    it('should accept empty blocked_dates array', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should accept valid blocked_dates with reason', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          { date: '2025-12-25', reason: 'Christmas' },
          { date: '2025-01-01', reason: 'New Year' },
        ],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should accept blocked_dates with end_date range', () => {
      const settings = {
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
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  describe('Recurring blocked days validation', () => {
    it('should accept valid day numbers (0-6)', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0, 6], // Sunday and Saturday
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should accept single day in recurring_blocked_days', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0], // Sunday only
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should accept all weekdays', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [0, 1, 2, 3, 4, 5, 6],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid input rejection', () => {
    it('should reject negative min_advance_hours', () => {
      const settings = {
        min_advance_hours: -1,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject min_advance_hours > 168', () => {
      const settings = {
        min_advance_hours: 169,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject max_advance_days < 1', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 0,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject max_advance_days > 365', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 366,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject negative cancellation_cutoff_hours', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: -1,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject cancellation_cutoff_hours > 168', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 169,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject buffer_minutes > 120', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 121,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid day number in recurring_blocked_days', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [7], // Invalid: only 0-6 allowed
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format in blocked_dates', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          { date: '12/25/2025', reason: 'Invalid format' }, // Wrong format
        ],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject empty reason in blocked_dates', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [{ date: '2025-12-25', reason: '' }],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding 200 characters', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          {
            date: '2025-12-25',
            reason: 'a'.repeat(201),
          },
        ],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer values', () => {
      const settings = {
        min_advance_hours: 2.5,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });
  });

  describe('Cross-field validation', () => {
    it('should accept when all fields are present and valid', () => {
      const settings: BookingSettings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [
          {
            date: '2025-12-25',
            end_date: '2025-12-26',
            reason: 'Holiday',
          },
        ],
        recurring_blocked_days: [0],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const settings = {
        min_advance_hours: 2,
        max_advance_days: 90,
        cancellation_cutoff_hours: 24,
        buffer_minutes: 15,
        blocked_dates: [],
        recurring_blocked_days: [],
      };
      const result = BookingSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should accept boundary values for min_advance_hours', () => {
      [0, 168].forEach((hours) => {
        const settings = {
          min_advance_hours: hours,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should accept boundary values for max_advance_days', () => {
      [1, 365].forEach((days) => {
        const settings = {
          min_advance_hours: 2,
          max_advance_days: days,
          cancellation_cutoff_hours: 24,
          buffer_minutes: 15,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should accept boundary values for buffer_minutes', () => {
      [0, 120].forEach((minutes) => {
        const settings = {
          min_advance_hours: 2,
          max_advance_days: 90,
          cancellation_cutoff_hours: 24,
          buffer_minutes: minutes,
          blocked_dates: [],
          recurring_blocked_days: [],
        };
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should reject just outside boundaries', () => {
      const testCases = [
        {
          settings: {
            min_advance_hours: 169,
            max_advance_days: 90,
            cancellation_cutoff_hours: 24,
            buffer_minutes: 15,
            blocked_dates: [],
            recurring_blocked_days: [],
          },
          field: 'min_advance_hours',
        },
        {
          settings: {
            min_advance_hours: 2,
            max_advance_days: 366,
            cancellation_cutoff_hours: 24,
            buffer_minutes: 15,
            blocked_dates: [],
            recurring_blocked_days: [],
          },
          field: 'max_advance_days',
        },
        {
          settings: {
            min_advance_hours: 2,
            max_advance_days: 90,
            cancellation_cutoff_hours: 24,
            buffer_minutes: 121,
            blocked_dates: [],
            recurring_blocked_days: [],
          },
          field: 'buffer_minutes',
        },
      ];

      testCases.forEach(({ settings, field }) => {
        const result = BookingSettingsSchema.safeParse(settings);
        expect(result.success).toBe(false);
      });
    });
  });
});
