/**
 * Tests for Admin Notifications Dashboard API
 * GET /api/admin/notifications/dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/admin/notifications/dashboard/route';
import { NextRequest } from 'next/server';
import type { NotificationLogRow } from '@/lib/notifications/database-types';

// Mock functions must be declared with vi.hoisted to avoid hoisting issues
const { mockCreateServerSupabaseClient, mockRequireAdmin, mockGetMockStore } = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockGetMockStore: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/mocks/supabase/store', () => ({
  getMockStore: mockGetMockStore,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const now = new Date('2025-01-15T12:00:00Z');

/**
 * Generate sample notifications for testing
 */
function generateSampleNotifications(): NotificationLogRow[] {
  const notifications: NotificationLogRow[] = [];

  // Current period (last 30 days): Jan 1-15, 2025
  // Previous period: Dec 2-31, 2024

  // Successful email notifications (current period)
  for (let i = 0; i < 50; i++) {
    notifications.push({
      id: `email-success-${i}`,
      customer_id: `customer-${i}`,
      type: 'appointment_reminder',
      channel: 'email',
      recipient: `customer${i}@example.com`,
      subject: 'Appointment Reminder',
      content: 'Your appointment is coming up',
      status: 'sent',
      error_message: null,
      sent_at: new Date('2025-01-10T10:00:00Z').toISOString(),
      delivered_at: new Date('2025-01-10T10:01:00Z').toISOString(),
      clicked_at: i < 10 ? new Date('2025-01-10T10:05:00Z').toISOString() : null, // 10 clicked (20% click rate)
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: `track-${i}`,
      cost_cents: null,
      template_id: 'template-1',
      template_data: null,
      retry_count: 0,
      retry_after: null,
      is_test: false,
      message_id: `msg-email-${i}`,
      created_at: new Date('2025-01-10T10:00:00Z').toISOString(),
    });
  }

  // Successful SMS notifications (current period)
  for (let i = 0; i < 30; i++) {
    notifications.push({
      id: `sms-success-${i}`,
      customer_id: `customer-${i}`,
      type: 'appointment_reminder',
      channel: 'sms',
      recipient: `+1555000${i.toString().padStart(4, '0')}`,
      subject: null,
      content: 'Your appointment is coming up',
      status: 'sent',
      error_message: null,
      sent_at: new Date('2025-01-12T14:00:00Z').toISOString(),
      delivered_at: new Date('2025-01-12T14:01:00Z').toISOString(),
      clicked_at: null,
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: `track-sms-${i}`,
      cost_cents: 75, // $0.0075 per SMS
      template_id: 'template-2',
      template_data: null,
      retry_count: 0,
      retry_after: null,
      is_test: false,
      message_id: `msg-sms-${i}`,
      created_at: new Date('2025-01-12T14:00:00Z').toISOString(),
    });
  }

  // Failed email notifications (current period)
  for (let i = 0; i < 10; i++) {
    notifications.push({
      id: `email-failed-${i}`,
      customer_id: `customer-${i}`,
      type: 'booking_confirmation',
      channel: 'email',
      recipient: `invalid${i}@example.com`,
      subject: 'Booking Confirmation',
      content: 'Your booking is confirmed',
      status: 'failed',
      error_message: i < 5 ? 'Invalid email address' : 'Mailbox full',
      sent_at: null,
      delivered_at: null,
      clicked_at: null,
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: `track-failed-${i}`,
      cost_cents: null,
      template_id: 'template-3',
      template_data: null,
      retry_count: 3,
      retry_after: null,
      is_test: false,
      message_id: null,
      created_at: new Date('2025-01-14T16:00:00Z').toISOString(),
    });
  }

  // Failed SMS notifications (current period)
  for (let i = 0; i < 5; i++) {
    notifications.push({
      id: `sms-failed-${i}`,
      customer_id: `customer-${i}`,
      type: 'report_card_completion',
      channel: 'sms',
      recipient: `+1555999${i.toString().padStart(4, '0')}`,
      subject: null,
      content: 'Your report card is ready',
      status: 'failed',
      error_message: 'Invalid phone number',
      sent_at: null,
      delivered_at: null,
      clicked_at: null,
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: `track-sms-failed-${i}`,
      cost_cents: null,
      template_id: 'template-4',
      template_data: null,
      retry_count: 3,
      retry_after: null,
      is_test: false,
      message_id: null,
      created_at: new Date('2025-01-13T11:00:00Z').toISOString(),
    });
  }

  // Test notifications (should be excluded)
  for (let i = 0; i < 5; i++) {
    notifications.push({
      id: `test-${i}`,
      customer_id: null,
      type: 'test',
      channel: 'email',
      recipient: 'test@example.com',
      subject: 'Test',
      content: 'Test notification',
      status: 'sent',
      error_message: null,
      sent_at: new Date('2025-01-15T12:00:00Z').toISOString(),
      delivered_at: new Date('2025-01-15T12:01:00Z').toISOString(),
      clicked_at: null,
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: null,
      cost_cents: null,
      template_id: null,
      template_data: null,
      retry_count: 0,
      retry_after: null,
      is_test: true,
      message_id: `test-${i}`,
      created_at: new Date('2025-01-15T12:00:00Z').toISOString(),
    });
  }

  // Previous period notifications (for trend comparison)
  // Jan 1-15 is 15 days, so previous period is Dec 17-31 (15 days)
  for (let i = 0; i < 40; i++) {
    notifications.push({
      id: `prev-email-${i}`,
      customer_id: `customer-${i}`,
      type: 'appointment_reminder',
      channel: 'email',
      recipient: `customer${i}@example.com`,
      subject: 'Appointment Reminder',
      content: 'Your appointment is coming up',
      status: 'sent',
      error_message: null,
      sent_at: new Date('2024-12-25T10:00:00Z').toISOString(),
      delivered_at: new Date('2024-12-25T10:01:00Z').toISOString(),
      clicked_at: null,
      campaign_id: null,
      campaign_send_id: null,
      tracking_id: `track-prev-${i}`,
      cost_cents: null,
      template_id: 'template-1',
      template_data: null,
      retry_count: 0,
      retry_after: null,
      is_test: false,
      message_id: `msg-prev-${i}`,
      created_at: new Date('2024-12-25T10:00:00Z').toISOString(),
    });
  }

  return notifications;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Admin Notifications Dashboard API', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  let sampleNotifications: NotificationLogRow[];

  beforeEach(() => {
    vi.clearAllMocks();
    sampleNotifications = generateSampleNotifications();

    // Set environment to use mocks
    process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

    // Mock admin auth
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
      role: 'admin',
    });

    // Mock store
    mockGetMockStore.mockReturnValue({
      select: vi.fn().mockReturnValue(sampleNotifications),
    });

    // Mock Supabase client
    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication', () => {
    it('should require admin authentication', async () => {
      mockRequireAdmin.mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow authenticated admin', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Period Parameter Handling', () => {
    it('should default to 30 days when no period specified', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.period.label).toBe('30 days');
    });

    it('should handle 7d period parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?period=7d'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.period.label).toBe('7 days');
    });

    it('should handle 90d period parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?period=90d'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.period.label).toBe('90 days');
    });

    it('should handle custom date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.period.label).toBe('custom range');
      expect(data.period.start).toContain('2025-01-01');
      expect(data.period.end).toContain('2025-01-15');
    });
  });

  describe('Summary Metrics Calculation', () => {
    it('should calculate total sent correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // 50 email sent + 30 SMS sent = 80 total sent
      expect(data.summary.total_sent).toBe(80);
    });

    it('should calculate total delivered correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // 50 email delivered + 30 SMS delivered = 80 total delivered
      expect(data.summary.total_delivered).toBe(80);
    });

    it('should calculate total failed correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // 10 email failed + 5 SMS failed = 15 total failed
      expect(data.summary.total_failed).toBe(15);
    });

    it('should calculate delivery rate correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // 80 delivered / 80 sent = 100%
      expect(data.summary.delivery_rate).toBe(100);
    });

    it('should calculate click rate correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // 10 clicked / 80 delivered = 12.5%
      expect(data.summary.click_rate).toBe(12.5);
    });

    it('should handle zero division gracefully', async () => {
      // Mock empty data
      mockGetMockStore.mockReturnValue({
        select: vi.fn().mockReturnValue([]),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.summary.total_sent).toBe(0);
      expect(data.summary.delivery_rate).toBe(0);
      expect(data.summary.click_rate).toBe(0);
    });
  });

  describe('Channel Breakdown', () => {
    it('should calculate email metrics correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.by_channel.email.sent).toBe(50);
      expect(data.by_channel.email.delivered).toBe(50);
      expect(data.by_channel.email.failed).toBe(10);
      expect(data.by_channel.email.delivery_rate).toBe(100);
    });

    it('should calculate SMS metrics correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.by_channel.sms.sent).toBe(30);
      expect(data.by_channel.sms.delivered).toBe(30);
      expect(data.by_channel.sms.failed).toBe(5);
      expect(data.by_channel.sms.delivery_rate).toBe(100);
    });
  });

  describe('Type Breakdown', () => {
    it('should group notifications by type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const types = data.by_type.map((t: any) => t.type);
      expect(types).toContain('appointment_reminder');
      expect(types).toContain('booking_confirmation');
      expect(types).toContain('report_card_completion');
    });

    it('should calculate success rate per type', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const appointmentReminder = data.by_type.find(
        (t: any) => t.type === 'appointment_reminder'
      );

      expect(appointmentReminder.sent).toBe(80); // 50 email + 30 SMS
      expect(appointmentReminder.delivered).toBe(80);
      expect(appointmentReminder.success_rate).toBe(100);
    });

    it('should sort types by sent count descending', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // appointment_reminder should be first (80 sent)
      expect(data.by_type[0].type).toBe('appointment_reminder');
      expect(data.by_type[0].sent).toBeGreaterThan(data.by_type[1].sent);
    });
  });

  describe('Timeline Data', () => {
    it('should generate daily aggregations', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-10&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Should have 6 days (Jan 10-15 inclusive)
      expect(data.timeline.length).toBe(6);
    });

    it('should include dates with zero notifications', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-10&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Check that all dates are present
      const dates = data.timeline.map((t: any) => t.date);
      expect(dates).toContain('2025-01-10');
      expect(dates).toContain('2025-01-11');
      expect(dates).toContain('2025-01-15');
    });

    it('should aggregate counts by date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-10&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const jan10 = data.timeline.find((t: any) => t.date === '2025-01-10');
      const jan12 = data.timeline.find((t: any) => t.date === '2025-01-12');
      const jan14 = data.timeline.find((t: any) => t.date === '2025-01-14');

      // Jan 10: 50 email notifications
      expect(jan10.sent).toBe(50);
      expect(jan10.delivered).toBe(50);
      expect(jan10.failed).toBe(0);

      // Jan 12: 30 SMS notifications
      expect(jan12.sent).toBe(30);
      expect(jan12.delivered).toBe(30);
      expect(jan12.failed).toBe(0);

      // Jan 14: 10 failed email notifications
      expect(jan14.sent).toBe(0);
      expect(jan14.delivered).toBe(0);
      expect(jan14.failed).toBe(10);
    });
  });

  describe('Failure Reasons', () => {
    it('should group failures by error message', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const reasons = data.failure_reasons.map((r: any) => r.reason);
      expect(reasons).toContain('Invalid email address');
      expect(reasons).toContain('Mailbox full');
      expect(reasons).toContain('Invalid phone number');
    });

    it('should calculate counts correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const invalidEmail = data.failure_reasons.find(
        (r: any) => r.reason === 'Invalid email address'
      );
      const invalidPhone = data.failure_reasons.find(
        (r: any) => r.reason === 'Invalid phone number'
      );

      expect(invalidEmail.count).toBe(5);
      expect(invalidPhone.count).toBe(5);
    });

    it('should calculate percentages correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Total failures: 15 (10 email + 5 SMS)
      // Invalid email: 5/15 = 33.33%
      // Mailbox full: 5/15 = 33.33%
      // Invalid phone: 5/15 = 33.33%

      const invalidEmail = data.failure_reasons.find(
        (r: any) => r.reason === 'Invalid email address'
      );

      expect(invalidEmail.percentage).toBeCloseTo(33.33, 1);
    });

    it('should sort failure reasons by count descending', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // All have equal counts, so order may vary
      expect(data.failure_reasons[0].count).toBeGreaterThanOrEqual(
        data.failure_reasons[1].count
      );
    });

    it('should return empty array when no failures', async () => {
      // Mock data with no failures
      const successOnlyNotifications = sampleNotifications.filter(
        (n) => n.status !== 'failed'
      );

      mockGetMockStore.mockReturnValue({
        select: vi.fn().mockReturnValue(successOnlyNotifications),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.failure_reasons).toEqual([]);
    });
  });

  describe('Previous Period Comparison', () => {
    it('should calculate sent change percentage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Current: 80 sent
      // Previous: 40 sent
      // Change: (80 - 40) / 40 = 100%
      expect(data.summary.trends.sent_change_percent).toBe(100);
    });

    it('should calculate delivery rate change', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Both periods have 100% delivery rate
      // Change: 0%
      expect(data.summary.trends.delivery_rate_change_percent).toBe(0);
    });

    it('should handle negative trends', async () => {
      // Create custom data where current period has fewer notifications than previous
      const customNotifications: NotificationLogRow[] = [];

      // Current period (Jan 1-15): 20 notifications
      for (let i = 0; i < 20; i++) {
        customNotifications.push({
          id: `current-${i}`,
          customer_id: `customer-${i}`,
          type: 'appointment_reminder',
          channel: 'email',
          recipient: `customer${i}@example.com`,
          subject: 'Reminder',
          content: 'Content',
          status: 'sent',
          error_message: null,
          sent_at: new Date('2025-01-10T10:00:00Z').toISOString(),
          delivered_at: new Date('2025-01-10T10:01:00Z').toISOString(),
          clicked_at: null,
          campaign_id: null,
          campaign_send_id: null,
          tracking_id: null,
          cost_cents: null,
          template_id: null,
          template_data: null,
          retry_count: 0,
          retry_after: null,
          is_test: false,
          message_id: null,
          created_at: new Date('2025-01-10T10:00:00Z').toISOString(),
        });
      }

      // Previous period (Dec 17-31): 40 notifications
      for (let i = 0; i < 40; i++) {
        customNotifications.push({
          id: `previous-${i}`,
          customer_id: `customer-${i}`,
          type: 'appointment_reminder',
          channel: 'email',
          recipient: `customer${i}@example.com`,
          subject: 'Reminder',
          content: 'Content',
          status: 'sent',
          error_message: null,
          sent_at: new Date('2024-12-25T10:00:00Z').toISOString(),
          delivered_at: new Date('2024-12-25T10:01:00Z').toISOString(),
          clicked_at: null,
          campaign_id: null,
          campaign_send_id: null,
          tracking_id: null,
          cost_cents: null,
          template_id: null,
          template_data: null,
          retry_count: 0,
          retry_after: null,
          is_test: false,
          message_id: null,
          created_at: new Date('2024-12-25T10:00:00Z').toISOString(),
        });
      }

      mockGetMockStore.mockReturnValue({
        select: vi.fn().mockReturnValue(customNotifications),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Current: 20, Previous: 40
      // Change: (20 - 40) / 40 = -50%
      expect(data.summary.trends.sent_change_percent).toBeLessThan(0);
      expect(data.summary.trends.sent_change_percent).toBeCloseTo(-50, 0);
    });
  });

  describe('Test Notification Exclusion', () => {
    it('should exclude test notifications from all metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      // Total should not include 5 test notifications
      // Should only count real notifications
      expect(data.summary.total_sent).not.toBe(85); // Would be 85 if tests included
      expect(data.summary.total_sent).toBe(80);
    });

    it('should exclude test notifications from type breakdown', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      const testType = data.by_type.find((t: any) => t.type === 'test');
      expect(testType).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle period with no data', async () => {
      mockGetMockStore.mockReturnValue({
        select: vi.fn().mockReturnValue([]),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-02-01&end_date=2025-02-28'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.summary.total_sent).toBe(0);
      expect(data.by_type).toEqual([]);
      expect(data.failure_reasons).toEqual([]);
      expect(data.timeline.length).toBeGreaterThan(0); // Should still have dates
    });

    it('should handle all failed notifications', async () => {
      const failedOnly = sampleNotifications.filter(
        (n) => n.status === 'failed' && !n.is_test
      );

      mockGetMockStore.mockReturnValue({
        select: vi.fn().mockReturnValue(failedOnly),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-01&end_date=2025-01-15'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.summary.total_sent).toBe(0);
      expect(data.summary.total_failed).toBe(15);
      expect(data.summary.delivery_rate).toBe(0);
    });

    it('should handle single day period', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/notifications/dashboard?start_date=2025-01-10&end_date=2025-01-10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.timeline.length).toBe(1);
      expect(data.timeline[0].date).toBe('2025-01-10');
    });
  });
});
