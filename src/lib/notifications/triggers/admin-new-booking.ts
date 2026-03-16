/**
 * Admin New Booking Notification Trigger
 * Sends email to business owner when a new appointment is booked
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createAdminNewBookingEmail,
  type AdminNewBookingData,
  type BookingConfirmationAddon,
} from '../email-templates';
import { getBusinessInfo } from '@/lib/site-content';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminNewBookingTriggerData {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  petName: string;
  serviceName: string;
  scheduledAt: string;
  totalPrice: number;
  addons?: BookingConfirmationAddon[];
  bookingReference: string;
  source: 'website' | 'admin' | 'walk_in';
}

export interface AdminNewBookingTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  errors: string[];
}

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

export async function triggerAdminNewBooking(
  supabase: SupabaseClient,
  data: AdminNewBookingTriggerData
): Promise<AdminNewBookingTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[AdminNewBooking] Triggering admin notification for appointment ${data.appointmentId}`
  );

  try {
    const business = await getBusinessInfo();
    const adminEmail = business.email;

    const appointmentDate = format(new Date(data.scheduledAt), 'EEEE, MMMM d, yyyy');
    const appointmentTime = format(new Date(data.scheduledAt), 'h:mm a');

    const templateData: AdminNewBookingData = {
      customer_name: data.customerName,
      customer_phone: data.customerPhone || 'N/A',
      customer_email: data.customerEmail,
      pet_name: data.petName,
      service_name: data.serviceName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      total_price: `$${data.totalPrice.toFixed(2)}`,
      addons: data.addons,
      booking_reference: data.bookingReference,
      source: data.source,
    };

    const email = createAdminNewBookingEmail(templateData);

    emailResult = await sendNotification(supabase, {
      type: 'admin_new_booking',
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
        `[AdminNewBooking] ✅ Email sent to ${adminEmail} (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[AdminNewBooking] ❌ Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[AdminNewBooking] Email exception:', error);
  }

  return { success: emailSent, emailSent, emailResult, errors };
}

// ============================================================================
// VALIDATOR
// ============================================================================

export function validateAdminNewBookingData(
  data: Partial<AdminNewBookingTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.appointmentId) errors.push('appointmentId is required');
  if (!data.customerName) errors.push('customerName is required');
  if (!data.customerEmail) errors.push('customerEmail is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.serviceName) errors.push('serviceName is required');
  if (!data.scheduledAt) errors.push('scheduledAt is required');
  if (!data.bookingReference) errors.push('bookingReference is required');
  if (!data.source) errors.push('source is required');
  if (data.totalPrice === undefined || data.totalPrice === null) {
    errors.push('totalPrice is required');
  }

  return { valid: errors.length === 0, errors };
}
