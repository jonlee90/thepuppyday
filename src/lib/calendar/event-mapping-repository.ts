/**
 * Event Mapping Repository
 * Database operations for calendar_event_mapping table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CalendarEventMapping,
  CreateCalendarEventMappingInput,
  SyncDirectionType,
} from '@/types/calendar';

/**
 * Create a new calendar event mapping
 *
 * @param supabase - Supabase client
 * @param data - Event mapping data
 * @returns Created event mapping
 *
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * const mapping = await createEventMapping(supabase, {
 *   appointment_id: 'appt-123',
 *   connection_id: 'conn-456',
 *   google_event_id: 'evt-789',
 *   sync_direction: 'push',
 * });
 * ```
 */
export async function createEventMapping(
  supabase: SupabaseClient,
  data: CreateCalendarEventMappingInput
): Promise<CalendarEventMapping> {
  try {
    const { data: mapping, error } = await supabase
      .from('calendar_event_mapping')
      .insert({
        appointment_id: data.appointment_id,
        connection_id: data.connection_id,
        google_event_id: data.google_event_id,
        sync_direction: data.sync_direction,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create event mapping: ${error.message}`);
    }

    if (!mapping) {
      throw new Error('No event mapping returned from database');
    }

    return mapping as CalendarEventMapping;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create event mapping: ${error.message}`);
    }
    throw new Error('Failed to create event mapping: Unknown error');
  }
}

/**
 * Get event mapping by appointment ID
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @returns Event mapping or null if not found
 *
 * @example
 * ```typescript
 * const mapping = await getEventMappingByAppointmentId(supabase, 'appt-123');
 * if (mapping) {
 *   console.log('Google Event ID:', mapping.google_event_id);
 * }
 * ```
 */
export async function getEventMappingByAppointmentId(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<CalendarEventMapping | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_event_mapping')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error) {
      // PGRST116 means no rows returned
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch event mapping: ${error.message}`);
    }

    return data as CalendarEventMapping;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get event mapping by appointment ID: ${error.message}`);
    }
    throw new Error('Failed to get event mapping by appointment ID: Unknown error');
  }
}

/**
 * Get event mapping by Google event ID
 *
 * @param supabase - Supabase client
 * @param eventId - Google Calendar event ID
 * @returns Event mapping or null if not found
 *
 * @example
 * ```typescript
 * const mapping = await getEventMappingByEventId(supabase, 'evt-789');
 * if (mapping) {
 *   console.log('Appointment ID:', mapping.appointment_id);
 * }
 * ```
 */
export async function getEventMappingByEventId(
  supabase: SupabaseClient,
  eventId: string
): Promise<CalendarEventMapping | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_event_mapping')
      .select('*')
      .eq('google_event_id', eventId)
      .single();

    if (error) {
      // PGRST116 means no rows returned
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch event mapping: ${error.message}`);
    }

    return data as CalendarEventMapping;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get event mapping by event ID: ${error.message}`);
    }
    throw new Error('Failed to get event mapping by event ID: Unknown error');
  }
}

/**
 * Update event mapping last sync timestamp
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @param syncDirection - Sync direction (push or pull)
 * @returns Updated event mapping
 *
 * @throws Error if update fails
 */
export async function updateEventMappingLastSync(
  supabase: SupabaseClient,
  appointmentId: string,
  syncDirection: SyncDirectionType
): Promise<CalendarEventMapping> {
  try {
    const { data, error } = await supabase
      .from('calendar_event_mapping')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_direction: syncDirection,
        updated_at: new Date().toISOString(),
      })
      .eq('appointment_id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update event mapping: ${error.message}`);
    }

    if (!data) {
      throw new Error('No event mapping returned from database');
    }

    return data as CalendarEventMapping;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update event mapping last sync: ${error.message}`);
    }
    throw new Error('Failed to update event mapping last sync: Unknown error');
  }
}

/**
 * Delete event mapping by appointment ID
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 *
 * @throws Error if deletion fails
 *
 * @example
 * ```typescript
 * await deleteEventMapping(supabase, 'appt-123');
 * console.log('Event mapping deleted');
 * ```
 */
export async function deleteEventMapping(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('calendar_event_mapping')
      .delete()
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to delete event mapping: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete event mapping: ${error.message}`);
    }
    throw new Error('Failed to delete event mapping: Unknown error');
  }
}

/**
 * Delete event mapping by Google event ID
 *
 * @param supabase - Supabase client
 * @param eventId - Google Calendar event ID
 *
 * @throws Error if deletion fails
 */
export async function deleteEventMappingByEventId(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('calendar_event_mapping')
      .delete()
      .eq('google_event_id', eventId);

    if (error) {
      throw new Error(`Failed to delete event mapping: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete event mapping by event ID: ${error.message}`);
    }
    throw new Error('Failed to delete event mapping by event ID: Unknown error');
  }
}

/**
 * Get all event mappings for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Array of event mappings
 *
 * @example
 * ```typescript
 * const mappings = await getEventMappingsByConnection(supabase, 'conn-456');
 * console.log(`Found ${mappings.length} synced events`);
 * ```
 */
export async function getEventMappingsByConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<CalendarEventMapping[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_event_mapping')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch event mappings: ${error.message}`);
    }

    return (data as CalendarEventMapping[]) || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get event mappings by connection: ${error.message}`);
    }
    throw new Error('Failed to get event mappings by connection: Unknown error');
  }
}

/**
 * Check if appointment is already synced
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @returns True if appointment has event mapping
 *
 * @example
 * ```typescript
 * const isSynced = await isAppointmentSynced(supabase, 'appt-123');
 * if (isSynced) {
 *   console.log('Appointment is already synced to calendar');
 * }
 * ```
 */
export async function isAppointmentSynced(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<boolean> {
  const mapping = await getEventMappingByAppointmentId(supabase, appointmentId);
  return mapping !== null;
}

/**
 * Get count of synced appointments for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Count of synced appointments
 */
export async function getSyncedAppointmentsCount(
  supabase: SupabaseClient,
  connectionId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('calendar_event_mapping')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId);

    if (error) {
      throw new Error(`Failed to count event mappings: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get synced appointments count: ${error.message}`);
    }
    throw new Error('Failed to get synced appointments count: Unknown error');
  }
}

/**
 * Delete all event mappings for a connection
 * Used when connection is deleted
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 *
 * @throws Error if deletion fails
 */
export async function deleteEventMappingsByConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('calendar_event_mapping')
      .delete()
      .eq('connection_id', connectionId);

    if (error) {
      throw new Error(`Failed to delete event mappings: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete event mappings by connection: ${error.message}`);
    }
    throw new Error('Failed to delete event mappings by connection: Unknown error');
  }
}

/**
 * Get recent event mappings (last N synced)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param limit - Number of mappings to return (default: 10)
 * @returns Array of recent event mappings
 */
export async function getRecentEventMappings(
  supabase: SupabaseClient,
  connectionId: string,
  limit: number = 10
): Promise<CalendarEventMapping[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_event_mapping')
      .select('*')
      .eq('connection_id', connectionId)
      .order('last_synced_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent event mappings: ${error.message}`);
    }

    return (data as CalendarEventMapping[]) || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get recent event mappings: ${error.message}`);
    }
    throw new Error('Failed to get recent event mappings: Unknown error');
  }
}
