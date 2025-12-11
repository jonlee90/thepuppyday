# Task 26: Write Unit Tests for Booking Store

## Description
Create unit tests for the Zustand booking store, testing state transitions, navigation guards, and price calculations.

## Files to create
- `src/stores/__tests__/bookingStore.test.ts`

## Requirements References
- Req 1.2: Enable navigation to next step and update progress
- Req 1.3: Allow navigation back to previous steps without losing data
- Req 10.3: Update displayed total immediately when price changes

## Implementation Details

### bookingStore.test.ts
```typescript
import { renderHook, act } from '@testing-library/react';
import {
  useBookingStore,
  BOOKING_STEP_LABELS,
} from '../bookingStore';
import type { ServiceWithPrices, Pet, Addon } from '@/types/database';

// Mock data factories
const mockService = (overrides = {}): ServiceWithPrices => ({
  id: 'service-1',
  name: 'Basic Grooming',
  description: 'Test service',
  image_url: null,
  duration_minutes: 60,
  is_active: true,
  display_order: 0,
  created_at: new Date().toISOString(),
  prices: [
    { id: 'price-1', service_id: 'service-1', size: 'small', price: 40 },
    { id: 'price-2', service_id: 'service-1', size: 'medium', price: 55 },
    { id: 'price-3', service_id: 'service-1', size: 'large', price: 70 },
    { id: 'price-4', service_id: 'service-1', size: 'xlarge', price: 85 },
  ],
  ...overrides,
});

const mockPet = (overrides = {}): Pet => ({
  id: 'pet-1',
  owner_id: 'user-1',
  name: 'Max',
  size: 'medium',
  breed_id: null,
  breed_custom: 'Labrador Mix',
  weight: 35,
  birth_date: null,
  notes: null,
  medical_info: null,
  photo_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const mockAddon = (overrides = {}): Addon => ({
  id: 'addon-1',
  name: 'Teeth Brushing',
  description: 'Test addon',
  price: 10,
  upsell_prompt: null,
  upsell_breeds: [],
  is_active: true,
  display_order: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('bookingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useBookingStore.getState().reset();
    });
  });

  describe('navigation', () => {
    it('starts at step 0', () => {
      const { result } = renderHook(() => useBookingStore());
      expect(result.current.currentStep).toBe(0);
    });

    it('nextStep increments current step', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('prevStep decrements current step', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.nextStep();
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('does not go below step 0', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('does not go above step 5', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.setStep(5);
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(5);
    });
  });

  describe('canNavigateToStep', () => {
    it('allows navigating back to any previous step', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.selectPet(mockPet());
        result.current.setStep(2);
      });

      expect(result.current.canNavigateToStep(0)).toBe(true);
      expect(result.current.canNavigateToStep(1)).toBe(true);
    });

    it('requires service selection for step 1', () => {
      const { result } = renderHook(() => useBookingStore());

      expect(result.current.canNavigateToStep(1)).toBe(false);

      act(() => {
        result.current.selectService(mockService());
      });

      expect(result.current.canNavigateToStep(1)).toBe(true);
    });

    it('requires pet size for step 2', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
      });

      expect(result.current.canNavigateToStep(2)).toBe(false);

      act(() => {
        result.current.setPetSize('medium');
      });

      expect(result.current.canNavigateToStep(2)).toBe(true);
    });
  });

  describe('service selection', () => {
    it('selectService updates store state', () => {
      const { result } = renderHook(() => useBookingStore());
      const service = mockService();

      act(() => {
        result.current.selectService(service);
      });

      expect(result.current.selectedServiceId).toBe(service.id);
      expect(result.current.selectedService).toEqual(service);
    });
  });

  describe('pet selection', () => {
    it('selectPet updates store and sets pet size', () => {
      const { result } = renderHook(() => useBookingStore());
      const pet = mockPet({ size: 'large' });

      act(() => {
        result.current.selectPet(pet);
      });

      expect(result.current.selectedPetId).toBe(pet.id);
      expect(result.current.selectedPet).toEqual(pet);
      expect(result.current.petSize).toBe('large');
    });

    it('setNewPetData stores pet data for later creation', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.setNewPetData({ name: 'Buddy', size: 'small', owner_id: 'user-1' });
      });

      expect(result.current.newPetData).toEqual({ name: 'Buddy', size: 'small', owner_id: 'user-1' });
      expect(result.current.petSize).toBe('small');
      expect(result.current.selectedPetId).toBeNull();
    });

    it('clearPetSelection resets pet state', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectPet(mockPet());
        result.current.clearPetSelection();
      });

      expect(result.current.selectedPetId).toBeNull();
      expect(result.current.selectedPet).toBeNull();
      expect(result.current.petSize).toBeNull();
    });
  });

  describe('price calculation', () => {
    it('calculates service price based on pet size', () => {
      const { result } = renderHook(() => useBookingStore());
      const service = mockService();

      act(() => {
        result.current.selectService(service);
        result.current.setPetSize('medium');
      });

      expect(result.current.servicePrice).toBe(55);
      expect(result.current.totalPrice).toBe(55);
    });

    it('recalculates when pet size changes', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.setPetSize('small');
      });

      expect(result.current.servicePrice).toBe(40);

      act(() => {
        result.current.setPetSize('large');
      });

      expect(result.current.servicePrice).toBe(70);
    });

    it('adds addon prices to total', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.setPetSize('medium');
        result.current.toggleAddon(mockAddon({ price: 10 }));
      });

      expect(result.current.servicePrice).toBe(55);
      expect(result.current.addonsTotal).toBe(10);
      expect(result.current.totalPrice).toBe(65);
    });

    it('toggleAddon adds and removes addons', () => {
      const { result } = renderHook(() => useBookingStore());
      const addon = mockAddon();

      act(() => {
        result.current.selectService(mockService());
        result.current.setPetSize('medium');
        result.current.toggleAddon(addon);
      });

      expect(result.current.selectedAddonIds).toContain(addon.id);

      act(() => {
        result.current.toggleAddon(addon);
      });

      expect(result.current.selectedAddonIds).not.toContain(addon.id);
    });

    it('calculates total with multiple addons', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.setPetSize('medium');
        result.current.toggleAddon(mockAddon({ id: 'addon-1', price: 10 }));
        result.current.toggleAddon(mockAddon({ id: 'addon-2', price: 15 }));
      });

      expect(result.current.addonsTotal).toBe(25);
      expect(result.current.totalPrice).toBe(80); // 55 + 25
    });
  });

  describe('session management', () => {
    it('reset clears all state', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.selectService(mockService());
        result.current.selectPet(mockPet());
        result.current.toggleAddon(mockAddon());
        result.current.setStep(3);
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.selectedServiceId).toBeNull();
      expect(result.current.selectedPetId).toBeNull();
      expect(result.current.selectedAddons).toEqual([]);
    });

    it('isSessionExpired returns true after timeout', () => {
      const { result } = renderHook(() => useBookingStore());

      // Manually set old timestamp
      act(() => {
        useBookingStore.setState({
          lastActivityTimestamp: Date.now() - 31 * 60 * 1000, // 31 minutes ago
        });
      });

      expect(result.current.isSessionExpired()).toBe(true);
    });

    it('isSessionExpired returns false within timeout', () => {
      const { result } = renderHook(() => useBookingStore());

      expect(result.current.isSessionExpired()).toBe(false);
    });

    it('updateActivity refreshes timestamp', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        useBookingStore.setState({
          lastActivityTimestamp: Date.now() - 25 * 60 * 1000,
        });
        result.current.updateActivity();
      });

      expect(result.current.isSessionExpired()).toBe(false);
    });
  });

  describe('booking result', () => {
    it('setBookingResult stores result and moves to confirmation', () => {
      const { result } = renderHook(() => useBookingStore());

      act(() => {
        result.current.setBookingResult('appt-123', 'APT-2025-001234');
      });

      expect(result.current.bookingId).toBe('appt-123');
      expect(result.current.bookingReference).toBe('APT-2025-001234');
      expect(result.current.currentStep).toBe(5);
    });
  });
});

// Test selector hooks
describe('selector hooks', () => {
  beforeEach(() => {
    act(() => {
      useBookingStore.getState().reset();
    });
  });

  it('usePriceSummary returns price breakdown', () => {
    const { usePriceSummary } = require('../bookingStore');
    const { result: storeResult } = renderHook(() => useBookingStore());
    const { result: selectorResult } = renderHook(() => usePriceSummary());

    act(() => {
      storeResult.current.selectService(mockService());
      storeResult.current.setPetSize('medium');
      storeResult.current.toggleAddon(mockAddon({ price: 10 }));
    });

    expect(selectorResult.current).toEqual({
      servicePrice: 55,
      addonsTotal: 10,
      totalPrice: 65,
    });
  });
});
```

## Acceptance Criteria
- [ ] Navigation tests verify step transitions
- [ ] canNavigateToStep logic tested for all steps
- [ ] Service selection updates state correctly
- [ ] Pet selection sets size and triggers price recalc
- [ ] Price calculation tested for service + size combinations
- [ ] Add-on toggle adds/removes correctly
- [ ] Total price includes service + addons
- [ ] Session expiry detection tested
- [ ] Reset clears all state
- [ ] Booking result storage tested
- [ ] All tests pass with `npm run test`

## Estimated Complexity
Medium

## Phase
Phase 8: Testing

## Dependencies
- Existing bookingStore.ts implementation
