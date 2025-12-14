/**
 * Report Card SMS Notifications
 * Task 0022: SMS template and delivery for report cards
 */

import { sendSms } from '@/lib/twilio/client';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface ReportCardSmsParams {
  to: string;
  customerName: string;
  petName: string;
  reportCardUrl: string;
}

export interface ReportCardSmsResult {
  sid?: string;
  status?: string;
  error: Error | null;
}

/**
 * Send report card SMS to customer
 * Template: "Hi {customerName}! {petName}'s grooming report is ready! See how they did: {reportCardUrl}"
 */
export async function sendReportCardSMS(
  params: ReportCardSmsParams
): Promise<ReportCardSmsResult> {
  try {
    // Build SMS message
    const message = buildReportCardSmsMessage(params);

    console.log('[Report Card SMS] Sending to:', params.to);

    // Send SMS using Twilio client
    const result = await sendSms({
      to: params.to,
      body: message,
    });

    if (result.error) {
      console.error('[Report Card SMS] Send error:', result.error);
      return { error: result.error };
    }

    console.log('[Report Card SMS] Sent successfully:', result.sid);

    // Log to notifications_log (we'll do this after getting supabase instance)
    // The scheduler will pass the supabase instance for logging

    return {
      sid: result.sid,
      status: 'sent',
      error: null,
    };
  } catch (error) {
    console.error('[Report Card SMS] Unexpected error:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Log SMS notification to database
 */
export async function logReportCardSms(
  supabase: AppSupabaseClient,
  params: {
    customerId: string;
    reportCardId: string;
    recipient: string;
    content: string;
    messageSid?: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const logEntry = {
      customer_id: params.customerId,
      type: 'report_card',
      channel: 'sms' as const,
      recipient: params.recipient,
      subject: null,
      content: params.content,
      status: params.status,
      error_message: params.errorMessage || null,
      sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    };

    const result = await (supabase as any)
      .from('notifications_log')
      .insert(logEntry);

    if (result.error) {
      console.error('[Report Card SMS] Error logging to database:', result.error);
    }
  } catch (error) {
    console.error('[Report Card SMS] Error in logReportCardSms:', error);
  }
}

/**
 * Build SMS message from template
 */
function buildReportCardSmsMessage(params: ReportCardSmsParams): string {
  // Template: "Hi {customerName}! {petName}'s grooming report is ready! See how they did: {reportCardUrl}"
  return `Hi ${params.customerName}! ${params.petName}'s grooming report is ready! See how they did: ${params.reportCardUrl}`;
}

/**
 * Preview SMS message without sending
 * Useful for testing and admin preview
 */
export function previewReportCardSms(params: ReportCardSmsParams): string {
  return buildReportCardSmsMessage(params);
}
