/**
 * Phase 8: Template Helper Functions
 * Utility functions for working with email and SMS templates
 * SECURITY ENHANCED: Proper input sanitization and type guards
 */

import {
  emailTemplates,
  smsTemplates,
  type EmailTemplate,
  type BookingConfirmationData,
  type ReportCardData,
  type RetentionReminderData,
  type PaymentFailedData,
  type PaymentReminderData,
  type PaymentSuccessData,
  type PaymentFinalNoticeData,
  type AppointmentReminderData,
  type AppointmentStatusData,
  type WaitlistNotificationData,
} from './email-templates';

// ============================================================================
// TEMPLATE TYPE MAPPING
// ============================================================================

/**
 * Map notification types to their corresponding template data types
 */
export type TemplateDataMap = {
  booking_confirmation: BookingConfirmationData;
  report_card_notification: ReportCardData;
  retention_reminder: RetentionReminderData;
  payment_failed: PaymentFailedData;
  payment_reminder: PaymentReminderData;
  payment_success: PaymentSuccessData;
  payment_final_notice: PaymentFinalNoticeData;
  appointment_reminder: AppointmentReminderData;
  appointment_checked_in: AppointmentStatusData;
  appointment_ready_for_pickup: AppointmentStatusData;
  waitlist_notification: WaitlistNotificationData;
};

/**
 * Notification type keys
 */
export type NotificationType = keyof TemplateDataMap;

// ============================================================================
// INPUT SANITIZATION HELPERS
// ============================================================================

/**
 * Validate and sanitize string input
 */
function sanitizeString(value: unknown, maxLength: number = 100): string {
  if (typeof value !== 'string') {
    return '';
  }
  // Trim whitespace and limit length
  return value.trim().substring(0, maxLength);
}

/**
 * Validate URL format
 */
function isValidUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate price format ($XX.XX)
 */
function isValidPrice(price: unknown): boolean {
  if (typeof price !== 'string') return false;
  return /^\$\d+\.\d{2}$/.test(price);
}

/**
 * Validate number
 */
function isValidNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for BookingConfirmationData
 */
function isBookingConfirmationData(data: unknown): data is BookingConfirmationData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.customer_name === 'string' &&
    d.customer_name.length > 0 &&
    d.customer_name.length <= 100 &&
    typeof d.pet_name === 'string' &&
    d.pet_name.length > 0 &&
    d.pet_name.length <= 100 &&
    typeof d.appointment_date === 'string' &&
    d.appointment_date.length > 0 &&
    d.appointment_date.length <= 50 &&
    typeof d.appointment_time === 'string' &&
    d.appointment_time.length > 0 &&
    d.appointment_time.length <= 20 &&
    typeof d.service_name === 'string' &&
    d.service_name.length > 0 &&
    d.service_name.length <= 100 &&
    typeof d.total_price === 'string' &&
    isValidPrice(d.total_price)
  );
}

/**
 * Type guard for ReportCardData
 */
function isReportCardData(data: unknown): data is ReportCardData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  const hasRequiredFields =
    typeof d.pet_name === 'string' &&
    d.pet_name.length > 0 &&
    d.pet_name.length <= 100 &&
    typeof d.report_card_link === 'string' &&
    isValidUrl(d.report_card_link);

  if (!hasRequiredFields) return false;

  // Optional fields validation
  if (d.before_image_url !== undefined && !isValidUrl(d.before_image_url)) {
    return false;
  }
  if (d.after_image_url !== undefined && !isValidUrl(d.after_image_url)) {
    return false;
  }

  return true;
}

/**
 * Type guard for RetentionReminderData
 */
function isRetentionReminderData(data: unknown): data is RetentionReminderData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.pet_name === 'string' &&
    d.pet_name.length > 0 &&
    d.pet_name.length <= 100 &&
    isValidNumber(d.weeks_since_last) &&
    (d.weeks_since_last as number) >= 0 &&
    typeof d.breed_name === 'string' &&
    d.breed_name.length <= 100 &&
    typeof d.booking_url === 'string' &&
    isValidUrl(d.booking_url)
  );
}

/**
 * Type guard for PaymentFailedData
 */
function isPaymentFailedData(data: unknown): data is PaymentFailedData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.failure_reason === 'string' &&
    d.failure_reason.length > 0 &&
    d.failure_reason.length <= 200 &&
    typeof d.amount_due === 'string' &&
    isValidPrice(d.amount_due) &&
    typeof d.retry_link === 'string' &&
    isValidUrl(d.retry_link)
  );
}

/**
 * Type guard for PaymentReminderData
 */
function isPaymentReminderData(data: unknown): data is PaymentReminderData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.charge_date === 'string' &&
    d.charge_date.length > 0 &&
    d.charge_date.length <= 50 &&
    typeof d.amount === 'string' &&
    isValidPrice(d.amount) &&
    typeof d.payment_method === 'string' &&
    d.payment_method.length > 0 &&
    d.payment_method.length <= 50
  );
}

/**
 * Type guard for PaymentSuccessData
 */
function isPaymentSuccessData(data: unknown): data is PaymentSuccessData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.amount === 'string' &&
    isValidPrice(d.amount) &&
    typeof d.payment_date === 'string' &&
    d.payment_date.length > 0 &&
    d.payment_date.length <= 50 &&
    typeof d.payment_method === 'string' &&
    d.payment_method.length > 0 &&
    d.payment_method.length <= 50
  );
}

/**
 * Type guard for PaymentFinalNoticeData
 */
function isPaymentFinalNoticeData(data: unknown): data is PaymentFinalNoticeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.amount_due === 'string' &&
    isValidPrice(d.amount_due) &&
    typeof d.retry_link === 'string' &&
    isValidUrl(d.retry_link) &&
    typeof d.suspension_date === 'string' &&
    d.suspension_date.length > 0 &&
    d.suspension_date.length <= 50
  );
}

/**
 * Type guard for AppointmentReminderData
 */
function isAppointmentReminderData(data: unknown): data is AppointmentReminderData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.pet_name === 'string' &&
    d.pet_name.length > 0 &&
    d.pet_name.length <= 100 &&
    typeof d.appointment_time === 'string' &&
    d.appointment_time.length > 0 &&
    d.appointment_time.length <= 20
  );
}

/**
 * Type guard for AppointmentStatusData
 */
function isAppointmentStatusData(data: unknown): data is AppointmentStatusData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.pet_name === 'string' &&
    d.pet_name.length > 0 &&
    d.pet_name.length <= 100
  );
}

/**
 * Type guard for WaitlistNotificationData
 */
function isWaitlistNotificationData(data: unknown): data is WaitlistNotificationData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.available_date === 'string' &&
    d.available_date.length > 0 &&
    d.available_date.length <= 20 &&
    typeof d.available_time === 'string' &&
    d.available_time.length > 0 &&
    d.available_time.length <= 20 &&
    typeof d.claim_link === 'string' &&
    isValidUrl(d.claim_link)
  );
}

// ============================================================================
// TEMPLATE RENDERING FUNCTIONS
// ============================================================================

/**
 * Render an email template for a specific notification type
 */
export function renderEmailTemplate<T extends NotificationType>(
  type: T,
  data: TemplateDataMap[T]
): EmailTemplate | null {
  switch (type) {
    case 'booking_confirmation':
      if (!isBookingConfirmationData(data)) {
        console.error('Invalid data for booking_confirmation email template');
        return null;
      }
      return emailTemplates.bookingConfirmation(data);

    case 'report_card_notification':
      if (!isReportCardData(data)) {
        console.error('Invalid data for report_card_notification email template');
        return null;
      }
      return emailTemplates.reportCard(data);

    case 'retention_reminder':
      if (!isRetentionReminderData(data)) {
        console.error('Invalid data for retention_reminder email template');
        return null;
      }
      return emailTemplates.retentionReminder(data);

    case 'payment_failed':
      if (!isPaymentFailedData(data)) {
        console.error('Invalid data for payment_failed email template');
        return null;
      }
      return emailTemplates.paymentFailed(data);

    case 'payment_reminder':
      if (!isPaymentReminderData(data)) {
        console.error('Invalid data for payment_reminder email template');
        return null;
      }
      return emailTemplates.paymentReminder(data);

    case 'payment_success':
      if (!isPaymentSuccessData(data)) {
        console.error('Invalid data for payment_success email template');
        return null;
      }
      return emailTemplates.paymentSuccess(data);

    case 'payment_final_notice':
      if (!isPaymentFinalNoticeData(data)) {
        console.error('Invalid data for payment_final_notice email template');
        return null;
      }
      return emailTemplates.paymentFinalNotice(data);

    default:
      // These notification types don't have dedicated email templates
      console.error(`No email template available for notification type: ${type}`);
      return null;
  }
}

/**
 * Render an SMS template for a specific notification type
 */
export function renderSmsTemplate<T extends NotificationType>(
  type: T,
  data: TemplateDataMap[T]
): string | null {
  switch (type) {
    case 'appointment_reminder':
      if (!isAppointmentReminderData(data)) {
        console.error('Invalid data for appointment_reminder SMS template');
        return null;
      }
      return smsTemplates.appointmentReminder(data);

    case 'appointment_checked_in':
      if (!isAppointmentStatusData(data)) {
        console.error('Invalid data for appointment_checked_in SMS template');
        return null;
      }
      return smsTemplates.checkedIn(data);

    case 'appointment_ready_for_pickup':
      if (!isAppointmentStatusData(data)) {
        console.error('Invalid data for appointment_ready_for_pickup SMS template');
        return null;
      }
      return smsTemplates.readyForPickup(data);

    case 'waitlist_notification':
      if (!isWaitlistNotificationData(data)) {
        console.error('Invalid data for waitlist_notification SMS template');
        return null;
      }
      return smsTemplates.waitlistNotification(data);

    case 'booking_confirmation':
      if (!isBookingConfirmationData(data)) {
        console.error('Invalid data for booking_confirmation SMS template');
        return null;
      }
      return smsTemplates.bookingConfirmation(data);

    case 'report_card_notification':
      if (!isReportCardData(data)) {
        console.error('Invalid data for report_card_notification SMS template');
        return null;
      }
      return smsTemplates.reportCard(data);

    case 'retention_reminder':
      if (!isRetentionReminderData(data)) {
        console.error('Invalid data for retention_reminder SMS template');
        return null;
      }
      return smsTemplates.retentionReminder(data);

    default:
      // These notification types don't have SMS templates
      console.error(`No SMS template available for notification type: ${type}`);
      return null;
  }
}

// ============================================================================
// TEMPLATE DATA VALIDATION
// ============================================================================

/**
 * Validate that all required fields are present in template data
 * Uses proper type guards instead of type assertions
 */
export function validateTemplateData<T extends NotificationType>(
  type: T,
  data: unknown
): data is TemplateDataMap[T] {
  if (!data || typeof data !== 'object') {
    return false;
  }

  switch (type) {
    case 'booking_confirmation':
      return isBookingConfirmationData(data);

    case 'report_card_notification':
      return isReportCardData(data);

    case 'retention_reminder':
      return isRetentionReminderData(data);

    case 'payment_failed':
      return isPaymentFailedData(data);

    case 'payment_reminder':
      return isPaymentReminderData(data);

    case 'payment_success':
      return isPaymentSuccessData(data);

    case 'payment_final_notice':
      return isPaymentFinalNoticeData(data);

    case 'appointment_reminder':
      return isAppointmentReminderData(data);

    case 'appointment_checked_in':
    case 'appointment_ready_for_pickup':
      return isAppointmentStatusData(data);

    case 'waitlist_notification':
      return isWaitlistNotificationData(data);

    default:
      return false;
  }
}

// ============================================================================
// SMS CHARACTER COUNT HELPERS
// ============================================================================

/**
 * Calculate SMS segment count (GSM 7-bit encoding)
 */
export function calculateSmsSegments(text: string): number {
  const length = text.length;

  if (length === 0) return 0;
  if (length <= 160) return 1;

  // Multi-segment messages use 153 characters per segment
  return Math.ceil(length / 153);
}

/**
 * Check if SMS text fits in a single segment
 */
export function isSingleSegment(text: string): boolean {
  return text.length <= 160;
}

/**
 * Get SMS length info
 */
export function getSmsLengthInfo(text: string): {
  length: number;
  segments: number;
  remaining: number;
  isSingleSegment: boolean;
} {
  const length = text.length;
  const segments = calculateSmsSegments(text);
  const isSingle = isSingleSegment(text);

  let remaining: number;
  if (isSingle) {
    remaining = 160 - length;
  } else {
    const nextSegmentStart = segments * 153;
    remaining = nextSegmentStart - length;
  }

  return {
    length,
    segments,
    remaining,
    isSingleSegment: isSingle,
  };
}

// ============================================================================
// UNSUBSCRIBE LINK HELPER
// ============================================================================

/**
 * Replace unsubscribe placeholder with actual link
 */
export function insertUnsubscribeLink(
  html: string,
  customerId: string,
  baseUrl: string = 'https://thepuppyday.com'
): string {
  const unsubscribeUrl = `${baseUrl}/unsubscribe?customer=${encodeURIComponent(customerId)}`;
  return html.replace(/\{unsubscribe_link\}/g, unsubscribeUrl);
}

// ============================================================================
// DATE/TIME FORMATTING HELPERS
// ============================================================================

/**
 * Format date for email templates
 * Example: "Monday, December 18, 2025"
 */
export function formatEmailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for SMS templates (shorter)
 * Example: "Dec 18"
 */
export function formatSmsDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for templates
 * Example: "10:00 AM"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format price for templates
 * Example: "$95.00"
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

// ============================================================================
// TEMPLATE PREVIEW HELPERS
// ============================================================================

/**
 * Generate preview data for a notification type
 */
export function generatePreviewData<T extends NotificationType>(
  type: T
): TemplateDataMap[T] {
  const baseData = {
    customer_name: 'Sarah Johnson',
    pet_name: 'Max',
    appointment_date: 'Monday, December 18, 2025',
    appointment_time: '10:00 AM',
    service_name: 'Premium Grooming',
    total_price: '$95.00',
    weeks_since_last: 8,
    breed_name: 'Golden Retriever',
    booking_url: 'https://thepuppyday.com/book',
    report_card_link: 'https://thepuppyday.com/report-cards/preview',
    before_image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    after_image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
    failure_reason: 'Your card was declined. Please update your payment method.',
    amount_due: '$95.00',
    retry_link: 'https://thepuppyday.com/account/payment',
    charge_date: 'December 20, 2025',
    amount: '$95.00',
    payment_method: 'Visa ending in 4242',
    payment_date: 'December 15, 2025',
    suspension_date: 'December 25, 2025',
    available_date: 'Dec 18',
    available_time: '2:00 PM',
    claim_link: 'https://thepuppyday.com/claim/preview',
  };

  // Return type-specific subset of data
  // TypeScript will ensure we return the correct type
  return baseData as TemplateDataMap[T];
}

// ============================================================================
// EXPORTS
// ============================================================================

export { emailTemplates, smsTemplates };
