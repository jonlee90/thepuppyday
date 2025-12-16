/**
 * Phase 8 Task 0107: Booking Confirmation Trigger Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { triggerBookingConfirmation, validateBookingConfirmationData } from '../booking-confirmation';
import type { BookingConfirmationTriggerData } from '../booking-confirmation';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the notification service
vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

describe('triggerBookingConfirmation', () => {
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

  const validData: BookingConfirmationTriggerData = {
    appointmentId: 'appt-123',
    customerId: 'customer-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+16572522903',
    petName: 'Max',
    serviceName: 'Premium Grooming',
    scheduledAt: '2025-12-20T10:00:00Z',
    totalPrice: 95.0,
  };

  describe('Email Notification', () => {
    it('should send email notification successfully', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'email-123',
        logId: 'log-123',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-124',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify email notification called with correct data
      expect(mockSendNotification).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'john@example.com',
          userId: 'customer-123',
          templateData: expect.objectContaining({
            customer_name: 'John Doe',
            pet_name: 'Max',
            service_name: 'Premium Grooming',
            total_price: '$95.00',
          }),
        })
      );
    });

    it('should handle email failure gracefully', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'Email provider error',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-124',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      // Should still succeed because SMS sent
      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(result.smsSent).toBe(true);
      expect(result.errors).toContain('Email failed: Email provider error');
    });
  });

  describe('SMS Notification', () => {
    it('should send SMS notification when phone number provided', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'email-123',
        logId: 'log-123',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-124',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      expect(result.smsSent).toBe(true);

      // Verify SMS notification called with correct data
      expect(mockSendNotification).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          type: 'booking_confirmation',
          channel: 'sms',
          recipient: '+16572522903',
          userId: 'customer-123',
        })
      );
    });

    it('should skip SMS when phone number not provided', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'email-123',
        logId: 'log-123',
      });

      const dataWithoutPhone = { ...validData, customerPhone: null };
      const result = await triggerBookingConfirmation(mockSupabase, dataWithoutPhone);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(false);

      // Should only call sendNotification once (for email)
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });

    it('should handle SMS failure gracefully', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'email-123',
        logId: 'log-123',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS provider error',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      // Should still succeed because email sent
      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toContain('SMS failed: SMS provider error');
    });
  });

  describe('Error Handling', () => {
    it('should handle both email and SMS failures', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'Email error',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS error',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      expect(result.success).toBe(false);
      expect(result.emailSent).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Email failed: Email error');
      expect(result.errors).toContain('SMS failed: SMS error');
    });

    it('should handle exceptions from sendNotification', async () => {
      mockSendNotification.mockRejectedValueOnce(new Error('Network error'));

      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-124',
      });

      const result = await triggerBookingConfirmation(mockSupabase, validData);

      // SMS should still succeed
      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(false);
      expect(result.smsSent).toBe(true);
      expect(result.errors).toContain('Email error: Network error');
    });
  });

  describe('Template Data Formatting', () => {
    it('should format date and time correctly', async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      });

      await triggerBookingConfirmation(mockSupabase, validData);

      const emailCall = mockSendNotification.mock.calls.find(
        (call: any) => call[1].channel === 'email'
      );

      expect(emailCall[1].templateData.appointment_date).toBe('Saturday, December 20, 2025');
      expect(emailCall[1].templateData.appointment_time).toBe('10:00 AM');
    });

    it('should format price correctly', async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      });

      const dataWithPrice = { ...validData, totalPrice: 123.5 };
      await triggerBookingConfirmation(mockSupabase, dataWithPrice);

      const emailCall = mockSendNotification.mock.calls.find(
        (call: any) => call[1].channel === 'email'
      );

      expect(emailCall[1].templateData.total_price).toBe('$123.50');
    });
  });
});

describe('validateBookingConfirmationData', () => {
  it('should validate complete data', () => {
    const validData: BookingConfirmationTriggerData = {
      appointmentId: 'appt-123',
      customerId: 'customer-123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+16572522903',
      petName: 'Max',
      serviceName: 'Premium Grooming',
      scheduledAt: '2025-12-20T10:00:00Z',
      totalPrice: 95.0,
    };

    const result = validateBookingConfirmationData(validData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      appointmentId: 'appt-123',
      // Missing required fields
    };

    const result = validateBookingConfirmationData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('customerId is required');
    expect(result.errors).toContain('customerName is required');
    expect(result.errors).toContain('customerEmail is required');
  });

  it('should reject missing totalPrice', () => {
    const invalidData = {
      appointmentId: 'appt-123',
      customerId: 'customer-123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      petName: 'Max',
      serviceName: 'Premium Grooming',
      scheduledAt: '2025-12-20T10:00:00Z',
      // totalPrice missing
    };

    const result = validateBookingConfirmationData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('totalPrice is required');
  });
});
