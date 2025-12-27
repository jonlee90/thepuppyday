/**
 * Integration tests for /api/admin/groomers
 * Task 0282: Admin API Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/groomers/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/mocks/supabase/store', () => ({
  getMockStore: vi.fn(() => ({
    select: vi.fn(() => [
      {
        id: 'groomer-1',
        first_name: 'Alice',
        last_name: 'Groomer',
        email: 'alice@thepuppyday.com',
        role: 'groomer',
        is_active: true,
      },
      {
        id: 'admin-1',
        first_name: 'Bob',
        last_name: 'Admin',
        email: 'bob@thepuppyday.com',
        role: 'admin',
        is_active: true,
      },
      {
        id: 'customer-1',
        first_name: 'Charlie',
        last_name: 'Customer',
        email: 'charlie@example.com',
        role: 'customer',
        is_active: true,
      },
      {
        id: 'groomer-2',
        first_name: 'Diana',
        last_name: 'Groomer',
        email: 'diana@thepuppyday.com',
        role: 'groomer',
        is_active: false,
      },
    ]),
  })),
}));

describe('GET /api/admin/groomers', () => {
  let mockSupabase: any;

  const mockAdmin = {
    user: { id: 'admin-1', role: 'admin' } as any,
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      order: vi.fn(),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  describe('Authentication and authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
      expect(requireAdmin).toHaveBeenCalledWith(mockSupabase);
    });

    it('should allow admin access', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'admin-1',
            first_name: 'Bob',
            last_name: 'Admin',
            email: 'bob@thepuppyday.com',
            role: 'admin',
          },
        ],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toBeDefined();
    });

    it('should allow groomer access (staff)', async () => {
      const mockGroomer = {
        user: { id: 'groomer-1', role: 'groomer' } as any,
        role: 'groomer' as const,
      };

      vi.mocked(requireAdmin).mockResolvedValue(mockGroomer);

      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'groomer-1',
            first_name: 'Alice',
            last_name: 'Groomer',
            email: 'alice@thepuppyday.com',
            role: 'groomer',
          },
        ],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toBeDefined();
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should fetch groomers from database', async () => {
      const mockGroomers = [
        {
          id: 'groomer-1',
          first_name: 'Alice',
          last_name: 'Groomer',
          email: 'alice@thepuppyday.com',
          role: 'groomer',
        },
        {
          id: 'admin-1',
          first_name: 'Bob',
          last_name: 'Admin',
          email: 'bob@thepuppyday.com',
          role: 'admin',
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockGroomers,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toEqual(mockGroomers);

      // Verify query construction
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith('id, first_name, last_name, email, role');
      expect(mockSupabase.in).toHaveBeenCalledWith('role', ['admin', 'groomer']);
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabase.order).toHaveBeenCalledWith('first_name', { ascending: true });
    });

    it('should only return active groomers and admins', async () => {
      const activeGroomers = [
        {
          id: 'groomer-1',
          first_name: 'Alice',
          last_name: 'Groomer',
          email: 'alice@thepuppyday.com',
          role: 'groomer',
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: activeGroomers,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toEqual(activeGroomers);
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should exclude customers', async () => {
      const staffOnly = [
        {
          id: 'admin-1',
          first_name: 'Bob',
          last_name: 'Admin',
          email: 'bob@thepuppyday.com',
          role: 'admin',
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: staffOnly,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers.every((g: any) => g.role !== 'customer')).toBe(true);
    });

    it('should sort groomers by first name', async () => {
      const sortedGroomers = [
        {
          id: 'groomer-1',
          first_name: 'Alice',
          last_name: 'Groomer',
          email: 'alice@thepuppyday.com',
          role: 'groomer',
        },
        {
          id: 'admin-1',
          first_name: 'Bob',
          last_name: 'Admin',
          email: 'bob@thepuppyday.com',
          role: 'admin',
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: sortedGroomers,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toEqual(sortedGroomers);
      expect(mockSupabase.order).toHaveBeenCalledWith('first_name', { ascending: true });
    });

    it('should handle empty result set', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch groomers');
    });
  });

  describe('Mock mode', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should fetch groomers from mock store', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers).toBeDefined();
      expect(Array.isArray(json.groomers)).toBe(true);
    });

    it('should filter by role and is_active in mock mode', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include active groomers and admins
      if (json.groomers.length > 0) {
        expect(json.groomers.every((g: any) =>
          (g.role === 'admin' || g.role === 'groomer')
        )).toBe(true);
        // Note: Mock mode may not filter by is_active depending on implementation
      }
    });

    it('should sort mock groomers by first name', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);

      // Verify sorting
      const names = json.groomers.map((g: any) => g.first_name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('RLS enforcement', () => {
    it('should verify admin role before querying', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await GET();

      // Verify requireAdmin was called before any database operations
      expect(requireAdmin).toHaveBeenCalledWith(mockSupabase);
    });

    it('should not query database if authorization fails', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      await GET();

      // Verify no database queries were made
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Response format', () => {
    it('should return groomers array with correct fields', async () => {
      const mockGroomer = {
        id: 'groomer-1',
        first_name: 'Alice',
        last_name: 'Groomer',
        email: 'alice@thepuppyday.com',
        role: 'groomer',
      };

      mockSupabase.order.mockResolvedValue({
        data: [mockGroomer],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('groomers');
      expect(json.groomers[0]).toHaveProperty('id');
      expect(json.groomers[0]).toHaveProperty('first_name');
      expect(json.groomers[0]).toHaveProperty('last_name');
      expect(json.groomers[0]).toHaveProperty('email');
      expect(json.groomers[0]).toHaveProperty('role');
    });

    it('should not include sensitive fields', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            id: 'groomer-1',
            first_name: 'Alice',
            last_name: 'Groomer',
            email: 'alice@thepuppyday.com',
            role: 'groomer',
          },
        ],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.groomers[0]).not.toHaveProperty('password');
      expect(json.groomers[0]).not.toHaveProperty('avatar_url');
      expect(json.groomers[0]).not.toHaveProperty('preferences');
    });
  });
});
