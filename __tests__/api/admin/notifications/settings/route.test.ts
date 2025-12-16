/**
 * Tests for Admin Notification Settings List API
 * GET /api/admin/notifications/settings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/notifications/settings/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

describe('GET /api/admin/notifications/settings', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    (requireAdmin as any).mockResolvedValue({
      user: { id: 'admin-user-id', role: 'admin' },
      role: 'admin',
    });
  });

  it('should return all notification settings ordered by notification_type', async () => {
    const mockSettings = [
      {
        notification_type: 'appointment_reminder',
        email_enabled: true,
        sms_enabled: true,
        schedule_enabled: true,
        schedule_cron: '0 9 * * *',
        max_retries: 3,
        retry_delays_seconds: [300, 900, 3600],
        last_sent_at: '2024-01-15T10:00:00Z',
        total_sent_count: 150,
        total_failed_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        notification_type: 'booking_confirmation',
        email_enabled: true,
        sms_enabled: false,
        schedule_enabled: false,
        schedule_cron: null,
        max_retries: 2,
        retry_delays_seconds: [300, 1800],
        last_sent_at: '2024-01-14T15:30:00Z',
        total_sent_count: 200,
        total_failed_count: 3,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-14T15:30:00Z',
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockSettings,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings).toEqual(mockSettings);
    expect(mockSupabase.from).toHaveBeenCalledWith('notification_settings');
    expect(mockSupabase.select).toHaveBeenCalledWith(
      'notification_type, email_enabled, sms_enabled, schedule_enabled, schedule_cron, max_retries, retry_delays_seconds, last_sent_at, total_sent_count, total_failed_count, created_at, updated_at'
    );
    expect(mockSupabase.order).toHaveBeenCalledWith('notification_type', { ascending: true });
  });

  it('should return empty array when no settings exist', async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings).toEqual([]);
  });

  it('should return empty array when data is null', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings).toEqual([]);
  });

  it('should return 401 if user is not authenticated', async () => {
    (requireAdmin as any).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 500 if database query fails', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: new Error('Database connection failed'),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database connection failed');
  });

  it('should handle database error gracefully', async () => {
    mockSupabase.order.mockRejectedValue(new Error('Unexpected database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Unexpected database error');
  });

  it('should call requireAdmin to verify authorization', async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    await GET();

    expect(requireAdmin).toHaveBeenCalledWith(mockSupabase);
  });
});
