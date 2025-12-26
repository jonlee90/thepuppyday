/**
 * Sync Logger Utility
 * Logs sync operations to calendar_sync_log table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SyncTypeType,
  SyncOperationType,
  SyncStatusType,
  CreateCalendarSyncLogInput,
  SyncResult,
} from '@/types/calendar';

/**
 * Log a sync operation to the database
 *
 * @param supabase - Supabase client
 * @param data - Sync log data
 * @returns Created log entry ID
 *
 * @example
 * ```typescript
 * await logSync(supabase, {
 *   connection_id: 'conn-123',
 *   sync_type: 'push',
 *   operation: 'create',
 *   appointment_id: 'appt-456',
 *   google_event_id: 'evt-789',
 *   status: 'success',
 *   duration_ms: 1234,
 * });
 * ```
 */
export async function logSync(
  supabase: SupabaseClient,
  data: CreateCalendarSyncLogInput
): Promise<string> {
  try {
    const { data: log, error } = await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: data.connection_id,
        sync_type: data.sync_type,
        operation: data.operation,
        appointment_id: data.appointment_id,
        google_event_id: data.google_event_id,
        status: data.status,
        error_message: data.error_message,
        error_code: data.error_code,
        details: data.details,
        duration_ms: data.duration_ms,
      })
      .select('id')
      .single();

    if (error) {
      // Log error but don't throw - logging failures shouldn't break sync
      console.error('Failed to log sync operation:', error);
      return '';
    }

    return log?.id || '';
  } catch (error) {
    // Log error but don't throw - logging failures shouldn't break sync
    console.error('Failed to log sync operation:', error);
    return '';
  }
}

/**
 * Log a successful sync operation
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param syncType - Type of sync operation
 * @param operation - Sync operation (create, update, delete)
 * @param appointmentId - Appointment ID
 * @param googleEventId - Google Calendar event ID
 * @param durationMs - Operation duration in milliseconds
 * @param details - Additional details
 * @returns Created log entry ID
 */
export async function logSyncSuccess(
  supabase: SupabaseClient,
  connectionId: string,
  syncType: SyncTypeType,
  operation: SyncOperationType,
  appointmentId: string,
  googleEventId: string,
  durationMs: number,
  details?: Record<string, unknown>
): Promise<string> {
  return await logSync(supabase, {
    connection_id: connectionId,
    sync_type: syncType,
    operation,
    appointment_id: appointmentId,
    google_event_id: googleEventId,
    status: 'success',
    error_message: null,
    error_code: null,
    details: details || null,
    duration_ms: durationMs,
  });
}

/**
 * Log a failed sync operation
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID (may be null for connection errors)
 * @param syncType - Type of sync operation
 * @param operation - Sync operation (create, update, delete)
 * @param appointmentId - Appointment ID (may be null)
 * @param errorMessage - Error message
 * @param errorCode - Error code
 * @param durationMs - Operation duration in milliseconds
 * @param details - Additional details
 * @returns Created log entry ID
 */
export async function logSyncFailure(
  supabase: SupabaseClient,
  connectionId: string | null,
  syncType: SyncTypeType,
  operation: SyncOperationType,
  appointmentId: string | null,
  errorMessage: string,
  errorCode: string,
  durationMs: number,
  details?: Record<string, unknown>
): Promise<string> {
  return await logSync(supabase, {
    connection_id: connectionId,
    sync_type: syncType,
    operation,
    appointment_id: appointmentId,
    google_event_id: null,
    status: 'failed',
    error_message: errorMessage,
    error_code: errorCode,
    details: details || null,
    duration_ms: durationMs,
  });
}

/**
 * Log a sync result (success or failure)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param syncType - Type of sync operation
 * @param result - Sync operation result
 * @returns Created log entry ID
 */
export async function logSyncResult(
  supabase: SupabaseClient,
  connectionId: string,
  syncType: SyncTypeType,
  result: SyncResult
): Promise<string> {
  if (result.success) {
    return await logSyncSuccess(
      supabase,
      connectionId,
      syncType,
      result.operation,
      result.appointment_id,
      result.google_event_id || '',
      result.duration_ms,
      result.details
    );
  } else {
    return await logSyncFailure(
      supabase,
      connectionId,
      syncType,
      result.operation,
      result.appointment_id,
      result.error?.message || 'Unknown error',
      result.error?.code || 'UNKNOWN_ERROR',
      result.duration_ms,
      result.details
    );
  }
}

/**
 * Get recent sync logs for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param limit - Number of logs to return (default: 50)
 * @returns Array of sync logs
 */
export async function getRecentSyncLogs(
  supabase: SupabaseClient,
  connectionId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch sync logs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get recent sync logs: ${error.message}`);
    }
    throw new Error('Failed to get recent sync logs: Unknown error');
  }
}

/**
 * Get failed sync logs for a connection in the last 24 hours
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Array of failed sync logs
 */
export async function getRecentFailedSyncLogs(
  supabase: SupabaseClient,
  connectionId: string
) {
  try {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data, error } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('status', 'failed')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch failed sync logs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get recent failed sync logs: ${error.message}`);
    }
    throw new Error('Failed to get recent failed sync logs: Unknown error');
  }
}

/**
 * Get sync logs count by status for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param status - Sync status to count
 * @returns Count of sync logs with given status
 */
export async function getSyncLogsCountByStatus(
  supabase: SupabaseClient,
  connectionId: string,
  status: SyncStatusType
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('status', status);

    if (error) {
      throw new Error(`Failed to count sync logs: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get sync logs count by status: ${error.message}`);
    }
    throw new Error('Failed to get sync logs count by status: Unknown error');
  }
}

/**
 * Get sync logs for a specific appointment
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @returns Array of sync logs for the appointment
 */
export async function getSyncLogsForAppointment(
  supabase: SupabaseClient,
  appointmentId: string
) {
  try {
    const { data, error } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch appointment sync logs: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get sync logs for appointment: ${error.message}`);
    }
    throw new Error('Failed to get sync logs for appointment: Unknown error');
  }
}

/**
 * Get sync statistics for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Sync statistics
 */
export async function getSyncStatistics(
  supabase: SupabaseClient,
  connectionId: string
): Promise<{
  total: number;
  successful: number;
  failed: number;
  last_24h: number;
  failed_last_24h: number;
}> {
  try {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Get total count
    const { count: total } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId);

    // Get successful count
    const { count: successful } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('status', 'success');

    // Get failed count
    const { count: failed } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('status', 'failed');

    // Get last 24h count
    const { count: last_24h } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .gte('created_at', yesterday.toISOString());

    // Get failed last 24h count
    const { count: failed_last_24h } = await supabase
      .from('calendar_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('connection_id', connectionId)
      .eq('status', 'failed')
      .gte('created_at', yesterday.toISOString());

    return {
      total: total || 0,
      successful: successful || 0,
      failed: failed || 0,
      last_24h: last_24h || 0,
      failed_last_24h: failed_last_24h || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get sync statistics: ${error.message}`);
    }
    throw new Error('Failed to get sync statistics: Unknown error');
  }
}

/**
 * Delete old sync logs (cleanup)
 *
 * @param supabase - Supabase client
 * @param daysToKeep - Number of days to keep logs (default: 30)
 * @returns Number of deleted logs
 */
export async function deleteOldSyncLogs(
  supabase: SupabaseClient,
  daysToKeep: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('calendar_sync_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to delete old sync logs: ${error.message}`);
    }

    return data?.length || 0;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete old sync logs: ${error.message}`);
    }
    throw new Error('Failed to delete old sync logs: Unknown error');
  }
}
