/**
 * Report Card Notification Scheduler
 * Task 0021: Automated notification scheduling for report cards
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { ReportCard, Appointment, User, Pet } from '@/types/database';
import { config } from '@/lib/config';

export interface ReportCardNotificationResult {
  success: boolean;
  emailSent: boolean;
  smsSent: boolean;
  errors: string[];
}

const DEFAULT_NOTIFICATION_DELAY_MINUTES = 15;

/**
 * Schedule and send report card notification to customer
 * Called when appointment is marked as completed
 */
export async function scheduleReportCardNotification(
  supabase: AppSupabaseClient,
  reportCardId: string,
  appointmentId: string
): Promise<ReportCardNotificationResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;

  try {
    console.log('[Report Card Scheduler] Processing notification for report card:', reportCardId);

    // Get report card data
    const reportCardResult = await (supabase as any)
      .from('report_cards')
      .select('*')
      .eq('id', reportCardId)
      .single();

    if (reportCardResult.error || !reportCardResult.data) {
      errors.push('Report card not found');
      return { success: false, emailSent: false, smsSent: false, errors };
    }

    const reportCard: ReportCard = reportCardResult.data;

    // Skip if dont_send flag is true
    if (reportCard.dont_send) {
      console.log('[Report Card Scheduler] Skipping - dont_send flag is set');
      return { success: true, emailSent: false, smsSent: false, errors: [] };
    }

    // Skip if is_draft is true
    if (reportCard.is_draft) {
      console.log('[Report Card Scheduler] Skipping - report card is still a draft');
      return { success: true, emailSent: false, smsSent: false, errors: [] };
    }

    // Skip if already sent
    if (reportCard.sent_at) {
      console.log('[Report Card Scheduler] Skipping - notification already sent');
      return { success: true, emailSent: false, smsSent: false, errors: [] };
    }

    // Get appointment with customer and pet details
    const appointmentResult = await (supabase as any)
      .from('appointments')
      .select(`
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(*)
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentResult.error || !appointmentResult.data) {
      errors.push('Appointment not found');
      return { success: false, emailSent: false, smsSent: false, errors };
    }

    const appointment: Appointment & {
      customer: User;
      pet: Pet;
      service: { name: string };
    } = appointmentResult.data;

    // Check customer notification preferences
    const customerPrefs = appointment.customer.preferences as any;
    const emailEnabled = customerPrefs?.email_report_cards !== false;
    const smsEnabled = customerPrefs?.sms_report_cards === true;

    // Generate public report card URL
    const reportCardUrl = `${config.app.url}/report-card/${reportCardId}`;

    // Apply configurable delay (in production, this would be scheduled)
    // For now, we send immediately after the delay check
    console.log(`[Report Card Scheduler] Waiting ${DEFAULT_NOTIFICATION_DELAY_MINUTES} minutes before sending...`);
    // In production: await sleep(DEFAULT_NOTIFICATION_DELAY_MINUTES * 60 * 1000);

    // Send email notification
    if (emailEnabled && appointment.customer.email) {
      try {
        const { sendReportCardEmail, logReportCardEmail } = await import('@/lib/resend/report-card-email');
        const subject = `${appointment.pet.name}'s Grooming Report Card is Ready!`;

        const emailResult = await sendReportCardEmail({
          to: appointment.customer.email,
          customerName: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
          petName: appointment.pet.name,
          reportCardUrl,
          afterPhotoUrl: reportCard.after_photo_url || undefined,
        });

        // Log email notification to database
        await logReportCardEmail(supabase, {
          customerId: appointment.customer.id,
          reportCardId,
          recipient: appointment.customer.email,
          subject,
          content: `Report card for ${appointment.pet.name}`,
          emailId: emailResult.id,
          status: emailResult.error ? 'failed' : 'sent',
          errorMessage: emailResult.error?.message,
        });

        if (emailResult.error) {
          errors.push(`Email failed: ${emailResult.error.message}`);
        } else {
          emailSent = true;
        }
      } catch (error) {
        console.error('[Report Card Scheduler] Email error:', error);
        errors.push('Email sending failed');
      }
    }

    // Send SMS notification
    if (smsEnabled && appointment.customer.phone) {
      try {
        const { sendReportCardSMS, logReportCardSms, previewReportCardSms } = await import('@/lib/twilio/report-card-sms');

        const smsResult = await sendReportCardSMS({
          to: appointment.customer.phone,
          customerName: appointment.customer.first_name,
          petName: appointment.pet.name,
          reportCardUrl,
        });

        // Log SMS notification to database
        const messageContent = previewReportCardSms({
          to: appointment.customer.phone,
          customerName: appointment.customer.first_name,
          petName: appointment.pet.name,
          reportCardUrl,
        });

        await logReportCardSms(supabase, {
          customerId: appointment.customer.id,
          reportCardId,
          recipient: appointment.customer.phone,
          content: messageContent,
          messageSid: smsResult.sid,
          status: smsResult.error ? 'failed' : 'sent',
          errorMessage: smsResult.error?.message,
        });

        if (smsResult.error) {
          errors.push(`SMS failed: ${smsResult.error.message}`);
        } else {
          smsSent = true;
        }
      } catch (error) {
        console.error('[Report Card Scheduler] SMS error:', error);
        errors.push('SMS sending failed');
      }
    }

    // Update report_cards.sent_at timestamp if any notification was sent
    if (emailSent || smsSent) {
      const updateResult = await (supabase as any)
        .from('report_cards')
        .update({
          sent_at: new Date().toISOString(),
        })
        .eq('id', reportCardId);

      if (updateResult.error) {
        console.error('[Report Card Scheduler] Error updating sent_at:', updateResult.error);
        errors.push('Failed to update sent_at timestamp');
      } else {
        console.log('[Report Card Scheduler] Updated sent_at timestamp');
      }
    }

    return {
      success: errors.length === 0,
      emailSent,
      smsSent,
      errors,
    };
  } catch (error) {
    console.error('[Report Card Scheduler] Unexpected error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, emailSent: false, smsSent: false, errors };
  }
}

/**
 * Check if a report card notification should be sent
 * Used to validate before scheduling
 */
export async function shouldSendReportCardNotification(
  supabase: AppSupabaseClient,
  reportCardId: string
): Promise<{ should_send: boolean; reason?: string }> {
  try {
    const result = await (supabase as any)
      .from('report_cards')
      .select('dont_send, is_draft, sent_at')
      .eq('id', reportCardId)
      .single();

    if (result.error || !result.data) {
      return { should_send: false, reason: 'Report card not found' };
    }

    const reportCard: ReportCard = result.data;

    if (reportCard.dont_send) {
      return { should_send: false, reason: 'dont_send flag is set' };
    }

    if (reportCard.is_draft) {
      return { should_send: false, reason: 'Report card is still a draft' };
    }

    if (reportCard.sent_at) {
      return { should_send: false, reason: 'Notification already sent' };
    }

    return { should_send: true };
  } catch (error) {
    console.error('[Report Card Scheduler] Error checking send status:', error);
    return { should_send: false, reason: 'Error checking status' };
  }
}
