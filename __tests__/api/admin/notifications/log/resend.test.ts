/**
 * Tests for Admin Notification Resend API
 * Task 0131: POST /api/admin/notifications/log/[id]/resend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/admin/notifications/log/[id]/resend/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/notifications');

describe('Admin Notification Resend API', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockNotificationService = {
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService as any);
  });

  describe('Success Cases', () => {
    it('should successfully resend a failed notification', async () => {
      const logId = 'c23e4567-e89b-12d3-a456-426614174007';
      const customerId = 'd23e4567-e89b-12d3-a456-426614174007';

      const mockOriginalLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        status: 'failed',
        template_data: { customer_name: 'John Doe', pet_name: 'Max' },
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-456',
        messageId: 'msg-789',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${logId}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: logId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        new_log_id: 'new-log-456',
        message: 'Notification resent successfully',
      });

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        templateData: { customer_name: 'John Doe', pet_name: 'Max' },
        userId: customerId,
      });
    });

    it('should handle resend for notification without customer_id', async () => {
      const logId = 'e23e4567-e89b-12d3-a456-426614174008';

      const mockOriginalLog = {
        id: logId,
        customer_id: null,
        type: 'system_alert',
        channel: 'email',
        recipient: 'admin@example.com',
        status: 'failed',
        template_data: { alert_message: 'System issue' },
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-789',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log/log-456/resend',
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: 'e23e4567-e89b-12d3-a456-426614174008' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'system_alert',
        channel: 'email',
        recipient: 'admin@example.com',
        templateData: { alert_message: 'System issue' },
        userId: undefined,
      });
    });

    it('should handle resend with null template_data', async () => {
      const mockOriginalLog = {
        id: 'f23e4567-e89b-12d3-a456-426614174009',
        customer_id: 'g23e4567-e89b-12d3-a456-426614174009',
        type: 'appointment_reminder',
        channel: 'sms',
        recipient: '+15551234567',
        status: 'failed',
        template_data: null,
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      mockNotificationService.send.mockResolvedValue({
        success: true,
        logId: 'new-log-abc',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log/log-789/resend',
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: 'f23e4567-e89b-12d3-a456-426614174009' });
      const response = await POST(request, { params });

      expect(response.status).toBe(200);

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'appointment_reminder',
        channel: 'sms',
        recipient: '+15551234567',
        templateData: {},
        userId: 'g23e4567-e89b-12d3-a456-426614174009',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/log/invalid-id/resend',
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: 'invalid-id' });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid log ID format');
    });

    it('should reject resend for non-failed notification (status: sent)', async () => {
      const logId = 'a23e4567-e89b-12d3-a456-426614174010';
      const customerId = 'i23e4567-e89b-12d3-a456-426614174010';

      const mockOriginalLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        status: 'sent',
        template_data: {},
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${logId}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: logId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Cannot resend notification with status 'sent'");
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });

    it('should reject resend for pending notification', async () => {
      const logId = 'b23e4567-e89b-12d3-a456-426614174011';
      const customerId = 'c23e4567-e89b-12d3-a456-426614174011';

      const mockOriginalLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        status: 'pending',
        template_data: {},
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${logId}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: logId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Cannot resend notification with status 'pending'");
      expect(mockNotificationService.send).not.toHaveBeenCalled();
    });
  });

  describe('Not Found', () => {
    it('should return 404 if original log not found', async () => {
      const validUuid = 'd23e4567-e89b-12d3-a456-426614174012';

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Original notification log entry not found');
    });
  });

  describe('Resend Failures', () => {
    it('should handle notification service send failure', async () => {
      const logId = 'e23e4568-e89b-12d3-a456-426614174013';
      const customerId = 'f23e4567-e89b-12d3-a456-426614174013';

      const mockOriginalLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        status: 'failed',
        template_data: {},
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      mockNotificationService.send.mockResolvedValue({
        success: false,
        error: 'Email provider error',
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${logId}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: logId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to resend notification');
      expect(data.error).toBe('Email provider error');
    });

    it('should handle notification service exceptions', async () => {
      const logId = 'a23e4568-e89b-12d3-a456-426614174014';
      const customerId = 'b23e4568-e89b-12d3-a456-426614174014';

      const mockOriginalLog = {
        id: logId,
        customer_id: customerId,
        type: 'booking_confirmation',
        channel: 'email',
        recipient: 'test@example.com',
        status: 'failed',
        template_data: {},
      };

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOriginalLog, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      mockNotificationService.send.mockRejectedValue(new Error('Network timeout'));

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${logId}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: logId });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Network timeout');
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const validUuid = '00000000-0000-0000-0000-000000000000';
      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Database Errors', () => {
    it('should handle database errors gracefully', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockRejectedValue(new Error('Database connection error')),
        }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/admin/notifications/log/${validUuid}/resend`,
        { method: 'POST' }
      );
      const params = Promise.resolve({ id: validUuid });
      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });
});
