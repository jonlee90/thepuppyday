/**
 * Unit tests for general utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, calculateServicePrice } from './utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('inactive-class');
    });

    it('should filter out falsy values', () => {
      const result = cn('text-red-500', null, undefined, false, 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('should format decimal numbers', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(12.345)).toBe('$12.35');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
  });

  describe('calculateServicePrice', () => {
    it('should calculate price for small pet', () => {
      const prices = {
        small: 45,
        medium: 65,
        large: 85,
        xlarge: 115,
      };
      expect(calculateServicePrice(prices, 'small')).toBe(45);
    });

    it('should calculate price for medium pet', () => {
      const prices = {
        small: 45,
        medium: 65,
        large: 85,
        xlarge: 115,
      };
      expect(calculateServicePrice(prices, 'medium')).toBe(65);
    });

    it('should calculate price for large pet', () => {
      const prices = {
        small: 45,
        medium: 65,
        large: 85,
        xlarge: 115,
      };
      expect(calculateServicePrice(prices, 'large')).toBe(85);
    });

    it('should calculate price for xlarge pet', () => {
      const prices = {
        small: 45,
        medium: 65,
        large: 85,
        xlarge: 115,
      };
      expect(calculateServicePrice(prices, 'xlarge')).toBe(115);
    });

    it('should return 0 for invalid size', () => {
      const prices = {
        small: 45,
        medium: 65,
        large: 85,
        xlarge: 115,
      };
      expect(calculateServicePrice(prices, 'invalid' as any)).toBe(0);
    });
  });
});
