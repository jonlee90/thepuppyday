/**
 * Unit tests for booking availability utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Appointment } from '@/types/database';
import {
  DEFAULT_BUSINESS_HOURS,
  getDayName,
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  hasConflict,
  getAvailableSlots,
  isDateAvailable,
  getDisabledDates,
  formatTimeDisplay,
  getNextAvailableDate,
  isBusinessDay,
  filterPastSlots,
  type BusinessHours,
  type TimeSlot,
} from '../availability';

describe('availability utilities', () => {
  describe('DEFAULT_BUSINESS_HOURS', () => {
    it('should have Monday-Saturday open 9am-5pm', () => {
      expect(DEFAULT_BUSINESS_HOURS.monday).toEqual({
        open: '09:00',
        close: '17:00',
        is_open: true,
      });
      expect(DEFAULT_BUSINESS_HOURS.saturday).toEqual({
        open: '09:00',
        close: '17:00',
        is_open: true,
      });
    });

    it('should have Sunday closed', () => {
      expect(DEFAULT_BUSINESS_HOURS.sunday.is_open).toBe(false);
    });
  });

  describe('getDayName', () => {
    it('should return correct day name for Sunday', () => {
      const date = new Date('2024-01-07T12:00:00'); // Sunday
      expect(getDayName(date)).toBe('sunday');
    });

    it('should return correct day name for Monday', () => {
      const date = new Date('2024-01-08T12:00:00'); // Monday
      expect(getDayName(date)).toBe('monday');
    });

    it('should return correct day name for Saturday', () => {
      const date = new Date('2024-01-13T12:00:00'); // Saturday
      expect(getDayName(date)).toBe('saturday');
    });

    it('should return correct day name for all days of week', () => {
      const days = [
        { date: '2024-01-07T12:00:00', expected: 'sunday' },
        { date: '2024-01-08T12:00:00', expected: 'monday' },
        { date: '2024-01-09T12:00:00', expected: 'tuesday' },
        { date: '2024-01-10T12:00:00', expected: 'wednesday' },
        { date: '2024-01-11T12:00:00', expected: 'thursday' },
        { date: '2024-01-12T12:00:00', expected: 'friday' },
        { date: '2024-01-13T12:00:00', expected: 'saturday' },
      ];

      days.forEach(({ date, expected }) => {
        expect(getDayName(new Date(date))).toBe(expected);
      });
    });
  });

  describe('timeToMinutes', () => {
    it('should convert midnight to 0 minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should convert 9:00 AM correctly', () => {
      expect(timeToMinutes('09:00')).toBe(540);
    });

    it('should convert 5:00 PM correctly', () => {
      expect(timeToMinutes('17:00')).toBe(1020);
    });

    it('should convert noon correctly', () => {
      expect(timeToMinutes('12:00')).toBe(720);
    });

    it('should handle times with minutes', () => {
      expect(timeToMinutes('09:30')).toBe(570);
      expect(timeToMinutes('14:45')).toBe(885);
    });

    it('should handle end of day', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    it('should convert 0 minutes to midnight', () => {
      expect(minutesToTime(0)).toBe('00:00');
    });

    it('should convert 540 minutes to 9:00', () => {
      expect(minutesToTime(540)).toBe('09:00');
    });

    it('should convert 1020 minutes to 17:00', () => {
      expect(minutesToTime(1020)).toBe('17:00');
    });

    it('should handle times with minutes', () => {
      expect(minutesToTime(570)).toBe('09:30');
      expect(minutesToTime(885)).toBe('14:45');
    });

    it('should pad single digit hours and minutes with zeros', () => {
      expect(minutesToTime(65)).toBe('01:05');
      expect(minutesToTime(5)).toBe('00:05');
    });

    it('should be inverse of timeToMinutes', () => {
      const times = ['09:00', '12:30', '17:45', '23:59'];
      times.forEach((time) => {
        expect(minutesToTime(timeToMinutes(time))).toBe(time);
      });
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate 30-minute intervals', () => {
      const slots = generateTimeSlots('09:00', '11:00');
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('should generate full business day slots (9am-5pm)', () => {
      const slots = generateTimeSlots('09:00', '17:00');
      expect(slots).toHaveLength(16); // 8 hours * 2 slots per hour
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:30');
    });

    it('should not include closing time', () => {
      const slots = generateTimeSlots('09:00', '10:00');
      expect(slots).toEqual(['09:00', '09:30']);
      expect(slots).not.toContain('10:00');
    });

    it('should handle single slot', () => {
      const slots = generateTimeSlots('09:00', '09:30');
      expect(slots).toEqual(['09:00']);
    });

    it('should return empty array when open time equals close time', () => {
      const slots = generateTimeSlots('09:00', '09:00');
      expect(slots).toEqual([]);
    });

    it('should handle afternoon times', () => {
      const slots = generateTimeSlots('14:00', '16:00');
      expect(slots).toEqual(['14:00', '14:30', '15:00', '15:30']);
    });
  });

  describe('hasConflict', () => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        created_at: '2024-01-01',
        customer_id: 'cust1',
        pet_id: 'pet1',
        service_id: 'svc1',
        groomer_id: null,
        scheduled_at: '2024-01-15T10:00:00',
        duration_minutes: 60,
        status: 'confirmed',
        payment_status: 'pending',
        total_price: 50,
        notes: null,
        updated_at: '2024-01-01',
      },
      {
        id: '2',
        created_at: '2024-01-01',
        customer_id: 'cust2',
        pet_id: 'pet2',
        service_id: 'svc1',
        groomer_id: null,
        scheduled_at: '2024-01-15T14:30:00',
        duration_minutes: 90,
        status: 'confirmed',
        payment_status: 'pending',
        total_price: 70,
        notes: null,
        updated_at: '2024-01-01',
      },
    ];

    it('should detect conflict with existing appointment', () => {
      const conflict = hasConflict('10:30', 60, mockAppointments, '2024-01-15');
      expect(conflict).toBe(true);
    });

    it('should detect conflict at exact start time', () => {
      const conflict = hasConflict('10:00', 30, mockAppointments, '2024-01-15');
      expect(conflict).toBe(true);
    });

    it('should not detect conflict when slot ends exactly when existing starts', () => {
      // A slot from 09:00-10:00 should NOT conflict with appointment at 10:00
      // This allows back-to-back bookings
      const conflict = hasConflict('09:00', 60, mockAppointments, '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should not detect conflict before existing appointment', () => {
      const conflict = hasConflict('08:00', 60, mockAppointments, '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should not detect conflict after existing appointment', () => {
      const conflict = hasConflict('11:00', 60, mockAppointments, '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should not detect conflict on different date', () => {
      const conflict = hasConflict('10:00', 60, mockAppointments, '2024-01-16');
      expect(conflict).toBe(false);
    });

    it('should ignore cancelled appointments', () => {
      const cancelledAppointments: Appointment[] = [
        {
          ...mockAppointments[0],
          status: 'cancelled',
        },
      ];
      const conflict = hasConflict('10:00', 60, cancelledAppointments, '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should ignore no-show appointments', () => {
      const noShowAppointments: Appointment[] = [
        {
          ...mockAppointments[0],
          status: 'no_show',
        },
      ];
      const conflict = hasConflict('10:00', 60, noShowAppointments, '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should handle empty appointments array', () => {
      const conflict = hasConflict('10:00', 60, [], '2024-01-15');
      expect(conflict).toBe(false);
    });

    it('should detect conflict with long duration appointment', () => {
      const conflict = hasConflict('15:00', 60, mockAppointments, '2024-01-15');
      expect(conflict).toBe(true);
    });

    it('should handle appointment that spans across the proposed slot', () => {
      const conflict = hasConflict('14:45', 30, mockAppointments, '2024-01-15');
      expect(conflict).toBe(true);
    });
  });

  describe('getAvailableSlots', () => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        created_at: '2024-01-01',
        customer_id: 'cust1',
        pet_id: 'pet1',
        service_id: 'svc1',
        groomer_id: null,
        scheduled_at: '2024-01-15T10:00:00',
        duration_minutes: 60,
        status: 'confirmed',
        payment_status: 'pending',
        total_price: 50,
        notes: null,
        updated_at: '2024-01-01',
      },
    ];

    it('should return available slots for a business day', () => {
      const slots = getAvailableSlots(
        '2024-01-15',
        60,
        mockAppointments,
        DEFAULT_BUSINESS_HOURS
      );

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('time');
      expect(slots[0]).toHaveProperty('available');
    });

    it('should mark conflicting slots as unavailable', () => {
      const slots = getAvailableSlots(
        '2024-01-15',
        60,
        mockAppointments,
        DEFAULT_BUSINESS_HOURS
      );

      const conflictingSlot = slots.find((s) => s.time === '10:00');
      expect(conflictingSlot?.available).toBe(false);
    });

    it('should mark non-conflicting slots as available', () => {
      const slots = getAvailableSlots(
        '2024-01-15',
        60,
        mockAppointments,
        DEFAULT_BUSINESS_HOURS
      );

      const availableSlot = slots.find((s) => s.time === '12:00');
      expect(availableSlot?.available).toBe(true);
    });

    it('should return empty array for closed days', () => {
      const slots = getAvailableSlots(
        '2024-01-14', // Sunday
        60,
        [],
        DEFAULT_BUSINESS_HOURS
      );

      expect(slots).toEqual([]);
    });

    it('should exclude slots that do not fit service duration before closing', () => {
      const slots = getAvailableSlots(
        '2024-01-15',
        120, // 2 hours
        [],
        DEFAULT_BUSINESS_HOURS
      );

      // Last slot should be at 15:00 (3pm) to fit 2 hours before 17:00 (5pm)
      const lastSlot = slots[slots.length - 1];
      expect(timeToMinutes(lastSlot.time) + 120).toBeLessThanOrEqual(
        timeToMinutes('17:00')
      );
    });

    it('should handle empty appointments array', () => {
      const slots = getAvailableSlots('2024-01-15', 60, [], DEFAULT_BUSINESS_HOURS);

      expect(slots.length).toBeGreaterThan(0);
      expect(slots.every((s) => s.available)).toBe(true);
    });

    it('should filter out past slots for today', () => {
      // Mock current time to 11:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T11:00:00'));

      const today = '2024-01-15';
      const slots = getAvailableSlots(today, 60, [], DEFAULT_BUSINESS_HOURS);

      // Should not include slots before 11:30 (current time + 30 min buffer)
      expect(slots.some((s) => s.time === '09:00')).toBe(false);
      expect(slots.some((s) => s.time === '11:00')).toBe(false);

      vi.useRealTimers();
    });

    it('should not filter slots for future dates', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));

      const futureDate = '2024-01-16';
      const slots = getAvailableSlots(futureDate, 60, [], DEFAULT_BUSINESS_HOURS);

      // Should include morning slots for future dates
      expect(slots.some((s) => s.time === '09:00')).toBe(true);

      vi.useRealTimers();
    });

    it('should handle custom business hours', () => {
      const customHours: BusinessHours = {
        ...DEFAULT_BUSINESS_HOURS,
        monday: { open: '08:00', close: '12:00', is_open: true },
      };

      const slots = getAvailableSlots('2024-01-08', 60, [], customHours); // Monday

      expect(slots[0].time).toBe('08:00');
      const lastSlot = slots[slots.length - 1];
      expect(timeToMinutes(lastSlot.time) + 60).toBeLessThanOrEqual(
        timeToMinutes('12:00')
      );
    });
  });

  describe('isDateAvailable', () => {
    it('should return true for business days in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      expect(isDateAvailable('2024-01-16', DEFAULT_BUSINESS_HOURS)).toBe(true);

      vi.useRealTimers();
    });

    it('should return true for today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      expect(isDateAvailable('2024-01-15', DEFAULT_BUSINESS_HOURS)).toBe(true);

      vi.useRealTimers();
    });

    it('should return false for past dates', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      expect(isDateAvailable('2024-01-14', DEFAULT_BUSINESS_HOURS)).toBe(false);

      vi.useRealTimers();
    });

    it('should return false for closed days (Sunday)', () => {
      expect(isDateAvailable('2024-01-14', DEFAULT_BUSINESS_HOURS)).toBe(false); // Sunday
    });

    it('should return true for open days (Monday)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01'));

      expect(isDateAvailable('2024-01-08', DEFAULT_BUSINESS_HOURS)).toBe(true); // Monday

      vi.useRealTimers();
    });

    it('should handle custom business hours with different closed days', () => {
      const customHours: BusinessHours = {
        ...DEFAULT_BUSINESS_HOURS,
        monday: { ...DEFAULT_BUSINESS_HOURS.monday, is_open: false },
      };

      expect(isDateAvailable('2024-01-08', customHours)).toBe(false); // Monday now closed
    });
  });

  describe('isBusinessDay', () => {
    it('should work identically to isDateAvailable', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));

      const date = '2024-01-16';
      expect(isBusinessDay(date, DEFAULT_BUSINESS_HOURS)).toBe(
        isDateAvailable(date, DEFAULT_BUSINESS_HOURS)
      );

      vi.useRealTimers();
    });

    it('should return true for open business days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));

      expect(isBusinessDay('2024-01-16', DEFAULT_BUSINESS_HOURS)).toBe(true); // Tuesday

      vi.useRealTimers();
    });

    it('should return false for closed days', () => {
      expect(isBusinessDay('2024-01-14', DEFAULT_BUSINESS_HOURS)).toBe(false); // Sunday
    });
  });

  describe('getDisabledDates', () => {
    it('should include past dates', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15'));

      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-20');
      const disabled = getDisabledDates(startDate, endDate, DEFAULT_BUSINESS_HOURS);

      expect(disabled).toContain('2024-01-10');
      expect(disabled).toContain('2024-01-14');

      vi.useRealTimers();
    });

    it('should include closed days (Sundays)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));

      const startDate = new Date('2024-01-15T12:00:00');
      const endDate = new Date('2024-01-22T12:00:00');
      const disabled = getDisabledDates(startDate, endDate, DEFAULT_BUSINESS_HOURS);

      expect(disabled).toContain('2024-01-21'); // Sunday

      vi.useRealTimers();
    });

    it('should not include future open days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));

      const startDate = new Date('2024-01-15T12:00:00');
      const endDate = new Date('2024-01-17T12:00:00');
      const disabled = getDisabledDates(startDate, endDate, DEFAULT_BUSINESS_HOURS);

      expect(disabled).not.toContain('2024-01-15'); // Monday
      expect(disabled).not.toContain('2024-01-16'); // Tuesday

      vi.useRealTimers();
    });

    it('should handle custom business hours', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));

      const customHours: BusinessHours = {
        ...DEFAULT_BUSINESS_HOURS,
        monday: { ...DEFAULT_BUSINESS_HOURS.monday, is_open: false },
      };

      const startDate = new Date('2024-01-08T12:00:00');
      const endDate = new Date('2024-01-10T12:00:00');
      const disabled = getDisabledDates(startDate, endDate, customHours);

      expect(disabled).toContain('2024-01-08'); // Monday now closed

      vi.useRealTimers();
    });

    it('should handle single day range', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));

      const date = new Date('2024-01-14T12:00:00'); // Sunday
      const disabled = getDisabledDates(date, date, DEFAULT_BUSINESS_HOURS);

      expect(disabled).toEqual(['2024-01-14']);

      vi.useRealTimers();
    });
  });

  describe('formatTimeDisplay', () => {
    it('should format morning times in 12-hour format', () => {
      expect(formatTimeDisplay('09:00')).toBe('9:00 AM');
      expect(formatTimeDisplay('09:30')).toBe('9:30 AM');
    });

    it('should format afternoon times in 12-hour format', () => {
      expect(formatTimeDisplay('14:00')).toBe('2:00 PM');
      expect(formatTimeDisplay('17:00')).toBe('5:00 PM');
    });

    it('should format midnight correctly', () => {
      expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    });

    it('should format noon correctly', () => {
      expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
    });

    it('should format 1 AM correctly', () => {
      expect(formatTimeDisplay('01:00')).toBe('1:00 AM');
    });

    it('should format 1 PM correctly', () => {
      expect(formatTimeDisplay('13:00')).toBe('1:00 PM');
    });

    it('should pad minutes with zero', () => {
      expect(formatTimeDisplay('09:05')).toBe('9:05 AM');
      expect(formatTimeDisplay('14:05')).toBe('2:05 PM');
    });

    it('should handle times with non-zero minutes', () => {
      expect(formatTimeDisplay('09:45')).toBe('9:45 AM');
      expect(formatTimeDisplay('14:15')).toBe('2:15 PM');
    });
  });

  describe('getNextAvailableDate', () => {
    it('should return today if today is available', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00')); // Monday

      const nextDate = getNextAvailableDate(DEFAULT_BUSINESS_HOURS);
      expect(nextDate).toBe('2024-01-15');

      vi.useRealTimers();
    });

    it('should skip to next available day if today is closed', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-14T12:00:00')); // Sunday (closed)

      const nextDate = getNextAvailableDate(DEFAULT_BUSINESS_HOURS);
      expect(nextDate).toBe('2024-01-15'); // Monday

      vi.useRealTimers();
    });

    it('should handle multiple consecutive closed days', () => {
      const customHours: BusinessHours = {
        ...DEFAULT_BUSINESS_HOURS,
        monday: { ...DEFAULT_BUSINESS_HOURS.monday, is_open: false },
        tuesday: { ...DEFAULT_BUSINESS_HOURS.tuesday, is_open: false },
      };

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-14T12:00:00')); // Sunday

      const nextDate = getNextAvailableDate(customHours);
      expect(nextDate).toBe('2024-01-17'); // Wednesday

      vi.useRealTimers();
    });

    it('should return a date within 60 days', () => {
      vi.useFakeTimers();
      const today = new Date('2024-01-01');
      vi.setSystemTime(today);

      const nextDate = getNextAvailableDate(DEFAULT_BUSINESS_HOURS);
      const nextDateObj = new Date(nextDate);
      const daysDiff = (nextDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeLessThanOrEqual(60);

      vi.useRealTimers();
    });
  });

  describe('filterPastSlots', () => {
    it('should filter out past slots when date is today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T11:00:00'));

      const slots = ['09:00', '10:00', '11:00', '12:00', '13:00'];
      const filtered = filterPastSlots(slots, '2024-01-15');

      // Should exclude slots before 11:30 (current time + 30 min buffer)
      expect(filtered).not.toContain('09:00');
      expect(filtered).not.toContain('10:00');
      expect(filtered).not.toContain('11:00');
      expect(filtered).toContain('12:00');
      expect(filtered).toContain('13:00');

      vi.useRealTimers();
    });

    it('should not filter slots when date is in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T14:00:00'));

      const slots = ['09:00', '10:00', '11:00', '12:00'];
      const filtered = filterPastSlots(slots, '2024-01-16');

      expect(filtered).toEqual(slots);

      vi.useRealTimers();
    });

    it('should handle empty slots array', () => {
      const filtered = filterPastSlots([], '2024-01-15');
      expect(filtered).toEqual([]);
    });

    it('should apply 30-minute buffer for booking ahead', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00'));

      const slots = ['10:00', '10:30', '11:00'];
      const filtered = filterPastSlots(slots, '2024-01-15');

      // Should exclude 10:00 and 10:30 (within 30 min buffer)
      expect(filtered).not.toContain('10:00');
      expect(filtered).not.toContain('10:30');
      expect(filtered).toContain('11:00');

      vi.useRealTimers();
    });

    it('should handle time exactly at buffer boundary', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00'));

      const slots = ['10:29', '10:30', '10:31', '11:00'];
      const filtered = filterPastSlots(slots, '2024-01-15');

      // 10:29 and 10:30 are at/before 10:30 (current + 30), so excluded
      // 10:31 and later should be included
      expect(filtered).not.toContain('10:29');
      expect(filtered).not.toContain('10:30');
      expect(filtered).toContain('10:31');
      expect(filtered).toContain('11:00');

      vi.useRealTimers();
    });
  });
});
