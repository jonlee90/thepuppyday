/**
 * Tests for Loyalty Punch Awarding Logic
 * Task 0201: Loyalty system integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  awardPunchForAppointment,
  isFirstVisitCustomer,
  getCustomerLoyaltyStatus,
} from '@/lib/loyalty/punch-awarding';
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
      qualifying_services: [], // Empty = all qualify
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
  doesServiceQualify: vi.fn((serviceId: string, qualifyingServices: string[]) => {
    return qualifyingServices.length === 0 || qualifyingServices.includes(serviceId);
  }),
  meetsMinimumSpend: vi.fn((total: number, minimumSpend: number) => {
    return minimumSpend === 0 || total >= minimumSpend;
  }),
}));

describe('Loyalty Punch Awarding', () => {
  let supabase: MockSupabaseClient;
  const customerId = 'customer-123';
  const appointmentId = 'appointment-456';
  const serviceId = 'service-789';

  beforeEach(() => {
    supabase = createMockClient();
    vi.clearAllMocks();
  });

  describe('awardPunchForAppointment', () => {
    it('should award 1 punch for returning customer meeting minimum spend', async () => {
      // Setup existing loyalty record
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        current_punches: 5,
        threshold_override: null,
        total_visits: 5,
        free_washes_earned: 0,
        free_washes_redeemed: 0,
      };

      // Mock Supabase responses
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_punches'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      const result = await awardPunchForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        75.0
      );

      expect(result.success).toBe(true);
      expect(result.punchesAwarded).toBe(1);
      expect(result.currentPunches).toBe(6);
      expect(result.rewardEarned).toBe(false);
    });

    it('should award 1 + bonus punches for first-time customer', async () => {
      // Mock no existing loyalty record (first visit)
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found
          }),
        }),
      } as never);

      // Mock creating new loyalty record
      vi.spyOn(supabase.from('customer_loyalty'), 'insert').mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'loyalty-new',
              customer_id: customerId,
              current_punches: 0,
              total_visits: 0,
              free_washes_earned: 0,
              free_washes_redeemed: 0,
            },
            error: null,
          }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_punches'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      const result = await awardPunchForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        75.0
      );

      expect(result.success).toBe(true);
      expect(result.punchesAwarded).toBe(3); // 1 base + 2 bonus
      expect(result.currentPunches).toBe(3);
    });

    it('should create pending redemption when threshold is reached', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        current_punches: 8, // One away from threshold of 9
        threshold_override: null,
        total_visits: 8,
        free_washes_earned: 0,
        free_washes_redeemed: 0,
      };

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_punches'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      const result = await awardPunchForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        75.0
      );

      expect(result.success).toBe(true);
      expect(result.punchesAwarded).toBe(1);
      expect(result.currentPunches).toBe(0); // Reset to 0
      expect(result.rewardEarned).toBe(true);
    });

    it('should not award punch if minimum spend not met', async () => {
      const result = await awardPunchForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        30.0 // Below $50 minimum
      );

      expect(result.success).toBe(false);
      expect(result.punchesAwarded).toBe(0);
      expect(result.message).toContain('Minimum spend');
    });

    it('should respect custom threshold override', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        current_punches: 4,
        threshold_override: 5, // VIP customer with lower threshold
        total_visits: 4,
        free_washes_earned: 0,
        free_washes_redeemed: 0,
      };

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_punches'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      vi.spyOn(supabase.from('customer_loyalty'), 'update').mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'insert').mockResolvedValue({
        data: null,
        error: null,
      } as never);

      const result = await awardPunchForAppointment(
        supabase,
        customerId,
        appointmentId,
        serviceId,
        75.0
      );

      expect(result.success).toBe(true);
      expect(result.threshold).toBe(5); // Uses custom threshold
      expect(result.rewardEarned).toBe(true); // 4 + 1 = 5 reaches custom threshold
    });
  });

  describe('isFirstVisitCustomer', () => {
    it('should return true for customer with no loyalty record', async () => {
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await isFirstVisitCustomer(supabase, customerId);
      expect(result).toBe(true);
    });

    it('should return false for customer with existing loyalty record', async () => {
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'loyalty-1' },
            error: null,
          }),
        }),
      } as never);

      const result = await isFirstVisitCustomer(supabase, customerId);
      expect(result).toBe(false);
    });
  });

  describe('getCustomerLoyaltyStatus', () => {
    it('should return loyalty status for existing customer', async () => {
      const mockLoyalty = {
        id: 'loyalty-1',
        customer_id: customerId,
        current_punches: 6,
        threshold_override: null,
        total_visits: 10,
        free_washes_earned: 1,
        free_washes_redeemed: 0,
      };

      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockLoyalty, error: null }),
        }),
      } as never);

      vi.spyOn(supabase.from('loyalty_redemptions'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      } as never);

      const result = await getCustomerLoyaltyStatus(supabase, customerId);

      expect(result).toEqual({
        current_punches: 6,
        threshold: 9,
        free_washes_available: 2,
        total_visits: 10,
      });
    });

    it('should return null for customer with no loyalty record', async () => {
      vi.spyOn(supabase.from('customer_loyalty'), 'select').mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      } as never);

      const result = await getCustomerLoyaltyStatus(supabase, customerId);
      expect(result).toBeNull();
    });
  });
});
