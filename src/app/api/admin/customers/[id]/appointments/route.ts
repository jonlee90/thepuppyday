/**
 * Customer Appointments API Route
 * GET /api/admin/customers/[id]/appointments - Get all appointments for a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get all appointments for a customer
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id: customerId } = await context.params;

    // Fetch all appointments for this customer
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('customer_id', customerId)
      .order('scheduled_at', { ascending: false });

    if (appointmentsError) {
      console.error('[Customer Appointments API] Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Fetch related data
    const appointmentIds = (appointments || []).map((a: any) => a.id);

    // Fetch pets
    const petIds = [...new Set((appointments || []).map((a: any) => a.pet_id))];
    const { data: pets } = await (supabase as any)
      .from('pets')
      .select('*')
      .in('id', petIds.length > 0 ? petIds : ['']);

    // Fetch services
    const serviceIds = [...new Set((appointments || []).map((a: any) => a.service_id))];
    const { data: services } = await (supabase as any)
      .from('services')
      .select('*')
      .in('id', serviceIds.length > 0 ? serviceIds : ['']);

    // Fetch addons
    const { data: appointmentAddons } = await (supabase as any)
      .from('appointment_addons')
      .select('*, addon:addons(*)')
      .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['']);

    // Fetch report cards
    const { data: reportCards } = await (supabase as any)
      .from('report_cards')
      .select('*')
      .in('appointment_id', appointmentIds.length > 0 ? appointmentIds : ['']);

    // Build appointment details
    const appointmentsWithDetails = (appointments || []).map((appointment: any) => {
      const pet = (pets || []).find((p: any) => p.id === appointment.pet_id);
      const service = (services || []).find((s: any) => s.id === appointment.service_id);
      const addons = (appointmentAddons || []).filter(
        (aa: any) => aa.appointment_id === appointment.id
      );
      const reportCard = (reportCards || []).find(
        (rc: any) => rc.appointment_id === appointment.id
      );

      return {
        ...appointment,
        pet,
        service,
        addons,
        report_card: reportCard || null,
      };
    });

    return NextResponse.json({ data: appointmentsWithDetails });
  } catch (error) {
    console.error('[Customer Appointments API] GET error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
