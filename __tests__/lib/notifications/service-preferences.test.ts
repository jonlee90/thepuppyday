/**
 * Integration tests for notification service with preference filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefaultNotificationService } from '@/lib/notifications/service';
import type {
  EmailProvider,
  SMSProvider,
  TemplateEngine,
  NotificationLogger,
  NotificationMessage,
} from '@/lib/notifications/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock preference check module
const { mockCheckNotificationAllowed } = vi.hoisted(() => ({
  mockCheckNotificationAllowed: vi.fn(),
}));

vi.mock('@/lib/notifications/preferences', () => ({
  checkNotificationAllowed: mockCheckNotificationAllowed,
}));

describe('NotificationService with Preference Filtering', () => {
  let mockSupabase: SupabaseClient;
  let mockEmailProvider: EmailProvider;
  let mockSMSProvider: SMSProvider;
  let mockTemplateEngine: TemplateEngine;
  let mockLogger: NotificationLogger;
  let service: DefaultNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Mock email provider
    mockEmailProvider = {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'email-123',
      }),
    };

    // Mock SMS provider
    mockSMSProvider = {
      send: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'sms-123',
      }),
    };

    // Mock template engine
    mockTemplateEngine = {
      render: vi.fn((template: string) => template),
      validate: vi.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
      calculateCharacterCount: vi.fn().mockReturnValue(50),
      calculateSegmentCount: vi.fn().mockReturnValue(1),
    };

    // Mock logger
    mockLogger = {
      create: vi.fn().mockResolvedValue('log-123'),
      update: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      query: vi.fn(),
    };

    service = new DefaultNotificationService(
      mockSupabase,
      mockEmailProvider,
      mockSMSProvider,
      mockTemplateEngine,
      mockLogger
    );
  });

  describe('Transactional Notifications', () => {
    it('sends booking confirmation regardless of marketing preferences', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({ allowed: true });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Booking Confirmation',
          html_template: '<p>Hello</p>',
          text_template: 'Hello',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'John' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(true);
      expect(mockEmailProvider.send).toHaveBeenCalled();
      expect(mockCheckNotificationAllowed).toHaveBeenCalledWith(
        mockSupabase,
        'user-123',
        'booking_confirmation',
        'email'
      );
    });

    it('sends appointment status notifications even with preferences disabled', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({ allowed: true });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { sms_enabled: true },
        error: null,
      });

      // Mock template fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: null,
          html_template: null,
          text_template: 'Your pet is ready!',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'appointment_status_ready',
        channel: 'sms',
        recipient: '+15555555555',
        templateData: { pet_name: 'Buddy' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(true);
      expect(mockSMSProvider.send).toHaveBeenCalled();
    });
  });

  describe('Marketing Notifications', () => {
    it('blocks retention reminder when marketing disabled', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({
        allowed: false,
        reason: 'customer_preference_marketing_disabled',
      });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'retention_reminder',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'John' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('customer_preference_marketing_disabled');
      expect(mockEmailProvider.send).not.toHaveBeenCalled();
      expect(mockLogger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'customer_preference_marketing_disabled',
        })
      );
    });

    it('blocks email appointment reminder when email reminders disabled', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({
        allowed: false,
        reason: 'customer_preference_email_reminders_disabled',
      });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'appointment_reminder',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { appointment_date: '2024-12-20' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('customer_preference_email_reminders_disabled');
      expect(mockEmailProvider.send).not.toHaveBeenCalled();
    });

    it('blocks SMS retention reminder when SMS retention disabled', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({
        allowed: false,
        reason: 'customer_preference_sms_retention_disabled',
      });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { sms_enabled: true },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'retention_reminder',
        channel: 'sms',
        recipient: '+15555555555',
        templateData: { customer_name: 'John' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('customer_preference_sms_retention_disabled');
      expect(mockSMSProvider.send).not.toHaveBeenCalled();
    });

    it('sends notification when all preferences are enabled', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({ allowed: true });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Reminder',
          html_template: '<p>Reminder</p>',
          text_template: 'Reminder',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'appointment_reminder',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { appointment_date: '2024-12-20' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      expect(result.success).toBe(true);
      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });

  describe('Notifications without userId', () => {
    it('sends notification when userId is not provided', async () => {
      // No need to mock checkNotificationAllowed here since it won't be called without userId

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Test',
          html_template: '<p>Test</p>',
          text_template: 'Test',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'John' },
        // No userId provided
      };

      const result = await service.send(message);

      expect(result.success).toBe(true);
      expect(mockCheckNotificationAllowed).not.toHaveBeenCalled();
      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });

  describe('Preference Logging', () => {
    it('logs blocked notification with preference reason', async () => {
      mockCheckNotificationAllowed.mockResolvedValue({
        allowed: false,
        reason: 'customer_preference_marketing_disabled',
      });

      // Mock settings check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase as any).single.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'retention_reminder',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'John' },
        userId: 'user-123',
      };

      await service.send(message);

      expect(mockLogger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'user-123',
          type: 'retention_reminder',
          channel: 'email',
          recipient: 'customer@example.com',
          status: 'failed',
          errorMessage: 'customer_preference_marketing_disabled',
          isTest: false,
        })
      );
    });
  });
});
