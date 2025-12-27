/**
 * Auto-Sync Pause Manager
 * Manages automatic pausing of sync when too many consecutive failures occur
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logSync } from '../sync-logger';

/**
 * Threshold for consecutive failures before auto-pause
 */
const CONSECUTIVE_FAILURE_THRESHOLD = 10;

/**
 * Connection pause status
 */
export interface ConnectionPauseStatus {
  isPaused: boolean;
  pausedAt: string | null;
  pauseReason: string | null;
  consecutiveFailures: number;
}

/**
 * Track sync failure for a connection
 * Increments consecutive failures counter and auto-pauses if threshold is reached
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param error - Error that caused the failure
 *
 * @example
 * ```typescript
 * try {
 *   await syncAppointment();
 *   await trackSyncSuccess(supabase, connectionId);
 * } catch (error) {
 *   await trackSyncFailure(supabase, connectionId, error);
 * }
 * ```
 */
export async function trackSyncFailure(
  supabase: SupabaseClient,
  connectionId: string,
  error: Error
): Promise<void> {
  try {
    // Get current connection data
    const { data: connection, error: fetchError } = await supabase
      .from('calendar_connections')
      .select('consecutive_failures, auto_sync_paused')
      .eq('id', connectionId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch connection: ${fetchError.message}`);
    }

    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Skip if already paused
    if (connection.auto_sync_paused) {
      console.log(
        `[Pause Manager] Connection ${connectionId} is already paused, skipping failure tracking`
      );
      return;
    }

    const newFailureCount = connection.consecutive_failures + 1;

    // Update consecutive failures count
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .update({
        consecutive_failures: newFailureCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (updateError) {
      throw new Error(`Failed to update failure count: ${updateError.message}`);
    }

    console.log(
      `[Pause Manager] Connection ${connectionId} consecutive failures: ${newFailureCount}/${CONSECUTIVE_FAILURE_THRESHOLD}`
    );

    // Check if threshold is reached
    if (newFailureCount >= CONSECUTIVE_FAILURE_THRESHOLD) {
      await pauseAutoSync(
        supabase,
        connectionId,
        `Auto-paused after ${CONSECUTIVE_FAILURE_THRESHOLD} consecutive sync failures: ${error.message}`
      );
    }
  } catch (error) {
    console.error('[Pause Manager] Failed to track sync failure:', error);
    // Don't throw - failure tracking shouldn't break the sync process
  }
}

/**
 * Track sync success for a connection
 * Resets consecutive failures counter to 0
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 *
 * @example
 * ```typescript
 * await trackSyncSuccess(supabase, connectionId);
 * ```
 */
export async function trackSyncSuccess(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    // Reset consecutive failures to 0
    const { error } = await supabase
      .from('calendar_connections')
      .update({
        consecutive_failures: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Failed to reset failure count: ${error.message}`);
    }

    console.log(
      `[Pause Manager] Connection ${connectionId} consecutive failures reset to 0`
    );
  } catch (error) {
    console.error('[Pause Manager] Failed to track sync success:', error);
    // Don't throw - success tracking shouldn't break the sync process
  }
}

/**
 * Pause auto-sync for a connection
 * Sets auto_sync_paused flag and records pause timestamp and reason
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param reason - Reason for pausing (user-friendly message)
 *
 * @example
 * ```typescript
 * await pauseAutoSync(supabase, connectionId, 'Invalid authentication token');
 * ```
 */
export async function pauseAutoSync(
  supabase: SupabaseClient,
  connectionId: string,
  reason: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Update connection to paused state
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .update({
        auto_sync_paused: true,
        paused_at: now,
        pause_reason: reason,
        updated_at: now,
      })
      .eq('id', connectionId);

    if (updateError) {
      throw new Error(`Failed to pause auto-sync: ${updateError.message}`);
    }

    console.warn(
      `[Pause Manager] Auto-sync PAUSED for connection ${connectionId}: ${reason}`
    );

    // Log the pause event
    await logSync(supabase, {
      connection_id: connectionId,
      sync_type: 'push',
      operation: 'update',
      appointment_id: null,
      google_event_id: null,
      status: 'failed',
      error_message: `Auto-sync paused: ${reason}`,
      error_code: 'AUTO_SYNC_PAUSED',
      details: {
        pause_reason: reason,
        paused_at: now,
      },
      duration_ms: null,
    });

    // TODO: Send admin notification
    // This will be implemented when the notification system is integrated
    console.error(
      `[Pause Manager] ADMIN NOTIFICATION: Calendar sync has been automatically paused for connection ${connectionId}. Reason: ${reason}`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to pause auto-sync: ${error.message}`);
    }
    throw new Error('Failed to pause auto-sync: Unknown error');
  }
}

/**
 * Resume auto-sync for a connection
 * Clears pause flag and resets consecutive failures counter
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 *
 * @example
 * ```typescript
 * await resumeAutoSync(supabase, connectionId);
 * ```
 */
export async function resumeAutoSync(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    // Resume auto-sync and reset failure counters
    const { error: updateError } = await supabase
      .from('calendar_connections')
      .update({
        auto_sync_paused: false,
        paused_at: null,
        pause_reason: null,
        consecutive_failures: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (updateError) {
      throw new Error(`Failed to resume auto-sync: ${updateError.message}`);
    }

    console.log(`[Pause Manager] Auto-sync RESUMED for connection ${connectionId}`);

    // Log the resume event
    await logSync(supabase, {
      connection_id: connectionId,
      sync_type: 'push',
      operation: 'update',
      appointment_id: null,
      google_event_id: null,
      status: 'success',
      error_message: null,
      error_code: null,
      details: {
        event: 'auto_sync_resumed',
        resumed_at: new Date().toISOString(),
      },
      duration_ms: null,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to resume auto-sync: ${error.message}`);
    }
    throw new Error('Failed to resume auto-sync: Unknown error');
  }
}

/**
 * Check pause status for a connection
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Pause status information
 *
 * @example
 * ```typescript
 * const status = await checkPauseStatus(supabase, connectionId);
 * if (status.isPaused) {
 *   console.log(`Sync paused: ${status.pauseReason}`);
 * }
 * ```
 */
export async function checkPauseStatus(
  supabase: SupabaseClient,
  connectionId: string
): Promise<ConnectionPauseStatus> {
  try {
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('auto_sync_paused, paused_at, pause_reason, consecutive_failures')
      .eq('id', connectionId)
      .single();

    if (error) {
      throw new Error(`Failed to check pause status: ${error.message}`);
    }

    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    return {
      isPaused: connection.auto_sync_paused,
      pausedAt: connection.paused_at,
      pauseReason: connection.pause_reason,
      consecutiveFailures: connection.consecutive_failures,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to check pause status: ${error.message}`);
    }
    throw new Error('Failed to check pause status: Unknown error');
  }
}

/**
 * Get all paused connections
 *
 * @param supabase - Supabase client
 * @returns Array of paused connection details
 *
 * @example
 * ```typescript
 * const pausedConnections = await getPausedConnections(supabase);
 * console.log(`${pausedConnections.length} connections are paused`);
 * ```
 */
export async function getPausedConnections(supabase: SupabaseClient): Promise<
  Array<{
    id: string;
    calendar_email: string;
    paused_at: string;
    pause_reason: string;
    consecutive_failures: number;
  }>
> {
  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('id, calendar_email, paused_at, pause_reason, consecutive_failures')
      .eq('auto_sync_paused', true)
      .order('paused_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get paused connections: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get paused connections: ${error.message}`);
    }
    throw new Error('Failed to get paused connections: Unknown error');
  }
}
