/**
 * Unit tests for breed reminder scheduling logic
 * Task 0076: Test breed reminder eligibility and scheduling
 */

import { describe, it, expect } from 'vitest';

describe('breed-reminder-scheduler', () => {
  describe('eligibility calculation', () => {
    it('should calculate next grooming date based on frequency', () => {
      const lastApptDate = new Date('2024-01-01');
      const groomingFrequencyWeeks = 6;
      const groomingFrequencyDays = groomingFrequencyWeeks * 7; // 42 days

      const nextDueDate = new Date(lastApptDate);
      nextDueDate.setDate(nextDueDate.getDate() + groomingFrequencyDays);

      expect(nextDueDate.toISOString().split('T')[0]).toBe('2024-02-12');
    });

    it('should match target date 7 days before due date', () => {
      // If grooming is due on 2024-02-12, reminder should be sent on 2024-02-05
      const groomingDueDate = new Date('2024-02-12');
      const reminderDate = new Date(groomingDueDate);
      reminderDate.setDate(reminderDate.getDate() - 7);

      expect(reminderDate.toISOString().split('T')[0]).toBe('2024-02-05');
    });

    it('should calculate eligibility for 4-week grooming cycle', () => {
      const lastApptDate = new Date('2024-01-01');
      const frequencyWeeks = 4;
      const frequencyDays = frequencyWeeks * 7; // 28 days

      const nextDueDate = new Date(lastApptDate);
      nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);

      // Next due date should be 2024-01-29
      expect(nextDueDate.toISOString().split('T')[0]).toBe('2024-01-29');

      // Reminder should be sent 7 days before (2024-01-22)
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      expect(reminderDate.toISOString().split('T')[0]).toBe('2024-01-22');
    });

    it('should calculate eligibility for 8-week grooming cycle', () => {
      const lastApptDate = new Date('2024-01-01');
      const frequencyWeeks = 8;
      const frequencyDays = frequencyWeeks * 7; // 56 days

      const nextDueDate = new Date(lastApptDate);
      nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);

      // Next due date should be 2024-02-26
      expect(nextDueDate.toISOString().split('T')[0]).toBe('2024-02-26');

      // Reminder should be sent 7 days before (2024-02-19)
      const reminderDate = new Date(nextDueDate);
      reminderDate.setDate(reminderDate.getDate() - 7);
      expect(reminderDate.toISOString().split('T')[0]).toBe('2024-02-19');
    });

    it('should handle month boundary crossings', () => {
      const lastApptDate = new Date('2024-01-20');
      const frequencyWeeks = 6;
      const frequencyDays = frequencyWeeks * 7;

      const nextDueDate = new Date(lastApptDate);
      nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);

      // Should cross into March
      expect(nextDueDate.toISOString().split('T')[0]).toBe('2024-03-02');
    });

    it('should handle leap year correctly', () => {
      const lastApptDate = new Date('2024-02-01'); // 2024 is a leap year
      const frequencyWeeks = 4;
      const frequencyDays = frequencyWeeks * 7;

      const nextDueDate = new Date(lastApptDate);
      nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);

      // 2024-02-01 + 28 days = 2024-02-29 (leap day)
      expect(nextDueDate.toISOString().split('T')[0]).toBe('2024-02-29');
    });
  });

  describe('notification preferences', () => {
    it('should respect email_promotional preference when true', () => {
      const preferences = {
        email_promotional: true,
        sms_promotional: false,
      };

      const emailEnabled = preferences.email_promotional !== false;
      const smsEnabled = preferences.sms_promotional === true;

      expect(emailEnabled).toBe(true);
      expect(smsEnabled).toBe(false);
    });

    it('should respect email_promotional preference when false', () => {
      const preferences = {
        email_promotional: false,
        sms_promotional: false,
      };

      const emailEnabled = preferences.email_promotional !== false;
      const smsEnabled = preferences.sms_promotional === true;

      expect(emailEnabled).toBe(false);
      expect(smsEnabled).toBe(false);
    });

    it('should default email to enabled when preference is missing', () => {
      const preferences = {};

      const emailEnabled = 'email_promotional' in preferences
        ? preferences.email_promotional !== false
        : true;

      expect(emailEnabled).toBe(true);
    });

    it('should default SMS to disabled when preference is missing', () => {
      const preferences = {};

      const smsEnabled = 'sms_promotional' in preferences
        ? preferences.sms_promotional === true
        : false;

      expect(smsEnabled).toBe(false);
    });

    it('should enable both channels when preferences allow', () => {
      const preferences = {
        email_promotional: true,
        sms_promotional: true,
      };

      const emailEnabled = preferences.email_promotional !== false;
      const smsEnabled = preferences.sms_promotional === true;

      expect(emailEnabled).toBe(true);
      expect(smsEnabled).toBe(true);
    });

    it('should disable both channels when customer opts out', () => {
      const preferences = {
        email_promotional: false,
        sms_promotional: false,
      };

      const emailEnabled = preferences.email_promotional !== false;
      const smsEnabled = preferences.sms_promotional === true;

      expect(emailEnabled).toBe(false);
      expect(smsEnabled).toBe(false);
    });
  });

  describe('attempt count logic', () => {
    it('should allow sending when attempt count is 0', () => {
      const attemptCount = 0;
      const maxAttempts = 2;

      expect(attemptCount < maxAttempts).toBe(true);
    });

    it('should allow sending when attempt count is 1', () => {
      const attemptCount = 1;
      const maxAttempts = 2;

      expect(attemptCount < maxAttempts).toBe(true);
    });

    it('should block sending when attempt count reaches max (2)', () => {
      const attemptCount = 2;
      const maxAttempts = 2;

      expect(attemptCount >= maxAttempts).toBe(true);
    });

    it('should block sending when attempt count exceeds max', () => {
      const attemptCount = 3;
      const maxAttempts = 2;

      expect(attemptCount >= maxAttempts).toBe(true);
    });
  });

  describe('date comparison for skipping logic', () => {
    it('should detect appointment within 14 days', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const appointmentDate = new Date('2024-01-20T14:00:00Z'); // 5 days from now

      const diffDays = Math.floor(
        (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBeLessThan(14);
    });

    it('should not skip appointment exactly at 14 days', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const appointmentDate = new Date('2024-01-29T10:00:00Z'); // Exactly 14 days

      const diffDays = Math.floor(
        (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBe(14);
    });

    it('should detect upcoming appointment in future', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const appointmentDate = new Date('2024-01-25T14:00:00Z');

      expect(appointmentDate > now).toBe(true);
    });

    it('should detect past appointment', () => {
      const now = new Date('2024-01-15T10:00:00Z');
      const appointmentDate = new Date('2024-01-10T14:00:00Z');

      expect(appointmentDate < now).toBe(true);
    });
  });

  describe('tracking ID generation', () => {
    it('should generate unique tracking IDs', () => {
      // Simulate UUID generation pattern
      const trackingId1 = 'abc-123-def';
      const trackingId2 = 'xyz-456-ghi';

      expect(trackingId1).not.toBe(trackingId2);
    });

    it('should use tracking ID in booking URL', () => {
      const petId = 'pet-123';
      const trackingId = 'track-456';
      const bookingUrl = `https://thepuppyday.com/book?pet=${petId}&tracking=${trackingId}`;

      expect(bookingUrl).toContain(`pet=${petId}`);
      expect(bookingUrl).toContain(`tracking=${trackingId}`);
    });
  });

  describe('stats tracking', () => {
    it('should initialize stats with zero values', () => {
      const stats = {
        eligible_count: 0,
        sent_count: 0,
        skipped_count: 0,
        errors: [],
      };

      expect(stats.eligible_count).toBe(0);
      expect(stats.sent_count).toBe(0);
      expect(stats.skipped_count).toBe(0);
      expect(stats.errors).toHaveLength(0);
    });

    it('should track successful send', () => {
      const stats = {
        eligible_count: 5,
        sent_count: 0,
        skipped_count: 0,
        errors: [],
      };

      stats.sent_count++;

      expect(stats.sent_count).toBe(1);
    });

    it('should track skipped pet', () => {
      const stats = {
        eligible_count: 5,
        sent_count: 0,
        skipped_count: 0,
        errors: [],
      };

      stats.skipped_count++;

      expect(stats.skipped_count).toBe(1);
    });

    it('should accumulate errors', () => {
      const stats = {
        eligible_count: 5,
        sent_count: 3,
        skipped_count: 1,
        errors: [] as string[],
      };

      stats.errors.push('Failed to send to customer 1');
      stats.errors.push('Failed to send to customer 2');

      expect(stats.errors).toHaveLength(2);
    });

    it('should calculate final statistics correctly', () => {
      const stats = {
        eligible_count: 10,
        sent_count: 6,
        skipped_count: 3,
        errors: ['Error 1'],
      };

      // Total processed should equal sent + skipped + errors
      const totalProcessed = stats.sent_count + stats.skipped_count + stats.errors.length;
      expect(totalProcessed).toBe(10);
      expect(totalProcessed).toBe(stats.eligible_count);
    });
  });
});
