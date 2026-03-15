/**
 * Review Request Notification Trigger
 * Sends email-only notification after appointment completion
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createReviewRequestEmail,
  type ReviewRequestEmailData,
} from '../email-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewRequestTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  petName: string;
  serviceName: string;
  completedAt: string; // ISO timestamp
  /** Google review URL — defaults to NEXT_PUBLIC_GOOGLE_REVIEW_URL env var */
  reviewUrl?: string;
  /** Rebook URL — defaults to app URL + /booking */
  rebookUrl?: string;
}

export interface ReviewRequestTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger review request notification
 * Sends email only (no SMS for review requests)
 *
 * @param supabase - Supabase client
 * @param data - Review request data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerReviewRequest(
  supabase: SupabaseClient,
  data: ReviewRequestTriggerData
): Promise<ReviewRequestTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[ReviewRequest] Triggering review request for appointment ${data.appointmentId}`
  );

  // Resolve URLs with fallbacks
  const reviewUrl =
    data.reviewUrl ||
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    'https://g.page/r/CbbCwxWs-HjiEAE';
  const rebookUrl =
    data.rebookUrl ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking`;

  const templateData: ReviewRequestEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    review_url: reviewUrl,
    rebook_url: rebookUrl,
  };

  // Generate pre-rendered email content
  const emailContent = createReviewRequestEmail(templateData);

  // Send email notification (email only — no SMS for review requests)
  try {
    console.log(`[ReviewRequest] Sending email to ${data.customerEmail}`);

    emailResult = await sendNotification(supabase, {
      type: 'review_request',
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
        `[ReviewRequest] Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[ReviewRequest] Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[ReviewRequest] Email exception:', error);
  }

  return {
    success: emailSent,
    emailSent,
    emailResult,
    errors,
  };
}

/**
 * Helper to validate review request data
 */
export function validateReviewRequestData(
  data: Partial<ReviewRequestTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.completedAt) errors.push('completedAt is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
