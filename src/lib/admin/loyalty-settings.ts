/**
 * Loyalty Settings Utilities
 * Provides cached access to loyalty program settings for punch card operations
 * Task 0201: Loyalty system integration
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
 * Fetch all loyalty settings from API with caching
 *
 * Returns bundled loyalty settings including:
 * - Program status and thresholds
 * - Earning rules (qualifying services, minimum spend, bonuses)
 * - Redemption rules (eligible services, expiration, caps)
 * - Referral program settings
 *
 * @returns Promise resolving to complete loyalty settings
 * @throws Error if settings cannot be fetched
 *
 * @example
 * const settings = await getLoyaltySettings();
 * if (settings.program.is_enabled) {
 *   const threshold = settings.program.punch_threshold;
 *   const qualifyingServices = settings.earning_rules.qualifying_services;
 * }
 */
export async function getLoyaltySettings(): Promise<AllLoyaltySettings> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('[Loyalty Settings] Returning cached settings');
    return cachedSettings;
  }

  console.log('[Loyalty Settings] Fetching fresh settings from API');

  // Fetch all loyalty settings in parallel
  const [programRes, earningRes, redemptionRes, referralRes] = await Promise.all([
    fetch('/api/admin/settings/loyalty/program'),
    fetch('/api/admin/settings/loyalty/earning-rules'),
    fetch('/api/admin/settings/loyalty/redemption-rules'),
    fetch('/api/admin/settings/loyalty/referral'),
  ]);

  if (!programRes.ok || !earningRes.ok || !redemptionRes.ok || !referralRes.ok) {
    throw new Error('Failed to fetch loyalty settings');
  }

  const [programData, earningData, redemptionData, referralData] = await Promise.all([
    programRes.json(),
    earningRes.json(),
    redemptionRes.json(),
    referralRes.json(),
  ]);

  // Bundle settings
  const settings: AllLoyaltySettings = {
    program: programData.data,
    earning_rules: earningData.data,
    redemption_rules: redemptionData.data,
    referral: referralData.data,
  };

  // Update cache
  cachedSettings = settings;
  cacheTimestamp = now;

  console.log('[Loyalty Settings] Settings cached successfully');
  return settings;
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
