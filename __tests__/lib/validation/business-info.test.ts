/**
 * Tests for Business Info Validation Schemas
 * Task 0216: Unit Tests for Validation Logic
 */

import { describe, it, expect } from 'vitest';
import {
  BusinessInfoSchema,
  phoneSchema,
  emailSchema,
  zipSchema,
  stateSchema,
  httpsUrlSchema,
  socialLinksSchema,
  type BusinessInfo,
  type SocialLinks,
} from '@/types/settings';

describe('Phone Number Validation', () => {
  describe('Valid phone numbers', () => {
    it('should accept US phone format (XXX) XXX-XXXX', () => {
      const validPhones = [
        '(657) 252-2903',
        '(555) 123-4567',
        '(800) 555-0000',
      ];

      validPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid phone numbers', () => {
    it('should reject missing parentheses', () => {
      const result = phoneSchema.safeParse('657 252-2903');
      expect(result.success).toBe(false);
    });

    it('should reject missing dash', () => {
      const result = phoneSchema.safeParse('(657) 2522903');
      expect(result.success).toBe(false);
    });

    it('should reject wrong digit count', () => {
      const invalidPhones = [
        '(65) 252-2903', // Too few area code digits
        '(657) 25-2903', // Too few exchange digits
        '(657) 252-290', // Too few line digits
      ];

      invalidPhones.forEach((phone) => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });

    it('should reject non-digit characters', () => {
      const result = phoneSchema.safeParse('(abc) def-ghij');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = phoneSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('Email Validation', () => {
  describe('Valid email addresses', () => {
    it('should accept standard email format', () => {
      const validEmails = [
        'puppyday14936@gmail.com',
        'admin@example.com',
        'contact@puppyday.com',
        'user.name@company.co.uk',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid email addresses', () => {
    it('should reject emails without @', () => {
      const result = emailSchema.safeParse('invalidemail.com');
      expect(result.success).toBe(false);
    });

    it('should reject emails without domain', () => {
      const result = emailSchema.safeParse('user@');
      expect(result.success).toBe(false);
    });

    it('should reject emails without local part', () => {
      const result = emailSchema.safeParse('@example.com');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('ZIP Code Validation', () => {
  describe('Valid ZIP codes', () => {
    it('should accept 5-digit ZIP codes', () => {
      const validZips = ['90638', '90210', '92101', '00000', '99999'];

      validZips.forEach((zip) => {
        const result = zipSchema.safeParse(zip);
        expect(result.success).toBe(true);
      });
    });

    it('should accept ZIP+4 format (5+4)', () => {
      const validZips = [
        '90638-1234',
        '90210-5678',
        '92101-0000',
        '00000-0000',
      ];

      validZips.forEach((zip) => {
        const result = zipSchema.safeParse(zip);
        expect(result.success).toBe(true);
      });
    });

    it('should accept actual La Mirada ZIP code', () => {
      const result = zipSchema.safeParse('90638');
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid ZIP codes', () => {
    it('should reject less than 5 digits', () => {
      const invalidZips = ['1234', '123', '12'];

      invalidZips.forEach((zip) => {
        const result = zipSchema.safeParse(zip);
        expect(result.success).toBe(false);
      });
    });

    it('should reject more than 9 digits', () => {
      const result = zipSchema.safeParse('90638-12345');
      expect(result.success).toBe(false);
    });

    it('should reject non-digit characters', () => {
      const invalidZips = ['9063a', 'abc-1234', '90638-abc1'];

      invalidZips.forEach((zip) => {
        const result = zipSchema.safeParse(zip);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid +4 format', () => {
      const invalidZips = [
        '90638-123', // Only 3 digits after dash
        '90638-12345', // Too many digits after dash
        '90638 1234', // Space instead of dash
      ];

      invalidZips.forEach((zip) => {
        const result = zipSchema.safeParse(zip);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty string', () => {
      const result = zipSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('State Code Validation', () => {
  describe('Valid state codes', () => {
    it('should accept valid 2-letter state codes', () => {
      const validStates = [
        'CA', // California
        'NY', // New York
        'TX', // Texas
        'FL', // Florida
      ];

      validStates.forEach((state) => {
        const result = stateSchema.safeParse(state);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid state codes', () => {
    it('should reject lowercase letters', () => {
      const result = stateSchema.safeParse('ca');
      expect(result.success).toBe(false);
    });

    it('should reject less than 2 characters', () => {
      const result = stateSchema.safeParse('C');
      expect(result.success).toBe(false);
    });

    it('should reject more than 2 characters', () => {
      const result = stateSchema.safeParse('CAL');
      expect(result.success).toBe(false);
    });

    it('should reject numeric characters', () => {
      const invalidStates = ['C1', '12', '1A'];

      invalidStates.forEach((state) => {
        const result = stateSchema.safeParse(state);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty string', () => {
      const result = stateSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('HTTPS URL Validation', () => {
  describe('Valid URLs', () => {
    it('should accept valid HTTPS URLs', () => {
      const validUrls = [
        'https://instagram.com/puppyday_lm',
        'https://www.facebook.com/puppyday',
        'https://yelp.com/biz/puppy-day',
      ];

      validUrls.forEach((url) => {
        const result = httpsUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should accept empty string (optional)', () => {
      const result = httpsUrlSchema.safeParse('');
      expect(result.success).toBe(true);
    });

    it('should accept undefined (optional)', () => {
      const result = httpsUrlSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    it('should reject HTTP URLs', () => {
      const result = httpsUrlSchema.safeParse('http://instagram.com/puppyday_lm');
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL formats', () => {
      const result = httpsUrlSchema.safeParse('not-a-url');
      expect(result.success).toBe(false);
    });

    it('should reject FTP and other protocols', () => {
      const invalidUrls = [
        'ftp://example.com',
        'file:///path',
        'mailto:email@example.com',
      ];

      invalidUrls.forEach((url) => {
        const result = httpsUrlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('Social Links Validation', () => {
  describe('Valid social links', () => {
    it('should accept all valid social links', () => {
      const socialLinks: SocialLinks = {
        instagram: 'https://instagram.com/puppyday_lm',
        facebook: 'https://facebook.com/puppyday',
        yelp: 'https://yelp.com/biz/puppy-day',
        twitter: 'https://twitter.com/puppyday',
      };

      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(true);
    });

    it('should accept partial social links (optional fields)', () => {
      const socialLinks: SocialLinks = {
        instagram: 'https://instagram.com/puppyday_lm',
        yelp: 'https://yelp.com/biz/puppy-day',
      };

      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const socialLinks: SocialLinks = {};

      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid social links', () => {
    it('should reject HTTP URLs for social links', () => {
      const socialLinks = {
        instagram: 'http://instagram.com/puppyday_lm',
      };

      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const socialLinks = {
        facebook: 'not-a-url',
      };

      const result = socialLinksSchema.safeParse(socialLinks);
      expect(result.success).toBe(false);
    });
  });
});

describe('Business Info Validation Schema', () => {
  describe('Valid business info', () => {
    it('should accept complete valid business info', () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: '14936 Leffingwell Rd',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'puppyday14936@gmail.com',
        social_links: {
          instagram: 'https://instagram.com/puppyday_lm',
          facebook: 'https://facebook.com/puppyday',
          yelp: 'https://yelp.com/biz/puppy-day',
        },
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });

    it('should accept with minimal social links', () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: '14936 Leffingwell Rd',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'puppyday14936@gmail.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });

    it('should accept with ZIP+4 format', () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: '14936 Leffingwell Rd',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638-1234',
        phone: '(657) 252-2903',
        email: 'puppyday14936@gmail.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });
  });

  describe('Business name validation', () => {
    it('should accept names up to 100 characters', () => {
      const businessInfo: BusinessInfo = {
        name: 'a'.repeat(100),
        address: 'Street',
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const businessInfo = {
        name: '',
        address: 'Street',
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 100 characters', () => {
      const businessInfo = {
        name: 'a'.repeat(101),
        address: 'Street',
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });
  });

  describe('Address validation', () => {
    it('should accept addresses up to 200 characters', () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: 'a'.repeat(200),
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });

    it('should reject empty address', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: '',
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should reject address exceeding 200 characters', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'a'.repeat(201),
        city: 'City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });
  });

  describe('City validation', () => {
    it('should accept cities up to 100 characters', () => {
      const businessInfo: BusinessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'a'.repeat(100),
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });

    it('should reject empty city', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: '',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should reject city exceeding 100 characters', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'a'.repeat(101),
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });
  });

  describe('Cross-field validation', () => {
    it('should reject when required fields are missing', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'CA',
        // Missing zip
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should validate all fields together', () => {
      const businessInfo: BusinessInfo = {
        name: 'Valid Business',
        address: 'Valid Street Address',
        city: 'Valid City',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'business@example.com',
        social_links: {
          instagram: 'https://instagram.com/business',
        },
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(true);
    });
  });

  describe('Field-specific validation errors', () => {
    it('should identify invalid phone in business info', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: 'invalid-phone',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should identify invalid email in business info', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'not-an-email',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should identify invalid ZIP in business info', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'CA',
        zip: '9063',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should identify invalid state in business info', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'California',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {},
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });

    it('should identify invalid social links in business info', () => {
      const businessInfo = {
        name: 'Puppy Day',
        address: 'Street',
        city: 'La Mirada',
        state: 'CA',
        zip: '90638',
        phone: '(657) 252-2903',
        email: 'test@example.com',
        social_links: {
          facebook: 'http://facebook.com/invalid', // HTTP not allowed
        },
      };

      const result = BusinessInfoSchema.safeParse(businessInfo);
      expect(result.success).toBe(false);
    });
  });
});
