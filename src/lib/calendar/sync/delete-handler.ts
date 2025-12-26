/**
 * Deletion Sync Handler
 * Handles appointment deletions and calendar event cleanup
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncResult } from '@/types/calendar';
import { createGoogleCalendarClient } from '../google-client';
import { getEventMappingByAppointmentId, deleteEventMapping } from '../event-mapping-repository';
import { logSyncResult } from '../sync-logger';
import { getActiveConnection } from '../connection';

/**
 * Handle appointment deletion
 * Deletes Google Calendar event and removes mapping
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID to delete
 * @param adminId - Admin user ID (for connection lookup)
 * @returns Sync result
 *
 * @example
 * ```typescript
 * const result = await handleAppointmentDeletion(supabase, 'appt-123', 'admin-456');
 * if (result.success) {
 *   console.log('Event deleted successfully');
 * }
 * ```
 */
export async function handleAppointmentDeletion(
  supabase: SupabaseClient,
  appointmentId: string,
  adminId?: string
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    // Get event mapping for this appointment
    const mapping = await getEventMappingByAppointmentId(supabase, appointmentId);

    if (!mapping) {
      // No mapping exists, nothing to delete from calendar
      return {
        success: true,
        operation: 'delete',
        appointment_id: appointmentId,
        duration_ms: Date.now() - startTime,
        details: { message: 'No event mapping found, nothing to delete' },
      };
    }

    // Get admin user if not provided
    let effectiveAdminId = adminId;
    if (!effectiveAdminId) {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        effectiveAdminId = user.user.id;
      }
    }

    if (!effectiveAdminId) {
      return {
        success: false,
        operation: 'delete',
        appointment_id: appointmentId,
        error: {
          code: 'AUTH_ERROR',
          message: 'No admin user ID provided and no authenticated user',
        },
        duration_ms: Date.now() - startTime,
      };
    }

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, effectiveAdminId);

    if (!connection) {
      // Connection doesn't exist anymore, just delete the mapping
      await deleteEventMapping(supabase, appointmentId);

      return {
        success: true,
        operation: 'delete',
        appointment_id: appointmentId,
        duration_ms: Date.now() - startTime,
        details: {
          message: 'Calendar connection not found, mapping deleted',
        },
      };
    }

    // Create Google Calendar client
    const client = createGoogleCalendarClient(
      supabase,
      connection.id,
      connection.calendar_id
    );

    // Delete event from Google Calendar
    try {
      await client.deleteEvent(mapping.google_event_id);
    } catch (error) {
      // Log error but continue with mapping deletion
      console.warn(
        `Failed to delete event ${mapping.google_event_id} from Google Calendar:`,
        error
      );
      // Don't fail the operation - proceed to delete mapping
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
    await logSyncResult(supabase, connection.id, 'push', result);

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

    // Try to log the failure (if we have a connection)
    try {
      if (adminId) {
        const connection = await getActiveConnection(supabase, adminId);
        if (connection) {
          await logSyncResult(supabase, connection.id, 'push', result);
        }
      }
    } catch (logError) {
      console.error('Failed to log deletion failure:', logError);
    }

    return result;
  }
}

/**
 * Handle appointment deletion in background (fire and forget)
 * Use this when you want to trigger deletion without waiting for result
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID to delete
 * @param adminId - Admin user ID (for connection lookup)
 *
 * @example
 * ```typescript
 * // Fire and forget - don't wait for deletion to complete
 * handleAppointmentDeletionInBackground(supabase, 'appt-123', 'admin-456');
 * ```
 */
export function handleAppointmentDeletionInBackground(
  supabase: SupabaseClient,
  appointmentId: string,
  adminId?: string
): void {
  // Execute deletion asynchronously without awaiting
  handleAppointmentDeletion(supabase, appointmentId, adminId)
    .then((result) => {
      if (result.success) {
        console.log(`Background deletion completed for appointment ${appointmentId}`);
      } else {
        console.warn(
          `Background deletion failed for appointment ${appointmentId}:`,
          result.error?.message
        );
      }
    })
    .catch((error) => {
      console.error('Background deletion error:', error);
    });
}

/**
 * Batch delete appointments from calendar
 *
 * @param supabase - Supabase client
 * @param appointmentIds - Array of appointment IDs to delete
 * @param adminId - Admin user ID (for connection lookup)
 * @returns Array of sync results
 */
export async function batchDeleteAppointments(
  supabase: SupabaseClient,
  appointmentIds: string[],
  adminId?: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const appointmentId of appointmentIds) {
    const result = await handleAppointmentDeletion(supabase, appointmentId, adminId);
    results.push(result);

    // Small delay between deletions to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Check if appointment has calendar event
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @returns True if appointment has associated calendar event
 */
export async function hasCalendarEvent(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<boolean> {
  const mapping = await getEventMappingByAppointmentId(supabase, appointmentId);
  return mapping !== null;
}

/**
 * Cleanup orphaned event mappings
 * Removes mappings for appointments that no longer exist
 *
 * @param supabase - Supabase client
 * @param adminId - Admin user ID (for connection lookup)
 * @returns Number of mappings cleaned up
 */
export async function cleanupOrphanedMappings(
  supabase: SupabaseClient,
  adminId: string
): Promise<number> {
  try {
    // Get active connection
    const connection = await getActiveConnection(supabase, adminId);

    if (!connection) {
      return 0;
    }

    // Get all event mappings for this connection
    const { data: mappings, error: mappingsError } = await supabase
      .from('calendar_event_mappings')
      .select('id, appointment_id, google_event_id')
      .eq('connection_id', connection.id);

    if (mappingsError || !mappings) {
      return 0;
    }

    let cleanedUp = 0;

    // Check each mapping if appointment exists
    for (const mapping of mappings) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', mapping.appointment_id)
        .single();

      // If appointment doesn't exist, delete the mapping
      if (appointmentError || !appointment) {
        await deleteEventMapping(supabase, mapping.appointment_id);
        cleanedUp++;

        // Try to delete from Google Calendar too
        try {
          const client = createGoogleCalendarClient(
            supabase,
            connection.id,
            connection.calendar_id
          );
          await client.deleteEvent(mapping.google_event_id);
        } catch (error) {
          console.warn(
            `Failed to delete orphaned event ${mapping.google_event_id}:`,
            error
          );
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return cleanedUp;
  } catch (error) {
    console.error('Failed to cleanup orphaned mappings:', error);
    return 0;
  }
}
