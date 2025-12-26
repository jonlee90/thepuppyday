/**
 * Sync Criteria Checker
 * Determines if an appointment should be synced based on settings
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppointmentForSync,
  CalendarSyncSettings,
  AppointmentStatusType,
} from '@/types/calendar';

/**
 * Default sync settings if not configured
 */
const DEFAULT_SYNC_SETTINGS: CalendarSyncSettings = {
  sync_statuses: ['confirmed', 'checked_in', 'in_progress', 'completed'],
  auto_sync_enabled: true,
  sync_past_appointments: false,
  sync_completed_appointments: true,
  notification_preferences: {
    send_success_notifications: false,
    send_failure_notifications: true,
  },
};

/**
 * Get calendar sync settings from database
 *
 * @param supabase - Supabase client
 * @returns Calendar sync settings or default settings
 */
export async function getSyncSettings(
  supabase: SupabaseClient
): Promise<CalendarSyncSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'calendar_sync_settings')
      .single();

    if (error) {
      // If settings not found, return defaults
      if (error.code === 'PGRST116') {
        return DEFAULT_SYNC_SETTINGS;
      }
      throw new Error(`Failed to fetch sync settings: ${error.message}`);
    }

    if (!data || !data.value) {
      return DEFAULT_SYNC_SETTINGS;
    }

    // Parse and validate settings
    const settings = data.value as CalendarSyncSettings;

    // Ensure required fields exist
    return {
      sync_statuses: settings.sync_statuses || DEFAULT_SYNC_SETTINGS.sync_statuses,
      auto_sync_enabled: settings.auto_sync_enabled ?? DEFAULT_SYNC_SETTINGS.auto_sync_enabled,
      sync_past_appointments: settings.sync_past_appointments ?? DEFAULT_SYNC_SETTINGS.sync_past_appointments,
      sync_completed_appointments: settings.sync_completed_appointments ?? DEFAULT_SYNC_SETTINGS.sync_completed_appointments,
      notification_preferences: settings.notification_preferences || DEFAULT_SYNC_SETTINGS.notification_preferences,
    };
  } catch (error) {
    console.error('Failed to get sync settings, using defaults:', error);
    return DEFAULT_SYNC_SETTINGS;
  }
}

/**
 * Update calendar sync settings in database
 *
 * @param supabase - Supabase client
 * @param settings - New sync settings
 *
 * @throws Error if update fails
 */
export async function updateSyncSettings(
  supabase: SupabaseClient,
  settings: CalendarSyncSettings
): Promise<void> {
  try {
    // Validate settings
    if (!settings.sync_statuses || settings.sync_statuses.length === 0) {
      throw new Error('At least one sync status must be selected');
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'calendar_sync_settings')
      .single();

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('settings')
        .update({
          value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'calendar_sync_settings');

      if (error) {
        throw new Error(`Failed to update sync settings: ${error.message}`);
      }
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('settings')
        .insert({
          key: 'calendar_sync_settings',
          value: settings,
          description: 'Google Calendar sync settings',
        });

      if (error) {
        throw new Error(`Failed to create sync settings: ${error.message}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update sync settings: ${error.message}`);
    }
    throw new Error('Failed to update sync settings: Unknown error');
  }
}

/**
 * Check if auto-sync is enabled
 *
 * @param supabase - Supabase client
 * @returns True if auto-sync is enabled
 */
export async function isAutoSyncEnabled(
  supabase: SupabaseClient
): Promise<boolean> {
  const settings = await getSyncSettings(supabase);
  return settings.auto_sync_enabled;
}

/**
 * Check if appointment status should trigger sync
 *
 * @param appointmentStatus - Appointment status
 * @param settings - Calendar sync settings
 * @returns True if status should trigger sync
 */
export function shouldSyncStatus(
  appointmentStatus: AppointmentStatusType,
  settings: CalendarSyncSettings
): boolean {
  return settings.sync_statuses.includes(appointmentStatus);
}

/**
 * Check if appointment is in the past
 *
 * @param scheduledAt - Appointment scheduled time
 * @returns True if appointment is in the past
 */
export function isPastAppointment(scheduledAt: string): boolean {
  const now = new Date();
  const appointmentDate = new Date(scheduledAt);
  return appointmentDate < now;
}

/**
 * Check if appointment is completed
 *
 * @param status - Appointment status
 * @returns True if appointment is completed
 */
export function isCompletedAppointment(status: AppointmentStatusType): boolean {
  return status === 'completed' || status === 'no_show';
}

/**
 * Check if appointment should be synced based on criteria
 *
 * @param appointment - Appointment data
 * @param settings - Calendar sync settings
 * @param force - Force sync regardless of criteria (optional)
 * @returns Sync decision with reason
 *
 * @example
 * ```typescript
 * const settings = await getSyncSettings(supabase);
 * const decision = shouldSyncAppointment(appointment, settings);
 * if (decision.shouldSync) {
 *   // Proceed with sync
 * } else {
 *   console.log('Skip sync:', decision.reason);
 * }
 * ```
 */
export function shouldSyncAppointment(
  appointment: AppointmentForSync,
  settings: CalendarSyncSettings,
  force: boolean = false
): {
  shouldSync: boolean;
  reason?: string;
} {
  // Force sync bypasses all criteria
  if (force) {
    return { shouldSync: true, reason: 'Force sync requested' };
  }

  // Check if auto-sync is enabled
  if (!settings.auto_sync_enabled) {
    return {
      shouldSync: false,
      reason: 'Auto-sync is disabled',
    };
  }

  // Check if appointment status should sync
  if (!shouldSyncStatus(appointment.status, settings)) {
    return {
      shouldSync: false,
      reason: `Status '${appointment.status}' is not configured for sync`,
    };
  }

  // Check if appointment is in the past
  const isPast = isPastAppointment(appointment.scheduled_at);
  if (isPast && !settings.sync_past_appointments) {
    return {
      shouldSync: false,
      reason: 'Past appointments sync is disabled',
    };
  }

  // Check if appointment is completed
  const isCompleted = isCompletedAppointment(appointment.status);
  if (isCompleted && !settings.sync_completed_appointments) {
    return {
      shouldSync: false,
      reason: 'Completed appointments sync is disabled',
    };
  }

  // All criteria passed
  return {
    shouldSync: true,
    reason: 'Appointment meets sync criteria',
  };
}

/**
 * Filter appointments for sync based on criteria
 *
 * @param appointments - Array of appointments
 * @param settings - Calendar sync settings
 * @returns Filtered appointments that should be synced
 *
 * @example
 * ```typescript
 * const settings = await getSyncSettings(supabase);
 * const appointmentsToSync = filterAppointmentsForSync(allAppointments, settings);
 * ```
 */
export function filterAppointmentsForSync(
  appointments: AppointmentForSync[],
  settings: CalendarSyncSettings
): AppointmentForSync[] {
  return appointments.filter((appointment) => {
    const decision = shouldSyncAppointment(appointment, settings);
    return decision.shouldSync;
  });
}

/**
 * Get sync criteria summary for display
 *
 * @param settings - Calendar sync settings
 * @returns Human-readable summary of sync criteria
 */
export function getSyncCriteriaSummary(
  settings: CalendarSyncSettings
): string[] {
  const summary: string[] = [];

  if (!settings.auto_sync_enabled) {
    summary.push('Auto-sync is disabled');
    return summary;
  }

  summary.push('Auto-sync is enabled');
  summary.push(
    `Syncing statuses: ${settings.sync_statuses.join(', ')}`
  );
  summary.push(
    `Past appointments: ${settings.sync_past_appointments ? 'Enabled' : 'Disabled'}`
  );
  summary.push(
    `Completed appointments: ${settings.sync_completed_appointments ? 'Enabled' : 'Disabled'}`
  );

  return summary;
}

/**
 * Validate sync settings
 *
 * @param settings - Calendar sync settings to validate
 * @returns Validation result with errors if invalid
 */
export function validateSyncSettings(settings: CalendarSyncSettings): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!settings.sync_statuses || !Array.isArray(settings.sync_statuses)) {
    errors.push('sync_statuses must be an array');
  } else if (settings.sync_statuses.length === 0) {
    errors.push('At least one sync status must be selected');
  }

  if (typeof settings.auto_sync_enabled !== 'boolean') {
    errors.push('auto_sync_enabled must be a boolean');
  }

  if (typeof settings.sync_past_appointments !== 'boolean') {
    errors.push('sync_past_appointments must be a boolean');
  }

  if (typeof settings.sync_completed_appointments !== 'boolean') {
    errors.push('sync_completed_appointments must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
