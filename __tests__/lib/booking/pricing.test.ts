/**
 * Unit tests for booking pricing utilities
 */

import {
  formatCurrency,
  formatDuration,
  getSizeLabel,
  getSizeShortLabel,
  getSizeFromWeight,
  getServicePriceForSize,
  getServicePriceRange,
  calculateAddonsTotal,
  calculatePrice,
} from '@/lib/booking/pricing';
import type { ServiceWithPrices, Addon, PetSize } from '@/types/database';

describe('formatCurrency', () => {
  it('formats whole numbers correctly', () => {
    expect(formatCurrency(50)).toBe('$50.00');
  });

  it('formats decimal numbers correctly', () => {
    expect(formatCurrency(49.99)).toBe('$49.99');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large numbers with proper formatting', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});

describe('formatDuration', () => {
  it('formats minutes under 60 as minutes only', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats exactly 60 minutes as 1 hour', () => {
    expect(formatDuration(60)).toBe('1 hour');
  });

  it('formats multiple hours correctly', () => {
    expect(formatDuration(120)).toBe('2 hours');
  });

  it('formats hours and minutes correctly', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(150)).toBe('2h 30m');
  });
});

describe('getSizeLabel', () => {
  it('returns correct label for small', () => {
    expect(getSizeLabel('small')).toBe('Small (0-18 lbs)');
  });

  it('returns correct label for medium', () => {
    expect(getSizeLabel('medium')).toBe('Medium (19-35 lbs)');
  });

  it('returns correct label for large', () => {
    expect(getSizeLabel('large')).toBe('Large (36-65 lbs)');
  });

  it('returns correct label for xlarge', () => {
    expect(getSizeLabel('xlarge')).toBe('X-Large (66+ lbs)');
  });
});

describe('getSizeShortLabel', () => {
  it('returns short label for each size', () => {
    expect(getSizeShortLabel('small')).toBe('Small');
    expect(getSizeShortLabel('medium')).toBe('Medium');
    expect(getSizeShortLabel('large')).toBe('Large');
    expect(getSizeShortLabel('xlarge')).toBe('X-Large');
  });
});

describe('getSizeFromWeight', () => {
  it('returns small for weights up to 18 lbs', () => {
    expect(getSizeFromWeight(0)).toBe('small');
    expect(getSizeFromWeight(10)).toBe('small');
    expect(getSizeFromWeight(18)).toBe('small');
  });

  it('returns medium for weights 19-35 lbs', () => {
    expect(getSizeFromWeight(19)).toBe('medium');
    expect(getSizeFromWeight(25)).toBe('medium');
    expect(getSizeFromWeight(35)).toBe('medium');
  });

  it('returns large for weights 36-65 lbs', () => {
    expect(getSizeFromWeight(36)).toBe('large');
    expect(getSizeFromWeight(50)).toBe('large');
    expect(getSizeFromWeight(65)).toBe('large');
  });

  it('returns xlarge for weights over 65 lbs', () => {
    expect(getSizeFromWeight(66)).toBe('xlarge');
    expect(getSizeFromWeight(100)).toBe('xlarge');
  });
});

describe('getServicePriceForSize', () => {
  const mockService: ServiceWithPrices = {
    id: '1',
    created_at: '2024-01-01',
    name: 'Basic Groom',
    description: 'Basic grooming service',
    duration_minutes: 60,
    is_active: true,
    display_order: 1,
    prices: [
      { id: '1', service_id: '1', size: 'small' as PetSize, price: 45, created_at: '2024-01-01' },
      { id: '2', service_id: '1', size: 'medium' as PetSize, price: 55, created_at: '2024-01-01' },
      { id: '3', service_id: '1', size: 'large' as PetSize, price: 65, created_at: '2024-01-01' },
      { id: '4', service_id: '1', size: 'xlarge' as PetSize, price: 85, created_at: '2024-01-01' },
    ],
  };

  it('returns correct price for each size', () => {
    expect(getServicePriceForSize(mockService, 'small')).toBe(45);
    expect(getServicePriceForSize(mockService, 'medium')).toBe(55);
    expect(getServicePriceForSize(mockService, 'large')).toBe(65);
    expect(getServicePriceForSize(mockService, 'xlarge')).toBe(85);
  });

  it('returns 0 if no prices defined', () => {
    const serviceWithoutPrices: ServiceWithPrices = {
      ...mockService,
      prices: undefined,
    };
    expect(getServicePriceForSize(serviceWithoutPrices, 'small')).toBe(0);
  });
});

describe('getServicePriceRange', () => {
  const mockService: ServiceWithPrices = {
    id: '1',
    created_at: '2024-01-01',
    name: 'Basic Groom',
    description: 'Basic grooming service',
    duration_minutes: 60,
    is_active: true,
    display_order: 1,
    prices: [
      { id: '1', service_id: '1', size: 'small' as PetSize, price: 45, created_at: '2024-01-01' },
      { id: '4', service_id: '1', size: 'xlarge' as PetSize, price: 85, created_at: '2024-01-01' },
    ],
  };

  it('returns min and max prices', () => {
    const range = getServicePriceRange(mockService);
    expect(range.min).toBe(45);
    expect(range.max).toBe(85);
  });

  it('returns formatted price range string', () => {
    const range = getServicePriceRange(mockService);
    expect(range.formatted).toBe('$45.00 - $85.00');
  });

  it('returns single price if all sizes same price', () => {
    const uniformService: ServiceWithPrices = {
      ...mockService,
      prices: [
        { id: '1', service_id: '1', size: 'small' as PetSize, price: 50, created_at: '2024-01-01' },
        { id: '2', service_id: '1', size: 'large' as PetSize, price: 50, created_at: '2024-01-01' },
      ],
    };
    const range = getServicePriceRange(uniformService);
    expect(range.formatted).toBe('$50.00');
  });
});

describe('calculateAddonsTotal', () => {
  it('calculates sum of addon prices', () => {
    const addons: Addon[] = [
      { id: '1', created_at: '2024-01-01', name: 'Addon 1', price: 10, is_active: true, display_order: 1, upsell_breeds: [] },
      { id: '2', created_at: '2024-01-01', name: 'Addon 2', price: 15, is_active: true, display_order: 2, upsell_breeds: [] },
      { id: '3', created_at: '2024-01-01', name: 'Addon 3', price: 20, is_active: true, display_order: 3, upsell_breeds: [] },
    ];
    expect(calculateAddonsTotal(addons)).toBe(45);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAddonsTotal([])).toBe(0);
  });
});

describe('calculatePrice', () => {
  const mockService: ServiceWithPrices = {
    id: '1',
    created_at: '2024-01-01',
    name: 'Basic Groom',
    description: 'Basic grooming service',
    duration_minutes: 60,
    is_active: true,
    display_order: 1,
    prices: [
      { id: '1', service_id: '1', size: 'small' as PetSize, price: 45, created_at: '2024-01-01' },
      { id: '2', service_id: '1', size: 'medium' as PetSize, price: 55, created_at: '2024-01-01' },
    ],
  };

  const mockAddons: Addon[] = [
    { id: '1', created_at: '2024-01-01', name: 'Nail Polish', price: 10, is_active: true, display_order: 1, upsell_breeds: [] },
    { id: '2', created_at: '2024-01-01', name: 'Teeth Clean', price: 15, is_active: true, display_order: 2, upsell_breeds: [] },
  ];

  it('calculates correct total without tax', () => {
    const result = calculatePrice(mockService, 'small', mockAddons);
    expect(result.servicePrice).toBe(45);
    expect(result.addonsTotal).toBe(25);
    expect(result.subtotal).toBe(70);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(70);
  });

  it('calculates tax correctly when enabled', () => {
    const result = calculatePrice(mockService, 'small', mockAddons, { taxRate: 0.1 });
    expect(result.subtotal).toBe(70);
    expect(result.tax).toBe(7);
    expect(result.total).toBe(77);
  });

  it('calculates deposit correctly when enabled', () => {
    const result = calculatePrice(mockService, 'small', [], {
      depositEnabled: true,
      depositPercentage: 0.25,
    });
    expect(result.total).toBe(45);
    expect(result.deposit).toBe(11.25);
  });

  it('returns zero prices for null service', () => {
    const result = calculatePrice(null, 'small', []);
    expect(result.servicePrice).toBe(0);
    expect(result.total).toBe(0);
  });

  it('returns zero prices for null size', () => {
    const result = calculatePrice(mockService, null, []);
    expect(result.servicePrice).toBe(0);
  });
});
