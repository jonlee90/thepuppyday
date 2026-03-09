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
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/utils/validation', () => ({
  isValidUUID: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
  validateEmail: vi.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  validatePhone: vi.fn((phone: string) => /^\+1\d{10}$/.test(phone)),
}));

vi.mock('@/lib/notifications/template-engine', () => ({
  createTemplateEngine: vi.fn(() => ({
    render: vi.fn((template: string, data: Record<string, unknown>) =>
      template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''))
    ),
    calculateSegmentCount: vi.fn((text: string) => Math.ceil(text.length / 160)),
  })),
}));

vi.mock('@/lib/notifications/providers', () => ({
  getEmailProvider: vi.fn(),
  getSMSProvider: vi.fn(),
}));

vi.mock('@/lib/notifications/logger', () => ({
  createNotificationLogger: vi.fn(),
}));

const { createServerSupabaseClient, createServiceRoleClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');
const { getEmailProvider, getSMSProvider } = await import('@/lib/notifications/providers');
const { createNotificationLogger } = await import('@/lib/notifications/logger');

describe('POST /api/admin/notifications/templates/[id]/test', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEmailProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSmsProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;
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

    mockEmailProvider = {
      send: vi.fn(() => Promise.resolve({ success: true, messageId: 'test-msg-123' })),
    };

    mockSmsProvider = {
      send: vi.fn(() => Promise.resolve({ success: true, messageId: 'test-msg-123' })),
    };

    mockLogger = {
      create: vi.fn(() => Promise.resolve('log-id-1')),
      update: vi.fn(() => Promise.resolve()),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
    vi.mocked(getEmailProvider).mockReturnValue(mockEmailProvider);
    vi.mocked(getSMSProvider).mockReturnValue(mockSmsProvider);
    vi.mocked(createNotificationLogger).mockReturnValue(mockLogger);
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

    it('should accept phone and attempt to send SMS', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Test',
        type: 'transactional',
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
          recipient_phone: '+15555555555',
          sample_data: {},
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Email Test Send', () => {
    it('should send test email with [TEST] prefix', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        type: 'transactional',
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
      expect(mockEmailProvider.send).toHaveBeenCalled();

      // Verify [TEST] prefix was added
      const sendCall = mockEmailProvider.send.mock.calls[0][0];
      expect(sendCall.subject).toContain('[TEST]');
    });

    it('should log test email with is_test flag', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        type: 'transactional',
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
      expect(mockLogger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isTest: true,
        })
      );
    });
  });

  describe('SMS Test Send', () => {
    it('should send test SMS', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Template',
        type: 'transactional',
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
      expect(mockSmsProvider.send).toHaveBeenCalled();
    });

    it('should send SMS with rendered text body', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Template',
        type: 'transactional',
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
      const sendCall = mockSmsProvider.send.mock.calls[0][0];
      expect(sendCall.body).toBe('Test message');
      expect(sendCall.to).toBe('+15555555555');
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
        type: 'transactional',
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

      mockEmailProvider.send.mockResolvedValue({
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
