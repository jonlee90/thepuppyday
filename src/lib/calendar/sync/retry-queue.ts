/**
 * Retry Queue Service
 * Manages failed sync operations with exponential backoff retry logic
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { pushAppointmentToCalendar } from './push';
import { logSync } from '../sync-logger';

/**
 * Retry backoff intervals in milliseconds
 */
const RETRY_BACKOFF = {
  0: 60000, // 1 minute
  1: 300000, // 5 minutes
  2: 900000, // 15 minutes
} as const;

const MAX_RETRIES = 3;

/**
 * Retry queue entry
 */
export interface RetryQueueEntry {
  id: string;
  appointment_id: string;
  operation: 'create' | 'update' | 'delete';
  retry_count: number;
  last_retry_at: string | null;
  next_retry_at: string;
  error_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Retry queue statistics
 */
export interface RetryQueueStats {
  pending: number;
  nextRetryTime: string | null;
  totalInQueue: number;
  exceededLimit: number;
}

/**
 * Retry processing statistics
 */
export interface RetryProcessingStats {
  processed: number;
  succeeded: number;
  failed: number;
  permanentlyFailed: number;
}

/**
 * Get retry backoff time in milliseconds based on retry count
 *
 * @param retryCount - Current retry count (0-indexed)
 * @returns Backoff duration in milliseconds
 *
 * @example
 * ```typescript
 * getRetryBackoffTime(0); // 60000 ms (1 minute)
 * getRetryBackoffTime(1); // 300000 ms (5 minutes)
 * getRetryBackoffTime(2); // 900000 ms (15 minutes)
 * ```
 */
export function getRetryBackoffTime(retryCount: number): number {
  if (retryCount >= MAX_RETRIES) {
    return 0; // No more retries
  }

  return RETRY_BACKOFF[retryCount as keyof typeof RETRY_BACKOFF] || 0;
}

/**
 * Add failed sync operation to retry queue
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 * @param operation - Sync operation type
 * @param errorDetails - Error information for debugging
 * @returns Created retry queue entry
 *
 * @example
 * ```typescript
 * await queueForRetry(supabase, 'appt-123', 'create', {
 *   code: 'HTTP_429',
 *   message: 'Rate limit exceeded',
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export async function queueForRetry(
  supabase: SupabaseClient,
  appointmentId: string,
  operation: 'create' | 'update' | 'delete',
  errorDetails: Record<string, unknown>
): Promise<RetryQueueEntry> {
  try {
    // Calculate next retry time (1 minute from now for first attempt)
    const nextRetryAt = new Date(Date.now() + RETRY_BACKOFF[0]);

    const { data, error } = await supabase
      .from('calendar_sync_retry_queue')
      .insert({
        appointment_id: appointmentId,
        operation,
        retry_count: 0,
        next_retry_at: nextRetryAt.toISOString(),
        error_details: errorDetails,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to retry queue: ${error.message}`);
    }

    console.log(
      `[Retry Queue] Added appointment ${appointmentId} to queue (operation: ${operation}, next retry: ${nextRetryAt.toISOString()})`
    );

    return data as RetryQueueEntry;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to queue for retry: ${error.message}`);
    }
    throw new Error('Failed to queue for retry: Unknown error');
  }
}

/**
 * Process retry queue - attempt to re-sync failed operations
 *
 * @param supabase - Supabase client
 * @returns Processing statistics
 *
 * @example
 * ```typescript
 * const stats = await processRetryQueue(supabase);
 * console.log(`Processed: ${stats.processed}, Succeeded: ${stats.succeeded}, Failed: ${stats.failed}`);
 * ```
 */
export async function processRetryQueue(
  supabase: SupabaseClient
): Promise<RetryProcessingStats> {
  const stats: RetryProcessingStats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    permanentlyFailed: 0,
  };

  try {
    // Fetch items ready for retry
    const { data: retryItems, error: fetchError } = await supabase
      .from('calendar_sync_retry_queue')
      .select('*')
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch retry queue: ${fetchError.message}`);
    }

    if (!retryItems || retryItems.length === 0) {
      console.log('[Retry Queue] No items ready for retry');
      return stats;
    }

    console.log(`[Retry Queue] Processing ${retryItems.length} items`);

    // FIXED: Critical #4 - Batch fetch appointments to avoid N+1 query problem
    const appointmentIds = retryItems.map(item => item.appointment_id);
    const { data: appointments, error: appointmentsError } = await supabase
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
      .in('id', appointmentIds);

    if (appointmentsError) {
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
    }

    // Create a Map for O(1) lookups
    const appointmentMap = new Map(
      (appointments || []).map(appt => [appt.id, appt])
    );

    for (const item of retryItems) {
      stats.processed++;

      try {
        // Get appointment from pre-fetched data
        const appointment = appointmentMap.get(item.appointment_id);

        if (!appointment) {
          throw new Error(`Appointment not found: ${item.appointment_id}`);
        }

        // Transform appointment data to expected format
        const appointmentForSync = {
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
          })),
        };

        // Attempt to sync the appointment
        const result = await pushAppointmentToCalendar(
          supabase,
          appointmentForSync,
          true // Force sync
        );

        if (result.success) {
          // Success! Remove from queue
          await removeFromQueue(supabase, item.appointment_id);
          stats.succeeded++;

          console.log(
            `[Retry Queue] Successfully synced appointment ${item.appointment_id} after ${item.retry_count + 1} retries`
          );
        } else {
          // Failed again
          const newRetryCount = item.retry_count + 1;

          if (newRetryCount >= MAX_RETRIES) {
            // Exceeded retry limit - mark as permanently failed
            await handlePermanentFailure(supabase, item);
            stats.permanentlyFailed++;

            console.error(
              `[Retry Queue] Appointment ${item.appointment_id} exceeded retry limit (${MAX_RETRIES} attempts)`
            );
          } else {
            // Update retry count and schedule next retry
            const backoffTime = getRetryBackoffTime(newRetryCount);
            const nextRetryAt = new Date(Date.now() + backoffTime);

            const { error: updateError } = await supabase
              .from('calendar_sync_retry_queue')
              .update({
                retry_count: newRetryCount,
                last_retry_at: new Date().toISOString(),
                next_retry_at: nextRetryAt.toISOString(),
                error_details: {
                  ...(item.error_details || {}),
                  last_error: result.error,
                  retry_history: [
                    ...((item.error_details?.retry_history as any[]) || []),
                    {
                      attempt: newRetryCount,
                      timestamp: new Date().toISOString(),
                      error: result.error,
                    },
                  ],
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id);

            if (updateError) {
              console.error(
                `[Retry Queue] Failed to update retry entry: ${updateError.message}`
              );
            }

            stats.failed++;

            console.warn(
              `[Retry Queue] Appointment ${item.appointment_id} failed retry ${newRetryCount}/${MAX_RETRIES}, next retry at ${nextRetryAt.toISOString()}`
            );
          }
        }
      } catch (error) {
        console.error(
          `[Retry Queue] Error processing retry for appointment ${item.appointment_id}:`,
          error
        );
        stats.failed++;
      }

      // Small delay between retries to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(
      `[Retry Queue] Processing complete - Processed: ${stats.processed}, Succeeded: ${stats.succeeded}, Failed: ${stats.failed}, Permanently Failed: ${stats.permanentlyFailed}`
    );

    return stats;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to process retry queue: ${error.message}`);
    }
    throw new Error('Failed to process retry queue: Unknown error');
  }
}

/**
 * Handle permanently failed sync operation
 * Sends admin notification and logs the permanent failure
 *
 * @param supabase - Supabase client
 * @param item - Retry queue entry
 */
async function handlePermanentFailure(
  supabase: SupabaseClient,
  item: RetryQueueEntry
): Promise<void> {
  try {
    // Get calendar connection for logging
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('is_active', true)
      .single();

    if (connection) {
      // Log permanent failure
      await logSync(supabase, {
        connection_id: connection.id,
        sync_type: 'push',
        operation: item.operation,
        appointment_id: item.appointment_id,
        google_event_id: null,
        status: 'failed',
        error_message: `Permanent failure after ${MAX_RETRIES} retry attempts`,
        error_code: 'RETRY_LIMIT_EXCEEDED',
        details: {
          retry_count: item.retry_count,
          error_history: item.error_details,
        },
        duration_ms: null,
      });
    }

    // TODO: Send admin notification via notification system
    // This will be implemented when the notification system is integrated
    console.error(
      `[Retry Queue] ADMIN NOTIFICATION: Appointment ${item.appointment_id} permanently failed sync after ${MAX_RETRIES} attempts`
    );

    // Remove from queue
    await removeFromQueue(supabase, item.appointment_id);
  } catch (error) {
    console.error('[Retry Queue] Failed to handle permanent failure:', error);
  }
}

/**
 * Remove appointment from retry queue
 *
 * @param supabase - Supabase client
 * @param appointmentId - Appointment ID
 *
 * @example
 * ```typescript
 * await removeFromQueue(supabase, 'appt-123');
 * ```
 */
export async function removeFromQueue(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('calendar_sync_retry_queue')
      .delete()
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to remove from queue: ${error.message}`);
    }

    console.log(`[Retry Queue] Removed appointment ${appointmentId} from queue`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove from retry queue: ${error.message}`);
    }
    throw new Error('Failed to remove from retry queue: Unknown error');
  }
}

/**
 * Get retry queue statistics
 *
 * @param supabase - Supabase client
 * @returns Queue statistics
 *
 * @example
 * ```typescript
 * const stats = await getQueueStats(supabase);
 * console.log(`Pending: ${stats.pending}, Next retry: ${stats.nextRetryTime}`);
 * ```
 */
export async function getQueueStats(
  supabase: SupabaseClient
): Promise<RetryQueueStats> {
  try {
    // Get pending retries count (retry_count < 3)
    const { count: pending } = await supabase
      .from('calendar_sync_retry_queue')
      .select('*', { count: 'exact', head: true })
      .lt('retry_count', MAX_RETRIES);

    // Get total count
    const { count: total } = await supabase
      .from('calendar_sync_retry_queue')
      .select('*', { count: 'exact', head: true });

    // Get exceeded limit count
    const { count: exceeded } = await supabase
      .from('calendar_sync_retry_queue')
      .select('*', { count: 'exact', head: true })
      .gte('retry_count', MAX_RETRIES);

    // Get next retry time
    const { data: nextItem } = await supabase
      .from('calendar_sync_retry_queue')
      .select('next_retry_at')
      .lt('retry_count', MAX_RETRIES)
      .order('next_retry_at', { ascending: true })
      .limit(1)
      .single();

    return {
      pending: pending || 0,
      nextRetryTime: nextItem?.next_retry_at || null,
      totalInQueue: total || 0,
      exceededLimit: exceeded || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get queue stats: ${error.message}`);
    }
    throw new Error('Failed to get queue stats: Unknown error');
  }
}
