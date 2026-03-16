/**
 * Admin No-Show Notification Trigger
 * Sends email to business owner when a customer is marked as no-show
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import { createAdminNoShowEmail, type AdminNoShowData } from '../email-templates';
import { getBusinessInfo } from '@/lib/site-content';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminNoShowTriggerData {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string;
  noShowCount: number;
  bookingReference?: string;
}

export interface AdminNoShowTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

export async function triggerAdminNoShow(
  supabase: SupabaseClient,
  data: AdminNoShowTriggerData
): Promise<AdminNoShowTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[AdminNoShow] Triggering admin notification for appointment ${data.appointmentId}`
  );

  try {
    const business = await getBusinessInfo();
    const adminEmail = business.email;

    const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
    const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');

    const templateData: AdminNoShowData = {
      customer_name: data.customerName,
      customer_phone: data.customerPhone || 'N/A',
      pet_name: data.petName,
      service_name: data.serviceName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      no_show_count: data.noShowCount,
      booking_reference: data.bookingReference,
    };

    const email = createAdminNoShowEmail(templateData);

    emailResult = await sendNotification(supabase, {
      type: 'admin_no_show',
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
        `[AdminNoShow] ✅ Email sent to ${adminEmail} (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[AdminNoShow] ❌ Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[AdminNoShow] Email exception:', error);
  }

  return { success: emailSent, emailSent, emailResult, errors };
}

// ============================================================================
// VALIDATOR
// ============================================================================

export function validateAdminNoShowData(
  data: Partial<AdminNoShowTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');
  if (data.noShowCount === undefined || data.noShowCount === null) {
    errors.push('noShowCount is required');
  }

  return { valid: errors.length === 0, errors };
}
