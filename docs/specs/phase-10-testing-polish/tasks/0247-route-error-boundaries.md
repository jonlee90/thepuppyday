# Task 0247: Create route-specific error boundaries

**Phase**: 10.3 Error Handling
**Prerequisites**: 0246
**Estimated effort**: 2-3 hours

## Objective

Create route-specific error boundaries for different sections of the application.

## Requirements

- Create `src/app/(customer)/error.tsx` with portal layout preserved
- Create `src/app/(admin)/error.tsx` with admin-specific messaging
- Create `src/app/(auth)/error.tsx` with retry focus
- Create `src/app/(marketing)/error.tsx` for public pages

## Acceptance Criteria

- [ ] Customer portal error boundary preserves navigation
- [ ] Admin error boundary shows admin-specific help
- [ ] Auth error boundary focuses on retry/login
- [ ] Marketing error boundary encourages browsing
- [ ] Each error boundary styled appropriately
- [ ] Layout/navigation preserved where appropriate

## Implementation Details

### Files to Create

- `src/app/(customer)/error.tsx`
- `src/app/(admin)/error.tsx`
- `src/app/(auth)/error.tsx`
- `src/app/(marketing)/error.tsx`

### Customer Portal Error Example

```typescript
export default function CustomerError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-[#434E54] mb-4">
          Unable to Load Your Account
        </h2>
        <p className="text-gray-600 mb-6">
          We're having trouble loading your information. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

## References

- **Requirements**: Req 12.6-12.7
- **Design**: Section 10.3.1
