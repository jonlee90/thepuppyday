/**
 * Phase 8 Task 0108: Appointment Status Change Notification Triggers
 * Previously sent SMS notifications for status changes (Checked In, Ready for Pickup)
 * SMS sending has been removed.
 */

import type { AppointmentStatus } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentStatusTriggerData {
  appointmentId: string;
  customerId: string;
  customerPhone: string | null;
  petName: string;
  status: AppointmentStatus;
  /** Manual override to bypass automatic rules */
  manualOverride?: boolean;
}

export interface AppointmentStatusTriggerResult {
  success: boolean;
  skipped: boolean;
  skipReason?: string;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Statuses that previously triggered SMS notifications
 */
const SMS_NOTIFICATION_STATUSES: AppointmentStatus[] = ['checked_in', 'completed'];

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger appointment status change notifications
 * SMS sending has been removed. This function is now a no-op that returns skipped.
 *
 * @param _supabase - Supabase client (unused)
 * @param data - Appointment status change data
 * @returns Result indicating the notification was skipped
 */
export async function triggerAppointmentStatus(
  _supabase: unknown,
  data: AppointmentStatusTriggerData
): Promise<AppointmentStatusTriggerResult> {
  console.log(
    `[AppointmentStatus] SMS sending removed. Skipping notification for appointment ${data.appointmentId}, status: ${data.status}`
  );

  return {
    success: true,
    skipped: true,
    skipReason: 'SMS sending has been removed',
    errors: [],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate appointment status trigger data
 */
export function validateAppointmentStatusData(
  data: Partial<AppointmentStatusTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.status) errors.push('status is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a status change should send notification
 */
export function shouldSendStatusNotification(
  status: AppointmentStatus,
  manualOverride = false
): boolean {
  if (manualOverride) return true;
  return SMS_NOTIFICATION_STATUSES.includes(status);
}
