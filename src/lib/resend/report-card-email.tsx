/**
 * Report Card Email Notifications
 * Task 0023: Email template and delivery for report cards
 */

import { sendEmail } from '@/lib/resend/client';
import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface ReportCardEmailParams {
  to: string;
  customerName: string;
  petName: string;
  reportCardUrl: string;
  afterPhotoUrl?: string;
}

export interface ReportCardEmailResult {
  id?: string;
  error: Error | null;
}

/**
 * Send report card email to customer
 * Subject: "{petName}'s Grooming Report Card is Ready!"
 */
export async function sendReportCardEmail(
  params: ReportCardEmailParams
): Promise<ReportCardEmailResult> {
  try {
    // Build email HTML
    const html = buildReportCardEmailHtml(params);
    const subject = `${params.petName}'s Grooming Report Card is Ready!`;

    console.log('[Report Card Email] Sending to:', params.to);

    // Send email using Resend client
    const result = await sendEmail({
      to: params.to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[Report Card Email] Send error:', result.error);
      return { error: result.error };
    }

    console.log('[Report Card Email] Sent successfully:', result.id);

    return {
      id: result.id,
      error: null,
    };
  } catch (error) {
    console.error('[Report Card Email] Unexpected error:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Log email notification to database
 */
export async function logReportCardEmail(
  supabase: AppSupabaseClient,
  params: {
    customerId: string;
    reportCardId: string;
    recipient: string;
    subject: string;
    content: string;
    emailId?: string;
    status: 'sent' | 'failed';
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const logEntry = {
      customer_id: params.customerId,
      type: 'report_card',
      channel: 'email' as const,
      recipient: params.recipient,
      subject: params.subject,
      content: params.content,
      status: params.status,
      error_message: params.errorMessage || null,
      sent_at: params.status === 'sent' ? new Date().toISOString() : null,
    };

    const result = await (supabase as any)
      .from('notifications_log')
      .insert(logEntry);

    if (result.error) {
      console.error('[Report Card Email] Error logging to database:', result.error);
    }
  } catch (error) {
    console.error('[Report Card Email] Error in logReportCardEmail:', error);
  }
}

/**
 * Build HTML email template for report card
 * Responsive design with The Puppy Day branding
 */
function buildReportCardEmailHtml(params: ReportCardEmailParams): string {
  const { customerName, petName, reportCardUrl, afterPhotoUrl } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${petName}'s Grooming Report Card</title>
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
    .photo-container {
      margin: 24px 0;
      text-align: center;
    }
    .photo-container img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
    .divider {
      height: 1px;
      background-color: #E5E7EB;
      margin: 24px 0;
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
      .cta-button {
        display: block;
        padding: 12px 24px;
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
        Great news! <strong>${petName}'s grooming session is complete!</strong> We had a wonderful time pampering your furry friend.
      </div>

      ${afterPhotoUrl ? `
      <div class="photo-container">
        <img src="${afterPhotoUrl}" alt="${petName} after grooming" />
      </div>
      ` : ''}

      <div class="message">
        We've prepared a detailed report card showing how ${petName} did during the grooming session, including before and after photos, behavior notes, and health observations.
      </div>

      <div class="cta-container">
        <a href="${reportCardUrl}" class="cta-button">View Report Card</a>
      </div>

      <div class="divider"></div>

      <div class="message">
        Thank you for trusting us with ${petName}'s care. We hope to see you both again soon!
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
export function previewReportCardEmail(params: ReportCardEmailParams): string {
  return buildReportCardEmailHtml(params);
}
