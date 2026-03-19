/**
 * Caching Layer
 * Tasks 0229-0230: Implement caching layer for static and semi-static data
 *
 * In-memory cache with TTL support and max size limit
 */

const MAX_ENTRIES = 100;

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
   * Set value in cache with TTL. Evicts oldest-expiring entry when full.
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    // Evict if at capacity and this is a new key
    if (this.cache.size >= MAX_ENTRIES && !this.cache.has(key)) {
      this.evictOldest();
    }

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

  /**
   * Evict the entry closest to expiry (oldest-expiring)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < oldestExpiry) {
        oldestExpiry = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Global cache instance
const globalCache = new InMemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  BREEDS: 30 * 60 * 1000, // 30 minutes
  SERVICES: 15 * 60 * 1000, // 15 minutes
  SERVICE_PRICES: 15 * 60 * 1000, // 15 minutes
  ADDONS: 15 * 60 * 1000, // 15 minutes
  BANNERS: 15 * 60 * 1000, // 15 minutes
  GALLERY: 30 * 60 * 1000, // 30 minutes
  SETTINGS: 15 * 60 * 1000, // 15 minutes
  BUSINESS_HOURS: 15 * 60 * 1000, // 15 minutes
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

// Clean up expired entries every 2 minutes (guarded to prevent timer stacking)
if (typeof setInterval !== 'undefined' && !(globalThis as any).__cacheCleanup) {
  (globalThis as any).__cacheCleanup = setInterval(() => {
    const cleaned = globalCache.cleanup();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  }, 2 * 60 * 1000);
}

export default globalCache;
