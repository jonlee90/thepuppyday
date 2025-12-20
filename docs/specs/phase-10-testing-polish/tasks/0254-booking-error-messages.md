# Task 0254: Implement error message display in booking flow

**Phase**: 10.3 Error Handling
**Prerequisites**: 0253
**Estimated effort**: 2 hours

## Objective

Implement user-friendly error messages in the booking flow with specific guidance.

## Requirements

- Update booking form to use getUserFriendlyMessage
- Show specific messages for slot unavailable, suggesting alternatives
- Handle payment errors with provider's user-friendly message
- Guide users to resolve errors

## Acceptance Criteria

- [ ] Booking form shows friendly error messages
- [ ] Slot unavailable error suggests alternative times
- [ ] Payment errors are clear and actionable
- [ ] Network errors handled gracefully
- [ ] Validation errors shown per field
- [ ] Success messages also friendly and clear

## Implementation Details

### Files to Modify

- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/steps/PaymentStep.tsx`
- `src/hooks/useBooking.ts`

### Error Handling in Booking

```typescript
import { getUserFriendlyMessage, getNetworkErrorMessage } from '@/lib/errors/user-messages';
import { ApiErrorCode } from '@/lib/api/errors';

// In booking hook
try {
  await createBooking(bookingData);
  showSuccess('Your appointment has been booked! We'll send you a confirmation email.');
} catch (error) {
  if (error.code === ApiErrorCode.SLOT_UNAVAILABLE) {
    // Show specific message with alternatives
    showError(
      'This time slot is no longer available.',
      {
        action: 'View Available Times',
        onClick: () => setStep('datetime'),
      }
    );
  } else if (error instanceof TypeError && error.message.includes('fetch')) {
    showError(getNetworkErrorMessage(error));
  } else {
    showError(getUserFriendlyMessage(error.code));
  }
}
```

### Payment Error Handling

```typescript
// In PaymentStep
try {
  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/booking/confirmation`,
    },
  });

  if (error) {
    // Use Stripe's message if available, otherwise use our mapping
    showError(
      error.message || getUserFriendlyMessage(ApiErrorCode.EXTERNAL_SERVICE_ERROR)
    );
  }
} catch (error) {
  showError('We couldn't process your payment. Please try again or use a different payment method.');
}
```

## References

- **Requirements**: Req 15.2-15.3, 15.10
- **Design**: Section 10.3.4
