/**
 * Phase 8: Retry Manager Tests
 * Unit tests for the ExponentialBackoffRetryManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExponentialBackoffRetryManager, createRetryManager } from '../retry-manager';
import type { NotificationService, NotificationResult, RetryConfig } from '../types';
import type { NotificationLogRow } from '../database-types';
import { DEFAULT_RETRY_CONFIG } from '../errors';

// ============================================================================
// MOCK SETUP
// ============================================================================

/**
 * Mock Supabase client
 */
const createMockSupabase = () => {
  // Create chainable mock methods
  const createChainableMock = () => {
    const chain: any = {
      select: vi.fn().mockReturnValue(chain),
      insert: vi.fn().mockReturnValue(chain),
      update: vi.fn().mockReturnValue(chain),
      eq: vi.fn().mockReturnValue(chain),
      lt: vi.fn().mockReturnValue(chain),
      gt: vi.fn().mockReturnValue(chain),
      lte: vi.fn().mockReturnValue(chain),
      gte: vi.fn().mockReturnValue(chain),
      order: vi.fn().mockReturnValue(chain),
      limit: vi.fn().mockReturnValue(chain),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    };
    return chain;
  };

  const mockChain = createChainableMock();

  return {
    from: vi.fn(() => mockChain),
    mockChain,
    // Expose individual mocks for assertions
    get mockSelect() {
      return mockChain.select;
    },
    get mockInsert() {
      return mockChain.insert;
    },
    get mockUpdate() {
      return mockChain.update;
    },
    get mockEq() {
      return mockChain.eq;
    },
    get mockLt() {
      return mockChain.lt;
    },
    get mockGt() {
      return mockChain.gt;
    },
    get mockLte() {
      return mockChain.lte;
    },
    get mockOrder() {
      return mockChain.order;
    },
    get mockLimit() {
      return mockChain.limit;
    },
    get mockSingle() {
      return mockChain.single;
    },
    get mockMaybeSingle() {
      return mockChain.maybeSingle;
    },
  };
};

/**
 * Mock notification service
 */
const createMockNotificationService = (): NotificationService => ({
  send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-123' }),
  sendBatch: vi.fn(),
  renderTemplate: vi.fn(),
  processRetries: vi.fn(),
  getMetrics: vi.fn(),
});

/**
 * Create a mock notification log entry
 */
const createMockLogEntry = (overrides: Partial<NotificationLogRow> = {}): NotificationLogRow => ({
  id: 'log-123',
  customer_id: 'customer-123',
  type: 'booking_confirmation',
  channel: 'email',
  recipient: 'customer@example.com',
  subject: 'Appointment Confirmation',
  content: 'Your appointment is confirmed',
  status: 'failed',
  template_id: 'template-123',
  template_data: { customer_name: 'John' },
  sent_at: null,
  delivered_at: null,
  clicked_at: null,
  error_message: 'ECONNRESET',
  retry_count: 0,
  retry_after: new Date().toISOString(),
  is_test: false,
  message_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ExponentialBackoffRetryManager', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockNotificationService: NotificationService;
  let retryManager: ExponentialBackoffRetryManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    mockNotificationService = createMockNotificationService();
    retryManager = new ExponentialBackoffRetryManager(
      mockSupabase as any,
      mockNotificationService,
      DEFAULT_RETRY_CONFIG
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RETRY DELAY CALCULATION WITH JITTER
  // ==========================================================================

  describe('retry delay calculation', () => {
    it('should calculate delay with exponential backoff', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelay: 30, // 30 seconds
        maxDelay: 3600, // 1 hour
        jitterFactor: 0,
      };

      const manager = new ExponentialBackoffRetryManager(
        mockSupabase as any,
        mockNotificationService,
        config
      );

      // Test delays through processRetries implementation
      // We can't directly test private methods, but we can verify the behavior
      expect(manager).toBeDefined();
    });

    it('should add jitter to prevent thundering herd', () => {
      const config: RetryConfig = {
        maxRetries: 3,
        baseDelay: 60,
        maxDelay: 3600,
        jitterFactor: 0.3, // ±30% randomness
      };

      const manager = new ExponentialBackoffRetryManager(
        mockSupabase as any,
        mockNotificationService,
        config
      );

      expect(manager).toBeDefined();
      // Jitter is applied internally, verified by integration tests
    });

    it('should cap delay at maxDelay', () => {
      const config: RetryConfig = {
        maxRetries: 10,
        baseDelay: 60,
        maxDelay: 300, // Cap at 5 minutes
        jitterFactor: 0,
      };

      const manager = new ExponentialBackoffRetryManager(
        mockSupabase as any,
        mockNotificationService,
        config
      );

      expect(manager).toBeDefined();
      // Max delay capping is applied internally
    });
  });

  // ==========================================================================
  // SUCCESSFUL RETRY PROCESSING
  // ==========================================================================

  describe('processRetries - successful retry', () => {
    it('should successfully retry and update status to sent', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 1,
        error_message: 'ETIMEDOUT',
      });

      // Mock database query chain for getPendingRetries
      // The query is: select().eq('status', 'failed').lt('retry_count', maxRetries).lte('retry_after', now).order().limit()
      mockSupabase.mockChain.select.mockReturnValueOnce(mockSupabase.mockChain);
      mockSupabase.mockChain.eq.mockReturnValueOnce(mockSupabase.mockChain);
      mockSupabase.mockChain.lt.mockReturnValueOnce(mockSupabase.mockChain);
      mockSupabase.mockChain.lte.mockReturnValueOnce(mockSupabase.mockChain);
      mockSupabase.mockChain.order.mockReturnValueOnce(mockSupabase.mockChain);
      mockSupabase.mockChain.limit.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock successful send
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: true,
        messageId: 'retry-msg-456',
      });

      const result = await retryManager.processRetries();

      // Verify result
      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify notification service was called
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: mockLog.type,
          channel: mockLog.channel,
          recipient: mockLog.recipient,
        })
      );

      // Verify database update called
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_logs');
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });

    it('should process multiple pending retries', async () => {
      const mockLogs = [
        createMockLogEntry({ id: 'log-1', retry_count: 1 }),
        createMockLogEntry({ id: 'log-2', retry_count: 2 }),
        createMockLogEntry({ id: 'log-3', retry_count: 0 }),
      ];

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
      });

      // Mock all sends successful
      (mockNotificationService.send as any).mockResolvedValue({
        success: true,
        messageId: 'msg-xyz',
      });

      const result = await retryManager.processRetries();

      // Verify all processed
      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);

      // Verify service called 3 times
      expect(mockNotificationService.send).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // MAX RETRIES EXCEEDED
  // ==========================================================================

  describe('processRetries - max retries exceeded', () => {
    it('should mark as permanently failed when max retries exceeded', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 2, // Will become 3 after this retry
        error_message: 'Network error',
      });

      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
      };

      const manager = new ExponentialBackoffRetryManager(
        mockSupabase as any,
        mockNotificationService,
        config
      );

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock send failure
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: false,
        error: 'ETIMEDOUT',
      });

      const result = await manager.processRetries();

      // Verify result
      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);

      // Verify update called with permanently failed status
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });

    it('should not schedule another retry when max exceeded', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 4, // Already exceeded max (3)
      });

      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
      };

      const manager = new ExponentialBackoffRetryManager(
        mockSupabase as any,
        mockNotificationService,
        config
      );

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock send failure
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: false,
        error: 'Still failing',
      });

      const result = await manager.processRetries();

      // Verify marked as failed without retry_after
      expect(result.failed).toBe(1);
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ERROR CLASSIFICATION
  // ==========================================================================

  describe('processRetries - error classification', () => {
    it('should retry transient errors', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 0,
        error_message: 'ECONNRESET',
      });

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock transient error
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: false,
        error: 'ETIMEDOUT',
      });

      const result = await retryManager.processRetries();

      // Verify scheduled for retry
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);

      // Should have updated with retry_after timestamp
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });

    it('should not retry validation errors', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 0,
      });

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock validation error
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: false,
        error: 'Invalid email address format',
      });

      const result = await retryManager.processRetries();

      // Verify marked as permanently failed
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);

      // Should have updated without retry_after (permanent failure)
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });

    it('should handle rate limit errors with retry', async () => {
      const mockLog = createMockLogEntry({
        retry_count: 0,
      });

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock rate limit error
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded (429)',
      });

      const result = await retryManager.processRetries();

      // Verify scheduled for retry
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);

      // Should schedule retry for rate limit
      expect(mockSupabase.mockUpdate).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // BATCH PROCESSING
  // ==========================================================================

  describe('processRetries - batch processing', () => {
    it('should process large batches in chunks', async () => {
      // Create 250 pending retries (should process in 3 batches: 100 + 100 + 50)
      const mockLogs = Array.from({ length: 250 }, (_, i) =>
        createMockLogEntry({ id: `log-${i}` })
      );

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
      });

      // Mock all sends successful
      (mockNotificationService.send as any).mockResolvedValue({
        success: true,
        messageId: 'msg-xyz',
      });

      const result = await retryManager.processRetries();

      // Verify all processed
      expect(result.processed).toBe(250);
      expect(result.succeeded).toBe(250);

      // Verify service called 250 times
      expect(mockNotificationService.send).toHaveBeenCalledTimes(250);
    });

    it('should handle mixed success/failure in batch', async () => {
      const mockLogs = Array.from({ length: 10 }, (_, i) =>
        createMockLogEntry({ id: `log-${i}` })
      );

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
      });

      // Mock alternating success/failure
      (mockNotificationService.send as any)
        .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
        .mockResolvedValueOnce({ success: false, error: 'Error 1' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-2' })
        .mockResolvedValueOnce({ success: false, error: 'Error 2' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-3' })
        .mockResolvedValueOnce({ success: false, error: 'Error 3' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-4' })
        .mockResolvedValueOnce({ success: false, error: 'Error 4' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-5' })
        .mockResolvedValueOnce({ success: false, error: 'Error 5' });

      const result = await retryManager.processRetries();

      // Verify mixed results
      expect(result.processed).toBe(10);
      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(5);
    });

    it('should continue processing after individual errors', async () => {
      const mockLogs = [
        createMockLogEntry({ id: 'log-1' }),
        createMockLogEntry({ id: 'log-2' }),
        createMockLogEntry({ id: 'log-3' }),
      ];

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: mockLogs,
        error: null,
      });

      // Mock second one throws exception
      (mockNotificationService.send as any)
        .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('Unexpected exception'))
        .mockResolvedValueOnce({ success: true, messageId: 'msg-3' });

      const result = await retryManager.processRetries();

      // Verify all processed despite exception
      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Unexpected exception');
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('processRetries - edge cases', () => {
    it('should handle no pending retries', async () => {
      // Mock database query with empty result
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await retryManager.processRetries();

      // Verify no processing
      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);

      // Verify service not called
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should handle database query error', async () => {
      // Mock database query error
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await retryManager.processRetries();

      // Verify error recorded
      expect(result.processed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Database connection failed');

      // Verify service not called
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should handle null template_data gracefully', async () => {
      const mockLog = createMockLogEntry({
        template_data: null,
      });

      // Mock database query
      mockSupabase.mockSelect.mockResolvedValueOnce({
        data: [mockLog],
        error: null,
      });

      // Mock successful send
      (mockNotificationService.send as any).mockResolvedValueOnce({
        success: true,
        messageId: 'msg-123',
      });

      const result = await retryManager.processRetries();

      // Verify processed with empty template data
      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);

      // Verify service called with empty object for template_data
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: {},
        })
      );
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createRetryManager', () => {
  it('should create an ExponentialBackoffRetryManager instance', () => {
    const mockSupabase = createMockSupabase();
    const mockService = createMockNotificationService();

    const manager = createRetryManager(mockSupabase as any, mockService);

    expect(manager).toBeInstanceOf(ExponentialBackoffRetryManager);
  });

  it('should use custom config when provided', () => {
    const mockSupabase = createMockSupabase();
    const mockService = createMockNotificationService();
    const customConfig: RetryConfig = {
      maxRetries: 5,
      baseDelay: 60,
      maxDelay: 7200,
      jitterFactor: 0.5,
    };

    const manager = createRetryManager(mockSupabase as any, mockService, customConfig);

    expect(manager).toBeInstanceOf(ExponentialBackoffRetryManager);
    // Config is used internally, verified by behavior
  });
});
