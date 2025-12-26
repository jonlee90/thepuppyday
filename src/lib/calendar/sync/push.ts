/**
 * Push Sync Service
 * Main orchestration service for syncing appointments to Google Calendar
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppointmentForSync, SyncResult, SyncOperationType } from '@/types/calendar';
import { createGoogleCalendarClient } from '../google-client';
import { mapAppointmentToEvent, shouldDeleteEvent, validateAppointmentForSync } from '../mapping';
import { shouldSyncAppointment, getSyncSettings } from '../sync-criteria';
import {
  createEventMapping,
  getEventMappingByAppointmentId,
  updateEventMappingLastSync,
  deleteEventMapping,
} from '../event-mapping-repository';
import { logSyncResult } from '../sync-logger';
import { getActiveConnection } from '../connection';

/**
 * Push appointment to Google Calendar
 *
 * @param supabase - Supabase client
 * @param appointment - Appointment data with joined customer, pet, service
 * @param force - Force sync regardless of criteria (optional)
 * @returns Sync result
 *
 * @example
 * ```typescript
 * const result = await pushAppointmentToCalendar(supabase, appointment);
 * if (result.success) {
 *   console.log('Synced event ID:', result.google_event_id);
 * } else {
 *   console.error('Sync failed:', result.error?.message);
 * }
 * ```
 */
export async function pushAppointmentToCalendar(
  supabase: SupabaseClient,
  appointment: AppointmentForSync,
  force: boolean = false
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // Validate appointment data
    const validation = validateAppointmentForSync(appointment);
    if (!validation.valid) {
      return {
        success: false,
        operation: 'create',
        appointment_id: appointment.id,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid appointment data: ${validation.errors.join(', ')}`,
        },
        duration_ms: Date.now() - startTime,
        details: { validation_errors: validation.errors },
      };
    }

    // Get the admin's calendar connection for syncing
    const { data: adminUser } = await supabase.auth.getUser();

    if (!adminUser.user) {
      return {
        success: false,
        operation: 'create',
        appointment_id: appointment.id,
        error: {
          code: 'AUTH_ERROR',
          message: 'No authenticated admin user',
        },
        duration_ms: Date.now() - startTime,
      };
    }

    const adminConnection = await getActiveConnection(supabase, adminUser.user.id);

    if (!adminConnection) {
      return {
        success: false,
        operation: 'create',
        appointment_id: appointment.id,
        error: {
          code: 'NO_CONNECTION',
          message: 'No active calendar connection found',
        },
        duration_ms: Date.now() - startTime,
      };
    }

    // Check sync criteria
    const syncSettings = await getSyncSettings(supabase);
    const syncDecision = shouldSyncAppointment(appointment, syncSettings, force);

    if (!syncDecision.shouldSync && !force) {
      return {
        success: false,
        operation: 'create',
        appointment_id: appointment.id,
        error: {
          code: 'SYNC_CRITERIA_NOT_MET',
          message: syncDecision.reason || 'Appointment does not meet sync criteria',
        },
        duration_ms: Date.now() - startTime,
        details: { sync_decision: syncDecision },
      };
    }

    // Check if appointment should be deleted from calendar
    if (shouldDeleteEvent(appointment)) {
      return await deleteAppointmentFromCalendar(
        supabase,
        appointment.id,
        adminConnection.id,
        startTime
      );
    }

    // Check if appointment is already synced
    const existingMapping = await getEventMappingByAppointmentId(supabase, appointment.id);

    let operation: SyncOperationType;
    let eventId: string;

    // Create Google Calendar client
    const client = createGoogleCalendarClient(
      supabase,
      adminConnection.id,
      adminConnection.calendar_id
    );

    if (existingMapping) {
      // Update existing event
      operation = 'update';
      eventId = existingMapping.google_event_id;

      const eventData = mapAppointmentToEvent(appointment);

      try {
        await client.updateEvent(eventId, eventData);

        // Update mapping timestamp
        await updateEventMappingLastSync(supabase, appointment.id, 'push');
      } catch (error) {
        const result: SyncResult = {
          success: false,
          operation,
          appointment_id: appointment.id,
          google_event_id: eventId,
          error: {
            code: 'UPDATE_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          duration_ms: Date.now() - startTime,
        };

        // Log the failure
        await logSyncResult(supabase, adminConnection.id, 'push', result);

        return result;
      }
    } else {
      // Create new event
      operation = 'create';

      const eventData = mapAppointmentToEvent(appointment);

      try {
        const createdEvent = await client.createEvent(eventData);
        eventId = createdEvent.id;

        // Create event mapping
        await createEventMapping(supabase, {
          appointment_id: appointment.id,
          connection_id: adminConnection.id,
          google_event_id: eventId,
          sync_direction: 'push',
        });
      } catch (error) {
        const result: SyncResult = {
          success: false,
          operation,
          appointment_id: appointment.id,
          error: {
            code: 'CREATE_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          duration_ms: Date.now() - startTime,
        };

        // Log the failure
        await logSyncResult(supabase, adminConnection.id, 'push', result);

        return result;
      }
    }

    // Success
    const result: SyncResult = {
      success: true,
      operation,
      appointment_id: appointment.id,
      google_event_id: eventId,
      duration_ms: Date.now() - startTime,
      details: {
        customer_name: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
        pet_name: appointment.pet.name,
        service_name: appointment.service.name,
        scheduled_at: appointment.scheduled_at,
      },
    };

    // Log the success
    await logSyncResult(supabase, adminConnection.id, 'push', result);

    return result;
  } catch (error) {
    const result: SyncResult = {
      success: false,
      operation: 'create',
      appointment_id: appointment.id,
      error: {
        code: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      duration_ms: Date.now() - startTime,
    };

    return result;
  }
}

/**
 * Delete appointment from Google Calendar
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @param connectionId - Calendar connection ID
 * @param startTime - Operation start time
 * @returns Sync result
 */
async function deleteAppointmentFromCalendar(
  supabase: SupabaseClient,
  appointmentId: string,
  connectionId: string,
  startTime: number
): Promise<SyncResult> {
  try {
    // Get event mapping
    const mapping = await getEventMappingByAppointmentId(supabase, appointmentId);

    if (!mapping) {
      // No mapping exists, nothing to delete
      return {
        success: true,
        operation: 'delete',
        appointment_id: appointmentId,
        duration_ms: Date.now() - startTime,
        details: { message: 'No event mapping found, nothing to delete' },
      };
    }

    // Create Google Calendar client
    const client = createGoogleCalendarClient(
      supabase,
      connectionId,
      mapping.connection_id
    );

    // Delete event from Google Calendar
    try {
      await client.deleteEvent(mapping.google_event_id);
    } catch (error) {
      // Log error but continue with mapping deletion
      console.warn('Failed to delete event from Google Calendar:', error);
    }

    // Delete event mapping
    await deleteEventMapping(supabase, appointmentId);

    const result: SyncResult = {
      success: true,
      operation: 'delete',
      appointment_id: appointmentId,
      google_event_id: mapping.google_event_id,
      duration_ms: Date.now() - startTime,
    };

    // Log the success
    await logSyncResult(supabase, connectionId, 'push', result);

    return result;
  } catch (error) {
    const result: SyncResult = {
      success: false,
      operation: 'delete',
      appointment_id: appointmentId,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      duration_ms: Date.now() - startTime,
    };

    // Log the failure
    await logSyncResult(supabase, connectionId, 'push', result);

    return result;
  }
}

/**
 * Sync multiple appointments to Google Calendar
 *
 * @param supabase - Supabase client
 * @param appointments - Array of appointments to sync
 * @param force - Force sync regardless of criteria (optional)
 * @returns Array of sync results
 *
 * @example
 * ```typescript
 * const results = await pushAppointmentsToCalendar(supabase, appointments);
 * const successful = results.filter(r => r.success).length;
 * console.log(`Synced ${successful}/${results.length} appointments`);
 * ```
 */
export async function pushAppointmentsToCalendar(
  supabase: SupabaseClient,
  appointments: AppointmentForSync[],
  force: boolean = false
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const appointment of appointments) {
    const result = await pushAppointmentToCalendar(supabase, appointment, force);
    results.push(result);

    // Add small delay between syncs to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Check if appointment can be synced
 *
 * @param supabase - Supabase client
 * @param appointment - Appointment data
 * @returns True if appointment can be synced
 */
export async function canSyncAppointment(
  supabase: SupabaseClient,
  appointment: AppointmentForSync
): Promise<boolean> {
  try {
    // Validate appointment data
    const validation = validateAppointmentForSync(appointment);
    if (!validation.valid) {
      return false;
    }

    // Check if calendar connection exists
    const { data: adminUser } = await supabase.auth.getUser();
    if (!adminUser.user) {
      return false;
    }

    const connection = await getActiveConnection(supabase, adminUser.user.id);
    if (!connection) {
      return false;
    }

    // Check sync criteria
    const syncSettings = await getSyncSettings(supabase);
    const syncDecision = shouldSyncAppointment(appointment, syncSettings);

    return syncDecision.shouldSync;
  } catch (error) {
    console.error('Error checking if appointment can be synced:', error);
    return false;
  }
}
