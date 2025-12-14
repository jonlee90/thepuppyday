/**
 * Breed Reminder SMS Notifications
 * Task 0038: SMS template for breed-based grooming reminders
 * Production implementation using Twilio
 */

import { sendSms } from './client';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface BreedReminderSMSParams {
  customerName: string;
  customerPhone: string;
  customerId: string;
  petName: string;
  petId: string;
  breedName: string;
  breedMessage?: string; // Optional custom breed message
  trackingId: string;
  bookingUrl: string;
}

interface BreedReminderSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Breed-specific messaging for SMS reminders
 */
const BREED_MESSAGES: Record<string, string> = {
  poodle: 'to prevent matting',
  'toy poodle': 'to prevent matting',
  'miniature poodle': 'to prevent matting',
  'standard poodle': 'to prevent matting',
  'golden retriever': 'for their coat',
  'labrador retriever': 'for their coat',
  yorkie: 'to keep silky',
  'yorkshire terrier': 'to keep silky',
  husky: 'for seasonal care',
  'siberian husky': 'for seasonal care',
  shih: 'to prevent mats',
  'shih tzu': 'to prevent mats',
  maltese: 'to prevent tangles',
  bichon: 'to prevent matting',
  'bichon frise': 'to prevent matting',
  doodle: 'to prevent matting',
  goldendoodle: 'to prevent matting',
  labradoodle: 'to prevent matting',
  cockapoo: 'to prevent matting',
  default: 'for their breed',
};

/**
 * Get breed-specific message for SMS
 */
function getBreedMessage(breedName: string, customMessage?: string): string {
  if (customMessage) {
    return customMessage;
  }

  const breedLower = breedName.toLowerCase();

  // Check for exact match
  if (BREED_MESSAGES[breedLower]) {
    return BREED_MESSAGES[breedLower];
  }

  // Check for partial match (e.g., "poodle" in "toy poodle")
  for (const [key, value] of Object.entries(BREED_MESSAGES)) {
    if (breedLower.includes(key)) {
      return value;
    }
  }

  return BREED_MESSAGES.default;
}

/**
 * Build SMS message from template
 * Template: "Hi {name}, {petName} is due for a groom {breedMessage}! Book now: {link}"
 * Keeps message under 160 characters when possible
 */
function buildBreedReminderSmsMessage(params: BreedReminderSMSParams): string {
  const { customerName, petName, breedName, breedMessage: customMessage, bookingUrl } = params;
  const breedMsg = getBreedMessage(breedName, customMessage);

  // Build message - short and concise for SMS
  const message = `Hi ${customerName}, ${petName} is due for a groom ${breedMsg}! Book now: ${bookingUrl}`;

  return message;
}

/**
 * Send breed reminder SMS to customer
 * Production implementation using Twilio
 */
export async function sendBreedReminderSMS(
  supabase: AppSupabaseClient,
  params: BreedReminderSMSParams
): Promise<BreedReminderSMSResult> {
  try {
    const { customerPhone, customerId, trackingId } = params;

    // Build SMS message
    const message = buildBreedReminderSmsMessage(params);

    console.log('[Breed Reminder SMS] Sending to:', customerPhone);
    console.log('[Breed Reminder SMS] Characters:', message.length);

    // Send SMS using Twilio client
    const result = await sendSms({
      to: customerPhone,
      body: message,
    });

    if (result.error) {
      console.error('[Breed Reminder SMS] Send error:', result.error);

      // Log failed notification
      await logBreedReminderSMS(supabase, {
        customerId,
        trackingId,
        phone: customerPhone,
        message,
        messageSid: null,
        status: 'failed',
      });

      return {
        success: false,
        error: result.error.message,
      };
    }

    console.log('[Breed Reminder SMS] Sent successfully:', result.sid);

    // Log successful notification
    await logBreedReminderSMS(supabase, {
      customerId,
      trackingId,
      phone: customerPhone,
      message,
      messageSid: result.sid,
      status: 'sent',
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('[Breed Reminder SMS] Unexpected error:', error);

    // Log failed notification
    await logBreedReminderSMS(supabase, {
      customerId: params.customerId,
      trackingId: params.trackingId,
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
 * Log breed reminder SMS to notifications_log table
 */
async function logBreedReminderSMS(
  supabase: AppSupabaseClient,
  params: {
    customerId: string;
    trackingId: string;
    phone: string;
    message: string;
    messageSid: string | null;
    status: string;
  }
): Promise<void> {
  try {
    await (supabase as any).from('notifications_log').insert({
      customer_id: params.customerId,
      type: 'breed_reminder',
      channel: 'sms',
      recipient: params.phone,
      content: params.message,
      message_id: params.messageSid,
      tracking_id: params.trackingId,
      status: params.status,
    });
  } catch (error) {
    console.error('[Breed Reminder SMS] Error logging to database:', error);
  }
}

/**
 * Preview SMS message without sending
 * Useful for testing and admin preview
 */
export function previewBreedReminderSms(params: BreedReminderSMSParams): string {
  return buildBreedReminderSmsMessage(params);
}
