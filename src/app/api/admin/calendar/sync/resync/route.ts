/**
 * Calendar Sync Resync Endpoint
 * POST endpoint to force resync (delete + recreate event)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/calendar/connection';
import { createGoogleCalendarClient } from '@/lib/calendar/google-client';
import { mapAppointmentToEvent } from '@/lib/calendar/mapping';
import {
  getEventMappingByAppointmentId,
  deleteEventMapping,
  createEventMapping,
} from '@/lib/calendar/event-mapping-repository';
import { logSync } from '@/lib/calendar/sync-logger';

/**
 * POST /api/admin/calendar/sync/resync
 * Force resync (delete + recreate event)
 *
 * Body:
 * {
 *   "appointmentId": "uuid",
 *   "force": true
 * }
 */
export async function POST(request: Request) {
  const startTime = Date.now();

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

    // Parse request body
    const body = await request.json();
    const { appointmentId, force } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Invalid request: appointmentId is required' },
        { status: 400 }
      );
    }

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, user.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'No active calendar connection found' },
        { status: 404 }
      );
    }

    // Fetch appointment data with all required joins
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        pet_id,
        service_id,
        scheduled_at,
        status,
        notes,
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

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: `Appointment not found: ${appointmentId}` },
        { status: 404 }
      );
    }

    // Create Google Calendar client
    const client = createGoogleCalendarClient(
      supabase,
      connection.id,
      connection.calendar_id
    );

    // Get existing event mapping (if any)
    const existingMapping = await getEventMappingByAppointmentId(supabase, appointmentId);

    // Step 1: Delete existing event from Google Calendar
    if (existingMapping) {
      try {
        console.log(`[Resync API] Deleting existing event ${existingMapping.google_event_id}`);
        await client.deleteEvent(existingMapping.google_event_id);
      } catch (error) {
        // Log warning but continue - event might already be deleted
        console.warn('[Resync API] Failed to delete existing event (might not exist):', error);
      }

      // Delete event mapping
      await deleteEventMapping(supabase, appointmentId);
    }

    // Step 2: Create new event in Google Calendar
    const eventData = mapAppointmentToEvent({
      ...appointment,
      customer: Array.isArray(appointment.customer)
        ? appointment.customer[0]
        : appointment.customer,
      pet: Array.isArray(appointment.pet) ? appointment.pet[0] : appointment.pet,
      service: Array.isArray(appointment.service)
        ? appointment.service[0]
        : appointment.service,
      addons: appointment.appointment_addons?.map((aa: any) => ({
        addon_id: aa.addon.id,
        addon_name: aa.addon.name,
        duration_minutes: aa.addon.duration_minutes,
      })) || [],
    });

    const createdEvent = await client.createEvent(eventData);

    if (!createdEvent.id) {
      throw new Error('No event ID returned from Google Calendar');
    }

    // Step 3: Create new event mapping
    await createEventMapping(supabase, {
      appointment_id: appointmentId,
      connection_id: connection.id,
      google_event_id: createdEvent.id,
      sync_direction: 'push',
    });

    // Log success
    await logSync(supabase, {
      connection_id: connection.id,
      sync_type: 'push',
      operation: 'create',
      appointment_id: appointmentId,
      google_event_id: createdEvent.id,
      status: 'success',
      error_message: null,
      error_code: null,
      details: {
        resync: true,
        force,
        previous_event_id: existingMapping?.google_event_id,
      },
      duration_ms: Date.now() - startTime,
    });

    console.log(`[Resync API] Successfully resynced appointment ${appointmentId} (event: ${createdEvent.id})`);

    return NextResponse.json({
      success: true,
      message: 'Event successfully resynced',
      googleEventId: createdEvent.id,
      previousEventId: existingMapping?.google_event_id,
    });
  } catch (error) {
    console.error('[Resync API] Error during resync:', error);

    // Log failure
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const connection = await getActiveConnection(supabase, user.id);

        if (connection) {
          await logSync(supabase, {
            connection_id: connection.id,
            sync_type: 'push',
            operation: 'create',
            appointment_id: null,
            google_event_id: null,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            error_code: 'RESYNC_FAILED',
            details: { resync: true },
            duration_ms: Date.now() - startTime,
          });
        }
      }
    } catch (logError) {
      console.error('[Resync API] Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        error: 'Failed to resync event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
