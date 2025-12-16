/**
 * Tests for Admin Notification Log List API
 * Task 0129: GET /api/admin/notifications/log
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/notifications/log/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');

describe('Admin Notification Log List API', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  describe('Success Cases', () => {
    it('should return paginated logs with default pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          customer_id: 'customer-1',
          type: 'booking_confirmation',
          channel: 'email',
          recipient: 'test@example.com',
          subject: 'Booking Confirmed',
          status: 'sent',
          error_message: null,
          sent_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T09:55:00Z',
          is_test: false,
          users: { first_name: 'John', last_name: 'Doe' },
        },
      ];

      const mockCountQuery = Promise.resolve({ count: 1, error: null });
      Object.assign(mockCountQuery, {
        eq: vi.fn().mockReturnValue(mockCountQuery),
        gte: vi.fn().mockReturnValue(mockCountQuery),
        lte: vi.fn().mockReturnValue(mockCountQuery),
        ilike: vi.fn().mockReturnValue(mockCountQuery),
      });

      const mockDataQuery = Promise.resolve({ data: mockLogs, error: null });
      Object.assign(mockDataQuery, {
        eq: vi.fn().mockReturnValue(mockDataQuery),
        gte: vi.fn().mockReturnValue(mockDataQuery),
        lte: vi.fn().mockReturnValue(mockDataQuery),
        ilike: vi.fn().mockReturnValue(mockDataQuery),
        order: vi.fn().mockReturnValue(mockDataQuery),
        range: vi.fn().mockReturnValue(mockDataQuery),
      });

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest('http://localhost:3000/api/admin/notifications/log');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0]).toMatchObject({
        id: 'log-1',
        customer_id: 'customer-1',
        customer_name: 'John Doe',
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        subject: 'Booking Confirmed',
        status: 'sent',
      });
      expect(data.metadata).toEqual({
        total: 1,
        total_pages: 1,
        current_page: 1,
        per_page: 50,
      });
    });

    it('should handle custom pagination parameters', async () => {
      const mockCountQuery = Promise.resolve({ count: 150, error: null });
      Object.assign(mockCountQuery, {
        eq: vi.fn().mockReturnValue(mockCountQuery),
        gte: vi.fn().mockReturnValue(mockCountQuery),
        lte: vi.fn().mockReturnValue(mockCountQuery),
        ilike: vi.fn().mockReturnValue(mockCountQuery),
      });

      const mockDataQuery = Promise.resolve({ data: [], error: null });
      Object.assign(mockDataQuery, {
        eq: vi.fn().mockReturnValue(mockDataQuery),
        gte: vi.fn().mockReturnValue(mockDataQuery),
        lte: vi.fn().mockReturnValue(mockDataQuery),
        ilike: vi.fn().mockReturnValue(mockDataQuery),
        order: vi.fn().mockReturnValue(mockDataQuery),
        range: vi.fn().mockReturnValue(mockDataQuery),
      });

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?page=2&limit=20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual({
        total: 150,
        total_pages: 8,
        current_page: 2,
        per_page: 20,
      });
      expect(mockDataQuery.range).toHaveBeenCalledWith(20, 39); // (page 2: offset=20, limit=20)
    });

    it('should apply type filter', async () => {
      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?type=appointment_reminder'
      );
      await GET(request);

      expect(mockCountQuery.eq).toHaveBeenCalledWith('type', 'appointment_reminder');
      expect(mockDataQuery.eq).toHaveBeenCalledWith('type', 'appointment_reminder');
    });

    it('should apply channel filter', async () => {
      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 3, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?channel=sms'
      );
      await GET(request);

      expect(mockCountQuery.eq).toHaveBeenCalledWith('channel', 'sms');
      expect(mockDataQuery.eq).toHaveBeenCalledWith('channel', 'sms');
    });

    it('should apply status filter', async () => {
      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 2, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?status=failed'
      );
      await GET(request);

      expect(mockCountQuery.eq).toHaveBeenCalledWith('status', 'failed');
      expect(mockDataQuery.eq).toHaveBeenCalledWith('status', 'failed');
    });

    it('should apply date range filters', async () => {
      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?start_date=2024-01-01&end_date=2024-01-31'
      );
      await GET(request);

      expect(mockCountQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockCountQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
      expect(mockDataQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockDataQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
    });

    it('should apply search filter for recipient', async () => {
      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?search=john'
      );
      await GET(request);

      expect(mockCountQuery.ilike).toHaveBeenCalledWith('recipient', '%john%');
      expect(mockDataQuery.ilike).toHaveBeenCalledWith('recipient', '%john%');
    });

    it('should handle logs with null customer_id (system notifications)', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          customer_id: null,
          type: 'system_notification',
          channel: 'email',
          recipient: 'admin@example.com',
          subject: 'System Alert',
          status: 'sent',
          error_message: null,
          sent_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T09:55:00Z',
          is_test: false,
          users: null,
        },
      ];

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };

      const mockDataQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCountQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockDataQuery),
        });

      const request = new NextRequest('http://localhost:3000/api/admin/notifications/log');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs[0].customer_id).toBeNull();
      expect(data.logs[0].customer_name).toBeNull();
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid page parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?page=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid page parameter');
    });

    it('should reject negative page parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?page=-1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid page parameter');
    });

    it('should reject invalid limit parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?limit=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit parameter');
    });

    it('should reject limit exceeding max', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?limit=200'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit parameter');
    });

    it('should reject invalid channel parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?channel=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid channel parameter');
    });

    it('should reject invalid status parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?status=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid status parameter');
    });

    it('should reject invalid start_date parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?start_date=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid start_date parameter');
    });

    it('should reject invalid end_date parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log?end_date=not-a-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid end_date parameter');
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

      const request = new NextRequest('http://localhost:3000/api/admin/notifications/log');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockRejectedValue(new Error('Database connection error')),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/notifications/log');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });
  });
});
