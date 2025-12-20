# Task 0246: Create global error boundary component

**Phase**: 10.3 Error Handling
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Create a global error boundary component to gracefully handle unhandled errors.

## Requirements

- Create `src/app/error.tsx` with user-friendly error UI
- Include "Try Again" button and homepage link
- Display error digest for support reference
- Style with warm cream background matching design system

## Acceptance Criteria

- [ ] Global error.tsx created
- [ ] Shows friendly message instead of technical error
- [ ] Includes Try Again button that resets error
- [ ] Includes link to homepage
- [ ] Shows error digest/ID for support
- [ ] Styled with Clean & Elegant Professional design
- [ ] Works for all unhandled errors

## Implementation Details

### Files to Create

- `src/app/error.tsx`

### Error Page Component

```typescript
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-[#434E54] mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We're sorry for the inconvenience. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
          <a
            href="/"
            className="btn btn-outline w-full"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
```

## References

- **Requirements**: Req 12.1-12.5
- **Design**: Section 10.3.1
