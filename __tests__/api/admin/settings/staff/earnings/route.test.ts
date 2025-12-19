/**
 * Tests for Admin Staff Earnings Report API Route
 * GET /api/admin/settings/staff/earnings - Generate earnings report
 * Task 0209: Earnings Report API
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/admin/settings/staff/earnings/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');

describe('Admin Staff Earnings Report API - GET /api/admin/settings/staff/earnings', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  const mockAppointments = [
    {
      id: 'apt-1',
      groomer_id: 'staff-1',
      service_id: 'svc-1',
      scheduled_at: '2024-01-15T10:00:00Z',
      status: 'completed',
      total_price: 75.0,
      groomer: {
        id: 'staff-1',
        first_name: 'Alice',
        last_name: 'Smith',
      },
    },
    {
      id: 'apt-2',
      groomer_id: 'staff-1',
      service_id: 'svc-1',
      scheduled_at: '2024-01-15T14:00:00Z',
      status: 'completed',
      total_price: 85.0,
      groomer: {
        id: 'staff-1',
        first_name: 'Alice',
        last_name: 'Smith',
      },
    },
    {
      id: 'apt-3',
      groomer_id: 'staff-2',
      service_id: 'svc-1',
      scheduled_at: '2024-01-16T10:00:00Z',
      status: 'completed',
      total_price: 65.0,
      groomer: {
        id: 'staff-2',
        first_name: 'Bob',
        last_name: 'Johnson',
      },
    },
  ];

  const mockCommissions = [
    {
      id: 'comm-1',
      groomer_id: 'staff-1',
      rate_type: 'percentage' as const,
      rate: 25,
      include_addons: true,
      service_overrides: null,
    },
    {
      id: 'comm-2',
      groomer_id: 'staff-2',
      rate_type: 'flat_rate' as const,
      rate: 15,
      include_addons: false,
      service_overrides: null,
    },
  ];

  const mockPayments = [
    {
      appointment_id: 'apt-1',
      tip_amount: 10.0,
    },
    {
      appointment_id: 'apt-2',
      tip_amount: 5.0,
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
    it('should return earnings report with summary and timeline', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const startDate = '2024-01-15';
      const endDate = '2024-01-16';

      const request = new NextRequest(
        `http://localhost:3000/api/admin/settings/staff/earnings?start_date=${startDate}&end_date=${endDate}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary).toBeDefined();
      expect(data.data.by_groomer).toBeDefined();
      expect(data.data.timeline).toBeDefined();
      expect(data.data.summary.total_services).toBeGreaterThan(0);
    });

    it('should calculate total revenue correctly', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Total revenue: 75 + 85 + 65 = 225
      expect(data.data.summary.total_revenue).toBe(225);
    });

    it('should calculate percentage commission correctly', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Alice: 25% of (75 + 85) = 25% of 160 = 40
      // Bob: flat 15
      // Total: 40 + 15 = 55
      expect(data.data.summary.total_commission).toBe(55);
    });

    it('should include tips in summary', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Total tips: 10 + 5 = 15
      expect(data.data.summary.total_tips).toBe(15);
    });

    it('should group earnings by groomer', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.by_groomer).toHaveLength(2);
      expect(data.data.by_groomer[0].groomer_name).toBe('Alice Smith');
      expect(data.data.by_groomer[1].groomer_name).toBe('Bob Johnson');
    });

    it('should filter by groomer_id', async () => {
      const filteredAppointments = mockAppointments.filter(
        (apt) => apt.groomer_id === 'staff-1'
      );

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: filteredAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16&groomer_id=staff-1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.by_groomer).toHaveLength(1);
      expect(data.data.by_groomer[0].groomer_id).toBe('staff-1');
    });

    it('should group by day when group_by=day', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16&group_by=day'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.timeline).toBeDefined();
      expect(data.data.timeline.length).toBeGreaterThan(0);
      // Should have separate entries for different days
      expect(data.data.timeline.some((t) => t.period === '2024-01-15')).toBe(true);
    });

    it('should group by month when group_by=month', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16&group_by=month'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.timeline).toBeDefined();
      // Month grouping should have period in format YYYY-MM
      expect(data.data.timeline[0].period).toMatch(/2024-01/);
    });

    it('should handle zero earnings', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.summary.total_services).toBe(0);
      expect(data.data.summary.total_revenue).toBe(0);
      expect(data.data.summary.total_commission).toBe(0);
    });

    it('should handle missing commission settings (default to 0%)', async () => {
      const appointmentsNoCommission = mockAppointments.slice(0, 1); // Only first appointment
      const noCommissions = []; // No commission settings

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: appointmentsNoCommission,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: noCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Without commission settings, commission should be 0
      expect(data.data.summary.total_commission).toBe(0);
    });

    it('should handle service overrides in commission calculation', async () => {
      const commissionsWithOverrides = [
        {
          id: 'comm-1',
          groomer_id: 'staff-1',
          rate_type: 'percentage' as const,
          rate: 25,
          include_addons: true,
          service_overrides: [
            { service_id: 'svc-1', rate: 30 }, // Override for svc-1
          ],
        },
      ];

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments.slice(0, 1), // Only first appointment
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: commissionsWithOverrides,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should use override rate of 30% instead of default 25%
      // 30% of 75 = 22.5
      expect(data.data.summary.total_commission).toBe(22.5);
    });
  });

  describe('Error Cases - Validation', () => {
    it('should require start_date parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('start_date');
    });

    it('should require end_date parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('end_date');
    });

    it('should use "day" as default group_by', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Authorization', () => {
    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized: Admin or staff access required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Database Errors', () => {
    it('should handle appointment fetch errors', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockAppointmentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('should handle commission fetch errors', async () => {
      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle appointments without groomer data', async () => {
      const appointmentsNoGroomer = [
        {
          ...mockAppointments[0],
          groomer: null,
        },
      ];

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: appointmentsNoGroomer,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle payments without appointments', async () => {
      const orphanedPayments = [
        {
          appointment_id: 'apt-999',
          tip_amount: 100.0,
        },
      ];

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: mockAppointments,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions,
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: orphanedPayments,
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Orphaned tip shouldn't be included in total
      expect(data.data.summary.total_tips).toBe(0);
    });

    it('should round currency values correctly', async () => {
      const appointmentsWithDecimal = [
        {
          ...mockAppointments[0],
          total_price: 75.33,
        },
      ];

      const mockAppointmentsQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({
            data: appointmentsWithDecimal,
            error: null,
          }),
        }),
      };

      const mockCommissionsQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCommissions.slice(0, 1),
          error: null,
        }),
      };

      const mockPaymentsQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockAppointmentsQuery)
        .mockReturnValueOnce(mockCommissionsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/staff/earnings?start_date=2024-01-15&end_date=2024-01-16'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Values should be properly rounded to 2 decimal places
      expect(data.data.summary.total_revenue).toBe(75.33);
      expect(typeof data.data.summary.total_revenue).toBe('number');
    });
  });
});
