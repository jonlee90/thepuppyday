/**
 * Waitlist Added Notification Trigger
 * Sends email + SMS when customer joins the waitlist
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createWaitlistAddedEmail,
  type WaitlistAddedEmailData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface WaitlistAddedTriggerData {
  waitlistEntryId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  requestedDate: string; // YYYY-MM-DD
  timePreference: 'morning' | 'afternoon' | 'any';
  position: number;
}

export interface WaitlistAddedTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

const TIME_PREFERENCE_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  any: 'Any Time',
};

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger waitlist added notifications
 * Sends email and SMS to confirm customer has been added to waitlist
 *
 * @param supabase - Supabase client
 * @param data - Waitlist added data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerWaitlistAdded(
  supabase: SupabaseClient,
  data: WaitlistAddedTriggerData
): Promise<WaitlistAddedTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[WaitlistAdded] Triggering waitlist added notification for entry ${data.waitlistEntryId}`
  );

  // Format date (add time to avoid timezone shifting)
  const requestedDate = format(
    new Date(`${data.requestedDate}T00:00:00`),
    'EEEE, MMMM d, yyyy'
  );
  const timePreferenceLabel = TIME_PREFERENCE_LABELS[data.timePreference] || 'Any Time';

  const templateData: WaitlistAddedEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    requested_date: requestedDate,
    time_preference: timePreferenceLabel,
    position: data.position,
  };

  // Generate pre-rendered content
  const emailContent = createWaitlistAddedEmail(templateData);

  // Send email notification
  try {
    console.log(`[WaitlistAdded] Sending email to ${data.customerEmail}`);

    emailResult = await sendNotification(supabase, {
      type: 'waitlist_added',
      channel: 'email',
      recipient: data.customerEmail,
      templateData: {
        ...templateData,
        position: String(data.position),
        _preRenderedHtml: emailContent.html,
        _preRenderedText: emailContent.text,
        _preRenderedSubject: emailContent.subject,
      },
      userId: data.customerId,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[WaitlistAdded] Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[WaitlistAdded] Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[WaitlistAdded] Email exception:', error);
  }

  const success = emailSent;

  return {
    success,
    emailSent,
    emailResult,
    errors,
  };
}

/**
 * Helper to validate waitlist added data
 */
export function validateWaitlistAddedData(
  data: Partial<WaitlistAddedTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.waitlistEntryId) errors.push('waitlistEntryId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.requestedDate) errors.push('requestedDate is required');
  if (!data.timePreference) errors.push('timePreference is required');
  if (data.position === undefined || data.position === null) {
    errors.push('position is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
