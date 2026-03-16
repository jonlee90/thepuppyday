/**
 * Task 0125: Unit Tests for bookingStore price adjustment actions and calculatePrices
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBookingStore } from '@/stores/bookingStore';
import type { ServiceWithPrices, Addon } from '@/types/database';

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  ...globalThis.crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Ensure sessionStorage is available for persist middleware
if (typeof globalThis.sessionStorage === 'undefined') {
  const store: Record<string, string> = {};
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    length: 0,
    key: () => null,
  });
}

describe('bookingStore — Price Adjustments', () => {
  beforeEach(() => {
    useBookingStore.getState().reset();
    uuidCounter = 0;
  });

  describe('addPriceAdjustment', () => {
    it('adds a surcharge adjustment', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'Matting fee', amount: 15 });

      const state = useBookingStore.getState();
      expect(state.priceAdjustments).toHaveLength(1);
      expect(state.priceAdjustments[0]).toEqual({
        id: 'test-uuid-1',
        label: 'Matting fee',
        amount: 15,
      });
    });

    it('adds a discount adjustment (negative amount)', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'Loyalty discount', amount: -10 });

      const state = useBookingStore.getState();
      expect(state.priceAdjustments).toHaveLength(1);
      expect(state.priceAdjustments[0].amount).toBe(-10);
    });

    it('adds multiple adjustments', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'Surcharge', amount: 20 });
      store.addPriceAdjustment({ label: 'Discount', amount: -5 });

      expect(useBookingStore.getState().priceAdjustments).toHaveLength(2);
    });

    it('includes optional note', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'Extra', amount: 10, note: 'Severe matting' });

      expect(useBookingStore.getState().priceAdjustments[0].note).toBe('Severe matting');
    });
  });

  describe('removePriceAdjustment', () => {
    it('removes an adjustment by id', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'A', amount: 10 });
      store.addPriceAdjustment({ label: 'B', amount: 20 });

      useBookingStore.getState().removePriceAdjustment('test-uuid-1');

      const state = useBookingStore.getState();
      expect(state.priceAdjustments).toHaveLength(1);
      expect(state.priceAdjustments[0].label).toBe('B');
    });

    it('does nothing for non-existent id', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'A', amount: 10 });
      store.removePriceAdjustment('non-existent');

      expect(useBookingStore.getState().priceAdjustments).toHaveLength(1);
    });
  });

  describe('clearPriceAdjustments', () => {
    it('removes all adjustments', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'A', amount: 10 });
      store.addPriceAdjustment({ label: 'B', amount: 20 });

      useBookingStore.getState().clearPriceAdjustments();

      expect(useBookingStore.getState().priceAdjustments).toEqual([]);
    });
  });

  describe('calculatePrices with adjustments', () => {
    const mockService: ServiceWithPrices = {
      id: 'svc-1',
      name: 'Basic Grooming',
      duration_minutes: 60,
      is_active: true,
      prices: [
        { size: 'small', price: 40 },
        { size: 'medium', price: 55 },
        { size: 'large', price: 70 },
      ],
    } as ServiceWithPrices;

    it('includes adjustments in totalPrice', () => {
      const store = useBookingStore.getState();
      store.selectService(mockService);
      store.setPetSize('medium');
      store.addPriceAdjustment({ label: 'Matting', amount: 15 });

      const state = useBookingStore.getState();
      expect(state.servicePrice).toBe(55);
      expect(state.totalPrice).toBe(70); // 55 + 15
    });

    it('handles discount adjustments reducing total', () => {
      const store = useBookingStore.getState();
      store.selectService(mockService);
      store.setPetSize('small');
      store.addPriceAdjustment({ label: 'Discount', amount: -10 });

      expect(useBookingStore.getState().totalPrice).toBe(30); // 40 - 10
    });

    it('handles multiple adjustments (surcharge + discount)', () => {
      const store = useBookingStore.getState();
      store.selectService(mockService);
      store.setPetSize('large');
      store.addPriceAdjustment({ label: 'Matting', amount: 20 });
      store.addPriceAdjustment({ label: 'Loyalty', amount: -15 });

      expect(useBookingStore.getState().totalPrice).toBe(75); // 70 + 20 - 15
    });

    it('recalculates when adjustment is removed', () => {
      const store = useBookingStore.getState();
      store.selectService(mockService);
      store.setPetSize('medium');
      store.addPriceAdjustment({ label: 'Extra', amount: 25 });

      expect(useBookingStore.getState().totalPrice).toBe(80); // 55 + 25

      useBookingStore.getState().removePriceAdjustment('test-uuid-1');
      expect(useBookingStore.getState().totalPrice).toBe(55);
    });

    it('adds adjustments without service selected (adjustments only)', () => {
      const store = useBookingStore.getState();
      // No service or pet selected - just adjustments
      store.addPriceAdjustment({ label: 'Flat fee', amount: 25 });
      store.addPriceAdjustment({ label: 'Discount', amount: -10 });

      const state = useBookingStore.getState();
      expect(state.servicePrice).toBe(0);
      expect(state.totalPrice).toBe(15); // 0 + 25 - 10
    });

    it('returns zero adjustments total with empty array', () => {
      const store = useBookingStore.getState();
      store.selectService(mockService);
      store.setPetSize('medium');

      expect(useBookingStore.getState().totalPrice).toBe(55);
    });
  });

  describe('reset clears adjustments', () => {
    it('clears priceAdjustments on reset', () => {
      const store = useBookingStore.getState();
      store.addPriceAdjustment({ label: 'Test', amount: 10 });

      useBookingStore.getState().reset();

      expect(useBookingStore.getState().priceAdjustments).toEqual([]);
      expect(useBookingStore.getState().totalPrice).toBe(0);
    });
  });
});
