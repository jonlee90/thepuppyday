/**
 * Loyalty Settings Utilities
 * Provides cached access to loyalty program settings for punch card operations
 * Task 0201: Loyalty system integration
 *
 * FIXED: Changed from fetch-based to direct Supabase queries for server-side compatibility
 */

import type {
  LoyaltyEarningRules,
  LoyaltyRedemptionRules,
  ReferralProgram
} from '@/types/settings';

/**
 * Program-wide loyalty settings
 */
export interface LoyaltyProgramSettings {
  is_enabled: boolean;
  punch_threshold: number; // Number of punches to earn free service
}

/**
 * Complete loyalty settings bundle
 */
export interface AllLoyaltySettings {
  program: LoyaltyProgramSettings;
  earning_rules: LoyaltyEarningRules;
  redemption_rules: LoyaltyRedemptionRules;
  referral: ReferralProgram;
}

// Simple in-memory cache
let cachedSettings: AllLoyaltySettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 300000; // 5 minutes (loyalty settings change infrequently)

/**
 * Default settings used when database has no values
 */
const DEFAULT_SETTINGS: AllLoyaltySettings = {
  program: {
    is_enabled: true,
    punch_threshold: 9,
  },
  earning_rules: {
    qualifying_services: [], // Empty = all services qualify
    minimum_spend: 0, // No minimum spend
    first_visit_bonus: 0, // No first visit bonus
  },
  redemption_rules: {
    eligible_services: [], // Will be populated with all active services
    expiration_days: 0, // Rewards never expire
    max_value: null, // No value cap
  },
  referral: {
    is_enabled: false,
    referrer_bonus_punches: 1,
    referee_bonus_punches: 0,
  },
};

/**
 * Fetch all loyalty settings from database with caching
 *
 * Returns bundled loyalty settings including:
 * - Program status and thresholds
 * - Earning rules (qualifying services, minimum spend, bonuses)
 * - Redemption rules (eligible services, expiration, caps)
 * - Referral program settings
 *
 * @param supabase - Supabase client instance (server or client)
 * @returns Promise resolving to complete loyalty settings
 * @throws Error if settings cannot be fetched
 *
 * @example
 * const supabase = await createServerSupabaseClient();
 * const settings = await getLoyaltySettings(supabase);
 * if (settings.program.is_enabled) {
 *   const threshold = settings.program.punch_threshold;
 *   const qualifyingServices = settings.earning_rules.qualifying_services;
 * }
 */
export async function getLoyaltySettings(supabase: any): Promise<AllLoyaltySettings> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[Loyalty Settings] Returning cached settings');
    return cachedSettings;
  }

  console.log('[Loyalty Settings] Fetching fresh settings from database');

  try {
    // Fetch all loyalty settings from database in parallel
    const [programResult, earningResult, redemptionResult, referralResult] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'loyalty_program').single(),
      supabase.from('settings').select('value').eq('key', 'loyalty_earning_rules').single(),
      supabase.from('settings').select('value').eq('key', 'loyalty_redemption_rules').single(),
      supabase.from('settings').select('value').eq('key', 'loyalty_referral').single(),
    ]);

    // Extract values or use defaults
    const program: LoyaltyProgramSettings = programResult.data?.value || DEFAULT_SETTINGS.program;
    const earning_rules: LoyaltyEarningRules = earningResult.data?.value || DEFAULT_SETTINGS.earning_rules;
    const redemption_rules: LoyaltyRedemptionRules = redemptionResult.data?.value || DEFAULT_SETTINGS.redemption_rules;
    const referral: ReferralProgram = referralResult.data?.value || DEFAULT_SETTINGS.referral;

    // If redemption eligible_services is empty, populate with all active services
    if (redemption_rules.eligible_services.length === 0) {
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('is_active', true);

      if (services && services.length > 0) {
        redemption_rules.eligible_services = services.map((s: any) => s.id);
      }
    }

    // Bundle settings
    const settings: AllLoyaltySettings = {
      program,
      earning_rules,
      redemption_rules,
      referral,
    };

    // Update cache
    cachedSettings = settings;
    cacheTimestamp = now;

    console.log('[Loyalty Settings] Settings cached successfully');
    return settings;
  } catch (error) {
    console.error('[Loyalty Settings] Error fetching settings:', error);

    // If cache exists, return stale cache rather than failing
    if (cachedSettings) {
      console.warn('[Loyalty Settings] Returning stale cache due to error');
      return cachedSettings;
    }

    // Last resort: return defaults
    console.warn('[Loyalty Settings] Returning default settings');
    return DEFAULT_SETTINGS;
  }
}

/**
 * Clear settings cache (call after updating settings)
 *
 * Forces next getLoyaltySettings() call to fetch fresh data from API
 *
 * @example
 * // After updating loyalty settings
 * await updateLoyaltySettings(newSettings);
 * clearLoyaltySettingsCache();
 */
export function clearLoyaltySettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
  console.log('[Loyalty Settings] Cache cleared');
}

/**
 * Check if a service qualifies for earning loyalty punches
 *
 * @param serviceId - UUID of the service
 * @param qualifyingServices - Array of qualifying service IDs (empty array = all qualify)
 * @returns true if service qualifies for punch earning
 *
 * @example
 * const qualifies = doesServiceQualify(
 *   serviceId,
 *   settings.earning_rules.qualifying_services
 * );
 */
export function doesServiceQualify(
  serviceId: string,
  qualifyingServices: string[]
): boolean {
  // Empty array means all services qualify
  if (qualifyingServices.length === 0) {
    return true;
  }

  return qualifyingServices.includes(serviceId);
}

/**
 * Check if appointment total meets minimum spend threshold
 *
 * @param total - Appointment total amount
 * @param minimumSpend - Minimum spend threshold (0 = no minimum)
 * @returns true if total meets or exceeds minimum
 *
 * @example
 * const meetsMinimum = meetsMinimumSpend(75.00, settings.earning_rules.minimum_spend);
 */
export function meetsMinimumSpend(total: number, minimumSpend: number): boolean {
  // 0 minimum means no threshold
  if (minimumSpend === 0) {
    return true;
  }

  return total >= minimumSpend;
}

/**
 * Check if a service is eligible for loyalty redemption
 *
 * @param serviceId - UUID of the service
 * @param eligibleServices - Array of eligible service IDs
 * @returns true if service can be redeemed with loyalty reward
 *
 * @example
 * const canRedeem = isServiceEligibleForRedemption(
 *   serviceId,
 *   settings.redemption_rules.eligible_services
 * );
 */
export function isServiceEligibleForRedemption(
  serviceId: string,
  eligibleServices: string[]
): boolean {
  return eligibleServices.includes(serviceId);
}

/**
 * Check if a reward has expired based on earning date and expiration rules
 *
 * @param earnedAt - Date when reward was earned (ISO string)
 * @param expirationDays - Days until expiration (0 = never expires)
 * @returns true if reward has expired
 *
 * @example
 * const expired = isRewardExpired(
 *   redemption.created_at,
 *   settings.redemption_rules.expiration_days
 * );
 */
export function isRewardExpired(earnedAt: string, expirationDays: number): boolean {
  // 0 means rewards never expire
  if (expirationDays === 0) {
    return false;
  }

  const earnedDate = new Date(earnedAt);
  const expirationDate = new Date(earnedDate);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  return new Date() > expirationDate;
}

/**
 * Calculate maximum redeemable value based on service price and max value cap
 *
 * @param servicePrice - Base price of service
 * @param maxValue - Maximum redemption value (null = no limit)
 * @returns Effective redemption value (capped if necessary)
 *
 * @example
 * const redemptionValue = calculateRedemptionValue(
 *   85.00,
 *   settings.redemption_rules.max_value
 * );
 * // If max_value is 75, returns 75
 * // If max_value is null, returns 85
 */
export function calculateRedemptionValue(
  servicePrice: number,
  maxValue: number | null
): number {
  if (maxValue === null) {
    return servicePrice; // No cap
  }

  return Math.min(servicePrice, maxValue);
}
