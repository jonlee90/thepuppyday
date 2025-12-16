/**
 * Tests for GET /api/admin/notifications/templates/[id]/history (Task 0125)
 * Template History API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/notifications/templates/[id]/history/route';

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

describe('GET /api/admin/notifications/templates/[id]/history', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID format', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates/invalid-id/history');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid template ID format');
    });
  });

  describe('History Retrieval', () => {
    it('should return version history ordered by version descending', async () => {
      const mockHistory = [
        {
          id: 'history-3',
          template_id: validUuid,
          version: 3,
          name: 'Template V3',
          changed_by: 'admin-2',
          change_reason: 'Updated styling',
          created_at: '2024-01-03T00:00:00Z',
          changed_by_user: {
            email: 'admin2@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
        {
          id: 'history-2',
          template_id: validUuid,
          version: 2,
          name: 'Template V2',
          changed_by: 'admin-1',
          change_reason: 'Fixed typo',
          created_at: '2024-01-02T00:00:00Z',
          changed_by_user: {
            email: 'admin1@example.com',
            first_name: 'John',
            last_name: 'Doe',
          },
        },
        {
          id: 'history-1',
          template_id: validUuid,
          version: 1,
          name: 'Template V1',
          changed_by: 'admin-1',
          change_reason: 'Initial version',
          created_at: '2024-01-01T00:00:00Z',
          changed_by_user: {
            email: 'admin1@example.com',
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockHistory, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(3);
      expect(data.history[0].version).toBe(3);
      expect(data.history[1].version).toBe(2);
      expect(data.history[2].version).toBe(1);
    });

    it('should include user information for each version', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          template_id: validUuid,
          version: 1,
          name: 'Template',
          changed_by: 'admin-1',
          change_reason: 'Initial version',
          created_at: '2024-01-01T00:00:00Z',
          changed_by_user: {
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
          },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockHistory, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history[0].changed_by_user).toBeDefined();
      expect(data.history[0].changed_by_user.email).toBe('admin@example.com');
      expect(data.history[0].changed_by_user.first_name).toBe('Admin');
    });

    it('should return empty array when no history exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(0);
    });

    it('should include change_reason in history entries', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          template_id: validUuid,
          version: 2,
          name: 'Template',
          changed_by: 'admin-1',
          change_reason: 'Updated for better clarity',
          created_at: '2024-01-02T00:00:00Z',
          changed_by_user: { email: 'admin@example.com' },
        },
        {
          id: 'history-2',
          template_id: validUuid,
          version: 1,
          name: 'Template',
          changed_by: 'admin-1',
          change_reason: null,
          created_at: '2024-01-01T00:00:00Z',
          changed_by_user: { email: 'admin@example.com' },
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockHistory, error: null })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.history[0].change_reason).toBe('Updated for better clarity');
      expect(data.history[1].change_reason).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })),
          })),
        })),
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch template history');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest(`http://localhost/api/admin/notifications/templates/${validUuid}/history`);
      const response = await GET(request, { params: Promise.resolve({ id: validUuid }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unexpected error');
    });
  });
});
