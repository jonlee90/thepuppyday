/**
 * Tests for GET /api/admin/notifications/templates/[id] (Task 0121)
 * Template Detail API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/notifications/templates/[id]/route';

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

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');

describe('GET /api/admin/notifications/templates/[id]', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

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

      const request = new NextRequest('http://localhost/api/admin/notifications/templates/template-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });

    it('should accept valid UUID format', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: validUuid,
                name: 'Test Template',
                type: 'transactional',
                channel: 'email',
                is_active: true,
                version: 1,
              },
              error: null,
            })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });

      expect(response.status).toBe(200);
    });
  });

  describe('Template Retrieval', () => {
    it('should return full template details', async () => {
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Appointment Confirmation',
        description: 'Sent when appointment is confirmed',
        type: 'transactional',
        trigger_event: 'appointment.confirmed',
        channel: 'email',
        subject_template: 'Appointment Confirmed for {{pet_name}}',
        html_template: '<p>Hello {{customer_name}}, your appointment for {{pet_name}} is confirmed.</p>',
        text_template: 'Hello {{customer_name}}, your appointment for {{pet_name}} is confirmed.',
        variables: [
          { name: 'customer_name', description: 'Customer first name', required: true },
          { name: 'pet_name', description: 'Pet name', required: true },
        ],
        is_active: true,
        version: 1,
        created_by: 'admin-1',
        updated_by: 'admin-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockTemplate, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${mockTemplate.id}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockTemplate.id }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template).toBeDefined();
      expect(data.template.id).toBe(mockTemplate.id);
      expect(data.template.name).toBe(mockTemplate.name);
      expect(data.template.subject_template).toBe(mockTemplate.subject_template);
      expect(data.template.html_template).toBe(mockTemplate.html_template);
      expect(data.template.text_template).toBe(mockTemplate.text_template);
      expect(data.template.variables).toHaveLength(2);
    });

    it('should return 404 when template not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found' },
            })),
          })),
        })),
      });

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });

    it('should include all template fields', async () => {
      const mockTemplate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        description: 'Test description',
        type: 'reminder',
        trigger_event: 'appointment.reminder',
        channel: 'sms',
        subject_template: null,
        html_template: null,
        text_template: 'Hi {{customer_name}}!',
        variables: [{ name: 'customer_name', description: 'Name', required: true }],
        is_active: false,
        version: 3,
        created_by: 'admin-1',
        updated_by: 'admin-2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockTemplate, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${mockTemplate.id}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockTemplate.id }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.channel).toBe('sms');
      expect(data.template.text_template).toBe(mockTemplate.text_template);
      expect(data.template.is_active).toBe(false);
      expect(data.template.version).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })),
          })),
        })),
      });

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch template');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unexpected error');
    });
  });
});
