/**
 * Google Calendar API Quota Tracker
 * Tracks daily API usage to prevent quota exhaustion
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Daily quota limit for Google Calendar API
 * Free tier: 1,000,000 queries per day
 * Using a conservative limit to be safe
 */
const DAILY_QUOTA_LIMIT = 1000000;

/**
 * Quota warning threshold (95% of limit)
 */
const QUOTA_WARNING_THRESHOLD = 0.95;

/**
 * In-memory cache for quota count (performance optimization)
 */
let quotaCache: {
  date: string;
  count: number;
  lastUpdated: number;
} | null = null;

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Quota status information
 */
export interface QuotaStatus {
  current: number;
  limit: number;
  percentage: number;
  resetAt: string;
  timeUntilReset: string;
  isNearLimit: boolean;
}

/**
 * Track an API call - increment quota counter
 *
 * @param supabase - Supabase client
 *
 * @example
 * ```typescript
 * // Before making any Google Calendar API call
 * await trackApiCall(supabase);
 * ```
 */
export async function trackApiCall(supabase: SupabaseClient): Promise<void> {
  try {
    const today = getCurrentDate();

    // Use database function to increment quota atomically
    const { error } = await supabase.rpc('increment_quota', {
      target_date: today,
    });

    if (error) {
      // Log error but don't throw - quota tracking shouldn't break API calls
      console.error('[Quota Tracker] Failed to increment quota:', error);
      return;
    }

    // Update cache
    if (quotaCache && quotaCache.date === today) {
      quotaCache.count++;
      quotaCache.lastUpdated = Date.now();
    } else {
      // Invalidate cache if date changed
      quotaCache = null;
    }
  } catch (error) {
    console.error('[Quota Tracker] Error tracking API call:', error);
    // Don't throw - quota tracking shouldn't break API calls
  }
}

/**
 * Get current quota status
 *
 * @param supabase - Supabase client
 * @returns Current quota status with usage and reset information
 *
 * @example
 * ```typescript
 * const status = await getQuotaStatus(supabase);
 * console.log(`Usage: ${status.percentage}%, Time until reset: ${status.timeUntilReset}`);
 * ```
 */
export async function getQuotaStatus(
  supabase: SupabaseClient
): Promise<QuotaStatus> {
  try {
    const today = getCurrentDate();
    const now = Date.now();

    // Check cache first
    if (
      quotaCache &&
      quotaCache.date === today &&
      now - quotaCache.lastUpdated < CACHE_TTL
    ) {
      return buildQuotaStatus(quotaCache.count, today);
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('calendar_api_quota')
      .select('request_count')
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (quota not yet tracked today)
      throw new Error(`Failed to fetch quota: ${error.message}`);
    }

    const currentCount = data?.request_count || 0;

    // Update cache
    quotaCache = {
      date: today,
      count: currentCount,
      lastUpdated: now,
    };

    return buildQuotaStatus(currentCount, today);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get quota status: ${error.message}`);
    }
    throw new Error('Failed to get quota status: Unknown error');
  }
}

/**
 * Check if quota is exceeded (>95% of limit)
 *
 * @param supabase - Supabase client
 * @returns True if quota is near or at limit
 *
 * @example
 * ```typescript
 * if (await isQuotaExceeded(supabase)) {
 *   console.warn('API quota nearly exhausted!');
 *   // Pause non-critical sync operations
 * }
 * ```
 */
export async function isQuotaExceeded(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const status = await getQuotaStatus(supabase);
    return status.percentage >= QUOTA_WARNING_THRESHOLD * 100;
  } catch (error) {
    console.error('[Quota Tracker] Error checking quota limit:', error);
    // Return false on error to avoid blocking operations
    return false;
  }
}

/**
 * Get quota usage for multiple days (for analytics/reporting)
 *
 * @param supabase - Supabase client
 * @param days - Number of days to fetch (default: 7)
 * @returns Array of daily quota records
 *
 * @example
 * ```typescript
 * const history = await getQuotaHistory(supabase, 30);
 * console.log(`Average daily usage: ${history.reduce((sum, h) => sum + h.count, 0) / history.length}`);
 * ```
 */
export async function getQuotaHistory(
  supabase: SupabaseClient,
  days: number = 7
): Promise<Array<{ date: string; request_count: number }>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('calendar_api_quota')
      .select('date, request_count')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch quota history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get quota history: ${error.message}`);
    }
    throw new Error('Failed to get quota history: Unknown error');
  }
}

/**
 * Reset quota cache (useful for testing or manual refresh)
 *
 * @example
 * ```typescript
 * resetQuotaCache();
 * ```
 */
export function resetQuotaCache(): void {
  quotaCache = null;
  console.log('[Quota Tracker] Cache reset');
}

// ===========================
// Helper Functions
// ===========================

/**
 * Get current date in YYYY-MM-DD format
 *
 * @returns Date string
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get next reset time (midnight UTC)
 *
 * @param currentDate - Current date string (YYYY-MM-DD)
 * @returns ISO timestamp of next reset
 */
function getNextResetTime(currentDate: string): string {
  const nextDay = new Date(currentDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setUTCHours(0, 0, 0, 0);
  return nextDay.toISOString();
}

/**
 * Calculate time until next reset
 *
 * @param resetTime - ISO timestamp of reset time
 * @returns Human-readable time until reset
 */
function getTimeUntilReset(resetTime: string): string {
  const now = Date.now();
  const reset = new Date(resetTime).getTime();
  const msUntilReset = reset - now;

  if (msUntilReset <= 0) {
    return '0 minutes';
  }

  const hours = Math.floor(msUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Build quota status object
 *
 * @param currentCount - Current request count
 * @param date - Date string
 * @returns Quota status object
 */
function buildQuotaStatus(currentCount: number, date: string): QuotaStatus {
  const percentage = (currentCount / DAILY_QUOTA_LIMIT) * 100;
  const resetAt = getNextResetTime(date);
  const timeUntilReset = getTimeUntilReset(resetAt);
  const isNearLimit = percentage >= QUOTA_WARNING_THRESHOLD * 100;

  return {
    current: currentCount,
    limit: DAILY_QUOTA_LIMIT,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    resetAt,
    timeUntilReset,
    isNearLimit,
  };
}
