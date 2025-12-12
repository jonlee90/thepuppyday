/**
 * Admin Appointment Detail API Route
 * GET /api/admin/appointments/[id] - Get appointment details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Appointment, User, Pet, Service, Addon, CustomerFlag, AppointmentAddon } from '@/types/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      const appointment = store.selectById('appointments', id) as Appointment | null;

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Enrich with related data
      const customer = store.selectById('users', appointment.customer_id) as User | null;
      const pet = store.selectById('pets', appointment.pet_id) as Pet | null;
      const service = store.selectById('services', appointment.service_id) as Service | null;
      const groomer = appointment.groomer_id
        ? (store.selectById('users', appointment.groomer_id) as User | null)
        : null;

      // Get appointment add-ons
      const appointmentAddons = store
        .select('appointment_addons')
        .filter((aa: any) => aa.appointment_id === id);

      const addonsWithDetails = appointmentAddons.map((aa: any) => ({
        ...aa,
        addon: store.selectById('addons', aa.addon_id),
      }));

      // Get customer flags
      const customerFlags = customer
        ? store
            .select('customer_flags')
            .filter((cf: any) => cf.customer_id === customer.id && cf.is_active)
        : [];

      const enrichedAppointment = {
        ...appointment,
        customer,
        pet,
        service,
        groomer,
        addons: addonsWithDetails,
        customer_flags: customerFlags,
      };

      return NextResponse.json({ data: enrichedAppointment });
    }

    // Production Supabase query
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select(
        `
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(*),
        groomer:users!groomer_id(*),
        addons:appointment_addons(
          *,
          addon:addons(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Admin API] Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get customer flags
    const { data: customerFlags } = await (supabase as any)
      .from('customer_flags')
      .select('*')
      .eq('customer_id', data.customer_id)
      .eq('is_active', true);

    const enrichedAppointment = {
      ...data,
      customer_flags: customerFlags || [],
    };

    return NextResponse.json({ data: enrichedAppointment });
  } catch (error) {
    console.error('[Admin API] Error in appointment detail route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
