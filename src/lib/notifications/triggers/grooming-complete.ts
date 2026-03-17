/**
 * Grooming Complete Notification Trigger
 * Sends email when appointment is marked as completed
 * Includes Yelp review link and rebook CTA
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createGroomingCompleteEmail,
  type GroomingCompleteEmailData,
} from '../email-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface GroomingCompleteTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  petName: string;
  serviceName: string;
}

export interface GroomingCompleteTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const YELP_URL = 'https://www.yelp.com/biz/puppy-day-la-mirada';

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger grooming complete notification
 * Sends email to customer when their pet's grooming session is done
 */
export async function triggerGroomingComplete(
  supabase: SupabaseClient,
  data: GroomingCompleteTriggerData
): Promise<GroomingCompleteTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[GroomingComplete] Triggering grooming complete notification for appointment ${data.appointmentId}`
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const templateData: GroomingCompleteEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    yelp_url: YELP_URL,
    rebook_url: baseUrl,
  };

  // Generate pre-rendered content
  const emailContent = createGroomingCompleteEmail(templateData);

  // Send email notification
  try {
    console.log(`[GroomingComplete] Sending email to ${data.customerEmail}`);

    emailResult = await sendNotification(supabase, {
      type: 'grooming_complete',
      channel: 'email',
      recipient: data.customerEmail,
      templateData: {
        ...templateData,
        _preRenderedHtml: emailContent.html,
        _preRenderedText: emailContent.text,
        _preRenderedSubject: emailContent.subject,
      },
      userId: data.customerId,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[GroomingComplete] Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[GroomingComplete] Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[GroomingComplete] Email exception:', error);
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
 * Helper to validate grooming complete data
 */
export function validateGroomingCompleteData(
  data: Partial<GroomingCompleteTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
