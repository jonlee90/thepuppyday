/**
 * Phase 8 Task 0109: Report Card Completion Notification Trigger
 * Sends email + SMS notifications when report card is marked complete
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createReportCardEmail,
  createReportCardSms,
  type ReportCardData,
} from '../email-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportCardCompletionTriggerData {
  reportCardId: string;
  appointmentId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface ReportCardCompletionTriggerResult {
  success: boolean;
  emailSent: boolean;
  smsSent: boolean;
  emailResult?: NotificationResult;
  smsResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger report card completion notifications
 * Sends both email and SMS notifications when report card is marked complete
 *
 * @param supabase - Supabase client
 * @param data - Report card completion data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerReportCardCompletion(
  supabase: SupabaseClient,
  data: ReportCardCompletionTriggerData
): Promise<ReportCardCompletionTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let emailResult: NotificationResult | undefined;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[ReportCardCompletion] Triggering report card notification for ${data.reportCardId}`
  );

  // Generate report card link
  // In production, this would be the full URL with the report card UUID
  const reportCardLink = generateReportCardLink(data.reportCardId);

  const templateData: ReportCardData = {
    pet_name: data.petName,
    report_card_link: reportCardLink,
    before_image_url: data.beforeImageUrl,
    after_image_url: data.afterImageUrl,
  };

  // Send email notification
  try {
    console.log(`[ReportCardCompletion] Sending email to ${data.customerEmail}`);

    emailResult = await sendNotification(supabase, {
      type: 'report_card_ready',
      channel: 'email',
      recipient: data.customerEmail,
      templateData,
      userId: data.customerId,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[ReportCardCompletion] ✅ Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[ReportCardCompletion] ❌ Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[ReportCardCompletion] Email exception:', error);
  }

  // Send SMS notification if phone number is available
  if (data.customerPhone) {
    try {
      console.log(`[ReportCardCompletion] Sending SMS to ${data.customerPhone}`);

      smsResult = await sendNotification(supabase, {
        type: 'report_card_ready',
        channel: 'sms',
        recipient: data.customerPhone,
        templateData,
        userId: data.customerId,
      });

      if (smsResult.success) {
        smsSent = true;
        console.log(
          `[ReportCardCompletion] ✅ SMS sent successfully (log ID: ${smsResult.logId})`
        );
      } else {
        errors.push(`SMS failed: ${smsResult.error}`);
        console.error(`[ReportCardCompletion] ❌ SMS failed: ${smsResult.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`SMS error: ${errorMessage}`);
      console.error('[ReportCardCompletion] SMS exception:', error);
    }
  } else {
    console.log('[ReportCardCompletion] Skipping SMS - no phone number provided');
  }

  // Update report_cards.sent_at timestamp if any notification was sent
  // Use conditional update to prevent race conditions from overwriting timestamps
  if (emailSent || smsSent) {
    try {
      const { error: updateError } = await supabase
        .from('report_cards')
        .update({
          sent_at: new Date().toISOString(),
        })
        .eq('id', data.reportCardId)
        .is('sent_at', null); // Only update if sent_at is currently null

      if (updateError) {
        console.error(
          '[ReportCardCompletion] Error updating sent_at timestamp:',
          updateError
        );
        errors.push('Failed to update sent_at timestamp');
      } else {
        console.log('[ReportCardCompletion] Updated sent_at timestamp');
      }
    } catch (error) {
      console.error('[ReportCardCompletion] Exception updating sent_at:', error);
      errors.push('Exception updating sent_at timestamp');
    }
  }

  // Determine overall success
  // Success if at least one channel succeeded
  const success = emailSent || smsSent;

  return {
    success,
    emailSent,
    smsSent,
    emailResult,
    smsResult,
    errors,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate public report card link
 * Uses the report card UUID for public access
 */
function generateReportCardLink(reportCardId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/report-cards/${reportCardId}`;
}

/**
 * Validate report card completion trigger data
 */
export function validateReportCardCompletionData(
  data: Partial<ReportCardCompletionTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.reportCardId) errors.push('reportCardId is required');
  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if report card should send notification
 * Validates business rules (not draft, not already sent, etc.)
 */
export async function shouldSendReportCardNotification(
  supabase: SupabaseClient,
  reportCardId: string
): Promise<{ should_send: boolean; reason?: string }> {
  try {
    const { data: reportCard, error } = await supabase
      .from('report_cards')
      .select('is_draft, dont_send, sent_at')
      .eq('id', reportCardId)
      .single();

    if (error || !reportCard) {
      return { should_send: false, reason: 'Report card not found' };
    }

    if (reportCard.is_draft) {
      return { should_send: false, reason: 'Report card is still a draft' };
    }

    if (reportCard.dont_send) {
      return { should_send: false, reason: 'dont_send flag is set' };
    }

    if (reportCard.sent_at) {
      return { should_send: false, reason: 'Notification already sent' };
    }

    return { should_send: true };
  } catch (error) {
    console.error('[ReportCardCompletion] Error checking send status:', error);
    return { should_send: false, reason: 'Error checking status' };
  }
}
