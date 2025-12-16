/**
 * Phase 8 Task 0110: Waitlist Notification Trigger Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerWaitlistNotification,
  triggerWaitlistNotificationBatch,
  validateWaitlistNotificationData,
  handleWaitlistExpiration,
} from '../waitlist-notification';
import type { WaitlistNotificationTriggerData } from '../waitlist-notification';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the notification service
vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

describe('triggerWaitlistNotification', () => {
  let mockSupabase: any;
  let mockSendNotification: any;

  beforeEach(async () => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    const { sendNotification } = await import('@/lib/notifications');
    mockSendNotification = sendNotification;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const validData: WaitlistNotificationTriggerData = {
    waitlistEntryId: 'waitlist-123',
    customerId: 'customer-123',
    customerPhone: '+16572522903',
    petName: 'Max',
    availableDate: '2024-12-18', // Current test date
    availableTime: '10:00',
    serviceId: 'service-123',
    expirationHours: 2,
  };

  describe('SMS Notification', () => {
    it('should send SMS with claim link', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await triggerWaitlistNotification(mockSupabase, validData);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(result.skipped).toBe(false);

      expect(mockSendNotification).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          type: 'waitlist_slot_available',
          channel: 'sms',
          recipient: '+16572522903',
          userId: 'customer-123',
          templateData: expect.objectContaining({
            available_date: expect.any(String),
            available_time: '10:00',
            claim_link: expect.stringContaining('/booking/claim/waitlist-123'),
          }),
        })
      );
    });

    it('should skip SMS when phone number not provided', async () => {
      const dataWithoutPhone = { ...validData, customerPhone: null };

      const result = await triggerWaitlistNotification(mockSupabase, dataWithoutPhone);

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('No phone number available');

      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('should format date correctly', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await triggerWaitlistNotification(mockSupabase, validData);

      const call = mockSendNotification.mock.calls[0];
      // Date formatting depends on locale, check that it contains the date
      expect(call[1].templateData.available_date).toMatch(/12\/18/);
    });
  });

  describe('Waitlist Entry Update', () => {
    it('should update entry status to notified when SMS sent', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await triggerWaitlistNotification(mockSupabase, validData);

      expect(mockSupabase.from).toHaveBeenCalledWith('waitlist');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'notified',
        notified_at: expect.any(String),
        offer_expires_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'waitlist-123');
    });

    it('should set correct expiration time', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        messageId: 'sms-123',
        logId: 'log-123',
      });

      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      await triggerWaitlistNotification(mockSupabase, {
        ...validData,
        expirationHours: 3,
      });

      const updateCall = mockSupabase.update.mock.calls[0][0];
      const offerExpires = new Date(updateCall.offer_expires_at);
      const notifiedAt = new Date(updateCall.notified_at);

      const hoursDiff =
        (offerExpires.getTime() - notifiedAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(3, 0);
    });

    it('should not update entry when SMS fails', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS provider error',
      });

      await triggerWaitlistNotification(mockSupabase, validData);

      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle SMS failure', async () => {
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: 'SMS provider error',
      });

      const result = await triggerWaitlistNotification(mockSupabase, validData);

      expect(result.success).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toContain('SMS failed: SMS provider error');
    });

    it('should handle exceptions from sendNotification', async () => {
      mockSendNotification.mockRejectedValueOnce(new Error('Network error'));

      const result = await triggerWaitlistNotification(mockSupabase, validData);

      expect(result.success).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.errors).toContain('SMS error: Network error');
    });
  });
});

// Helper function to create a properly chainable Supabase mock
function createSupabaseMock() {
  const mock: any = {};
  mock.from = vi.fn().mockImplementation(() => mock);
  mock.select = vi.fn().mockImplementation(() => mock);
  mock.eq = vi.fn().mockImplementation(() => mock);
  mock.is = vi.fn().mockImplementation(() => mock);
  mock.order = vi.fn().mockImplementation(() => mock);
  mock.limit = vi.fn();
  mock.update = vi.fn().mockImplementation(() => mock);
  return mock;
}

describe('triggerWaitlistNotificationBatch', () => {
  let mockSupabase: any;
  let mockSendNotification: any;

  beforeEach(async () => {
    const { sendNotification } = await import('@/lib/notifications');
    mockSendNotification = sendNotification;
    mockSupabase = createSupabaseMock();
  });

  it('should process multiple waitlist entries in FIFO order', async () => {
    const serviceId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    const mockEntries = [
      {
        id: 'waitlist-1',
        customer_id: 'customer-1',
        pet_id: 'pet-1',
        service_id: serviceId,
        created_at: '2025-12-10T10:00:00Z',
        customer: { id: 'customer-1', first_name: 'John', phone: '+11234567890' },
        pet: { id: 'pet-1', name: 'Max' },
      },
      {
        id: 'waitlist-2',
        customer_id: 'customer-2',
        pet_id: 'pet-2',
        service_id: serviceId,
        created_at: '2025-12-11T10:00:00Z',
        customer: { id: 'customer-2', first_name: 'Jane', phone: '+10987654321' },
        pet: { id: 'pet-2', name: 'Bella' },
      },
    ];

    // Setup mock for the initial query
    const mockQuery = {
      data: mockEntries,
      error: null,
    };
    mockSupabase.limit.mockResolvedValueOnce(mockQuery);

    // Mock the notifications being sent successfully
    mockSendNotification.mockResolvedValue({
      success: true,
      messageId: 'sms-123',
      logId: 'log-123',
    });

    // Mock the update calls for each waitlist entry
    mockSupabase.eq.mockResolvedValue({ error: null });

    const result = await triggerWaitlistNotificationBatch(
      mockSupabase,
      '2025-12-20',
      '10:00',
      serviceId,
      2
    );

    expect(result.total).toBe(2);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);

    // Verify ordering query
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });

    // Verify both notifications were sent
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  it('should handle partial failures', async () => {
    const serviceId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    const mockEntries = [
      {
        id: 'waitlist-1',
        customer_id: 'customer-1',
        pet_id: 'pet-1',
        service_id: serviceId,
        customer: { id: 'customer-1', first_name: 'John', phone: '+11234567890' },
        pet: { id: 'pet-1', name: 'Max' },
      },
      {
        id: 'waitlist-2',
        customer_id: 'customer-2',
        pet_id: 'pet-2',
        service_id: serviceId,
        customer: { id: 'customer-2', first_name: 'Jane', phone: null }, // No phone
        pet: { id: 'pet-2', name: 'Bella' },
      },
    ];

    const mockQuery = {
      data: mockEntries,
      error: null,
    };
    mockSupabase.limit.mockResolvedValueOnce(mockQuery);

    mockSendNotification.mockResolvedValue({
      success: true,
      messageId: 'sms-123',
      logId: 'log-123',
    });

    mockSupabase.eq.mockResolvedValue({ error: null });

    const result = await triggerWaitlistNotificationBatch(
      mockSupabase,
      '2025-12-20',
      '10:00',
      serviceId
    );

    expect(result.total).toBe(2);
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1);

    // Only one notification should have been sent (for the entry with phone)
    expect(mockSendNotification).toHaveBeenCalledTimes(1);
  });

  it('should return empty result when no active entries', async () => {
    const serviceId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    mockSupabase.limit.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await triggerWaitlistNotificationBatch(
      mockSupabase,
      '2025-12-20',
      '10:00',
      serviceId
    );

    expect(result.total).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    const serviceId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
    mockSupabase.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await triggerWaitlistNotificationBatch(
      mockSupabase,
      '2025-12-20',
      '10:00',
      serviceId
    );

    expect(result.total).toBe(0);
    expect(result.failed).toBe(1);
  });
});

describe('validateWaitlistNotificationData', () => {
  it('should validate complete data', () => {
    const validData: WaitlistNotificationTriggerData = {
      waitlistEntryId: 'waitlist-123',
      customerId: 'customer-123',
      customerPhone: '+16572522903',
      petName: 'Max',
      availableDate: '2025-12-20',
      availableTime: '10:00',
      serviceId: 'service-123',
    };

    const result = validateWaitlistNotificationData(validData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      waitlistEntryId: 'waitlist-123',
      // Missing required fields
    };

    const result = validateWaitlistNotificationData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('customerId is required');
    expect(result.errors).toContain('petName is required');
    expect(result.errors).toContain('availableDate is required');
    expect(result.errors).toContain('availableTime is required');
    expect(result.errors).toContain('serviceId is required');
  });
});

describe('handleWaitlistExpiration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
  });

  it('should mark entry as expired', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        service_id: 'service-123',
        preferred_date: '2025-12-20',
      },
      error: null,
    });

    await handleWaitlistExpiration(mockSupabase, 'waitlist-123');

    expect(mockSupabase.update).toHaveBeenCalledWith({
      status: 'expired_offer',
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'waitlist-123');
  });

  it('should handle database errors', async () => {
    mockSupabase.eq.mockResolvedValueOnce({
      error: { message: 'Database error' },
    });

    const result = await handleWaitlistExpiration(mockSupabase, 'waitlist-123');

    expect(result.notifiedNext).toBe(false);
  });

  it('should handle missing entry', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    });

    const result = await handleWaitlistExpiration(mockSupabase, 'waitlist-123');

    expect(result.notifiedNext).toBe(false);
  });
});
