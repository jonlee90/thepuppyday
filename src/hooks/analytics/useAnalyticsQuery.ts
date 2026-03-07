'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCacheKey(url: string): string {
  return url;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface UseAnalyticsQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnalyticsQuery<T>(
  endpoint: string,
  dateRange: { start: Date; end: Date },
  extraParams?: Record<string, string>
): UseAnalyticsQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      ...extraParams,
    });
    return `/api/admin/analytics/${endpoint}?${params}`;
  }, [endpoint, dateRange.start, dateRange.end, extraParams]);

  useEffect(() => {
    const url = buildUrl();
    const cacheKey = getCacheKey(url);

    // Check cache first
    const cached = getCached<T>(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch ${endpoint}`);
        }
        const result = await response.json();
        const responseData = result.data ?? result;
        setData(responseData);
        setCache(cacheKey, responseData);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [buildUrl, fetchCount]);

  const refetch = useCallback(() => {
    // Clear cache for this URL
    const url = buildUrl();
    cache.delete(getCacheKey(url));
    setFetchCount((c) => c + 1);
  }, [buildUrl]);

  return { data, isLoading, error, refetch };
}
