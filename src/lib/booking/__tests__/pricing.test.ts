/**
 * Unit tests for booking pricing utilities
 */

import { describe, it, expect } from 'vitest';
import type { ServiceWithPrices, Addon, PetSize } from '@/types/database';
import {
  SIZE_WEIGHT_RANGES,
  getServicePriceForSize,
  getServicePriceRange,
  calculateAddonsTotal,
  calculatePrice,
  formatCurrency,
  getSizeLabel,
  getSizeShortLabel,
  getSizeFromWeight,
  determineSizeFromWeight,
  calculateTotal,
  formatDuration,
  type PriceBreakdown,
  type PricingSettings,
} from '../pricing';

describe('pricing utilities', () => {
  // Mock data
  const mockService: ServiceWithPrices = {
    id: '123',
    created_at: '2024-01-01',
    name: 'Basic Grooming',
    description: 'Full grooming service',
    image_url: null,
    duration_minutes: 60,
    is_active: true,
    display_order: 1,
    prices: [
      { id: '1', service_id: '123', size: 'small', price: 40 },
      { id: '2', service_id: '123', size: 'medium', price: 55 },
      { id: '3', service_id: '123', size: 'large', price: 70 },
      { id: '4', service_id: '123', size: 'xlarge', price: 85 },
    ],
  };

  const mockAddons: Addon[] = [
    {
      id: '1',
      created_at: '2024-01-01',
      name: 'Teeth Brushing',
      description: 'Professional teeth brushing',
      price: 10,
      upsell_prompt: null,
      upsell_breeds: [],
      is_active: true,
      display_order: 1,
    },
    {
      id: '2',
      created_at: '2024-01-01',
      name: 'Pawdicure',
      description: 'Nail care',
      price: 15,
      upsell_prompt: null,
      upsell_breeds: [],
      is_active: true,
      display_order: 2,
    },
  ];

  describe('SIZE_WEIGHT_RANGES', () => {
    it('should define correct weight ranges for all sizes', () => {
      expect(SIZE_WEIGHT_RANGES.small).toEqual({ min: 0, max: 18 });
      expect(SIZE_WEIGHT_RANGES.medium).toEqual({ min: 19, max: 35 });
      expect(SIZE_WEIGHT_RANGES.large).toEqual({ min: 36, max: 65 });
      expect(SIZE_WEIGHT_RANGES.xlarge).toEqual({ min: 66, max: Infinity });
    });
  });

  describe('getServicePriceForSize', () => {
    it('should return correct price for small size', () => {
      expect(getServicePriceForSize(mockService, 'small')).toBe(40);
    });

    it('should return correct price for medium size', () => {
      expect(getServicePriceForSize(mockService, 'medium')).toBe(55);
    });

    it('should return correct price for large size', () => {
      expect(getServicePriceForSize(mockService, 'large')).toBe(70);
    });

    it('should return correct price for xlarge size', () => {
      expect(getServicePriceForSize(mockService, 'xlarge')).toBe(85);
    });

    it('should return 0 if size not found', () => {
      const serviceWithoutPrices: ServiceWithPrices = {
        ...mockService,
        prices: [],
      };
      expect(getServicePriceForSize(serviceWithoutPrices, 'small')).toBe(0);
    });

    it('should handle service with undefined prices array', () => {
      const serviceWithoutPrices = {
        ...mockService,
        prices: undefined,
      } as ServiceWithPrices;
      expect(getServicePriceForSize(serviceWithoutPrices, 'small')).toBe(0);
    });
  });

  describe('getServicePriceRange', () => {
    it('should return correct min-max range for service with multiple prices', () => {
      const result = getServicePriceRange(mockService);
      expect(result.min).toBe(40);
      expect(result.max).toBe(85);
      expect(result.formatted).toBe('$40.00 - $85.00');
    });

    it('should return single price when all prices are the same', () => {
      const singlePriceService: ServiceWithPrices = {
        ...mockService,
        prices: [
          { id: '1', service_id: '123', size: 'small', price: 50 },
          { id: '2', service_id: '123', size: 'medium', price: 50 },
        ],
      };
      const result = getServicePriceRange(singlePriceService);
      expect(result.min).toBe(50);
      expect(result.max).toBe(50);
      expect(result.formatted).toBe('$50.00');
    });

    it('should return $0 for service with no prices', () => {
      const noPriceService: ServiceWithPrices = {
        ...mockService,
        prices: [],
      };
      const result = getServicePriceRange(noPriceService);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.formatted).toBe('$0');
    });

    it('should handle undefined prices array', () => {
      const undefinedPriceService = {
        ...mockService,
        prices: undefined,
      } as ServiceWithPrices;
      const result = getServicePriceRange(undefinedPriceService);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.formatted).toBe('$0');
    });
  });

  describe('calculateAddonsTotal', () => {
    it('should sum up addon prices correctly', () => {
      expect(calculateAddonsTotal(mockAddons)).toBe(25);
    });

    it('should return 0 for empty addons array', () => {
      expect(calculateAddonsTotal([])).toBe(0);
    });

    it('should handle single addon', () => {
      expect(calculateAddonsTotal([mockAddons[0]])).toBe(10);
    });

    it('should handle addons with zero price', () => {
      const addonsWithZero = [
        ...mockAddons,
        { ...mockAddons[0], id: '3', price: 0 },
      ];
      expect(calculateAddonsTotal(addonsWithZero)).toBe(25);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate full price breakdown correctly', () => {
      const result = calculatePrice(mockService, 'medium', mockAddons);

      expect(result.serviceName).toBe('Basic Grooming');
      expect(result.servicePrice).toBe(55);
      expect(result.addons).toHaveLength(2);
      expect(result.addons[0]).toEqual({ name: 'Teeth Brushing', price: 10 });
      expect(result.addons[1]).toEqual({ name: 'Pawdicure', price: 15 });
      expect(result.addonsTotal).toBe(25);
      expect(result.subtotal).toBe(80);
      expect(result.tax).toBe(0);
      expect(result.deposit).toBe(0);
      expect(result.total).toBe(80);
    });

    it('should calculate tax when tax rate is provided', () => {
      const settings: PricingSettings = { taxRate: 0.0875 }; // 8.75%
      const result = calculatePrice(mockService, 'small', [], settings);

      expect(result.servicePrice).toBe(40);
      expect(result.subtotal).toBe(40);
      expect(result.tax).toBe(3.5); // 40 * 0.0875
      expect(result.total).toBe(43.5);
    });

    it('should calculate deposit when enabled', () => {
      const settings: PricingSettings = {
        depositEnabled: true,
        depositPercentage: 0.25, // 25%
      };
      const result = calculatePrice(mockService, 'large', [], settings);

      expect(result.total).toBe(70);
      expect(result.deposit).toBe(17.5); // 70 * 0.25
    });

    it('should calculate tax and deposit together', () => {
      const settings: PricingSettings = {
        taxRate: 0.1, // 10%
        depositEnabled: true,
        depositPercentage: 0.5, // 50%
      };
      const result = calculatePrice(mockService, 'small', mockAddons, settings);

      expect(result.subtotal).toBe(65); // 40 + 25
      expect(result.tax).toBe(6.5); // 65 * 0.1
      expect(result.total).toBe(71.5); // 65 + 6.5
      expect(result.deposit).toBe(35.75); // 71.5 * 0.5
    });

    it('should handle null service', () => {
      const result = calculatePrice(null, 'small', []);

      expect(result.serviceName).toBe('');
      expect(result.servicePrice).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle null pet size', () => {
      const result = calculatePrice(mockService, null, []);

      expect(result.serviceName).toBe('Basic Grooming');
      expect(result.servicePrice).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should not calculate deposit when depositEnabled is false', () => {
      const settings: PricingSettings = {
        depositEnabled: false,
        depositPercentage: 0.25,
      };
      const result = calculatePrice(mockService, 'small', [], settings);

      expect(result.deposit).toBe(0);
    });

    it('should round tax correctly to 2 decimal places', () => {
      const settings: PricingSettings = { taxRate: 0.08755 }; // Tax that would create more decimals
      const result = calculatePrice(mockService, 'small', [], settings);

      expect(result.tax).toBe(3.5); // Should be rounded
      expect(result.tax.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should round deposit correctly to 2 decimal places', () => {
      const settings: PricingSettings = {
        depositEnabled: true,
        depositPercentage: 0.333, // 33.3%
      };
      const result = calculatePrice(mockService, 'small', [], settings);

      expect(result.deposit.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total from service price and addons', () => {
      expect(calculateTotal(55, mockAddons)).toBe(80);
    });

    it('should handle zero service price', () => {
      expect(calculateTotal(0, mockAddons)).toBe(25);
    });

    it('should handle empty addons', () => {
      expect(calculateTotal(55, [])).toBe(55);
    });

    it('should handle zero values', () => {
      expect(calculateTotal(0, [])).toBe(0);
    });

    it('should handle negative service price', () => {
      expect(calculateTotal(-10, mockAddons)).toBe(15);
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers with 2 decimal places', () => {
      expect(formatCurrency(50)).toBe('$50.00');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatCurrency(49.99)).toBe('$49.99');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-25.5)).toBe('-$25.50');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00');
      expect(formatCurrency(10.001)).toBe('$10.00');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.001)).toBe('$0.00');
    });
  });

  describe('getSizeLabel', () => {
    it('should return correct label for small', () => {
      expect(getSizeLabel('small')).toBe('Small (0-18 lbs)');
    });

    it('should return correct label for medium', () => {
      expect(getSizeLabel('medium')).toBe('Medium (19-35 lbs)');
    });

    it('should return correct label for large', () => {
      expect(getSizeLabel('large')).toBe('Large (36-65 lbs)');
    });

    it('should return correct label for xlarge', () => {
      expect(getSizeLabel('xlarge')).toBe('X-Large (66+ lbs)');
    });
  });

  describe('getSizeShortLabel', () => {
    it('should return correct short label for small', () => {
      expect(getSizeShortLabel('small')).toBe('Small');
    });

    it('should return correct short label for medium', () => {
      expect(getSizeShortLabel('medium')).toBe('Medium');
    });

    it('should return correct short label for large', () => {
      expect(getSizeShortLabel('large')).toBe('Large');
    });

    it('should return correct short label for xlarge', () => {
      expect(getSizeShortLabel('xlarge')).toBe('X-Large');
    });
  });

  describe('getSizeFromWeight', () => {
    it('should return small for weight at lower boundary (0 lbs)', () => {
      expect(getSizeFromWeight(0)).toBe('small');
    });

    it('should return small for weight at upper boundary (18 lbs)', () => {
      expect(getSizeFromWeight(18)).toBe('small');
    });

    it('should return small for weight in middle of range', () => {
      expect(getSizeFromWeight(10)).toBe('small');
    });

    it('should return medium for weight at lower boundary (19 lbs)', () => {
      expect(getSizeFromWeight(19)).toBe('medium');
    });

    it('should return medium for weight at upper boundary (35 lbs)', () => {
      expect(getSizeFromWeight(35)).toBe('medium');
    });

    it('should return medium for weight in middle of range', () => {
      expect(getSizeFromWeight(25)).toBe('medium');
    });

    it('should return large for weight at lower boundary (36 lbs)', () => {
      expect(getSizeFromWeight(36)).toBe('large');
    });

    it('should return large for weight at upper boundary (65 lbs)', () => {
      expect(getSizeFromWeight(65)).toBe('large');
    });

    it('should return large for weight in middle of range', () => {
      expect(getSizeFromWeight(50)).toBe('large');
    });

    it('should return xlarge for weight at lower boundary (66 lbs)', () => {
      expect(getSizeFromWeight(66)).toBe('xlarge');
    });

    it('should return xlarge for very large weight', () => {
      expect(getSizeFromWeight(100)).toBe('xlarge');
      expect(getSizeFromWeight(200)).toBe('xlarge');
    });

    it('should handle decimal weights', () => {
      expect(getSizeFromWeight(18.5)).toBe('medium');
      expect(getSizeFromWeight(35.1)).toBe('large');
      expect(getSizeFromWeight(65.9)).toBe('xlarge');
    });

    it('should handle edge case of exactly at boundary', () => {
      expect(getSizeFromWeight(18.0)).toBe('small');
      expect(getSizeFromWeight(35.0)).toBe('medium');
      expect(getSizeFromWeight(65.0)).toBe('large');
    });
  });

  describe('determineSizeFromWeight', () => {
    it('should be an alias for getSizeFromWeight', () => {
      expect(determineSizeFromWeight).toBe(getSizeFromWeight);
    });

    it('should work identically to getSizeFromWeight', () => {
      expect(determineSizeFromWeight(10)).toBe('small');
      expect(determineSizeFromWeight(25)).toBe('medium');
      expect(determineSizeFromWeight(50)).toBe('large');
      expect(determineSizeFromWeight(100)).toBe('xlarge');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes less than 60', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(15)).toBe('15 min');
    });

    it('should format exact hours', () => {
      expect(formatDuration(60)).toBe('1 hour');
      expect(formatDuration(120)).toBe('2 hours');
      expect(formatDuration(180)).toBe('3 hours');
    });

    it('should format hours with remaining minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(75)).toBe('1h 15m');
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('should handle zero minutes', () => {
      expect(formatDuration(0)).toBe('0 min');
    });

    it('should handle single minute', () => {
      expect(formatDuration(1)).toBe('1 min');
    });

    it('should handle large durations', () => {
      expect(formatDuration(240)).toBe('4 hours');
      expect(formatDuration(245)).toBe('4h 5m');
    });

    it('should use plural "hours" for more than 1 hour', () => {
      expect(formatDuration(120)).toContain('hours');
      expect(formatDuration(180)).toContain('hours');
    });

    it('should use singular "hour" for exactly 1 hour', () => {
      expect(formatDuration(60)).toBe('1 hour');
    });
  });
});
