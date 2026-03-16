/**
 * Task 0126: Integration Tests for Admin Booking Flow
 * Tests POST /api/admin/appointments with price_adjustments, backdating, and conflicts API.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/server's after() to just execute the callback immediately
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    after: vi.fn((cb: () => void) => { cb(); }),
  };
});

// Mock dependencies before importing route handlers
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/booking/pricing', () => ({
  calculatePrice: vi.fn().mockReturnValue({
    servicePrice: 55,
    addonsTotal: 0,
    total: 55,
  }),
}));
vi.mock('@/lib/calendar/sync/auto-sync-trigger', () => ({
  triggerAutoSyncInBackground: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/utils', () => ({
  generateWalkinEmail: vi.fn().mockReturnValue('walkin@puppyday.com'),
}));
vi.mock('@/lib/notifications/triggers', () => ({
  triggerBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
  triggerAdminNewBooking: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('@/lib/notifications/triggers/booking-confirmation', () => ({
  triggerBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
}));

import { POST } from '@/app/api/admin/appointments/route';
import { GET as GETConflicts } from '@/app/api/admin/appointments/conflicts/route';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

// ─── Shared Helpers ───

const existingCustomerId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const existingPetId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const serviceId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const appointmentId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
const adminUserId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';

const mockAdmin = {
  user: { id: adminUserId, email: 'admin@test.com' },
  role: 'admin' as const,
};

const mockService = {
  id: serviceId,
  name: 'Basic Grooming',
  duration_minutes: 60,
  prices: [{ size: 'medium', price: 55 }],
};

const mockAppointment = {
  id: appointmentId,
  customer_id: existingCustomerId,
  pet_id: existingPetId,
  service_id: serviceId,
  scheduled_at: '2026-04-15T10:00:00.000Z',
  total_price: 55,
  status: 'pending',
  booking_reference: 'APT-2026-000001',
};

function makePostRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/admin/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const validBody = {
  customer: {
    id: existingCustomerId,
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@example.com',
    phone: '+15551234567',
  },
  pet: {
    id: existingPetId,
    name: 'Buddy',
    size: 'medium',
  },
  service_id: serviceId,
  appointment_date: '2026-04-15',
  appointment_time: '10:00',
  addon_ids: [],
  send_notification: false,
};

/**
 * Creates a chainable Supabase mock tracking insert calls per table.
 */
function createSupabaseMock(overrides: {
  appointmentData?: object;
  conflictAppointments?: object[];
  priceAdjustmentInsertError?: boolean;
} = {}) {
  const {
    appointmentData = mockAppointment,
    priceAdjustmentInsertError = false,
  } = overrides;

  const insertedRecords: Record<string, object[]> = {};
  const updatedRecords: Record<string, { data: object; filter: Record<string, string> }[]> = {};

  const makeChain = (resolveWith: { data: unknown; error: unknown }) => {
    const chain: any = {};
    const resolve = () => Promise.resolve(resolveWith);
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.ilike = vi.fn().mockReturnValue(chain);
    chain.not = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.neq = vi.fn().mockReturnValue(chain);
    chain.maybeSingle = vi.fn().mockImplementation(resolve);
    chain.single = vi.fn().mockImplementation(resolve);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockReturnValue(chain);
    chain.then = (r: any) => Promise.resolve(resolveWith).then(r);
    return chain;
  };

  const supabase = {
    from: vi.fn().mockImplementation((table: string) => {
      switch (table) {
        case 'users':
          return makeChain({
            data: { id: existingCustomerId, is_active: true, role: 'customer' },
            error: null,
          });

        case 'pets':
          return makeChain({
            data: { id: existingPetId, name: 'Buddy', size: 'medium' },
            error: null,
          });

        case 'services':
          return makeChain({ data: mockService, error: null });

        case 'appointments': {
          const chain: any = {};
          chain.select = vi.fn().mockReturnValue(chain);
          chain.eq = vi.fn().mockReturnValue(chain);
          chain.neq = vi.fn().mockReturnValue(chain);
          chain.not = vi.fn().mockReturnValue(chain);
          chain.order = vi.fn().mockReturnValue(chain);
          chain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
          chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
          chain.delete = vi.fn().mockReturnValue(chain);
          chain.update = vi.fn().mockImplementation((updateData: object) => {
            if (!updatedRecords['appointments']) updatedRecords['appointments'] = [];
            updatedRecords['appointments'].push({ data: updateData, filter: {} });
            const updateChain: any = {};
            updateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
            return updateChain;
          });
          chain.insert = vi.fn().mockImplementation((data: object) => {
            if (!insertedRecords['appointments']) insertedRecords['appointments'] = [];
            insertedRecords['appointments'].push(data);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: appointmentData, error: null }),
              }),
            };
          });
          chain.then = (r: any) => Promise.resolve({ data: null, error: null }).then(r);
          return chain;
        }

        case 'appointment_price_adjustments': {
          const chain: any = {};
          chain.insert = vi.fn().mockImplementation((data: object) => {
            if (!insertedRecords['appointment_price_adjustments']) {
              insertedRecords['appointment_price_adjustments'] = [];
            }
            insertedRecords['appointment_price_adjustments'].push(data);
            return Promise.resolve({
              data: null,
              error: priceAdjustmentInsertError ? { message: 'Insert failed' } : null,
            });
          });
          return chain;
        }

        case 'appointment_addons':
          return makeChain({ data: null, error: null });

        case 'payments':
          return makeChain({ data: null, error: null });

        default:
          return makeChain({ data: null, error: null });
      }
    }),
    _insertedRecords: insertedRecords,
    _updatedRecords: updatedRecords,
  };

  return supabase;
}

describe('POST /api/admin/appointments — Price Adjustments Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('creates price adjustment records and updates total', async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      price_adjustments: [
        { label: 'Matting fee', amount: 15 },
        { label: 'Loyalty discount', amount: -5, note: 'Returning customer' },
      ],
    }));

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify price adjustment inserts were called (2 adjustments)
    const adjInserts = supabase._insertedRecords['appointment_price_adjustments'] || [];
    // Each adjustment produces one insert call; verify all data was recorded
    const allAdjData = adjInserts.flat();
    expect(allAdjData).toHaveLength(2);
    expect(allAdjData[0]).toMatchObject({ label: 'Matting fee', amount: 15 });
    expect(allAdjData[1]).toMatchObject({ label: 'Loyalty discount', amount: -5 });

    // Verify total_price was updated (appointments update call)
    const aptUpdates = supabase._updatedRecords['appointments'] || [];
    expect(aptUpdates).toHaveLength(1);
    // Original total (55) + adjustments (15 - 5) = 65
    expect(aptUpdates[0].data).toEqual({ total_price: 65 });
  });

  it('does not insert adjustments or update total when array is empty', async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      price_adjustments: [],
    }));

    expect(response.status).toBe(201);

    const adjInserts = supabase._insertedRecords['appointment_price_adjustments'] || [];
    expect(adjInserts).toHaveLength(0);
    const aptUpdates = supabase._updatedRecords['appointments'] || [];
    expect(aptUpdates).toHaveLength(0);
  });
});

describe('POST /api/admin/appointments — Backdated Status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('creates appointment with status "completed" for past date', async () => {
    const pastAppointment = { ...mockAppointment, status: 'completed' };
    const supabase = createSupabaseMock({ appointmentData: pastAppointment });
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      appointment_date: '2020-01-15',
      appointment_time: '10:00',
    }));

    expect(response.status).toBe(201);

    // Verify the insert was called with status 'completed'
    const aptInserts = supabase._insertedRecords['appointments'] || [];
    expect(aptInserts).toHaveLength(1);
    expect((aptInserts[0] as any).status).toBe('completed');
  });

  it('creates appointment with status "in_progress" for walk_in source', async () => {
    const walkinAppointment = { ...mockAppointment, status: 'in_progress' };
    const supabase = createSupabaseMock({ appointmentData: walkinAppointment });
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      source: 'walk_in',
      appointment_date: '2020-01-15',
      appointment_time: '10:00',
    }));

    expect(response.status).toBe(201);

    const aptInserts = supabase._insertedRecords['appointments'] || [];
    expect(aptInserts).toHaveLength(1);
    expect((aptInserts[0] as any).status).toBe('in_progress');
  });

  it('creates appointment with status "pending" for future date', async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      appointment_date: '2099-12-31',
      appointment_time: '10:00',
    }));

    expect(response.status).toBe(201);

    const aptInserts = supabase._insertedRecords['appointments'] || [];
    expect(aptInserts).toHaveLength(1);
    expect((aptInserts[0] as any).status).toBe('pending');
  });
});

describe('GET /api/admin/appointments/conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('returns conflict count and appointments', async () => {
    const conflictData = [
      {
        id: 'apt-1',
        status: 'confirmed',
        customer: { first_name: 'Alice', last_name: 'Smith' },
        service: { name: 'Basic Grooming' },
      },
      {
        id: 'apt-2',
        status: 'pending',
        customer: { first_name: 'Bob', last_name: 'Jones' },
        service: { name: 'Premium Grooming' },
      },
    ];

    const makeChain = (resolveWith: any) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.not = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.then = (r: any) => Promise.resolve(resolveWith).then(r);
      return chain;
    };

    const supabase = {
      from: vi.fn().mockReturnValue(
        makeChain({ data: conflictData, error: null })
      ),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/appointments/conflicts?date=2026-04-15&time=10:00'
    );
    const response = await GETConflicts(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
    expect(data.appointments).toHaveLength(2);
    expect(data.appointments[0].customer_name).toBe('Alice Smith');
    expect(data.appointments[1].service_name).toBe('Premium Grooming');
  });

  it('returns 400 when date or time is missing', async () => {
    const supabase = { from: vi.fn() };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/appointments/conflicts?date=2026-04-15'
    );
    const response = await GETConflicts(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid date format', async () => {
    const supabase = { from: vi.fn() };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/appointments/conflicts?date=15-04-2026&time=10:00'
    );
    const response = await GETConflicts(request);

    expect(response.status).toBe(400);
  });

  it('returns empty when no conflicts exist', async () => {
    const makeChain = (resolveWith: any) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.not = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.then = (r: any) => Promise.resolve(resolveWith).then(r);
      return chain;
    };

    const supabase = {
      from: vi.fn().mockReturnValue(
        makeChain({ data: [], error: null })
      ),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const request = new NextRequest(
      'http://localhost:3000/api/admin/appointments/conflicts?date=2026-04-15&time=10:00'
    );
    const response = await GETConflicts(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(0);
    expect(data.appointments).toEqual([]);
  });
});

describe('POST /api/admin/appointments — Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
  });

  it('returns 400 for invalid price_adjustments (zero amount)', async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      price_adjustments: [{ label: 'Bad', amount: 0 }],
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid price_adjustments (empty label)', async () => {
    const supabase = createSupabaseMock();
    vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
    vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

    const response = await POST(makePostRequest({
      ...validBody,
      price_adjustments: [{ label: '', amount: 10 }],
    }));

    expect(response.status).toBe(400);
  });
});
