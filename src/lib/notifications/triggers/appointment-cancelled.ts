/**
 * Appointment Cancelled Notification Trigger
 * Sends email + SMS notifications when appointment is cancelled
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createAppointmentCancelledEmail,
  createAppointmentCancelledSms,
  type AppointmentCancelledEmailData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentCancelledTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string; // ISO timestamp
  cancellationReason?: string;
  cancelledBy: 'customer' | 'admin';
  rebookUrl: string;
}

export interface AppointmentCancelledTriggerResult {
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
 * Trigger appointment cancellation notifications
 * Sends email and SMS to notify customer of cancellation
 *
 * @param supabase - Supabase client
 * @param data - Appointment cancellation data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerAppointmentCancelled(
  supabase: SupabaseClient,
  data: AppointmentCancelledTriggerData
): Promise<AppointmentCancelledTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let emailResult: NotificationResult | undefined;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[AppointmentCancelled] Triggering cancellation notification for appointment ${data.appointmentId}`
  );

  // Format data for templates
  const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
  const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');
  const rebookUrl = data.rebookUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking`;

  const templateData: AppointmentCancelledEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    cancellation_reason: data.cancellationReason,
    cancelled_by: data.cancelledBy,
    rebook_url: rebookUrl,
  };

  // Generate pre-rendered content
  const emailContent = createAppointmentCancelledEmail(templateData);
  const smsText = createAppointmentCancelledSms({
    pet_name: data.petName,
    appointment_date: appointmentDate,
    rebook_url: rebookUrl,
  });

  // Dispatch email and SMS in parallel
  const notificationPromises: Promise<void>[] = [];

  // Email notification
  notificationPromises.push(
    (async () => {
      try {
        console.log(`[AppointmentCancelled] Sending email to ${data.customerEmail}`);

        emailResult = await sendNotification(supabase, {
          type: 'appointment_cancelled',
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
            `[AppointmentCancelled] Email sent successfully (log ID: ${emailResult.logId})`
          );
        } else {
          errors.push(`Email failed: ${emailResult.error}`);
          console.error(`[AppointmentCancelled] Email failed: ${emailResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Email error: ${errorMessage}`);
        console.error('[AppointmentCancelled] Email exception:', error);
      }
    })()
  );

  // SMS notification (if phone available)
  if (data.customerPhone) {
    notificationPromises.push(
      (async () => {
        try {
          console.log(`[AppointmentCancelled] Sending SMS to ${data.customerPhone}`);

          smsResult = await sendNotification(supabase, {
            type: 'appointment_cancelled',
            channel: 'sms',
            recipient: data.customerPhone!,
            templateData: { _preRenderedText: smsText },
            userId: data.customerId,
          });

          if (smsResult.success) {
            smsSent = true;
            console.log(
              `[AppointmentCancelled] SMS sent successfully (log ID: ${smsResult.logId})`
            );
          } else {
            errors.push(`SMS failed: ${smsResult.error}`);
            console.error(`[AppointmentCancelled] SMS failed: ${smsResult.error}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`SMS error: ${errorMessage}`);
          console.error('[AppointmentCancelled] SMS exception:', error);
        }
      })()
    );
  } else {
    console.log('[AppointmentCancelled] Skipping SMS - no phone number provided');
  }

  await Promise.all(notificationPromises);

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

/**
 * Helper to validate appointment cancelled data
 */
export function validateAppointmentCancelledData(
  data: Partial<AppointmentCancelledTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');
  if (!data.cancelledBy) errors.push('cancelledBy is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
