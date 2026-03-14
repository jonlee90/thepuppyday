/**
 * Appointment Reminder Notification Trigger
 * Sends email + SMS notifications 24 hours before appointment
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createAppointmentReminderEmail,
  createAppointmentReminderSmsFromEmail,
  type AppointmentReminderEmailData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AppointmentReminderTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string; // ISO timestamp
}

export interface AppointmentReminderTriggerResult {
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
 * Trigger appointment reminder notifications
 * Sends email and SMS to remind customer of upcoming appointment
 *
 * @param supabase - Supabase client
 * @param data - Appointment reminder data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerAppointmentReminder(
  supabase: SupabaseClient,
  data: AppointmentReminderTriggerData
): Promise<AppointmentReminderTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let emailResult: NotificationResult | undefined;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[AppointmentReminder] Triggering reminder for appointment ${data.appointmentId}`
  );

  // Format data for templates
  const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
  const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');

  const templateData: AppointmentReminderEmailData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    service_name: data.serviceName,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
  };

  // Generate pre-rendered email content for providers that need it
  const emailContent = createAppointmentReminderEmail(templateData);

  // Dispatch email and SMS in parallel
  const notificationPromises: Promise<void>[] = [];

  // Email notification
  notificationPromises.push(
    (async () => {
      try {
        console.log(`[AppointmentReminder] Sending email to ${data.customerEmail}`);

        emailResult = await sendNotification(supabase, {
          type: 'appointment_reminder',
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
            `[AppointmentReminder] Email sent successfully (log ID: ${emailResult.logId})`
          );
        } else {
          errors.push(`Email failed: ${emailResult.error}`);
          console.error(`[AppointmentReminder] Email failed: ${emailResult.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Email error: ${errorMessage}`);
        console.error('[AppointmentReminder] Email exception:', error);
      }
    })()
  );

  // SMS notification (if phone available)
  if (data.customerPhone) {
    notificationPromises.push(
      (async () => {
        try {
          console.log(`[AppointmentReminder] Sending SMS to ${data.customerPhone}`);

          const smsText = createAppointmentReminderSmsFromEmail(templateData);

          smsResult = await sendNotification(supabase, {
            type: 'appointment_reminder',
            channel: 'sms',
            recipient: data.customerPhone!,
            templateData: { ...templateData, _preRenderedText: smsText },
            userId: data.customerId,
          });

          if (smsResult.success) {
            smsSent = true;
            console.log(
              `[AppointmentReminder] SMS sent successfully (log ID: ${smsResult.logId})`
            );
          } else {
            errors.push(`SMS failed: ${smsResult.error}`);
            console.error(`[AppointmentReminder] SMS failed: ${smsResult.error}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`SMS error: ${errorMessage}`);
          console.error('[AppointmentReminder] SMS exception:', error);
        }
      })()
    );
  } else {
    console.log('[AppointmentReminder] Skipping SMS - no phone number provided');
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
 * Helper to validate appointment reminder data
 */
export function validateAppointmentReminderData(
  data: Partial<AppointmentReminderTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
