/**
 * Booking wizard state management with session persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ServiceWithPrices, Pet, Addon, PetSize, CreatePetInput } from '@/types/database';
import type { BookingModalMode } from '@/hooks/useBookingModal';

export interface PriceAdjustment {
  id: string;          // Client-side temporary ID (crypto.randomUUID())
  label: string;
  amount: number;      // Positive = surcharge, negative = discount
  note?: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zip?: string;
}

export interface BookingState {
  // Current step
  currentStep: number;

  // Booking mode (determines step count and order)
  mode: BookingModalMode;

  // Admin/Walk-in: Selected customer and groomer
  selectedCustomerId: string | null;
  selectedGroomerId: string | null;

  // Step 1: Service
  selectedServiceId: string | null;
  selectedService: ServiceWithPrices | null;

  // Step 2: Pet
  selectedPetId: string | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;

  // Step 3: Date/Time
  selectedDate: string | null;
  selectedTimeSlot: string | null;

  // Step 4: Add-ons
  selectedAddonIds: string[];
  selectedAddons: Addon[];

  // Step 5: Guest info (for unauthenticated users)
  guestInfo: GuestInfo | null;

  // Calculated values
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;

  // Session tracking
  lastActivityTimestamp: number;

  // Admin: send confirmation email
  sendNotification: boolean;

  // Admin booking: price adjustments
  priceAdjustments: PriceAdjustment[];

  // Booking result
  bookingId: string | null;
  bookingReference: string | null;
}

export interface BookingActions {
  // Mode
  setMode: (mode: BookingModalMode) => void;

  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canNavigateToStep: (step: number) => boolean;

  // Step 1: Service
  selectService: (service: ServiceWithPrices) => void;

  // Step 2: Pet
  selectPet: (pet: Pet) => void;
  setNewPetData: (data: CreatePetInput | null) => void;
  setPetSize: (size: PetSize) => void;
  clearPetSelection: () => void;

  // Step 3: Date/Time
  selectDateTime: (date: string, time: string) => void;
  clearDateTime: () => void;

  // Step 4: Add-ons
  toggleAddon: (addon: Addon) => void;
  clearAddons: () => void;

  // Step 5: Guest info
  setGuestInfo: (info: GuestInfo) => void;

  // Admin/Walk-in: Customer and groomer selection
  setSelectedCustomerId: (customerId: string | null) => void;
  setSelectedGroomerId: (groomerId: string | null) => void;

  // Admin: send confirmation email
  setSendNotification: (value: boolean) => void;

  // Admin: price adjustments
  addPriceAdjustment: (adj: Omit<PriceAdjustment, 'id'>) => void;
  removePriceAdjustment: (id: string) => void;
  clearPriceAdjustments: () => void;

  // Booking result
  setBookingResult: (id: string, reference: string) => void;

  // Utilities
  calculatePrices: () => void;
  updateActivity: () => void;
  reset: () => void;
  isSessionExpired: () => boolean;
}

export type BookingStore = BookingState & BookingActions;

/** Max step index per mode (0-based) */
const MAX_STEP: Record<BookingModalMode, number> = {
  customer: 5, // 6 steps: 0-5
  admin: 5,    // 6 steps: 0-5
  walkin: 4,   // 5 steps: 0-4
};

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const initialState: BookingState = {
  currentStep: 0,
  mode: 'customer',
  selectedCustomerId: null,
  selectedGroomerId: null,
  selectedServiceId: null,
  selectedService: null,
  selectedPetId: null,
  selectedPet: null,
  newPetData: null,
  petSize: null,
  selectedDate: null,
  selectedTimeSlot: null,
  selectedAddonIds: [],
  selectedAddons: [],
  guestInfo: null,
  servicePrice: 0,
  addonsTotal: 0,
  totalPrice: 0,
  lastActivityTimestamp: Date.now(),
  sendNotification: false,
  priceAdjustments: [],
  bookingId: null,
  bookingReference: null,
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Mode
      setMode: (mode: BookingModalMode) => {
        set({ mode });
      },

      // Navigation
      setStep: (step: number) => {
        const { mode } = get();
        if (step >= 0 && step <= MAX_STEP[mode]) {
          set({ currentStep: step, lastActivityTimestamp: Date.now() });
        }
      },

      nextStep: () => {
        const { currentStep, mode } = get();
        if (currentStep < MAX_STEP[mode]) {
          set({ currentStep: currentStep + 1, lastActivityTimestamp: Date.now() });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1, lastActivityTimestamp: Date.now() });
        }
      },

      canNavigateToStep: (step: number) => {
        const state = get();
        // Can always go back
        if (step < state.currentStep) return true;
        // Can't jump ahead
        if (step > state.currentStep) return false;
        return true;
      },

      // Step 1: Service
      selectService: (service: ServiceWithPrices) => {
        set({
          selectedServiceId: service.id,
          selectedService: service,
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      // Step 2: Pet
      selectPet: (pet: Pet) => {
        set({
          selectedPetId: pet.id,
          selectedPet: pet,
          petSize: pet.size,
          newPetData: null,
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      setNewPetData: (data: CreatePetInput | null) => {
        set({
          newPetData: data,
          selectedPetId: null,
          selectedPet: null,
          petSize: data?.size || null,
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      setPetSize: (size: PetSize) => {
        const { newPetData } = get();
        set({
          petSize: size,
          newPetData: newPetData ? { ...newPetData, size } : null,
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      clearPetSelection: () => {
        set({
          selectedPetId: null,
          selectedPet: null,
          newPetData: null,
          petSize: null,
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      // Step 3: Date/Time
      selectDateTime: (date: string, time: string) => {
        set({
          selectedDate: date,
          selectedTimeSlot: time,
          lastActivityTimestamp: Date.now(),
        });
      },

      clearDateTime: () => {
        set({
          selectedDate: null,
          selectedTimeSlot: null,
          lastActivityTimestamp: Date.now(),
        });
      },

      // Step 4: Add-ons
      toggleAddon: (addon: Addon) => {
        const { selectedAddonIds, selectedAddons } = get();
        const isSelected = selectedAddonIds.includes(addon.id);

        if (isSelected) {
          set({
            selectedAddonIds: selectedAddonIds.filter((id) => id !== addon.id),
            selectedAddons: selectedAddons.filter((a) => a.id !== addon.id),
            lastActivityTimestamp: Date.now(),
          });
        } else {
          set({
            selectedAddonIds: [...selectedAddonIds, addon.id],
            selectedAddons: [...selectedAddons, addon],
            lastActivityTimestamp: Date.now(),
          });
        }
        get().calculatePrices();
      },

      clearAddons: () => {
        set({
          selectedAddonIds: [],
          selectedAddons: [],
          lastActivityTimestamp: Date.now(),
        });
        get().calculatePrices();
      },

      // Step 5: Guest info
      setGuestInfo: (info: GuestInfo) => {
        set({
          guestInfo: info,
          lastActivityTimestamp: Date.now(),
        });
      },

      // Admin/Walk-in: Customer selection
      setSelectedCustomerId: (customerId: string | null) => {
        set({
          selectedCustomerId: customerId,
          // Clear pet selection when customer changes
          selectedPetId: null,
          selectedPet: null,
          newPetData: null,
          lastActivityTimestamp: Date.now(),
        });
      },

      // Admin/Walk-in: Groomer selection
      setSelectedGroomerId: (groomerId: string | null) => {
        set({
          selectedGroomerId: groomerId,
          lastActivityTimestamp: Date.now(),
        });
      },

      // Admin: send confirmation email
      setSendNotification: (value: boolean) => {
        set({ sendNotification: value, lastActivityTimestamp: Date.now() });
      },

      // Booking result
      setBookingResult: (id: string, reference: string) => {
        const { mode } = get();
        set({
          bookingId: id,
          bookingReference: reference,
          currentStep: MAX_STEP[mode],
          lastActivityTimestamp: Date.now(),
        });
      },

      // Admin: price adjustments
      addPriceAdjustment: (adj) => {
        const id = crypto.randomUUID();
        set((state) => ({ priceAdjustments: [...state.priceAdjustments, { ...adj, id }] }));
        get().calculatePrices();
      },

      removePriceAdjustment: (id) => {
        set((state) => ({ priceAdjustments: state.priceAdjustments.filter((a) => a.id !== id) }));
        get().calculatePrices();
      },

      clearPriceAdjustments: () => {
        set({ priceAdjustments: [] });
        get().calculatePrices();
      },

      // Utilities
      calculatePrices: () => {
        const { selectedService, petSize, selectedAddons, priceAdjustments } = get();

        let servicePrice = 0;
        if (selectedService && petSize) {
          const priceEntry = selectedService.prices?.find((p) => p.size === petSize);
          servicePrice = priceEntry?.price || 0;
        }

        const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        const adjustmentsTotal = priceAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
        const totalPrice = Math.max(0, servicePrice + addonsTotal + adjustmentsTotal);

        set({ servicePrice, addonsTotal, totalPrice });
      },

      updateActivity: () => {
        set({ lastActivityTimestamp: Date.now() });
      },

      reset: () => {
        set({ ...initialState, lastActivityTimestamp: Date.now() });
      },

      isSessionExpired: () => {
        const { lastActivityTimestamp } = get();
        return Date.now() - lastActivityTimestamp > SESSION_TIMEOUT_MS;
      },
    }),
    {
      name: 'booking-session',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        // Clear session if expired
        if (state && state.isSessionExpired()) {
          state.reset();
        }
      },
    }
  )
);

// Export max step config for external use
export { MAX_STEP };

// Selector hooks for common patterns
export const useCurrentStep = () => useBookingStore((state) => state.currentStep);
export const useSelectedService = () => useBookingStore((state) => state.selectedService);
export const useSelectedPet = () => useBookingStore((state) => state.selectedPet);
export const usePetSize = () => useBookingStore((state) => state.petSize);
export const useSelectedDateTime = () =>
  useBookingStore((state) => ({
    date: state.selectedDate,
    time: state.selectedTimeSlot,
  }));
export const useSelectedAddons = () => useBookingStore((state) => state.selectedAddons);
export const usePriceSummary = () =>
  useBookingStore((state) => ({
    servicePrice: state.servicePrice,
    addonsTotal: state.addonsTotal,
    totalPrice: state.totalPrice,
  }));
export const useBookingResult = () =>
  useBookingStore((state) => ({
    bookingId: state.bookingId,
    bookingReference: state.bookingReference,
  }));
export const usePriceAdjustments = () => useBookingStore((state) => state.priceAdjustments);
