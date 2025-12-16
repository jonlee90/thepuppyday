/**
 * Phase 8 Task 0109: Report Card Completion Trigger Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerReportCardCompletion,
  validateReportCardCompletionData,
  shouldSendReportCardNotification,
} from '../report-card-completion';
import type { ReportCardCompletionTriggerData } from '../report-card-completion';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the notification service
vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

describe('triggerReportCardCompletion', () => {
  let mockSupabase: any;
  let mockSendNotification: any;

  beforeEach(async () => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    const { sendNotification } = await import('@/lib/notifications');
    mockSendNotification = sendNotification;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const validData: ReportCardCompletionTriggerData = {
    reportCardId: 'rc-123',
    appointmentId: 'appt-123',
    customerId: 'customer-123',
    customerEmail: 'john@example.com',
    customerPhone: '+16572522903',
    petName: 'Max',
    beforeImageUrl: 'https://example.com/before.jpg',
    afterImageUrl: 'https://example.com/after.jpg',
  };

  describe('Email Notification', () => {
    it('should send email with report card link and images', async () => {
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

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await triggerReportCardCompletion(mockSupabase, validData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);

      const emailCall = mockSendNotification.mock.calls.find(
        (call: any) => call[1].channel === 'email'
      );

      expect(emailCall[1].templateData).toEqual({
        pet_name: 'Max',
        report_card_link: expect.stringContaining('/report-cards/rc-123'),
        before_image_url: 'https://example.com/before.jpg',
        after_image_url: 'https://example.com/after.jpg',
      });
    });

    it('should send email without images if not provided', async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const dataWithoutImages = {
        ...validData,
        beforeImageUrl: undefined,
        afterImageUrl: undefined,
      };

      const result = await triggerReportCardCompletion(mockSupabase, dataWithoutImages);

      expect(result.success).toBe(true);

      const emailCall = mockSendNotification.mock.calls.find(
        (call: any) => call[1].channel === 'email'
      );

      expect(emailCall[1].templateData.before_image_url).toBeUndefined();
      expect(emailCall[1].templateData.after_image_url).toBeUndefined();
    });
  });

  describe('SMS Notification', () => {
    it('should send SMS with report card link', async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await triggerReportCardCompletion(mockSupabase, validData);

      expect(result.smsSent).toBe(true);

      const smsCall = mockSendNotification.mock.calls.find(
        (call: any) => call[1].channel === 'sms'
      );

      expect(smsCall[1]).toEqual(
        expect.objectContaining({
          type: 'report_card_ready',
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

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const dataWithoutPhone = { ...validData, customerPhone: null };
      const result = await triggerReportCardCompletion(mockSupabase, dataWithoutPhone);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.smsSent).toBe(false);

      // Should only call sendNotification once (for email)
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe('Report Card Timestamp Update', () => {
    it('should update sent_at timestamp when email sent', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'email-123',
        logId: 'log-123',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS error',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await triggerReportCardCompletion(mockSupabase, validData);

      expect(mockSupabase.from).toHaveBeenCalledWith('report_cards');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        sent_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'rc-123');
    });

    it('should update sent_at timestamp when SMS sent', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'Email error',
      });

      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-124',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await triggerReportCardCompletion(mockSupabase, validData);

      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should not update sent_at when both notifications fail', async () => {
      mockSendNotification.mockResolvedValue({
        success: false,
        error: 'Provider error',
      });

      await triggerReportCardCompletion(mockSupabase, validData);

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      const result = await triggerReportCardCompletion(mockSupabase, validData);

      // Notification should still succeed even if timestamp update fails
      expect(result.emailSent).toBe(true);
      expect(result.errors).toContain('Failed to update sent_at timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle both email and SMS failures', async () => {
      mockSendNotification.mockResolvedValue({
        success: false,
        error: 'Provider error',
      });

      const result = await triggerReportCardCompletion(mockSupabase, validData);

      expect(result.success).toBe(false);
      expect(result.emailSent).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle exceptions from sendNotification', async () => {
      mockSendNotification.mockRejectedValue(new Error('Network error'));

      const result = await triggerReportCardCompletion(mockSupabase, validData);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('validateReportCardCompletionData', () => {
  it('should validate complete data', () => {
    const validData: ReportCardCompletionTriggerData = {
      reportCardId: 'rc-123',
      appointmentId: 'appt-123',
      customerId: 'customer-123',
      customerEmail: 'john@example.com',
      customerPhone: '+16572522903',
      petName: 'Max',
    };

    const result = validateReportCardCompletionData(validData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      reportCardId: 'rc-123',
      // Missing required fields
    };

    const result = validateReportCardCompletionData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('appointmentId is required');
    expect(result.errors).toContain('customerId is required');
    expect(result.errors).toContain('customerEmail is required');
    expect(result.errors).toContain('petName is required');
  });
});

describe('shouldSendReportCardNotification', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
  });

  it('should return true for valid report card', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        is_draft: false,
        dont_send: false,
        sent_at: null,
      },
      error: null,
    });

    const result = await shouldSendReportCardNotification(mockSupabase, 'rc-123');

    expect(result.should_send).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should return false for draft report card', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        is_draft: true,
        dont_send: false,
        sent_at: null,
      },
      error: null,
    });

    const result = await shouldSendReportCardNotification(mockSupabase, 'rc-123');

    expect(result.should_send).toBe(false);
    expect(result.reason).toBe('Report card is still a draft');
  });

  it('should return false when dont_send flag is true', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        is_draft: false,
        dont_send: true,
        sent_at: null,
      },
      error: null,
    });

    const result = await shouldSendReportCardNotification(mockSupabase, 'rc-123');

    expect(result.should_send).toBe(false);
    expect(result.reason).toBe('dont_send flag is set');
  });

  it('should return false when already sent', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        is_draft: false,
        dont_send: false,
        sent_at: '2025-12-15T10:00:00Z',
      },
      error: null,
    });

    const result = await shouldSendReportCardNotification(mockSupabase, 'rc-123');

    expect(result.should_send).toBe(false);
    expect(result.reason).toBe('Notification already sent');
  });

  it('should return false when report card not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const result = await shouldSendReportCardNotification(mockSupabase, 'rc-123');

    expect(result.should_send).toBe(false);
    expect(result.reason).toBe('Report card not found');
  });
});
