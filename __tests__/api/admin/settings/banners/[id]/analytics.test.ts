/**
 * Tests for Banner Analytics API
 * Task 0178: Banner analytics endpoint tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/settings/banners/[id]/analytics/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-banner-id',
              image_url: 'https://example.com/banner.jpg',
              alt_text: 'Test Banner',
              click_url: 'https://example.com',
              start_date: '2025-01-01',
              end_date: '2025-12-31',
              is_active: true,
              display_order: 0,
              click_count: 150,
              impression_count: 1500,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(() => Promise.resolve({ user: { id: 'admin-id' } })),
}));

describe('Banner Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/settings/banners/[id]/analytics', () => {
    it('should return analytics for a banner with default period', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('banner_id', 'test-banner-id');
      expect(data).toHaveProperty('total_clicks', 150);
      expect(data).toHaveProperty('total_impressions', 1500);
      expect(data).toHaveProperty('click_through_rate');
      expect(data).toHaveProperty('clicks_by_date');
      expect(data).toHaveProperty('period');
      expect(Array.isArray(data.clicks_by_date)).toBe(true);
    });

    it('should return analytics for 7 day period', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics?period=7d'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period.label).toBe('Last 7 days');
    });

    it('should return analytics for 90 day period', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics?period=90d'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period.label).toBe('Last 90 days');
    });

    it('should return analytics for custom date range', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics?period=custom&start=2025-01-01&end=2025-01-15'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period.start).toBe('2025-01-01');
      expect(data.period.end).toBe('2025-01-15');
    });

    it('should calculate CTR correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      // CTR = (150 clicks / 1500 impressions) * 100 = 10%
      expect(data.click_through_rate).toBe(10);
    });

    it('should include change percentage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/settings/banners/test-banner-id/analytics'
      );

      const context = {
        params: Promise.resolve({ id: 'test-banner-id' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('change_percent');
      expect(data).toHaveProperty('previous_period_clicks');
    });
  });
});
