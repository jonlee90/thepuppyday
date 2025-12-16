/**
 * Phase 8: Email Templates for The Puppy Day Notification System
 * Beautiful, responsive HTML templates with The Puppy Day branding
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
  createButton,
  createContentBox,
  createAlert,
  createInfoRow,
  createImage,
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
    <h2 style="color: #434E54; margin: 0 0 8px 0;">Booking Confirmed!</h2>
    <p style="color: #434E54; margin: 0 0 24px 0;">Hi ${escapeHtml(data.customer_name)}, we're excited to pamper ${escapeHtml(data.pet_name)}!</p>

    ${createContentBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${createInfoRow('Pet', data.pet_name)}
        ${createInfoRow('Service', data.service_name)}
        ${createInfoRow('Date & Time', `${escapeHtml(data.appointment_date)} at ${escapeHtml(data.appointment_time)}`)}
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

    ${createButton('Call Us: (657) 252-2903', 'tel:+16572522903')}
  `);
}

function generateBookingConfirmationText(data: BookingConfirmationData): string {
  return `
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
}

export function createBookingConfirmationEmail(data: BookingConfirmationData): EmailTemplate {
  const subject = `Booking Confirmed: ${escapeHtml(data.pet_name)}'s Grooming Appointment`;
  const content = generateBookingConfirmationContent(data);
  const { html } = wrapEmailContent(content);
  const text = generateBookingConfirmationText(data);

  return { html, text, subject };
}

// ============================================================================
// 2. REPORT CARD NOTIFICATION EMAIL
// ============================================================================

function generateReportCardContent(data: ReportCardData): string {
  return createCard(`
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

    ${createButton('View Full Report Card', data.report_card_link)}

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
            <a href="${process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || 'https://g.page/r/CbbCwxWs-HjiEAE'}" class="button" style="background-color: #434E54; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-size: 15px;">
              Leave a Google Review
            </a>
          </td>
        </tr>
      </table>
    `, 'info')}
  `);
}

function generateReportCardText(data: ReportCardData): string {
  return `
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
}

export function createReportCardEmail(data: ReportCardData): EmailTemplate {
  const subject = `${escapeHtml(data.pet_name)}'s Report Card is Ready!`;
  const content = generateReportCardContent(data);
  const { html } = wrapEmailContent(content);
  const text = generateReportCardText(data);

  return { html, text, subject };
}

// ============================================================================
// 3. RETENTION REMINDER EMAIL
// ============================================================================

function generateRetentionReminderContent(data: RetentionReminderData): string {
  return createCard(`
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
      ${createButton('Book Appointment', data.booking_url)}
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

    <p style="color: #434E54; margin: 24px 0 0 0; font-size: 14px; text-align: center;">
      Questions? Call us at <a href="tel:+16572522903" style="color: #434E54; font-weight: 500;">(657) 252-2903</a>
    </p>
  `);
}

function generateRetentionReminderText(data: RetentionReminderData): string {
  return `
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
}

export function createRetentionReminderEmail(data: RetentionReminderData): EmailTemplate {
  const subject = `Time for ${escapeHtml(data.pet_name)}'s Next Grooming Session`;
  const content = generateRetentionReminderContent(data);
  const { html } = wrapEmailContent(content);
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

    ${createButton('Update Payment Method', data.retry_link)}

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
}

export function createPaymentFailedEmail(data: PaymentFailedData): EmailTemplate {
  const subject = 'Payment Issue for Your Puppy Day Account';
  const content = generatePaymentFailedContent(data);
  const { html } = wrapEmailContent(content);
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
}

export function createPaymentReminderEmail(data: PaymentReminderData): EmailTemplate {
  const subject = 'Upcoming Payment for Your Puppy Day Membership';
  const content = generatePaymentReminderContent(data);
  const { html } = wrapEmailContent(content);
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
}

export function createPaymentSuccessEmail(data: PaymentSuccessData): EmailTemplate {
  const subject = 'Payment Received - Thank You!';
  const content = generatePaymentSuccessContent(data);
  const { html } = wrapEmailContent(content);
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

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center">
          <a href="${data.retry_link}" class="button" style="background-color: #EF4444; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 600;">
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
}

export function createPaymentFinalNoticeEmail(data: PaymentFinalNoticeData): EmailTemplate {
  const subject = 'Important: Final Payment Notice';
  const content = generatePaymentFinalNoticeContent(data);
  const { html } = wrapEmailContent(content);
  const text = generatePaymentFinalNoticeText(data);

  return { html, text, subject };
}

// ============================================================================
// SMS TEMPLATES
// ============================================================================

/**
 * SMS reminder sent 24 hours before appointment
 */
export function createAppointmentReminderSms(data: AppointmentReminderData): string {
  return `Reminder: ${escapeHtml(data.pet_name)}'s grooming tomorrow at ${escapeHtml(data.appointment_time)}. Puppy Day (657) 252-2903`;
}

/**
 * SMS sent when pet is checked in
 */
export function createCheckedInSms(data: AppointmentStatusData): string {
  return `We've got ${escapeHtml(data.pet_name)}! They're settling in nicely. We'll text when ready for pickup. - Puppy Day`;
}

/**
 * SMS sent when pet is ready for pickup
 */
export function createReadyForPickupSms(data: AppointmentStatusData): string {
  return `${escapeHtml(data.pet_name)} is ready for pickup! Looking fresh & fabulous! Puppy Day, 14936 Leffingwell Rd. (657) 252-2903`;
}

/**
 * SMS sent when waitlisted slot becomes available
 */
export function createWaitlistNotificationSms(data: WaitlistNotificationData): string {
  return `Puppy Day: Spot open ${escapeHtml(data.available_date)} at ${escapeHtml(data.available_time)}! Claim now (2hr exp): ${escapeHtml(data.claim_link)}`;
}

/**
 * SMS version of booking confirmation
 */
export function createBookingConfirmationSms(data: BookingConfirmationData): string {
  return `Confirmed! ${escapeHtml(data.pet_name)} ${escapeHtml(data.appointment_date)} ${escapeHtml(data.appointment_time)}. ${escapeHtml(data.total_price)}. Puppy Day (657) 252-2903`;
}

/**
 * SMS version of report card notification
 */
export function createReportCardSms(data: ReportCardData): string {
  return `${escapeHtml(data.pet_name)}'s report card ready with before/after photos! ${escapeHtml(data.report_card_link)} - Puppy Day`;
}

/**
 * SMS version of retention reminder
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
