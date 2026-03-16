/**
 * Admin Cancellation Notification Trigger
 * Sends email to business owner when an appointment is cancelled
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import { createAdminCancellationEmail, type AdminCancellationData } from '../email-templates';
import { getBusinessInfo } from '@/lib/site-content';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminCancellationTriggerData {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  petName: string;
  serviceName: string;
  scheduledAt: string;
  cancellationReason?: string;
  cancelledBy: string;
  bookingReference?: string;
}

export interface AdminCancellationTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

export async function triggerAdminCancellation(
  supabase: SupabaseClient,
  data: AdminCancellationTriggerData
): Promise<AdminCancellationTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[AdminCancellation] Triggering admin notification for appointment ${data.appointmentId}`
  );

  try {
    const business = await getBusinessInfo();
    const adminEmail = business.email;

    const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
    const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');

    const templateData: AdminCancellationData = {
      customer_name: data.customerName,
      pet_name: data.petName,
      service_name: data.serviceName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      cancellation_reason: data.cancellationReason,
      cancelled_by: data.cancelledBy,
      booking_reference: data.bookingReference,
    };

    const email = createAdminCancellationEmail(templateData);

    emailResult = await sendNotification(supabase, {
      type: 'admin_cancellation',
      channel: 'email',
      recipient: adminEmail,
      templateData: {
        ...templateData,
        _preRenderedHtml: email.html,
        _preRenderedText: email.text,
        _preRenderedSubject: email.subject,
      },
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[AdminCancellation] ✅ Email sent to ${adminEmail} (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[AdminCancellation] ❌ Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[AdminCancellation] Email exception:', error);
  }

  return { success: emailSent, emailSent, emailResult, errors };
}

// ============================================================================
// VALIDATOR
// ============================================================================

export function validateAdminCancellationData(
  data: Partial<AdminCancellationTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');
  if (!data.cancelledBy) errors.push('cancelledBy is required');

  return { valid: errors.length === 0, errors };
}
