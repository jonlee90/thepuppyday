/**
 * Tests for Individual Banner API Routes
 * Task 0170: Banner individual routes (GET, PUT, DELETE)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '@/app/api/admin/settings/banners/[id]/route';
import { NextRequest } from 'next/server';

// Mock the Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

// Mock the admin auth
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    user: { id: 'admin-123', role: 'admin' },
    role: 'admin',
  }),
}));

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock the audit log
vi.mock('@/lib/admin/audit-log', () => ({
  logSettingsChange: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /api/admin/settings/banners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single banner with analytics', async () => {
    const mockBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: 'https://example.com',
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 0,
      click_count: 25,
      impression_count: 500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockBanner,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1');
    const response = await GET(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banner).toHaveProperty('id', 'banner-1');
    expect(data.banner).toHaveProperty('status');
    expect(data.banner).toHaveProperty('click_through_rate');
    expect(data.banner.click_through_rate).toBe(5); // 25/500 * 100 = 5%
  });

  it('should return 404 for non-existent banner', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('No rows found'),
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/invalid-id');
    const response = await GET(request, { params: { id: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Banner not found');
  });

  it('should calculate click_through_rate as 0 when impression_count is 0', async () => {
    const mockBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: null,
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 0,
      click_count: 0,
      impression_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockBanner,
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1');
    const response = await GET(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banner.click_through_rate).toBe(0);
  });
});

describe('PUT /api/admin/settings/banners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update banner with partial data', async () => {
    const existingBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/old-banner.jpg',
      alt_text: 'Old Banner',
      click_url: 'https://example.com',
      start_date: null,
      end_date: null,
      is_active: false,
      display_order: 0,
      click_count: 10,
      impression_count: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const updateData = {
      alt_text: 'Updated Banner',
      is_active: true,
    };

    // Mock fetch existing
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: existingBanner,
            error: null,
          }),
        }),
      }),
    });

    // Mock update
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...existingBanner,
                ...updateData,
                updated_at: '2024-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const response = await PUT(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banner.alt_text).toBe('Updated Banner');
    expect(data.banner.is_active).toBe(true);
    expect(data.message).toBe('Banner updated successfully');
  });

  it('should validate date logic on update', async () => {
    const existingBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: null,
      start_date: '2024-12-01',
      end_date: '2024-12-31',
      is_active: true,
      display_order: 0,
      click_count: 0,
      impression_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: existingBanner,
            error: null,
          }),
        }),
      }),
    });

    const updateData = {
      end_date: '2024-11-01', // Before start_date
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const response = await PUT(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('End date must be after start date');
  });

  it('should return 404 for non-existent banner', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/invalid-id', {
      method: 'PUT',
      body: JSON.stringify({ alt_text: 'Updated' }),
    });

    const response = await PUT(request, { params: { id: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Banner not found');
  });

  it('should validate URL fields', async () => {
    const existingBanner = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: null,
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 0,
      click_count: 0,
      impression_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: existingBanner,
            error: null,
          }),
        }),
      }),
    });

    const updateData = {
      image_url: 'not-a-url',
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const response = await PUT(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid banner data');
  });
});

describe('DELETE /api/admin/settings/banners/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should soft-delete banner with analytics data', async () => {
    const bannerWithAnalytics = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: 'https://example.com',
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 0,
      click_count: 50,
      impression_count: 500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Mock fetch existing
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: bannerWithAnalytics,
            error: null,
          }),
        }),
      }),
    });

    // Mock soft-delete update
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deletion_type).toBe('soft');
    expect(data.message).toContain('deactivated');
    expect(data.reason).toContain('analytics data');
  });

  it('should hard-delete banner without analytics data', async () => {
    const bannerWithoutAnalytics = {
      id: 'banner-1',
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      click_url: null,
      start_date: null,
      end_date: null,
      is_active: true,
      display_order: 0,
      click_count: 0,
      impression_count: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // Mock fetch existing
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: bannerWithoutAnalytics,
            error: null,
          }),
        }),
      }),
    });

    // Mock hard-delete
    mockSupabase.from.mockReturnValueOnce({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/banner-1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'banner-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deletion_type).toBe('hard');
    expect(data.message).toContain('deleted');
    expect(data.reason).toContain('No analytics data');
  });

  it('should return 404 for non-existent banner', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/invalid-id', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Banner not found');
  });
});
