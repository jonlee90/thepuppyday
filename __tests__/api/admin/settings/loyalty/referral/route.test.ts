/**
 * Tests for Referral Program Settings API
 * Task 0199: Referral codes API and utility
 *
 * GET /api/admin/settings/loyalty/referral - Fetch referral program settings with stats
 * PUT /api/admin/settings/loyalty/referral - Update referral program settings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/admin/settings/loyalty/referral/route';
import { NextRequest } from 'next/server';

// ============================================================================
// MOCKS
// ============================================================================

const {
  mockCreateServerSupabaseClient,
  mockRequireAdmin,
  mockLogSettingsChange,
} = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockLogSettingsChange: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/lib/admin/audit-log', () => ({
  logSettingsChange: mockLogSettingsChange,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockAdminUser = {
  id: 'admin-123',
  email: 'jonalee90@yahoo.com',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
};

const mockDefaultSettings = {
  is_enabled: false,
  referrer_bonus_punches: 1,
  referee_bonus_punches: 0,
};

const mockEnabledSettings = {
  is_enabled: true,
  referrer_bonus_punches: 2,
  referee_bonus_punches: 1,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockSupabase() {
  const mock: any = {
    from: vi.fn(),
  };

  // Helper to create a query builder chain
  const createQueryBuilder = (finalResponse: any) => {
    const builder: any = {};

    // For count queries, the select/eq/or methods resolve directly to a promise
    if (finalResponse.count !== undefined) {
      builder.select = vi.fn(() => Promise.resolve(finalResponse));
      builder.eq = vi.fn(() => Promise.resolve(finalResponse));
      builder.or = vi.fn(() => Promise.resolve(finalResponse));
    } else {
      // For regular queries, chain methods return builder
      builder.select = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.or = vi.fn().mockReturnValue(builder);
      builder.upsert = vi.fn().mockReturnValue(builder);
      builder.single = vi.fn().mockResolvedValue(finalResponse);
    }

    return builder;
  };

  return { mock, createQueryBuilder };
}

// ============================================================================
// TESTS - GET /api/admin/settings/loyalty/referral
// ============================================================================

describe('GET /api/admin/settings/loyalty/referral', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ user: mockAdminUser, role: 'admin' });
  });

  it('should return default settings when no settings exist', async () => {
    const { mock, createQueryBuilder } = createMockSupabase();

    // First call: settings fetch (returns null)
    // Subsequent calls: stats queries
    mock.from.mockImplementation((table: string) => {
      if (table === 'settings') {
        return createQueryBuilder({ data: null, error: null });
      } else if (table === 'referrals') {
        return createQueryBuilder({ count: 0, error: null });
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      is_enabled: false,
      referrer_bonus_punches: 1,
      referee_bonus_punches: 0,
      stats: {
        total_referrals: 0,
        successful_conversions: 0,
        bonuses_awarded: 0,
      },
    });
  });

  it('should return existing settings with statistics', async () => {
    const { mock, createQueryBuilder } = createMockSupabase();

    let referralsCallCount = 0;
    mock.from.mockImplementation((table: string) => {
      if (table === 'settings') {
        return createQueryBuilder({ data: { value: mockEnabledSettings }, error: null });
      } else if (table === 'referrals') {
        referralsCallCount++;
        if (referralsCallCount === 1) {
          return createQueryBuilder({ count: 50, error: null });
        } else if (referralsCallCount === 2) {
          return createQueryBuilder({ count: 35, error: null });
        } else {
          return createQueryBuilder({ count: 40, error: null });
        }
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      is_enabled: true,
      referrer_bonus_punches: 2,
      referee_bonus_punches: 1,
      stats: {
        total_referrals: 50,
        successful_conversions: 35,
        bonuses_awarded: 40,
      },
    });
  });

  it('should handle stats query errors gracefully', async () => {
    const { mock, createQueryBuilder } = createMockSupabase();

    mock.from.mockImplementation((table: string) => {
      if (table === 'settings') {
        return createQueryBuilder({ data: { value: mockDefaultSettings }, error: null });
      } else if (table === 'referrals') {
        return createQueryBuilder({ count: null, error: new Error('Query failed') });
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toEqual({
      total_referrals: 0,
      successful_conversions: 0,
      bonuses_awarded: 0,
    });
  });

  it('should require admin authentication', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Unauthorized: Admin or staff access required'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should handle database errors', async () => {
    const { mock } = createMockSupabase();
    mock.from.mockImplementation(() => {
      throw new Error('Database connection failed');
    });
    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeTruthy();
  });
});

// ============================================================================
// TESTS - PUT /api/admin/settings/loyalty/referral
// ============================================================================

describe('PUT /api/admin/settings/loyalty/referral', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ user: mockAdminUser, role: 'admin' });
    mockLogSettingsChange.mockResolvedValue(undefined);
  });

  it('should update referral program settings successfully', async () => {
    const newSettings = {
      is_enabled: true,
      referrer_bonus_punches: 3,
      referee_bonus_punches: 2,
    };

    const { mock, createQueryBuilder } = createMockSupabase();

    let settingsCallCount = 0;
    let referralsCallCount = 0;

    mock.from.mockImplementation((table: string) => {
      if (table === 'settings') {
        settingsCallCount++;
        if (settingsCallCount === 1) {
          // First call: fetch old settings
          return createQueryBuilder({ data: { value: mockDefaultSettings }, error: null });
        } else {
          // Second call: upsert
          return createQueryBuilder({ error: null });
        }
      } else if (table === 'referrals') {
        referralsCallCount++;
        if (referralsCallCount === 1) {
          return createQueryBuilder({ count: 25, error: null });
        } else if (referralsCallCount === 2) {
          return createQueryBuilder({ count: 20, error: null });
        } else {
          return createQueryBuilder({ count: 22, error: null });
        }
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.referral_program).toEqual(newSettings);
    expect(data.stats).toEqual({
      total_referrals: 25,
      successful_conversions: 20,
      bonuses_awarded: 22,
    });
    expect(data.message).toContain('enabled');
  });

  it('should validate referrer_bonus_punches range', async () => {
    const invalidSettings = {
      is_enabled: true,
      referrer_bonus_punches: 15,
      referee_bonus_punches: 1,
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid referral program settings');
  });

  it('should validate referee_bonus_punches range', async () => {
    const invalidSettings = {
      is_enabled: true,
      referrer_bonus_punches: 1,
      referee_bonus_punches: -1,
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid referral program settings');
  });

  it('should validate is_enabled is boolean', async () => {
    const invalidSettings = {
      is_enabled: 'yes',
      referrer_bonus_punches: 1,
      referee_bonus_punches: 0,
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid referral program settings');
  });

  it('should log settings change with old and new values', async () => {
    const newSettings = {
      is_enabled: true,
      referrer_bonus_punches: 2,
      referee_bonus_punches: 1,
    };

    const { mock, createQueryBuilder } = createMockSupabase();

    mock.from.mockImplementation((table: string) => {
      if (table === 'settings') {
        return createQueryBuilder({ data: { value: mockDefaultSettings }, error: null });
      } else {
        return createQueryBuilder({ count: 0, error: null });
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(newSettings),
    });

    await PUT(request);

    expect(mockLogSettingsChange).toHaveBeenCalledWith(
      mock,
      mockAdminUser.id,
      'referral',
      'referral_program',
      mockDefaultSettings,
      newSettings
    );
  });

  it('should include note about disabling in message', async () => {
    const disabledSettings = {
      is_enabled: false,
      referrer_bonus_punches: 1,
      referee_bonus_punches: 0,
    };

    const { mock, createQueryBuilder } = createMockSupabase();

    mock.from.mockImplementation(() => {
      return createQueryBuilder({ data: null, error: null, count: 0 });
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(disabledSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(data.message).toContain('disabled');
    expect(data.message).toContain('honors existing pending referrals');
  });

  it('should require admin authentication', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Unauthorized: Admin or staff access required'));

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(mockDefaultSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should handle database update errors', async () => {
    const { mock, createQueryBuilder } = createMockSupabase();

    let callCount = 0;
    mock.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createQueryBuilder({ data: null, error: null });
      } else {
        return createQueryBuilder({ error: new Error('Update failed') });
      }
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(mockDefaultSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeTruthy();
  });

  it('should accept minimum valid values', async () => {
    const minSettings = {
      is_enabled: false,
      referrer_bonus_punches: 0,
      referee_bonus_punches: 0,
    };

    const { mock, createQueryBuilder } = createMockSupabase();

    mock.from.mockImplementation(() => {
      return createQueryBuilder({ data: null, error: null, count: 0 });
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(minSettings),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
  });

  it('should accept maximum valid values', async () => {
    const maxSettings = {
      is_enabled: true,
      referrer_bonus_punches: 10,
      referee_bonus_punches: 10,
    };

    const { mock, createQueryBuilder } = createMockSupabase();

    mock.from.mockImplementation(() => {
      return createQueryBuilder({ data: null, error: null, count: 0 });
    });

    mockCreateServerSupabaseClient.mockResolvedValue(mock);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(maxSettings),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
  });

  it('should reject non-integer punch values', async () => {
    const invalidSettings = {
      is_enabled: true,
      referrer_bonus_punches: 2.5,
      referee_bonus_punches: 1,
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: JSON.stringify(invalidSettings),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid referral program settings');
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/settings/loyalty/referral', {
      method: 'PUT',
      body: 'not valid json',
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeTruthy();
  });
});
