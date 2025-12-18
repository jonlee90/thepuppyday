/**
 * Tests for Hero Image Upload API
 * POST /api/admin/settings/site-content/upload
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/admin/settings/site-content/upload/route';
import { NextRequest } from 'next/server';

// Mock functions must be declared with vi.hoisted to avoid hoisting issues
const { mockCreateServerSupabaseClient, mockCreateServiceRoleClient, mockRequireAdmin, mockSharp } = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
  mockCreateServiceRoleClient: vi.fn(),
  mockRequireAdmin: vi.fn(),
  mockSharp: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: mockCreateServerSupabaseClient,
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('sharp', () => ({
  default: mockSharp,
}));

describe('POST /api/admin/settings/site-content/upload', () => {
  let mockSupabase: any;
  let mockServiceSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock Supabase clients
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-1' } },
          error: null,
        }),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => ({
        data: { id: 'admin-1', role: 'admin' },
        error: null,
      })),
    };

    mockServiceSupabase = {
      storage: {
        listBuckets: vi.fn().mockResolvedValue({
          data: [{ name: 'hero-images' }],
          error: null,
        }),
        createBucket: vi.fn().mockResolvedValue({
          data: { name: 'hero-images' },
          error: null,
        }),
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({
            data: { path: 'test-uuid.jpg' },
            error: null,
          }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/hero-images/test-uuid.jpg' },
          }),
        })),
      },
    };

    // Mock sharp
    mockSharp.mockImplementation(() => ({
      metadata: vi.fn().mockResolvedValue({
        width: 1920,
        height: 1080,
        format: 'jpeg',
      }),
    }));

    // Setup mocks
    mockCreateServerSupabaseClient.mockResolvedValue(mockSupabase);
    mockCreateServiceRoleClient.mockReturnValue(mockServiceSupabase);
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin-1' }, role: 'admin' });
  });

  it('should successfully upload a valid hero image', async () => {
    const formData = new FormData();
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('width');
    expect(data).toHaveProperty('height');
    expect(data.url).toContain('hero-images');
    expect(data.width).toBe(1920);
    expect(data.height).toBe(1080);
  });

  it('should reject request with no file', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });

  it('should reject invalid file type', async () => {
    const formData = new FormData();
    const file = new File(['test'], 'hero.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File must be JPEG, PNG, or WebP');
  });

  it('should reject file larger than 5MB', async () => {
    const formData = new FormData();
    // Create a buffer of 6MB
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeBuffer], 'hero.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File size must be under 5MB');
  });

  it('should reject image with dimensions too small', async () => {
    // Mock sharp to return small dimensions
    mockSharp.mockImplementation(() => ({
      metadata: vi.fn().mockResolvedValue({
        width: 800,
        height: 600,
        format: 'jpeg',
      }),
    }));

    const formData = new FormData();
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Image must be at least 1920x800 pixels');
    expect(data.error).toContain('800x600');
  });

  it('should create bucket if it does not exist', async () => {
    // Mock bucket not existing
    mockServiceSupabase.storage.listBuckets.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const formData = new FormData();
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(mockServiceSupabase.storage.createBucket).toHaveBeenCalledWith(
      'hero-images',
      expect.objectContaining({
        public: true,
      })
    );
    expect(response.status).toBe(200);
  });

  it('should handle storage upload errors', async () => {
    // Mock upload failure
    mockServiceSupabase.storage.from = vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' },
      }),
    }));

    const formData = new FormData();
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Storage quota exceeded');
  });

  it('should require admin authentication', async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error('Unauthorized'));

    const formData = new FormData();
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/admin/settings/site-content/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Unauthorized');
  });
});
