/**
 * Tests for PUT /api/admin/notifications/templates/[id] (Task 0122)
 * Template Update API with validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/admin/notifications/templates/[id]/route';

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

describe('PUT /api/admin/notifications/templates/[id]', () => {
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
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
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

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({ subject_template: 'Test' }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id', {
        method: 'PUT',
        body: JSON.stringify({ subject_template: 'Test' }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });

    it('should validate required variables are present in templates', async () => {
      const existingTemplate = {
        id: validUuid,
        name: 'Test Template',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Hello {{customer_name}}',
        html_template: '<p>Hello</p>',
        text_template: 'Hello',
        variables: [
          { name: 'customer_name', description: 'Customer name', required: true },
          { name: 'pet_name', description: 'Pet name', required: true },
        ],
        is_active: true,
        version: 1,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: existingTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      // Missing required variable 'pet_name'
      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_template: 'Hello {{customer_name}}',
          html_template: '<p>Missing pet_name variable</p>',
          text_template: 'Missing pet_name',
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required variables');
    });

    it('should accept templates with all required variables', async () => {
      const existingTemplate = {
        id: validUuid,
        name: 'Test Template',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Old subject',
        html_template: '<p>Old</p>',
        text_template: 'Old',
        variables: [
          { name: 'customer_name', description: 'Customer name', required: true },
          { name: 'pet_name', description: 'Pet name', required: true },
        ],
        is_active: true,
        version: 1,
        created_by: 'admin-1',
        updated_by: 'admin-1',
      };

      const updatedTemplate = {
        ...existingTemplate,
        subject_template: 'Hello {{customer_name}} and {{pet_name}}',
        html_template: '<p>Hello {{customer_name}}, {{pet_name}} appointment confirmed</p>',
        text_template: 'Hello {{customer_name}}, {{pet_name}} appointment confirmed',
        version: 2,
        updated_by: 'admin-1',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: existingTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: updatedTemplate, error: null })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_template: 'Hello {{customer_name}} and {{pet_name}}',
          html_template: '<p>Hello {{customer_name}}, {{pet_name}} appointment confirmed</p>',
          text_template: 'Hello {{customer_name}}, {{pet_name}} appointment confirmed',
          change_reason: 'Updated greeting',
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });

      expect(response.status).toBe(200);
    });
  });

  describe('Template Update', () => {
    it('should update subject template', async () => {
      const existingTemplate = {
        id: validUuid,
        name: 'Test',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Old subject',
        html_template: '<p>Body {{name}}</p>',
        text_template: 'Body {{name}}',
        variables: [{ name: 'name', description: 'Name', required: true }],
        is_active: true,
        version: 1,
        created_by: 'admin-1',
        updated_by: 'admin-1',
      };

      const updatedTemplate = {
        ...existingTemplate,
        subject_template: 'New subject {{name}}',
        version: 2,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: existingTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: updatedTemplate, error: null })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_template: 'New subject {{name}}',
          change_reason: 'Updated subject',
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.subject_template).toBe('New subject {{name}}');
      expect(data.template.version).toBe(2);
    });

    it('should save to history before updating', async () => {
      const existingTemplate = {
        id: validUuid,
        name: 'Test',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Subject {{name}}',
        html_template: '<p>Body {{name}}</p>',
        text_template: 'Body {{name}}',
        variables: [{ name: 'name', description: 'Name', required: true }],
        is_active: true,
        version: 1,
        created_by: 'admin-1',
        updated_by: 'admin-1',
      };

      let historyInsertCalled = false;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: existingTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { ...existingTemplate, version: 2 }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === 'notification_template_history') {
          return {
            insert: vi.fn(() => {
              historyInsertCalled = true;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          html_template: '<p>Updated {{name}}</p>',
          change_reason: 'Updated content',
        }),
      });
      await PUT(request, { params: Promise.resolve({ id: validUuid }) });

      expect(historyInsertCalled).toBe(true);
    });

    it('should toggle is_active flag', async () => {
      const existingTemplate = {
        id: validUuid,
        name: 'Test',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Subject',
        html_template: '<p>Body</p>',
        text_template: 'Body',
        variables: [],
        is_active: true,
        version: 1,
        created_by: 'admin-1',
        updated_by: 'admin-1',
      };

      const updatedTemplate = { ...existingTemplate, is_active: false, version: 2 };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: existingTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: updatedTemplate, error: null })),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        };
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          is_active: false,
          change_reason: 'Deactivating template',
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template.is_active).toBe(false);
    });

    it('should return 404 when template not found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
              })),
            })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_template: 'Test',
        }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
          })),
        })),
      }));

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}`, {
        method: 'PUT',
        body: JSON.stringify({ subject_template: 'Test' }),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update template');
    });
  });
});
