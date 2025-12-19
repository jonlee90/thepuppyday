/**
 * Tests for Loyalty Earning Rules API Routes
 * Task 0195: Earning rules API routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/admin/settings/loyalty/earning-rules/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/admin/audit-log');

describe('GET /api/admin/settings/loyalty/earning-rules', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

    // Mock admin auth
    vi.mocked(requireAdmin).mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      } as any,
      role: 'admin',
    });
  });

  it('should return default earning rules when none exist', async () => {
    // Mock settings not found
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'No rows found' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({
      qualifying_services: [],
      minimum_spend: 0,
      first_visit_bonus: 1,
    });
    expect(data.last_updated).toBeNull();
  });

  it('should return stored earning rules', async () => {
    const mockEarningRules = {
      qualifying_services: ['service-1', 'service-2'],
      minimum_spend: 50,
      first_visit_bonus: 2,
    };

    mockSupabase.single.mockResolvedValue({
      data: {
        value: mockEarningRules,
        updated_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockEarningRules);
    expect(data.last_updated).toBe('2024-01-01T00:00:00Z');
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 500 on database error', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { value: {}, updated_at: '2024-01-01T00:00:00Z' },
      error: { message: 'Database connection failed' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch earning rules');
  });
});

describe('PUT /api/admin/settings/loyalty/earning-rules', () => {
  let mockSupabase: any;
  let mockRequest: Request;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mock for each test
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
      single: vi.fn(),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);

    // Mock admin auth
    vi.mocked(requireAdmin).mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      } as any,
      role: 'admin',
    });

    // Mock audit log
    vi.mocked(logSettingsChange).mockResolvedValue();
  });

  it('should update earning rules successfully (all services)', async () => {
    const requestBody = {
      qualifying_services: [],
      minimum_spend: 0,
      first_visit_bonus: 1,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    // Mock database calls:
    // 1. Fetch existing setting for old value
    // 2. Check if setting exists
    // 3. Appointments count
    mockSupabase.single
      .mockResolvedValueOnce({ data: null, error: null }) // old setting
      .mockResolvedValueOnce({ data: { id: 'setting-1' }, error: null }); // existing setting check

    mockSupabase.gte.mockResolvedValue({ count: 5, error: null }); // appointments count

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.earning_rules).toEqual(requestBody);
    expect(data.affected_customers).toBe(5);
    expect(data.message).toContain('All services now qualify');
  });

  it('should update earning rules with specific services', async () => {
    const requestBody = {
      qualifying_services: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
      minimum_spend: 50,
      first_visit_bonus: 2,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    // Mock service validation: return same services (all found)
    mockSupabase.in.mockReturnValueOnce({
      data: [
        { id: '00000000-0000-0000-0000-000000000001' },
        { id: '00000000-0000-0000-0000-000000000002' },
      ],
      error: null,
    });

    // Mock database calls
    mockSupabase.single
      .mockResolvedValueOnce({ data: null, error: null }) // old setting
      .mockResolvedValueOnce({ data: { id: 'setting-1' }, error: null }); // existing setting check

    mockSupabase.gte.mockResolvedValue({ count: 10, error: null }); // appointments count

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.earning_rules.qualifying_services).toHaveLength(2);
    expect(data.message).toContain('2 specific service(s) qualify');
  });

  it('should create new setting if none exists', async () => {
    const requestBody = {
      qualifying_services: [],
      minimum_spend: 0,
      first_visit_bonus: 1,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    // Mock no existing setting
    mockSupabase.single
      .mockResolvedValueOnce({ data: null, error: null }) // old setting
      .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } }); // no existing setting

    mockSupabase.gte.mockResolvedValue({ count: 0, error: null });

    const response = await PUT(mockRequest);

    expect(response.status).toBe(200);
  });

  it('should return 400 for validation errors', async () => {
    const requestBody = {
      qualifying_services: [],
      minimum_spend: -10, // Invalid
      first_visit_bonus: 1,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should return 400 if service IDs do not exist', async () => {
    const requestBody = {
      qualifying_services: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'],
      minimum_spend: 0,
      first_visit_bonus: 1,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    // Mock service validation - only one service found
    mockSupabase.in.mockReturnValueOnce({
      data: [{ id: '00000000-0000-0000-0000-000000000001' }],
      error: null,
    });

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid service IDs');
  });

  it('should return 500 if service validation fails', async () => {
    const requestBody = {
      qualifying_services: ['00000000-0000-0000-0000-000000000001'],
      minimum_spend: 0,
      first_visit_bonus: 1,
    };

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    // Mock service validation error
    mockSupabase.in.mockReturnValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to validate service IDs');
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized: Admin or staff access required'));

    mockRequest = new Request('http://localhost/api/admin/settings/loyalty/earning-rules', {
      method: 'PUT',
      body: JSON.stringify({
        qualifying_services: [],
        minimum_spend: 0,
        first_visit_bonus: 1,
      }),
    });

    const response = await PUT(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });
});
