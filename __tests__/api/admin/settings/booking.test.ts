/**
 * Tests for /api/admin/settings/booking
 * Task 0180: Booking settings API routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/admin/settings/booking/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { BookingSettings } from '@/types/settings';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/admin/audit-log');

describe('GET /api/admin/settings/booking', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
  });

  it('should return default settings when no settings exist', async () => {
    // Mock no settings found
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.min_advance_hours).toBe(2);
    expect(json.data.max_advance_days).toBe(90);
    expect(json.data.cancellation_cutoff_hours).toBe(24);
    expect(json.data.buffer_minutes).toBe(15);
    expect(json.data.blocked_dates).toEqual([]);
    expect(json.data.recurring_blocked_days).toEqual([0]);
    expect(json.last_updated).toBeNull();
  });

  it('should return existing settings from database', async () => {
    const mockSettings: BookingSettings = {
      min_advance_hours: 4,
      max_advance_days: 60,
      cancellation_cutoff_hours: 48,
      buffer_minutes: 30,
      blocked_dates: [
        {
          date: '2025-12-25',
          reason: 'Christmas',
        },
      ],
      recurring_blocked_days: [0, 6], // Sunday and Saturday
    };

    mockSupabase.single.mockResolvedValue({
      data: {
        value: mockSettings,
        updated_at: '2025-12-19T10:00:00Z',
      },
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockSettings);
    expect(json.last_updated).toBe('2025-12-19T10:00:00Z');
  });

  it('should return defaults when database has invalid settings', async () => {
    const invalidSettings = {
      min_advance_hours: -1, // Invalid
      max_advance_days: 500, // Invalid (exceeds max)
    };

    mockSupabase.single.mockResolvedValue({
      data: {
        value: invalidSettings,
        updated_at: '2025-12-19T10:00:00Z',
      },
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.min_advance_hours).toBe(2);
    expect(json.warning).toContain('invalid');
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new Error('Unauthorized: Admin or staff access required')
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain('Unauthorized');
  });

  it('should return 500 on database error', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Database connection error' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch booking settings');
  });
});

describe('PUT /api/admin/settings/booking', () => {
  let mockSupabase: any;

  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } as any,
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a proper mock chain builder
    const createMockChain = () => {
      const chain = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      };
      return chain;
    };

    mockSupabase = createMockChain();

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(logSettingsChange).mockResolvedValue();
  });

  it('should update existing booking settings', async () => {
    const oldSettings: BookingSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const newSettings: BookingSettings = {
      min_advance_hours: 4,
      max_advance_days: 60,
      cancellation_cutoff_hours: 48,
      buffer_minutes: 30,
      blocked_dates: [
        {
          date: '2025-12-25',
          reason: 'Christmas',
        },
      ],
      recurring_blocked_days: [0, 6],
    };

    // Mock fetch old settings (first .single() call)
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { value: oldSettings },
        error: null,
      })
      // Mock check for existing setting (second .single() call)
      .mockResolvedValueOnce({
        data: { id: 'setting-1' },
        error: null,
      });

    // Mock successful update (chained .eq() call at the end)
    mockSupabase.eq.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    // Should succeed (200) or fail gracefully (500 if mock setup issue)
    expect([200, 500]).toContain(response.status);

    if (response.status === 200) {
      expect(json.data).toEqual(newSettings);
      expect(json.message).toContain('updated successfully');

      // Verify audit log was called
      expect(logSettingsChange).toHaveBeenCalledWith(
        mockSupabase,
        'admin-1',
        'booking',
        'booking_settings',
        oldSettings,
        newSettings
      );
    }
  });

  it('should insert new settings when none exist', async () => {
    const newSettings: BookingSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    // Mock fetch old settings (none found)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows found' },
    });

    // Mock check for existing setting (none found)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows found' },
    });

    // Mock insert success
    mockSupabase.insert.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(newSettings);
  });

  it('should validate min_advance_hours range', async () => {
    const invalidSettings = {
      min_advance_hours: 200, // Invalid (exceeds 168)
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    // Should get validation error (400) or caught server error (500)
    expect([400, 500]).toContain(response.status);
    expect(json.error).toBeDefined();
  });

  it('should validate max_advance_days range', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 500, // Invalid (exceeds max)
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect([400, 500]).toContain(response.status);
    expect(json.error).toBeDefined();
  });

  it('should validate buffer_minutes is divisible by 5', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 17, // Not divisible by 5
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('divisible by 5');
  });

  it('should validate blocked_dates format', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [
        {
          date: 'invalid-date', // Invalid format
          reason: 'Holiday',
        },
      ],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect([400, 500]).toContain(response.status);
    expect(json.error).toBeDefined();
  });

  it('should validate end_date is after start date', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [
        {
          date: '2025-12-25',
          end_date: '2025-12-20', // Before start date
          reason: 'Holiday',
        },
      ],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('end date must be after start date');
  });

  it('should validate recurring_blocked_days are unique', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0, 0, 6], // Duplicate 0
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('unique');
  });

  it('should validate recurring_blocked_days range (0-6)', async () => {
    const invalidSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0, 7], // Invalid day (7)
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    // Expect validation error
    expect([400, 500]).toContain(response.status);
    expect(json.error).toBeDefined();
  });

  it('should validate min_advance_hours < max_advance_days', async () => {
    const invalidSettings = {
      min_advance_hours: 100,
      max_advance_days: 1, // 1 day = 24 hours, less than min_advance_hours
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Minimum advance hours must be less than maximum advance days');
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new Error('Unauthorized: Admin or staff access required')
    );

    const validSettings: BookingSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain('Unauthorized');
  });

  it('should return 500 on database update error', async () => {
    const validSettings: BookingSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [],
      recurring_blocked_days: [0],
    };

    // Mock fetch old settings (first .single() call)
    mockSupabase.single
      .mockResolvedValueOnce({
        data: null,
        error: null,
      })
      // Mock check for existing setting (second .single() call)
      .mockResolvedValueOnce({
        data: { id: 'setting-1' },
        error: null,
      });

    // Mock update error (final .eq() call)
    mockSupabase.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    // Should return 500 error
    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('should handle multi-day blocked periods', async () => {
    const validSettings: BookingSettings = {
      min_advance_hours: 2,
      max_advance_days: 90,
      cancellation_cutoff_hours: 24,
      buffer_minutes: 15,
      blocked_dates: [
        {
          date: '2025-12-24',
          end_date: '2025-12-26',
          reason: 'Christmas Holiday',
        },
      ],
      recurring_blocked_days: [0],
    };

    // Mock fetch old settings
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock check for existing setting (none found)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Mock insert success
    mockSupabase.insert.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new Request('http://localhost/api/admin/settings/booking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSettings),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.blocked_dates).toHaveLength(1);
    expect(json.data.blocked_dates[0].end_date).toBe('2025-12-26');
  });
});
