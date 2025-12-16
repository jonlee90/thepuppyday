/**
 * Integration tests for unsubscribe API endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/unsubscribe/route';
import { NextRequest } from 'next/server';
import { generateUnsubscribeToken } from '@/lib/notifications/unsubscribe';

// Mock functions must be declared with vi.hoisted to avoid hoisting issues
const { mockCreateServiceRoleClient, mockDisableMarketing, mockDisableNotificationChannel } = vi.hoisted(() => ({
  mockCreateServiceRoleClient: vi.fn(),
  mockDisableMarketing: vi.fn(),
  mockDisableNotificationChannel: vi.fn(),
}));

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

// Mock the preference helpers
vi.mock('@/lib/notifications/preferences', () => ({
  disableMarketing: mockDisableMarketing,
  disableNotificationChannel: mockDisableNotificationChannel,
}));

describe('GET /api/unsubscribe', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockServiceClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceClient = {
      from: vi.fn(() => mockServiceClient),
      insert: vi.fn(() => mockServiceClient),
    };

    mockCreateServiceRoleClient.mockReturnValue(mockServiceClient);
  });

  it('redirects to error page when token is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/unsubscribe');
    const response = await GET(request);

    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get('location')).toContain('/unsubscribe/error?reason=missing_token');
  });

  it('redirects to error page when token is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/unsubscribe?token=invalid-token');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/error?reason=invalid_token');
  });

  it('disables marketing for marketing notification type', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'marketing',
      channel: 'email',
    });

    mockDisableMarketing.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/success');
    expect(mockDisableMarketing).toHaveBeenCalledWith(mockServiceClient, 'user-123');
  });

  it('disables specific notification channel for appointment reminder', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    mockDisableNotificationChannel.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/success');
    expect(mockDisableNotificationChannel).toHaveBeenCalledWith(
      mockServiceClient,
      'user-123',
      'appointment_reminder',
      'email'
    );
  });

  it('disables SMS retention reminders', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-456',
      notificationType: 'retention_reminder',
      channel: 'sms',
    });

    mockDisableNotificationChannel.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/success');
    expect(mockDisableNotificationChannel).toHaveBeenCalledWith(
      mockServiceClient,
      'user-456',
      'retention_reminder',
      'sms'
    );
  });

  it('redirects to success page with notification details', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    mockDisableNotificationChannel.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    const location = response.headers.get('location');
    expect(location).toContain('/unsubscribe/success');
    expect(location).toContain('type=appointment_reminder');
    expect(location).toContain('channel=email');
  });

  it('redirects to error page when preference update fails', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'marketing',
      channel: 'email',
    });

    mockDisableMarketing.mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/error?reason=update_failed');
  });

  it('logs the unsubscribe action', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'appointment_reminder',
      channel: 'email',
    });

    mockDisableNotificationChannel.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    await GET(request);

    expect(mockServiceClient.from).toHaveBeenCalledWith('notifications_log');
    expect(mockServiceClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 'user-123',
        type: 'appointment_reminder',
        channel: 'email',
        recipient: 'unsubscribe',
        status: 'sent',
      })
    );
  });

  it('continues even if logging fails', async () => {
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'marketing',
      channel: 'email',
    });

    // Mock logging to fail
    mockServiceClient.insert.mockRejectedValue(new Error('Logging failed'));

    mockDisableMarketing.mockResolvedValue({ success: true });

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    // Should still succeed despite logging failure
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/success');
  });

  it('handles expired tokens', async () => {
    // Create a token and mock time to make it expired
    const token = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'marketing',
      channel: 'email',
    });

    // Advance time by 31 days
    const originalDateNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 24 * 60 * 60 * 1000);

    const request = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unsubscribe/error?reason=invalid_token');

    // Restore Date.now
    Date.now = originalDateNow;
  });

  it('handles different users correctly', async () => {
    const token1 = generateUnsubscribeToken({
      userId: 'user-123',
      notificationType: 'marketing',
      channel: 'email',
    });

    const token2 = generateUnsubscribeToken({
      userId: 'user-456',
      notificationType: 'marketing',
      channel: 'email',
    });

    mockDisableMarketing.mockResolvedValue({ success: true });

    // First request
    const request1 = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token1)}`
    );
    await GET(request1);
    expect(mockDisableMarketing).toHaveBeenCalledWith(mockServiceClient, 'user-123');

    // Second request
    const request2 = new NextRequest(
      `http://localhost:3000/api/unsubscribe?token=${encodeURIComponent(token2)}`
    );
    await GET(request2);
    expect(mockDisableMarketing).toHaveBeenCalledWith(mockServiceClient, 'user-456');
  });
});
