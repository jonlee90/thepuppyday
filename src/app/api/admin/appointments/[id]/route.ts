/**
 * Admin Appointment Detail API Route
 * GET /api/admin/appointments/[id] - Get appointment details
 * PUT /api/admin/appointments/[id] - Update appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient, type AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Appointment, User, Pet, Service, Addon } from '@/types/database';

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

    // Verify admin authentication with regular client
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

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
        ? store.select('service_prices').filter((sp: { service_id: string }) => sp.service_id === serviceData.id)
        : [];
      const service = serviceData ? { ...serviceData, prices: servicePrices } : null;

      // Get appointment add-ons from the junction table
      // Note: We need to get ALL records first, then filter by appointment_id
      const allAppointmentAddons = store.select<Record<string, unknown>>('appointment_addons');
      const appointmentAddons = allAppointmentAddons.filter(
        (aa) => aa.appointment_id === id
      );

      // Enrich each appointment_addon with its addon details
      const addonsWithDetails = appointmentAddons.map((aa) => {
        const addonId = aa.addon_id as string;
        const addon = store.selectById('addons', addonId);
        return {
          id: aa.id as string,
          appointment_id: aa.appointment_id as string,
          addon_id: addonId,
          price: aa.price as number,
          created_at: aa.created_at as string,
          addon: addon,
        };
      });

      console.log(`[ADDONS TEST] Appointment ${id} has ${addonsWithDetails.length} add-ons:`,
        addonsWithDetails.map(a => ({ name: a.addon?.name, price: a.price })));

      // Get customer flags
      const customerFlags = customer
        ? store
            .select('customer_flags')
            .filter((cf: { customer_id: string; is_active: boolean }) => cf.customer_id === customer.id && cf.is_active)
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

    // Production Supabase query - Use service role client to bypass RLS
    const supabase = createServiceRoleClient();
    const { data, error } = await (supabase as AppSupabaseClient)
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

    // DEBUG: Log what Supabase returned for addons
    console.log(`[ADDONS DEBUG] Appointment ${id} Supabase response:`, {
      hasAddons: !!data.addons,
      addonsType: Array.isArray(data.addons) ? 'array' : typeof data.addons,
      addonsLength: data.addons?.length,
      addons: JSON.stringify(data.addons)
    });

    // Get customer flags
    const { data: customerFlags } = await (supabase as AppSupabaseClient)
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

        const existingAppointments = store.select('appointments').filter((apt: {
          id: string;
          status: string;
          scheduled_at: string;
          duration_minutes: number;
        }) => {
          if (apt.id === id) return false; // Exclude current appointment
          if (!['pending', 'confirmed', 'in_progress'].includes(apt.status)) return false;
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
      store.update('appointments', id, updates);

      const updatedAppointment = store.selectById('appointments', id) as Appointment | null;

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
          (aa: { appointment_id: string; id: string }) => aa.appointment_id === id
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
        ? store.select('service_prices').filter((sp: { service_id: string }) => sp.service_id === serviceData.id)
        : [];
      const service = serviceData ? { ...serviceData, prices: servicePrices } : null;

      // Get appointment add-ons from the junction table
      const allAppointmentAddons = store.select<Record<string, unknown>>('appointment_addons');
      const appointmentAddons = allAppointmentAddons.filter(
        (aa) => aa.appointment_id === id
      );

      // Enrich each appointment_addon with its addon details
      const addonsWithDetails = appointmentAddons.map((aa) => {
        const addonId = aa.addon_id as string;
        const addon = store.selectById('addons', addonId);
        return {
          id: aa.id as string,
          appointment_id: aa.appointment_id as string,
          addon_id: addonId,
          price: aa.price as number,
          created_at: aa.created_at as string,
          addon: addon,
        };
      });

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
    const { data: existingAppointment, error: fetchError } = await (supabase as AppSupabaseClient)
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

      const { data: existingAppointments } = await (supabase as AppSupabaseClient)
        .from('appointments')
        .select('id, scheduled_at, duration_minutes')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed', 'in_progress'])
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
    const { error: updateError } = await (supabase as AppSupabaseClient)
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
      await (supabase as AppSupabaseClient)
        .from('appointment_addons')
        .delete()
        .eq('appointment_id', id);

      // Insert new appointment_addons
      if (addon_ids.length > 0) {
        // Get addon prices
        const { data: addons } = await (supabase as AppSupabaseClient)
          .from('addons')
          .select('id, price')
          .in('id', addon_ids);

        const newAddons = (addons || []).map((addon: Addon) => ({
          appointment_id: id,
          addon_id: addon.id,
          price: addon.price,
        }));

        if (newAddons.length > 0) {
          await (supabase as AppSupabaseClient)
            .from('appointment_addons')
            .insert(newAddons);
        }
      }
    }

    // Fetch enriched data for response
    const { data: enrichedData } = await (supabase as AppSupabaseClient)
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

    // Trigger calendar sync (auto-sync) - Task 0026
    // This runs asynchronously and won't block the response
    try {
      const { triggerAutoSyncInBackground } = await import(
        '@/lib/calendar/sync/auto-sync-trigger'
      );

      // Fetch appointment with joined data for sync
      const { data: appointmentForSync } = await (supabase as AppSupabaseClient)
        .from('appointments')
        .select(`
          *,
          customer:users!customer_id (
            first_name,
            last_name,
            email,
            phone
          ),
          pet:pets (
            name,
            size
          ),
          service:services (
            name,
            duration_minutes
          ),
          appointment_addons (
            addon:addons (
              id,
              name,
              duration_minutes
            )
          )
        `)
        .eq('id', id)
        .single();

      if (appointmentForSync) {
        // Transform to AppointmentForSync format
        const syncData = {
          id: appointmentForSync.id,
          customer_id: appointmentForSync.customer_id,
          pet_id: appointmentForSync.pet_id,
          service_id: appointmentForSync.service_id,
          scheduled_at: appointmentForSync.scheduled_at,
          status: appointmentForSync.status,
          notes: appointmentForSync.notes,
          customer: {
            first_name: appointmentForSync.customer.first_name,
            last_name: appointmentForSync.customer.last_name,
            email: appointmentForSync.customer.email,
            phone: appointmentForSync.customer.phone,
          },
          pet: {
            name: appointmentForSync.pet.name,
            size: appointmentForSync.pet.size,
          },
          service: {
            name: appointmentForSync.service.name,
            duration_minutes: appointmentForSync.service.duration_minutes,
          },
          addons: appointmentForSync.appointment_addons?.map((aa: {
            addon: {
              id: string;
              name: string;
              duration_minutes: number;
            };
          }) => ({
            addon_id: aa.addon.id,
            addon_name: aa.addon.name,
            duration_minutes: aa.addon.duration_minutes,
          })) || [],
        };

        // Trigger sync in background (fire and forget)
        triggerAutoSyncInBackground(supabase, syncData);
      }
    } catch (syncError) {
      // Log error but don't fail the request
      console.error('[Admin API] Calendar sync error:', syncError);
    }

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
