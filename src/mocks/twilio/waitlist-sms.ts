/**
 * Waitlist Slot Offer SMS - Mock Implementation
 * For development/testing without actual Twilio calls
 */

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
 * Mock: Send waitlist slot offer SMS to customer
 * Logs to console instead of sending actual SMS
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

    // Mock message SID
    const messageSid = `SM_MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log to console
    console.log('📱 [MOCK] Waitlist Offer SMS:');
    console.log(`  To: ${customerPhone}`);
    console.log(`  Customer: ${customerName}`);
    console.log(`  Offer ID: ${offerId}`);
    console.log(`  Message: ${message}`);
    console.log(`  Message SID: ${messageSid}`);
    console.log(`  Characters: ${message.length}`);

    // Log notification to database
    await logWaitlistSMS(supabase, {
      customerId,
      offerId,
      phone: customerPhone,
      message,
      messageSid,
      status: 'sent',
    });

    return {
      success: true,
      messageSid,
    };
  } catch (error) {
    console.error('❌ [MOCK] Error sending waitlist SMS:', error);

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
 * Log waitlist SMS to notifications_log table (mock store)
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

    console.log('✅ [MOCK] Logged to notifications_log');
  } catch (error) {
    console.error('❌ [MOCK] Error logging waitlist SMS:', error);
  }
}
