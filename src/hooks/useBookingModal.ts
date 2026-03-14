/**
 * Booking Modal Hook
 * Manages modal state and mode-specific behavior for the reusable booking modal
 */

import { create } from 'zustand';
import type { Pet } from '@/types/database';

export type BookingModalMode = 'customer' | 'admin' | 'walkin';

export interface PreSelectedCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BookingModalOptions {
  mode: BookingModalMode;
  preSelectedServiceId?: string;
  preSelectedCustomerId?: string;
  preSelectedCustomerInfo?: PreSelectedCustomerInfo;
  preSelectedPet?: Pet;
  initialStep?: number;
  onSuccess?: (appointmentId: string) => void;
}

interface BookingModalState {
  isOpen: boolean;
  mode: BookingModalMode;
  preSelectedServiceId: string | null;
  preSelectedCustomerId: string | null;
  preSelectedCustomerInfo: PreSelectedCustomerInfo | null;
  preSelectedPet: Pet | null;
  initialStep: number;
  onSuccessCallback: ((appointmentId: string) => void) | null;
  canClose: boolean; // False during submission
}

interface BookingModalActions {
  openModal: (options: BookingModalOptions) => void;
  closeModal: () => void;
  setCanClose: (canClose: boolean) => void;
  triggerSuccess: (appointmentId: string) => void;
}

type BookingModalStore = BookingModalState & BookingModalActions;

export const useBookingModalStore = create<BookingModalStore>((set, get) => ({
  // Initial state
  isOpen: false,
  mode: 'customer',
  preSelectedServiceId: null,
  preSelectedCustomerId: null,
  preSelectedCustomerInfo: null,
  preSelectedPet: null,
  initialStep: 0,
  onSuccessCallback: null,
  canClose: true,

  // Actions
  openModal: (options) => {
    set({
      isOpen: true,
      mode: options.mode,
      preSelectedServiceId: options.preSelectedServiceId || null,
      preSelectedCustomerId: options.preSelectedCustomerId || null,
      preSelectedCustomerInfo: options.preSelectedCustomerInfo || null,
      preSelectedPet: options.preSelectedPet || null,
      initialStep: options.initialStep ?? 0,
      onSuccessCallback: options.onSuccess || null,
      canClose: true,
    });
  },

  closeModal: () => {
    const { canClose } = get();
    if (canClose) {
      set({
        isOpen: false,
        preSelectedServiceId: null,
        preSelectedCustomerId: null,
        preSelectedCustomerInfo: null,
        preSelectedPet: null,
        onSuccessCallback: null,
      });
    }
  },

  setCanClose: (canClose) => {
    set({ canClose });
  },

  triggerSuccess: (appointmentId) => {
    const { onSuccessCallback } = get();
    if (onSuccessCallback) {
      onSuccessCallback(appointmentId);
    }
  },
}));

/**
 * Hook for using the booking modal
 */
export function useBookingModal() {
  const store = useBookingModalStore();

  return {
    isOpen: store.isOpen,
    mode: store.mode,
    preSelectedServiceId: store.preSelectedServiceId,
    preSelectedCustomerId: store.preSelectedCustomerId,
    preSelectedCustomerInfo: store.preSelectedCustomerInfo,
    preSelectedPet: store.preSelectedPet,
    initialStep: store.initialStep,
    canClose: store.canClose,
    open: store.openModal,
    close: store.closeModal,
    setCanClose: store.setCanClose,
    triggerSuccess: store.triggerSuccess,
  };
}

/**
 * Mode-specific configuration
 * Step order must match BookingWizard.renderStep() for each mode
 *
 * Customer: Service → Customer → Pet → DateTime → Review (includes add-ons) → Confirmation (6 steps)
 * Admin: Service → Customer → Pet → DateTime → Review (includes add-ons) → Confirmation (6 steps)
 * Walk-in: Service → Customer → Pet → Review (includes add-ons) → Confirmation (5 steps, no DateTime)
 */
export const MODE_CONFIG = {
  customer: {
    title: 'Book Your Appointment',
    subtitle: 'Schedule your pet\'s grooming session',
    steps: ['Service', 'Customer', 'Pet', 'Date & Time', 'Review', 'Confirmation'],
    stepTitles: [
      'Select a Service',       // Step 0
      'Your Information',       // Step 1
      'Pet Information',        // Step 2
      'Select Date & Time',     // Step 3
      'Review Your Booking',    // Step 4 (Includes add-ons)
      'Booking Confirmed',      // Step 5
    ],
    showTrustSignals: true,
    showBranding: true,
    requireEmail: true,
    allowPastDates: false,
    bypassAvailability: false,
    autoNotify: true,
    showPaymentStatus: false,
    showAdminNotes: false,
  },
  admin: {
    title: 'Create Appointment',
    subtitle: 'Schedule a new appointment',
    steps: ['Service', 'Customer', 'Pet', 'Date & Time', 'Review', 'Confirmation'],
    stepTitles: [
      'Select a Service',       // Step 0
      'Customer Details',       // Step 1
      'Pet Details',            // Step 2
      'Select Date & Time',     // Step 3
      'Review Appointment',     // Step 4 (Includes add-ons)
      'Appointment Created',    // Step 5
    ],
    showTrustSignals: false,
    showBranding: false,
    requireEmail: true,
    allowPastDates: true,
    bypassAvailability: true,
    autoNotify: false,
    showPaymentStatus: true,
    showAdminNotes: true,
  },
  walkin: {
    title: 'Walk-In Appointment',
    subtitle: 'Quick registration for walk-in customer',
    steps: ['Service', 'Customer', 'Pet', 'Review', 'Confirmation'],
    stepTitles: [
      'Select a Service',       // Step 0
      'Customer Details',       // Step 1
      'Pet Details',            // Step 2
      'Review & Confirm',       // Step 3 (Includes add-ons)
      'Walk-In Confirmed',      // Step 4
    ],
    showTrustSignals: false,
    showBranding: false,
    requireEmail: false, // Phone required, email optional
    allowPastDates: true,
    bypassAvailability: true,
    autoNotify: false,
    showPaymentStatus: true,
    showAdminNotes: true,
    autoSetDateTime: true, // Auto-set to NOW
  },
} as const;

export type ModeConfig = typeof MODE_CONFIG[BookingModalMode];
