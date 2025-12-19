/**
 * Tests for Banner Reorder API Route
 * Task 0171: Banner reorder with atomic updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PUT } from '@/app/api/admin/settings/banners/reorder/route';
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

describe('PUT /api/admin/settings/banners/reorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reorder banners successfully', async () => {
    const reorderData = {
      banners: [
        { id: 'banner-1', display_order: 2 },
        { id: 'banner-2', display_order: 0 },
        { id: 'banner-3', display_order: 1 },
      ],
    };

    const existingBanners = [
      { id: 'banner-1', display_order: 0 },
      { id: 'banner-2', display_order: 1 },
      { id: 'banner-3', display_order: 2 },
    ];

    // Mock fetch existing banners for validation
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: existingBanners,
          error: null,
        }),
      }),
    });

    // Mock update calls
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: updateMock,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(reorderData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Banners reordered successfully');
    expect(data.updated_count).toBe(3);
    expect(data.banners).toEqual(reorderData.banners);
  });

  it('should reject duplicate display_order values', async () => {
    const invalidData = {
      banners: [
        { id: 'banner-1', display_order: 0 },
        { id: 'banner-2', display_order: 0 }, // Duplicate!
        { id: 'banner-3', display_order: 1 },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Duplicate display_order values are not allowed');
  });

  it('should validate all banner IDs exist', async () => {
    const reorderData = {
      banners: [
        { id: 'banner-1', display_order: 0 },
        { id: 'banner-2', display_order: 1 },
        { id: 'invalid-id', display_order: 2 },
      ],
    };

    // Mock fetch only returns 2 banners (missing invalid-id)
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 'banner-1', display_order: 0 },
            { id: 'banner-2', display_order: 1 },
          ],
          error: null,
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(reorderData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('One or more banner IDs not found');
  });

  it('should validate request body schema', async () => {
    const invalidData = {
      banners: [
        { id: 'not-a-uuid', display_order: 0 },
        { id: 'banner-2', display_order: -1 }, // Negative order
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid reorder data');
    expect(data.details).toBeDefined();
  });

  it('should require at least one banner', async () => {
    const invalidData = {
      banners: [],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid reorder data');
  });

  it('should handle update failures gracefully', async () => {
    const reorderData = {
      banners: [
        { id: 'banner-1', display_order: 1 },
        { id: 'banner-2', display_order: 0 },
      ],
    };

    const existingBanners = [
      { id: 'banner-1', display_order: 0 },
      { id: 'banner-2', display_order: 1 },
    ];

    // Mock fetch existing banners
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: existingBanners,
          error: null,
        }),
      }),
    });

    // Mock update to fail
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: new Error('Database update failed'),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: updateMock,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(reorderData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to update banner order');
  });

  it('should handle single banner reorder', async () => {
    const reorderData = {
      banners: [{ id: 'banner-1', display_order: 0 }],
    };

    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [{ id: 'banner-1', display_order: 5 }],
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/settings/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify(reorderData),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.updated_count).toBe(1);
  });
});
