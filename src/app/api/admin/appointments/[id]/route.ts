/**
 * Admin Appointment Detail API Route
 * GET /api/admin/appointments/[id] - Get appointment details
 * PUT /api/admin/appointments/[id] - Update appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Appointment, User, Pet, Service, Addon, CustomerFlag, AppointmentAddon } from '@/types/database';

interface AppointmentUpdateRequest {
  scheduled_at?: string;
  duration_minutes?: number;
  service_id?: string;
  groomer_id?: string | null;
  notes?: string;
  admin_notes?: string;
  addon_ids?: string[];
}

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
      const serviceData = store.selectById('services', appointment.service_id) as Service | null;
      const groomer = appointment.groomer_id
        ? (store.selectById('users', appointment.groomer_id) as User | null)
        : null;

      // Get service prices
      const servicePrices = serviceData
        ? store.select('service_prices').filter((sp: any) => sp.service_id === serviceData.id)
        : [];
      const service = serviceData ? { ...serviceData, prices: servicePrices } : null;

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
        service:services(
          *,
          prices:service_prices(*)
        ),
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

/**
 * PUT handler for updating appointment
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient();

    const body: AppointmentUpdateRequest = await request.json();
    const {
      scheduled_at,
      duration_minutes,
      service_id,
      groomer_id,
      notes,
      admin_notes,
      addon_ids,
    } = body;

    // In mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const { generateId } = await import('@/mocks/supabase/seed');
      const store = getMockStore();

      const appointment = store.selectById('appointments', id) as Appointment | null;

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Check availability if changing date/time
      if (scheduled_at && scheduled_at !== appointment.scheduled_at) {
        const newDate = new Date(scheduled_at);
        const checkDuration = duration_minutes || appointment.duration_minutes;

        // Get existing appointments on that day (excluding current appointment)
        const startOfDay = new Date(newDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(newDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = store.select('appointments').filter((apt: any) => {
          if (apt.id === id) return false; // Exclude current appointment
          if (!['pending', 'confirmed', 'checked_in', 'in_progress'].includes(apt.status)) return false;
          const aptDate = new Date(apt.scheduled_at);
          return aptDate >= startOfDay && aptDate <= endOfDay;
        });

        // Check for overlap with existing appointments
        const newStart = newDate.getTime();
        const newEnd = newStart + (checkDuration * 60000);

        for (const apt of existingAppointments) {
          const aptStart = new Date(apt.scheduled_at).getTime();
          const aptEnd = aptStart + (apt.duration_minutes * 60000);

          // Check for overlap
          if (newStart < aptEnd && newEnd > aptStart) {
            return NextResponse.json(
              { error: 'Time slot is not available. There is a conflicting appointment.' },
              { status: 400 }
            );
          }
        }
      }

      // Build update object
      const updates: Partial<Appointment> = {
        updated_at: new Date().toISOString(),
      };

      if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
      if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
      if (service_id !== undefined) updates.service_id = service_id;
      if (groomer_id !== undefined) updates.groomer_id = groomer_id;
      if (notes !== undefined) updates.notes = notes;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      // Update appointment
      const updatedAppointment = store.update('appointments', id, updates) as Appointment | null;

      if (!updatedAppointment) {
        return NextResponse.json(
          { error: 'Failed to update appointment' },
          { status: 500 }
        );
      }

      // Handle addon changes if provided
      if (addon_ids !== undefined) {
        // Delete existing appointment_addons
        const existingAddons = store.select('appointment_addons').filter(
          (aa: any) => aa.appointment_id === id
        );
        for (const aa of existingAddons) {
          store.delete('appointment_addons', aa.id);
        }

        // Insert new appointment_addons
        for (const addonId of addon_ids) {
          const addon = store.selectById('addons', addonId) as Addon | null;
          if (addon) {
            store.insert('appointment_addons', {
              id: generateId(),
              appointment_id: id,
              addon_id: addonId,
              price: addon.price,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // Fetch enriched data for response
      const customer = store.selectById('users', updatedAppointment.customer_id) as User | null;
      const pet = store.selectById('pets', updatedAppointment.pet_id) as Pet | null;
      const serviceData = store.selectById('services', updatedAppointment.service_id) as Service | null;
      const groomer = updatedAppointment.groomer_id
        ? (store.selectById('users', updatedAppointment.groomer_id) as User | null)
        : null;

      // Get service prices
      const servicePrices = serviceData
        ? store.select('service_prices').filter((sp: any) => sp.service_id === serviceData.id)
        : [];
      const service = serviceData ? { ...serviceData, prices: servicePrices } : null;

      // Get appointment add-ons
      const appointmentAddons = store
        .select('appointment_addons')
        .filter((aa: any) => aa.appointment_id === id);

      const addonsWithDetails = appointmentAddons.map((aa: any) => ({
        ...aa,
        addon: store.selectById('addons', aa.addon_id),
      }));

      const enrichedAppointment = {
        ...updatedAppointment,
        customer,
        pet,
        service,
        groomer,
        addons: addonsWithDetails,
      };

      return NextResponse.json({
        data: enrichedAppointment,
        message: 'Appointment updated successfully',
      });
    }

    // Production Supabase update
    // First fetch existing appointment
    const { data: existingAppointment, error: fetchError } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check availability if changing date/time
    if (scheduled_at && scheduled_at !== existingAppointment.scheduled_at) {
      const newDate = new Date(scheduled_at);
      const checkDuration = duration_minutes || existingAppointment.duration_minutes;

      // Get existing appointments on that day (excluding current)
      const startOfDay = new Date(newDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(newDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments } = await (supabase as any)
        .from('appointments')
        .select('id, scheduled_at, duration_minutes')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress'])
        .neq('id', id);

      // Check for overlap
      const newStart = newDate.getTime();
      const newEnd = newStart + (checkDuration * 60000);

      for (const apt of (existingAppointments || [])) {
        const aptStart = new Date(apt.scheduled_at).getTime();
        const aptEnd = aptStart + (apt.duration_minutes * 60000);

        if (newStart < aptEnd && newEnd > aptStart) {
          return NextResponse.json(
            { error: 'Time slot is not available. There is a conflicting appointment.' },
            { status: 400 }
          );
        }
      }
    }

    // Build update object
    const updates: Partial<Appointment> = {
      updated_at: new Date().toISOString(),
    };

    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (service_id !== undefined) updates.service_id = service_id;
    if (groomer_id !== undefined) updates.groomer_id = groomer_id;
    if (notes !== undefined) updates.notes = notes;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    // Update appointment
    const { data: updatedAppointment, error: updateError } = await (supabase as any)
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Admin API] Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Handle addon changes if provided
    if (addon_ids !== undefined) {
      // Delete existing appointment_addons
      await (supabase as any)
        .from('appointment_addons')
        .delete()
        .eq('appointment_id', id);

      // Insert new appointment_addons
      if (addon_ids.length > 0) {
        // Get addon prices
        const { data: addons } = await (supabase as any)
          .from('addons')
          .select('id, price')
          .in('id', addon_ids);

        const newAddons = (addons || []).map((addon: any) => ({
          appointment_id: id,
          addon_id: addon.id,
          price: addon.price,
        }));

        if (newAddons.length > 0) {
          await (supabase as any)
            .from('appointment_addons')
            .insert(newAddons);
        }
      }
    }

    // Fetch enriched data for response
    const { data: enrichedData } = await (supabase as any)
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(
          *,
          prices:service_prices(*)
        ),
        groomer:users!groomer_id(*),
        addons:appointment_addons(
          *,
          addon:addons(*)
        )
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      data: enrichedData,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error in appointment update route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
