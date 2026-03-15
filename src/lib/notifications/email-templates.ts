/**
 * Phase 8: Email Templates for Puppy Day Notification System
 * Beautiful, responsive HTML templates with Puppy Day branding
 *
 * Design System: Clean & Elegant Professional
 * Colors: Background #F8EEE5, Primary #434E54, Cards #FFFFFF
 *
 * SECURITY: All user-provided data is properly escaped to prevent XSS attacks
 *
 * Tasks 0105-0106: Refactored to use modular base template system
 */

import {
  escapeHtml,
  wrapEmailContent,
  createCard,
  createUrgencyBox,
  createContentBox,
  createAlert,
  createInfoRow,
  createImage,
  createPetHero,
  createPrimaryCTA,
  createSecondaryCTA,
  createDangerCTA,
  createTimeComparison,
  createDivider,
  createTip,
} from './email-base';

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
// 1. BOOKING CONFIRMATION EMAIL
// ============================================================================

function generateBookingConfirmationContent(data: BookingConfirmationData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Grooming Booked')}

    <h2 style="color: #434E54; margin: 0 0 8px 0;">Booking Confirmed!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">Hi ${escapeHtml(data.customer_name)}, we're excited to pamper ${escapeHtml(data.pet_name)}!</p>

    ${createDivider()}

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
        ${createInfoRow('Date & Time', `${data.appointment_date} at ${data.appointment_time}`)}
        <tr>
          <td style="padding: 8px 0; border-top: 2px solid #EAE0D5; padding-top: 16px; margin-top: 8px;">
            <span style="color: #434E54; font-size: 14px;">Total</span><br>
            <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.total_price)}</strong>
          </td>
        </tr>
      </table>
    `)}

    ${createAlert(`
      <p style="margin: 0; color: #434E54; font-size: 14px;">
        <strong>Cancellation Policy:</strong> Please notify us at least 24 hours in advance if you need to cancel or reschedule.
      </p>
    `, 'warning')}

    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
      We can't wait to see ${escapeHtml(data.pet_name)}! Please arrive a few minutes early and bring any special instructions or concerns you may have.
    </p>

    ${createPrimaryCTA('Call Us: (657) 252-2903', 'tel:+16572522903')}
  `);
}

function generateBookingConfirmationText(data: BookingConfirmationData): string {
  return `
BOOKING CONFIRMED - Puppy Day

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
}

export function createBookingConfirmationEmail(data: BookingConfirmationData): EmailTemplate {
  const subject = `Booking Confirmed: ${escapeHtml(data.pet_name)}'s Grooming Appointment`;
  const content = generateBookingConfirmationContent(data);
  const { html } = wrapEmailContent(content, { mood: 'celebration' });
  const text = generateBookingConfirmationText(data);

  return { html, text, subject };
}

// ============================================================================
// 2. REPORT CARD NOTIFICATION EMAIL
// ============================================================================

function generateReportCardContent(data: ReportCardData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Looking Fresh')}

    ${data.before_image_url && data.after_image_url ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td width="48%" style="vertical-align: top;">
          <div style="text-align: center;">
            <p style="color: #434E54; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">Before</p>
            ${createImage(data.before_image_url, `${data.pet_name} before grooming`)}
          </div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="vertical-align: top;">
          <div style="text-align: center;">
            <p style="color: #434E54; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">After</p>
            ${createImage(data.after_image_url, `${data.pet_name} after grooming`)}
          </div>
        </td>
      </tr>
    </table>
    ` : ''}

    <h2 style="color: #434E54; margin: 0 0 8px 0;">${escapeHtml(data.pet_name)}'s Report Card is Ready!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      Your pup had a wonderful grooming session! Check out the amazing transformation.
    </p>

    ${createPrimaryCTA('View Full Report Card', data.report_card_link)}

    ${createAlert(`
      <p style="color: #434E54; margin: 0 0 12px 0; font-size: 16px; font-weight: 500; text-align: center;">
        Loved our service?
      </p>
      <p style="color: #434E54; margin: 0 0 16px 0; font-size: 14px; text-align: center;">
        We'd be so grateful if you could share your experience with other pet parents!
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="https://www.yelp.com/writeareview/biz/puppy-day-la-mirada" class="button" style="background-color: #D32323; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 15px;">
              Leave a Review on Yelp
            </a>
          </td>
        </tr>
      </table>
    `, 'info')}
  `);
}

function generateReportCardText(data: ReportCardData): string {
  return `
${escapeHtml(data.pet_name).toUpperCase()}'S REPORT CARD IS READY! - Puppy Day

Your pup had a wonderful grooming session! Check out the amazing transformation.

VIEW REPORT CARD:
${escapeHtml(data.report_card_link)}

LOVED OUR SERVICE?
We'd be so grateful if you could share your experience with other pet parents!

Leave a Review on Yelp: https://www.yelp.com/writeareview/biz/puppy-day-la-mirada

Thank you for trusting us with ${escapeHtml(data.pet_name)}!

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createReportCardEmail(data: ReportCardData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Report Card is Ready!`;
  const content = generateReportCardContent(data);
  const { html } = wrapEmailContent(content, { mood: 'celebration', moodTitle: 'Looking Fresh!' });
  const text = generateReportCardText(data);

  return { html, text, subject };
}

// ============================================================================
// 3. RETENTION REMINDER EMAIL
// ============================================================================

function generateRetentionReminderContent(data: RetentionReminderData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Time for a Trim')}

    <h2 style="color: #434E54; margin: 0 0 8px 0;">Time for ${escapeHtml(data.pet_name)}'s Next Grooming!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
      It's been ${String(data.weeks_since_last)} weeks since ${escapeHtml(data.pet_name)}'s last grooming session.
      ${data.breed_name ? `For ${escapeHtml(data.breed_name)}s, we recommend regular grooming every 6-8 weeks to keep their coat healthy and comfortable.` : 'Regular grooming keeps your pup looking and feeling their best!'}
    </p>

    ${createContentBox(`
      <p style="color: #434E54; margin: 0 0 8px 0; font-size: 18px; font-weight: 600; text-align: center;">
        Book ${escapeHtml(data.pet_name)}'s Next Visit
      </p>
      <p style="color: #434E54; margin: 0 0 20px 0; font-size: 14px; text-align: center;">
        Schedule now to ensure your preferred time slot
      </p>
      ${createPrimaryCTA('Book Appointment', data.booking_url)}
    `)}

    ${createAlert(`
      <p style="color: #434E54; margin: 0 0 8px 0; font-weight: 500;">Why Regular Grooming Matters:</p>
      <ul style="color: #434E54; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
        <li>Prevents matting and skin irritation</li>
        <li>Maintains healthy coat and skin</li>
        <li>Early detection of health issues</li>
        <li>Keeps nails trimmed and comfortable</li>
      </ul>
    `, 'success')}

    ${createTip('Regular grooming every 6-8 weeks keeps coats healthy and prevents painful matting')}

    <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
      Questions? Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
    </p>
  `);
}

function generateRetentionReminderText(data: RetentionReminderData): string {
  return `
TIME FOR ${escapeHtml(data.pet_name).toUpperCase()}'S NEXT GROOMING - Puppy Day

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
}

export function createRetentionReminderEmail(data: RetentionReminderData): EmailTemplate {
  const subject = `Time for ${escapeHtml(data.pet_name)}'s Next Grooming Session`;
  const content = generateRetentionReminderContent(data);
  const { html } = wrapEmailContent(content, { mood: 'reminder' });
  const text = generateRetentionReminderText(data);

  return { html, text, subject };
}

// ============================================================================
// 4. PAYMENT FAILED EMAIL
// ============================================================================

function generatePaymentFailedContent(data: PaymentFailedData): string {
  return createCard(`
    <h2 style="color: #434E54; margin: 0 0 8px 0;">Payment Issue with Your Account</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      We were unable to process your recent payment. Don't worry—this happens occasionally and is usually easy to resolve.
    </p>

    ${createAlert(`
      <p style="margin: 0 0 8px 0; color: #434E54; font-weight: 500;">Issue Detected:</p>
      <p style="margin: 0; color: #434E54; font-size: 14px;">${escapeHtml(data.failure_reason)}</p>
    `, 'error')}

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #434E54; font-size: 14px;">Amount Due</span><br>
            <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount_due)}</strong>
          </td>
        </tr>
      </table>
    `)}

    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
      Please update your payment method or retry the payment to continue enjoying uninterrupted service.
    </p>

    ${createDangerCTA('Update Payment Method', data.retry_link)}

    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 16px; text-align: center; margin-top: 24px;">
      <p style="color: #434E54; margin: 0; font-size: 14px;">
        Need help? Our team is here to assist you.<br>
        Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a> or email
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; font-weight: 500;">puppyday14936@gmail.com</a>
      </p>
    </div>
  `);
}

function generatePaymentFailedText(data: PaymentFailedData): string {
  return `
PAYMENT ISSUE - Puppy Day

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
}

export function createPaymentFailedEmail(data: PaymentFailedData): EmailTemplate {
  const subject = 'Payment Issue for Your Puppy Day Account';
  const content = generatePaymentFailedContent(data);
  const { html } = wrapEmailContent(content, { mood: 'warning' });
  const text = generatePaymentFailedText(data);

  return { html, text, subject };
}

// ============================================================================
// 5. PAYMENT REMINDER EMAIL
// ============================================================================

function generatePaymentReminderContent(data: PaymentReminderData): string {
  return createCard(`
    <h2 style="color: #434E54; margin: 0 0 8px 0;">Upcoming Payment Reminder</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      This is a friendly reminder that your membership payment will be processed soon.
    </p>

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Payment Date', data.charge_date)}
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #434E54; font-size: 14px;">Amount</span><br>
            <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount)}</strong>
          </td>
        </tr>
        ${createInfoRow('Payment Method', data.payment_method)}
      </table>
    `)}

    ${createAlert(`
      <p style="margin: 0; color: #434E54; font-size: 14px;">
        <strong>No action required</strong> — Your payment will be processed automatically. Thank you for being a valued member!
      </p>
    `, 'info')}

    <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
      Questions? Contact us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
    </p>
  `);
}

function generatePaymentReminderText(data: PaymentReminderData): string {
  return `
UPCOMING PAYMENT REMINDER - Puppy Day

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
}

export function createPaymentReminderEmail(data: PaymentReminderData): EmailTemplate {
  const subject = 'Upcoming Payment for Your Puppy Day Membership';
  const content = generatePaymentReminderContent(data);
  const { html } = wrapEmailContent(content, { mood: 'info' });
  const text = generatePaymentReminderText(data);

  return { html, text, subject };
}

// ============================================================================
// 6. PAYMENT SUCCESS EMAIL
// ============================================================================

function generatePaymentSuccessContent(data: PaymentSuccessData): string {
  return createCard(`
    <div style="text-align: center; margin: 0 0 24px 0;">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">Payment Received!</h2>
      <p style="color: #434E54; margin: 0;">Thank you for your payment</p>
    </div>

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #434E54; font-size: 14px;">Amount Paid</span><br>
            <strong style="color: #434E54; font-size: 20px;">${escapeHtml(data.amount)}</strong>
          </td>
        </tr>
        ${createInfoRow('Payment Date', data.payment_date)}
        ${createInfoRow('Payment Method', data.payment_method)}
      </table>
    `)}

    ${createAlert(`
      <p style="margin: 0; color: #434E54; font-size: 15px; text-align: center;">
        Your payment has been successfully processed. We appreciate your continued trust in Puppy Day for your pet's grooming needs!
      </p>
    `, 'success')}

    <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
      Questions about your payment? Contact us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
    </p>
  `);
}

function generatePaymentSuccessText(data: PaymentSuccessData): string {
  return `
PAYMENT RECEIVED - Puppy Day

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
}

export function createPaymentSuccessEmail(data: PaymentSuccessData): EmailTemplate {
  const subject = 'Payment Received - Thank You!';
  const content = generatePaymentSuccessContent(data);
  const { html } = wrapEmailContent(content, { mood: 'success' });
  const text = generatePaymentSuccessText(data);

  return { html, text, subject };
}

// ============================================================================
// 7. PAYMENT FINAL NOTICE EMAIL
// ============================================================================

function generatePaymentFinalNoticeContent(data: PaymentFinalNoticeData): string {
  return createCard(`
    ${createAlert(`
      <h2 style="color: #991B1B; margin: 0 0 8px 0;">Final Payment Notice</h2>
      <p style="margin: 0; color: #7F1D1D; font-size: 14px;">Immediate action required to prevent service interruption</p>
    `, 'error')}

    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
      We've attempted to process your payment multiple times without success. To continue your membership and avoid service suspension, please update your payment information immediately.
    </p>

    ${createContentBox(`
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
    `)}

    ${createDangerCTA('Update Payment Method Now', data.retry_link)}

    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px;">
      <p style="color: #434E54; margin: 0 0 12px 0; font-weight: 600;">What happens if payment is not received:</p>
      <ul style="color: #434E54; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
        <li>Your membership benefits will be suspended on ${escapeHtml(data.suspension_date)}</li>
        <li>You'll need to re-register to continue service</li>
        <li>Any scheduled appointments may be affected</li>
      </ul>
    </div>

    ${createAlert(`
      <p style="color: #434E54; margin: 0 0 8px 0; font-weight: 600; text-align: center;">Need Help?</p>
      <p style="color: #434E54; margin: 0; font-size: 14px; text-align: center;">
        We understand payment issues happen. Please contact us and we'll work with you to resolve this.<br>
        Call: <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a><br>
        Email: <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; font-weight: 500;">puppyday14936@gmail.com</a>
      </p>
    `, 'info')}
  `);
}

function generatePaymentFinalNoticeText(data: PaymentFinalNoticeData): string {
  return `
FINAL PAYMENT NOTICE - Puppy Day

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
}

export function createPaymentFinalNoticeEmail(data: PaymentFinalNoticeData): EmailTemplate {
  const subject = 'Important: Final Payment Notice';
  const content = generatePaymentFinalNoticeContent(data);
  const { html } = wrapEmailContent(content, { mood: 'warning' });
  const text = generatePaymentFinalNoticeText(data);

  return { html, text, subject };
}

// ============================================================================
// NEW DATA INTERFACES (Tasks 0043-0048)
// ============================================================================

export interface AppointmentReminderEmailData {
  customer_name: string;
  pet_name: string;
  service_name: string;
  appointment_date: string; // "Saturday, March 15, 2026"
  appointment_time: string; // "10:00 AM"
}

export interface AppointmentCancelledEmailData {
  customer_name: string;
  pet_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  cancellation_reason?: string;
  cancelled_by: 'customer' | 'admin';
  rebook_url: string;
}

export interface AppointmentRescheduledEmailData {
  customer_name: string;
  pet_name: string;
  service_name: string;
  original_date: string;
  original_time: string;
  new_date: string;
  new_time: string;
}

export interface ReviewRequestEmailData {
  customer_name: string;
  pet_name: string;
  service_name: string;
  review_url: string;
  rebook_url: string;
}

export interface WaitlistAddedEmailData {
  customer_name: string;
  pet_name: string;
  service_name: string;
  requested_date: string;
  time_preference: string;
  position: number;
}

export interface WaitlistAvailableEmailData {
  customer_name: string;
  pet_name: string;
  available_date: string;
  available_time: string;
  claim_link: string;
  expiration_hours: number;
}

// ============================================================================
// 8. APPOINTMENT REMINDER EMAIL
// ============================================================================

function generateAppointmentReminderContent(data: AppointmentReminderEmailData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Appointment Tomorrow')}

    <h2 style="color: #434E54; margin: 0 0 8px 0;">See You Tomorrow!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      Hi ${escapeHtml(data.customer_name)}, just a friendly reminder that ${escapeHtml(data.pet_name)}'s grooming appointment is tomorrow!
    </p>

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
        ${createInfoRow('Date', data.appointment_date)}
        ${createInfoRow('Time', data.appointment_time)}
      </table>
    `)}

    ${createAlert(`
      <p style="margin: 0; color: #434E54; font-size: 14px;">
        <strong>Arrival Tips:</strong> Please arrive 5-10 minutes early. If you need to cancel, please call us at least 24 hours in advance.
      </p>
    `, 'info')}

    ${createPrimaryCTA('Call Us: (657) 252-2903', 'tel:+16572522903')}

    ${createTip('Arrive 5 minutes early for a stress-free check-in')}
  `);
}

function generateAppointmentReminderText(data: AppointmentReminderEmailData): string {
  return `
APPOINTMENT REMINDER - Puppy Day

Hi ${escapeHtml(data.customer_name)},

Just a friendly reminder that ${escapeHtml(data.pet_name)}'s grooming appointment is tomorrow!

APPOINTMENT DETAILS:
Pet: ${escapeHtml(data.pet_name)}
Service: ${escapeHtml(data.service_name)}
Date: ${escapeHtml(data.appointment_date)}
Time: ${escapeHtml(data.appointment_time)}

Please arrive 5-10 minutes early. If you need to cancel, please call us at least 24 hours in advance.

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createAppointmentReminderEmail(data: AppointmentReminderEmailData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Grooming Appointment Tomorrow`;
  const content = generateAppointmentReminderContent(data);
  const { html } = wrapEmailContent(content, { mood: 'reminder' });
  const text = generateAppointmentReminderText(data);

  return { html, text, subject };
}

// ============================================================================
// 9. APPOINTMENT CANCELLED EMAIL
// ============================================================================

function getCancellationMessage(data: AppointmentCancelledEmailData): string {
  return data.cancelled_by === 'admin'
    ? `We're sorry, but we've had to cancel ${escapeHtml(data.pet_name)}'s appointment. Please accept our apologies for any inconvenience.`
    : `Your appointment has been cancelled as requested.`;
}

function generateAppointmentCancelledContent(data: AppointmentCancelledEmailData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Appointment Cancelled')}

    <h2 style="color: #434E54; margin: 0 0 8px 0;">Your Appointment Has Been Cancelled</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      Hi ${escapeHtml(data.customer_name)}, ${getCancellationMessage(data)}
    </p>

    ${data.cancellation_reason ? createAlert(`
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #434E54; font-size: 14px;">Reason:</p>
      <p style="margin: 0; color: #434E54; font-size: 14px;">${escapeHtml(data.cancellation_reason)}</p>
    `, 'warning') : ''}

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
        ${createInfoRow('Original Date', data.appointment_date)}
        ${createInfoRow('Original Time', data.appointment_time)}
      </table>
    `)}

    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px;">
      We'd love to see ${escapeHtml(data.pet_name)} again soon! Book a new appointment at your convenience.
    </p>

    ${createPrimaryCTA('Book a New Appointment', data.rebook_url)}
  `);
}

function generateAppointmentCancelledText(data: AppointmentCancelledEmailData): string {
  return `
APPOINTMENT CANCELLED - Puppy Day

Hi ${escapeHtml(data.customer_name)},

${getCancellationMessage(data)}

${data.cancellation_reason ? `REASON:\n${escapeHtml(data.cancellation_reason)}\n` : ''}
CANCELLED APPOINTMENT:
Pet: ${escapeHtml(data.pet_name)}
Service: ${escapeHtml(data.service_name)}
Original Date: ${escapeHtml(data.appointment_date)}
Original Time: ${escapeHtml(data.appointment_time)}

We'd love to see ${escapeHtml(data.pet_name)} again soon! Book a new appointment:
${escapeHtml(data.rebook_url)}

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createAppointmentCancelledEmail(data: AppointmentCancelledEmailData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Appointment Has Been Cancelled`;
  const content = generateAppointmentCancelledContent(data);
  const { html } = wrapEmailContent(content, { mood: 'info' });
  const text = generateAppointmentCancelledText(data);

  return { html, text, subject };
}

// ============================================================================
// 10. APPOINTMENT RESCHEDULED EMAIL
// ============================================================================

function generateAppointmentRescheduledContent(data: AppointmentRescheduledEmailData): string {
  return createCard(`
    <h2 style="color: #434E54; margin: 0 0 8px 0;">Your Appointment Has Been Rescheduled</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      Hi ${escapeHtml(data.customer_name)}, ${escapeHtml(data.pet_name)}'s grooming appointment has been moved to a new time.
    </p>

    ${createTimeComparison(data.original_date, data.original_time, data.new_date, data.new_time)}

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
      </table>
    `)}

    ${createPrimaryCTA('Questions? Call Us', 'tel:+16572522903')}
  `);
}

function generateAppointmentRescheduledText(data: AppointmentRescheduledEmailData): string {
  return `
APPOINTMENT RESCHEDULED - Puppy Day

Hi ${escapeHtml(data.customer_name)},

${escapeHtml(data.pet_name)}'s grooming appointment has been moved to a new time.

PREVIOUS DATE: ${escapeHtml(data.original_date)} at ${escapeHtml(data.original_time)}
NEW DATE: ${escapeHtml(data.new_date)} at ${escapeHtml(data.new_time)}

SERVICE: ${escapeHtml(data.service_name)}
PET: ${escapeHtml(data.pet_name)}

If you have any questions, please call us at (657) 252-2903.

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createAppointmentRescheduledEmail(data: AppointmentRescheduledEmailData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Appointment Has Been Rescheduled`;
  const content = generateAppointmentRescheduledContent(data);
  const { html } = wrapEmailContent(content, { mood: 'info' });
  const text = generateAppointmentRescheduledText(data);

  return { html, text, subject };
}

// ============================================================================
// 11. REVIEW REQUEST EMAIL
// ============================================================================

function generateReviewRequestContent(data: ReviewRequestEmailData): string {
  return createCard(`
    ${createPetHero(data.pet_name, 'Thanks for Visiting')}

    <div style="text-align: center; margin: 0 0 24px 0;">
      <h2 style="color: #434E54; margin: 0 0 8px 0;">We'd Love Your Feedback!</h2>
      <p style="color: #434E54; margin: 0; font-size: 15px;">
        Thank you for trusting us with ${escapeHtml(data.pet_name)}. We hope ${escapeHtml(data.pet_name)} is feeling fresh and fabulous!
      </p>
    </div>

    <p style="color: #434E54; margin: 0 0 24px 0; font-size: 15px; text-align: center;">
      If you enjoyed ${escapeHtml(data.pet_name)}'s grooming session, we'd be incredibly grateful if you could share your experience. Your review helps other pet parents discover us!
    </p>

    ${createPrimaryCTA('Leave a Google Review', data.review_url)}

    <div style="margin: 20px 0;">
      ${createSecondaryCTA('Book Next Visit', data.rebook_url)}
    </div>

    <p style="color: #434E54; margin: 24px 0 0 0; font-size: 13px; text-align: center; opacity: 0.7;">
      Thank you for being a valued part of Puppy Day family!
    </p>
  `);
}

function generateReviewRequestText(data: ReviewRequestEmailData): string {
  return `
WE'D LOVE YOUR FEEDBACK! - Puppy Day

Hi ${escapeHtml(data.customer_name)},

Thank you for trusting us with ${escapeHtml(data.pet_name)}. We hope ${escapeHtml(data.pet_name)} is feeling fresh and fabulous!

If you enjoyed ${escapeHtml(data.pet_name)}'s grooming session, we'd be incredibly grateful if you could leave us a Google review. Your review helps other pet parents discover us!

Leave a Google Review:
${escapeHtml(data.review_url)}

Book Next Visit:
${escapeHtml(data.rebook_url)}

Thank you for being a valued part of Puppy Day family!

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createReviewRequestEmail(data: ReviewRequestEmailData): EmailTemplate {
  const subject = `How Was ${escapeHtml(data.pet_name)}'s Grooming Experience?`;
  const content = generateReviewRequestContent(data);
  const { html } = wrapEmailContent(content, { mood: 'celebration' });
  const text = generateReviewRequestText(data);

  return { html, text, subject };
}

// ============================================================================
// 12. WAITLIST ADDED EMAIL
// ============================================================================

function generateWaitlistAddedContent(data: WaitlistAddedEmailData): string {
  const timeLabel = data.time_preference.charAt(0).toUpperCase() + data.time_preference.slice(1);

  return createCard(`
    <h2 style="color: #434E54; margin: 0 0 8px 0;">You're on the Waitlist!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">
      Hi ${escapeHtml(data.customer_name)}, ${escapeHtml(data.pet_name)} has been added to the waitlist for ${escapeHtml(data.service_name)}.
    </p>

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
        ${createInfoRow('Requested Date', data.requested_date)}
        ${createInfoRow('Time Preference', timeLabel === 'Any' ? 'Any Time' : timeLabel)}
        ${createInfoRow('Queue Position', `#${String(data.position)}`)}
      </table>
    `)}

    ${createAlert(`
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #434E54; font-size: 14px;">How it works:</p>
      <p style="margin: 0; color: #434E54; font-size: 14px;">
        We'll notify you by email and text when a spot opens. You'll have 2 hours to claim the slot before it's offered to the next person in line.
      </p>
    `, 'info')}

    ${createPrimaryCTA('Call Us: (657) 252-2903', 'tel:+16572522903')}
  `);
}

function generateWaitlistAddedText(data: WaitlistAddedEmailData): string {
  const timeLabel = data.time_preference.charAt(0).toUpperCase() + data.time_preference.slice(1);

  return `
YOU'RE ON THE WAITLIST! - Puppy Day

Hi ${escapeHtml(data.customer_name)},

${escapeHtml(data.pet_name)} has been added to the waitlist for ${escapeHtml(data.service_name)}.

WAITLIST DETAILS:
Pet: ${escapeHtml(data.pet_name)}
Service: ${escapeHtml(data.service_name)}
Requested Date: ${escapeHtml(data.requested_date)}
Time Preference: ${timeLabel === 'Any' ? 'Any Time' : timeLabel}
Queue Position: #${String(data.position)}

HOW IT WORKS:
We'll notify you by email and text when a spot opens. You'll have 2 hours to claim the slot before it's offered to the next person in line.

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createWaitlistAddedEmail(data: WaitlistAddedEmailData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)} is on the Waitlist!`;
  const content = generateWaitlistAddedContent(data);
  const { html } = wrapEmailContent(content, { mood: 'info' });
  const text = generateWaitlistAddedText(data);

  return { html, text, subject };
}

// ============================================================================
// 13. WAITLIST AVAILABLE EMAIL
// ============================================================================

function generateWaitlistAvailableContent(data: WaitlistAvailableEmailData): string {
  const urgencyContent = `
    <h2 style="color: #434E54; margin: 0 0 16px 0;">A Spot Just Opened Up!</h2>
    <p style="color: #434E54; margin: 0 0 20px 0; font-size: 15px;">
      Great news, ${escapeHtml(data.customer_name)}! A grooming slot is available for ${escapeHtml(data.pet_name)}.
    </p>
    ${createPrimaryCTA('Claim Your Spot Now', data.claim_link)}
  `;

  return createCard(`
    ${createUrgencyBox(urgencyContent, `Expires in ${String(data.expiration_hours)} hours — act fast!`)}

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Available Date', data.available_date)}
        ${createInfoRow('Available Time', data.available_time)}
        ${createInfoRow('Pet', data.pet_name)}
      </table>
    `)}

    <p style="color: #434E54; margin: 16px 0 0 0; font-size: 14px; text-align: center;">
      Questions? Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
    </p>
  `);
}

function generateWaitlistAvailableText(data: WaitlistAvailableEmailData): string {
  return `
A SPOT OPENED UP FOR ${escapeHtml(data.pet_name).toUpperCase()}! - Puppy Day

Great news, ${escapeHtml(data.customer_name)}! A grooming slot is available.

AVAILABLE SLOT:
Date: ${escapeHtml(data.available_date)}
Time: ${escapeHtml(data.available_time)}
Pet: ${escapeHtml(data.pet_name)}

CLAIM YOUR SPOT NOW (expires in ${String(data.expiration_hours)} hours):
${escapeHtml(data.claim_link)}

Act fast! This slot will be offered to the next person if not claimed in ${String(data.expiration_hours)} hours.

Questions? Call us at (657) 252-2903

---
Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903 | puppyday14936@gmail.com
Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}

export function createWaitlistAvailableEmail(data: WaitlistAvailableEmailData): EmailTemplate {
  const subject = `A Spot Opened Up for ${escapeHtml(data.pet_name)}!`;
  const content = generateWaitlistAvailableContent(data);
  const { html } = wrapEmailContent(content, { mood: 'urgent' });
  const text = generateWaitlistAvailableText(data);

  return { html, text, subject };
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
  appointmentReminder: createAppointmentReminderEmail,
  appointmentCancelled: createAppointmentCancelledEmail,
  appointmentRescheduled: createAppointmentRescheduledEmail,
  reviewRequest: createReviewRequestEmail,
  waitlistAdded: createWaitlistAddedEmail,
  waitlistAvailable: createWaitlistAvailableEmail,
};
