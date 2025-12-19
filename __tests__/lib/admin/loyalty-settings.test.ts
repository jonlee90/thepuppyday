/**
 * Tests for Loyalty Settings Utilities
 * Task 0201: Loyalty system integration
 * FIXED: Updated to use Supabase mocks instead of fetch
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getLoyaltySettings,
  clearLoyaltySettingsCache,
  doesServiceQualify,
  meetsMinimumSpend,
  isServiceEligibleForRedemption,
  isRewardExpired,
  calculateRedemptionValue,
} from '@/lib/admin/loyalty-settings';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

describe('Loyalty Settings Utilities', () => {
  const mockSettings = {
    program: {
      is_enabled: true,
      punch_threshold: 9,
    },
    earning_rules: {
      qualifying_services: ['service-1', 'service-2'],
      minimum_spend: 50,
      first_visit_bonus: 2,
    },
    redemption_rules: {
      eligible_services: ['service-1', 'service-2', 'service-3'],
      expiration_days: 90,
      max_value: 75,
    },
    referral: {
      is_enabled: true,
      referrer_bonus_punches: 3,
      referee_bonus_punches: 2,
    },
  };

  beforeEach(() => {
    clearLoyaltySettingsCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearLoyaltySettingsCache();
  });

  describe('getLoyaltySettings', () => {
    it('should fetch and bundle all loyalty settings', async () => {
      // Mock Supabase responses
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSingle
        .mockResolvedValueOnce({ data: { value: mockSettings.program }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.earning_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.redemption_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.referral }, error: null });

      const settings = await getLoyaltySettings(mockSupabase as any);

      expect(settings.program).toEqual(mockSettings.program);
      expect(settings.earning_rules).toEqual(mockSettings.earning_rules);
      expect(settings.redemption_rules).toEqual(mockSettings.redemption_rules);
      expect(settings.referral).toEqual(mockSettings.referral);
    });

    it('should cache settings for 5 minutes', async () => {
      // Mock Supabase responses
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSingle
        .mockResolvedValueOnce({ data: { value: mockSettings.program }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.earning_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.redemption_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.referral }, error: null });

      // First call
      await getLoyaltySettings(mockSupabase as any);
      expect(mockSingle).toHaveBeenCalledTimes(4);

      vi.clearAllMocks();

      // Second call (should use cache)
      await getLoyaltySettings(mockSupabase as any);
      expect(mockSingle).not.toHaveBeenCalled();
    });

    it('should return default settings on error', async () => {
      // Mock Supabase error
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockRejectedValue(new Error('Database error'));

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const settings = await getLoyaltySettings(mockSupabase as any);

      // Should return default settings instead of throwing
      expect(settings.program.is_enabled).toBe(true);
      expect(settings.program.punch_threshold).toBe(9);
    });
  });

  describe('clearLoyaltySettingsCache', () => {
    it('should force fresh fetch after cache clear', async () => {
      // Mock Supabase responses
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn();

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSingle
        .mockResolvedValueOnce({ data: { value: mockSettings.program }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.earning_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.redemption_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.referral }, error: null });

      // First call
      await getLoyaltySettings(mockSupabase as any);
      expect(mockSingle).toHaveBeenCalledTimes(4);

      vi.clearAllMocks();

      // Clear cache
      clearLoyaltySettingsCache();

      mockSingle
        .mockResolvedValueOnce({ data: { value: mockSettings.program }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.earning_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.redemption_rules }, error: null })
        .mockResolvedValueOnce({ data: { value: mockSettings.referral }, error: null });

      // Second call (should fetch again)
      await getLoyaltySettings(mockSupabase as any);
      expect(mockSingle).toHaveBeenCalledTimes(4);
    });
  });

  describe('doesServiceQualify', () => {
    it('should return true when qualifying_services is empty (all qualify)', () => {
      const result = doesServiceQualify('any-service', []);
      expect(result).toBe(true);
    });

    it('should return true when service is in qualifying list', () => {
      const result = doesServiceQualify('service-1', ['service-1', 'service-2']);
      expect(result).toBe(true);
    });

    it('should return false when service is not in qualifying list', () => {
      const result = doesServiceQualify('service-3', ['service-1', 'service-2']);
      expect(result).toBe(false);
    });
  });

  describe('meetsMinimumSpend', () => {
    it('should return true when minimum is 0 (no minimum)', () => {
      const result = meetsMinimumSpend(10, 0);
      expect(result).toBe(true);
    });

    it('should return true when total equals minimum', () => {
      const result = meetsMinimumSpend(50, 50);
      expect(result).toBe(true);
    });

    it('should return true when total exceeds minimum', () => {
      const result = meetsMinimumSpend(75, 50);
      expect(result).toBe(true);
    });

    it('should return false when total is below minimum', () => {
      const result = meetsMinimumSpend(40, 50);
      expect(result).toBe(false);
    });
  });

  describe('isServiceEligibleForRedemption', () => {
    it('should return true when service is in eligible list', () => {
      const result = isServiceEligibleForRedemption('service-1', ['service-1', 'service-2']);
      expect(result).toBe(true);
    });

    it('should return false when service is not in eligible list', () => {
      const result = isServiceEligibleForRedemption('service-3', ['service-1', 'service-2']);
      expect(result).toBe(false);
    });
  });

  describe('isRewardExpired', () => {
    it('should return false when expiration_days is 0 (never expires)', () => {
      const result = isRewardExpired(new Date().toISOString(), 0);
      expect(result).toBe(false);
    });

    it('should return false for recent reward within expiration window', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago
      const result = isRewardExpired(recentDate.toISOString(), 90);
      expect(result).toBe(false);
    });

    it('should return true for old reward beyond expiration window', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
      const result = isRewardExpired(oldDate.toISOString(), 90);
      expect(result).toBe(true);
    });

    it('should handle edge case of exact expiration date', () => {
      const exactDate = new Date();
      exactDate.setDate(exactDate.getDate() - 90); // Exactly 90 days ago
      exactDate.setHours(exactDate.getHours() - 1); // Make it slightly past expiration
      const result = isRewardExpired(exactDate.toISOString(), 90);
      expect(result).toBe(true);
    });
  });

  describe('calculateRedemptionValue', () => {
    it('should return full service price when max_value is null', () => {
      const result = calculateRedemptionValue(125, null);
      expect(result).toBe(125);
    });

    it('should return service price when below max_value', () => {
      const result = calculateRedemptionValue(50, 75);
      expect(result).toBe(50);
    });

    it('should return max_value when service price exceeds it', () => {
      const result = calculateRedemptionValue(100, 75);
      expect(result).toBe(75);
    });

    it('should return service price when equal to max_value', () => {
      const result = calculateRedemptionValue(75, 75);
      expect(result).toBe(75);
    });
  });
});
