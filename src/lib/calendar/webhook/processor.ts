/**
 * Webhook Event Processor
 * Processes webhook notifications and syncs changes from Google Calendar
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GoogleCalendarEvent, AppointmentForSync } from '@/types/calendar';
import { createGoogleCalendarClient } from '../google-client';
import { getEventMappingByEventId } from '../event-mapping-repository';
import { mapAppointmentToEvent } from '../mapping';

/**
 * Conflict detection result
 */
interface ConflictDetection {
  hasConflict: boolean;
  reason?: string;
  calendarUpdated?: Date;
  appointmentUpdated?: Date;
}

/**
 * Event change processing result
 */
interface EventChangeResult {
  success: boolean;
  operation: 'created' | 'updated' | 'deleted' | 'recreated' | 'skipped';
  eventId: string;
  appointmentId?: string;
  error?: string;
  conflictResolved?: boolean;
}

/**
 * Process webhook notification from Google Calendar
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param resourceState - Resource state from webhook (sync, exists, not_exists)
 * @returns Processing results
 *
 * @example
 * ```typescript
 * const results = await processWebhookNotification(supabase, connectionId, 'exists');
 * console.log(`Processed ${results.length} events`);
 * ```
 */
export async function processWebhookNotification(
  supabase: SupabaseClient,
  connectionId: string,
  resourceState: string
): Promise<EventChangeResult[]> {
  const results: EventChangeResult[] = [];
  const startTime = Date.now();

  try {
    console.log(`Processing webhook notification for connection ${connectionId}`);

    // Get connection details
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('calendar_id')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error(`Connection not found: ${connectionError?.message || 'Unknown error'}`);
    }

    // Create Google Calendar client
    const client = createGoogleCalendarClient(
      supabase,
      connectionId,
      connection.calendar_id
    );

    // Fetch recent changes from Google Calendar
    // Use incremental sync to get only changes since last webhook
    const recentEvents = await fetchRecentChanges(client, connection.calendar_id);

    console.log(`Found ${recentEvents.length} events to process`);

    // Process each event
    for (const event of recentEvents) {
      try {
        const result = await handleEventChange(supabase, connectionId, event);
        results.push(result);
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        results.push({
          success: false,
          operation: 'skipped',
          eventId: event.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update last sync timestamp
    await supabase
      .from('calendar_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);

    // Log webhook processing to sync log
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'update',
        status: failureCount === 0 ? 'success' : failureCount === results.length ? 'failed' : 'partial',
        duration_ms: Date.now() - startTime,
        details: {
          resource_state: resourceState,
          events_processed: results.length,
          successful: successCount,
          failed: failureCount,
          results: results,
        },
      });

    console.log(`Webhook processing completed: ${successCount} succeeded, ${failureCount} failed`);

    return results;
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log error to sync log
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'update',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'WEBHOOK_PROCESSING_ERROR',
        duration_ms: Date.now() - startTime,
      });

    throw error;
  }
}

/**
 * Fetch recent changes from Google Calendar
 *
 * @param client - Google Calendar client
 * @param calendarId - Google Calendar ID
 * @returns Array of recent calendar events
 */
async function fetchRecentChanges(
  client: ReturnType<typeof createGoogleCalendarClient>,
  _calendarId: string
): Promise<GoogleCalendarEvent[]> {
  try {
    // Fetch events from the last 7 days (webhook expiration period)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const events = await client.listEvents({
      timeMin: sevenDaysAgo.toISOString(),
      maxResults: 100,
    });

    return events;
  } catch (error) {
    console.error('Error fetching recent changes:', error);
    throw new Error(
      `Failed to fetch recent changes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle individual event change from Google Calendar
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param calendarEvent - Google Calendar event
 * @returns Event change result
 */
async function handleEventChange(
  supabase: SupabaseClient,
  connectionId: string,
  calendarEvent: GoogleCalendarEvent
): Promise<EventChangeResult> {
  try {
    // Check if event is mapped to an appointment
    const mapping = await getEventMappingByEventId(supabase, calendarEvent.id);

    if (!mapping) {
      // Event not mapped - ignore (import wizard handles manual imports)
      return {
        success: true,
        operation: 'skipped',
        eventId: calendarEvent.id,
        error: 'Event not mapped to appointment',
      };
    }

    // Fetch appointment from database
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(first_name, last_name, email, phone),
        pet:pets(name, size),
        service:services(name, duration_minutes)
      `)
      .eq('id', mapping.appointment_id)
      .single();

    if (appointmentError || !appointment) {
      // Appointment deleted in app - delete calendar event
      return await handleDeletedAppointment(
        supabase,
        connectionId,
        calendarEvent.id,
        mapping.appointment_id
      );
    }

    // Check if event is deleted/cancelled in Google Calendar
    if (calendarEvent.status === 'cancelled') {
      // Event deleted in calendar but appointment exists - recreate event (app wins)
      return await recreateDeletedEvent(
        supabase,
        connectionId,
        appointment,
        calendarEvent.id
      );
    }

    // Detect conflict (both app and calendar modified)
    const conflict = detectConflict(calendarEvent, appointment, mapping.last_synced_at);

    if (conflict.hasConflict) {
      // Conflict detected - app data wins
      return await resolveConflict(
        supabase,
        connectionId,
        appointment,
        calendarEvent,
        conflict
      );
    }

    // No conflict - event modified in calendar only
    // Since app is authoritative, we ignore calendar changes
    // (Alternative: you could pull changes here if you want bidirectional sync)
    return {
      success: true,
      operation: 'skipped',
      eventId: calendarEvent.id,
      appointmentId: appointment.id,
      error: 'Calendar changes ignored (app is authoritative)',
    };
  } catch (error) {
    console.error('Error handling event change:', error);
    return {
      success: false,
      operation: 'skipped',
      eventId: calendarEvent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle deleted appointment (delete calendar event)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param eventId - Google Calendar event ID
 * @param appointmentId - Appointment ID
 * @returns Event change result
 */
async function handleDeletedAppointment(
  supabase: SupabaseClient,
  connectionId: string,
  eventId: string,
  appointmentId: string
): Promise<EventChangeResult> {
  try {
    // Create Google Calendar client
    const client = createGoogleCalendarClient(supabase, connectionId);

    // Delete event from Google Calendar
    await client.deleteEvent(eventId);

    // Delete event mapping (should cascade from appointment deletion, but double-check)
    await supabase
      .from('calendar_event_mapping')
      .delete()
      .eq('google_event_id', eventId);

    console.log(`Deleted calendar event ${eventId} (appointment ${appointmentId} deleted)`);

    return {
      success: true,
      operation: 'deleted',
      eventId,
      appointmentId,
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      operation: 'deleted',
      eventId,
      appointmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recreate deleted event in Google Calendar (app wins)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param appointment - Appointment data
 * @param eventId - Google Calendar event ID
 * @returns Event change result
 */
async function recreateDeletedEvent(
  supabase: SupabaseClient,
  connectionId: string,
  appointment: AppointmentForSync,
  eventId: string
): Promise<EventChangeResult> {
  try {
    // Create Google Calendar client
    const client = createGoogleCalendarClient(supabase, connectionId);

    // Map appointment to event
    const eventData = mapAppointmentToEvent(appointment);

    // Create new event (old event ID cannot be reused)
    const createdEvent = await client.createEvent(eventData);

    // Update event mapping with new event ID
    await supabase
      .from('calendar_event_mapping')
      .update({
        google_event_id: createdEvent.id,
        last_synced_at: new Date().toISOString(),
      })
      .eq('google_event_id', eventId);

    console.log(`Recreated calendar event (was deleted in calendar): ${createdEvent.id}`);

    // Log to sync log
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'create',
        appointment_id: appointment.id,
        google_event_id: createdEvent.id,
        status: 'success',
        details: {
          reason: 'Event deleted in calendar but appointment exists (app wins)',
          old_event_id: eventId,
        },
      });

    return {
      success: true,
      operation: 'recreated',
      eventId: createdEvent.id,
      appointmentId: appointment.id,
    };
  } catch (error) {
    console.error('Error recreating calendar event:', error);
    return {
      success: false,
      operation: 'recreated',
      eventId,
      appointmentId: appointment.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect sync conflict (modified in both app and calendar)
 *
 * @param calendarEvent - Google Calendar event
 * @param appointment - Appointment data
 * @param lastSyncedAt - Last sync timestamp
 * @returns Conflict detection result
 */
function detectConflict(
  calendarEvent: GoogleCalendarEvent,
  appointment: AppointmentForSync,
  lastSyncedAt: string
): ConflictDetection {
  const lastSync = new Date(lastSyncedAt);
  const calendarUpdated = calendarEvent.updated ? new Date(calendarEvent.updated) : null;
  const appointmentUpdated = new Date(appointment.updated_at);

  // If both were modified after last sync, conflict detected
  if (
    calendarUpdated &&
    calendarUpdated > lastSync &&
    appointmentUpdated > lastSync
  ) {
    return {
      hasConflict: true,
      reason: 'Both calendar and appointment modified since last sync',
      calendarUpdated,
      appointmentUpdated,
    };
  }

  return {
    hasConflict: false,
  };
}

/**
 * Resolve sync conflict (app data wins)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param appointment - Appointment data (authoritative)
 * @param calendarEvent - Google Calendar event (to be overwritten)
 * @param conflict - Conflict detection result
 * @returns Event change result
 */
async function resolveConflict(
  supabase: SupabaseClient,
  connectionId: string,
  appointment: AppointmentForSync,
  calendarEvent: GoogleCalendarEvent,
  conflict: ConflictDetection
): Promise<EventChangeResult> {
  try {
    // Create Google Calendar client
    const client = createGoogleCalendarClient(supabase, connectionId);

    // Map appointment to event (app data)
    const eventData = mapAppointmentToEvent(appointment);

    // Update calendar event with app data (app wins)
    await client.updateEvent(calendarEvent.id, eventData);

    // Update event mapping timestamp
    await supabase
      .from('calendar_event_mapping')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_direction: 'push',
      })
      .eq('google_event_id', calendarEvent.id);

    console.log(`Conflict resolved: app data overwrote calendar event ${calendarEvent.id}`);

    // Log conflict resolution to sync log
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'update',
        appointment_id: appointment.id,
        google_event_id: calendarEvent.id,
        status: 'success',
        details: {
          conflict_resolved: true,
          conflict_reason: conflict.reason,
          calendar_updated: conflict.calendarUpdated?.toISOString(),
          appointment_updated: conflict.appointmentUpdated?.toISOString(),
          resolution: 'App data overwrote calendar changes (app is authoritative)',
        },
      });

    return {
      success: true,
      operation: 'updated',
      eventId: calendarEvent.id,
      appointmentId: appointment.id,
      conflictResolved: true,
    };
  } catch (error) {
    console.error('Error resolving conflict:', error);

    // Log conflict resolution failure
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'update',
        appointment_id: appointment.id,
        google_event_id: calendarEvent.id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'CONFLICT_RESOLUTION_FAILED',
        details: {
          conflict_detected: true,
          conflict_reason: conflict.reason,
        },
      });

    return {
      success: false,
      operation: 'updated',
      eventId: calendarEvent.id,
      appointmentId: appointment.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      conflictResolved: false,
    };
  }
}
