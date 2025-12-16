/**
 * Tests for GET /api/admin/notifications/templates (Task 0120)
 * Template List API with filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/notifications/templates/route';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

const { createServerSupabaseClient } = await import('@/lib/supabase/server');
const { requireAdmin } = await import('@/lib/admin/auth');

describe('GET /api/admin/notifications/templates', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

      const request = new NextRequest('http://localhost/api/admin/notifications/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept authenticated admin requests', async () => {
      const request = new NextRequest('http://localhost/api/admin/notifications/templates');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(requireAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template Listing', () => {
    it('should return all templates when no filters provided', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Appointment Confirmation',
          description: 'Sent when appointment is confirmed',
          type: 'transactional',
          trigger_event: 'appointment.confirmed',
          channel: 'email',
          is_active: true,
          version: 1,
          variables: [{ name: 'customer_name', description: 'Customer name', required: true }],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'template-2',
          name: 'Appointment Reminder',
          description: 'Sent before appointment',
          type: 'reminder',
          trigger_event: 'appointment.reminder',
          channel: 'sms',
          is_active: true,
          version: 2,
          variables: [{ name: 'pet_name', description: 'Pet name', required: true }],
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(2);
      expect(data.templates[0].name).toBe('Appointment Confirmation');
    });

    it('should filter by type', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Marketing Email',
          type: 'marketing',
          channel: 'email',
          is_active: true,
          version: 1,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates?type=marketing');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(1);
      expect(data.templates[0].type).toBe('marketing');
    });

    it('should filter by trigger_event', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Appointment Confirmed',
          trigger_event: 'appointment.confirmed',
          is_active: true,
          version: 1,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates?trigger_event=appointment.confirmed');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates[0].trigger_event).toBe('appointment.confirmed');
    });

    it('should filter by active_only', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Active Template',
          is_active: true,
          version: 1,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates?active_only=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates.every((t: any) => t.is_active)).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Active Reminder',
          type: 'reminder',
          trigger_event: 'appointment.reminder',
          is_active: true,
          version: 1,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates?type=reminder&trigger_event=appointment.reminder&active_only=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(1);
    });

    it('should return empty array when no templates match', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates?type=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' },
          })),
        })),
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch templates');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost/api/admin/notifications/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Unexpected error');
    });
  });
});
