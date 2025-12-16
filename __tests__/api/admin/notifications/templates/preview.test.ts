/**
 * Tests for POST /api/admin/notifications/templates/[id]/preview (Task 0123)
 * Template Preview API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/notifications/templates/[id]/preview/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/utils/validation', () => ({
  isValidUUID: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
}));

vi.mock('@/lib/notifications/template-engine', () => ({
  renderTemplate: vi.fn((template: string, data: any) => {
    // Simple mock that replaces {{variable}} with data values
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');
const { renderTemplate } = await import('@/lib/notifications/template-engine');

describe('POST /api/admin/notifications/templates/[id]/preview', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
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

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id/preview', {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });

    it('should reject missing sample_data', async () => {
      const template = {
        id: validUuid,
        name: 'Test',
        channel: 'email',
        subject_template: 'Hello',
        html_template: '<p>Hello</p>',
        text_template: 'Hello',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sample_data is required');
    });
  });

  describe('Email Template Preview', () => {
    it('should render email template with sample data', async () => {
      const template = {
        id: validUuid,
        name: 'Appointment Confirmation',
        channel: 'email',
        subject_template: 'Appointment for {{pet_name}}',
        html_template: '<p>Hello {{customer_name}}, {{pet_name}} is confirmed for {{date}}</p>',
        text_template: 'Hello {{customer_name}}, {{pet_name}} is confirmed for {{date}}',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const sampleData = {
        customer_name: 'John',
        pet_name: 'Max',
        date: 'Jan 15, 2024',
      };

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: sampleData }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rendered_subject).toBe('Appointment for Max');
      expect(data.rendered_html).toBe('<p>Hello John, Max is confirmed for Jan 15, 2024</p>');
      expect(data.rendered_text).toBe('Hello John, Max is confirmed for Jan 15, 2024');
    });

    it('should not include SMS metadata for email templates', async () => {
      const template = {
        id: validUuid,
        name: 'Email Template',
        channel: 'email',
        subject_template: 'Subject',
        html_template: '<p>Body</p>',
        text_template: 'Body',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.character_count).toBeUndefined();
      expect(data.segment_count).toBeUndefined();
    });
  });

  describe('SMS Template Preview', () => {
    it('should render SMS template with character and segment count', async () => {
      const template = {
        id: validUuid,
        name: 'SMS Reminder',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Hi {{name}}, reminder for {{pet}} tomorrow at {{time}}',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const sampleData = {
        name: 'John',
        pet: 'Max',
        time: '2:00 PM',
      };

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: sampleData }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rendered_text).toBe('Hi John, reminder for Max tomorrow at 2:00 PM');
      expect(data.character_count).toBe(47);
      expect(data.segment_count).toBe(1);
    });

    it('should calculate multiple segments for long messages', async () => {
      const longMessage = 'A'.repeat(200); // 200 characters
      const template = {
        id: validUuid,
        name: 'Long SMS',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: longMessage,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.character_count).toBe(200);
      expect(data.segment_count).toBe(2); // 200 chars = 2 segments (160 chars each)
    });

    it('should warn about long messages', async () => {
      const template = {
        id: validUuid,
        name: 'Long SMS',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'A'.repeat(500),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.warning).toBeDefined();
      expect(data.warning).toContain('segments');
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

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });

    it('should handle template rendering errors', async () => {
      const template = {
        id: validUuid,
        name: 'Test',
        channel: 'email',
        subject_template: 'Subject',
        html_template: '<p>Body</p>',
        text_template: 'Body',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: template, error: null })),
          })),
        })),
      });

      vi.mocked(renderTemplate).mockImplementation(() => {
        throw new Error('Template syntax error');
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/preview`, {
        method: 'POST',
        body: JSON.stringify({ sample_data: {} }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Template syntax error');
    });
  });
});
