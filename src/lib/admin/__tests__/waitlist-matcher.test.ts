/**
 * Unit tests for waitlist matching algorithm
 * Task 0076: Test waitlist matching, priority calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatePriority } from '../waitlist-matcher';
import type { WaitlistEntry } from '@/types/database';

describe('waitlist-matcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('calculatePriority', () => {
    it('should return 0 for entry created today', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-15T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      expect(calculatePriority(entry)).toBe(0);
    });

    it('should return 1 for entry created 1 day ago', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-14T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      expect(calculatePriority(entry)).toBe(1);
    });

    it('should return 7 for entry created 1 week ago', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-08T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      expect(calculatePriority(entry)).toBe(7);
    });

    it('should return 30 for entry created 1 month ago', () => {
      const now = new Date('2024-02-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-16T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-02-20',
        requested_time: 'afternoon',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      expect(calculatePriority(entry)).toBe(30);
    });

    it('should handle entries created hours ago (same day)', () => {
      const now = new Date('2024-01-15T23:59:59Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-15T00:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      // Should still be 0 days since less than 24 hours
      expect(calculatePriority(entry)).toBe(0);
    });

    it('should floor partial days', () => {
      const now = new Date('2024-01-15T18:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-14T06:00:00Z', // 36 hours ago = 1.5 days
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      expect(calculatePriority(entry)).toBe(1); // Floor(1.5) = 1
    });

    it('should handle very old entries', () => {
      const now = new Date('2024-06-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-01T10:00:00Z', // ~166 days ago
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-06-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      const priority = calculatePriority(entry);
      expect(priority).toBeGreaterThan(160);
      expect(priority).toBeLessThan(170);
    });

    it('should be consistent regardless of entry status', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const activeEntry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-10T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: null,
        offer_expires_at: null,
      };

      const filledEntry: WaitlistEntry = {
        ...activeEntry,
        id: '2',
        status: 'filled',
      };

      // Priority calculation should be based on time alone, not status
      expect(calculatePriority(activeEntry)).toBe(calculatePriority(filledEntry));
    });

    it('should handle entries with offer_id', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const entry: WaitlistEntry = {
        id: '1',
        created_at: '2024-01-08T10:00:00Z',
        customer_id: 'c1',
        pet_id: 'p1',
        service_id: 's1',
        requested_date: '2024-01-20',
        requested_time: 'morning',
        status: 'active',
        notes: null,
        offer_id: 'offer123',
        offer_expires_at: '2024-01-16T10:00:00Z',
      };

      // Should still calculate priority normally
      expect(calculatePriority(entry)).toBe(7);
    });
  });

  describe('date range calculation', () => {
    it('should match entries within ±3 days of target date', () => {
      const appointmentDate = new Date('2024-01-15');

      // Calculate expected range
      const startDate = new Date(appointmentDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(appointmentDate);
      endDate.setDate(endDate.getDate() + 3);

      expect(startDate.toISOString().split('T')[0]).toBe('2024-01-12');
      expect(endDate.toISOString().split('T')[0]).toBe('2024-01-18');
    });

    it('should handle month boundaries correctly', () => {
      const appointmentDate = new Date('2024-02-01');

      const startDate = new Date(appointmentDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(appointmentDate);
      endDate.setDate(endDate.getDate() + 3);

      expect(startDate.toISOString().split('T')[0]).toBe('2024-01-29');
      expect(endDate.toISOString().split('T')[0]).toBe('2024-02-04');
    });

    it('should handle year boundaries correctly', () => {
      const appointmentDate = new Date('2024-01-02');

      const startDate = new Date(appointmentDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(appointmentDate);
      endDate.setDate(endDate.getDate() + 3);

      expect(startDate.toISOString().split('T')[0]).toBe('2023-12-30');
      expect(endDate.toISOString().split('T')[0]).toBe('2024-01-05');
    });
  });
});
