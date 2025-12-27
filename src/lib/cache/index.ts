/**
 * Caching Layer
 * Tasks 0229-0230: Implement caching layer for static and semi-static data
 *
 * In-memory cache with TTL support
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class InMemoryCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache instance
const globalCache = new InMemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  BREEDS: 24 * 60 * 60 * 1000, // 24 hours
  SERVICES: 60 * 60 * 1000, // 1 hour
  SERVICE_PRICES: 60 * 60 * 1000, // 1 hour
  ADDONS: 60 * 60 * 1000, // 1 hour
  BANNERS: 15 * 60 * 1000, // 15 minutes
  GALLERY: 30 * 60 * 1000, // 30 minutes
  SETTINGS: 15 * 60 * 1000, // 15 minutes
  BUSINESS_HOURS: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Get or fetch with caching
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.SERVICES
): Promise<T> {
  // Try to get from cache first
  const cached = globalCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  globalCache.set(key, data, ttl);

  return data;
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string): number {
  if (keyOrPattern.includes('*')) {
    // Pattern matching
    const pattern = keyOrPattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    let invalidated = 0;

    for (const key of Array.from((globalCache as any).cache.keys())) {
      if (regex.test(key)) {
        globalCache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  } else {
    // Exact key
    return globalCache.delete(keyOrPattern) ? 1 : 0;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: globalCache.size(),
    entries: Array.from((globalCache as any).cache.keys()),
  };
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = globalCache.cleanup();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }, 5 * 60 * 1000);
}

export default globalCache;
