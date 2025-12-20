# Task 0250: Create API error handler wrapper

**Phase**: 10.3 Error Handling
**Prerequisites**: 0249
**Estimated effort**: 2-3 hours

## Objective

Create a reusable API error handler wrapper for consistent error handling across all routes.

## Requirements

- Create `src/lib/api/handler.ts` with withErrorHandling wrapper
- Catch ApiError and return formatted response
- Log unexpected errors, return generic 500 for unknown errors
- Never expose stack traces in production

## Acceptance Criteria

- [ ] withErrorHandling wrapper function created
- [ ] ApiError instances return formatted responses
- [ ] Unexpected errors logged to console
- [ ] Stack traces never exposed in production
- [ ] Consistent error format across all API routes
- [ ] Easy to apply to any API route

## Implementation Details

### Files to Create

- `src/lib/api/handler.ts`

### Error Handler Wrapper

```typescript
import { NextResponse } from 'next/server';
import { ApiError, formatErrorResponse, getStatusCodeForError } from './errors';

export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Handle known ApiError
      if (error instanceof ApiError) {
        const status = error.statusCode || getStatusCodeForError(error.code);
        return NextResponse.json(
          formatErrorResponse(error),
          { status }
        );
      }

      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      // Log unexpected errors
      console.error('[API Error]', error);

      // Return generic error in production
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
              ? 'An unexpected error occurred'
              : (error as Error)?.message || 'Unknown error',
          },
        },
        { status: 500 }
      );
    }
  }) as T;
}

// Usage example:
export const GET = withErrorHandling(async (request: Request) => {
  // Your route logic here
  // Throw ApiError for known errors
  throw new ApiError(ApiErrorCode.NOT_FOUND, 'Resource not found');
});
```

## References

- **Requirements**: Req 13.3-13.8, 13.10
- **Design**: Section 10.3.2
