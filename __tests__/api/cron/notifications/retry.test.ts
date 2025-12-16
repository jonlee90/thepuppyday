/**
 * Unit tests for Retry Processing Cron Job
 * Task 0114 Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/notifications/retry/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  getNotificationService: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { getNotificationService } = await import('@/lib/notifications');

describe('Retry Processing Cron Job', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotificationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {};

    mockNotificationService = {
      processRetries: vi.fn(() =>
        Promise.resolve({
          processed: 0,
          succeeded: 0,
          failed: 0,
          errors: [],
        })
      ),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      });

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid cron secret', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
      process.env.CRON_SECRET = 'test-secret';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should skip validation in mock mode', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Job Execution', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should call notification service processRetries', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockNotificationService.processRetries).toHaveBeenCalledTimes(1);
    });

    it('should return retry processing results', async () => {
      mockNotificationService.processRetries.mockResolvedValue({
        processed: 10,
        succeeded: 7,
        failed: 3,
        errors: [
          { logId: 'log-1', error: 'Error 1' },
          { logId: 'log-2', error: 'Error 2' },
          { logId: 'log-3', error: 'Error 3' },
        ],
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(10);
      expect(data.succeeded).toBe(7);
      expect(data.failed).toBe(3);
      expect(data.error_count).toBe(3);
      expect(data.errors).toHaveLength(3);
    });

    it('should limit error details in response', async () => {
      const manyErrors = Array.from({ length: 20 }, (_, i) => ({
        logId: `log-${i}`,
        error: `Error ${i}`,
      }));

      mockNotificationService.processRetries.mockResolvedValue({
        processed: 20,
        succeeded: 0,
        failed: 20,
        errors: manyErrors,
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.error_count).toBe(20);
      expect(data.errors).toHaveLength(10); // Limited to first 10
    });

    it('should not include errors field when no errors', async () => {
      mockNotificationService.processRetries.mockResolvedValue({
        processed: 5,
        succeeded: 5,
        failed: 0,
        errors: [],
      });

      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errors).toBeUndefined();
      expect(data.error_count).toBe(0);
    });

    it('should handle processRetries errors', async () => {
      mockNotificationService.processRetries.mockRejectedValue(
        new Error('Retry processing failed')
      );

      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Retry processing failed');
    });

    it('should include duration in response', async () => {
      const request = new NextRequest('http://localhost/api/cron/notifications/retry');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.duration_ms).toBeDefined();
      expect(typeof data.duration_ms).toBe('number');
      expect(data.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Concurrent Execution Prevention', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should prevent concurrent execution', async () => {
      // Mock a slow processRetries call
      mockNotificationService.processRetries.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ processed: 1, succeeded: 1, failed: 0, errors: [] }), 100))
      );

      const request1 = new NextRequest('http://localhost/api/cron/notifications/retry');
      const request2 = new NextRequest('http://localhost/api/cron/notifications/retry');

      // Start both requests simultaneously
      const [response1, response2] = await Promise.all([GET(request1), GET(request2)]);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // One should succeed, one should be skipped
      const skippedResponse = data1.skipped ? data1 : data2;
      const successResponse = data1.skipped ? data2 : data1;

      expect(skippedResponse.skipped).toBe(true);
      expect(skippedResponse.message).toBe('Job already running');
      expect(successResponse.success).toBe(true);
      expect(successResponse.processed).toBeDefined();
    });
  });

  describe('POST Method', () => {
    it('should delegate to GET handler', async () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const request = new NextRequest('http://localhost/api/cron/notifications/retry', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
