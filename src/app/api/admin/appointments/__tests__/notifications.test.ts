/**
 * Phase E Task 0114: Admin Appointment Notification Integration Tests
 * POST /api/admin/appointments
 *
 * Tests that triggerBookingConfirmation is called (or not called) based on
 * the send_notification flag and customer active status.
 * Verifies that notification failure does NOT break appointment creation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/admin/appointments/route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { triggerBookingConfirmation } from '@/lib/notifications/triggers/booking-confirmation';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));
vi.mock('@/lib/admin/auth');
vi.mock('@/lib/notifications/triggers/booking-confirmation', () => ({
  triggerBookingConfirmation: vi.fn(),
}));
// Mock calculatePrice to avoid pricing logic complexity
vi.mock('@/lib/booking/pricing', () => ({
  calculatePrice: vi.fn().mockReturnValue({
    servicePrice: 70,
    addonsTotal: 0,
    total: 70,
  }),
}));
// Mock calendar auto-sync to avoid import issues
vi.mock('@/lib/calendar/sync/auto-sync-trigger', () => ({
  triggerAutoSyncInBackground: vi.fn().mockResolvedValue(undefined),
}));
// Mock generateWalkinEmail
vi.mock('@/lib/utils', () => ({
  generateWalkinEmail: vi.fn().mockReturnValue('walkin@puppyday.com'),
}));

describe('Admin Appointments POST — Notification Integration', () => {
  const mockAdmin = {
    user: { id: 'admin-1', email: 'admin@test.com' },
    role: 'admin' as const,
  };

  // UUIDs for test data
  const existingCustomerId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const existingPetId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
  const serviceId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
  const appointmentId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

  // The mock appointment returned after insert
  const mockAppointment = {
    id: appointmentId,
    customer_id: existingCustomerId,
    pet_id: existingPetId,
    service_id: serviceId,
    scheduled_at: '2025-12-20T10:00:00Z',
    total_price: 70,
    status: 'confirmed',
    booking_reference: 'APT-2025-000001',
  };

  const mockService = {
    id: serviceId,
    name: 'Premium Grooming',
    service_prices: [{ pet_size: 'medium', price: 70 }],
    duration_minutes: 90,
  };

  // Valid appointment body with an existing customer
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
    appointment_date: '2025-12-20',
    appointment_time: '10:00',
    addon_ids: [],
    send_notification: true,
  };

  /**
   * Create a chainable Supabase mock that supports the common .from().select()...
   * chain used throughout the appointments route.
   *
   * This mock tracks the "from" table and returns appropriate data.
   */
  function createSupabaseMock(overrides: {
    customerStatus?: 'active' | 'inactive';
    appointmentInsert?: object;
    serviceData?: object;
  } = {}) {
    const {
      customerStatus = 'active',
      appointmentInsert = mockAppointment,
      serviceData = mockService,
    } = overrides;

    const makeChain = (resolveWith: { data: unknown; error: unknown }) => {
      const chain: any = {};
      const resolve = () => Promise.resolve(resolveWith);

      // All the chainable methods that eventually resolve
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.ilike = vi.fn().mockReturnValue(chain);
      chain.maybeSingle = vi.fn().mockImplementation(resolve);
      chain.single = vi.fn().mockImplementation(resolve);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.gte = vi.fn().mockReturnValue(chain);
      chain.lte = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.neq = vi.fn().mockReturnValue(chain);
      chain.not = vi.fn().mockReturnValue(chain);
      // Allow chain to be awaited directly
      chain.then = (resolve2: any) => Promise.resolve(resolveWith).then(resolve2);

      return chain;
    };

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        switch (table) {
          case 'users':
            // Return customer with appropriate status
            return makeChain({
              data: {
                id: existingCustomerId,
                is_active: customerStatus === 'active',
                role: 'customer',
              },
              error: null,
            });

          case 'pets':
            return makeChain({
              data: { id: existingPetId, name: 'Buddy', size: 'medium', customer_id: existingCustomerId },
              error: null,
            });

          case 'services': {
            const chain = makeChain({ data: serviceData, error: null });
            return chain;
          }

          case 'appointments': {
            // Support both insert (returns appointment) and select queries
            const chain: any = {};
            const notFoundResult = { data: null, error: { code: 'PGRST116' } };
            chain.select = vi.fn().mockReturnValue(chain);
            chain.eq = vi.fn().mockReturnValue(chain);
            chain.neq = vi.fn().mockReturnValue(chain);
            chain.not = vi.fn().mockReturnValue(chain);
            chain.order = vi.fn().mockReturnValue(chain);
            chain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
            // maybeSingle resolves to null (booking_reference not found = unique)
            chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            chain.single = vi.fn().mockResolvedValue(notFoundResult);
            chain.insert = vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: appointmentInsert, error: null }),
              }),
            });
            chain.then = (resolve: any) =>
              Promise.resolve(notFoundResult).then(resolve);
            return chain;
          }

          case 'payments':
            return makeChain({ data: null, error: null });

          default:
            return makeChain({ data: null, error: null });
        }
      }),
    };

    return supabase;
  }

  function makeRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/admin/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
    vi.mocked(triggerBookingConfirmation).mockResolvedValue({
      success: true,
      emailSent: true,
      smsSent: false,
      errors: [],
    });
  });

  describe('Notification trigger behavior', () => {
    it('calls triggerBookingConfirmation when send_notification=true and customer is active', async () => {
      const supabase = createSupabaseMock({ customerStatus: 'active' });
      vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
      vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

      const response = await POST(makeRequest({ ...validBody, send_notification: true }));

      // Appointment should be created successfully
      expect(response.status).toBe(201);

      // triggerBookingConfirmation should have been called
      expect(triggerBookingConfirmation).toHaveBeenCalledWith(
        expect.anything(), // supabase client
        expect.objectContaining({
          appointmentId: mockAppointment.id,
          customerId: existingCustomerId,
          customerName: 'Alice Smith',
          customerEmail: 'alice@example.com',
          customerPhone: '+15551234567',
          petName: 'Buddy',
          serviceName: 'Premium Grooming',
        })
      );
    });

    it('does NOT call triggerBookingConfirmation when send_notification=false', async () => {
      const supabase = createSupabaseMock({ customerStatus: 'active' });
      vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
      vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

      const response = await POST(makeRequest({ ...validBody, send_notification: false }));

      expect(response.status).toBe(201);
      expect(triggerBookingConfirmation).not.toHaveBeenCalled();
    });

    it('does NOT call triggerBookingConfirmation when customer status is inactive', async () => {
      const supabase = createSupabaseMock({ customerStatus: 'inactive' });
      vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
      vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

      const response = await POST(makeRequest({ ...validBody, send_notification: true }));

      expect(response.status).toBe(201);
      expect(triggerBookingConfirmation).not.toHaveBeenCalled();
    });

    it('appointment creation succeeds even if triggerBookingConfirmation throws', async () => {
      const supabase = createSupabaseMock({ customerStatus: 'active' });
      vi.mocked(createServerSupabaseClient).mockResolvedValue(supabase as any);
      vi.mocked(createServiceRoleClient).mockReturnValue(supabase as any);

      // Make the notification trigger throw
      vi.mocked(triggerBookingConfirmation).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await POST(makeRequest({ ...validBody, send_notification: true }));
      const data = await response.json();

      // Appointment should still be created successfully despite notification failure
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.appointment_id).toBeDefined();
    });
  });
});
