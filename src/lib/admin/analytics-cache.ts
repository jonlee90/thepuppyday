/**
 * Analytics Caching Layer
 * Task 0056: 15-minute cache for analytics queries
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type CacheKey = 'kpis' | 'appointments-trend' | 'revenue' | 'services' | 'customers' | 'operations';

interface CacheEntry {
  cache_key: string;
  data: any;
  created_at: string;
  expires_at: string;
}

/**
 * Get cached analytics data
 * Returns cached data if not expired, null otherwise
 */
export async function getCachedAnalytics(
  supabase: AppSupabaseClient,
  cacheKey: CacheKey,
  dateRange: { start: Date; end: Date }
): Promise<any | null> {
  try {
    const fullKey = buildCacheKey(cacheKey, dateRange);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('analytics_cache')
      .select('*')
      .eq('cache_key', fullKey)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Cache expired, delete it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('analytics_cache')
        .delete()
        .eq('cache_key', fullKey);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error('[Analytics Cache] Error getting cached data:', error);
    return null;
  }
}

/**
 * Set cached analytics data
 */
export async function setCachedAnalytics(
  supabase: AppSupabaseClient,
  cacheKey: CacheKey,
  dateRange: { start: Date; end: Date },
  data: any
): Promise<void> {
  try {
    const fullKey = buildCacheKey(cacheKey, dateRange);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    const cacheEntry: Partial<CacheEntry> = {
      cache_key: fullKey,
      data,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    // Upsert (insert or update)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('analytics_cache')
      .upsert(cacheEntry, {
        onConflict: 'cache_key',
      });

    if (error) {
      console.error('[Analytics Cache] Error setting cache:', error);
    }
  } catch (error) {
    console.error('[Analytics Cache] Error in setCachedAnalytics:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(supabase: AppSupabaseClient): Promise<number> {
  try {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('analytics_cache')
      .delete()
      .lt('expires_at', now)
      .select();

    if (error) {
      console.error('[Analytics Cache] Error clearing expired cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[Analytics Cache] Error in clearExpiredCache:', error);
    return 0;
  }
}

/**
 * Clear all cache for a specific date range
 */
export async function clearCacheForDateRange(
  supabase: AppSupabaseClient,
  dateRange: { start: Date; end: Date }
): Promise<void> {
  try {
    const pattern = `%${formatDateRange(dateRange)}%`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('analytics_cache')
      .delete()
      .like('cache_key', pattern);

    if (error) {
      console.error('[Analytics Cache] Error clearing cache for date range:', error);
    }
  } catch (error) {
    console.error('[Analytics Cache] Error in clearCacheForDateRange:', error);
  }
}

/**
 * Build cache key from parameters
 */
function buildCacheKey(cacheKey: CacheKey, dateRange: { start: Date; end: Date }): string {
  return `${cacheKey}:${formatDateRange(dateRange)}`;
}

/**
 * Format date range for cache key
 */
function formatDateRange(dateRange: { start: Date; end: Date }): string {
  const start = dateRange.start.toISOString().split('T')[0];
  const end = dateRange.end.toISOString().split('T')[0];
  return `${start}_${end}`;
}

/**
 * Get or compute analytics data with caching
 */
export async function getOrComputeAnalytics<T>(
  supabase: AppSupabaseClient,
  cacheKey: CacheKey,
  dateRange: { start: Date; end: Date },
  computeFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = await getCachedAnalytics(supabase, cacheKey, dateRange);
  if (cached !== null) {
    console.log(`[Analytics Cache] Cache hit for ${cacheKey}`);
    return cached as T;
  }

  // Cache miss - compute data
  console.log(`[Analytics Cache] Cache miss for ${cacheKey} - computing...`);
  const data = await computeFn();

  // Store in cache
  await setCachedAnalytics(supabase, cacheKey, dateRange, data);

  return data;
}
