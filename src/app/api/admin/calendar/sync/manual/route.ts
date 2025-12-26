/**
 * Manual Sync Endpoint
 * POST endpoint to manually sync a single appointment to Google Calendar
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pushAppointmentToCalendar } from '@/lib/calendar/sync/push';
import { getActiveConnection } from '@/lib/calendar/connection';
import { manualSyncRequestSchema } from '@/types/calendar';
import type { ManualSyncResponse } from '@/types/calendar';

/**
 * POST /api/admin/calendar/sync/manual
 * Manually sync a single appointment to Google Calendar
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = manualSyncRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { appointmentId, force } = validation.data;

    // Check if calendar connection exists
    const connection = await getActiveConnection(supabase, user.id);

    if (!connection) {
      return NextResponse.json(
        {
          error: 'No active calendar connection found',
          message: 'Please connect Google Calendar first',
        },
        { status: 400 }
      );
    }

    // Fetch appointment with joined data
    const { data: appointment, error: appointmentError } = await supabase
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
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Transform to AppointmentForSync format
    const appointmentForSync = {
      id: appointment.id,
      customer_id: appointment.customer_id,
      pet_id: appointment.pet_id,
      service_id: appointment.service_id,
      scheduled_at: appointment.scheduled_at,
      status: appointment.status,
      notes: appointment.notes,
      customer: {
        first_name: appointment.customer.first_name,
        last_name: appointment.customer.last_name,
        email: appointment.customer.email,
        phone: appointment.customer.phone,
      },
      pet: {
        name: appointment.pet.name,
        size: appointment.pet.size,
      },
      service: {
        name: appointment.service.name,
        duration_minutes: appointment.service.duration_minutes,
      },
      addons: appointment.appointment_addons?.map((aa: any) => ({
        addon_id: aa.addon.id,
        addon_name: aa.addon.name,
        duration_minutes: aa.addon.duration_minutes,
      })) || [],
    };

    // Perform sync
    const syncResult = await pushAppointmentToCalendar(
      supabase,
      appointmentForSync,
      force
    );

    // Map sync result to response
    if (syncResult.success) {
      const response: ManualSyncResponse = {
        success: true,
        eventId: syncResult.google_event_id,
        operation: syncResult.operation === 'create'
          ? 'created'
          : syncResult.operation === 'update'
          ? 'updated'
          : syncResult.operation === 'delete'
          ? 'deleted'
          : 'skipped',
        message: `Appointment ${syncResult.operation}d successfully in Google Calendar`,
      };

      return NextResponse.json(response);
    } else {
      // Sync failed
      const errorMessage = syncResult.error?.message || 'Unknown error';
      const errorCode = syncResult.error?.code || 'SYNC_FAILED';

      // Check if it's a criteria error (not a failure, just skipped)
      if (errorCode === 'SYNC_CRITERIA_NOT_MET') {
        const response: ManualSyncResponse = {
          success: true,
          operation: 'skipped',
          message: errorMessage,
        };

        return NextResponse.json(response);
      }

      return NextResponse.json(
        {
          error: 'Sync failed',
          message: errorMessage,
          code: errorCode,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Manual sync endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
