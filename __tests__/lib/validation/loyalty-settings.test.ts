/**
 * Tests for Loyalty Settings Validation Schemas
 * Task 0216: Unit Tests for Validation Logic
 */

import { describe, it, expect } from 'vitest';
import {
  LoyaltyEarningRulesSchema,
  LoyaltyRedemptionRulesSchema,
  ReferralProgramSchema,
  type LoyaltyEarningRules,
  type LoyaltyRedemptionRules,
  type ReferralProgram,
} from '@/types/settings';

describe('LoyaltyEarningRules Validation', () => {
  describe('Valid earning rules', () => {
    it('should accept valid earning rules', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: ['service-1', 'service-2'],
        minimum_spend: 50,
        first_visit_bonus: 2,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept all services (empty array)', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 1,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept zero minimum spend', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept high minimum spend', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [],
        minimum_spend: 1000,
        first_visit_bonus: 5,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept max first_visit_bonus (10)', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 10,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });
  });

  describe('Minimum spend validation', () => {
    it('should accept minimum_spend 0-1000 range', () => {
      const validSpends = [0, 10, 50, 100, 500, 1000];

      validSpends.forEach((spend) => {
        const earningRules: LoyaltyEarningRules = {
          qualifying_services: [],
          minimum_spend: spend,
          first_visit_bonus: 0,
        };

        const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative minimum_spend', () => {
      const earningRules = {
        qualifying_services: [],
        minimum_spend: -1,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(false);
    });
  });

  describe('First visit bonus validation', () => {
    it('should accept first_visit_bonus 0-10', () => {
      const validBonuses = [0, 1, 5, 10];

      validBonuses.forEach((bonus) => {
        const earningRules: LoyaltyEarningRules = {
          qualifying_services: [],
          minimum_spend: 0,
          first_visit_bonus: bonus,
        };

        const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative first_visit_bonus', () => {
      const earningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: -1,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(false);
    });

    it('should reject first_visit_bonus > 10', () => {
      const earningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 11,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer first_visit_bonus', () => {
      const earningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 2.5,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(false);
    });
  });

  describe('Qualifying services validation', () => {
    it('should accept multiple qualifying services', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [
          'service-1',
          'service-2',
          'service-3',
        ],
        minimum_spend: 0,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept single qualifying service', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: ['service-1'],
        minimum_spend: 0,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should accept empty array for all services', () => {
      const earningRules: LoyaltyEarningRules = {
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(true);
    });

    it('should require array type for qualifying_services', () => {
      const earningRules = {
        qualifying_services: 'all',
        minimum_spend: 0,
        first_visit_bonus: 0,
      };

      const result = LoyaltyEarningRulesSchema.safeParse(earningRules);
      expect(result.success).toBe(false);
    });
  });
});

describe('LoyaltyRedemptionRules Validation', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  describe('Valid redemption rules', () => {
    it('should accept valid redemption rules', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365,
        max_value: 100,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should accept null max_value (unlimited)', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should accept zero max_value', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365,
        max_value: 0,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should accept no expiration (0 days)', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 0,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should accept max expiration (3650 days ~10 years)', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 3650,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });
  });

  describe('Eligible services validation', () => {
    it('should accept valid UUIDs in eligible_services', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174000',
        ],
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should reject empty eligible_services array', () => {
      const redemptionRules = {
        eligible_services: [],
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const redemptionRules = {
        eligible_services: ['not-a-valid-uuid'],
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });

    it('should require array for eligible_services', () => {
      const redemptionRules = {
        eligible_services: validUUID,
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });
  });

  describe('Expiration days validation', () => {
    it('should accept 0-3650 days', () => {
      const validExpirations = [0, 30, 90, 365, 730, 3650];

      validExpirations.forEach((days) => {
        const redemptionRules: LoyaltyRedemptionRules = {
          eligible_services: [validUUID],
          expiration_days: days,
          max_value: null,
        };

        const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative expiration_days', () => {
      const redemptionRules = {
        eligible_services: [validUUID],
        expiration_days: -1,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });

    it('should reject expiration_days > 3650', () => {
      const redemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 3651,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer expiration_days', () => {
      const redemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365.5,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });
  });

  describe('Max value validation', () => {
    it('should accept positive max_value amounts', () => {
      const validMaxValues = [0, 10, 50, 100, 1000];

      validMaxValues.forEach((maxValue) => {
        const redemptionRules: LoyaltyRedemptionRules = {
          eligible_services: [validUUID],
          expiration_days: 365,
          max_value: maxValue,
        };

        const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
        expect(result.success).toBe(true);
      });
    });

    it('should accept null max_value', () => {
      const redemptionRules: LoyaltyRedemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365,
        max_value: null,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(true);
    });

    it('should reject negative max_value', () => {
      const redemptionRules = {
        eligible_services: [validUUID],
        expiration_days: 365,
        max_value: -1,
      };

      const result = LoyaltyRedemptionRulesSchema.safeParse(redemptionRules);
      expect(result.success).toBe(false);
    });
  });
});

describe('ReferralProgram Validation', () => {
  describe('Valid referral program', () => {
    it('should accept valid referral program when enabled', () => {
      const referralProgram: ReferralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 5,
        referee_bonus_punches: 2,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(true);
    });

    it('should accept valid referral program when disabled', () => {
      const referralProgram: ReferralProgram = {
        is_enabled: false,
        referrer_bonus_punches: 0,
        referee_bonus_punches: 0,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(true);
    });

    it('should accept zero bonuses when disabled', () => {
      const referralProgram: ReferralProgram = {
        is_enabled: false,
        referrer_bonus_punches: 0,
        referee_bonus_punches: 0,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(true);
    });

    it('should accept max bonuses (10 each)', () => {
      const referralProgram: ReferralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 10,
        referee_bonus_punches: 10,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(true);
    });
  });

  describe('Referrer bonus validation', () => {
    it('should accept 0-10 referrer_bonus_punches', () => {
      const validBonuses = [0, 1, 5, 10];

      validBonuses.forEach((bonus) => {
        const referralProgram: ReferralProgram = {
          is_enabled: true,
          referrer_bonus_punches: bonus,
          referee_bonus_punches: 0,
        };

        const result = ReferralProgramSchema.safeParse(referralProgram);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative referrer_bonus_punches', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: -1,
        referee_bonus_punches: 0,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });

    it('should reject referrer_bonus_punches > 10', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 11,
        referee_bonus_punches: 0,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer referrer_bonus_punches', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 5.5,
        referee_bonus_punches: 0,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });
  });

  describe('Referee bonus validation', () => {
    it('should accept 0-10 referee_bonus_punches', () => {
      const validBonuses = [0, 1, 5, 10];

      validBonuses.forEach((bonus) => {
        const referralProgram: ReferralProgram = {
          is_enabled: true,
          referrer_bonus_punches: 0,
          referee_bonus_punches: bonus,
        };

        const result = ReferralProgramSchema.safeParse(referralProgram);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative referee_bonus_punches', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 0,
        referee_bonus_punches: -1,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });

    it('should reject referee_bonus_punches > 10', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 0,
        referee_bonus_punches: 11,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer referee_bonus_punches', () => {
      const referralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 0,
        referee_bonus_punches: 2.5,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });
  });

  describe('Enable/disable validation', () => {
    it('should accept boolean is_enabled', () => {
      [true, false].forEach((enabled) => {
        const referralProgram: ReferralProgram = {
          is_enabled: enabled,
          referrer_bonus_punches: 1,
          referee_bonus_punches: 1,
        };

        const result = ReferralProgramSchema.safeParse(referralProgram);
        expect(result.success).toBe(true);
      });
    });

    it('should reject non-boolean is_enabled', () => {
      const referralProgram = {
        is_enabled: 'yes',
        referrer_bonus_punches: 1,
        referee_bonus_punches: 1,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should accept boundary values', () => {
      const referralProgram: ReferralProgram = {
        is_enabled: true,
        referrer_bonus_punches: 10,
        referee_bonus_punches: 10,
      };

      const result = ReferralProgramSchema.safeParse(referralProgram);
      expect(result.success).toBe(true);
    });

    it('should reject just outside boundaries', () => {
      const testCases = [
        {
          is_enabled: true,
          referrer_bonus_punches: 11,
          referee_bonus_punches: 5,
        },
        {
          is_enabled: true,
          referrer_bonus_punches: 5,
          referee_bonus_punches: 11,
        },
      ];

      testCases.forEach((program) => {
        const result = ReferralProgramSchema.safeParse(program);
        expect(result.success).toBe(false);
      });
    });
  });
});
