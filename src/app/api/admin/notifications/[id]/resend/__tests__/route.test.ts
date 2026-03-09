/**
 * Phase E Task 0113: Tests for Single Notification Resend Route
 * POST /api/admin/notifications/[id]/resend
 *
 * Verifies that resend calls notificationService.send() with original
 * notification data — not manual DB inserts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/admin/notifications/[id]/resend/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/notifications');

describe('POST /api/admin/notifications/[id]/resend', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockNotificationService = {
    send: vi.fn(),
  };

  const mockNotification = {
    id: 'notif-123',
    customer_id: 'cust-456',
    type: 'booking_confirmation',
    channel: 'email',
    recipient: 'customer@example.com',
    status: 'failed',
    template_data: { customer_name: 'Jane', pet_name: 'Buddy', total_price: '$70.00' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService as any);
  });

  function makeRequest(id: string) {
    return new NextRequest(
      `http://localhost:3000/api/admin/notifications/${id}/resend`,
      { method: 'POST' }
    );
  }

  function setupNotificationQuery(notification: typeof mockNotification | null, error: unknown = null) {
    const query = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: notification, error }),
    };
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(query),
    });
  }

  describe('Success Cases', () => {
    it('calls notificationService.send() with original notification data', async () => {
      setupNotificationQuery(mockNotification);
      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-789',
        messageId: 'msg-abc',
      });

      const response = await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notificationId).toBe('new-log-789');

      // Core assertion: notificationService.send() is called with original data
      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'customer@example.com',
        templateData: { customer_name: 'Jane', pet_name: 'Buddy', total_price: '$70.00' },
        userId: 'cust-456',
      });
    });

    it('passes empty object for templateData when notification has no template_data', async () => {
      const noTemplateNotification = { ...mockNotification, template_data: null };
      setupNotificationQuery(noTemplateNotification);
      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-789',
      });

      await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ templateData: {} })
      );
    });

    it('passes undefined userId when customer_id is null', async () => {
      const noCustomerNotification = { ...mockNotification, customer_id: null };
      setupNotificationQuery(noCustomerNotification);
      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-789',
      });

      await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });

      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined })
      );
    });
  });

  describe('Not Found Cases', () => {
    it('returns 404 if notification ID not found', async () => {
      setupNotificationQuery(null, { message: 'Not found' });

      const response = await POST(makeRequest('notif-missing'), { params: Promise.resolve({ id: 'notif-missing' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('returns 404 when fetch returns no data and no error', async () => {
      setupNotificationQuery(null, null);

      const response = await POST(makeRequest('notif-empty'), { params: Promise.resolve({ id: 'notif-empty' }) });

      expect(response.status).toBe(404);
    });
  });

  describe('Validation Cases', () => {
    it('returns 400 if ID is missing (empty string)', async () => {
      const response = await POST(makeRequest(''), { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Service Failure Cases', () => {
    it('returns 500 if notificationService.send() returns { success: false }', async () => {
      setupNotificationQuery(mockNotification);
      mockNotificationService.send.mockResolvedValue({
        success: false,
        error: 'Email provider timeout',
      });

      const response = await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('returns 500 with generic error message when service returns no specific error', async () => {
      setupNotificationQuery(mockNotification);
      mockNotificationService.send.mockResolvedValue({
        success: false,
      });

      const response = await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('returns 401 when admin auth fails', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      const response = await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns the new log ID on success', async () => {
      setupNotificationQuery(mockNotification);
      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'newly-created-log-id',
        messageId: 'provider-msg-id',
      });

      const response = await POST(makeRequest('notif-123'), { params: Promise.resolve({ id: 'notif-123' }) });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.notificationId).toBe('newly-created-log-id');
    });
  });
});
