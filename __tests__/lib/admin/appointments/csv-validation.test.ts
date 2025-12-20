/**
 * Unit tests for CSV validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseCSVDateTime,
  normalizePaymentStatus,
  normalizePetSize,
  validateWeightForSize,
  parseCustomerName,
  parseAddons,
  sanitizeCSVValue,
  parseAmountPaid,
  normalizePaymentMethod,
} from '@/lib/admin/appointments/csv-validation';

describe('CSV Validation Utilities', () => {
  describe('parseCSVDateTime', () => {
    it('should parse YYYY-MM-DD and HH:MM format', () => {
      const result = parseCSVDateTime('2025-12-15', '11:00');
      expect(result).toBeTruthy();
      expect(new Date(result!).getHours()).toBe(11);
      expect(new Date(result!).getMinutes()).toBe(0);
    });

    it('should parse YYYY-MM-DD and HH:MM AM/PM format', () => {
      const result = parseCSVDateTime('2025-12-15', '2:30 PM');
      expect(result).toBeTruthy();
      expect(new Date(result!).getHours()).toBe(14);
      expect(new Date(result!).getMinutes()).toBe(30);
    });

    it('should parse MM/DD/YYYY and HH:MM AM/PM format', () => {
      const result = parseCSVDateTime('12/15/2025', '11:00 AM');
      expect(result).toBeTruthy();
      expect(new Date(result!).getHours()).toBe(11);
    });

    it('should handle 12:00 PM correctly', () => {
      const result = parseCSVDateTime('2025-12-15', '12:00 PM');
      expect(result).toBeTruthy();
      expect(new Date(result!).getHours()).toBe(12);
    });

    it('should handle 12:00 AM correctly', () => {
      const result = parseCSVDateTime('2025-12-15', '12:00 AM');
      expect(result).toBeTruthy();
      expect(new Date(result!).getHours()).toBe(0);
    });

    it('should return null for invalid date format', () => {
      const result = parseCSVDateTime('invalid-date', '11:00');
      expect(result).toBeNull();
    });

    it('should return null for invalid time format', () => {
      const result = parseCSVDateTime('2025-12-15', 'invalid-time');
      expect(result).toBeNull();
    });
  });

  describe('normalizePaymentStatus', () => {
    it('should normalize "pending" variations', () => {
      expect(normalizePaymentStatus('Pending')).toBe('pending');
      expect(normalizePaymentStatus('PENDING')).toBe('pending');
      expect(normalizePaymentStatus('pending')).toBe('pending');
    });

    it('should normalize "paid" variations', () => {
      expect(normalizePaymentStatus('Paid')).toBe('paid');
      expect(normalizePaymentStatus('PAID')).toBe('paid');
    });

    it('should normalize "partially paid" variations', () => {
      expect(normalizePaymentStatus('Partially Paid')).toBe('deposit_paid');
      expect(normalizePaymentStatus('partially_paid')).toBe('deposit_paid');
      expect(normalizePaymentStatus('Deposit Paid')).toBe('deposit_paid');
      expect(normalizePaymentStatus('deposit')).toBe('deposit_paid');
    });

    it('should default to "pending" for undefined', () => {
      expect(normalizePaymentStatus(undefined)).toBe('pending');
    });

    it('should default to "pending" for unknown values', () => {
      expect(normalizePaymentStatus('unknown')).toBe('pending');
    });
  });

  describe('normalizePetSize', () => {
    it('should normalize "small" variations', () => {
      expect(normalizePetSize('Small')).toBe('small');
      expect(normalizePetSize('SMALL')).toBe('small');
      expect(normalizePetSize('S')).toBe('small');
    });

    it('should normalize "medium" variations', () => {
      expect(normalizePetSize('Medium')).toBe('medium');
      expect(normalizePetSize('Med')).toBe('medium');
      expect(normalizePetSize('M')).toBe('medium');
    });

    it('should normalize "large" variations', () => {
      expect(normalizePetSize('Large')).toBe('large');
      expect(normalizePetSize('L')).toBe('large');
      expect(normalizePetSize('Lge')).toBe('large');
    });

    it('should normalize "xlarge" variations', () => {
      expect(normalizePetSize('X-Large')).toBe('xlarge');
      expect(normalizePetSize('XLarge')).toBe('xlarge');
      expect(normalizePetSize('XL')).toBe('xlarge');
      expect(normalizePetSize('XXL')).toBe('xlarge');
    });

    it('should return null for invalid sizes', () => {
      expect(normalizePetSize('invalid')).toBeNull();
      expect(normalizePetSize('tiny')).toBeNull();
    });
  });

  describe('validateWeightForSize', () => {
    it('should validate weight in correct range for small', () => {
      const result = validateWeightForSize(15, 'small');
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should return warning for weight outside small range', () => {
      const result = validateWeightForSize(25, 'small');
      expect(result.isValid).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.warning?.severity).toBe('warning');
    });

    it('should validate weight for medium range', () => {
      const result = validateWeightForSize(30, 'medium');
      expect(result.isValid).toBe(true);
    });

    it('should validate weight for large range', () => {
      const result = validateWeightForSize(50, 'large');
      expect(result.isValid).toBe(true);
    });

    it('should validate weight for xlarge range', () => {
      const result = validateWeightForSize(70, 'xlarge');
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseCustomerName', () => {
    it('should parse first and last name', () => {
      const result = parseCustomerName('John Smith');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Smith');
    });

    it('should handle multiple last names', () => {
      const result = parseCustomerName('John Paul Smith');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Paul Smith');
    });

    it('should handle single name', () => {
      const result = parseCustomerName('Madonna');
      expect(result.first_name).toBe('Madonna');
      expect(result.last_name).toBe('Madonna');
    });

    it('should handle extra whitespace', () => {
      const result = parseCustomerName('  John   Smith  ');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Smith');
    });
  });

  describe('parseAddons', () => {
    it('should parse comma-separated addons', () => {
      const result = parseAddons('Pawdicure, Teeth Brushing, Flea Treatment');
      expect(result).toEqual(['Pawdicure', 'Teeth Brushing', 'Flea Treatment']);
    });

    it('should handle empty string', () => {
      const result = parseAddons('');
      expect(result).toEqual([]);
    });

    it('should handle undefined', () => {
      const result = parseAddons(undefined);
      expect(result).toEqual([]);
    });

    it('should trim addon names', () => {
      const result = parseAddons('  Pawdicure  ,  Teeth Brushing  ');
      expect(result).toEqual(['Pawdicure', 'Teeth Brushing']);
    });

    it('should filter empty entries', () => {
      const result = parseAddons('Pawdicure,,Teeth Brushing,');
      expect(result).toEqual(['Pawdicure', 'Teeth Brushing']);
    });
  });

  describe('sanitizeCSVValue', () => {
    it('should remove leading = character', () => {
      expect(sanitizeCSVValue('=SUM(A1:A10)')).toBe('SUM(A1:A10)');
    });

    it('should remove leading @ character', () => {
      expect(sanitizeCSVValue('@IMPORTXML')).toBe('IMPORTXML');
    });

    it('should remove leading + character', () => {
      expect(sanitizeCSVValue('+123')).toBe('123');
    });

    it('should remove leading - character', () => {
      expect(sanitizeCSVValue('-123')).toBe('123');
    });

    it('should not modify safe values', () => {
      expect(sanitizeCSVValue('Normal text')).toBe('Normal text');
      expect(sanitizeCSVValue('email@example.com')).toBe('email@example.com');
    });
  });

  describe('parseAmountPaid', () => {
    it('should parse decimal amounts', () => {
      expect(parseAmountPaid('42.50')).toBe(42.50);
      expect(parseAmountPaid('100.00')).toBe(100.00);
    });

    it('should remove currency symbols', () => {
      expect(parseAmountPaid('$42.50')).toBe(42.50);
    });

    it('should remove commas', () => {
      expect(parseAmountPaid('1,234.56')).toBe(1234.56);
    });

    it('should return null for invalid amounts', () => {
      expect(parseAmountPaid('invalid')).toBeNull();
      expect(parseAmountPaid('abc')).toBeNull();
    });

    it('should return null for negative amounts', () => {
      expect(parseAmountPaid('-10.00')).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(parseAmountPaid(undefined)).toBeNull();
    });

    it('should round to 2 decimal places', () => {
      expect(parseAmountPaid('42.999')).toBe(43.00);
    });
  });

  describe('normalizePaymentMethod', () => {
    it('should normalize "cash" variations', () => {
      expect(normalizePaymentMethod('Cash')).toBe('cash');
      expect(normalizePaymentMethod('CASH')).toBe('cash');
    });

    it('should normalize "card" variations', () => {
      expect(normalizePaymentMethod('Card')).toBe('card');
      expect(normalizePaymentMethod('Credit Card')).toBe('card');
      expect(normalizePaymentMethod('Debit')).toBe('card');
    });

    it('should default to "other" for unknown values', () => {
      expect(normalizePaymentMethod('Check')).toBe('other');
      expect(normalizePaymentMethod('Venmo')).toBe('other');
    });

    it('should return undefined for undefined input', () => {
      expect(normalizePaymentMethod(undefined)).toBeUndefined();
    });
  });
});
