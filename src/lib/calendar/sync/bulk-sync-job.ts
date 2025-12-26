/**
 * Bulk Sync Job
 * Background job to sync multiple appointments in batches
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppointmentForSync } from '@/types/calendar';
import { pushAppointmentToCalendar } from './push';
import { getSyncSettings, filterAppointmentsForSync } from '../sync-criteria';

/**
 * Batch size for processing appointments
 */
const BATCH_SIZE = 10;

/**
 * Delay between batches (milliseconds)
 */
const BATCH_DELAY_MS = 1000;

/**
 * Delay between individual syncs within a batch (milliseconds)
 */
const SYNC_DELAY_MS = 200;

/**
 * Bulk sync job result
 */
export interface BulkSyncJobResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  errors: Array<{
    appointment_id: string;
    error: string;
  }>;
}

/**
 * Fetch appointments for bulk sync
 *
 * @param supabase - Supabase client
 * @param options - Fetch options
 * @returns Array of appointments
 */
async function fetchAppointmentsForSync(
  supabase: SupabaseClient,
  options: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }
): Promise<AppointmentForSync[]> {
  try {
    let query = supabase
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
      .order('scheduled_at', { ascending: true });

    // Apply date filters
    if (options.dateFrom) {
      query = query.gte('scheduled_at', options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte('scheduled_at', options.dateTo);
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform data to AppointmentForSync format
    return data.map((apt: {
      id: string;
      customer_id: string;
      pet_id: string;
      service_id: string;
      scheduled_at: string;
      status: string;
      notes: string | null;
      customer: { first_name: string; last_name: string; email: string; phone: string | null };
      pet: { name: string; size: string };
      service: { name: string; duration_minutes: number };
      appointment_addons?: Array<{ addon: { id: string; name: string; duration_minutes: number } }>;
    }) => ({
      id: apt.id,
      customer_id: apt.customer_id,
      pet_id: apt.pet_id,
      service_id: apt.service_id,
      scheduled_at: apt.scheduled_at,
      status: apt.status,
      notes: apt.notes,
      customer: {
        first_name: apt.customer.first_name,
        last_name: apt.customer.last_name,
        email: apt.customer.email,
        phone: apt.customer.phone,
      },
      pet: {
        name: apt.pet.name,
        size: apt.pet.size,
      },
      service: {
        name: apt.service.name,
        duration_minutes: apt.service.duration_minutes,
      },
      addons: apt.appointment_addons?.map((aa) => ({
        addon_id: aa.addon.id,
        addon_name: aa.addon.name,
        duration_minutes: aa.addon.duration_minutes,
      })) || [],
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch appointments for sync: ${error.message}`);
    }
    throw new Error('Failed to fetch appointments for sync: Unknown error');
  }
}

/**
 * Execute bulk sync job
 *
 * @param supabase - Supabase client
 * @param options - Sync options
 * @returns Bulk sync job result
 *
 * @example
 * ```typescript
 * const result = await executeBulkSyncJob(supabase, {
 *   dateFrom: '2025-01-01',
 *   dateTo: '2025-12-31',
 *   force: false,
 * });
 * console.log(`Synced ${result.successful}/${result.total} appointments`);
 * ```
 */
export async function executeBulkSyncJob(
  supabase: SupabaseClient,
  options: {
    dateFrom?: string;
    dateTo?: string;
    force?: boolean;
    limit?: number;
  } = {}
): Promise<BulkSyncJobResult> {
  const startTime = Date.now();

  try {
    // Fetch appointments
    const appointments = await fetchAppointmentsForSync(supabase, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      limit: options.limit,
    });

    if (appointments.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        duration_ms: Date.now() - startTime,
        errors: [],
      };
    }

    // Get sync settings
    const syncSettings = await getSyncSettings(supabase);

    // Filter appointments based on sync criteria (unless force is true)
    const appointmentsToSync = options.force
      ? appointments
      : filterAppointmentsForSync(appointments, syncSettings);

    const skippedCount = appointments.length - appointmentsToSync.length;

    // Process appointments in batches
    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ appointment_id: string; error: string }> = [];

    for (let i = 0; i < appointmentsToSync.length; i += BATCH_SIZE) {
      const batch = appointmentsToSync.slice(i, i + BATCH_SIZE);

      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(appointmentsToSync.length / BATCH_SIZE)} ` +
        `(${batch.length} appointments)`
      );

      // Process batch
      for (const appointment of batch) {
        try {
          const result = await pushAppointmentToCalendar(
            supabase,
            appointment,
            options.force
          );

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            errors.push({
              appointment_id: appointment.id,
              error: result.error?.message || 'Unknown error',
            });
          }

          // Delay between individual syncs
          await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
        } catch (error) {
          failCount++;
          errors.push({
            appointment_id: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Delay between batches (except for last batch)
      if (i + BATCH_SIZE < appointmentsToSync.length) {
        console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const result: BulkSyncJobResult = {
      total: appointments.length,
      successful: successCount,
      failed: failCount,
      skipped: skippedCount,
      duration_ms: Date.now() - startTime,
      errors,
    };

    console.log(
      `Bulk sync completed: ${successCount} successful, ${failCount} failed, ${skippedCount} skipped ` +
      `(${result.duration_ms}ms)`
    );

    return result;
  } catch (error) {
    const result: BulkSyncJobResult = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration_ms: Date.now() - startTime,
      errors: [
        {
          appointment_id: 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };

    console.error('Bulk sync job failed:', error);

    return result;
  }
}

/**
 * Execute bulk sync job with progress callback
 *
 * @param supabase - Supabase client
 * @param options - Sync options
 * @param onProgress - Progress callback
 * @returns Bulk sync job result
 */
export async function executeBulkSyncJobWithProgress(
  supabase: SupabaseClient,
  options: {
    dateFrom?: string;
    dateTo?: string;
    force?: boolean;
    limit?: number;
  },
  onProgress: (progress: {
    processed: number;
    total: number;
    percentage: number;
    successful: number;
    failed: number;
  }) => void
): Promise<BulkSyncJobResult> {
  const startTime = Date.now();

  try {
    // Fetch appointments
    const appointments = await fetchAppointmentsForSync(supabase, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      limit: options.limit,
    });

    if (appointments.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        duration_ms: Date.now() - startTime,
        errors: [],
      };
    }

    // Get sync settings
    const syncSettings = await getSyncSettings(supabase);

    // Filter appointments
    const appointmentsToSync = options.force
      ? appointments
      : filterAppointmentsForSync(appointments, syncSettings);

    const skippedCount = appointments.length - appointmentsToSync.length;
    const total = appointmentsToSync.length;

    // Process appointments
    let processed = 0;
    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ appointment_id: string; error: string }> = [];

    for (const appointment of appointmentsToSync) {
      try {
        const result = await pushAppointmentToCalendar(
          supabase,
          appointment,
          options.force
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
          errors.push({
            appointment_id: appointment.id,
            error: result.error?.message || 'Unknown error',
          });
        }

        processed++;

        // Report progress
        onProgress({
          processed,
          total,
          percentage: Math.round((processed / total) * 100),
          successful: successCount,
          failed: failCount,
        });

        // Delay between syncs
        await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
      } catch (error) {
        failCount++;
        processed++;
        errors.push({
          appointment_id: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        onProgress({
          processed,
          total,
          percentage: Math.round((processed / total) * 100),
          successful: successCount,
          failed: failCount,
        });
      }
    }

    return {
      total: appointments.length,
      successful: successCount,
      failed: failCount,
      skipped: skippedCount,
      duration_ms: Date.now() - startTime,
      errors,
    };
  } catch (error) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration_ms: Date.now() - startTime,
      errors: [
        {
          appointment_id: 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

/**
 * Estimate bulk sync duration
 *
 * @param appointmentCount - Number of appointments to sync
 * @returns Estimated duration in seconds
 */
export function estimateBulkSyncDuration(appointmentCount: number): number {
  if (appointmentCount === 0) return 0;

  const batchCount = Math.ceil(appointmentCount / BATCH_SIZE);
  const syncTime = appointmentCount * SYNC_DELAY_MS;
  const batchDelayTime = (batchCount - 1) * BATCH_DELAY_MS;
  const totalMs = syncTime + batchDelayTime;

  return Math.ceil(totalMs / 1000);
}
