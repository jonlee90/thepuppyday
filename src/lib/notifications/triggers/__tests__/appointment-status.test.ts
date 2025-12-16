/**
 * Phase 8 Task 0108: Appointment Status Change Trigger Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerAppointmentStatus,
  validateAppointmentStatusData,
  shouldSendStatusNotification,
} from '../appointment-status';
import type { AppointmentStatusTriggerData } from '../appointment-status';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the notification service
vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

describe('triggerAppointmentStatus', () => {
  let mockSupabase: SupabaseClient;
  let mockSendNotification: any;

  beforeEach(async () => {
    mockSupabase = {} as SupabaseClient;
    const { sendNotification } = await import('@/lib/notifications');
    mockSendNotification = sendNotification;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const validCheckedInData: AppointmentStatusTriggerData = {
    appointmentId: 'appt-123',
    customerId: 'customer-123',
    customerPhone: '+16572522903',
    petName: 'Max',
    status: 'checked_in',
  };

  const validReadyData: AppointmentStatusTriggerData = {
    appointmentId: 'appt-123',
    customerId: 'customer-123',
    customerPhone: '+16572522903',
    petName: 'Max',
    status: 'ready',
  };

  describe('Status Filtering', () => {
    it('should send SMS for checked_in status', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      const result = await triggerAppointmentStatus(mockSupabase, validCheckedInData);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.skipped).toBe(false);

      expect(mockSendNotification).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          type: 'appointment_checked_in',
          channel: 'sms',
          recipient: '+16572522903',
          userId: 'customer-123',
          templateData: {
            pet_name: 'Max',
          },
        })
      );
    });

    it('should send SMS for ready status', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      const result = await triggerAppointmentStatus(mockSupabase, validReadyData);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.skipped).toBe(false);

      expect(mockSendNotification).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          type: 'appointment_ready_for_pickup',
          channel: 'sms',
        })
      );
    });

    it('should skip SMS for completed status (without manual override)', async () => {
      const completedData = { ...validCheckedInData, status: 'completed' as any };

      const result = await triggerAppointmentStatus(mockSupabase, completedData);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('does not trigger automatic notifications');

      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('should skip SMS for pending status (without manual override)', async () => {
      const pendingData = { ...validCheckedInData, status: 'pending' as any };

      const result = await triggerAppointmentStatus(mockSupabase, pendingData);

      expect(result.skipped).toBe(true);
      expect(mockSendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Manual Override', () => {
    it('should send notification for any status with manual override', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      const completedData = {
        ...validCheckedInData,
        status: 'completed' as any,
        manualOverride: true,
      };

      const result = await triggerAppointmentStatus(mockSupabase, completedData);

      // Manual override should allow sending for any status
      expect(result.skipped).toBe(false);
      // But notification type might still be null for unsupported statuses
    });
  });

  describe('Phone Number Validation', () => {
    it('should skip SMS when phone number not provided', async () => {
      const dataWithoutPhone = { ...validCheckedInData, customerPhone: null };

      const result = await triggerAppointmentStatus(mockSupabase, dataWithoutPhone);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('No phone number available');

      expect(mockSendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle SMS failure', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS provider error',
      });

      const result = await triggerAppointmentStatus(mockSupabase, validCheckedInData);

      expect(result.success).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toContain('SMS failed: SMS provider error');
    });

    it('should handle exceptions from sendNotification', async () => {
      mockSendNotification.mockRejectedValueOnce(new Error('Network error'));

      const result = await triggerAppointmentStatus(mockSupabase, validCheckedInData);

      expect(result.success).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toContain('SMS error: Network error');
    });
  });

  describe('Retry Behavior', () => {
    it('should log that retry will be handled automatically', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'Temporary error',
      });

      await triggerAppointmentStatus(mockSupabase, validCheckedInData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry will be scheduled automatically')
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('validateAppointmentStatusData', () => {
  it('should validate complete data', () => {
    const validData: AppointmentStatusTriggerData = {
      appointmentId: 'appt-123',
      customerId: 'customer-123',
      customerPhone: '+16572522903',
      petName: 'Max',
      status: 'checked_in',
    };

    const result = validateAppointmentStatusData(validData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      appointmentId: 'appt-123',
      // Missing required fields
    };

    const result = validateAppointmentStatusData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('customerId is required');
    expect(result.errors).toContain('petName is required');
    expect(result.errors).toContain('status is required');
  });
});

describe('shouldSendStatusNotification', () => {
  it('should return true for checked_in status', () => {
    expect(shouldSendStatusNotification('checked_in')).toBe(true);
  });

  it('should return true for ready status', () => {
    expect(shouldSendStatusNotification('ready')).toBe(true);
  });

  it('should return false for completed status', () => {
    expect(shouldSendStatusNotification('completed')).toBe(false);
  });

  it('should return false for pending status', () => {
    expect(shouldSendStatusNotification('pending')).toBe(false);
  });

  it('should return false for cancelled status', () => {
    expect(shouldSendStatusNotification('cancelled')).toBe(false);
  });

  it('should return true for any status with manual override', () => {
    expect(shouldSendStatusNotification('completed', true)).toBe(true);
    expect(shouldSendStatusNotification('pending', true)).toBe(true);
    expect(shouldSendStatusNotification('cancelled', true)).toBe(true);
  });
});
