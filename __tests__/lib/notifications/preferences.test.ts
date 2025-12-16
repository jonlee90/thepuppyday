/**
 * Unit tests for notification preferences helper functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  checkNotificationAllowed,
  disableMarketing,
  disableNotificationChannel,
} from '@/lib/notifications/preferences';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/preferences';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  };
  return mockSupabase as unknown as SupabaseClient;
};

describe('getNotificationPreferences', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('returns default preferences when user not found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });

    const result = await getNotificationPreferences(mockSupabase, 'user-123');

    expect(result).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('returns default preferences when preferences is empty object', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: { preferences: {} },
      error: null,
    });

    const result = await getNotificationPreferences(mockSupabase, 'user-123');

    expect(result).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('merges user preferences with defaults', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          marketing_enabled: false,
          email_appointment_reminders: true,
          // Other fields missing
        },
      },
      error: null,
    });

    const result = await getNotificationPreferences(mockSupabase, 'user-123');

    expect(result).toEqual({
      marketing_enabled: false,
      email_appointment_reminders: true,
      sms_appointment_reminders: DEFAULT_NOTIFICATION_PREFERENCES.sms_appointment_reminders,
      email_retention_reminders: DEFAULT_NOTIFICATION_PREFERENCES.email_retention_reminders,
      sms_retention_reminders: DEFAULT_NOTIFICATION_PREFERENCES.sms_retention_reminders,
    });
  });

  it('returns full user preferences when all fields present', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    const userPrefs = {
      marketing_enabled: false,
      email_appointment_reminders: false,
      sms_appointment_reminders: true,
      email_retention_reminders: false,
      sms_retention_reminders: true,
    };

    mockSupabaseTyped.single.mockResolvedValue({
      data: { preferences: userPrefs },
      error: null,
    });

    const result = await getNotificationPreferences(mockSupabase, 'user-123');

    expect(result).toEqual(userPrefs);
  });

  it('ignores non-boolean values in preferences', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          marketing_enabled: 'true', // String instead of boolean
          email_appointment_reminders: 1, // Number instead of boolean
        },
      },
      error: null,
    });

    const result = await getNotificationPreferences(mockSupabase, 'user-123');

    // Should use defaults for invalid values
    expect(result.marketing_enabled).toBe(DEFAULT_NOTIFICATION_PREFERENCES.marketing_enabled);
    expect(result.email_appointment_reminders).toBe(
      DEFAULT_NOTIFICATION_PREFERENCES.email_appointment_reminders
    );
  });
});

describe('updateNotificationPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates preferences successfully', async () => {
    // Create a fresh mock for this test to handle multiple database calls
    // The key insight: eq() is called twice (once for get, once for update)
    // single() is only called once (for get)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    // All chaining methods return the mock object
    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);

    // eq() is called twice:
    // 1st call: for SELECT - returns mock so .single() can be called
    // 2nd call: for UPDATE - returns promise with result
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase); // First call chains to single()
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: null }); // Second call is final

    // single() is only called once for the SELECT
    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateNotificationPreferences(freshMockSupabase as any, 'user-123', {
      marketing_enabled: false,
    });

    expect(result.success).toBe(true);
    expect(freshMockSupabase.update).toHaveBeenCalled();
  });

  it('merges partial updates with existing preferences', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase);
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    const existingPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      marketing_enabled: true,
      email_appointment_reminders: false,
    };

    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: existingPrefs },
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateNotificationPreferences(freshMockSupabase as any, 'user-123', {
      marketing_enabled: false,
    });

    // Verify update was called with merged preferences
    const updateCall = freshMockSupabase.update.mock.calls[0][0];
    expect(updateCall.preferences.marketing_enabled).toBe(false);
    expect(updateCall.preferences.email_appointment_reminders).toBe(false); // Preserved from existing
    expect(updateCall.preferences.sms_appointment_reminders).toBe(true); // From defaults
  });

  it('returns error when update fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase);
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateNotificationPreferences(freshMockSupabase as any, 'user-123', {
      marketing_enabled: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('checkNotificationAllowed', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('allows transactional notifications regardless of preferences', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          marketing_enabled: false,
        },
      },
      error: null,
    });

    const result = await checkNotificationAllowed(
      mockSupabase,
      'user-123',
      'booking_confirmation',
      'email'
    );

    expect(result.allowed).toBe(true);
  });

  it('blocks marketing notifications when marketing disabled', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          marketing_enabled: false,
        },
      },
      error: null,
    });

    const result = await checkNotificationAllowed(
      mockSupabase,
      'user-123',
      'retention_reminder',
      'email'
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('customer_preference_marketing_disabled');
  });

  it('blocks email appointment reminders when disabled', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          email_appointment_reminders: false,
        },
      },
      error: null,
    });

    const result = await checkNotificationAllowed(
      mockSupabase,
      'user-123',
      'appointment_reminder',
      'email'
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('customer_preference_email_reminders_disabled');
  });

  it('blocks SMS retention reminders when disabled', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          marketing_enabled: true,
          sms_retention_reminders: false,
        },
      },
      error: null,
    });

    const result = await checkNotificationAllowed(
      mockSupabase,
      'user-123',
      'retention_reminder',
      'sms'
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('customer_preference_sms_retention_disabled');
  });

  it('allows notifications when all preferences enabled', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabaseTyped = mockSupabase as any;
    mockSupabaseTyped.single.mockResolvedValue({
      data: {
        preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      },
      error: null,
    });

    const result = await checkNotificationAllowed(
      mockSupabase,
      'user-123',
      'appointment_reminder',
      'email'
    );

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('disableMarketing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets marketing_enabled to false', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase);
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await disableMarketing(freshMockSupabase as any, 'user-123');

    expect(result.success).toBe(true);
    expect(freshMockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          marketing_enabled: false,
        }),
      })
    );
  });
});

describe('disableNotificationChannel', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  it('disables email appointment reminders', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase);
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    const result = await disableNotificationChannel(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      freshMockSupabase as any,
      'user-123',
      'appointment_reminder',
      'email'
    );

    expect(result.success).toBe(true);
    expect(freshMockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          email_appointment_reminders: false,
        }),
      })
    );
  });

  it('disables SMS retention reminders', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freshMockSupabase: any = {
      from: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };

    freshMockSupabase.from.mockReturnValue(freshMockSupabase);
    freshMockSupabase.select.mockReturnValue(freshMockSupabase);
    freshMockSupabase.update.mockReturnValue(freshMockSupabase);
    freshMockSupabase.eq.mockReturnValueOnce(freshMockSupabase);
    freshMockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });

    freshMockSupabase.single.mockResolvedValueOnce({
      data: { preferences: DEFAULT_NOTIFICATION_PREFERENCES },
      error: null,
    });

    const result = await disableNotificationChannel(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      freshMockSupabase as any,
      'user-123',
      'retention_reminder',
      'sms'
    );

    expect(result.success).toBe(true);
    expect(freshMockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: expect.objectContaining({
          sms_retention_reminders: false,
        }),
      })
    );
  });

  it('returns error for invalid notification type', async () => {
    // This test doesn't need to mock database calls since it validates the type first
    const result = await disableNotificationChannel(
      mockSupabase,
      'user-123',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'invalid_type' as any,
      'email'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid notification type or channel');
  });
});
