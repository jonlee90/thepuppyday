/**
 * Tests for Admin Staff Management API Route
 * GET /api/admin/settings/staff - List all staff members
 * POST /api/admin/settings/staff - Create new staff member
 * Task 0203: Staff List & Create API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/settings/staff/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/admin/audit-log');

describe('Admin Staff Management API - GET /api/admin/settings/staff', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockStaffData = [
    {
      id: 'staff-1',
      email: 'groomer1@test.com',
      first_name: 'Alice',
      last_name: 'Smith',
      phone: '555-0001',
      role: 'groomer',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      appointment_count: 15,
      upcoming_appointments: 2,
      avg_rating: 4.8,
      commission_settings: null,
    },
    {
      id: 'staff-2',
      email: 'admin1@test.com',
      first_name: 'Bob',
      last_name: 'Johnson',
      phone: '555-0002',
      role: 'admin',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      appointment_count: 0,
      upcoming_appointments: 0,
      avg_rating: null,
      commission_settings: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return list of all staff with stats', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({ data: mockStaffData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].email).toBe('groomer1@test.com');
      expect(data.data[0].appointment_count).toBe(15);
    });

    it('should filter by groomer role', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: [mockStaffData[0]],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff?role=groomer'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe('groomer');
      expect(mockSelectQuery.in).toHaveBeenCalledWith('role', ['groomer']);
    });

    it('should filter by admin role', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: [mockStaffData[1]],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff?role=admin'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe('admin');
      expect(mockSelectQuery.in).toHaveBeenCalledWith('role', ['admin']);
    });

    it('should return all staff when role filter is "all"', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: mockStaffData,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff?role=all'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(mockSelectQuery.in).toHaveBeenCalledWith('role', ['admin', 'groomer']);
    });

    it('should sort by role and last name', async () => {
      const unsortedStaff = [
        { ...mockStaffData[0], role: 'groomer', last_name: 'Zulu' },
        { ...mockStaffData[1], role: 'admin', last_name: 'Alpha' },
        { ...mockStaffData[0], role: 'groomer', last_name: 'Beta', id: 'staff-3' },
      ];

      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: unsortedStaff,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Admin should come first
      expect(data.data[0].role).toBe('admin');
      // Then groomers sorted by last name
      expect(data.data[1].last_name).toBe('Beta');
      expect(data.data[2].last_name).toBe('Zulu');
    });

    it('should include commission settings in response', async () => {
      const staffWithCommission = [
        {
          ...mockStaffData[0],
          commission_settings: {
            id: 'comm-1',
            groomer_id: 'staff-1',
            rate_type: 'percentage' as const,
            rate: 25,
            include_addons: true,
            service_overrides: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      ];

      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: staffWithCommission,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].commission_settings).toBeTruthy();
      expect(data.data[0].commission_settings.rate_type).toBe('percentage');
      expect(data.data[0].commission_settings.rate).toBe(25);
    });

    it('should return null appointment count for empty results', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
    });
  });

  describe('Error Cases', () => {
    it('should return 401 for non-admin users', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch staff members');
    });

    it('should handle invalid role filter gracefully', async () => {
      const mockSelectQuery = {
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff?role=invalid'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should treat invalid role as 'all'
    });
  });
});

describe('Admin Staff Management API - POST /api/admin/settings/staff', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
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
    it('should create new staff member successfully', async () => {
      const newStaffData = {
        email: 'newgroomer@test.com',
        first_name: 'Charlie',
        last_name: 'Brown',
        phone: '555-0003',
        role: 'groomer' as const,
      };

      const createdStaff = {
        id: 'staff-new-1',
        ...newStaffData,
        avatar_url: null,
        preferences: {},
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdStaff,
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce(mockInsertQuery);

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toMatchObject({
        email: 'newgroomer@test.com',
        first_name: 'Charlie',
        last_name: 'Brown',
        role: 'groomer',
      });
      expect(vi.mocked(logSettingsChange)).toHaveBeenCalled();
    });

    it('should create admin user when role is admin', async () => {
      const newAdminData = {
        email: 'newadmin@test.com',
        first_name: 'Diana',
        last_name: 'Prince',
        role: 'admin' as const,
      };

      const createdAdmin = {
        id: 'staff-new-2',
        ...newAdminData,
        phone: null,
        avatar_url: null,
        preferences: {},
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdAdmin,
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce(mockInsertQuery);

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newAdminData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.role).toBe('admin');
    });

    it('should handle optional phone field', async () => {
      const newStaffData = {
        email: 'nophone@test.com',
        first_name: 'Eve',
        last_name: 'Davis',
        role: 'groomer' as const,
      };

      const createdStaff = {
        id: 'staff-new-3',
        ...newStaffData,
        phone: null,
        avatar_url: null,
        preferences: {},
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdStaff,
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce(mockInsertQuery);

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.phone).toBeNull();
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing email', async () => {
      const invalidData = {
        first_name: 'Frank',
        last_name: 'Green',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        first_name: 'George',
        last_name: 'Harris',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing first_name', async () => {
      const invalidData = {
        email: 'test@test.com',
        last_name: 'Jones',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing last_name', async () => {
      const invalidData = {
        email: 'test@test.com',
        first_name: 'Henry',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing role', async () => {
      const invalidData = {
        email: 'test@test.com',
        first_name: 'Iris',
        last_name: 'Kelly',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject invalid role', async () => {
      const invalidData = {
        email: 'test@test.com',
        first_name: 'Jack',
        last_name: 'Lee',
        role: 'customer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty first_name', async () => {
      const invalidData = {
        email: 'test@test.com',
        first_name: '',
        last_name: 'Martin',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty last_name', async () => {
      const invalidData = {
        email: 'test@test.com',
        first_name: 'Karen',
        last_name: '',
        role: 'groomer',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Duplicate Email Validation', () => {
    it('should reject duplicate email', async () => {
      const newStaffData = {
        email: 'existing@test.com',
        first_name: 'Leo',
        last_name: 'Nelson',
        role: 'groomer' as const,
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({
          data: { id: 'existing-staff-1', email: 'existing@test.com' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue(mockSelectQuery),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'groomer',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Database Errors', () => {
    it('should handle database insert errors', async () => {
      const newStaffData = {
        email: 'test@test.com',
        first_name: 'Mike',
        last_name: 'Oscar',
        role: 'groomer' as const,
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce(mockInsertQuery);

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create staff member');
    });
  });

  describe('Audit Logging', () => {
    it('should log staff creation in audit trail', async () => {
      const newStaffData = {
        email: 'newstaff@test.com',
        first_name: 'Nancy',
        last_name: 'Powell',
        phone: '555-0004',
        role: 'groomer' as const,
      };

      const createdStaff = {
        id: 'staff-new-4',
        ...newStaffData,
        avatar_url: null,
        preferences: {},
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSelectQuery = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdStaff,
              error: null,
            }),
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(mockSelectQuery) })
        .mockReturnValueOnce(mockInsertQuery);

      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: JSON.stringify(newStaffData),
      });

      await POST(request);

      expect(vi.mocked(logSettingsChange)).toHaveBeenCalledWith(
        mockSupabaseClient,
        'admin-1',
        'staff',
        `staff.${createdStaff.id}`,
        null,
        expect.objectContaining({
          email: 'newstaff@test.com',
          first_name: 'Nancy',
          last_name: 'Powell',
        })
      );
    });
  });

  describe('Malformed JSON', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/settings/staff', {
        method: 'POST',
        body: 'not json',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
