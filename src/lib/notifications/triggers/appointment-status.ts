/**
 * Phase 8 Task 0108: Appointment Status Change Notification Triggers
 * Sends SMS notifications for status changes (Checked In, Ready for Pickup)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import type { AppointmentStatus } from '@/types/database';
import { sendNotification } from '../index';
import {
  createCheckedInSms,
  createReadyForPickupSms,
  type AppointmentStatusData,
} from '../email-templates';

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
  smsSent: boolean;
  smsResult?: NotificationResult;
  skipped: boolean;
  skipReason?: string;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Statuses that trigger SMS notifications
 * - checked_in: Customer has arrived
 * - completed: Grooming done, ready for pickup
 */
const SMS_NOTIFICATION_STATUSES: AppointmentStatus[] = ['checked_in', 'completed'];

/**
 * Retry delay in seconds (30 seconds as per requirements)
 */
const RETRY_DELAY_SECONDS = 30;

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger appointment status change notifications
 * Sends SMS for specific status changes (checked_in, completed)
 *
 * @param supabase - Supabase client
 * @param data - Appointment status change data
 * @returns Result indicating success, whether SMS sent, and any errors
 */
export async function triggerAppointmentStatus(
  supabase: SupabaseClient,
  data: AppointmentStatusTriggerData
): Promise<AppointmentStatusTriggerResult> {
  const errors: string[] = [];
  let smsSent = false;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[AppointmentStatus] Triggering status notification for appointment ${data.appointmentId}, status: ${data.status}`
  );

  // Check if this status should trigger a notification
  if (!data.manualOverride && !SMS_NOTIFICATION_STATUSES.includes(data.status)) {
    console.log(
      `[AppointmentStatus] Skipping - status '${data.status}' does not trigger SMS notifications`
    );
    return {
      success: true,
      smsSent: false,
      skipped: true,
      skipReason: `Status '${data.status}' does not trigger automatic notifications`,
      errors: [],
    };
  }

  // Check if phone number is available
  if (!data.customerPhone) {
    console.log('[AppointmentStatus] Skipping - no phone number available');
    return {
      success: true,
      smsSent: false,
      skipped: true,
      skipReason: 'No phone number available',
      errors: [],
    };
  }

  // Prepare template data
  const templateData: AppointmentStatusData = {
    pet_name: data.petName,
  };

  // Determine notification type based on status
  const notificationType = getNotificationTypeForStatus(data.status);

  if (!notificationType) {
    console.log(`[AppointmentStatus] Skipping - no notification type for status '${data.status}'`);
    return {
      success: true,
      smsSent: false,
      skipped: true,
      skipReason: `No notification type mapped for status '${data.status}'`,
      errors: [],
    };
  }

  // Send SMS notification
  try {
    console.log(
      `[AppointmentStatus] Sending SMS to ${data.customerPhone} for ${notificationType}`
    );

    smsResult = await sendNotification(supabase, {
      type: notificationType,
      channel: 'sms',
      recipient: data.customerPhone,
      templateData,
      userId: data.customerId,
    });

    if (smsResult.success) {
      smsSent = true;
      console.log(
        `[AppointmentStatus] ✅ SMS sent successfully (log ID: ${smsResult.logId})`
      );
    } else {
      errors.push(`SMS failed: ${smsResult.error}`);
      console.error(`[AppointmentStatus] ❌ SMS failed: ${smsResult.error}`);

      // Schedule retry after 30 seconds (if not already a retry)
      // The retry manager will handle this automatically via the retry_after field
      console.log(
        `[AppointmentStatus] Retry will be scheduled automatically by retry manager`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`SMS error: ${errorMessage}`);
    console.error('[AppointmentStatus] SMS exception:', error);
  }

  return {
    success: smsSent,
    smsSent,
    smsResult,
    skipped: false,
    errors,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map appointment status to notification type
 */
function getNotificationTypeForStatus(status: AppointmentStatus): string | null {
  const mapping: Record<string, string> = {
    checked_in: 'appointment_checked_in',
    completed: 'appointment_ready_for_pickup',
  };

  return mapping[status] || null;
}

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
