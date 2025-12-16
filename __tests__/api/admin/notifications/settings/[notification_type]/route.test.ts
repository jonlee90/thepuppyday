/**
 * Tests for Admin Notification Settings Update API
 * PUT /api/admin/notifications/settings/[notification_type]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PUT } from '@/app/api/admin/notifications/settings/[notification_type]/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

describe('PUT /api/admin/notifications/settings/[notification_type]', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    (requireAdmin as any).mockResolvedValue({
      user: { id: 'admin-user-id', role: 'admin' },
      role: 'admin',
    });
  });

  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      nextUrl: { searchParams: new URLSearchParams() },
    } as NextRequest;
  };

  it('should update notification settings successfully', async () => {
    const requestBody = {
      email_enabled: true,
      sms_enabled: false,
      schedule_enabled: true,
      schedule_cron: '0 9 * * *',
      max_retries: 3,
      retry_delays_seconds: [300, 900, 3600],
    };

    const updatedSettings = {
      notification_type: 'appointment_reminder',
      email_enabled: true,
      sms_enabled: false,
      schedule_enabled: true,
      schedule_cron: '0 9 * * *',
      max_retries: 3,
      retry_delays_seconds: [300, 900, 3600],
      last_sent_at: null,
      total_sent_count: 0,
      total_failed_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    // Mock existence check
    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    // Mock update
    mockSupabase.single.mockResolvedValueOnce({
      data: updatedSettings,
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings).toEqual(updatedSettings);
  });

  it('should update only provided fields', async () => {
    const requestBody = {
      email_enabled: false,
    };

    const updatedSettings = {
      notification_type: 'booking_confirmation',
      email_enabled: false,
      sms_enabled: true,
      schedule_enabled: false,
      schedule_cron: null,
      max_retries: 2,
      retry_delays_seconds: [300, 1800],
      last_sent_at: null,
      total_sent_count: 0,
      total_failed_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'booking_confirmation' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: updatedSettings,
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'booking_confirmation' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings.email_enabled).toBe(false);
  });

  it('should return 404 if notification_type does not exist', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    });

    const request = createMockRequest({ email_enabled: true });
    const params = Promise.resolve({ notification_type: 'non_existent_type' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Notification type not found');
  });

  it('should return 400 for invalid notification_type', async () => {
    const request = createMockRequest({ email_enabled: true });
    const params = Promise.resolve({ notification_type: '' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid notification type');
  });

  it('should return 400 if email_enabled is not boolean', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ email_enabled: 'true' });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('email_enabled must be a boolean');
  });

  it('should return 400 if sms_enabled is not boolean', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ sms_enabled: 1 });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('sms_enabled must be a boolean');
  });

  it('should return 400 if schedule_enabled is not boolean', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ schedule_enabled: 'yes' });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('schedule_enabled must be a boolean');
  });

  it('should return 400 for invalid cron expression', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ schedule_cron: 'invalid cron' });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid cron expression format');
  });

  it('should accept valid cron expression', async () => {
    const requestBody = {
      schedule_cron: '0 9 * * *',
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder', schedule_cron: '0 9 * * *' },
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings.schedule_cron).toBe('0 9 * * *');
  });

  it('should accept null for schedule_cron', async () => {
    const requestBody = {
      schedule_cron: null,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder', schedule_cron: null },
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings.schedule_cron).toBe(null);
  });

  it('should return 400 if max_retries is not a positive integer', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ max_retries: -1 });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('max_retries must be a non-negative integer');
  });

  it('should return 400 if max_retries is a decimal', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ max_retries: 2.5 });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('max_retries must be a non-negative integer');
  });

  it('should accept zero for max_retries', async () => {
    const requestBody = {
      max_retries: 0,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder', max_retries: 0 },
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });

    expect(response.status).toBe(200);
  });

  it('should return 400 if retry_delays_seconds is not an array', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ retry_delays_seconds: 'not an array' });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('retry_delays_seconds must be an array of positive integers');
  });

  it('should return 400 if retry_delays_seconds contains non-integers', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ retry_delays_seconds: [300, 'invalid', 3600] });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('retry_delays_seconds must be an array of positive integers');
  });

  it('should return 400 if retry_delays_seconds contains negative values', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ retry_delays_seconds: [300, -100, 3600] });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('retry_delays_seconds must be an array of positive integers');
  });

  it('should return 400 if retry_delays_seconds contains decimals', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({ retry_delays_seconds: [300, 900.5, 3600] });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('retry_delays_seconds must be an array of positive integers');
  });

  it('should accept valid retry_delays_seconds array', async () => {
    const requestBody = {
      retry_delays_seconds: [300, 900, 3600],
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder', retry_delays_seconds: [300, 900, 3600] },
      error: null,
    });

    const request = createMockRequest(requestBody);
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.settings.retry_delays_seconds).toEqual([300, 900, 3600]);
  });

  it('should return 400 if no valid fields provided', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    const request = createMockRequest({});
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No valid fields provided for update');
  });

  it('should return 401 if user is not authenticated', async () => {
    (requireAdmin as any).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

    const request = createMockRequest({ email_enabled: true });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 500 if update fails', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error'),
    });

    const request = createMockRequest({ email_enabled: true });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update settings');
  });

  it('should call requireAdmin to verify authorization', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder' },
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { notification_type: 'appointment_reminder', email_enabled: true },
      error: null,
    });

    const request = createMockRequest({ email_enabled: true });
    const params = Promise.resolve({ notification_type: 'appointment_reminder' });

    await PUT(request, { params });

    expect(requireAdmin).toHaveBeenCalledWith(mockSupabase);
  });
});
