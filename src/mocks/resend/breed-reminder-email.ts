/**
 * Mock Breed Reminder Email
 * Task 0038: Mock email sending for development/testing
 */

import { generateId } from '@/lib/utils';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface BreedReminderEmailParams {
  customerName: string;
  customerEmail: string;
  customerId: string;
  petName: string;
  petId: string;
  breedName: string;
  breedMessage: string;
  petPhotoUrl?: string;
  trackingId: string;
  bookingUrl: string;
}

export interface BreedReminderEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Extended breed-specific messages for email
 */
const BREED_EMAIL_MESSAGES: Record<string, string> = {
  poodle: 'Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy.',
  'golden retriever': 'Golden Retrievers benefit from grooming every 6-8 weeks to maintain their gorgeous coat and reduce shedding.',
  yorkie: 'Yorkies need grooming every 4-6 weeks to keep their silky coat tangle-free.',
  husky: 'Huskies need seasonal grooming to manage their thick double coat.',
  'shih tzu': 'Shih Tzus need grooming every 4-6 weeks to prevent mats and keep their coat healthy.',
  default: "Based on your pet's breed, regular grooming helps keep them healthy and comfortable.",
};

/**
 * Get breed-specific message for email
 */
function getBreedEmailMessage(breedName: string, customMessage?: string): string {
  if (customMessage) {
    return customMessage;
  }

  const breedLower = breedName.toLowerCase();

  // Check for exact match
  if (BREED_EMAIL_MESSAGES[breedLower]) {
    return BREED_EMAIL_MESSAGES[breedLower];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(BREED_EMAIL_MESSAGES)) {
    if (breedLower.includes(key)) {
      return value;
    }
  }

  return BREED_EMAIL_MESSAGES.default;
}

/**
 * Mock: Send breed reminder email to customer
 * Simulates email sending and logs to console
 */
export async function sendBreedReminderEmail(
  supabase: AppSupabaseClient,
  params: BreedReminderEmailParams
): Promise<BreedReminderEmailResult> {
  try {
    const { customerEmail, customerId, petName, breedName, trackingId } = params;

    // Generate fake email ID
    const emailId = `email_${generateId()}`;

    // Build subject
    const subject = `${petName}'s Grooming Appointment Reminder`;

    // Get breed message
    const breedMsg = getBreedEmailMessage(breedName, params.breedMessage);

    // Build simple text preview
    const textPreview = buildTextPreview(params, breedMsg);

    // Log to console
    console.log('\n📧 [MOCK] Breed Reminder Email:');
    console.log('═'.repeat(60));
    console.log(`To: ${customerEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Pet: ${petName} (${breedName})`);
    console.log(`Customer: ${params.customerName}`);
    console.log(`Tracking ID: ${trackingId}`);
    console.log(`Booking URL: ${params.bookingUrl}`);
    if (params.petPhotoUrl) {
      console.log(`Pet Photo: ${params.petPhotoUrl}`);
    }
    console.log('\n' + '─'.repeat(60));
    console.log('Email Preview:');
    console.log('─'.repeat(60));
    console.log(textPreview);
    console.log('─'.repeat(60));
    console.log(`Email ID: ${emailId}`);
    console.log('═'.repeat(60) + '\n');

    // Log notification to database
    await logBreedReminderEmail(supabase, {
      customerId,
      trackingId,
      recipient: customerEmail,
      subject,
      content: textPreview,
      emailId,
      status: 'sent',
    });

    return {
      success: true,
      emailId,
    };
  } catch (error) {
    console.error('❌ [MOCK] Error sending breed reminder email:', error);

    // Log failed notification
    await logBreedReminderEmail(supabase, {
      customerId: params.customerId,
      trackingId: params.trackingId,
      recipient: params.customerEmail,
      subject: `${params.petName}'s Grooming Appointment Reminder`,
      content: 'Failed to send',
      emailId: null,
      status: 'failed',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build text preview of email content
 */
function buildTextPreview(params: BreedReminderEmailParams, breedMsg: string): string {
  const { customerName, petName, breedName, bookingUrl } = params;

  return `
Hi ${customerName},

It's time for ${petName}'s grooming appointment! Regular grooming keeps your
furry friend happy, healthy, and looking their best.

Pet: ${petName}
Breed: ${breedName}

Why now? ${breedMsg}

We'd love to see ${petName} again! Book an appointment at your convenience,
and we'll make sure they get the pampering they deserve.

📅 Book ${petName}'s Appointment: ${bookingUrl}

Have questions or special requests? Just reply to this email or give us a
call at (657) 252-2903.

──────────────────────────────────────────────────────────────

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903
puppyday14936@gmail.com

Hours: Monday-Saturday, 9:00 AM - 5:00 PM
Follow us on Instagram: @puppyday_lm

Don't want grooming reminders? Unsubscribe
  `.trim();
}

/**
 * Log email notification to notifications_log table (mock store)
 */
async function logBreedReminderEmail(
  supabase: AppSupabaseClient,
  params: {
    customerId: string;
    trackingId: string;
    recipient: string;
    subject: string;
    content: string;
    emailId: string | null;
    status: string;
  }
): Promise<void> {
  try {
    await (supabase as any).from('notifications_log').insert({
      customer_id: params.customerId,
      type: 'breed_reminder',
      channel: 'email',
      recipient: params.recipient,
      subject: params.subject,
      content: params.content,
      message_id: params.emailId,
      tracking_id: params.trackingId,
      status: params.status,
    });

    console.log('✅ [MOCK] Logged to notifications_log');
  } catch (error) {
    console.error('❌ [MOCK] Error logging breed reminder email:', error);
  }
}

/**
 * Preview email content without sending
 * Useful for testing and admin preview
 */
export function previewBreedReminderEmail(params: BreedReminderEmailParams): string {
  const breedMsg = getBreedEmailMessage(params.breedName, params.breedMessage);
  return buildTextPreview(params, breedMsg);
}
