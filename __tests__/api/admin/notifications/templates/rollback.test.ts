/**
 * Tests for POST /api/admin/notifications/templates/[id]/rollback (Task 0126)
 * Template Rollback API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/notifications/templates/[id]/rollback/route';

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

describe('POST /api/admin/notifications/templates/[id]/rollback', () => {
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

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ version: 1, reason: 'Test rollback' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id/rollback', {
        method: 'POST',
        body: JSON.stringify({ version: 1, reason: 'Test rollback' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });

    it('should reject missing version number', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Test Template',
        version: 3,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Test rollback' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('version');
    });

    it('should reject missing reason', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Test Template',
        version: 3,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ version: 1 }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('reason');
    });

    it('should reject invalid version number', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Test Template',
        version: 3,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ version: 'invalid', reason: 'Test' }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('version');
    });
  });

  describe('Rollback Operation', () => {
    it('should rollback to previous version successfully', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Current Template V3',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'V3 Subject',
        html_template: '<p>V3 Body</p>',
        text_template: 'V3 Text',
        variables: [],
        is_active: true,
        version: 3,
        created_by: 'admin-1',
        updated_by: 'admin-2',
      };

      const historicalVersion = {
        id: 'history-1',
        template_id: validUuid,
        version: 1,
        name: 'Original Template V1',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'V1 Subject',
        html_template: '<p>V1 Body</p>',
        text_template: 'V1 Text',
        variables: [],
        changed_by: 'admin-1',
        change_reason: 'Initial version',
        created_at: '2024-01-01T00:00:00Z',
      };

      const rolledBackTemplate = {
        ...currentTemplate,
        name: historicalVersion.name,
        subject_template: historicalVersion.subject_template,
        html_template: historicalVersion.html_template,
        text_template: historicalVersion.text_template,
        version: 4,
        updated_by: 'admin-1',
      };

      let historySaved = false;
      let templateUpdated = false;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => {
                    templateUpdated = true;
                    return Promise.resolve({ data: rolledBackTemplate, error: null });
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'notification_template_history') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: historicalVersion, error: null })),
                })),
              })),
            })),
            insert: vi.fn(() => {
              historySaved = true;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          reason: 'Reverting breaking changes',
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.template).toBeDefined();
      expect(data.template.version).toBe(4); // Version incremented
      expect(historySaved).toBe(true); // Current version saved to history
      expect(templateUpdated).toBe(true); // Template updated with historical content
    });

    it('should include rollback info in change_reason', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Current',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Current',
        html_template: '<p>Current</p>',
        text_template: 'Current',
        variables: [],
        is_active: true,
        version: 3,
        created_by: 'admin-1',
        updated_by: 'admin-1',
      };

      const historicalVersion = {
        id: 'history-1',
        template_id: validUuid,
        version: 2,
        name: 'Old',
        type: 'transactional',
        trigger_event: 'test.event',
        channel: 'email',
        subject_template: 'Old',
        html_template: '<p>Old</p>',
        text_template: 'Old',
        variables: [],
      };

      let historyChangeReason = '';

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { ...currentTemplate, version: 4 }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === 'notification_template_history') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: historicalVersion, error: null })),
                })),
              })),
            })),
            insert: vi.fn((data: any) => {
              historyChangeReason = data.change_reason;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({
          version: 2,
          reason: 'Bug in latest version',
        }),
      });
      await POST(request, { params: Promise.resolve({ id: validUuid }) });

      expect(historyChangeReason).toContain('Rolled back to version 2');
      expect(historyChangeReason).toContain('Bug in latest version');
    });

    it('should return 404 when historical version not found', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Current',
        version: 3,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
          };
        }
        if (table === 'notification_template_history') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
                })),
              })),
            })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({
          version: 99, // Non-existent version
          reason: 'Test',
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Version 99 not found');
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

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          reason: 'Test',
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during rollback', async () => {
      const currentTemplate = {
        id: validUuid,
        name: 'Current',
        version: 3,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'notification_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: currentTemplate, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Update failed' } })),
                })),
              })),
            })),
          };
        }
        if (table === 'notification_template_history') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({
                    data: { id: 'history-1', version: 1, name: 'Old' },
                    error: null,
                  })),
                })),
              })),
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
          };
        }
        return {};
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/rollback`, {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          reason: 'Test',
        }),
      });
      const response = await POST(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to rollback template');
    });
  });
});
