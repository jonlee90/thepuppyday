# useBookingSubmit Hook - Usage Guide

## Overview

The `useBookingSubmit` hook handles the complete appointment booking submission flow, including guest user creation, pet creation, and appointment creation with comprehensive error handling.

## Installation

```typescript
import { useBookingSubmit } from '@/hooks';
// or
import { useBookingSubmit } from '@/hooks/useBookingSubmit';
```

## Basic Usage

```tsx
import { useBookingSubmit } from '@/hooks';

function BookingReviewStep() {
  const { submit, isSubmitting, error, clearError } = useBookingSubmit();

  const handleSubmit = async () => {
    try {
      const result = await submit();
      console.log('Booking created:', result.reference);
      // Navigate to confirmation page
    } catch (err) {
      // Error is already stored in hook state
      console.error('Booking failed:', err);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? 'Booking...' : 'Confirm Booking'}
      </button>
    </div>
  );
}
```

## API Reference

### Return Values

```typescript
interface UseBookingSubmitReturn {
  submit: () => Promise<BookingResult>;
  isSubmitting: boolean;
  error: BookingError | null;
  clearError: () => void;
}
```

#### `submit()`
Submits the booking with data from the booking store.

**Returns:** `Promise<BookingResult>`

**Throws:** `BookingError` on failure

**Example:**
```typescript
const result = await submit();
// result.success === true
// result.appointmentId === "uuid"
// result.reference === "APT-20250101-ABC123"
```

#### `isSubmitting`
Boolean flag indicating if submission is in progress. Use this to disable UI elements during submission.

**Example:**
```tsx
<button disabled={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Book Now'}
</button>
```

#### `error`
Current error state if submission failed. `null` if no error.

**Type:** `BookingError | null`

**Example:**
```tsx
{error && (
  <div className="alert alert-error">
    {error.type === 'SLOT_CONFLICT' && (
      <p>Time slot no longer available. Please select another time.</p>
    )}
    {error.type === 'VALIDATION' && (
      <p>{error.message}</p>
    )}
    {error.type === 'NETWORK' && (
      <p>Network error. Please check your connection.</p>
    )}
  </div>
)}
```

#### `clearError()`
Clears the current error state.

**Example:**
```typescript
clearError(); // error is now null
```

## Types

### BookingResult

```typescript
interface BookingResult {
  success: true;
  appointmentId: string;    // UUID of created appointment
  reference: string;        // Human-readable reference (e.g., "APT-20250101-ABC123")
}
```

### BookingError

```typescript
interface BookingError {
  type: 'SLOT_CONFLICT' | 'VALIDATION' | 'NETWORK' | 'UNKNOWN';
  message: string;
}
```

#### Error Types

| Type | Description | User Action |
|------|-------------|-------------|
| `SLOT_CONFLICT` | Selected time slot is no longer available | Hook automatically clears date/time and redirects to step 2 |
| `VALIDATION` | Missing or invalid data (e.g., EMAIL_EXISTS) | Display message to user, allow correction |
| `NETWORK` | Network connectivity issue | Display retry option |
| `UNKNOWN` | Unexpected server error | Display generic error with retry option |

## Booking Flow

The hook performs the following steps in sequence:

### 1. Validation
Validates all required booking data from the store:
- Service selection
- Pet size
- Date and time

### 2. Guest User Creation (if needed)
If user is not authenticated and `guestInfo` is present:
- POST to `/api/users/guest`
- Handles `EMAIL_EXISTS` error
- Returns `customerId`

### 3. Pet Creation (if needed)
If `newPetData` is present (new pet):
- POST to `/api/pets`
- Associates with `customerId`
- Returns `petId`

### 4. Appointment Creation
- POST to `/api/appointments`
- Includes service, pet, date/time, addons, and total price
- Handles `SLOT_CONFLICT` by clearing date/time and redirecting
- Returns appointment details

### 5. Store Update
On success:
- Updates booking store with `appointmentId` and `reference`
- Advances to confirmation step (step 5)

## Error Handling Examples

### Handle Slot Conflict
```typescript
try {
  await submit();
} catch (err) {
  if (err.type === 'SLOT_CONFLICT') {
    // Hook already cleared date/time and returned to step 2
    // Just show message to user
    toast.error('Time slot no longer available. Please select another time.');
  }
}
```

### Handle Email Exists
```typescript
try {
  await submit();
} catch (err) {
  if (err.type === 'VALIDATION' && err.message.includes('email')) {
    // Suggest user to sign in instead
    setShowSignInPrompt(true);
  }
}
```

### Handle Network Error
```typescript
try {
  await submit();
} catch (err) {
  if (err.type === 'NETWORK') {
    // Show retry option
    setShowRetry(true);
  }
}
```

### Generic Error Handling
```typescript
const handleSubmit = async () => {
  try {
    const result = await submit();
    router.push(`/booking/confirmation?ref=${result.reference}`);
  } catch (err) {
    // Error is already in hook state
    // Just scroll to error message
    errorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
};
```

## Integration with Booking Store

The hook automatically reads from and writes to the booking store:

### Required Store State
```typescript
{
  selectedService: ServiceWithPrices;
  petSize: PetSize;
  selectedDate: string;
  selectedTimeSlot: string;
  // Plus one of:
  selectedPet: Pet;          // Existing pet
  newPetData: CreatePetInput; // New pet
  // And either:
  user: User;                // Authenticated user
  guestInfo: GuestInfo;      // Guest user data
}
```

### Updated Store State (on success)
```typescript
{
  bookingId: string;
  bookingReference: string;
  currentStep: 5; // Confirmation step
}
```

## Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookingSubmit } from '@/hooks/useBookingSubmit';

describe('useBookingSubmit', () => {
  it('should submit booking successfully', async () => {
    const { result } = renderHook(() => useBookingSubmit());

    await act(async () => {
      const bookingResult = await result.current.submit();
      expect(bookingResult.success).toBe(true);
      expect(bookingResult.appointmentId).toBeDefined();
      expect(bookingResult.reference).toBeDefined();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle slot conflict', async () => {
    // Mock API to return SLOT_CONFLICT
    const { result } = renderHook(() => useBookingSubmit());

    await act(async () => {
      try {
        await result.current.submit();
      } catch (err) {
        expect(err.type).toBe('SLOT_CONFLICT');
      }
    });

    expect(result.current.error?.type).toBe('SLOT_CONFLICT');
  });
});
```

## Best Practices

1. **Always handle errors:** Use try/catch or check the `error` state
2. **Disable UI during submission:** Use `isSubmitting` to prevent double-submissions
3. **Clear errors appropriately:** Call `clearError()` when user takes corrective action
4. **Provide user feedback:** Show loading states and clear error messages
5. **Test error scenarios:** Ensure all error types are handled in UI

## Related Hooks

- `useBookingStore` - Provides booking data and state management
- `useAuth` - Provides authentication state
- `useServices` - Fetches available services
- `usePets` - Fetches user's pets
- `useAvailability` - Checks time slot availability
