/**
 * Breed Reminder SMS - Mock Implementation
 * Task 0038: Mock SMS for development/testing without actual Twilio calls
 */

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
 */
function buildBreedReminderSmsMessage(params: BreedReminderSMSParams): string {
  const { customerName, petName, breedName, breedMessage: customMessage, bookingUrl } = params;
  const breedMsg = getBreedMessage(breedName, customMessage);

  const message = `Hi ${customerName}, ${petName} is due for a groom ${breedMsg}! Book now: ${bookingUrl}`;

  return message;
}

/**
 * Mock: Send breed reminder SMS to customer
 * Logs to console instead of sending actual SMS
 */
export async function sendBreedReminderSMS(
  supabase: AppSupabaseClient,
  params: BreedReminderSMSParams
): Promise<BreedReminderSMSResult> {
  try {
    const { customerPhone, customerId, petName, breedName, trackingId } = params;

    // Build SMS message
    const message = buildBreedReminderSmsMessage(params);

    // Mock message SID
    const messageSid = `SM_MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log to console
    console.log('📱 [MOCK] Breed Reminder SMS:');
    console.log('─'.repeat(50));
    console.log(`  To: ${customerPhone}`);
    console.log(`  Customer: ${params.customerName}`);
    console.log(`  Pet: ${petName} (${breedName})`);
    console.log(`  Tracking ID: ${trackingId}`);
    console.log(`\n  Message:\n  ${message}`);
    console.log(`\n  Characters: ${message.length}`);
    console.log(`  Message SID: ${messageSid}`);
    console.log('─'.repeat(50));

    // Log notification to database
    await logBreedReminderSMS(supabase, {
      customerId,
      trackingId,
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
    console.error('❌ [MOCK] Error sending breed reminder SMS:', error);

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
 * Log breed reminder SMS to notifications_log table (mock store)
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

    console.log('✅ [MOCK] Logged to notifications_log');
  } catch (error) {
    console.error('❌ [MOCK] Error logging breed reminder SMS:', error);
  }
}

/**
 * Preview SMS message without sending
 * Useful for testing and admin preview
 */
export function previewBreedReminderSms(params: BreedReminderSMSParams): string {
  return buildBreedReminderSmsMessage(params);
}
