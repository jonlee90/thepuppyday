# Task 21: Implement Error Handling UI Patterns

## Description
Add consistent error handling UI patterns across all booking step components, including field validation, API errors, and toast notifications.

## Files to modify/create
- `src/components/booking/ui/ErrorMessage.tsx`
- `src/components/booking/ui/FieldError.tsx`
- `src/components/booking/ui/ErrorAlert.tsx`
- Update all step components

## Requirements References
- Req 12.1: Highlight field and display descriptive error message for empty required fields
- Req 12.5: Display friendly error message with retry option on server failure
- Req 12.6: Preserve all entered data when returning to form after error

## Implementation Details

### ErrorMessage Component (Field-level)
```typescript
interface ErrorMessageProps {
  message?: string;
  id?: string;
}

export function FieldError({ message, id }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="text-error text-sm mt-1 flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </p>
  );
}
```

### ErrorAlert Component (Section-level)
```typescript
interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({ title, message, onRetry, onDismiss }: ErrorAlertProps) {
  return (
    <div className="alert alert-error" role="alert">
      <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        {title && <h3 className="font-medium">{title}</h3>}
        <p className="text-sm">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-sm btn-ghost">
            Retry
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
```

### Toast Notifications (using react-hot-toast or DaisyUI toast)
```typescript
// src/lib/toast.ts
import toast from 'react-hot-toast';

export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-center',
  });
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  });
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    position: 'top-center',
  });
};
```

### Form Input with Error State
```typescript
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required, id, ...props }: FormInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;

  return (
    <div className="form-control">
      <label htmlFor={inputId} className="label">
        <span className="label-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <input
        id={inputId}
        className={cn(
          'input input-bordered',
          error && 'input-error'
        )}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      <FieldError message={error} id={errorId} />
    </div>
  );
}
```

### Error Recovery Pattern
```typescript
// In step components
const [apiError, setApiError] = useState<string | null>(null);

const handleRetry = () => {
  setApiError(null);
  refetch(); // Re-attempt the failed operation
};

// Render
{apiError && (
  <ErrorAlert
    title="Unable to load data"
    message={apiError}
    onRetry={handleRetry}
  />
)}
```

### Network Error Handler
```typescript
// src/lib/api-error-handler.ts
export function handleApiError(error: unknown): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (error instanceof Response) {
    if (error.status === 409) {
      return 'This action conflicts with existing data. Please refresh and try again.';
    }
    if (error.status >= 500) {
      return 'Something went wrong on our end. Please try again in a moment.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}
```

## Acceptance Criteria
- [ ] FieldError component displays error with icon
- [ ] ErrorAlert component shows error with optional retry/dismiss
- [ ] Form inputs highlight with red border on error
- [ ] Toast notifications for transient errors
- [ ] All errors have descriptive, user-friendly messages
- [ ] Network errors show connection-related message
- [ ] Server errors show "try again" message
- [ ] Retry buttons re-attempt failed operations
- [ ] Form data preserved when errors occur
- [ ] ARIA attributes for accessibility (role="alert", aria-invalid)

## Estimated Complexity
Medium

## Phase
Phase 6: Form Validation & Error Handling

## Dependencies
- Task 20 (validation schemas)
- All step component tasks (14-18)
