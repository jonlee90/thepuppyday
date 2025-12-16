/**
 * Tests for POST /api/admin/notifications/templates/[id]/test (Task 0124)
 * Test Notification API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/notifications/templates/[id]/test/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/utils/validation', () => ({
  isValidUUID: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
  validateEmail: vi.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePhone: vi.fn((phone: string) => /^\+1\d{10}$/.test(phone)),
}));

vi.mock('@/lib/notifications/service', () => ({
  getNotificationService: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');
const { getNotificationService } = await import('@/lib/notifications/service');

describe('POST /api/admin/notifications/templates/[id]/test', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNotificationService: any;
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    };

    mockNotificationService = {
      send: vi.fn(() => Promise.resolve({
        success: true,
        messageId: 'test-msg-123',
      })),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
    vi.mocked(getNotificationService).mockReturnValue(mockNotificationService);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id/test', {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });

    it('should reject missing recipient for email template', async () => {
      const template = {
        id: validUuid,
        name: 'Email Test',
        channel: 'email',
        subject_template: 'Test',
        html_template: '<p>Test</p>',
        text_template: 'Test',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('recipient_email');
    });

    it('should reject missing recipient for SMS template', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Test',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Test message',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('recipient_phone');
    });

    it('should reject invalid email format', async () => {
      const template = {
        id: validUuid,
        name: 'Email Test',
        channel: 'email',
        subject_template: 'Test',
        html_template: '<p>Test</p>',
        text_template: 'Test',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'invalid-email',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid email');
    });

    it('should reject invalid phone format', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Test',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Test',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_phone: '1234567890',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid phone');
    });
  });

  describe('Email Test Send', () => {
    it('should send test email with [TEST] prefix', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        channel: 'email',
        subject_template: 'Appointment for {{pet_name}}',
        html_template: '<p>Hello {{customer_name}}</p>',
        text_template: 'Hello {{customer_name}}',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {
            customer_name: 'John',
            pet_name: 'Max',
          },
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockNotificationService.send).toHaveBeenCalled();

      // Verify [TEST] prefix was added
      const sendCall = mockNotificationService.send.mock.calls[0][0];
      expect(sendCall.subject).toContain('[TEST]');
    });

    it('should log test email with is_test flag', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        channel: 'email',
        subject_template: 'Test',
        html_template: '<p>Test</p>',
        text_template: 'Test',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });

      expect(response.status).toBe(200);
      expect(mockNotificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          is_test: true,
        })
      );
    });
  });

  describe('SMS Test Send', () => {
    it('should send test SMS', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Template',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Hi {{name}}, your appointment is confirmed',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_phone: '+15555555555',
          sample_data: { name: 'John' },
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockNotificationService.send).toHaveBeenCalled();
    });

    it('should add [TEST] prefix to SMS body', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Template',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Test message',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_phone: '+15555555555',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });

      expect(response.status).toBe(200);
      const sendCall = mockNotificationService.send.mock.calls[0][0];
      expect(sendCall.body).toContain('[TEST]');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when template not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });

    it('should handle notification send failures', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        channel: 'email',
        subject_template: 'Test',
        html_template: '<p>Test</p>',
        text_template: 'Test',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      mockNotificationService.send.mockResolvedValue({
        success: false,
        error: 'Failed to send email',
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/test`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: 'test@example.com',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to send');
    });
  });
});
