/**
 * Phase 8: Notification Service Tests
 * Unit tests for the DefaultNotificationService class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultNotificationService } from '../service';
import type {
  EmailProvider,
  SMSProvider,
  TemplateEngine,
  NotificationLogger,
  NotificationMessage,
  RenderedTemplate,
} from '../types';
import { DEFAULT_RETRY_CONFIG } from '../errors';

// ============================================================================
// MOCK SETUP
// ============================================================================

/**
 * Mock Supabase client
 */
const createMockSupabase = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockLt = vi.fn().mockReturnThis();
  const mockGt = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      lt: mockLt,
      gt: mockGt,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    })),
    mockSelect,
    mockInsert,
    mockUpdate,
    mockEq,
    mockLt,
    mockGt,
    mockOrder,
    mockLimit,
    mockSingle,
    mockMaybeSingle,
  };
};

/**
 * Mock email provider
 */
const createMockEmailProvider = (): EmailProvider => ({
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'email-123' }),
});

/**
 * Mock SMS provider
 */
const createMockSMSProvider = (): SMSProvider => ({
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'sms-456' }),
});

/**
 * Mock template engine
 */
const createMockTemplateEngine = (): TemplateEngine => ({
  render: vi.fn((template: string, data: Record<string, unknown>) => {
    // Simple mock: replace {{key}} with data[key]
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, String(value));
    });
    return result;
  }),
  validate: vi.fn().mockReturnValue({ valid: true, errors: [], warnings: [] }),
  calculateCharacterCount: vi.fn((template: string) => template.length),
  calculateSegmentCount: vi.fn((text: string) => Math.ceil(text.length / 160)),
});

/**
 * Mock notification logger
 */
const createMockLogger = (): NotificationLogger => ({
  create: vi.fn().mockResolvedValue('log-123'),
  update: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  list: vi.fn(),
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('DefaultNotificationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockEmailProvider: EmailProvider;
  let mockSMSProvider: SMSProvider;
  let mockTemplateEngine: TemplateEngine;
  let mockLogger: NotificationLogger;
  let service: DefaultNotificationService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh mocks
    mockSupabase = createMockSupabase();
    mockEmailProvider = createMockEmailProvider();
    mockSMSProvider = createMockSMSProvider();
    mockTemplateEngine = createMockTemplateEngine();
    mockLogger = createMockLogger();

    // Create service instance
    service = new DefaultNotificationService(
      mockSupabase as any,
      mockEmailProvider,
      mockSMSProvider,
      mockTemplateEngine,
      mockLogger,
      DEFAULT_RETRY_CONFIG
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SUCCESSFUL EMAIL SEND
  // ==========================================================================

  describe('send - successful email', () => {
    it('should send email successfully with all required steps', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Appointment Confirmation',
          html_template: '<p>Hello {{customer_name}}</p>',
          text_template: 'Hello {{customer_name}}',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'John Doe' },
        userId: 'user-123',
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
      expect(result.logId).toBe('log-123');

      // Verify email provider was called
      expect(mockEmailProvider.send).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Appointment Confirmation',
        html: '<p>Hello John Doe</p>',
        text: 'Hello John Doe',
      });

      // Verify logger created pending entry
      expect(mockLogger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'user-123',
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'customer@example.com',
          status: 'pending',
        })
      );

      // Verify logger updated to sent
      expect(mockLogger.update).toHaveBeenCalledWith(
        'log-123',
        expect.objectContaining({
          status: 'sent',
          messageId: 'email-123',
        })
      );
    });
  });

  // ==========================================================================
  // SUCCESSFUL SMS SEND
  // ==========================================================================

  describe('send - successful SMS', () => {
    it('should send SMS successfully', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { sms_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-456',
          subject_template: null,
          html_template: null,
          text_template: 'Hi {{customer_name}}, appointment confirmed!',
        },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'appointment_reminder',
        channel: 'sms',
        recipient: '+15551234567',
        templateData: { customer_name: 'Jane' },
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('sms-456');

      // Verify SMS provider was called
      expect(mockSMSProvider.send).toHaveBeenCalledWith({
        to: '+15551234567',
        body: 'Hi Jane, appointment confirmed!',
      });
    });
  });

  // ==========================================================================
  // NOTIFICATION DISABLED SCENARIO
  // ==========================================================================

  describe('send - notification disabled', () => {
    it('should fail when notification type is disabled', async () => {
      // Mock notification settings check (disabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: false },
        error: null,
      });

      const message: NotificationMessage = {
        type: 'marketing_email',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: {},
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');

      // Verify email provider was NOT called
      expect(mockEmailProvider.send).not.toHaveBeenCalled();

      // Verify logger was NOT called
      expect(mockLogger.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // USER OPTED-OUT SCENARIO
  // ==========================================================================

  describe('send - user opted out', () => {
    it('should fail when user has opted out of notification type', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock the preferences module
      vi.doMock('../preferences', () => ({
        checkNotificationAllowed: vi.fn().mockResolvedValue({
          allowed: false,
          reason: 'User opted out of marketing emails',
        }),
      }));

      const message: NotificationMessage = {
        type: 'marketing_email',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: {},
        userId: 'user-123',
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('opted out');

      // Verify email provider was NOT called
      expect(mockEmailProvider.send).not.toHaveBeenCalled();

      // Verify logger created failed entry
      expect(mockLogger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringContaining('opted out'),
        })
      );
    });
  });

  // ==========================================================================
  // TRANSIENT ERROR WITH RETRY SCHEDULING
  // ==========================================================================

  describe('send - transient error with retry', () => {
    it('should schedule retry for transient network error', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Test Subject',
          html_template: '<p>Test</p>',
          text_template: 'Test',
        },
        error: null,
      });

      // Mock email provider failure (transient error)
      (mockEmailProvider.send as any).mockResolvedValueOnce({
        success: false,
        error: 'ECONNRESET: Connection reset by peer',
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: {},
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNRESET');

      // Verify logger updated with retry information
      expect(mockLogger.update).toHaveBeenCalledWith(
        'log-123',
        expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringContaining('ECONNRESET'),
          retryAfter: expect.any(Date),
          retryCount: 1,
        })
      );
    });

    it('should schedule retry for rate limit error', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { sms_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-789',
          subject_template: null,
          html_template: null,
          text_template: 'Test SMS',
        },
        error: null,
      });

      // Mock SMS provider failure (rate limit)
      (mockSMSProvider.send as any).mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded (429)',
      });

      const message: NotificationMessage = {
        type: 'appointment_reminder',
        channel: 'sms',
        recipient: '+15551234567',
        templateData: {},
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit');

      // Verify retry scheduled
      expect(mockLogger.update).toHaveBeenCalledWith(
        'log-123',
        expect.objectContaining({
          status: 'failed',
          retryAfter: expect.any(Date),
        })
      );
    });
  });

  // ==========================================================================
  // PERMANENT ERROR WITHOUT RETRY
  // ==========================================================================

  describe('send - permanent error without retry', () => {
    it('should not schedule retry for validation error', async () => {
      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Test',
          html_template: '<p>Test</p>',
          text_template: 'Test',
        },
        error: null,
      });

      // Mock email provider failure (validation error)
      (mockEmailProvider.send as any).mockResolvedValueOnce({
        success: false,
        error: 'Invalid email address format',
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'invalid-email',
        templateData: {},
      };

      const result = await service.send(message);

      // Verify result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');

      // Verify logger updated WITHOUT retry
      expect(mockLogger.update).toHaveBeenCalledWith(
        'log-123',
        expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringContaining('Invalid email'),
          retryAfter: undefined,
        })
      );
    });

    it('should not schedule retry after max retries exceeded', async () => {
      // Create service with custom config (maxRetries = 0)
      const customService = new DefaultNotificationService(
        mockSupabase as any,
        mockEmailProvider,
        mockSMSProvider,
        mockTemplateEngine,
        mockLogger,
        { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 }
      );

      // Mock notification settings check (enabled)
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: { email_enabled: true },
        error: null,
      });

      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Test',
          html_template: '<p>Test</p>',
          text_template: 'Test',
        },
        error: null,
      });

      // Mock email provider failure (transient error)
      (mockEmailProvider.send as any).mockResolvedValueOnce({
        success: false,
        error: 'ETIMEDOUT',
      });

      const message: NotificationMessage = {
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: {},
      };

      const result = await customService.send(message);

      // Verify result
      expect(result.success).toBe(false);

      // Verify logger updated WITHOUT retry (max retries = 0)
      expect(mockLogger.update).toHaveBeenCalledWith(
        'log-123',
        expect.objectContaining({
          status: 'failed',
          retryAfter: undefined,
        })
      );
    });
  });

  // ==========================================================================
  // BATCH SENDING
  // ==========================================================================

  describe('sendBatch', () => {
    it('should send multiple notifications in batch', async () => {
      // Mock notification settings check (enabled) - 3 calls for 3 messages
      mockSupabase.mockSingle
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test {{name}}</p>',
            text_template: 'Test {{name}}',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test {{name}}</p>',
            text_template: 'Test {{name}}',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test {{name}}</p>',
            text_template: 'Test {{name}}',
          },
          error: null,
        });

      const messages: NotificationMessage[] = [
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'customer1@example.com',
          templateData: { name: 'Alice' },
        },
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'customer2@example.com',
          templateData: { name: 'Bob' },
        },
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'customer3@example.com',
          templateData: { name: 'Charlie' },
        },
      ];

      const results = await service.sendBatch(messages);

      // Verify all succeeded
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify email provider called 3 times
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(3);

      // Verify logger called 6 times (3 create + 3 update)
      expect(mockLogger.create).toHaveBeenCalledTimes(3);
      expect(mockLogger.update).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch', async () => {
      // Mock notification settings check and template fetch for 3 messages
      mockSupabase.mockSingle
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test</p>',
            text_template: 'Test',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test</p>',
            text_template: 'Test',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'template-123',
            subject_template: 'Test',
            html_template: '<p>Test</p>',
            text_template: 'Test',
          },
          error: null,
        });

      // First email succeeds, second fails, third succeeds
      (mockEmailProvider.send as any)
        .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
        .mockResolvedValueOnce({ success: false, error: 'Invalid email' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-3' });

      const messages: NotificationMessage[] = [
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'valid1@example.com',
          templateData: {},
        },
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'invalid@example.com',
          templateData: {},
        },
        {
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'valid2@example.com',
          templateData: {},
        },
      ];

      const results = await service.sendBatch(messages);

      // Verify mixed results
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should process large batches in chunks', async () => {
      // Mock notification settings and template for 25 messages (50 calls total)
      // Each message requires 2 calls: 1 for settings check, 1 for template fetch
      for (let i = 0; i < 25; i++) {
        mockSupabase.mockSingle
          .mockResolvedValueOnce({ data: { email_enabled: true }, error: null })
          .mockResolvedValueOnce({
            data: {
              id: 'template-123',
              subject_template: 'Test',
              html_template: '<p>Test</p>',
              text_template: 'Test',
            },
            error: null,
          });
      }

      // Create 25 messages (should be processed in 3 chunks: 10 + 10 + 5)
      const messages: NotificationMessage[] = Array.from({ length: 25 }, (_, i) => ({
        type: 'booking_confirmation',
        channel: 'email',
        recipient: `customer${i}@example.com`,
        templateData: {},
      }));

      const results = await service.sendBatch(messages);

      // Verify all processed
      expect(results).toHaveLength(25);
      expect(mockEmailProvider.send).toHaveBeenCalledTimes(25);
    });
  });

  // ==========================================================================
  // RENDER TEMPLATE
  // ==========================================================================

  describe('renderTemplate', () => {
    it('should render template by ID', async () => {
      // Mock template fetch
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: {
          id: 'template-123',
          subject_template: 'Hello {{name}}',
          html_template: '<p>Hello {{name}}</p>',
          text_template: 'Hello {{name}}',
        },
        error: null,
      });

      const rendered = await service.renderTemplate('template-123', { name: 'World' });

      expect(rendered.subject).toBe('Hello World');
      expect(rendered.html).toBe('<p>Hello World</p>');
      expect(rendered.text).toBe('Hello World');
      expect(rendered.characterCount).toBeGreaterThan(0);
      expect(rendered.segmentCount).toBeGreaterThan(0);
    });

    it('should throw error if template not found', async () => {
      // Mock template fetch error
      mockSupabase.mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Template not found' },
      });

      await expect(service.renderTemplate('invalid-id', {})).rejects.toThrow(
        'Template not found'
      );
    });
  });
});
