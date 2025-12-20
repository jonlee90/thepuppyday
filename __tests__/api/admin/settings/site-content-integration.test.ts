/**
 * Integration Tests for Site Content API
 * Task 0218: Integration Tests for API Endpoints
 * Tests GET /api/admin/settings/site-content
 * Tests PUT /api/admin/settings/site-content
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/admin/settings/site-content/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type { HeroContent, SeoSettings, BusinessInfo } from '@/types/settings';

vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/admin/audit-log');

describe('Site Content API Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' } as any,
      role: 'admin',
    });
    vi.mocked(logSettingsChange).mockResolvedValue(undefined);
  });

  describe('GET /api/admin/settings/site-content', () => {
    it('should fetch all site content sections', async () => {
      const mockData = [
        {
          id: '1',
          section: 'hero',
          content: {
            headline: 'Welcome to Puppy Day',
            subheadline: 'Professional grooming',
            background_image_url: null,
            cta_buttons: [
              { text: 'Book Now', url: '/booking', style: 'primary' },
            ],
          },
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          section: 'seo',
          content: {
            page_title: 'Puppy Day - Dog Grooming',
            meta_description: 'Professional dog grooming in La Mirada',
            og_title: 'Puppy Day',
            og_description: 'Premium grooming services',
            og_image_url: null,
          },
          updated_at: '2024-01-15T11:00:00Z',
        },
      ];

      mockSupabase.in.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('hero');
      expect(json).toHaveProperty('seo');
      expect(json.hero.content).toBeDefined();
      expect(json.seo.content).toBeDefined();
    });

    it('should handle missing content sections', async () => {
      mockSupabase.in.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.hero.content).toBeNull();
      expect(json.seo.content).toBeNull();
      expect(json.business_info.content).toBeNull();
    });

    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized')
      );

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.in.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it('should return all sections with timestamps', async () => {
      const mockData = [
        {
          id: '1',
          section: 'hero',
          content: { headline: 'Test' },
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          section: 'seo',
          content: { page_title: 'Test' },
          updated_at: '2025-01-02T00:00:00Z',
        },
        {
          id: '3',
          section: 'business_info',
          content: { name: 'Test' },
          updated_at: '2025-01-03T00:00:00Z',
        },
      ];

      mockSupabase.in.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(json.hero.last_updated).toBe('2025-01-01T00:00:00Z');
      expect(json.seo.last_updated).toBe('2025-01-02T00:00:00Z');
      expect(json.business_info.last_updated).toBe('2025-01-03T00:00:00Z');
    });
  });

  describe('PUT /api/admin/settings/site-content', () => {
    it('should update hero content', async () => {
      const heroContent: HeroContent = {
        headline: 'Welcome to Puppy Day',
        subheadline: 'Professional grooming services',
        background_image_url: null,
        cta_buttons: [
          { text: 'Book Now', url: '/booking', style: 'primary' },
        ],
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: {
          id: '1',
          section: 'hero',
          content: heroContent,
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: heroContent,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.section).toBe('hero');
      expect(json.content).toEqual(heroContent);
    });

    it('should update SEO content', async () => {
      const seoSettings: SeoSettings = {
        page_title: 'Dog Grooming - Puppy Day',
        meta_description: 'Professional grooming in La Mirada',
        og_title: 'Puppy Day',
        og_description: 'Premium grooming',
        og_image_url: null,
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: {
          id: '2',
          section: 'seo',
          content: seoSettings,
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'seo',
            data: seoSettings,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.section).toBe('seo');
      expect(json.content.page_title).toBe(seoSettings.page_title);
    });

    it('should update business info', async () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: '14936 Leffingwell Rd',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'puppyday14936@gmail.com',
        social_links: {
          instagram: 'https://instagram.com/puppyday_lm',
        },
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: {
          id: '3',
          section: 'business_info',
          content: businessInfo,
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'business_info',
            data: businessInfo,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.section).toBe('business_info');
      expect(json.content.phone).toBe('(657) 252-2903');
    });

    it('should validate invalid section parameter', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'invalid',
            data: {},
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid section');
    });

    it('should validate hero content data', async () => {
      const invalidHeroContent = {
        headline: '', // Empty, should fail
        subheadline: 'Test',
        background_image_url: null,
        cta_buttons: [],
      };

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: invalidHeroContent,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid hero content');
    });

    it('should validate SEO content data', async () => {
      const invalidSeoContent = {
        page_title: 'a'.repeat(61), // Exceeds 60 char limit
        meta_description: 'Description',
        og_title: 'Title',
        og_description: 'Description',
        og_image_url: null,
      };

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'seo',
            data: invalidSeoContent,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid SEO');
    });

    it('should validate business info data', async () => {
      const invalidBusinessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'City',
        state: 'CA',
        zip: 'invalid-zip', // Invalid format
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'business_info',
            data: invalidBusinessInfo,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Invalid business info');
    });

    it('should update existing section', async () => {
      const heroContent: HeroContent = {
        headline: 'Updated Headline',
        subheadline: 'Updated Subheadline',
        background_image_url: null,
        cta_buttons: [],
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: {
          id: '1',
          content: { headline: 'Old' },
        },
        error: null,
      });

      mockSupabase.update.mockResolvedValue({
        data: {
          id: '1',
          section: 'hero',
          content: heroContent,
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: heroContent,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should require admin authentication', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new Error('Unauthorized')
      );

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: {},
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it('should create audit log on update', async () => {
      const heroContent: HeroContent = {
        headline: 'Test',
        subheadline: 'Test',
        background_image_url: null,
        cta_buttons: [],
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: {
          id: '1',
          section: 'hero',
          content: heroContent,
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: heroContent,
          }),
        })
      );

      await PUT(request);

      expect(logSettingsChange).toHaveBeenCalledWith(
        mockSupabase,
        'admin-1',
        'site_content',
        'hero',
        null,
        heroContent
      );
    });

    it('should handle request body parsing errors', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: 'invalid json',
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it('should return updated timestamp', async () => {
      const heroContent: HeroContent = {
        headline: 'Test',
        subheadline: 'Test',
        background_image_url: null,
        cta_buttons: [],
      };

      const timestamp = '2025-12-19T14:30:00Z';

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: {
          id: '1',
          section: 'hero',
          content: heroContent,
          updated_at: timestamp,
        },
        error: null,
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: heroContent,
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(json.updated_at).toBe(timestamp);
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockSupabase.in.mockRejectedValue(
        new Error('Unexpected error')
      );

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it('should handle insert/update failures gracefully', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const request = new NextRequest(
        new Request('http://localhost/api/admin/settings/site-content', {
          method: 'PUT',
          body: JSON.stringify({
            section: 'hero',
            data: {
              headline: 'Test',
              subheadline: 'Test',
              background_image_url: null,
              cta_buttons: [],
            },
          }),
        })
      );

      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });
  });
});
