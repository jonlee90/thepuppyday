/**
 * Integration tests for /api/admin/services
 * Task 0282: Admin API Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/admin/services/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');

describe('GET /api/admin/services', () => {
  let mockSupabase: any;

  const mockAdmin = {
    user: { id: 'admin-1', role: 'admin' } as any,
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      order: vi.fn(),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('should require admin authentication', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new Error('Unauthorized: Admin or staff access required')
    );

    const request = new Request('http://localhost/api/admin/services');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('should fetch all services with prices', async () => {
    const mockServices = [
      {
        id: 'service-1',
        name: 'Basic Grooming',
        description: 'Essential grooming package',
        duration_minutes: 60,
        image_url: null,
        is_active: true,
        display_order: 1,
      },
      {
        id: 'service-2',
        name: 'Premium Grooming',
        description: 'Full-service grooming',
        duration_minutes: 90,
        image_url: null,
        is_active: true,
        display_order: 2,
      },
    ];

    const mockPrices = [
      { id: 'price-1', service_id: 'service-1', size: 'small', price: 40 },
      { id: 'price-2', service_id: 'service-1', size: 'medium', price: 55 },
      { id: 'price-3', service_id: 'service-1', size: 'large', price: 70 },
      { id: 'price-4', service_id: 'service-1', size: 'xlarge', price: 85 },
      { id: 'price-5', service_id: 'service-2', size: 'small', price: 70 },
      { id: 'price-6', service_id: 'service-2', size: 'medium', price: 95 },
      { id: 'price-7', service_id: 'service-2', size: 'large', price: 120 },
      { id: 'price-8', service_id: 'service-2', size: 'xlarge', price: 150 },
    ];

    // Mock services query
    mockSupabase.order
      .mockResolvedValueOnce({
        data: mockServices,
        error: null,
      })
      // Mock prices query
      .mockResolvedValueOnce({
        data: mockPrices,
        error: null,
      });

    const request = new Request('http://localhost/api/admin/services');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.services).toHaveLength(2);
    expect(json.services[0].prices).toHaveLength(4);
    expect(json.services[1].prices).toHaveLength(4);
  });

  it('should sort services by display_order', async () => {
    mockSupabase.order
      .mockResolvedValueOnce({
        data: [
          { id: 'service-1', name: 'Service 1', display_order: 1 },
          { id: 'service-2', name: 'Service 2', display_order: 2 },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    const request = new Request('http://localhost/api/admin/services');
    const response = await GET(request as any);

    expect(response.status).toBe(200);
    expect(mockSupabase.order).toHaveBeenCalledWith('display_order', { ascending: true });
  });

  it('should handle empty services list', async () => {
    mockSupabase.order
      .mockResolvedValueOnce({
        data: [],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    const request = new Request('http://localhost/api/admin/services');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.services).toEqual([]);
  });

  it('should handle database errors', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const request = new Request('http://localhost/api/admin/services');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});

describe('POST /api/admin/services', () => {
  let mockSupabase: any;

  const mockAdmin = {
    user: { id: 'admin-1', role: 'admin' } as any,
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      limit: vi.fn(() => mockSupabase),
      single: vi.fn(),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('should require admin authentication', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new Error('Unauthorized: Admin or staff access required')
    );

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        description: 'Test service',
        duration_minutes: 60,
        prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('should create service with size-based pricing', async () => {
    const newService = {
      name: 'New Service',
      description: 'Test service',
      duration_minutes: 60,
      image_url: null,
      is_active: true,
      prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
    };

    // Mock display_order query
    mockSupabase.limit.mockResolvedValue({
      data: [{ display_order: 2 }],
      error: null,
    });

    // Mock service creation
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'service-new',
        ...newService,
        display_order: 3,
      },
      error: null,
    });

    // Mock prices creation (for the last select)
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        { id: 'price-1', service_id: 'service-new', size: 'small', price: 40 },
        { id: 'price-2', service_id: 'service-new', size: 'medium', price: 55 },
        { id: 'price-3', service_id: 'service-new', size: 'large', price: 70 },
        { id: 'price-4', service_id: 'service-new', size: 'xlarge', price: 85 },
      ],
      error: null,
    });

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.service).toBeDefined();
    expect(json.service.name).toBe('New Service');
    expect(json.service.prices).toHaveLength(4);
  });

  it('should validate service name', async () => {
    const invalidService = {
      name: '', // Empty name
      description: 'Test service',
      duration_minutes: 60,
      prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
    };

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('should validate duration_minutes', async () => {
    const invalidService = {
      name: 'New Service',
      description: 'Test service',
      duration_minutes: -10, // Invalid duration
      prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
    };

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('should validate image URL format', async () => {
    const invalidService = {
      name: 'New Service',
      description: 'Test service',
      duration_minutes: 60,
      image_url: 'javascript:alert(1)', // XSS attempt
      prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
    };

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid image URL');
  });

  it('should validate all size-based prices are provided', async () => {
    const invalidService = {
      name: 'New Service',
      description: 'Test service',
      duration_minutes: 60,
      prices: { small: 40, medium: 55 }, // Missing large and xlarge
    };

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('should validate price values are positive', async () => {
    const invalidService = {
      name: 'New Service',
      description: 'Test service',
      duration_minutes: 60,
      prices: { small: -10, medium: 55, large: 70, xlarge: 85 },
    };

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidService),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('should sanitize service name for XSS prevention', async () => {
    const serviceWithScript = {
      name: '<script>alert("XSS")</script>Service',
      description: 'Test service',
      duration_minutes: 60,
      prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
    };

    // Mock display_order query
    mockSupabase.limit.mockResolvedValue({
      data: [{ display_order: 2 }],
      error: null,
    });

    // Mock service creation
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'service-new',
        name: 'Service', // Sanitized
        description: 'Test service',
        duration_minutes: 60,
        display_order: 3,
      },
      error: null,
    });

    // Mock prices creation
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        { id: 'price-1', service_id: 'service-new', size: 'small', price: 40 },
        { id: 'price-2', service_id: 'service-new', size: 'medium', price: 55 },
        { id: 'price-3', service_id: 'service-new', size: 'large', price: 70 },
        { id: 'price-4', service_id: 'service-new', size: 'xlarge', price: 85 },
      ],
      error: null,
    });

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceWithScript),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    // Name should be sanitized
    expect(json.service.name).not.toContain('<script>');
  });

  it('should set correct display_order for new service', async () => {
    // Mock existing services
    mockSupabase.limit.mockResolvedValue({
      data: [{ display_order: 5 }],
      error: null,
    });

    // Mock service creation
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'service-new',
        name: 'New Service',
        display_order: 6, // Should be 5 + 1
      },
      error: null,
    });

    // Mock prices creation
    mockSupabase.select.mockResolvedValueOnce({
      data: [
        { id: 'price-1', service_id: 'service-new', size: 'small', price: 40 },
        { id: 'price-2', service_id: 'service-new', size: 'medium', price: 55 },
        { id: 'price-3', service_id: 'service-new', size: 'large', price: 70 },
        { id: 'price-4', service_id: 'service-new', size: 'xlarge', price: 85 },
      ],
      error: null,
    });

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        description: 'Test service',
        duration_minutes: 60,
        prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.service.display_order).toBe(6);
  });

  it('should handle service creation failure', async () => {
    // Mock display_order query
    mockSupabase.limit.mockResolvedValue({
      data: [{ display_order: 1 }],
      error: null,
    });

    // Mock service creation failure
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        description: 'Test service',
        duration_minutes: 60,
        prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  it('should rollback service creation if price creation fails', async () => {
    // Mock display_order query
    mockSupabase.limit.mockResolvedValue({
      data: [{ display_order: 1 }],
      error: null,
    });

    // Mock service creation success
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'service-new',
        name: 'New Service',
        display_order: 2,
      },
      error: null,
    });

    // Mock prices creation failure
    mockSupabase.select.mockResolvedValueOnce({
      data: null,
      error: { message: 'Price insert failed' },
    });

    // Mock delete for rollback
    mockSupabase.eq.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        description: 'Test service',
        duration_minutes: 60,
        prices: { small: 40, medium: 55, large: 70, xlarge: 85 },
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
    // Verify rollback was attempted
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it('should handle missing prices object', async () => {
    const request = new Request('http://localhost/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        description: 'Test service',
        duration_minutes: 60,
        // Missing prices
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Size-based prices are required');
  });
});
