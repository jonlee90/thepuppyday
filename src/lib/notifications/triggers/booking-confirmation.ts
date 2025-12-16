/**
 * Phase 8 Task 0107: Booking Confirmation Notification Trigger
 * Sends email + SMS notifications when appointment is created
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createBookingConfirmationEmail,
  createBookingConfirmationSms,
  type BookingConfirmationData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface BookingConfirmationTriggerData {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string; // ISO timestamp
  totalPrice: number;
}

export interface BookingConfirmationTriggerResult {
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
 * Trigger booking confirmation notifications
 * Sends both email and SMS notifications when appointment is created
 *
 * @param supabase - Supabase client
 * @param data - Appointment booking data
 * @returns Result indicating success, which channels sent, and any errors
 */
export async function triggerBookingConfirmation(
  supabase: SupabaseClient,
  data: BookingConfirmationTriggerData
): Promise<BookingConfirmationTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;
  let emailResult: NotificationResult | undefined;
  let smsResult: NotificationResult | undefined;

  console.log(
    `[BookingConfirmation] Triggering booking confirmation for appointment ${data.appointmentId}`
  );

  // Format data for templates
  const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
  const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');
  const totalPrice = `$${data.totalPrice.toFixed(2)}`;

  const templateData: BookingConfirmationData = {
    customer_name: data.customerName,
    pet_name: data.petName,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    service_name: data.serviceName,
    total_price: totalPrice,
  };

  // Send email notification
  try {
    console.log(`[BookingConfirmation] Sending email to ${data.customerEmail}`);

    emailResult = await sendNotification(supabase, {
      type: 'booking_confirmation',
      channel: 'email',
      recipient: data.customerEmail,
      templateData,
      userId: data.customerId,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[BookingConfirmation] ✅ Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[BookingConfirmation] ❌ Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[BookingConfirmation] Email exception:', error);
  }

  // Send SMS notification if phone number is available
  if (data.customerPhone) {
    try {
      console.log(`[BookingConfirmation] Sending SMS to ${data.customerPhone}`);

      smsResult = await sendNotification(supabase, {
        type: 'booking_confirmation',
        channel: 'sms',
        recipient: data.customerPhone,
        templateData,
        userId: data.customerId,
      });

      if (smsResult.success) {
        smsSent = true;
        console.log(
          `[BookingConfirmation] ✅ SMS sent successfully (log ID: ${smsResult.logId})`
        );
      } else {
        errors.push(`SMS failed: ${smsResult.error}`);
        console.error(`[BookingConfirmation] ❌ SMS failed: ${smsResult.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`SMS error: ${errorMessage}`);
      console.error('[BookingConfirmation] SMS exception:', error);
    }
  } else {
    console.log('[BookingConfirmation] Skipping SMS - no phone number provided');
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

/**
 * Helper to validate booking confirmation data
 */
export function validateBookingConfirmationData(
  data: Partial<BookingConfirmationTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');
  if (data.totalPrice === undefined || data.totalPrice === null) {
    errors.push('totalPrice is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
