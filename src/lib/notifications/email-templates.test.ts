/**
 * Phase 8: Email & SMS Templates Tests
 * Comprehensive tests for all notification templates
 */

import { describe, it, expect } from '@jest/globals';
import {
  emailTemplates,
  smsTemplates,
  createBookingConfirmationEmail,
  createReportCardEmail,
  createRetentionReminderEmail,
  createPaymentFailedEmail,
  createPaymentReminderEmail,
  createPaymentSuccessEmail,
  createPaymentFinalNoticeEmail,
  createAppointmentReminderSms,
  createCheckedInSms,
  createReadyForPickupSms,
  createWaitlistNotificationSms,
  createBookingConfirmationSms,
  createReportCardSms,
  createRetentionReminderSms,
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
// TEST DATA
// ============================================================================

const sampleBookingData: BookingConfirmationData = {
  customer_name: 'Sarah Johnson',
  pet_name: 'Max',
  appointment_date: 'Monday, December 18, 2025',
  appointment_time: '10:00 AM',
  service_name: 'Premium Grooming',
  total_price: '$95.00',
};

const sampleReportCardData: ReportCardData = {
  pet_name: 'Max',
  report_card_link: 'https://thepuppyday.com/report-cards/12345',
  before_image_url: 'https://example.com/before.jpg',
  after_image_url: 'https://example.com/after.jpg',
};

const sampleRetentionData: RetentionReminderData = {
  pet_name: 'Max',
  weeks_since_last: 8,
  breed_name: 'Golden Retriever',
  booking_url: 'https://thepuppyday.com/book',
};

const samplePaymentFailedData: PaymentFailedData = {
  failure_reason: 'Your card was declined. Please update your payment method.',
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
};

const samplePaymentReminderData: PaymentReminderData = {
  charge_date: 'December 20, 2025',
  amount: '$95.00',
  payment_method: 'Visa ending in 4242',
};

const samplePaymentSuccessData: PaymentSuccessData = {
  amount: '$95.00',
  payment_date: 'December 15, 2025',
  payment_method: 'Visa ending in 4242',
};

const samplePaymentFinalNoticeData: PaymentFinalNoticeData = {
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
  suspension_date: 'December 25, 2025',
};

const sampleAppointmentReminderData: AppointmentReminderData = {
  pet_name: 'Max',
  appointment_time: '10:00 AM',
};

const sampleAppointmentStatusData: AppointmentStatusData = {
  pet_name: 'Max',
};

const sampleWaitlistData: WaitlistNotificationData = {
  available_date: 'Dec 18',
  available_time: '2:00 PM',
  claim_link: 'https://thepuppyday.com/claim/abc123',
};

// ============================================================================
// EMAIL TEMPLATE TESTS
// ============================================================================

describe('Email Templates', () => {
  describe('Booking Confirmation Email', () => {
    const result = createBookingConfirmationEmail(sampleBookingData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe("Booking Confirmed: Max's Grooming Appointment");
    });

    it('should include customer name in HTML', () => {
      expect(result.html).toContain('Sarah Johnson');
    });

    it('should include pet name in HTML', () => {
      expect(result.html).toContain('Max');
    });

    it('should include appointment details in HTML', () => {
      expect(result.html).toContain('Monday, December 18, 2025');
      expect(result.html).toContain('10:00 AM');
      expect(result.html).toContain('Premium Grooming');
      expect(result.html).toContain('$95.00');
    });

    it('should include cancellation policy in HTML', () => {
      expect(result.html).toContain('Cancellation Policy');
      expect(result.html).toContain('24 hours');
    });

    it('should include all details in plain text version', () => {
      expect(result.text).toContain('Sarah Johnson');
      expect(result.text).toContain('Max');
      expect(result.text).toContain('Monday, December 18, 2025');
      expect(result.text).toContain('10:00 AM');
      expect(result.text).toContain('Premium Grooming');
      expect(result.text).toContain('$95.00');
    });

    it('should include business contact info in HTML', () => {
      expect(result.html).toContain('(657) 252-2903');
      expect(result.html).toContain('puppyday14936@gmail.com');
    });

    it('should have valid HTML structure', () => {
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html');
      expect(result.html).toContain('</html>');
    });

    it('should include unsubscribe link placeholder', () => {
      expect(result.html).toContain('{{unsubscribe_link}}');
    });
  });

  describe('Report Card Email', () => {
    const result = createReportCardEmail(sampleReportCardData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe("Max's Report Card is Ready!");
    });

    it('should include pet name in HTML', () => {
      expect(result.html).toContain('Max');
    });

    it('should include report card link in HTML', () => {
      expect(result.html).toContain('https://thepuppyday.com/report-cards/12345');
    });

    it('should include before/after images when provided', () => {
      expect(result.html).toContain('https://example.com/before.jpg');
      expect(result.html).toContain('https://example.com/after.jpg');
    });

    it('should include review encouragement in HTML', () => {
      expect(result.html.toLowerCase()).toContain('review');
    });

    it('should include report card link in plain text', () => {
      expect(result.text).toContain('https://thepuppyday.com/report-cards/12345');
    });
  });

  describe('Retention Reminder Email', () => {
    const result = createRetentionReminderEmail(sampleRetentionData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe("Time for Max's Next Grooming Session");
    });

    it('should include pet name in HTML', () => {
      expect(result.html).toContain('Max');
    });

    it('should include weeks since last visit in HTML', () => {
      expect(result.html).toContain('8 weeks');
    });

    it('should include breed name in HTML', () => {
      expect(result.html).toContain('Golden Retriever');
    });

    it('should include booking URL in HTML', () => {
      expect(result.html).toContain('https://thepuppyday.com/book');
    });

    it('should include grooming benefits in HTML', () => {
      expect(result.html.toLowerCase()).toContain('matting');
      expect(result.html.toLowerCase()).toContain('skin');
    });
  });

  describe('Payment Failed Email', () => {
    const result = createPaymentFailedEmail(samplePaymentFailedData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe('Payment Issue for Your Puppy Day Account');
    });

    it('should include failure reason in HTML', () => {
      expect(result.html).toContain('card was declined');
    });

    it('should include amount due in HTML', () => {
      expect(result.html).toContain('$95.00');
    });

    it('should include retry link in HTML', () => {
      expect(result.html).toContain('https://thepuppyday.com/account/payment');
    });

    it('should have professional and helpful tone', () => {
      expect(result.html.toLowerCase()).toContain('help');
      expect(result.text.toLowerCase()).toContain('assist');
    });
  });

  describe('Payment Reminder Email', () => {
    const result = createPaymentReminderEmail(samplePaymentReminderData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe('Upcoming Payment for Your Puppy Day Membership');
    });

    it('should include charge date in HTML', () => {
      expect(result.html).toContain('December 20, 2025');
    });

    it('should include amount in HTML', () => {
      expect(result.html).toContain('$95.00');
    });

    it('should include payment method in HTML', () => {
      expect(result.html).toContain('Visa ending in 4242');
    });

    it('should indicate no action required', () => {
      expect(result.html).toContain('No action required');
    });
  });

  describe('Payment Success Email', () => {
    const result = createPaymentSuccessEmail(samplePaymentSuccessData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe('Payment Received - Thank You!');
    });

    it('should include amount in HTML', () => {
      expect(result.html).toContain('$95.00');
    });

    it('should include payment date in HTML', () => {
      expect(result.html).toContain('December 15, 2025');
    });

    it('should include payment method in HTML', () => {
      expect(result.html).toContain('Visa ending in 4242');
    });

    it('should have positive, grateful tone', () => {
      expect(result.html.toLowerCase()).toContain('thank');
      expect(result.text.toLowerCase()).toContain('appreciate');
    });
  });

  describe('Payment Final Notice Email', () => {
    const result = createPaymentFinalNoticeEmail(samplePaymentFinalNoticeData);

    it('should have correct subject line', () => {
      expect(result.subject).toBe('Important: Final Payment Notice');
    });

    it('should include amount due in HTML', () => {
      expect(result.html).toContain('$95.00');
    });

    it('should include suspension date in HTML', () => {
      expect(result.html).toContain('December 25, 2025');
    });

    it('should include retry link in HTML', () => {
      expect(result.html).toContain('https://thepuppyday.com/account/payment');
    });

    it('should convey urgency', () => {
      expect(result.html.toLowerCase()).toContain('final');
      expect(result.html.toLowerCase()).toContain('suspension');
    });

    it('should explain consequences', () => {
      expect(result.html.toLowerCase()).toContain('suspended');
      expect(result.text.toLowerCase()).toContain('suspended');
    });
  });
});

// ============================================================================
// SMS TEMPLATE TESTS
// ============================================================================

describe('SMS Templates', () => {
  describe('Appointment Reminder SMS', () => {
    const result = createAppointmentReminderSms(sampleAppointmentReminderData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include appointment time', () => {
      expect(result).toContain('10:00 AM');
    });

    it('should include business address', () => {
      expect(result).toContain('14936 Leffingwell Rd');
    });

    it('should include phone number', () => {
      expect(result).toContain('(657) 252-2903');
    });

    it('should be under 160 characters for single SMS', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Checked In SMS', () => {
    const result = createCheckedInSms(sampleAppointmentStatusData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include business address', () => {
      expect(result).toContain('14936 Leffingwell Rd');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Ready for Pickup SMS', () => {
    const result = createReadyForPickupSms(sampleAppointmentStatusData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include business address', () => {
      expect(result).toContain('14936 Leffingwell Rd');
    });

    it('should include phone number', () => {
      expect(result).toContain('(657) 252-2903');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Waitlist Notification SMS', () => {
    const result = createWaitlistNotificationSms(sampleWaitlistData);

    it('should include available date', () => {
      expect(result).toContain('Dec 18');
    });

    it('should include available time', () => {
      expect(result).toContain('2:00 PM');
    });

    it('should include claim link', () => {
      expect(result).toContain('https://thepuppyday.com/claim/abc123');
    });

    it('should mention expiration time', () => {
      expect(result).toContain('2hrs');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Booking Confirmation SMS', () => {
    const result = createBookingConfirmationSms(sampleBookingData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include service name', () => {
      expect(result).toContain('Premium Grooming');
    });

    it('should include appointment date', () => {
      expect(result).toContain('Monday, December 18, 2025');
    });

    it('should include total price', () => {
      expect(result).toContain('$95.00');
    });

    it('should include phone number', () => {
      expect(result).toContain('(657) 252-2903');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Report Card SMS', () => {
    const result = createReportCardSms(sampleReportCardData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include report card link', () => {
      expect(result).toContain('https://thepuppyday.com/report-cards/12345');
    });

    it('should mention review', () => {
      expect(result.toLowerCase()).toContain('review');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe('Retention Reminder SMS', () => {
    const result = createRetentionReminderSms(sampleRetentionData);

    it('should include pet name', () => {
      expect(result).toContain('Max');
    });

    it('should include weeks since last visit', () => {
      expect(result).toContain('8 weeks');
    });

    it('should include booking URL', () => {
      expect(result).toContain('https://thepuppyday.com/book');
    });

    it('should include phone number', () => {
      expect(result).toContain('(657) 252-2903');
    });

    it('should be under 160 characters', () => {
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });
});

// ============================================================================
// TEMPLATE ACCESSIBILITY TESTS
// ============================================================================

describe('Email Template Accessibility', () => {
  const emailResult = createBookingConfirmationEmail(sampleBookingData);

  it('should include proper HTML lang attribute', () => {
    expect(emailResult.html).toContain('lang="en"');
  });

  it('should include viewport meta tag', () => {
    expect(emailResult.html).toContain('viewport');
  });

  it('should include proper DOCTYPE', () => {
    expect(emailResult.html).toContain('<!DOCTYPE html>');
  });

  it('should use semantic HTML structure', () => {
    expect(emailResult.html).toContain('<table role="presentation"');
  });
});

// ============================================================================
// TEMPLATE BRANDING TESTS
// ============================================================================

describe('Email Template Branding', () => {
  const templates = [
    createBookingConfirmationEmail(sampleBookingData),
    createReportCardEmail(sampleReportCardData),
    createRetentionReminderEmail(sampleRetentionData),
    createPaymentFailedEmail(samplePaymentFailedData),
  ];

  templates.forEach((template, index) => {
    it(`should include "The Puppy Day" branding in template ${index + 1}`, () => {
      expect(template.html).toContain('The Puppy Day');
      expect(template.text).toContain('Puppy Day');
    });

    it(`should include business address in template ${index + 1}`, () => {
      expect(template.html).toContain('14936 Leffingwell Rd');
    });

    it(`should include business phone in template ${index + 1}`, () => {
      expect(template.html).toContain('(657) 252-2903');
    });

    it(`should include business email in template ${index + 1}`, () => {
      expect(template.html).toContain('puppyday14936@gmail.com');
    });

    it(`should include business hours in template ${index + 1}`, () => {
      expect(template.html).toContain('Monday-Saturday');
    });
  });
});

// ============================================================================
// TEMPLATE EXPORT TESTS
// ============================================================================

describe('Template Exports', () => {
  it('should export emailTemplates object with all email generators', () => {
    expect(emailTemplates).toHaveProperty('bookingConfirmation');
    expect(emailTemplates).toHaveProperty('reportCard');
    expect(emailTemplates).toHaveProperty('retentionReminder');
    expect(emailTemplates).toHaveProperty('paymentFailed');
    expect(emailTemplates).toHaveProperty('paymentReminder');
    expect(emailTemplates).toHaveProperty('paymentSuccess');
    expect(emailTemplates).toHaveProperty('paymentFinalNotice');
  });

  it('should export smsTemplates object with all SMS generators', () => {
    expect(smsTemplates).toHaveProperty('appointmentReminder');
    expect(smsTemplates).toHaveProperty('checkedIn');
    expect(smsTemplates).toHaveProperty('readyForPickup');
    expect(smsTemplates).toHaveProperty('waitlistNotification');
    expect(smsTemplates).toHaveProperty('bookingConfirmation');
    expect(smsTemplates).toHaveProperty('reportCard');
    expect(smsTemplates).toHaveProperty('retentionReminder');
  });
});
