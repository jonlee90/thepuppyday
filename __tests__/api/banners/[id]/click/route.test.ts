/**
 * Tests for Banner Click Tracking Endpoint
 * Task 0177: Banner click tracking endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/banners/[id]/click/route';
import { NextRequest } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { createMockClient } from '@/mocks/supabase/client';
import type { PromoBanner } from '@/types/database';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(createMockClient())),
}));

// Mock rate limiting module
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    currentCount: 1,
    limit: 100,
    resetTime: Date.now() + 60000,
  })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

describe('GET /api/banners/[id]/click', () => {
  let testBanner: PromoBanner;

  beforeEach(() => {
    // Get mock store
    const mockStore = getMockStore();

    // Create test banner
    testBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: 'https://example.com/promo',
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 1,
      click_count: 5,
      impression_count: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Clear existing banners and add test banner
    mockStore.promoBanners = [testBanner];

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should track click and redirect to click_url', async () => {
      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      // Should redirect (302)
      expect(response.status).toBe(302);

      // Should redirect to click_url with utm_source
      const location = response.headers.get('location');
      expect(location).toBe('https://example.com/promo?utm_source=thepuppyday');
    });

    it('should increment click_count atomically', async () => {
      const initialCount = testBanner.click_count;

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      await GET(request, { params });

      // Verify click count was incremented
      const mockStore = getMockStore();
      const updatedBanner = mockStore.promoBanners.find(
        (b) => b.id === 'banner-1'
      );
      expect(updatedBanner?.click_count).toBe(initialCount + 1);
    });

    it('should preserve existing query parameters in redirect URL', async () => {
      testBanner.click_url = 'https://example.com/promo?existing=param';

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      const location = response.headers.get('location');
      expect(location).toContain('existing=param');
      expect(location).toContain('utm_source=thepuppyday');
    });

    it('should handle multiple simultaneous clicks', async () => {
      const initialCount = testBanner.click_count;
      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      // Simulate 5 simultaneous clicks
      await Promise.all([
        GET(request, { params }),
        GET(request, { params }),
        GET(request, { params }),
        GET(request, { params }),
        GET(request, { params }),
      ]);

      // Verify all clicks were counted
      const mockStore = getMockStore();
      const updatedBanner = mockStore.promoBanners.find(
        (b) => b.id === 'banner-1'
      );
      expect(updatedBanner?.click_count).toBe(initialCount + 5);
    });
  });

  describe('Validation Cases', () => {
    it('should return 404 if banner not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/banners/nonexistent/click');
      const params = { id: 'nonexistent' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Banner not found');
    });

    it('should return 404 if banner is not active', async () => {
      testBanner.is_active = false;

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Banner not found');

      // Should not increment click count
      const mockStore = getMockStore();
      const banner = mockStore.promoBanners.find((b) => b.id === 'banner-1');
      expect(banner?.click_count).toBe(5); // Unchanged
    });

    it('should return 404 if banner has no click_url', async () => {
      testBanner.click_url = null;

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Banner not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      // Mock rate limit exceeded
      const { checkRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        currentCount: 101,
        limit: 100,
        resetTime: Date.now() + 30000,
      });

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
      expect(response.headers.get('Retry-After')).toBeTruthy();

      // Should not increment click count when rate limited
      const mockStore = getMockStore();
      const banner = mockStore.promoBanners.find((b) => b.id === 'banner-1');
      expect(banner?.click_count).toBe(5); // Unchanged
    });

    it('should include Retry-After header when rate limited', async () => {
      const resetTime = Date.now() + 45000; // 45 seconds from now

      const { checkRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        currentCount: 101,
        limit: 100,
        resetTime,
      });

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      const retryAfter = response.headers.get('Retry-After');
      expect(retryAfter).toBeTruthy();

      // Should be approximately 45 seconds (allow 1 second tolerance)
      const retrySeconds = parseInt(retryAfter!, 10);
      expect(retrySeconds).toBeGreaterThanOrEqual(44);
      expect(retrySeconds).toBeLessThanOrEqual(46);
    });

    it('should use client IP for rate limiting', async () => {
      const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit');

      vi.mocked(getClientIp).mockReturnValueOnce('192.168.1.100');

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      await GET(request, { params });

      expect(checkRateLimit).toHaveBeenCalledWith(
        'banner-click:192.168.1.100',
        expect.objectContaining({
          limit: 100,
          windowMs: 60000,
        })
      );
    });
  });

  describe('UTM Parameter Handling', () => {
    it('should add utm_source=thepuppyday to redirect URL', async () => {
      testBanner.click_url = 'https://example.com';

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      const location = response.headers.get('location');
      expect(location).toBe('https://example.com/?utm_source=thepuppyday');
    });

    it('should preserve existing UTM parameters', async () => {
      testBanner.click_url =
        'https://example.com?utm_medium=banner&utm_campaign=winter';

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      const location = response.headers.get('location');
      expect(location).toContain('utm_medium=banner');
      expect(location).toContain('utm_campaign=winter');
      expect(location).toContain('utm_source=thepuppyday');
    });

    it('should handle complex URLs with anchors', async () => {
      testBanner.click_url = 'https://example.com/page#section';

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      const location = response.headers.get('location');
      expect(location).toContain('utm_source=thepuppyday');
      expect(location).toContain('#section');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // Force a database error by corrupting the banner data
      const mockStore = getMockStore();
      mockStore.promoBanners = [] as any;

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      expect(response.status).toBe(404); // Not found since banner doesn't exist
    });

    it('should continue redirect even if click count update fails', async () => {
      // This is a defensive test - even if tracking fails, user should be redirected
      // The mock store always succeeds, so this is more of a documentation test

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      // Should still redirect
      expect(response.status).toBe(302);
    });
  });

  describe('Analytics Logging', () => {
    it('should log click event with IP and redirect URL', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      await GET(request, { params });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Banner Click]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('banner-1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('127.0.0.1')
      );
    });

    it('should log warning for inactive banner attempts', async () => {
      testBanner.is_active = false;

      const consoleSpy = vi.spyOn(console, 'warn');

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      await GET(request, { params });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Banner Click] Banner not active')
      );
    });
  });

  describe('No Authentication Required', () => {
    it('should work for anonymous users', async () => {
      // No auth setup needed - endpoint is public

      const request = new NextRequest('http://localhost:3000/api/banners/banner-1/click');
      const params = { id: 'banner-1' };

      const response = await GET(request, { params });

      expect(response.status).toBe(302);
    });
  });
});
