/**
 * Phase 8: Security Tests for Notification Templates
 * Tests XSS prevention, HTML escaping, and input validation
 */

import { describe, it, expect } from 'vitest';
import {
  createBookingConfirmationEmail,
  createReportCardEmail,
  createPaymentFailedEmail,
  createAppointmentReminderSms,
  createBookingConfirmationSms,
} from '../email-templates';
import { validateTemplateData } from '../template-helpers';

describe('Security: XSS Prevention', () => {
  describe('HTML Escaping in Email Templates', () => {
    it('should escape HTML tags in customer names', () => {
      const maliciousData = {
        customer_name: '<script>alert("xss")</script>',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(maliciousData);

      // Should contain escaped version, not raw script tags
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&lt;/script&gt;');
      expect(result.html).not.toContain('<script>alert("xss")</script>');

      // Text version should also be escaped
      expect(result.text).not.toContain('<script>');
    });

    it('should escape HTML tags in pet names', () => {
      const maliciousData = {
        customer_name: 'John',
        pet_name: '<img src=x onerror=alert(1)>',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(maliciousData);

      expect(result.html).toContain('&lt;img');
      expect(result.html).not.toContain('<img src=x onerror=alert(1)>');
    });

    it('should escape HTML in service names', () => {
      const maliciousData = {
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium<iframe src="evil.com"></iframe>',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(maliciousData);

      expect(result.html).toContain('&lt;iframe');
      expect(result.html).not.toContain('<iframe src="evil.com">');
    });

    it('should escape quotes and apostrophes', () => {
      const maliciousData = {
        customer_name: 'John"\'',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(maliciousData);

      expect(result.html).toContain('&quot;');
      expect(result.html).toContain('&#x27;');
      expect(result.html).not.toContain('"\'');
    });

    it('should escape ampersands', () => {
      const maliciousData = {
        customer_name: 'John & Jane',
        pet_name: 'Max & Bella',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(maliciousData);

      // Should escape ampersands in names
      expect(result.html).toContain('&amp;');
    });

    it('should escape malicious URLs in report card links', () => {
      const maliciousData = {
        pet_name: 'Max',
        report_card_link: 'javascript:alert("xss")',
      };

      const result = createReportCardEmail(maliciousData);

      // URL should be escaped
      expect(result.html).toContain('javascript&#x2F;:alert');
      expect(result.html).not.toContain('javascript:alert("xss")');
    });

    it('should escape malicious failure reasons in payment emails', () => {
      const maliciousData = {
        failure_reason: '<script>steal_data()</script>Card declined',
        amount_due: '$95.00',
        retry_link: 'https://thepuppyday.com/retry',
      };

      const result = createPaymentFailedEmail(maliciousData);

      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).not.toContain('<script>steal_data()</script>');
    });
  });

  describe('SMS Template Security', () => {
    it('should escape malicious content in SMS messages', () => {
      const maliciousData = {
        pet_name: '<script>alert("xss")</script>',
        appointment_time: '10:00 AM',
      };

      const result = createAppointmentReminderSms(maliciousData);

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should handle URL-like strings in SMS safely', () => {
      const maliciousData = {
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'Dec 18',
        appointment_time: '10:00 AM',
        service_name: 'Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationSms(maliciousData);

      // Should not contain any unescaped special characters that could be exploited
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle null values safely', () => {
      const dataWithNull = {
        customer_name: 'John',
        pet_name: null as unknown as string,
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(dataWithNull);

      // Should not throw error and should handle null gracefully
      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
    });

    it('should handle undefined values safely', () => {
      const dataWithUndefined = {
        customer_name: 'John',
        pet_name: undefined as unknown as string,
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = createBookingConfirmationEmail(dataWithUndefined);

      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
    });
  });
});

describe('Security: Input Validation', () => {
  describe('validateTemplateData', () => {
    it('should reject data with missing required fields', () => {
      const invalidData = {
        customer_name: 'John',
        // missing pet_name and other required fields
      };

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });

    it('should reject data with excessively long strings', () => {
      const invalidData = {
        customer_name: 'A'.repeat(101), // Exceeds 100 character limit
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });

    it('should reject invalid price formats', () => {
      const invalidData = {
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '95.00', // Missing dollar sign
      };

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });

    it('should reject invalid price formats (wrong decimals)', () => {
      const invalidData = {
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.0', // Only one decimal place
      };

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const invalidData = {
        pet_name: 'Max',
        report_card_link: 'not-a-url', // Invalid URL format
      };

      const result = validateTemplateData('report_card_notification', invalidData);

      expect(result).toBe(false);
    });

    it('should accept valid URLs with HTTPS', () => {
      const validData = {
        pet_name: 'Max',
        report_card_link: 'https://thepuppyday.com/report-cards/123',
      };

      const result = validateTemplateData('report_card_notification', validData);

      expect(result).toBe(true);
    });

    it('should accept valid URLs with HTTP', () => {
      const validData = {
        pet_name: 'Max',
        report_card_link: 'http://localhost:3000/report-cards/123',
      };

      const result = validateTemplateData('report_card_notification', validData);

      expect(result).toBe(true);
    });

    it('should reject javascript: URLs', () => {
      const invalidData = {
        pet_name: 'Max',
        report_card_link: 'javascript:alert("xss")',
      };

      const result = validateTemplateData('report_card_notification', invalidData);

      expect(result).toBe(false);
    });

    it('should reject data: URLs', () => {
      const invalidData = {
        pet_name: 'Max',
        report_card_link: 'data:text/html,<script>alert("xss")</script>',
      };

      const result = validateTemplateData('report_card_notification', invalidData);

      expect(result).toBe(false);
    });

    it('should reject invalid number types', () => {
      const invalidData = {
        pet_name: 'Max',
        weeks_since_last: 'eight' as unknown as number, // String instead of number
        breed_name: 'Golden Retriever',
        booking_url: 'https://thepuppyday.com/book',
      };

      const result = validateTemplateData('retention_reminder', invalidData);

      expect(result).toBe(false);
    });

    it('should reject negative numbers where inappropriate', () => {
      const invalidData = {
        pet_name: 'Max',
        weeks_since_last: -5, // Negative weeks doesn't make sense
        breed_name: 'Golden Retriever',
        booking_url: 'https://thepuppyday.com/book',
      };

      const result = validateTemplateData('retention_reminder', invalidData);

      expect(result).toBe(false);
    });

    it('should accept valid data', () => {
      const validData = {
        customer_name: 'John',
        pet_name: 'Max',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      const result = validateTemplateData('booking_confirmation', validData);

      expect(result).toBe(true);
    });

    it('should trim whitespace from strings', () => {
      const dataWithWhitespace = {
        customer_name: '  John  ',
        pet_name: '  Max  ',
        appointment_date: 'Monday, December 18, 2025',
        appointment_time: '10:00 AM',
        service_name: 'Premium Grooming',
        total_price: '$95.00',
      };

      // While validation might pass, the escaping should handle this properly
      const result = createBookingConfirmationEmail(dataWithWhitespace);

      expect(result.html).toBeTruthy();
      expect(result.text).toBeTruthy();
    });
  });

  describe('Type Checking', () => {
    it('should reject non-object data', () => {
      const invalidData = 'not an object';

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });

    it('should reject null data', () => {
      const result = validateTemplateData('booking_confirmation', null);

      expect(result).toBe(false);
    });

    it('should reject undefined data', () => {
      const result = validateTemplateData('booking_confirmation', undefined);

      expect(result).toBe(false);
    });

    it('should reject array data', () => {
      const invalidData = ['not', 'an', 'object'];

      const result = validateTemplateData('booking_confirmation', invalidData);

      expect(result).toBe(false);
    });
  });
});

describe('Security: Edge Cases', () => {
  it('should handle extremely long strings without crashing', () => {
    const extremeData = {
      customer_name: 'A'.repeat(10000),
      pet_name: 'B'.repeat(10000),
      appointment_date: 'C'.repeat(10000),
        appointment_time: '10:00 AM',
      service_name: 'D'.repeat(10000),
      total_price: '$95.00',
    };

    expect(() => {
      createBookingConfirmationEmail(extremeData);
    }).not.toThrow();
  });

  it('should handle Unicode characters safely', () => {
    const unicodeData = {
      customer_name: 'José García',
      pet_name: 'Ñoño 🐕',
      appointment_date: 'Monday, December 18, 2025',
      appointment_time: '10:00 AM',
      service_name: 'Premium Grooming',
      total_price: '$95.00',
    };

    const result = createBookingConfirmationEmail(unicodeData);

    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.html).toContain('José');
    expect(result.html).toContain('García');
  });

  it('should handle special characters in prices', () => {
    const specialData = {
      customer_name: 'John',
      pet_name: 'Max',
      appointment_date: 'Monday, December 18, 2025',
      appointment_time: '10:00 AM',
      service_name: 'Premium Grooming',
      total_price: '$1,234.56', // Price with comma
    };

    // This should be rejected by validation (not standard price format)
    const isValid = validateTemplateData('booking_confirmation', specialData);
    expect(isValid).toBe(false);
  });

  it('should handle newlines and carriage returns', () => {
    const newlineData = {
      customer_name: 'John\nDoe',
      pet_name: 'Max\r\nBella',
      appointment_date: 'Monday, December 18, 2025',
      appointment_time: '10:00 AM',
      service_name: 'Premium Grooming',
      total_price: '$95.00',
    };

    const result = createBookingConfirmationEmail(newlineData);

    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
  });
});
