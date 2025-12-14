/**
 * Breed Reminder Email Notifications
 * Task 0038: Email template and delivery for breed-based grooming reminders
 * Production implementation using Resend
 */

import { sendEmail } from '@/lib/resend/client';
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
 * Extended breed-specific messages for email (more detailed than SMS)
 */
const BREED_EMAIL_MESSAGES: Record<string, string> = {
  poodle: 'Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy. Their curly hair requires professional care to stay comfortable and looking great.',
  'toy poodle': 'Toy Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy.',
  'miniature poodle': 'Miniature Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy.',
  'standard poodle': 'Standard Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy.',
  'golden retriever': 'Golden Retrievers benefit from grooming every 6-8 weeks to maintain their gorgeous coat, reduce shedding, and keep them comfortable.',
  'labrador retriever': 'Labrador Retrievers benefit from grooming every 6-8 weeks to maintain their coat health and reduce shedding.',
  yorkie: 'Yorkies need grooming every 4-6 weeks to keep their silky coat tangle-free and maintain their adorable appearance.',
  'yorkshire terrier': 'Yorkshire Terriers need grooming every 4-6 weeks to keep their silky coat tangle-free and maintain their adorable appearance.',
  husky: 'Huskies need seasonal grooming to manage their thick double coat, especially during shedding seasons.',
  'siberian husky': 'Siberian Huskies need seasonal grooming to manage their thick double coat, especially during shedding seasons.',
  'shih tzu': 'Shih Tzus need grooming every 4-6 weeks to prevent mats and keep their luxurious coat healthy and comfortable.',
  maltese: 'Maltese dogs need regular grooming every 4-6 weeks to prevent tangles and maintain their beautiful white coat.',
  'bichon frise': 'Bichon Frises need grooming every 4-6 weeks to prevent matting and keep their fluffy coat in perfect condition.',
  doodle: 'Doodles need regular grooming every 4-8 weeks to prevent matting in their curly coat and keep them comfortable.',
  goldendoodle: 'Goldendoodles need grooming every 4-8 weeks to prevent matting in their curly coat and keep them comfortable.',
  labradoodle: 'Labradoodles need grooming every 4-8 weeks to prevent matting in their curly coat and keep them comfortable.',
  cockapoo: 'Cockapoos need grooming every 4-8 weeks to prevent matting in their curly coat and keep them comfortable.',
  default: "Based on your pet's breed, regular grooming helps keep them healthy, comfortable, and looking their best.",
};

/**
 * Get breed-specific message for email (more detailed than SMS)
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
 * Send breed reminder email to customer
 * Production implementation using Resend
 */
export async function sendBreedReminderEmail(
  supabase: AppSupabaseClient,
  params: BreedReminderEmailParams
): Promise<BreedReminderEmailResult> {
  try {
    const { customerEmail, customerId, trackingId } = params;

    // Build email HTML
    const html = buildBreedReminderEmailHtml(params);
    const subject = `${params.petName}'s Grooming Appointment Reminder`;

    console.log('[Breed Reminder Email] Sending to:', customerEmail);

    // Send email using Resend client
    const result = await sendEmail({
      to: customerEmail,
      subject,
      html,
    });

    if (result.error) {
      console.error('[Breed Reminder Email] Send error:', result.error);

      // Log failed notification
      await logBreedReminderEmail(supabase, {
        customerId,
        trackingId,
        recipient: customerEmail,
        subject,
        content: html,
        emailId: null,
        status: 'failed',
      });

      return {
        success: false,
        error: result.error.message,
      };
    }

    console.log('[Breed Reminder Email] Sent successfully:', result.id);

    // Log successful notification
    await logBreedReminderEmail(supabase, {
      customerId,
      trackingId,
      recipient: customerEmail,
      subject,
      content: html,
      emailId: result.id,
      status: 'sent',
    });

    return {
      success: true,
      emailId: result.id,
    };
  } catch (error) {
    console.error('[Breed Reminder Email] Unexpected error:', error);

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
 * Log email notification to notifications_log table
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
  } catch (error) {
    console.error('[Breed Reminder Email] Error logging to database:', error);
  }
}

/**
 * Build HTML email template for breed reminder
 * Clean & Elegant Professional design with warm cream/charcoal colors
 */
function buildBreedReminderEmailHtml(params: BreedReminderEmailParams): string {
  const {
    customerName,
    petName,
    breedName,
    breedMessage,
    petPhotoUrl,
    bookingUrl,
  } = params;

  const breedMsg = getBreedEmailMessage(breedName, breedMessage);

  // Default pet photo if none provided
  const photoUrl = petPhotoUrl || 'https://placehold.co/300x300/F8EEE5/434E54?text=🐕';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${petName}'s Grooming Reminder</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F8EEE5;
      color: #434E54;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    .header {
      background-color: #434E54;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 24px;
      color: #434E54;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #6B7280;
      margin-bottom: 24px;
    }
    .pet-info-card {
      background-color: #FFFBF7;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .pet-photo-container {
      text-align: center;
      margin-bottom: 20px;
    }
    .pet-photo {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 4px solid #EAE0D5;
    }
    .pet-name {
      font-size: 22px;
      font-weight: 600;
      color: #434E54;
      text-align: center;
      margin-bottom: 8px;
    }
    .pet-breed {
      font-size: 16px;
      color: #6B7280;
      text-align: center;
      margin-bottom: 16px;
    }
    .breed-message {
      font-size: 15px;
      line-height: 1.6;
      color: #434E54;
      background-color: #F8EEE5;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #434E54;
    }
    .cta-button {
      display: inline-block;
      background-color: #434E54;
      color: #FFFFFF;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 24px 0;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #363F44;
    }
    .cta-container {
      text-align: center;
    }
    .footer {
      background-color: #EAE0D5;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6B7280;
    }
    .footer-logo {
      font-size: 20px;
      font-weight: 700;
      color: #434E54;
      margin-bottom: 12px;
    }
    .footer-info {
      margin: 8px 0;
      line-height: 1.5;
    }
    .footer-social {
      margin-top: 16px;
    }
    .footer-social a {
      color: #434E54;
      text-decoration: none;
      margin: 0 8px;
    }
    .divider {
      height: 1px;
      background-color: #E5E7EB;
      margin: 24px 0;
    }
    .unsubscribe {
      margin-top: 16px;
      font-size: 12px;
      color: #9CA3AF;
    }
    .unsubscribe a {
      color: #6B7280;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .header h1 {
        font-size: 20px;
      }
      .greeting {
        font-size: 16px;
      }
      .message {
        font-size: 14px;
      }
      .pet-name {
        font-size: 20px;
      }
      .pet-photo {
        width: 150px;
        height: 150px;
      }
      .cta-button {
        display: block;
        padding: 12px 24px;
      }
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>The Puppy Day</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hi ${customerName},
      </div>

      <div class="message">
        It's time for <strong>${petName}'s</strong> grooming appointment! Regular grooming keeps your furry friend happy, healthy, and looking their best.
      </div>

      <!-- Pet Info Card -->
      <div class="pet-info-card">
        <div class="pet-photo-container">
          <img src="${photoUrl}" alt="${petName}" class="pet-photo" />
        </div>

        <div class="pet-name">${petName}</div>
        <div class="pet-breed">${breedName}</div>

        <div class="breed-message">
          <strong>Why now?</strong> ${breedMsg}
        </div>
      </div>

      <div class="message">
        We'd love to see ${petName} again! Book an appointment at your convenience, and we'll make sure they get the pampering they deserve.
      </div>

      <div class="cta-container">
        <a href="${bookingUrl}" class="cta-button">Book ${petName}'s Appointment</a>
      </div>

      <div class="divider"></div>

      <div class="message">
        Have questions or special requests? Just reply to this email or give us a call at <strong>(657) 252-2903</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">The Puppy Day</div>
      <div class="footer-info">
        14936 Leffingwell Rd, La Mirada, CA 90638<br>
        (657) 252-2903<br>
        puppyday14936@gmail.com
      </div>
      <div class="footer-info" style="margin-top: 16px;">
        <strong>Hours:</strong> Monday-Saturday, 9:00 AM - 5:00 PM
      </div>
      <div class="footer-social">
        Follow us on Instagram: <a href="https://instagram.com/puppyday_lm">@puppyday_lm</a>
      </div>
      <div class="unsubscribe">
        Don't want grooming reminders? <a href="#">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Preview email HTML without sending
 * Useful for testing and admin preview
 */
export function previewBreedReminderEmail(params: BreedReminderEmailParams): string {
  return buildBreedReminderEmailHtml(params);
}
