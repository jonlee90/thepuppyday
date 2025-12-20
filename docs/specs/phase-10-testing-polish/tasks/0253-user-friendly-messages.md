# Task 0253: Create user-friendly error message mapping

**Phase**: 10.3 Error Handling
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Create a mapping system to translate technical errors into user-friendly messages.

## Requirements

- Create `src/lib/errors/user-messages.ts` with errorMessages mapping
- Map network errors, auth errors, booking errors, payment errors
- Create getUserFriendlyMessage function
- Create getFieldErrorMessage for form validation

## Acceptance Criteria

- [ ] Error message mapping created for all error types
- [ ] Messages are non-technical and actionable
- [ ] Network errors have friendly messages
- [ ] Auth errors guide users to resolve
- [ ] Booking errors suggest alternatives
- [ ] Payment errors are clear and reassuring
- [ ] Form validation errors are field-specific

## Implementation Details

### Files to Create

- `src/lib/errors/user-messages.ts`

### Error Message Mapping

```typescript
import { ApiErrorCode } from '@/lib/api/errors';

export const errorMessages: Record<ApiErrorCode, string> = {
  // Authentication
  [ApiErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ApiErrorCode.INVALID_CREDENTIALS]: 'Email or password is incorrect. Please try again.',
  [ApiErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

  // Authorization
  [ApiErrorCode.FORBIDDEN]: 'You don't have permission to access this.',
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don't have permission to perform this action.',

  // Validation
  [ApiErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ApiErrorCode.INVALID_INPUT]: 'Some information is incorrect. Please review and try again.',
  [ApiErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',

  // Resources
  [ApiErrorCode.NOT_FOUND]: 'We couldn't find what you're looking for.',
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 'This item no longer exists.',

  // Business logic
  [ApiErrorCode.CONFLICT]: 'This action couldn't be completed due to a conflict.',
  [ApiErrorCode.SLOT_UNAVAILABLE]: 'This time slot is no longer available. Please choose another time.',
  [ApiErrorCode.ALREADY_EXISTS]: 'This already exists. Please use a different value.',

  // Rate limiting
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',

  // Server errors
  [ApiErrorCode.INTERNAL_ERROR]: 'Something went wrong on our end. Please try again.',
  [ApiErrorCode.DATABASE_ERROR]: 'We're having trouble saving your information. Please try again.',
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 'A service we depend on is unavailable. Please try again later.',
};

export function getUserFriendlyMessage(
  code: ApiErrorCode,
  defaultMessage?: string
): string {
  return errorMessages[code] || defaultMessage || 'An unexpected error occurred.';
}

export function getFieldErrorMessage(field: string, error: string): string {
  const fieldMessages: Record<string, Record<string, string>> = {
    email: {
      required: 'Email address is required',
      invalid: 'Please enter a valid email address',
    },
    phone: {
      required: 'Phone number is required',
      invalid: 'Please enter a valid phone number in format (XXX) XXX-XXXX',
    },
    password: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters',
    },
    // Add more fields as needed
  };

  return fieldMessages[field]?.[error] || error;
}

// Network error messages
export function getNetworkErrorMessage(error: Error): string {
  if (error.message.includes('Failed to fetch')) {
    return 'Please check your internet connection and try again.';
  }
  if (error.message.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }
  return 'A network error occurred. Please check your connection.';
}
```

## References

- **Requirements**: Req 15.1-15.10
- **Design**: Section 10.3.4
