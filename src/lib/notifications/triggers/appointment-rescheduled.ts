/**
 * Appointment Rescheduled Notification Trigger
 * Sends email + SMS notifications when appointment is rescheduled
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createAppointmentRescheduledEmail,
  createAppointmentRescheduledSms,
  type AppointmentRescheduledEmailData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentRescheduledTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  originalScheduledAt: string; // ISO timestamp
  newScheduledAt: string; // ISO timestamp
}

export interface AppointmentRescheduledTriggerResult {
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
 * Trigger appointment rescheduled notifications
 * Sends email and SMS to notify customer of new appointment time
 *
 * @param supabase - Supabase client
 * @param data - Appointment rescheduled data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerAppointmentRescheduled(
  supabase: SupabaseClient,
  data: AppointmentRescheduledTriggerData
): Promise<AppointmentRescheduledTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let emailResult: NotificationResult | undefined;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[AppointmentRescheduled] Triggering rescheduled notification for appointment ${data.appointmentId}`
  );

  // Format both dates
  const originalDate = format(new Date(data.originalScheduledAt), 'EEEE, MMMM d, yyyy');
  const originalTime = format(new Date(data.originalScheduledAt), 'h:mm a');
  const newDate = format(new Date(data.newScheduledAt), 'EEEE, MMMM d, yyyy');
  const newTime = format(new Date(data.newScheduledAt), 'h:mm a');
  const newDateShort = format(new Date(data.newScheduledAt), 'M/d/yyyy');

  const templateData: AppointmentRescheduledEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    original_date: originalDate,
    original_time: originalTime,
    new_date: newDate,
    new_time: newTime,
  };

  // Generate pre-rendered content
  const emailContent = createAppointmentRescheduledEmail(templateData);
  const smsText = createAppointmentRescheduledSms({
    pet_name: data.petName,
    new_date: newDateShort,
    new_time: newTime,
  });

  // Dispatch email and SMS in parallel
  const notificationPromises: Promise<void>[] = [];

  // Email notification
  notificationPromises.push(
    (async () => {
      try {
        console.log(`[AppointmentRescheduled] Sending email to ${data.customerEmail}`);

        emailResult = await sendNotification(supabase, {
          type: 'appointment_rescheduled',
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
            `[AppointmentRescheduled] Email sent successfully (log ID: ${emailResult.logId})`
          );
        } else {
          errors.push(`Email failed: ${emailResult.error}`);
          console.error(`[AppointmentRescheduled] Email failed: ${emailResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Email error: ${errorMessage}`);
        console.error('[AppointmentRescheduled] Email exception:', error);
      }
    })()
  );

  // SMS notification (if phone available)
  if (data.customerPhone) {
    notificationPromises.push(
      (async () => {
        try {
          console.log(`[AppointmentRescheduled] Sending SMS to ${data.customerPhone}`);

          smsResult = await sendNotification(supabase, {
            type: 'appointment_rescheduled',
            channel: 'sms',
            recipient: data.customerPhone!,
            templateData: { _preRenderedText: smsText },
            userId: data.customerId,
          });

          if (smsResult.success) {
            smsSent = true;
            console.log(
              `[AppointmentRescheduled] SMS sent successfully (log ID: ${smsResult.logId})`
            );
          } else {
            errors.push(`SMS failed: ${smsResult.error}`);
            console.error(`[AppointmentRescheduled] SMS failed: ${smsResult.error}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`SMS error: ${errorMessage}`);
          console.error('[AppointmentRescheduled] SMS exception:', error);
        }
      })()
    );
  } else {
    console.log('[AppointmentRescheduled] Skipping SMS - no phone number provided');
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
 * Helper to validate appointment rescheduled data
 */
export function validateAppointmentRescheduledData(
  data: Partial<AppointmentRescheduledTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.originalScheduledAt) errors.push('originalScheduledAt is required');
  if (!data.newScheduledAt) errors.push('newScheduledAt is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
