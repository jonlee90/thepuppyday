/**
 * Tests for walk-in customer placeholder email utilities
 */

import {
  WALKIN_EMAIL_DOMAIN,
  generateWalkinEmail,
  isWalkinPlaceholderEmail,
} from '@/lib/utils';

describe('Walk-in Email Utilities', () => {
  describe('WALKIN_EMAIL_DOMAIN', () => {
    it('should be a .local domain (non-routable)', () => {
      expect(WALKIN_EMAIL_DOMAIN).toMatch(/\.local$/);
    });

    it('should contain the business identifier', () => {
      expect(WALKIN_EMAIL_DOMAIN).toContain('thepuppyday');
    });
  });

  describe('generateWalkinEmail', () => {
    it('should generate a valid email format', () => {
      const email = generateWalkinEmail('+1-555-123-4567');
      expect(email).toMatch(/^walkin_\d+@[\w.]+\.local$/);
    });

    it('should normalize phone numbers by removing non-digits', () => {
      const email1 = generateWalkinEmail('+1-555-123-4567');
      const email2 = generateWalkinEmail('15551234567');
      const email3 = generateWalkinEmail('(555) 123-4567');

      // All should produce the same result (based on digits only)
      expect(email1).toBe(`walkin_15551234567@${WALKIN_EMAIL_DOMAIN}`);
      expect(email2).toBe(`walkin_15551234567@${WALKIN_EMAIL_DOMAIN}`);
      expect(email3).toBe(`walkin_5551234567@${WALKIN_EMAIL_DOMAIN}`);
    });

    it('should use the walk-in domain', () => {
      const email = generateWalkinEmail('5551234567');
      expect(email).toContain(`@${WALKIN_EMAIL_DOMAIN}`);
    });

    it('should handle various phone formats', () => {
      const testCases = [
        { input: '555-123-4567', expected: 'walkin_5551234567' },
        { input: '+1 (555) 123-4567', expected: 'walkin_15551234567' },
        { input: '555.123.4567', expected: 'walkin_5551234567' },
        { input: '5551234567', expected: 'walkin_5551234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        const email = generateWalkinEmail(input);
        expect(email).toBe(`${expected}@${WALKIN_EMAIL_DOMAIN}`);
      });
    });

    it('should handle edge case of empty string', () => {
      const email = generateWalkinEmail('');
      expect(email).toBe(`walkin_@${WALKIN_EMAIL_DOMAIN}`);
    });
  });

  describe('isWalkinPlaceholderEmail', () => {
    it('should return true for valid placeholder emails', () => {
      expect(isWalkinPlaceholderEmail(`walkin_5551234567@${WALKIN_EMAIL_DOMAIN}`)).toBe(true);
    });

    it('should return true for any email ending with the walk-in domain', () => {
      expect(isWalkinPlaceholderEmail(`anything@${WALKIN_EMAIL_DOMAIN}`)).toBe(true);
    });

    it('should return false for regular emails', () => {
      expect(isWalkinPlaceholderEmail('john.doe@gmail.com')).toBe(false);
      expect(isWalkinPlaceholderEmail('customer@thepuppyday.com')).toBe(false);
      expect(isWalkinPlaceholderEmail('walkin@other.local')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isWalkinPlaceholderEmail(null)).toBe(false);
      expect(isWalkinPlaceholderEmail(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isWalkinPlaceholderEmail('')).toBe(false);
    });

    it('should work with generated emails', () => {
      const generatedEmail = generateWalkinEmail('555-123-4567');
      expect(isWalkinPlaceholderEmail(generatedEmail)).toBe(true);
    });
  });

  describe('integration: generateWalkinEmail + isWalkinPlaceholderEmail', () => {
    it('should consistently identify generated emails as placeholders', () => {
      const phoneNumbers = [
        '555-123-4567',
        '+1-800-555-1234',
        '(310) 555-0199',
        '5551234567',
      ];

      phoneNumbers.forEach((phone) => {
        const email = generateWalkinEmail(phone);
        expect(isWalkinPlaceholderEmail(email)).toBe(true);
      });
    });
  });
});
