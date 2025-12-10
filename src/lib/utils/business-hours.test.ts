/**
 * Unit tests for business hours utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isCurrentlyOpen,
  getNextOpenTime,
  formatTime,
  getCurrentDayName,
} from './business-hours';

describe('Business Hours Utilities', () => {
  describe('formatTime', () => {
    it('should format 12:00 as 12:00 PM', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('should format 00:00 as 12:00 AM', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    it('should format 14:30 as 2:30 PM', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
    });

    it('should format 09:15 as 9:15 AM', () => {
      expect(formatTime('09:15')).toBe('9:15 AM');
    });

    it('should format 23:59 as 11:59 PM', () => {
      expect(formatTime('23:59')).toBe('11:59 PM');
    });
  });

  describe('getCurrentDayName', () => {
    it('should return lowercase day name', () => {
      const dayName = getCurrentDayName();
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      expect(validDays).toContain(dayName);
    });
  });

  describe('isCurrentlyOpen', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it('should return false when business is closed', () => {
      // Mock current time to Monday 8:00 AM
      vi.setSystemTime(new Date('2024-01-01T08:00:00'));

      const businessHours = {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '10:00', close: '16:00', is_open: true },
        sunday: { open: '10:00', close: '16:00', is_open: false },
      };

      expect(isCurrentlyOpen(businessHours)).toBe(false);
      vi.useRealTimers();
    });

    it('should return true when business is open', () => {
      // Mock current time to Monday 10:00 AM
      vi.setSystemTime(new Date('2024-01-01T10:00:00'));

      const businessHours = {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '10:00', close: '16:00', is_open: true },
        sunday: { open: '10:00', close: '16:00', is_open: false },
      };

      expect(isCurrentlyOpen(businessHours)).toBe(true);
      vi.useRealTimers();
    });

    it('should return false when day is marked as closed', () => {
      // Mock current time to Sunday 12:00 PM
      vi.setSystemTime(new Date('2024-01-07T12:00:00'));

      const businessHours = {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '10:00', close: '16:00', is_open: true },
        sunday: { open: '10:00', close: '16:00', is_open: false },
      };

      expect(isCurrentlyOpen(businessHours)).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('getNextOpenTime', () => {
    it('should return "Today at" if opening is later today', () => {
      // Mock current time to Monday 8:00 AM
      vi.setSystemTime(new Date('2024-01-01T08:00:00'));

      const businessHours = {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '10:00', close: '16:00', is_open: true },
        sunday: { open: '10:00', close: '16:00', is_open: false },
      };

      const result = getNextOpenTime(businessHours);
      expect(result).toContain('Today at 9:00 AM');
      vi.useRealTimers();
    });

    it('should return "Tomorrow at" if next opening is tomorrow', () => {
      // Mock current time to Monday 6:00 PM (after closing)
      vi.setSystemTime(new Date('2024-01-01T18:00:00'));

      const businessHours = {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '10:00', close: '16:00', is_open: true },
        sunday: { open: '10:00', close: '16:00', is_open: false },
      };

      const result = getNextOpenTime(businessHours);
      expect(result).toContain('Tomorrow at 9:00 AM');
      vi.useRealTimers();
    });
  });
});
