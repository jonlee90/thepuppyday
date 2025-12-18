/**
 * Tests for Site Content API Routes
 * Tests GET and PUT operations for hero, SEO, and business info sections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/admin/settings/site-content/route';
import { NextRequest } from 'next/server';
import type { HeroContent, SeoSettings, BusinessInfo } from '@/types/settings';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(),
}));

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

describe('Site Content API - GET /api/admin/settings/site-content', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client
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
  });

  it('should fetch all site content sections successfully', async () => {
    const mockData = [
      {
        id: '1',
        section: 'hero',
        content: {
          headline: 'Welcome to Puppy Day',
          subheadline: 'Professional grooming',
          background_image_url: 'https://example.com/hero.jpg',
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
          og_description: 'Professional dog grooming',
          og_image_url: 'https://example.com/og.jpg',
        },
        updated_at: '2024-01-15T11:00:00Z',
      },
      {
        id: '3',
        section: 'business_info',
        content: {
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
        },
        updated_at: '2024-01-15T12:00:00Z',
      },
    ];

    mockSupabase.in.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('hero');
    expect(json).toHaveProperty('seo');
    expect(json).toHaveProperty('business_info');
    expect(json.hero.content.headline).toBe('Welcome to Puppy Day');
    expect(json.seo.content.page_title).toBe('Puppy Day - Dog Grooming');
    expect(json.business_info.content.name).toBe('Puppy Day');
  });

  it('should return empty sections when no data exists', async () => {
    mockSupabase.in.mockResolvedValue({
      data: [],
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.hero.content).toBeNull();
    expect(json.seo.content).toBeNull();
    expect(json.business_info.content).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.in.mockResolvedValue({
      data: null,
      error: new Error('Database connection failed'),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});

describe('Site Content API - PUT /api/admin/settings/site-content', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
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
  });

  it('should update hero content successfully', async () => {
    const heroData: HeroContent = {
      headline: 'Updated Headline',
      subheadline: 'Updated Subheadline',
      background_image_url: 'https://example.com/new-hero.jpg',
      cta_buttons: [
        { text: 'Book Now', url: '/booking', style: 'primary' },
      ],
    };

    // Existing record found
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { id: '1' },
      error: null,
    });

    // Update successful
    mockSupabase.single.mockResolvedValue({
      data: {
        id: '1',
        section: 'hero',
        content: heroData,
        updated_at: '2024-01-15T15:00:00Z',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'hero',
        data: heroData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.section).toBe('hero');
    expect(json.content.headline).toBe('Updated Headline');
    expect(json.updated_at).toBeDefined();
  });

  it('should insert new SEO settings successfully', async () => {
    const seoData: SeoSettings = {
      page_title: 'New Page Title',
      meta_description: 'New meta description',
      og_title: 'New OG Title',
      og_description: 'New OG description',
      og_image_url: 'https://example.com/og.jpg',
    };

    // No existing record
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    // Insert successful
    mockSupabase.single.mockResolvedValue({
      data: {
        id: '2',
        section: 'seo',
        content: seoData,
        updated_at: '2024-01-15T15:00:00Z',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'seo',
        data: seoData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.section).toBe('seo');
    expect(json.content.page_title).toBe('New Page Title');
  });

  it('should validate business info correctly', async () => {
    const businessData: BusinessInfo = {
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
      data: { id: '3' },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        id: '3',
        section: 'business_info',
        content: businessData,
        updated_at: '2024-01-15T15:00:00Z',
      },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'business_info',
        data: businessData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.section).toBe('business_info');
    expect(json.content.name).toBe('Puppy Day');
  });

  it('should reject invalid section parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'invalid_section',
        data: {},
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid section');
  });

  it('should reject invalid hero content', async () => {
    const invalidHeroData = {
      headline: '', // Empty headline is invalid
      subheadline: 'Valid subheadline',
      background_image_url: null,
      cta_buttons: [],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'hero',
        data: invalidHeroData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid hero content');
  });

  it('should reject invalid SEO settings', async () => {
    const invalidSeoData = {
      page_title: 'Valid title',
      meta_description: '', // Empty description is invalid
      og_title: 'Valid OG title',
      og_description: 'Valid OG description',
      og_image_url: null,
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'seo',
        data: invalidSeoData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid SEO settings');
  });

  it('should reject invalid business info', async () => {
    const invalidBusinessData = {
      name: 'Puppy Day',
      address: '14936 Leffingwell Rd',
      city: 'La Mirada',
      state: 'CA',
      zip: 'invalid-zip', // Invalid zip format
      phone: '(657) 252-2903',
      email: 'puppyday14936@gmail.com',
      social_links: {},
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'business_info',
        data: invalidBusinessData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid business info');
  });

  it('should handle database errors during update', async () => {
    const heroData: HeroContent = {
      headline: 'Test Headline',
      subheadline: 'Test Subheadline',
      background_image_url: null,
      cta_buttons: [],
    };

    mockSupabase.maybeSingle.mockResolvedValue({
      data: { id: '1' },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Database update failed'),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'hero',
        data: heroData,
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});
