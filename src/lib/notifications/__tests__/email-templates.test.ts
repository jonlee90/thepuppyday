/**
 * Phase 8: Email Templates Tests
 * Tests for email base template and refactored email templates
 * Tasks 0105-0106
 */

import { describe, it, expect } from 'vitest';
import {
  createBookingConfirmationEmail,
  createReportCardEmail,
  createRetentionReminderEmail,
  createPaymentFailedEmail,
  createPaymentReminderEmail,
  createPaymentSuccessEmail,
  createPaymentFinalNoticeEmail,
} from '../email-templates';

describe('Email Templates - Refactored with Base Template', () => {
  describe('Booking Confirmation Email', () => {
    it('should generate HTML and text versions', () => {
      const email = createBookingConfirmationEmail({
        customer_name: 'John Doe',
        pet_name: 'Max',
        appointment_date: 'March 15, 2024',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      });

      expect(email.html).toContain('The Puppy Day');
      expect(email.html).toContain('Booking Confirmed!');
      expect(email.html).toContain('John Doe');
      expect(email.html).toContain('Max');
      expect(email.html).toContain('Premium Grooming');
      expect(email.html).toContain('$95.00');
      expect(email.html).toContain('14936 Leffingwell Rd');
      expect(email.html).toContain('{{UNSUBSCRIBE_LINK}}');

      expect(email.text).toContain('BOOKING CONFIRMED');
      expect(email.text).toContain('John Doe');
      expect(email.text).toContain('Max');

      expect(email.subject).toContain('Max');
      expect(email.subject).toContain('Booking Confirmed');
    });

    it('should escape HTML in customer input', () => {
      const email = createBookingConfirmationEmail({
        customer_name: '<script>alert("xss")</script>',
        pet_name: 'Max',
        appointment_date: 'March 15, 2024',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      });

      expect(email.html).not.toContain('<script>');
      expect(email.html).toContain('&lt;script&gt;');
    });
  });

  describe('Report Card Email', () => {
    it('should generate HTML with images when URLs provided', () => {
      const email = createReportCardEmail({
        pet_name: 'Bella',
        report_card_link: 'https://example.com/report/123',
        before_image_url: 'https://example.com/before.jpg',
        after_image_url: 'https://example.com/after.jpg',
      });

      expect(email.html).toContain('Bella');
      expect(email.html).toContain('Report Card is Ready');
      expect(email.html).toContain('before.jpg');
      expect(email.html).toContain('after.jpg');
      expect(email.html).toContain('View Full Report Card');
    });

    it('should work without images', () => {
      const email = createReportCardEmail({
        pet_name: 'Bella',
        report_card_link: 'https://example.com/report/123',
      });

      expect(email.html).toContain('Bella');
      expect(email.html).toContain('Report Card is Ready');
      expect(email.html).not.toContain('Before');
      expect(email.html).not.toContain('After');
    });
  });

  describe('Retention Reminder Email', () => {
    it('should include breed-specific messaging', () => {
      const email = createRetentionReminderEmail({
        pet_name: 'Charlie',
        weeks_since_last: 8,
        breed_name: 'Golden Retriever',
        booking_url: 'https://example.com/book',
      });

      expect(email.html).toContain('Charlie');
      expect(email.html).toContain('8 weeks');
      expect(email.html).toContain('Golden Retriever');
      expect(email.html).toContain('Book Appointment');
    });

    it('should work without breed name', () => {
      const email = createRetentionReminderEmail({
        pet_name: 'Charlie',
        weeks_since_last: 8,
        breed_name: '',
        booking_url: 'https://example.com/book',
      });

      expect(email.html).toContain('Charlie');
      expect(email.html).toContain('Regular grooming');
    });
  });

  describe('Payment Emails', () => {
    it('should generate payment failed email', () => {
      const email = createPaymentFailedEmail({
        failure_reason: 'Card declined',
        amount_due: '$45.00',
        retry_link: 'https://example.com/retry',
      });

      expect(email.html).toContain('Payment Issue');
      expect(email.html).toContain('Card declined');
      expect(email.html).toContain('$45.00');
      expect(email.html).toContain('Update Payment Method');
    });

    it('should generate payment reminder email', () => {
      const email = createPaymentReminderEmail({
        charge_date: 'March 20, 2024',
        amount: '$45.00',
        payment_method: 'Visa ending in 1234',
      });

      expect(email.html).toContain('Upcoming Payment Reminder');
      expect(email.html).toContain('March 20, 2024');
      expect(email.html).toContain('$45.00');
      expect(email.html).toContain('Visa ending in 1234');
    });

    it('should generate payment success email', () => {
      const email = createPaymentSuccessEmail({
        amount: '$45.00',
        payment_date: 'March 15, 2024',
        payment_method: 'Visa ending in 1234',
      });

      expect(email.html).toContain('Payment Received');
      expect(email.html).toContain('$45.00');
      expect(email.html).toContain('March 15, 2024');
    });

    it('should generate payment final notice email', () => {
      const email = createPaymentFinalNoticeEmail({
        amount_due: '$45.00',
        retry_link: 'https://example.com/retry',
        suspension_date: 'March 25, 2024',
      });

      expect(email.html).toContain('Final Payment Notice');
      expect(email.html).toContain('$45.00');
      expect(email.html).toContain('March 25, 2024');
      expect(email.html).toContain('Update Payment Method Now');
    });
  });

  describe('Base Template Integration', () => {
    it('should include consistent header across all templates', () => {
      const emails = [
        createBookingConfirmationEmail({
          customer_name: 'John',
          pet_name: 'Max',
          appointment_date: 'March 15',
          appointment_time: '10:00 AM',
          service_name: 'Grooming',
          total_price: '$50',
        }),
        createReportCardEmail({
          pet_name: 'Max',
          report_card_link: 'https://example.com',
        }),
        createRetentionReminderEmail({
          pet_name: 'Max',
          weeks_since_last: 8,
          breed_name: 'Golden Retriever',
          booking_url: 'https://example.com',
        }),
      ];

      emails.forEach((email) => {
        expect(email.html).toContain('The Puppy Day');
        expect(email.html).toContain('Professional Dog Grooming');
      });
    });

    it('should include consistent footer across all templates', () => {
      const emails = [
        createBookingConfirmationEmail({
          customer_name: 'John',
          pet_name: 'Max',
          appointment_date: 'March 15',
          appointment_time: '10:00 AM',
          service_name: 'Grooming',
          total_price: '$50',
        }),
        createPaymentSuccessEmail({
          amount: '$45',
          payment_date: 'March 15',
          payment_method: 'Visa',
        }),
      ];

      emails.forEach((email) => {
        expect(email.html).toContain('14936 Leffingwell Rd, La Mirada, CA 90638');
        expect(email.html).toContain('(657) 252-2903');
        expect(email.html).toContain('puppyday14936@gmail.com');
        expect(email.html).toContain('Monday-Saturday, 9:00 AM - 5:00 PM');
        expect(email.html).toContain('Instagram @puppyday_lm');
        expect(email.html).toContain('{{UNSUBSCRIBE_LINK}}');
      });
    });

    it('should use Clean & Elegant Professional color scheme', () => {
      const email = createBookingConfirmationEmail({
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'March 15',
        appointment_time: '10:00 AM',
        service_name: 'Grooming',
        total_price: '$50',
      });

      expect(email.html).toContain('#434E54'); // Primary/charcoal
      expect(email.html).toContain('#F8EEE5'); // Background/warm cream
    });
  });
});
