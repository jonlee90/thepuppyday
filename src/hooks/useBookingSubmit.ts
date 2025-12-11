'use client';

/**
 * Hook for handling appointment booking submission
 *
 * Manages the complete booking flow including:
 * - Guest user creation (if needed)
 * - Pet creation (if new pet)
 * - Appointment creation
 * - Conflict resolution
 * - Error handling
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBookingStore } from '@/stores/bookingStore';

/**
 * Booking submission result on success
 */
export interface BookingResult {
  success: true;
  appointmentId: string;
  reference: string;
}

/**
 * Categorized booking error types
 */
export interface BookingError {
  type: 'SLOT_CONFLICT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
  message: string;
}

/**
 * Hook return interface
 */
export interface UseBookingSubmitReturn {
  submit: () => Promise<BookingResult>;
  isSubmitting: boolean;
  error: BookingError | null;
  clearError: () => void;
}

/**
 * Custom hook for booking submission with comprehensive error handling
 *
 * @example
 * ```tsx
 * const { submit, isSubmitting, error, clearError } = useBookingSubmit();
 *
 * const handleSubmit = async () => {
 *   try {
 *     const result = await submit();
 *     console.log('Booking created:', result.reference);
 *   } catch (err) {
 *     // Error is already stored in hook state
 *     console.error('Booking failed:', err);
 *   }
 * };
 * ```
 */
export function useBookingSubmit(): UseBookingSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BookingError | null>(null);

  const { user, isAuthenticated } = useAuth();

  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    guestInfo,
    totalPrice,
    setBookingResult,
    setStep,
    clearDateTime,
  } = useBookingStore();

  /**
   * Submit the booking with full error handling
   */
  const submit = useCallback(async (): Promise<BookingResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required data
      if (!selectedService) {
        throw {
          type: 'VALIDATION',
          message: 'Service selection is required',
        };
      }

      if (!petSize) {
        throw {
          type: 'VALIDATION',
          message: 'Pet size selection is required',
        };
      }

      if (!selectedDate || !selectedTimeSlot) {
        throw {
          type: 'VALIDATION',
          message: 'Date and time selection is required',
        };
      }

      // Step 1: Create guest user if needed
      let customerId: string;

      if (isAuthenticated && user) {
        // User is already authenticated
        customerId = user.id;
      } else if (guestInfo) {
        // Create guest user
        const guestResponse = await fetch('/api/users/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestInfo),
        });

        if (!guestResponse.ok) {
          const data = await guestResponse.json();
          if (data.code === 'EMAIL_EXISTS') {
            throw {
              type: 'VALIDATION',
              message: data.error || 'An account with this email already exists. Please sign in instead.',
            };
          }
          throw {
            type: 'UNKNOWN',
            message: data.error || 'Failed to create guest account',
          };
        }

        const { user: guestUser } = await guestResponse.json();
        customerId = guestUser.id;
      } else {
        throw {
          type: 'VALIDATION',
          message: 'User information is required. Please sign in or provide guest information.',
        };
      }

      // Step 2: Create pet if new
      let petId: string;

      if (selectedPet) {
        // Use existing pet
        petId = selectedPet.id;
      } else if (newPetData) {
        // Create new pet
        const petResponse = await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newPetData,
            owner_id: customerId,
          }),
        });

        if (!petResponse.ok) {
          const data = await petResponse.json();
          throw {
            type: 'VALIDATION',
            message: data.error || 'Failed to create pet profile',
          };
        }

        const { pet } = await petResponse.json();
        petId = pet.id;
      } else {
        throw {
          type: 'VALIDATION',
          message: 'Pet selection or creation is required',
        };
      }

      // Step 3: Create appointment
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          pet_id: petId,
          service_id: selectedService.id,
          scheduled_at: `${selectedDate}T${selectedTimeSlot}:00`,
          duration_minutes: selectedService.duration_minutes,
          addon_ids: selectedAddons.map((addon) => addon.id),
          total_price: totalPrice,
        }),
      });

      if (!appointmentResponse.ok) {
        const data = await appointmentResponse.json();

        if (data.code === 'SLOT_CONFLICT') {
          // Handle slot conflict - clear date/time and redirect to step 2
          clearDateTime();
          setStep(2);
          throw {
            type: 'SLOT_CONFLICT',
            message: data.error || 'This time slot is no longer available. Please select another time.',
          };
        }

        throw {
          type: 'UNKNOWN',
          message: data.error || 'Failed to create appointment',
        };
      }

      const result = await appointmentResponse.json();

      // Update store with booking result
      setBookingResult(result.appointment_id, result.reference);

      // Return success result
      return {
        success: true,
        appointmentId: result.appointment_id,
        reference: result.reference,
      };

    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const networkError: BookingError = {
          type: 'NETWORK',
          message: 'Network error. Please check your connection and try again.',
        };
        setError(networkError);
        throw networkError;
      }

      // Handle structured errors
      const bookingError = err as BookingError;
      setError(bookingError);
      throw bookingError;

    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    guestInfo,
    totalPrice,
    isAuthenticated,
    user,
    setBookingResult,
    setStep,
    clearDateTime,
  ]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submit,
    isSubmitting,
    error,
    clearError,
  };
}
