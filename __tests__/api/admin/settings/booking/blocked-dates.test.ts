/**
 * Tests for Blocked Dates API Routes
 * Task 0185: Blocked dates API routes
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/admin/settings/booking/blocked-dates/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { BookingSettings } from '@/types/settings';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/admin/audit-log', () => ({
  logSettingsChange: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

// Setup mocks
beforeEach(async () => {
  vi.clearAllMocks();

  // Mock Supabase client
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

  // Import mocked modules
  const { requireAdmin } = await import('@/lib/admin/auth');
  const { logSettingsChange } = await import('@/lib/admin/audit-log');

  // Mock requireAdmin
  vi.mocked(requireAdmin).mockResolvedValue({
    user: { id: 'admin-1', email: 'admin@test.com' } as any,
    role: 'admin',
  });

  // Mock logSettingsChange
  vi.mocked(logSettingsChange).mockResolvedValue(undefined);
});

describe('GET /api/admin/settings/booking/blocked-dates', () => {
  it('should return empty array when no settings exist', async () => {
    // Mock no settings found
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'No rows found' },
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      blocked_dates: [],
    });
  });

  it('should return blocked dates from settings', async () => {
    const blockedDates = [
      { date: '2024-12-25', end_date: null, reason: 'Christmas' },
      { date: '2024-12-30', end_date: '2025-01-02', reason: "New Year's" },
    ];

    // Mock settings with blocked dates
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: blockedDates,
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      blocked_dates: blockedDates,
    });
  });

  it('should require admin authentication', async () => {
    const { requireAdmin } = await import('@/lib/admin/auth');
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should handle database errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection error'),
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch blocked dates');
  });
});

describe('POST /api/admin/settings/booking/blocked-dates', () => {
  it('should add a single blocked date', async () => {
    const newBlockedDate = {
      date: '2024-12-25',
      reason: 'Christmas',
    };

    // Mock no existing appointments
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      // For settings table
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                value: {
                  blocked_dates: [],
                  min_advance_hours: 2,
                  max_advance_days: 90,
                  cancellation_cutoff_hours: 24,
                  buffer_minutes: 15,
                  recurring_blocked_days: [0],
                } as BookingSettings,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };
    });

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(newBlockedDate),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.blocked_dates).toHaveLength(1);
    expect(data.blocked_dates[0].date).toBe('2024-12-25');
    expect(data.blocked_dates[0].reason).toBe('Christmas');
    expect(data.message).toBe('Blocked date added successfully');
  });

  it('should add a date range', async () => {
    const dateRange = {
      date: '2024-12-30',
      end_date: '2025-01-02',
      reason: "New Year's Holiday",
    };

    // Mock no existing appointments
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                value: {
                  blocked_dates: [],
                  min_advance_hours: 2,
                  max_advance_days: 90,
                  cancellation_cutoff_hours: 24,
                  buffer_minutes: 15,
                  recurring_blocked_days: [0],
                } as BookingSettings,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };
    });

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(dateRange),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.blocked_dates).toHaveLength(1);
    expect(data.blocked_dates[0].end_date).toBe('2025-01-02');
  });

  it('should return 409 when appointments exist in date range', async () => {
    const newBlockedDate = {
      date: '2024-12-25',
      reason: 'Christmas',
    };

    // Mock existing appointments
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { scheduled_at: '2024-12-25T10:00:00Z', status: 'confirmed' },
                    { scheduled_at: '2024-12-25T14:00:00Z', status: 'confirmed' },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      };
    });

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(newBlockedDate),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Cannot block dates with existing appointments');
    expect(data.affected_appointments).toBe(2);
    expect(data.conflicts).toHaveLength(1);
    expect(data.conflicts[0].date).toBe('2024-12-25');
    expect(data.conflicts[0].count).toBe(2);
  });

  it('should validate date format', async () => {
    const invalidDate = {
      date: '12/25/2024', // Invalid format
      reason: 'Christmas',
    };

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(invalidDate),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should validate end_date is after start date', async () => {
    const invalidRange = {
      date: '2025-01-02',
      end_date: '2024-12-30', // Before start date
      reason: 'Invalid range',
    };

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(invalidRange),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should validate reason length', async () => {
    const longReason = {
      date: '2024-12-25',
      reason: 'A'.repeat(201), // Exceeds 200 characters
    };

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(longReason),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should log settings change in audit log', async () => {
    const { logSettingsChange } = await import('@/lib/admin/audit-log');

    const newBlockedDate = {
      date: '2024-12-25',
      reason: 'Christmas',
    };

    // Mock no existing appointments
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                value: {
                  blocked_dates: [],
                  min_advance_hours: 2,
                  max_advance_days: 90,
                  cancellation_cutoff_hours: 24,
                  buffer_minutes: 15,
                  recurring_blocked_days: [0],
                } as BookingSettings,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };
    });

    const request = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify(newBlockedDate),
    });

    await POST(request);

    expect(logSettingsChange).toHaveBeenCalledWith(
      mockSupabase,
      'admin-1',
      'booking',
      'blocked_dates',
      [],
      expect.arrayContaining([
        expect.objectContaining({
          date: '2024-12-25',
          reason: 'Christmas',
        }),
      ])
    );
  });
});

describe('DELETE /api/admin/settings/booking/blocked-dates', () => {
  it('should remove a single blocked date', async () => {
    const existingBlockedDates = [
      { date: '2024-12-25', end_date: null, reason: 'Christmas' },
      { date: '2024-12-31', end_date: null, reason: "New Year's Eve" },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: existingBlockedDates,
                min_advance_hours: 2,
                max_advance_days: 90,
                cancellation_cutoff_hours: 24,
                buffer_minutes: 15,
                recurring_blocked_days: [0],
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({ date: '2024-12-25' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.blocked_dates).toHaveLength(1);
    expect(data.blocked_dates[0].date).toBe('2024-12-31');
    expect(data.message).toContain('Successfully removed 1 blocked date(s)');
  });

  it('should remove multiple blocked dates', async () => {
    const existingBlockedDates = [
      { date: '2024-12-25', end_date: null, reason: 'Christmas' },
      { date: '2024-12-31', end_date: null, reason: "New Year's Eve" },
      { date: '2025-01-01', end_date: null, reason: "New Year's Day" },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: existingBlockedDates,
                min_advance_hours: 2,
                max_advance_days: 90,
                cancellation_cutoff_hours: 24,
                buffer_minutes: 15,
                recurring_blocked_days: [0],
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({ dates: ['2024-12-25', '2025-01-01'] }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.blocked_dates).toHaveLength(1);
    expect(data.blocked_dates[0].date).toBe('2024-12-31');
    expect(data.message).toContain('Successfully removed 2 blocked date(s)');
  });

  it('should return 404 when no matching dates found', async () => {
    const existingBlockedDates = [
      { date: '2024-12-25', end_date: null, reason: 'Christmas' },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: existingBlockedDates,
                min_advance_hours: 2,
                max_advance_days: 90,
                cancellation_cutoff_hours: 24,
                buffer_minutes: 15,
                recurring_blocked_days: [0],
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({ date: '2024-12-31' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No matching blocked dates found to remove');
  });

  it('should return 404 when no blocked dates exist', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: [],
                min_advance_hours: 2,
                max_advance_days: 90,
                cancellation_cutoff_hours: 24,
                buffer_minutes: 15,
                recurring_blocked_days: [0],
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({ date: '2024-12-25' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
  });

  it('should validate request body', async () => {
    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({}), // Missing date or dates
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should log settings change in audit log', async () => {
    const { logSettingsChange } = await import('@/lib/admin/audit-log');

    const existingBlockedDates = [
      { date: '2024-12-25', end_date: null, reason: 'Christmas' },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              value: {
                blocked_dates: existingBlockedDates,
                min_advance_hours: 2,
                max_advance_days: 90,
                cancellation_cutoff_hours: 24,
                buffer_minutes: 15,
                recurring_blocked_days: [0],
              } as BookingSettings,
            },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new Request('http://localhost/api', {
      method: 'DELETE',
      body: JSON.stringify({ date: '2024-12-25' }),
    });

    await DELETE(request);

    expect(logSettingsChange).toHaveBeenCalledWith(
      mockSupabase,
      'admin-1',
      'booking',
      'blocked_dates',
      existingBlockedDates,
      []
    );
  });
});
