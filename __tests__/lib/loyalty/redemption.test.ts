/**
 * Tests for Loyalty Redemption Logic
 * Task 0201: Loyalty system integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  canRedeemForService,
  redeemRewardForAppointment,
  getAvailableRewards,
  markExpiredRewards,
} from '@/lib/loyalty/redemption';
import { createMockClient } from '@/mocks/supabase/client';
import type { MockSupabaseClient } from '@/mocks/supabase/client';

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
  isServiceEligibleForRedemption: vi.fn((serviceId: string, eligibleServices: string[]) => {
    return eligibleServices.includes(serviceId);
  }),
  isRewardExpired: vi.fn((earnedAt: string, expirationDays: number) => {
    if (expirationDays === 0) return false;
    const earnedDate = new Date(earnedAt);
    const expirationDate = new Date(earnedDate);
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    return new Date() > expirationDate;
  }),
  calculateRedemptionValue: vi.fn((servicePrice: number, maxValue: number | null) => {
    if (maxValue === null) return servicePrice;
    return Math.min(servicePrice, maxValue);
  }),
}));

describe('Loyalty Redemption', () => {
  let supabase: MockSupabaseClient;
  const customerId = 'customer-123';
  const appointmentId = 'appointment-456';
  const serviceId = 'service-1'; // Eligible service

  beforeEach(() => {
    supabase = createMockClient();
    vi.clearAllMocks();
  });

  describe('canRedeemForService', () => {
    it('should allow redemption for eligible service with available rewards', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
      };

      const mockRedemptions = [
        {
          id: 'redemption-1',
          customer_loyalty_id: 'loyalty-1',
          status: 'pending',
          created_at: new Date().toISOString(), // Recent
        },
      ];

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRedemptions, error: null }),
          }),
        }),
      } as never);

      const result = await canRedeemForService(supabase, customerId, serviceId, 85.0);

      expect(result.allowed).toBe(true);
      expect(result.availableRewards).toBe(1);
      expect(result.redemptionValue).toBe(75); // Capped at max_value
    });

    it('should not allow redemption for ineligible service', async () => {
      const result = await canRedeemForService(supabase, customerId, 'service-999', 85.0);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not eligible');
    });

    it('should not allow redemption when no rewards available', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
      };

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never);

      const result = await canRedeemForService(supabase, customerId, serviceId, 85.0);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No available rewards');
      expect(result.availableRewards).toBe(0);
    });

    it('should not allow redemption for customer with no loyalty account', async () => {
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await canRedeemForService(supabase, customerId, serviceId, 85.0);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No loyalty account');
    });

    it('should calculate redemption value without cap when max_value is null', async () => {
      // Override mock to return null max_value
      const { getLoyaltySettings } = await import('@/lib/admin/loyalty-settings');
      vi.mocked(getLoyaltySettings).mockResolvedValueOnce({
        program: { is_enabled: true, punch_threshold: 9 },
        earning_rules: { qualifying_services: [], minimum_spend: 50, first_visit_bonus: 2 },
        redemption_rules: {
          eligible_services: ['service-1'],
          expiration_days: 90,
          max_value: null, // No cap
        },
        referral: { is_enabled: true, referrer_bonus_punches: 3, referee_bonus_punches: 2 },
      });

      const mockLoyalty = { id: 'loyalty-1', customer_id: customerId };
      const mockRedemptions = [
        {
          id: 'redemption-1',
          customer_loyalty_id: 'loyalty-1',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRedemptions, error: null }),
          }),
        }),
      } as never);

      const result = await canRedeemForService(supabase, customerId, serviceId, 125.0);

      expect(result.allowed).toBe(true);
      expect(result.redemptionValue).toBe(125.0); // Full service price, no cap
    });
  });

  describe('redeemRewardForAppointment', () => {
    it('should successfully redeem oldest pending reward', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        free_washes_redeemed: 0,
      };

      const mockRedemptions = [
        {
          id: 'redemption-1',
          customer_loyalty_id: 'loyalty-1',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockRedemptions, error: null }),
            }),
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      const result = await redeemRewardForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        85.0
      );

      expect(result.success).toBe(true);
      expect(result.redemptionId).toBe('redemption-1');
      expect(result.redemptionValue).toBe(75); // Capped at max_value
      expect(result.remainingRewards).toBe(0);
    });

    it('should fail redemption when validation fails', async () => {
      // No loyalty record
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await redeemRewardForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        85.0
      );

      expect(result.success).toBe(false);
      expect(result.redemptionValue).toBe(0);
    });

    it('should update redeemed count after successful redemption', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        free_washes_redeemed: 3,
      };

      const mockRedemptions = [
        {
          id: 'redemption-1',
          customer_loyalty_id: 'loyalty-1',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockRedemptions, error: null }),
            }),
          }),
        }),
      } as never);

      const updateSpy = vi.spyOn(supabase.from('loyalty_redemptions'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      await redeemRewardForAppointment(supabase, customerId, appointmentId, serviceId, 85.0);

      expect(updateSpy).toHaveBeenCalledWith({
        status: 'redeemed',
        appointment_id: appointmentId,
        redeemed_at: expect.any(String),
      });
    });
  });

  describe('getAvailableRewards', () => {
    it('should return list of available rewards with expiration status', async () => {
      const mockLoyalty = { id: 'loyalty-1' };
      const mockRedemptions = [
        {
          id: 'redemption-1',
          cycle_number: 1,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        },
        {
          id: 'redemption-2',
          cycle_number: 2,
          created_at: new Date().toISOString(), // Today
        },
      ];

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRedemptions, error: null }),
          }),
        }),
      } as never);

      const result = await getAvailableRewards(supabase, customerId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('redemption-1');
      expect(result[1].id).toBe('redemption-2');
    });

    it('should return empty array for customer with no loyalty record', async () => {
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await getAvailableRewards(supabase, customerId);
      expect(result).toEqual([]);
    });
  });

  describe('markExpiredRewards', () => {
    it('should mark old pending rewards as expired', async () => {
      const updateSpy = vi.spyOn(supabase.from('loyalty_redemptions'), 'update').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'redemption-1' }, { id: 'redemption-2' }],
              error: null,
            }),
          }),
        }),
      } as never);

      const count = await markExpiredRewards(supabase);

      expect(count).toBe(2);
      expect(updateSpy).toHaveBeenCalledWith({ status: 'expired' });
    });

    it('should not mark anything as expired when expiration is disabled', async () => {
      const { getLoyaltySettings } = await import('@/lib/admin/loyalty-settings');
      vi.mocked(getLoyaltySettings).mockResolvedValueOnce({
        program: { is_enabled: true, punch_threshold: 9 },
        earning_rules: { qualifying_services: [], minimum_spend: 50, first_visit_bonus: 2 },
        redemption_rules: {
          eligible_services: ['service-1'],
          expiration_days: 0, // Disabled
          max_value: 75,
        },
        referral: { is_enabled: true, referrer_bonus_punches: 3, referee_bonus_punches: 2 },
      });

      const count = await markExpiredRewards(supabase);
      expect(count).toBe(0);
    });
  });
});
