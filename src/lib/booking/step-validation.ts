/**
 * Step validation helpers for booking wizard
 * Determines if a step can proceed to the next step
 * Supports multiple modes with different step orders
 */

import type { BookingStore } from '@/stores/bookingStore';
import type { BookingModalMode } from '@/hooks/useBookingModal';

/**
 * Common validation checks
 */
function hasValidService(state: BookingStore): boolean {
  return state.selectedService !== null;
}

function hasValidPet(state: BookingStore): boolean {
  return (
    state.selectedPetId !== null ||
    (state.newPetData !== null && state.petSize !== null)
  );
}

function hasValidDateTime(state: BookingStore): boolean {
  return state.selectedDate !== null && state.selectedTimeSlot !== null;
}

function hasValidCustomer(state: BookingStore): boolean {
  // Has selected an existing customer OR has new customer info
  return (
    (state.selectedCustomerId !== null && state.selectedCustomerId !== '') ||
    (state.guestInfo !== null &&
      state.guestInfo.firstName !== '' &&
      state.guestInfo.lastName !== '' &&
      state.guestInfo.phone !== '')
  );
}

/**
 * Validates if the current step has all required data to proceed
 * Mode-aware validation for different step orders
 */
export function canContinueFromStep(
  currentStep: number,
  bookingState: BookingStore,
  mode: BookingModalMode = 'customer'
): boolean {
  // Walk-in mode: Service → Customer → Pet → Review (includes add-ons) → Confirmation (no DateTime)
  if (mode === 'walkin') {
    switch (currentStep) {
      case 0: // Service step
        return hasValidService(bookingState);

      case 1: // Customer step
        return hasValidCustomer(bookingState);

      case 2: // Pet step
        return hasValidPet(bookingState);

      case 3: // Review step (includes add-ons - all required data should be present)
        return (
          hasValidService(bookingState) &&
          hasValidCustomer(bookingState) &&
          hasValidPet(bookingState)
        );

      case 4: // Confirmation step
        return false;

      default:
        return false;
    }
  }

  // Admin mode: Service → DateTime → Customer → Pet → Review (includes add-ons) → Confirmation
  if (mode === 'admin') {
    switch (currentStep) {
      case 0: // Service step
        return hasValidService(bookingState);

      case 1: // Date & Time step
        return hasValidDateTime(bookingState);

      case 2: // Customer step
        return hasValidCustomer(bookingState);

      case 3: // Pet step
        return hasValidPet(bookingState);

      case 4: // Review step (includes add-ons - all required data should be present)
        return (
          hasValidService(bookingState) &&
          hasValidDateTime(bookingState) &&
          hasValidCustomer(bookingState) &&
          hasValidPet(bookingState)
        );

      case 5: // Confirmation step
        return false;

      default:
        return false;
    }
  }

  // Customer mode: Service → DateTime → Customer → Pet → Review (includes add-ons) → Confirmation
  switch (currentStep) {
    case 0: // Service step
      return hasValidService(bookingState);

    case 1: // Date & Time step
      return hasValidDateTime(bookingState);

    case 2: // Customer step
      return hasValidCustomer(bookingState);

    case 3: // Pet step
      return hasValidPet(bookingState);

    case 4: // Review step (includes add-ons - all required data should be present)
      return (
        hasValidService(bookingState) &&
        hasValidDateTime(bookingState) &&
        hasValidCustomer(bookingState) &&
        hasValidPet(bookingState)
      );

    case 5: // Confirmation step
      return false;

    default:
      return false;
  }
}

/**
 * Gets validation message for why a step cannot proceed
 * Mode-aware messages for different step orders
 */
export function getStepValidationMessage(
  currentStep: number,
  bookingState: BookingStore,
  mode: BookingModalMode = 'customer'
): string | null {
  if (canContinueFromStep(currentStep, bookingState, mode)) {
    return null;
  }

  // Walk-in mode messages
  if (mode === 'walkin') {
    switch (currentStep) {
      case 0:
        return 'Please select a service to continue';
      case 1:
        return 'Please select or create a customer to continue';
      case 2:
        return 'Please provide pet information to continue';
      default:
        return 'Please complete this step to continue';
    }
  }

  // Admin mode messages
  if (mode === 'admin') {
    switch (currentStep) {
      case 0:
        return 'Please select a service to continue';
      case 1:
        return 'Please select a date and time to continue';
      case 2:
        return 'Please select or create a customer to continue';
      case 3:
        return 'Please provide pet information to continue';
      case 4:
        return 'Please complete all required information';
      default:
        return 'Please complete this step to continue';
    }
  }

  // Customer mode messages
  switch (currentStep) {
    case 0:
      return 'Please select a service to continue';
    case 1:
      return 'Please select a date and time to continue';
    case 2:
      return 'Please provide your contact information to continue';
    case 3:
      return 'Please provide pet information to continue';
    case 4:
      return 'Please complete all required information';
    default:
      return 'Please complete this step to continue';
  }
}
