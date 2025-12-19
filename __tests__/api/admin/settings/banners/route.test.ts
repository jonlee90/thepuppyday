/**
 * Tests for Banner Management API Routes
 * Tasks 0169-0172: Banner CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules before importing route handlers
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/audit-log');

// Import after mocking
import { GET, POST } from '@/app/api/admin/settings/banners/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';

describe('GET /api/admin/settings/banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: 'admin-123', role: 'admin' } as any,
      role: 'admin',
    });

    vi.mocked(logSettingsChange).mockResolvedValue(undefined);
  });

  it('should fetch all banners with status computed', async () => {
    const mockBanners = [
      {
        id: 'banner-1',
        image_url: 'https://example.com/banner1.jpg',
        alt_text: 'Banner 1',
        click_url: 'https://example.com',
        start_date: null,
        end_date: null,
        is_active: false,
        display_order: 0,
        click_count: 10,
        impression_count: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'banner-2',
        image_url: 'https://example.com/banner2.jpg',
        alt_text: 'Banner 2',
        click_url: null,
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        is_active: true,
        display_order: 1,
        click_count: 5,
        impression_count: 50,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBanners,
            error: null,
          }),
        }),
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banners).toHaveLength(2);
    expect(data.banners[0]).toHaveProperty('status');
    expect(data.banners[0].status).toBe('draft'); // Not active, no dates
    expect(data.total).toBe(2);
    expect(data.filter).toBe('all');
  });

  it('should filter banners by status=active', async () => {
    const mockBanners = [
      {
        id: 'banner-1',
        image_url: 'https://example.com/banner1.jpg',
        alt_text: 'Banner 1',
        click_url: null,
        start_date: null,
        end_date: null,
        is_active: true,
        display_order: 0,
        click_count: 0,
        impression_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'banner-2',
        image_url: 'https://example.com/banner2.jpg',
        alt_text: 'Banner 2',
        click_url: null,
        start_date: null,
        end_date: null,
        is_active: false,
        display_order: 1,
        click_count: 0,
        impression_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBanners,
            error: null,
          }),
        }),
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.banners).toHaveLength(1);
    expect(data.banners[0].id).toBe('banner-1');
    expect(data.banners[0].status).toBe('active');
  });

  it('should return 400 for invalid status filter', async () => {
    const mockSupabase = {};
    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners?status=invalid');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid status filter');
  });

  it('should handle database errors', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});

describe('POST /api/admin/settings/banners', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireAdmin).mockResolvedValue({
      user: { id: 'admin-123', role: 'admin' } as any,
      role: 'admin',
    });

    vi.mocked(logSettingsChange).mockResolvedValue(undefined);
  });

  it('should create a new banner with auto-assigned display_order', async () => {
    const newBannerData = {
      image_url: 'https://example.com/new-banner.jpg',
      alt_text: 'New Banner',
      click_url: 'https://example.com',
      start_date: '2024-12-20',
      end_date: '2024-12-31',
      is_active: true,
    };

    const mockSupabase = {
      from: vi.fn()
        // First call: get max display_order
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_order: 2 },
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Second call: insert
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'banner-new',
                  ...newBannerData,
                  display_order: 3,
                  click_count: 0,
                  impression_count: 0,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners', {
      method: 'POST',
      body: JSON.stringify(newBannerData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.banner).toHaveProperty('id', 'banner-new');
    expect(data.banner).toHaveProperty('display_order', 3);
    expect(data.banner).toHaveProperty('status');
    expect(data.message).toBe('Banner created successfully');
  });

  it('should validate required fields', async () => {
    const invalidData = {
      image_url: 'not-a-url',
      alt_text: '',
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid banner data');
    expect(data.details).toBeDefined();
  });

  it('should validate end_date is after start_date', async () => {
    const invalidData = {
      image_url: 'https://example.com/banner.jpg',
      alt_text: 'Test Banner',
      start_date: '2024-12-31',
      end_date: '2024-12-01',
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('End date must be after start date');
  });

  it('should handle first banner creation (no existing banners)', async () => {
    const newBannerData = {
      image_url: 'https://example.com/first-banner.jpg',
      alt_text: 'First Banner',
    };

    const mockSupabase = {
      from: vi.fn()
        // First call: no existing banners
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Second call: insert
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'banner-first',
                  ...newBannerData,
                  click_url: null,
                  start_date: null,
                  end_date: null,
                  is_active: false,
                  display_order: 0,
                  click_count: 0,
                  impression_count: 0,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners', {
      method: 'POST',
      body: JSON.stringify(newBannerData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.banner).toHaveProperty('display_order', 0);
  });
});
