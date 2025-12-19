/**
 * Tests for Admin Staff Detail API Route
 * GET /api/admin/settings/staff/[id] - Get staff member detail
 * Task 0206: Staff Detail API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/admin/settings/staff/[id]/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');

describe('Admin Staff Detail API - GET /api/admin/settings/staff/[id]', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockStaffProfile = {
    id: 'staff-1',
    email: 'groomer1@test.com',
    first_name: 'Alice',
    last_name: 'Smith',
    phone: '555-0001',
    role: 'groomer' as const,
    avatar_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    preferences: {},
  };

  const mockRecentAppointments = [
    {
      id: 'apt-1',
      customer_id: 'cust-1',
      pet_id: 'pet-1',
      groomer_id: 'staff-1',
      service_id: 'svc-1',
      scheduled_at: '2024-01-15T10:00:00Z',
      status: 'completed',
      total_price: 75.0,
      notes: 'Client requested sanitary cut',
      customer: {
        id: 'cust-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
      },
      pet: {
        id: 'pet-1',
        name: 'Buddy',
        breed: 'Golden Retriever',
      },
      service: {
        id: 'svc-1',
        name: 'Premium Grooming',
        description: 'Full grooming service',
      },
    },
  ];

  const mockCommissionSettings = {
    id: 'comm-1',
    groomer_id: 'staff-1',
    rate_type: 'percentage' as const,
    rate: 25,
    include_addons: true,
    service_overrides: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return complete staff profile with details', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 15, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockRecentAppointments,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCommissionSettings,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.profile).toMatchObject({
        id: 'staff-1',
        email: 'groomer1@test.com',
        first_name: 'Alice',
        last_name: 'Smith',
        role: 'groomer',
      });
      expect(data.data.stats).toBeDefined();
      expect(data.data.recent_appointments).toBeDefined();
      expect(data.data.commission_settings).toBeDefined();
    });

    it('should calculate completed appointments correctly', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 42, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockRecentAppointments,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCommissionSettings,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.stats.completed_appointments).toBe(42);
    });

    it('should calculate upcoming appointments correctly', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQueryCompleted = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 42, error: null }),
      };

      const mockCountQueryUpcoming = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockRecentAppointments,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockCommissionSettings,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQueryCompleted) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQueryUpcoming) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.stats.upcoming_appointments).toBe(5);
    });

    it('should include recent appointments (last 10)', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockRecentAppointments,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockCommissionSettings,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.recent_appointments).toHaveLength(1);
      expect(data.data.recent_appointments[0]).toMatchObject({
        id: 'apt-1',
        status: 'completed',
        customer: expect.objectContaining({ first_name: 'John' }),
        pet: expect.objectContaining({ name: 'Buddy' }),
      });
    });

    it('should include commission settings in response', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockCommissionSettings,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.commission_settings).toMatchObject({
        groomer_id: 'staff-1',
        rate_type: 'percentage',
        rate: 25,
      });
    });

    it('should handle missing commission settings', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.commission_settings).toBeNull();
    });

    it('should return null rating when no report cards exist', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.stats.avg_rating).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent staff', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/nonexistent-id'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent-id' }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject non-staff users (customers)', async () => {
      const customerProfile = {
        ...mockStaffProfile,
        role: 'customer' as const,
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: customerProfile,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/customer-id'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'customer-id' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not a staff member');
    });

    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockRejectedValue(new Error('Database connection error')),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle empty recent appointments list', async () => {
      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.recent_appointments).toEqual([]);
    });
  });

  describe('Admin Role Handling', () => {
    it('should retrieve admin user details', async () => {
      const adminProfile = {
        ...mockStaffProfile,
        role: 'admin' as const,
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: adminProfile,
          error: null,
        }),
      };

      const mockCountQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      const mockAppointmentsQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockCountQuery) })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockAppointmentsQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.profile.role).toBe('admin');
    });
  });
});
