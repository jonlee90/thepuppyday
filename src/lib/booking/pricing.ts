/**
 * Price calculation utilities for booking system
 */

import type { ServiceWithPrices, Addon, PetSize } from '@/types/database';

/**
 * Size weight ranges constant
 */
export const SIZE_WEIGHT_RANGES = {
  small: { min: 0, max: 18 },
  medium: { min: 19, max: 35 },
  large: { min: 36, max: 65 },
  xlarge: { min: 66, max: Infinity },
} as const;

export interface PriceBreakdown {
  serviceName: string;
  servicePrice: number;
  addons: { name: string; price: number }[];
  addonsTotal: number;
  subtotal: number;
  tax: number;
  deposit: number;
  total: number;
}

export interface PricingSettings {
  taxRate?: number; // e.g., 0.0875 for 8.75%
  depositPercentage?: number; // e.g., 0.25 for 25%
  depositEnabled?: boolean;
}

const DEFAULT_SETTINGS: PricingSettings = {
  taxRate: 0,
  depositPercentage: 0,
  depositEnabled: false,
};

/**
 * Get service price for a specific pet size
 */
export function getServicePriceForSize(
  service: ServiceWithPrices,
  size: PetSize
): number {
  const priceEntry = service.prices?.find((p) => p.size === size);
  return priceEntry?.price || 0;
}

/**
 * Get price range for a service (min-max across all sizes)
 */
export function getServicePriceRange(service: ServiceWithPrices): {
  min: number;
  max: number;
  formatted: string;
} {
  // Ensure prices is an array
  const pricesArray = Array.isArray(service.prices) ? service.prices : [];
  const prices = pricesArray.map((p) => p.price);

  if (prices.length === 0) {
    return { min: 0, max: 0, formatted: '$0' };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return { min, max, formatted: formatCurrency(min) };
  }

  return {
    min,
    max,
    formatted: `${formatCurrency(min)} - ${formatCurrency(max)}`,
  };
}

/**
 * Calculate total add-ons price
 */
export function calculateAddonsTotal(addons: Addon[] | null | undefined): number {
  if (!Array.isArray(addons) || addons.length === 0) {
    return 0;
  }
  return addons.reduce((sum, addon) => sum + addon.price, 0);
}

/**
 * Calculate complete price breakdown
 */
export function calculatePrice(
  service: ServiceWithPrices | null,
  petSize: PetSize | null,
  addons: Addon[] | null | undefined,
  settings: PricingSettings = DEFAULT_SETTINGS
): PriceBreakdown {
  const serviceName = service?.name || '';
  const servicePrice = service && petSize ? getServicePriceForSize(service, petSize) : 0;

  // Ensure addons is always an array
  const safeAddons = Array.isArray(addons) ? addons : [];

  const addonItems = safeAddons.map((addon) => ({
    name: addon.name,
    price: addon.price,
  }));
  const addonsTotal = calculateAddonsTotal(safeAddons);

  const subtotal = servicePrice + addonsTotal;

  /**
   * Tax calculation uses standard rounding (round to nearest cent)
   * Note: Some jurisdictions require rounding up for taxes. Verify local requirements.
   */
  const tax = settings.taxRate ? Math.round(subtotal * settings.taxRate * 100) / 100 : 0;
  const total = subtotal + tax;

  /**
   * Deposit calculation uses standard rounding (round to nearest cent)
   * This minimizes cumulative rounding errors over many transactions.
   */
  const deposit =
    settings.depositEnabled && settings.depositPercentage
      ? Math.round(total * settings.depositPercentage * 100) / 100
      : 0;

  return {
    serviceName,
    servicePrice,
    addons: addonItems,
    addonsTotal,
    subtotal,
    tax,
    deposit,
    total,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get size label with weight range
 */
export function getSizeLabel(size: PetSize): string {
  const labels: Record<PetSize, string> = {
    small: 'Small (0-18 lbs)',
    medium: 'Medium (19-35 lbs)',
    large: 'Large (36-65 lbs)',
    xlarge: 'X-Large (66+ lbs)',
  };
  return labels[size];
}

/**
 * Get short size label
 */
export function getSizeShortLabel(size: PetSize): string {
  const labels: Record<PetSize, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'X-Large',
  };
  return labels[size];
}

/**
 * Get size from weight
 */
export function getSizeFromWeight(weight: number): PetSize {
  if (weight <= SIZE_WEIGHT_RANGES.small.max) return 'small';
  if (weight <= SIZE_WEIGHT_RANGES.medium.max) return 'medium';
  if (weight <= SIZE_WEIGHT_RANGES.large.max) return 'large';
  return 'xlarge';
}

/**
 * Alias for getSizeFromWeight to match task spec
 */
export const determineSizeFromWeight = getSizeFromWeight;

/**
 * Calculate total from service price and addons (simplified version)
 */
export function calculateTotal(servicePrice: number, addons: Addon[] | null | undefined): number {
  const addonsTotal = calculateAddonsTotal(addons);
  return servicePrice + addonsTotal;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
