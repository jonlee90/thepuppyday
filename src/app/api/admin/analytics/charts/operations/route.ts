/**
 * Operational Metrics API Route
 * GET /api/admin/analytics/charts/operations
 * Task 0055: Fetch operational metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/analytics/charts/operations
 * Fetch operational KPIs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Check if we're in mock mode
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock operational metrics
      const mockMetrics = {
        addonAttachmentRate: 42.5,
        cancellationRate: 8.3,
        noShowRate: 3.2,
        avgAppointmentDuration: 75,
        groomerProductivity: 6.8,
      };

      return NextResponse.json({ data: mockMetrics });
    }

    // Production implementation
    // Fetch all appointments in period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allAppointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select(
        `
        id,
        status,
        scheduled_at,
        appointment_addons(id)
      `
      )
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    if (apptError) {
      throw new Error('Failed to fetch appointments');
    }

    const totalAppointments = allAppointments?.length || 0;

    // Calculate add-on attachment rate
    const appointmentsWithAddons = (allAppointments || []).filter(
      (apt: any) => apt.appointment_addons && apt.appointment_addons.length > 0
    ).length;
    const addonAttachmentRate =
      totalAppointments > 0 ? (appointmentsWithAddons / totalAppointments) * 100 : 0;

    // Calculate cancellation rate
    const cancelledAppointments = (allAppointments || []).filter(
      (apt: any) => apt.status === 'cancelled'
    ).length;
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;

    // Calculate no-show rate
    const noShowAppointments = (allAppointments || []).filter(
      (apt: any) => apt.status === 'no_show'
    ).length;
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0;

    // Calculate average appointment duration (mock value for now - would need actual duration tracking)
    // In a real system, this would come from check-in/check-out times or estimated service duration
    const avgAppointmentDuration = 75; // Default to 75 minutes

    // Calculate groomer productivity (appointments per day)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completedAppointments = (allAppointments || []).filter(
      (apt: any) => apt.status === 'completed'
    ).length;
    const groomerProductivity = periodDays > 0 ? completedAppointments / periodDays : 0;

    const metrics = {
      addonAttachmentRate: Math.round(addonAttachmentRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      avgAppointmentDuration,
      groomerProductivity: Math.round(groomerProductivity * 10) / 10,
    };

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching operational metrics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
