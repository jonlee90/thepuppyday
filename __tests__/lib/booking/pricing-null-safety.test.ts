/**
 * Tests for null safety in pricing utilities
 * Ensures calculatePrice handles undefined/null addons gracefully
 */

import {
  calculatePrice,
  calculateAddonsTotal,
  calculateTotal,
  getServicePriceRange,
} from '@/lib/booking/pricing';
import type { ServiceWithPrices, Addon, PetSize } from '@/types/database';

describe('Pricing Utilities - Null Safety', () => {
  const mockService: ServiceWithPrices = {
    id: 'service-1',
    name: 'Basic Grooming',
    description: 'Standard grooming service',
    duration_minutes: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    prices: [
      { service_id: 'service-1', size: 'small', price: 40, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { service_id: 'service-1', size: 'medium', price: 60, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { service_id: 'service-1', size: 'large', price: 80, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { service_id: 'service-1', size: 'xlarge', price: 100, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
  };

  const mockAddons: Addon[] = [
    {
      id: 'addon-1',
      name: 'Nail Trim',
      description: 'Nail trimming service',
      price: 10,
      duration_minutes: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'addon-2',
      name: 'Teeth Brushing',
      description: 'Dental hygiene service',
      price: 15,
      duration_minutes: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  describe('calculateAddonsTotal', () => {
    it('should return 0 for null addons', () => {
      expect(calculateAddonsTotal(null)).toBe(0);
    });

    it('should return 0 for undefined addons', () => {
      expect(calculateAddonsTotal(undefined)).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAddonsTotal([])).toBe(0);
    });

    it('should calculate total for valid addons', () => {
      expect(calculateAddonsTotal(mockAddons)).toBe(25); // 10 + 15
    });

    it('should handle single addon', () => {
      expect(calculateAddonsTotal([mockAddons[0]])).toBe(10);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total with null addons', () => {
      expect(calculateTotal(50, null)).toBe(50);
    });

    it('should calculate total with undefined addons', () => {
      expect(calculateTotal(50, undefined)).toBe(50);
    });

    it('should calculate total with empty addons', () => {
      expect(calculateTotal(50, [])).toBe(50);
    });

    it('should calculate total with valid addons', () => {
      expect(calculateTotal(50, mockAddons)).toBe(75); // 50 + 25
    });
  });

  describe('calculatePrice', () => {
    it('should handle null addons', () => {
      const result = calculatePrice(mockService, 'small', null);

      expect(result.servicePrice).toBe(40);
      expect(result.addonsTotal).toBe(0);
      expect(result.addons).toEqual([]);
      expect(result.total).toBe(40);
    });

    it('should handle undefined addons', () => {
      const result = calculatePrice(mockService, 'medium', undefined);

      expect(result.servicePrice).toBe(60);
      expect(result.addonsTotal).toBe(0);
      expect(result.addons).toEqual([]);
      expect(result.total).toBe(60);
    });

    it('should handle empty addons array', () => {
      const result = calculatePrice(mockService, 'large', []);

      expect(result.servicePrice).toBe(80);
      expect(result.addonsTotal).toBe(0);
      expect(result.addons).toEqual([]);
      expect(result.total).toBe(80);
    });

    it('should calculate correctly with valid addons', () => {
      const result = calculatePrice(mockService, 'xlarge', mockAddons);

      expect(result.servicePrice).toBe(100);
      expect(result.addonsTotal).toBe(25);
      expect(result.addons).toHaveLength(2);
      expect(result.addons[0]).toEqual({ name: 'Nail Trim', price: 10 });
      expect(result.addons[1]).toEqual({ name: 'Teeth Brushing', price: 15 });
      expect(result.total).toBe(125);
    });

    it('should handle null service gracefully', () => {
      const result = calculatePrice(null, null, mockAddons);

      expect(result.servicePrice).toBe(0);
      expect(result.serviceName).toBe('');
      expect(result.addonsTotal).toBe(25);
      expect(result.total).toBe(25);
    });

    it('should handle all null parameters', () => {
      const result = calculatePrice(null, null, null);

      expect(result.servicePrice).toBe(0);
      expect(result.serviceName).toBe('');
      expect(result.addonsTotal).toBe(0);
      expect(result.addons).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should include tax when settings provided', () => {
      const result = calculatePrice(mockService, 'small', mockAddons, {
        taxRate: 0.0875, // 8.75%
      });

      const expectedSubtotal = 40 + 25; // 65
      const expectedTax = Math.round(expectedSubtotal * 0.0875 * 100) / 100; // 5.69

      expect(result.subtotal).toBe(65);
      expect(result.tax).toBe(expectedTax);
      expect(result.total).toBe(65 + expectedTax);
    });

    it('should calculate deposit when enabled', () => {
      const result = calculatePrice(mockService, 'medium', [], {
        depositEnabled: true,
        depositPercentage: 0.25, // 25%
      });

      const expectedDeposit = Math.round(60 * 0.25 * 100) / 100; // 15.00

      expect(result.total).toBe(60);
      expect(result.deposit).toBe(expectedDeposit);
    });
  });

  describe('getServicePriceRange', () => {
    it('should handle service with no prices array', () => {
      const serviceWithoutPrices = {
        ...mockService,
        prices: null as any,
      };

      const result = getServicePriceRange(serviceWithoutPrices);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.formatted).toBe('$0');
    });

    it('should handle service with empty prices array', () => {
      const serviceWithEmptyPrices = {
        ...mockService,
        prices: [],
      };

      const result = getServicePriceRange(serviceWithEmptyPrices);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.formatted).toBe('$0');
    });

    it('should calculate range for valid prices', () => {
      const result = getServicePriceRange(mockService);

      expect(result.min).toBe(40);
      expect(result.max).toBe(100);
      expect(result.formatted).toBe('$40.00 - $100.00');
    });

    it('should handle single price', () => {
      const singlePriceService: ServiceWithPrices = {
        ...mockService,
        prices: [
          { service_id: 'service-1', size: 'small', price: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      };

      const result = getServicePriceRange(singlePriceService);

      expect(result.min).toBe(50);
      expect(result.max).toBe(50);
      expect(result.formatted).toBe('$50.00');
    });

    it('should handle non-array prices gracefully', () => {
      const invalidService = {
        ...mockService,
        prices: 'not-an-array' as any,
      };

      const result = getServicePriceRange(invalidService);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.formatted).toBe('$0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle addon with zero price', () => {
      const freeAddon: Addon = {
        id: 'addon-free',
        name: 'Free Sample',
        description: 'Complimentary service',
        price: 0,
        duration_minutes: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = calculatePrice(mockService, 'small', [freeAddon]);

      expect(result.servicePrice).toBe(40);
      expect(result.addonsTotal).toBe(0);
      expect(result.total).toBe(40);
    });

    it('should handle negative prices (should not happen but defensive)', () => {
      const negativeAddon: Addon = {
        ...mockAddons[0],
        price: -10, // Invalid but testing defensive code
      };

      const result = calculatePrice(mockService, 'small', [negativeAddon]);

      expect(result.addonsTotal).toBe(-10);
      expect(result.total).toBe(30); // 40 - 10
    });

    it('should handle very large addon arrays', () => {
      const manyAddons = Array(100).fill(null).map((_, i) => ({
        ...mockAddons[0],
        id: `addon-${i}`,
        name: `Addon ${i}`,
        price: 5,
      }));

      const result = calculatePrice(mockService, 'small', manyAddons);

      expect(result.addonsTotal).toBe(500); // 100 * 5
      expect(result.addons).toHaveLength(100);
      expect(result.total).toBe(540); // 40 + 500
    });
  });
});
