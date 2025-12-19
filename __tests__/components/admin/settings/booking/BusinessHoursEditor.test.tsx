/**
 * Tests for Business Hours Editor Component
 * Task 0184: Business hours validation and logic tests
 */

import { describe, it, expect } from 'vitest';
import type { TimeRange, DayHours, BusinessHours } from '@/types/settings';

// ===== VALIDATION FUNCTIONS (extracted for testing) =====

function validateTimeRange(range: TimeRange): string | null {
  if (range.start >= range.end) {
    return 'Close time must be after open time';
  }
  return null;
}

function validateNoOverlap(ranges: TimeRange[]): string | null {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const r1 = ranges[i];
      const r2 = ranges[j];

      if (
        (r1.start >= r2.start && r1.start < r2.end) ||
        (r1.end > r2.start && r1.end <= r2.end) ||
        (r2.start >= r1.start && r2.start < r1.end) ||
        (r2.end > r1.start && r2.end <= r1.end)
      ) {
        return `Time ranges ${i + 1} and ${j + 1} overlap`;
      }
    }
  }
  return null;
}

function validateBusinessHours(hours: BusinessHours): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  const allClosed = DAYS.every((day) => !hours[day].isOpen);
  if (allClosed) {
    warnings.push('All days are closed - customers cannot book appointments');
  }

  for (const day of DAYS) {
    const dayHours = hours[day];
    if (!dayHours.isOpen) continue;

    for (let i = 0; i < dayHours.ranges.length; i++) {
      const range = dayHours.ranges[i];
      const rangeError = validateTimeRange(range);
      if (rangeError) {
        warnings.push(`${day}, Range ${i + 1}: ${rangeError}`);
      }
    }

    const overlapError = validateNoOverlap(dayHours.ranges);
    if (overlapError) {
      warnings.push(`${day}: ${overlapError}`);
    }

    if (dayHours.ranges.length === 0) {
      warnings.push(`${day}: Marked as open but no time ranges set`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// ===== TESTS =====

describe('Business Hours Editor - Time Range Validation', () => {
  it('should validate valid time range', () => {
    const validRange: TimeRange = { start: '09:00', end: '17:00' };
    expect(validateTimeRange(validRange)).toBeNull();
  });

  it('should reject when end time is before start time', () => {
    const invalidRange: TimeRange = { start: '17:00', end: '09:00' };
    expect(validateTimeRange(invalidRange)).toBe('Close time must be after open time');
  });

  it('should reject when end time equals start time', () => {
    const invalidRange: TimeRange = { start: '09:00', end: '09:00' };
    expect(validateTimeRange(invalidRange)).toBe('Close time must be after open time');
  });
});

describe('Business Hours Editor - Overlap Detection', () => {
  it('should allow non-overlapping ranges', () => {
    const ranges: TimeRange[] = [
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ];
    expect(validateNoOverlap(ranges)).toBeNull();
  });

  it('should detect overlapping ranges (full overlap)', () => {
    const ranges: TimeRange[] = [
      { start: '09:00', end: '17:00' },
      { start: '10:00', end: '15:00' },
    ];
    expect(validateNoOverlap(ranges)).toBe('Time ranges 1 and 2 overlap');
  });

  it('should detect overlapping ranges (partial overlap at start)', () => {
    const ranges: TimeRange[] = [
      { start: '09:00', end: '13:00' },
      { start: '12:00', end: '17:00' },
    ];
    expect(validateNoOverlap(ranges)).toBe('Time ranges 1 and 2 overlap');
  });

  it('should detect overlapping ranges (partial overlap at end)', () => {
    const ranges: TimeRange[] = [
      { start: '12:00', end: '17:00' },
      { start: '09:00', end: '13:00' },
    ];
    expect(validateNoOverlap(ranges)).toBe('Time ranges 1 and 2 overlap');
  });

  it('should allow adjacent ranges (no gap)', () => {
    const ranges: TimeRange[] = [
      { start: '09:00', end: '12:00' },
      { start: '12:00', end: '17:00' },
    ];
    // Adjacent ranges should be allowed (end of one = start of next)
    expect(validateNoOverlap(ranges)).toBeNull();
  });

  it('should handle three ranges correctly', () => {
    const validRanges: TimeRange[] = [
      { start: '09:00', end: '11:00' },
      { start: '11:30', end: '13:30' },
      { start: '14:00', end: '17:00' },
    ];
    expect(validateNoOverlap(validRanges)).toBeNull();

    const overlappingRanges: TimeRange[] = [
      { start: '09:00', end: '11:00' },
      { start: '11:30', end: '14:30' }, // Overlaps with third range
      { start: '14:00', end: '17:00' },
    ];
    expect(validateNoOverlap(overlappingRanges)).toBe('Time ranges 2 and 3 overlap');
  });
});

describe('Business Hours Editor - Weekly Validation', () => {
  const createDayHours = (isOpen: boolean, ranges: TimeRange[]): DayHours => ({
    isOpen,
    ranges,
  });

  const createBusinessHours = (overrides: Partial<BusinessHours> = {}): BusinessHours => ({
    monday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    tuesday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    wednesday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    thursday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    friday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    saturday: createDayHours(true, [{ start: '09:00', end: '17:00' }]),
    sunday: createDayHours(false, []),
    ...overrides,
  });

  it('should validate normal business hours', () => {
    const hours = createBusinessHours();
    const result = validateBusinessHours(hours);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn when all days are closed', () => {
    const hours = createBusinessHours({
      monday: createDayHours(false, []),
      tuesday: createDayHours(false, []),
      wednesday: createDayHours(false, []),
      thursday: createDayHours(false, []),
      friday: createDayHours(false, []),
      saturday: createDayHours(false, []),
      sunday: createDayHours(false, []),
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(false);
    expect(result.warnings).toContain('All days are closed - customers cannot book appointments');
  });

  it('should detect invalid time ranges in specific days', () => {
    const hours = createBusinessHours({
      monday: createDayHours(true, [{ start: '17:00', end: '09:00' }]), // Invalid
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(false);
    expect(result.warnings.some((w) => w.includes('monday'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Close time must be after open time'))).toBe(true);
  });

  it('should detect overlapping ranges in specific days', () => {
    const hours = createBusinessHours({
      tuesday: createDayHours(true, [
        { start: '09:00', end: '13:00' },
        { start: '12:00', end: '17:00' }, // Overlaps
      ]),
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(false);
    expect(result.warnings.some((w) => w.includes('tuesday'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('overlap'))).toBe(true);
  });

  it('should detect days marked open with no ranges', () => {
    const hours = createBusinessHours({
      wednesday: createDayHours(true, []),
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(false);
    expect(result.warnings.some((w) => w.includes('wednesday'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('no time ranges set'))).toBe(true);
  });

  it('should allow split shifts (multiple ranges per day)', () => {
    const hours = createBusinessHours({
      thursday: createDayHours(true, [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' }, // Lunch break
      ]),
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should validate complex weekly schedule', () => {
    const hours = createBusinessHours({
      monday: createDayHours(true, [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ]),
      tuesday: createDayHours(true, [{ start: '08:00', end: '16:00' }]),
      wednesday: createDayHours(true, [
        { start: '09:00', end: '11:00' },
        { start: '11:30', end: '13:30' },
        { start: '14:00', end: '17:00' },
      ]),
      thursday: createDayHours(false, []),
      friday: createDayHours(true, [{ start: '10:00', end: '18:00' }]),
      saturday: createDayHours(true, [{ start: '10:00', end: '14:00' }]),
      sunday: createDayHours(false, []),
    });

    const result = validateBusinessHours(hours);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('Business Hours Editor - Time Format', () => {
  it('should handle 24-hour time format', () => {
    const range: TimeRange = { start: '00:00', end: '23:59' };
    expect(validateTimeRange(range)).toBeNull();
  });

  it('should handle midnight correctly', () => {
    const range: TimeRange = { start: '00:00', end: '09:00' };
    expect(validateTimeRange(range)).toBeNull();
  });

  it('should reject midnight as end time when start is later', () => {
    const range: TimeRange = { start: '20:00', end: '00:00' };
    expect(validateTimeRange(range)).toBe('Close time must be after open time');
  });
});
