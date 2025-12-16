/**
 * API route tests for customer notification preferences
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/customer/preferences/notifications/route';
import { NextRequest } from 'next/server';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/preferences';

// Mock functions must be declared with vi.hoisted to avoid hoisting issues
const { mockCreateServerSupabaseClient, mockCreateServiceRoleClient, mockGetNotificationPreferences, mockUpdateNotificationPreferences } = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
  mockCreateServiceRoleClient: vi.fn(),
  mockGetNotificationPreferences: vi.fn(),
  mockUpdateNotificationPreferences: vi.fn(),
}));

// Mock the Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

// Mock the preference helpers
vi.mock('@/lib/notifications/preferences', () => ({
  getNotificationPreferences: mockGetNotificationPreferences,
  updateNotificationPreferences: mockUpdateNotificationPreferences,
}));

describe('GET /api/customer/preferences/notifications', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockServiceClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
    };

    mockServiceClient = {};

    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabaseClient);
    mockCreateServiceRoleClient.mockReturnValue(mockServiceClient);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns user preferences when authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockGetNotificationPreferences.mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.preferences).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(mockGetNotificationPreferences).toHaveBeenCalledWith(mockServiceClient, 'user-123');
  });

  it('returns 500 when fetching preferences fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockGetNotificationPreferences.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch preferences');
  });
});

describe('PUT /api/customer/preferences/notifications', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockServiceClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(),
      },
    };

    mockServiceClient = {};

    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabaseClient);
    mockCreateServiceRoleClient.mockReturnValue(mockServiceClient);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({ marketing_enabled: false }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('updates preferences successfully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

    const updatedPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      marketing_enabled: false,
    };
    mockGetNotificationPreferences.mockResolvedValue(updatedPrefs);

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({ marketing_enabled: false }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.preferences.marketing_enabled).toBe(false);
    expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(
      mockServiceClient,
      'user-123',
      { marketing_enabled: false }
    );
  });

  it('updates multiple preference fields', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockUpdateNotificationPreferences.mockResolvedValue({ success: true });

    const updatedPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      marketing_enabled: false,
      email_appointment_reminders: false,
      sms_retention_reminders: true,
    };
    mockGetNotificationPreferences.mockResolvedValue(updatedPrefs);

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        marketing_enabled: false,
        email_appointment_reminders: false,
        sms_retention_reminders: true,
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.preferences).toEqual(updatedPrefs);
  });

  it('returns 400 for invalid preference values', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        marketing_enabled: 'not-a-boolean', // Invalid type
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation error');
    expect(data.details).toBeDefined();
  });

  it('returns 400 for unknown preference fields', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({
        unknown_field: true, // Not in schema
      }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation error');
  });

  it('returns 500 when update fails', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    mockUpdateNotificationPreferences.mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: JSON.stringify({ marketing_enabled: false }),
    });
    const response = await PUT(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Database error');
  });

  it('returns 400 for malformed JSON', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/customer/preferences/notifications', {
      method: 'PUT',
      body: 'not-json',
    });

    // This will throw a JSON parse error
    const response = await PUT(request);
    expect(response.status).toBe(500);
  });
});
