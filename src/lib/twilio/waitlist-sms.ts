/**
 * Waitlist Slot Offer SMS via Twilio
 * Production implementation for sending waitlist slot offer notifications
 */

import { getTwilioClient } from './client';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface WaitlistSMSParams {
  customerName: string;
  customerPhone: string;
  customerId: string;
  petName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  discountPercentage: number;
  responseWindowHours: number;
  offerId: string;
}

interface WaitlistSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send waitlist slot offer SMS to customer
 *
 * @param supabase Supabase client for logging
 * @param params SMS parameters
 * @returns Result with success status and message SID
 */
export async function sendWaitlistOfferSMS(
  supabase: AppSupabaseClient,
  params: WaitlistSMSParams
): Promise<WaitlistSMSResult> {
  try {
    const {
      customerName,
      customerPhone,
      customerId,
      petName,
      serviceName,
      appointmentDate,
      appointmentTime,
      discountPercentage,
      responseWindowHours,
      offerId,
    } = params;

    // Format the date
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    // Generate message
    const message =
      `Hi ${customerName}! ` +
      `A ${serviceName} slot for ${petName} opened up on ${formattedDate} at ${appointmentTime}. ` +
      `${discountPercentage}% off if you book now! ` +
      `Reply YES within ${responseWindowHours}h to claim. - The Puppy Day`;

    // Send SMS via Twilio
    const twilioClient = getTwilioClient();
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      to: customerPhone,
      from: process.env.TWILIO_PHONE_NUMBER!,
    });

    // Log notification to database
    await logWaitlistSMS(supabase, {
      customerId,
      offerId,
      phone: customerPhone,
      message,
      messageSid: twilioMessage.sid,
      status: 'sent',
    });

    return {
      success: true,
      messageSid: twilioMessage.sid,
    };
  } catch (error) {
    console.error('Error sending waitlist SMS:', error);

    // Log failed notification
    await logWaitlistSMS(supabase, {
      customerId: params.customerId,
      offerId: params.offerId,
      phone: params.customerPhone,
      message: 'Failed to send',
      messageSid: null,
      status: 'failed',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log waitlist SMS to notifications_log table
 */
async function logWaitlistSMS(
  supabase: AppSupabaseClient,
  params: {
    customerId: string;
    offerId: string;
    phone: string;
    message: string;
    messageSid: string | null;
    status: string;
  }
): Promise<void> {
  try {
    await (supabase as any).from('notifications_log').insert({
      customer_id: params.customerId,
      type: 'waitlist_offer',
      channel: 'sms',
      recipient: params.phone,
      content: params.message,
      message_id: params.messageSid,
      tracking_id: params.offerId,
      status: params.status,
    });
  } catch (error) {
    console.error('Error logging waitlist SMS:', error);
  }
}
