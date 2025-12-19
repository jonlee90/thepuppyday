/**
 * Tests for Referral Program Integration
 * Task 0201: Loyalty system integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateReferralCodeForCustomer,
  applyReferralCode,
  awardReferralBonuses,
  getCustomerReferralStats,
} from '@/lib/loyalty/referrals';
import { createMockClient } from '@/mocks/supabase/client';
import type { MockSupabaseClient } from '@/mocks/supabase/client';

// Mock the referral-codes module
vi.mock('@/lib/loyalty/referral-codes', () => ({
  generateReferralCode: vi.fn().mockResolvedValue('ABC123'),
  isValidReferralCodeFormat: vi.fn((code: string) => /^[A-Z0-9]{6}$/.test(code)),
}));

// Mock the loyalty settings module
vi.mock('@/lib/admin/loyalty-settings', () => ({
  getLoyaltySettings: vi.fn().mockResolvedValue({
    program: {
      is_enabled: true,
      punch_threshold: 9,
    },
    earning_rules: {
      qualifying_services: [],
      minimum_spend: 50,
      first_visit_bonus: 2,
    },
    redemption_rules: {
      eligible_services: ['service-1', 'service-2'],
      expiration_days: 90,
      max_value: 75,
    },
    referral: {
      is_enabled: true,
      referrer_bonus_punches: 3,
      referee_bonus_punches: 2,
    },
  }),
}));

describe('Referral Program Integration', () => {
  let supabase: MockSupabaseClient;
  const customerId = 'customer-123';
  const referrerId = 'referrer-456';

  beforeEach(() => {
    supabase = createMockClient();
    vi.clearAllMocks();
  });

  describe('generateReferralCodeForCustomer', () => {
    it('should generate new referral code for customer without one', async () => {
      // No existing code
      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'insert').mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'code-1', code: 'ABC123' },
            error: null,
          }),
        }),
      } as never);

      const result = await generateReferralCodeForCustomer(supabase, customerId);

      expect(result.success).toBe(true);
      expect(result.code).toBe('ABC123');
      expect(result.referralCodeId).toBe('code-1');
    });

    it('should return existing code if customer already has one', async () => {
      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'code-1', code: 'XYZ789' },
              error: null,
            }),
          }),
        }),
      } as never);

      const result = await generateReferralCodeForCustomer(supabase, customerId);

      expect(result.success).toBe(true);
      expect(result.code).toBe('XYZ789');
      expect(result.message).toContain('already exists');
    });

    it('should fail when referral program is disabled', async () => {
      const { getLoyaltySettings } = await import('@/lib/admin/loyalty-settings');
      vi.mocked(getLoyaltySettings).mockResolvedValueOnce({
        program: { is_enabled: true, punch_threshold: 9 },
        earning_rules: { qualifying_services: [], minimum_spend: 50, first_visit_bonus: 2 },
        redemption_rules: { eligible_services: ['service-1'], expiration_days: 90, max_value: 75 },
        referral: {
          is_enabled: false, // Disabled
          referrer_bonus_punches: 3,
          referee_bonus_punches: 2,
        },
      });

      const result = await generateReferralCodeForCustomer(supabase, customerId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not enabled');
    });
  });

  describe('applyReferralCode', () => {
    it('should successfully apply valid referral code', async () => {
      const mockCodeData = {
        id: 'code-1',
        customer_id: referrerId,
        is_active: true,
        max_uses: null,
        uses_count: 0,
        users: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      // No existing referral for this customer
      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      // Code exists and is valid
      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCodeData,
            error: null,
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referrals'), 'insert').mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'referral-1' },
            error: null,
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'ABC123');

      expect(result.success).toBe(true);
      expect(result.referralId).toBe('referral-1');
      expect(result.referrerId).toBe(referrerId);
      expect(result.referrerName).toBe('John Doe');
    });

    it('should reject invalid code format', async () => {
      const result = await applyReferralCode(supabase, customerId, 'invalid');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid referral code format');
    });

    it('should reject code that does not exist', async () => {
      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'XYZ999');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid referral code');
    });

    it('should reject inactive referral code', async () => {
      const mockCodeData = {
        id: 'code-1',
        customer_id: referrerId,
        is_active: false, // Inactive
        max_uses: null,
        uses_count: 0,
      };

      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCodeData,
            error: null,
          }),
        }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'ABC123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('no longer active');
    });

    it('should reject code that has reached max uses', async () => {
      const mockCodeData = {
        id: 'code-1',
        customer_id: referrerId,
        is_active: true,
        max_uses: 5,
        uses_count: 5, // At limit
      };

      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCodeData,
            error: null,
          }),
        }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'ABC123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('usage limit');
    });

    it('should prevent self-referral', async () => {
      const mockCodeData = {
        id: 'code-1',
        customer_id: customerId, // Same as referee
        is_active: true,
        max_uses: null,
        uses_count: 0,
      };

      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCodeData,
            error: null,
          }),
        }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'ABC123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot use your own');
    });

    it('should prevent duplicate referral application', async () => {
      // Customer already has a referral
      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'existing-referral' },
            error: null,
          }),
        }),
      } as never);

      const result = await applyReferralCode(supabase, customerId, 'ABC123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already used');
    });
  });

  describe('awardReferralBonuses', () => {
    it('should award bonuses to both referrer and referee', async () => {
      const mockReferral = {
        id: 'referral-1',
        referrer_id: referrerId,
        referee_id: customerId,
        status: 'pending',
      };

      const mockReferrerLoyalty = {
        id: 'loyalty-referrer',
        customer_id: referrerId,
        current_punches: 5,
        threshold_override: null,
        total_visits: 5,
        free_washes_earned: 0,
      };

      const mockRefereeLoyalty = {
        id: 'loyalty-referee',
        customer_id: customerId,
        current_punches: 2,
        threshold_override: null,
        total_visits: 1,
        free_washes_earned: 0,
      };

      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReferral,
              error: null,
            }),
          }),
        }),
      } as never);

      // Mock loyalty record fetches
      let selectCallCount = 0;
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockImplementation((() => {
        selectCallCount++;
        const data = selectCallCount === 1 ? mockReferrerLoyalty : mockRefereeLoyalty;
        return {
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error: null }),
          }),
        };
      }) as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      vi.spyOn(supabase.from('loyalty_punches'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      vi.spyOn(supabase.from('referrals'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      const result = await awardReferralBonuses(supabase, customerId, 'appointment-1');

      expect(result.success).toBe(true);
      expect(result.referrerBonusAwarded).toBe(3);
      expect(result.refereeBonusAwarded).toBe(2);
    });

    it('should not award bonuses when referral program is disabled', async () => {
      const { getLoyaltySettings } = await import('@/lib/admin/loyalty-settings');
      vi.mocked(getLoyaltySettings).mockResolvedValueOnce({
        program: { is_enabled: true, punch_threshold: 9 },
        earning_rules: { qualifying_services: [], minimum_spend: 50, first_visit_bonus: 2 },
        redemption_rules: { eligible_services: ['service-1'], expiration_days: 90, max_value: 75 },
        referral: {
          is_enabled: false, // Disabled
          referrer_bonus_punches: 3,
          referee_bonus_punches: 2,
        },
      });

      const result = await awardReferralBonuses(supabase, customerId, 'appointment-1');

      expect(result.success).toBe(false);
      expect(result.referrerBonusAwarded).toBe(0);
      expect(result.refereeBonusAwarded).toBe(0);
    });

    it('should not award bonuses when no pending referral exists', async () => {
      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as never);

      const result = await awardReferralBonuses(supabase, customerId, 'appointment-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No pending referral');
    });
  });

  describe('getCustomerReferralStats', () => {
    it('should return referral statistics for customer', async () => {
      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { code: 'ABC123' },
              error: null,
            }),
          }),
        }),
      } as never);

      // Mock count queries
      let selectCallCount = 0;
      vi.spyOn(supabase.from('referrals'), 'select').mockImplementation((() => {
        selectCallCount++;
        const count = selectCallCount === 1 ? 5 : selectCallCount === 2 ? 3 : 2;
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count, error: null }),
          }),
        };
      }) as never);

      const result = await getCustomerReferralStats(supabase, customerId);

      expect(result.referralCode).toBe('ABC123');
      expect(result.totalReferrals).toBe(5);
      expect(result.completedReferrals).toBe(3);
      expect(result.pendingReferrals).toBe(2);
    });

    it('should return zeros when customer has no referral activity', async () => {
      vi.spyOn(supabase.from('referral_codes'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('referrals'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      } as never);

      const result = await getCustomerReferralStats(supabase, customerId);

      expect(result.referralCode).toBeNull();
      expect(result.totalReferrals).toBe(0);
      expect(result.completedReferrals).toBe(0);
      expect(result.pendingReferrals).toBe(0);
    });
  });
});
