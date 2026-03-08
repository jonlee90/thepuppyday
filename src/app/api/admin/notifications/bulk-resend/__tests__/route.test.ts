/**
 * Phase E Task 0113: Tests for Bulk Notification Resend Route
 * POST /api/admin/notifications/bulk-resend
 *
 * Verifies that bulk resend calls notificationService.send() for each
 * notification — not manual DB inserts — and correctly reports
 * partial success/failure counts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/admin/notifications/bulk-resend/route';
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

describe('POST /api/admin/notifications/bulk-resend', () => {
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

  const mockNotifications = [
    {
      id: 'notif-1',
      customer_id: 'cust-1',
      type: 'booking_confirmation',
      channel: 'email',
      recipient: 'one@example.com',
      template_data: { customer_name: 'Alice' },
    },
    {
      id: 'notif-2',
      customer_id: 'cust-2',
      type: 'appointment_reminder',
      channel: 'sms',
      recipient: '+15551234567',
      template_data: { pet_name: 'Rex' },
    },
    {
      id: 'notif-3',
      customer_id: 'cust-3',
      type: 'booking_confirmation',
      channel: 'email',
      recipient: 'three@example.com',
      template_data: { customer_name: 'Bob' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService as any);
  });

  function makeRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/admin/notifications/bulk-resend', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function setupNotificationsQuery(notifications: typeof mockNotifications, error: unknown = null) {
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.gte = vi.fn().mockReturnValue(chain);
    chain.lte = vi.fn().mockReturnValue(chain);
    // The final awaited value
    chain.then = (resolve: any) => Promise.resolve({ data: notifications, error }).then(resolve);
    mockSupabase.from.mockReturnValue(chain);
    return chain;
  }

  describe('Sends each notification via notificationService.send()', () => {
    it('calls notificationService.send() once per notification when given 3 IDs', async () => {
      setupNotificationsQuery(mockNotifications);
      mockNotificationService.send.mockResolvedValue({ success: true, logId: 'new-log' });

      const response = await POST(makeRequest({ ids: ['notif-1', 'notif-2', 'notif-3'] }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.totalResent).toBe(3);
      expect(data.totalFailed).toBe(0);
      // Core assertion: send() called 3 times (once per notification)
      expect(mockNotificationService.send).toHaveBeenCalledTimes(3);
    });

    it('passes correct type, channel, recipient, and templateData to send()', async () => {
      const singleNotif = [mockNotifications[0]];
      setupNotificationsQuery(singleNotif);
      mockNotificationService.send.mockResolvedValue({ success: true, logId: 'new-log' });

      await POST(makeRequest({ ids: ['notif-1'] }));

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'one@example.com',
        templateData: { customer_name: 'Alice' },
        userId: 'cust-1',
      });
    });
  });

  describe('Partial success reporting', () => {
    it('reports correct totalResent and totalFailed when some sends fail', async () => {
      setupNotificationsQuery(mockNotifications);
      // First two succeed, third fails
      mockNotificationService.send
        .mockResolvedValueOnce({ success: true, logId: 'log-1' })
        .mockResolvedValueOnce({ success: true, logId: 'log-2' })
        .mockResolvedValueOnce({ success: false, error: 'Provider timeout' });

      const response = await POST(makeRequest({ ids: ['notif-1', 'notif-2', 'notif-3'] }));
      const data = await response.json();

      expect(data.totalResent).toBe(2);
      expect(data.totalFailed).toBe(1);
      expect(data.errors).toBeDefined();
      expect(data.errors).toHaveLength(1);
    });

    it('sets success=false when all sends fail', async () => {
      setupNotificationsQuery(mockNotifications);
      mockNotificationService.send.mockResolvedValue({ success: false, error: 'Error' });

      const response = await POST(makeRequest({ ids: ['notif-1', 'notif-2', 'notif-3'] }));
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.totalResent).toBe(0);
      expect(data.totalFailed).toBe(3);
    });

    it('counts exceptions from notificationService.send() as failures', async () => {
      setupNotificationsQuery([mockNotifications[0], mockNotifications[1]]);
      mockNotificationService.send
        .mockResolvedValueOnce({ success: true, logId: 'log-1' })
        .mockRejectedValueOnce(new Error('Network failure'));

      const response = await POST(makeRequest({ ids: ['notif-1', 'notif-2'] }));
      const data = await response.json();

      expect(data.totalResent).toBe(1);
      expect(data.totalFailed).toBe(1);
    });
  });

  describe('Filter-based resend', () => {
    it('supports filter-based resend via POST with filters instead of IDs', async () => {
      setupNotificationsQuery(mockNotifications);
      mockNotificationService.send.mockResolvedValue({ success: true, logId: 'new-log' });

      const response = await POST(
        makeRequest({ filters: { status: 'failed', channel: 'email' } })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalResent).toBe(3);
    });
  });

  describe('Validation Cases', () => {
    it('returns 400 if neither ids nor filters are provided', async () => {
      const response = await POST(makeRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(data.totalResent).toBe(0);
      expect(data.totalFailed).toBe(0);
    });

    it('returns 400 when body is empty object', async () => {
      const response = await POST(makeRequest({}));

      expect(response.status).toBe(400);
    });
  });

  describe('Auth and Error Cases', () => {
    it('returns 401 when admin auth fails', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      const response = await POST(makeRequest({ ids: ['notif-1'] }));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.errors).toBeDefined();
    });

    it('returns no errors array when all sends succeed', async () => {
      setupNotificationsQuery([mockNotifications[0]]);
      mockNotificationService.send.mockResolvedValue({ success: true, logId: 'log-1' });

      const response = await POST(makeRequest({ ids: ['notif-1'] }));
      const data = await response.json();

      expect(data.errors).toBeUndefined();
      expect(data.success).toBe(true);
    });
  });
});
