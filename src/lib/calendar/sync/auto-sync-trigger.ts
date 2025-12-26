/**
 * Auto-Sync Trigger
 * Function to trigger sync when appointment changes
 * Handles errors gracefully to avoid blocking appointment operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppointmentForSync } from '@/types/calendar';
import { pushAppointmentToCalendar } from './push';
import { isAutoSyncEnabled } from '../sync-criteria';

/**
 * Trigger automatic sync for an appointment
 * This function is called after appointment changes (create, update, status change)
 * Errors are caught and logged but do NOT throw - appointment operations must succeed
 *
 * @param supabase - Supabase client
 * @param appointment - Appointment data with joined customer, pet, service
 * @returns True if sync was triggered successfully, false otherwise
 *
 * @example
 * ```typescript
 * // After creating/updating appointment
 * const synced = await triggerAutoSync(supabase, appointment);
 * if (!synced) {
 *   console.warn('Auto-sync failed, but appointment operation succeeded');
 * }
 * ```
 */
export async function triggerAutoSync(
  supabase: SupabaseClient,
  appointment: AppointmentForSync
): Promise<boolean> {
  try {
    // Check if auto-sync is enabled
    const autoSyncEnabled = await isAutoSyncEnabled(supabase);

    if (!autoSyncEnabled) {
      console.log('Auto-sync is disabled, skipping calendar sync');
      return false;
    }

    // Push appointment to calendar (async, non-blocking)
    const result = await pushAppointmentToCalendar(supabase, appointment);

    if (!result.success) {
      console.warn(
        `Calendar sync failed for appointment ${appointment.id}:`,
        result.error?.message
      );
      return false;
    }

    console.log(
      `Calendar sync successful for appointment ${appointment.id}: ` +
      `${result.operation} event ${result.google_event_id}`
    );

    return true;
  } catch (error) {
    // Catch all errors and log them
    // CRITICAL: Do not throw - appointment operations must not be blocked by sync failures
    console.error('Auto-sync trigger error:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return false;
  }
}

/**
 * Trigger automatic sync with retry logic
 * Attempts to sync with one retry on failure
 *
 * @param supabase - Supabase client
 * @param appointment - Appointment data with joined customer, pet, service
 * @param retries - Number of retry attempts (default: 1)
 * @returns True if sync was triggered successfully, false otherwise
 */
export async function triggerAutoSyncWithRetry(
  supabase: SupabaseClient,
  appointment: AppointmentForSync,
  retries: number = 1
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const success = await triggerAutoSync(supabase, appointment);

    if (success) {
      return true;
    }

    if (attempt < retries) {
      console.log(`Retrying calendar sync (attempt ${attempt + 2}/${retries + 1})...`);
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return false;
}

/**
 * Check if appointment should trigger auto-sync based on changes
 * Compares old and new appointment data to determine if sync is needed
 *
 * @param oldAppointment - Previous appointment data
 * @param newAppointment - Updated appointment data
 * @returns True if sync should be triggered
 */
export function shouldTriggerAutoSync(
  oldAppointment: Partial<AppointmentForSync> | null,
  newAppointment: AppointmentForSync
): boolean {
  // Always sync on creation
  if (!oldAppointment) {
    return true;
  }

  // Check if relevant fields changed
  const relevantFields: (keyof AppointmentForSync)[] = [
    'scheduled_at',
    'status',
    'notes',
  ];

  for (const field of relevantFields) {
    if (oldAppointment[field] !== newAppointment[field]) {
      return true;
    }
  }

  // Check if service changed
  if (
    oldAppointment.service_id !== newAppointment.service_id
  ) {
    return true;
  }

  // No relevant changes
  return false;
}

/**
 * Trigger sync in background (fire and forget)
 * Use this when you want to trigger sync without waiting for result
 *
 * @param supabase - Supabase client
 * @param appointment - Appointment data with joined customer, pet, service
 *
 * @example
 * ```typescript
 * // Fire and forget - don't wait for sync to complete
 * triggerAutoSyncInBackground(supabase, appointment);
 * ```
 */
export function triggerAutoSyncInBackground(
  supabase: SupabaseClient,
  appointment: AppointmentForSync
): void {
  // Execute sync asynchronously without awaiting
  triggerAutoSync(supabase, appointment)
    .then((success) => {
      if (success) {
        console.log(`Background sync completed for appointment ${appointment.id}`);
      } else {
        console.warn(`Background sync failed for appointment ${appointment.id}`);
      }
    })
    .catch((error) => {
      console.error('Background sync error:', error);
    });
}

/**
 * Batch trigger auto-sync for multiple appointments
 * Useful for bulk operations
 *
 * @param supabase - Supabase client
 * @param appointments - Array of appointments to sync
 * @returns Number of successfully synced appointments
 */
export async function batchTriggerAutoSync(
  supabase: SupabaseClient,
  appointments: AppointmentForSync[]
): Promise<number> {
  let successCount = 0;

  for (const appointment of appointments) {
    const success = await triggerAutoSync(supabase, appointment);

    if (success) {
      successCount++;
    }

    // Small delay between syncs to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return successCount;
}
