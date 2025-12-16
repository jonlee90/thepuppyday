/**
 * Phase 8: Email Templates for The Puppy Day Notification System
 * Beautiful, responsive HTML templates with The Puppy Day branding
 *
 * Design System: Clean & Elegant Professional
 * Colors: Background #F8EEE5, Primary #434E54, Cards #FFFFFF
 *
 * SECURITY: All user-provided data is properly escaped to prevent XSS attacks
 */

// ============================================================================
// SECURITY: HTML ESCAPING
// ============================================================================

/**
 * Escape HTML to prevent XSS attacks
 * Converts special characters to HTML entities
 */
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return String(text).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

// ============================================================================
// TYPES
// ============================================================================

export interface EmailTemplate {
  html: string;
  text: string;
  subject: string;
}

export interface BookingConfirmationData {
  customer_name: string;
  pet_name: string;
  appointment_date: string;
  appointment_time: string;
  service_name: string;
  total_price: string;
}

export interface ReportCardData {
  pet_name: string;
  report_card_link: string;
  before_image_url?: string;
  after_image_url?: string;
}

export interface RetentionReminderData {
  pet_name: string;
  weeks_since_last: number;
  breed_name: string;
  booking_url: string;
}

export interface PaymentFailedData {
  failure_reason: string;
  amount_due: string;
  retry_link: string;
}

export interface PaymentReminderData {
  charge_date: string;
  amount: string;
  payment_method: string;
}

export interface PaymentSuccessData {
  amount: string;
  payment_date: string;
  payment_method: string;
}

export interface PaymentFinalNoticeData {
  amount_due: string;
  retry_link: string;
  suspension_date: string;
}

export interface AppointmentReminderData {
  pet_name: string;
  appointment_time: string;
}

export interface AppointmentStatusData {
  pet_name: string;
}

export interface WaitlistNotificationData {
  available_date: string;
  available_time: string;
  claim_link: string;
}

// ============================================================================
// BASE EMAIL TEMPLATE
// ============================================================================

/**
 * Base HTML structure for all email templates
 * Includes responsive design, proper email client compatibility (table-based layouts)
 * NO transitions or flexbox for maximum email client support
 */
function createBaseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <title>The Puppy Day</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]>
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    /* Typography */
    body, td, th {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #434E54;
    }

    h1, h2, h3 {
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #434E54;
    }

    h1 {
      font-size: 28px;
      line-height: 1.3;
    }

    h2 {
      font-size: 22px;
      line-height: 1.3;
    }

    h3 {
      font-size: 18px;
      line-height: 1.4;
    }

    p {
      margin: 0 0 16px 0;
    }

    a {
      color: #434E54;
      text-decoration: underline;
    }

    /* Buttons */
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #434E54;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 16px;
      text-align: center;
    }

    /* Card */
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      margin: 0 0 20px 0;
      box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08);
    }

    /* Info row */
    .info-row {
      padding: 12px 0;
      border-bottom: 1px solid #E5E5E5;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #434E54;
      font-size: 14px;
    }

    .info-value {
      font-weight: 600;
      color: #434E54;
      font-size: 14px;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #EAE0D5;
      color: #434E54;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Footer */
    .footer {
      padding: 24px 0;
      text-align: center;
      color: #434E54;
      font-size: 14px;
    }

    .footer a {
      color: #434E54;
      text-decoration: underline;
    }

    /* Social links */
    .social-links {
      margin: 16px 0;
    }

    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #434E54;
      text-decoration: none;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .wrapper {
        width: 100% !important;
      }

      .card {
        padding: 20px !important;
      }

      h1 {
        font-size: 24px !important;
      }

      h2 {
        font-size: 20px !important;
      }

      .button {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="background-color: #F8EEE5; margin: 0; padding: 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <h1 style="color: #434E54; margin: 0; font-size: 32px; font-weight: 600;">The Puppy Day</h1>
              <p style="color: #434E54; margin: 8px 0 0 0; font-size: 14px;">Professional Dog Grooming & Day Care</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td>
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <div style="border-top: 1px solid #E5E5E5; padding-top: 24px; margin-top: 32px;">
                <p style="margin: 0 0 8px 0; color: #434E54; font-size: 14px;">
                  <strong>Puppy Day</strong><br>
                  14936 Leffingwell Rd, La Mirada, CA 90638<br>
                  <a href="tel:+16572522903" style="color: #434E54;">(657) 252-2903</a> |
                  <a href="mailto:puppyday14936@gmail.com" style="color: #434E54;">puppyday14936@gmail.com</a>
                </p>
                <p style="margin: 16px 0 0 0; color: #9CA3AF; font-size: 12px;">
                  Monday-Saturday, 9:00 AM - 5:00 PM
                </p>
                <div class="social-links" style="margin: 16px 0;">
                  <a href="https://www.instagram.com/puppyday_lm" style="color: #434E54; text-decoration: none; margin: 0 8px;">Instagram @puppyday_lm</a>
                </div>
                <p style="margin: 16px 0 0 0; color: #9CA3AF; font-size: 12px;">
                  <a href="{unsubscribe_link}" style="color: #9CA3AF;">Unsubscribe</a> from these emails
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// 1. BOOKING CONFIRMATION EMAIL
// ============================================================================

export function createBookingConfirmationEmail(data: BookingConfirmationData): EmailTemplate {
  const subject = `Booking Confirmed: ${escapeHtml(data.pet_name)}'s Grooming Appointment`;

  const html = createBaseEmailTemplate(`
    <div class="card">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">Booking Confirmed!</h2>
      <p style="color: #434E54; margin: 0 0 24px 0;">Hi ${escapeHtml(data.customer_name)}, we're excited to pamper ${escapeHtml(data.pet_name)}!</p>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Pet</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.pet_name)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Service</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.service_name)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Date & Time</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.appointment_date)} at ${escapeHtml(data.appointment_time)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-top: 2px solid #EAE0D5; padding-top: 16px; margin-top: 8px;">
              <span style="color: #434E54; font-size: 14px;">Total</span><br>
              <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.total_price)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #FFF4E6; border-left: 4px solid #FFB347; border-radius: 4px; padding: 16px; margin: 0 0 24px 0;">
        <p style="margin: 0; color: #434E54; font-size: 14px;">
          <strong>Cancellation Policy:</strong> Please notify us at least 24 hours in advance if you need to cancel or reschedule.
        </p>
      </div>

      <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
        We can't wait to see ${escapeHtml(data.pet_name)}! Please arrive a few minutes early and bring any special instructions or concerns you may have.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="tel:+16572522903" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 500;">
              Call Us: (657) 252-2903
            </a>
          </td>
        </tr>
      </table>
    </div>
  `);

  const text = `
BOOKING CONFIRMED - The Puppy Day

Hi ${escapeHtml(data.customer_name)},

Great news! Your grooming appointment for ${escapeHtml(data.pet_name)} is confirmed.

APPOINTMENT DETAILS:
Pet: ${escapeHtml(data.pet_name)}
Service: ${escapeHtml(data.service_name)}
Date & Time: ${escapeHtml(data.appointment_date)} at ${escapeHtml(data.appointment_time)}
Total: ${escapeHtml(data.total_price)}

CANCELLATION POLICY:
Please notify us at least 24 hours in advance if you need to cancel or reschedule.

We can't wait to see ${escapeHtml(data.pet_name)}! Please arrive a few minutes early and bring any special instructions or concerns you may have.

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 2. REPORT CARD NOTIFICATION EMAIL
// ============================================================================

export function createReportCardEmail(data: ReportCardData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Report Card is Ready!`;

  const html = createBaseEmailTemplate(`
    <div class="card">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">${escapeHtml(data.pet_name)}'s Report Card is Ready!</h2>
      <p style="color: #434E54; margin: 0 0 24px 0;">
        Your pup had a wonderful grooming session! Check out the amazing transformation.
      </p>

      ${data.before_image_url && data.after_image_url ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td width="48%" style="vertical-align: top;">
            <div style="text-align: center;">
              <p style="color: #434E54; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">Before</p>
              <img src="${escapeHtml(data.before_image_url)}" alt="${escapeHtml(data.pet_name)} before grooming" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(67, 78, 84, 0.12);">
            </div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="vertical-align: top;">
            <div style="text-align: center;">
              <p style="color: #434E54; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">After</p>
              <img src="${escapeHtml(data.after_image_url)}" alt="${escapeHtml(data.pet_name)} after grooming" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(67, 78, 84, 0.12);">
            </div>
          </td>
        </tr>
      </table>
      ` : ''}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(data.report_card_link)}" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 500;">
              View Full Report Card
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #EFF6FF; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #434E54; margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">
          Loved our service?
        </p>
        <p style="color: #434E54; margin: 0 0 16px 0; font-size: 14px;">
          We'd be so grateful if you could share your experience with other pet parents!
        </p>
        <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 15px;">
          Leave a Google Review
        </a>
      </div>
    </div>
  `);

  const text = `
${escapeHtml(data.pet_name).toUpperCase()}'S REPORT CARD IS READY! - The Puppy Day

Your pup had a wonderful grooming session! Check out the amazing transformation.

VIEW REPORT CARD:
${escapeHtml(data.report_card_link)}

LOVED OUR SERVICE?
We'd be so grateful if you could share your experience with other pet parents! Leave us a Google review to help others discover our grooming services.

Thank you for trusting us with ${escapeHtml(data.pet_name)}!

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 3. RETENTION REMINDER EMAIL
// ============================================================================

export function createRetentionReminderEmail(data: RetentionReminderData): EmailTemplate {
  const subject = `Time for ${escapeHtml(data.pet_name)}'s Next Grooming Session`;

  const html = createBaseEmailTemplate(`
    <div class="card">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">Time for ${escapeHtml(data.pet_name)}'s Next Grooming!</h2>
      <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
        It's been ${String(data.weeks_since_last)} weeks since ${escapeHtml(data.pet_name)}'s last grooming session.
        ${data.breed_name ? `For ${escapeHtml(data.breed_name)}s, we recommend regular grooming every 6-8 weeks to keep their coat healthy and comfortable.` : 'Regular grooming keeps your pup looking and feeling their best!'}
      </p>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
        <p style="color: #434E54; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
          Book ${escapeHtml(data.pet_name)}'s Next Visit
        </p>
        <p style="color: #434E54; margin: 0 0 20px 0; font-size: 14px;">
          Schedule now to ensure your preferred time slot
        </p>
        <a href="${escapeHtml(data.booking_url)}" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 500;">
          Book Appointment
        </a>
      </div>

      <div style="background-color: #F0FDF4; border-radius: 8px; padding: 16px;">
        <p style="color: #434E54; margin: 0 0 8px 0; font-weight: 500;">Why Regular Grooming Matters:</p>
        <ul style="color: #434E54; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Prevents matting and skin irritation</li>
          <li>Maintains healthy coat and skin</li>
          <li>Early detection of health issues</li>
          <li>Keeps nails trimmed and comfortable</li>
        </ul>
      </div>

      <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
        Questions? Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
      </p>
    </div>
  `);

  const text = `
TIME FOR ${escapeHtml(data.pet_name).toUpperCase()}'S NEXT GROOMING - The Puppy Day

It's been ${String(data.weeks_since_last)} weeks since ${escapeHtml(data.pet_name)}'s last grooming session.

${data.breed_name ? `For ${escapeHtml(data.breed_name)}s, we recommend regular grooming every 6-8 weeks to keep their coat healthy and comfortable.` : 'Regular grooming keeps your pup looking and feeling their best!'}

WHY REGULAR GROOMING MATTERS:
• Prevents matting and skin irritation
• Maintains healthy coat and skin
• Early detection of health issues
• Keeps nails trimmed and comfortable

BOOK ${escapeHtml(data.pet_name).toUpperCase()}'S NEXT VISIT:
${escapeHtml(data.booking_url)}

Schedule now to ensure your preferred time slot!

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 4. PAYMENT FAILED EMAIL
// ============================================================================

export function createPaymentFailedEmail(data: PaymentFailedData): EmailTemplate {
  const subject = 'Payment Issue for Your Puppy Day Account';

  const html = createBaseEmailTemplate(`
    <div class="card">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">Payment Issue with Your Account</h2>
      <p style="color: #434E54; margin: 0 0 24px 0;">
        We were unable to process your recent payment. Don't worry—this happens occasionally and is usually easy to resolve.
      </p>

      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 16px; margin: 0 0 24px 0;">
        <p style="margin: 0 0 8px 0; color: #434E54; font-weight: 500;">Issue Detected:</p>
        <p style="margin: 0; color: #434E54; font-size: 14px;">${escapeHtml(data.failure_reason)}</p>
      </div>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Amount Due</span><br>
              <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount_due)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
        Please update your payment method or retry the payment to continue enjoying uninterrupted service.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(data.retry_link)}" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 500;">
              Update Payment Method
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #F9FAFB; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="color: #434E54; margin: 0; font-size: 14px;">
          Need help? Our team is here to assist you.<br>
          Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a> or email
          <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; font-weight: 500;">puppyday14936@gmail.com</a>
        </p>
      </div>
    </div>
  `);

  const text = `
PAYMENT ISSUE - The Puppy Day

We were unable to process your recent payment. Don't worry—this happens occasionally and is usually easy to resolve.

ISSUE DETECTED:
${escapeHtml(data.failure_reason)}

AMOUNT DUE: ${escapeHtml(data.amount_due)}

Please update your payment method or retry the payment to continue enjoying uninterrupted service.

UPDATE PAYMENT METHOD:
${escapeHtml(data.retry_link)}

NEED HELP?
Our team is here to assist you.
Call: (657) 252-2903
Email: puppyday14936@gmail.com

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 5. PAYMENT REMINDER EMAIL
// ============================================================================

export function createPaymentReminderEmail(data: PaymentReminderData): EmailTemplate {
  const subject = 'Upcoming Payment for Your Puppy Day Membership';

  const html = createBaseEmailTemplate(`
    <div class="card">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">Upcoming Payment Reminder</h2>
      <p style="color: #434E54; margin: 0 0 24px 0;">
        This is a friendly reminder that your membership payment will be processed soon.
      </p>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Payment Date</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.charge_date)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Amount</span><br>
              <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Payment Method</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.payment_method)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #EFF6FF; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; color: #434E54; font-size: 14px;">
          <strong>No action required</strong> — Your payment will be processed automatically. Thank you for being a valued member!
        </p>
      </div>

      <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
        Questions? Contact us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
      </p>
    </div>
  `);

  const text = `
UPCOMING PAYMENT REMINDER - The Puppy Day

This is a friendly reminder that your membership payment will be processed soon.

PAYMENT DETAILS:
Payment Date: ${escapeHtml(data.charge_date)}
Amount: ${escapeHtml(data.amount)}
Payment Method: ${escapeHtml(data.payment_method)}

NO ACTION REQUIRED — Your payment will be processed automatically. Thank you for being a valued member!

Questions? Contact us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 6. PAYMENT SUCCESS EMAIL
// ============================================================================

export function createPaymentSuccessEmail(data: PaymentSuccessData): EmailTemplate {
  const subject = 'Payment Received - Thank You!';

  const html = createBaseEmailTemplate(`
    <div class="card">
      <div style="text-align: center; margin: 0 0 24px 0;">
        <h2 style="color: #434E54; margin: 0 0 8px 0;">Payment Received!</h2>
        <p style="color: #434E54; margin: 0;">Thank you for your payment</p>
      </div>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Amount Paid</span><br>
              <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Payment Date</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.payment_date)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Payment Method</span><br>
              <strong style="color: #434E54; font-size: 16px;">${escapeHtml(data.payment_method)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #F0FDF4; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #434E54; font-size: 15px;">
          Your payment has been successfully processed. We appreciate your continued trust in Puppy Day for your pet's grooming needs!
        </p>
      </div>

      <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
        Questions about your payment? Contact us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
      </p>
    </div>
  `);

  const text = `
PAYMENT RECEIVED - The Puppy Day

Thank you for your payment!

PAYMENT DETAILS:
Amount Paid: ${escapeHtml(data.amount)}
Payment Date: ${escapeHtml(data.payment_date)}
Payment Method: ${escapeHtml(data.payment_method)}

Your payment has been successfully processed. We appreciate your continued trust in Puppy Day for your pet's grooming needs!

Questions about your payment? Contact us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 7. PAYMENT FINAL NOTICE EMAIL
// ============================================================================

export function createPaymentFinalNoticeEmail(data: PaymentFinalNoticeData): EmailTemplate {
  const subject = 'Important: Final Payment Notice';

  const html = createBaseEmailTemplate(`
    <div class="card">
      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; padding: 16px; margin: 0 0 24px 0;">
        <h2 style="color: #991B1B; margin: 0 0 8px 0;">Final Payment Notice</h2>
        <p style="margin: 0; color: #7F1D1D; font-size: 14px;">Immediate action required to prevent service interruption</p>
      </div>

      <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
        We've attempted to process your payment multiple times without success. To continue your membership and avoid service suspension, please update your payment information immediately.
      </p>

      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Amount Due</span><br>
              <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount_due)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #434E54; font-size: 14px;">Service Suspension Date</span><br>
              <strong style="color: #EF4444; font-size: 16px;">${escapeHtml(data.suspension_date)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(data.retry_link)}" class="button" style="background-color: #EF4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 600;">
              Update Payment Method Now
            </a>
          </td>
        </tr>
      </table>

      <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px;">
        <p style="color: #434E54; margin: 0 0 12px 0; font-weight: 600;">What happens if payment is not received:</p>
        <ul style="color: #434E54; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Your membership benefits will be suspended on ${escapeHtml(data.suspension_date)}</li>
          <li>You'll need to re-register to continue service</li>
          <li>Any scheduled appointments may be affected</li>
        </ul>
      </div>

      <div style="background-color: #EFF6FF; border-radius: 8px; padding: 16px; margin: 24px 0 0 0; text-align: center;">
        <p style="color: #434E54; margin: 0 0 8px 0; font-weight: 600;">Need Help?</p>
        <p style="color: #434E54; margin: 0; font-size: 14px;">
          We understand payment issues happen. Please contact us and we'll work with you to resolve this.<br>
          Call: <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a><br>
          Email: <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; font-weight: 500;">puppyday14936@gmail.com</a>
        </p>
      </div>
    </div>
  `);

  const text = `
FINAL PAYMENT NOTICE - The Puppy Day

IMMEDIATE ACTION REQUIRED

We've attempted to process your payment multiple times without success. To continue your membership and avoid service suspension, please update your payment information immediately.

PAYMENT DETAILS:
Amount Due: ${escapeHtml(data.amount_due)}
Service Suspension Date: ${escapeHtml(data.suspension_date)}

UPDATE PAYMENT METHOD NOW:
${escapeHtml(data.retry_link)}

WHAT HAPPENS IF PAYMENT IS NOT RECEIVED:
• Your membership benefits will be suspended on ${escapeHtml(data.suspension_date)}
• You'll need to re-register to continue service
• Any scheduled appointments may be affected

NEED HELP?
We understand payment issues happen. Please contact us and we'll work with you to resolve this.

Call: (657) 252-2903
Email: puppyday14936@gmail.com

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();

  return { html, text, subject };
}

// ============================================================================
// 8. APPOINTMENT REMINDER SMS
// ============================================================================

/**
 * SMS reminder sent 24 hours before appointment
 * FIXED: Reduced to 130 characters (under 160 limit)
 */
export function createAppointmentReminderSms(data: AppointmentReminderData): string {
  return `Reminder: ${escapeHtml(data.pet_name)}'s grooming tomorrow at ${escapeHtml(data.appointment_time)}. Puppy Day (657) 252-2903`;
}

// ============================================================================
// 9. APPOINTMENT STATUS SMS - CHECKED IN
// ============================================================================

/**
 * SMS sent when pet is checked in
 * Target: Under 160 characters
 */
export function createCheckedInSms(data: AppointmentStatusData): string {
  return `We've got ${escapeHtml(data.pet_name)}! They're settling in nicely. We'll text when ready for pickup. - Puppy Day`;
}

// ============================================================================
// 10. APPOINTMENT STATUS SMS - READY FOR PICKUP
// ============================================================================

/**
 * SMS sent when pet is ready for pickup
 * Target: Under 160 characters
 */
export function createReadyForPickupSms(data: AppointmentStatusData): string {
  return `${escapeHtml(data.pet_name)} is ready for pickup! Looking fresh & fabulous! Puppy Day, 14936 Leffingwell Rd. (657) 252-2903`;
}

// ============================================================================
// 11. WAITLIST NOTIFICATION SMS
// ============================================================================

/**
 * SMS sent when waitlisted slot becomes available
 * FIXED: Reduced to fit in 160 character limit
 */
export function createWaitlistNotificationSms(data: WaitlistNotificationData): string {
  return `Puppy Day: Spot open ${escapeHtml(data.available_date)} at ${escapeHtml(data.available_time)}! Claim now (2hr exp): ${escapeHtml(data.claim_link)}`;
}

// ============================================================================
// 12. BOOKING CONFIRMATION SMS
// ============================================================================

/**
 * SMS version of booking confirmation
 * FIXED: Reduced to 125 characters (under 160 limit)
 */
export function createBookingConfirmationSms(data: BookingConfirmationData): string {
  return `Confirmed! ${escapeHtml(data.pet_name)} ${escapeHtml(data.appointment_date)} ${escapeHtml(data.appointment_time)}. ${escapeHtml(data.total_price)}. Puppy Day (657) 252-2903`;
}

// ============================================================================
// 13. REPORT CARD NOTIFICATION SMS
// ============================================================================

/**
 * SMS version of report card notification
 * Target: Under 160 characters
 */
export function createReportCardSms(data: ReportCardData): string {
  return `${escapeHtml(data.pet_name)}'s report card ready with before/after photos! ${escapeHtml(data.report_card_link)} - Puppy Day`;
}

// ============================================================================
// 14. RETENTION REMINDER SMS
// ============================================================================

/**
 * SMS version of retention reminder
 * Target: Under 160 characters
 */
export function createRetentionReminderSms(data: RetentionReminderData): string {
  return `Time for ${escapeHtml(data.pet_name)}'s grooming! ${String(data.weeks_since_last)} weeks since last visit. Book: ${escapeHtml(data.booking_url)} - Puppy Day`;
}

// ============================================================================
// EXPORT ALL TEMPLATE GENERATORS
// ============================================================================

export const emailTemplates = {
  bookingConfirmation: createBookingConfirmationEmail,
  reportCard: createReportCardEmail,
  retentionReminder: createRetentionReminderEmail,
  paymentFailed: createPaymentFailedEmail,
  paymentReminder: createPaymentReminderEmail,
  paymentSuccess: createPaymentSuccessEmail,
  paymentFinalNotice: createPaymentFinalNoticeEmail,
};

export const smsTemplates = {
  appointmentReminder: createAppointmentReminderSms,
  checkedIn: createCheckedInSms,
  readyForPickup: createReadyForPickupSms,
  waitlistNotification: createWaitlistNotificationSms,
  bookingConfirmation: createBookingConfirmationSms,
  reportCard: createReportCardSms,
  retentionReminder: createRetentionReminderSms,
};
