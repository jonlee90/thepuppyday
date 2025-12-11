# Task 13: Implement useBookingSubmit Hook

## Description
Create a hook that handles the appointment creation flow, including API calls, error handling, and conflict recovery.

## Files to create
- `src/hooks/useBookingSubmit.ts`

## Requirements References
- Req 6.5: Create appointment record with "pending" status
- Req 12.4: Alert user and redirect to date/time selection if slot becomes unavailable
- Req 12.5: Display friendly error message with retry option if server fails

## Implementation Details

### Hook Interface
```typescript
interface UseBookingSubmitReturn {
  submit: () => Promise<BookingResult>;
  isSubmitting: boolean;
  error: BookingError | null;
  clearError: () => void;
}

interface BookingResult {
  success: true;
  appointmentId: string;
  reference: string;
}

interface BookingError {
  type: 'SLOT_CONFLICT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
  message: string;
}
```

### Implementation
```typescript
import { useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';

export function useBookingSubmit(): UseBookingSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<BookingError | null>(null);

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

  const submit = async (): Promise<BookingResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create guest user if needed
      let customerId: string;
      if (guestInfo) {
        const guestResponse = await fetch('/api/users/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestInfo),
        });

        if (!guestResponse.ok) {
          const data = await guestResponse.json();
          if (data.code === 'EMAIL_EXISTS') {
            throw { type: 'VALIDATION', message: data.error };
          }
          throw { type: 'UNKNOWN', message: 'Failed to create guest account' };
        }

        const { user } = await guestResponse.json();
        customerId = user.id;
      } else {
        // Get from auth context
        customerId = getCurrentUserId();
      }

      // Step 2: Create pet if new
      let petId: string;
      if (selectedPet) {
        petId = selectedPet.id;
      } else if (newPetData) {
        const petResponse = await fetch('/api/pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newPetData, owner_id: customerId }),
        });

        if (!petResponse.ok) {
          throw { type: 'VALIDATION', message: 'Failed to create pet profile' };
        }

        const { pet } = await petResponse.json();
        petId = pet.id;
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
          addon_ids: selectedAddons.map(a => a.id),
          total_price: totalPrice,
        }),
      });

      if (!appointmentResponse.ok) {
        const data = await appointmentResponse.json();
        if (data.code === 'SLOT_CONFLICT') {
          // Handle conflict - redirect to date/time step
          clearDateTime();
          setStep(2);
          throw { type: 'SLOT_CONFLICT', message: data.error };
        }
        throw { type: 'UNKNOWN', message: data.error || 'Failed to create appointment' };
      }

      const result = await appointmentResponse.json();

      // Update store with result
      setBookingResult(result.appointment_id, result.reference);

      return {
        success: true,
        appointmentId: result.appointment_id,
        reference: result.reference,
      };

    } catch (err) {
      const bookingError = err as BookingError;
      setError(bookingError);
      throw bookingError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return { submit, isSubmitting, error, clearError };
}
```

## Acceptance Criteria
- [x] Creates guest user if guestInfo is present in store
- [x] Creates pet if newPetData is present in store
- [x] Creates appointment with all required data
- [x] Handles SLOT_CONFLICT error by redirecting to date/time step
- [x] Handles EMAIL_EXISTS error from guest user creation
- [x] Handles network errors with friendly message
- [x] Updates booking store with result on success
- [x] Exposes isSubmitting state for loading UI
- [x] Exposes error state for error display
- [x] Provides clearError function

## Estimated Complexity
High

## Phase
Phase 3: Booking Page & Integration

## Dependencies
- Task 7 (pets API)
- Task 8 (appointments API)
- Task 10 (guest user API)

## Implementation Notes
**Status:** ✅ Completed

**File Created:**
- `src/hooks/useBookingSubmit.ts` - Full implementation with comprehensive error handling

**Key Features Implemented:**
1. **Multi-step booking flow:**
   - Guest user creation (if not authenticated)
   - Pet creation (if new pet)
   - Appointment creation with addons

2. **Comprehensive error handling:**
   - SLOT_CONFLICT: Clears date/time and redirects to step 2
   - VALIDATION: User-friendly messages for missing/invalid data
   - NETWORK: Network connectivity issues
   - UNKNOWN: Fallback for unexpected errors

3. **Authentication integration:**
   - Uses `useAuth` hook to check authentication status
   - Supports both authenticated and guest flows
   - Handles EMAIL_EXISTS error for duplicate guest accounts

4. **State management:**
   - Integrates with `useBookingStore` for all booking data
   - Updates store with booking result on success
   - Provides loading and error states for UI feedback

5. **TypeScript safety:**
   - Full type definitions for all interfaces
   - Proper error categorization
   - Type-safe API request/response handling

**Error Recovery:**
- SLOT_CONFLICT automatically clears conflicting selection and returns user to date/time step
- All errors are categorized for appropriate UI handling
- Network errors are detected and reported separately
