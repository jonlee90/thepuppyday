/**
 * Tests for Admin Staff Commission Settings API Route
 * GET /api/admin/settings/staff/[id]/commission - Get commission settings
 * PUT /api/admin/settings/staff/[id]/commission - Update commission settings
 * Task 0207: Commission Settings API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET, PUT } from '@/app/api/admin/settings/staff/[id]/commission/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/admin/audit-log');

describe('Admin Staff Commission Settings API - GET', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

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

  const mockStaffUser = {
    id: 'staff-1',
    role: 'groomer' as const,
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
    it('should return existing commission settings', async () => {
      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
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
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toMatchObject({
        groomer_id: 'staff-1',
        rate_type: 'percentage',
        rate: 25,
        include_addons: true,
      });
    });

    it('should return default settings if none exist', async () => {
      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toMatchObject({
        rate_type: 'percentage',
        rate: 0,
        include_addons: false,
        service_overrides: null,
      });
    });

    it('should return commission with service overrides', async () => {
      const commissionWithOverrides = {
        ...mockCommissionSettings,
        service_overrides: [
          { service_id: 'svc-1', rate: 30 },
          { service_id: 'svc-2', rate: 35 },
        ],
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: commissionWithOverrides,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.service_overrides).toHaveLength(2);
      expect(data.data.service_overrides[0].service_id).toBe('svc-1');
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent staff', async () => {
      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockStaffQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/nonexistent/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockCommissionQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'OTHER_ERROR' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockCommissionQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission'
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch');
    });
  });
});

describe('Admin Staff Commission Settings API - PUT', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockStaffUser = {
    id: 'staff-1',
    role: 'groomer' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(logSettingsChange).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should update commission settings with percentage rate', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 30,
        include_addons: true,
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'comm-1', groomer_id: 'staff-1', ...updateData },
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toMatchObject(updateData);
      expect(vi.mocked(logSettingsChange)).toHaveBeenCalled();
    });

    it('should update commission settings with flat rate', async () => {
      const updateData = {
        rate_type: 'flat_rate' as const,
        rate: 15,
        include_addons: false,
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'comm-1', groomer_id: 'staff-1', ...updateData },
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rate_type).toBe('flat_rate');
      expect(data.data.rate).toBe(15);
    });

    it('should update with service overrides', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 25,
        include_addons: true,
        service_overrides: [
          { service_id: 'svc-1', rate: 30 },
          { service_id: 'svc-2', rate: 35 },
        ],
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'svc-1' }, { id: 'svc-2' }],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'comm-1', groomer_id: 'staff-1', ...updateData },
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.service_overrides).toHaveLength(2);
    });

    it('should update with zero rate', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 0,
        include_addons: false,
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'comm-1', groomer_id: 'staff-1', ...updateData },
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.rate).toBe(0);
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing rate_type', async () => {
      const invalidData = {
        rate: 25,
        include_addons: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid rate_type', async () => {
      const invalidData = {
        rate_type: 'invalid_type',
        rate: 25,
        include_addons: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing rate', async () => {
      const invalidData = {
        rate_type: 'percentage',
        include_addons: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject negative rate', async () => {
      const invalidData = {
        rate_type: 'percentage',
        rate: -10,
        include_addons: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject percentage rate > 100', async () => {
      const invalidData = {
        rate_type: 'percentage',
        rate: 150,
        include_addons: true,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing include_addons', async () => {
      const invalidData = {
        rate_type: 'percentage',
        rate: 25,
      };

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(invalidData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid service IDs in overrides', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 25,
        include_addons: true,
        service_overrides: [
          { service_id: 'invalid-uuid', rate: 30 },
        ],
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockStaffQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject non-existent service IDs in overrides', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 25,
        include_addons: true,
        service_overrides: [
          { service_id: '550e8400-e29b-41d4-a716-446655440000', rate: 30 },
        ],
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid service IDs');
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify({
            rate_type: 'percentage',
            rate: 25,
            include_addons: true,
          }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Staff Validation', () => {
    it('should return 404 for non-existent staff', async () => {
      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockStaffQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/nonexistent/commission',
        {
          method: 'PUT',
          body: JSON.stringify({
            rate_type: 'percentage',
            rate: 25,
            include_addons: true,
          }),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('Audit Logging', () => {
    it('should log commission settings update in audit trail', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 30,
        include_addons: true,
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'comm-1', groomer_id: 'staff-1', ...updateData },
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      expect(vi.mocked(logSettingsChange)).toHaveBeenCalledWith(
        mockSupabaseClient,
        'admin-1',
        'staff',
        'staff.staff-1.commission',
        null,
        expect.objectContaining(updateData)
      );
    });
  });

  describe('Database Errors', () => {
    it('should handle database upsert errors', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 25,
        include_addons: true,
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        })
        .mockReturnValueOnce(mockUpsertQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update commission settings');
    });

    it('should handle service validation errors', async () => {
      const updateData = {
        rate_type: 'percentage' as const,
        rate: 25,
        include_addons: true,
        service_overrides: [
          { service_id: '550e8400-e29b-41d4-a716-446655440000', rate: 30 },
        ],
      };

      const mockStaffQuery = {
        eq: vi.fn().mockResolvedValue({
          data: mockStaffUser,
          error: null,
        }),
      };

      const mockServicesQuery = {
        in: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockStaffQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockServicesQuery),
        });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to validate service IDs');
    });
  });

  describe('Malformed JSON', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/staff-1/commission',
        {
          method: 'PUT',
          body: 'not json',
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'staff-1' }),
      });

      expect(response.status).toBe(400);
    });
  });
});
