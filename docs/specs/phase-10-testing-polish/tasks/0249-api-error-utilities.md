# Task 0249: Create API error response standardization utilities

**Phase**: 10.3 Error Handling
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Create standardized API error utilities with error codes and consistent responses.

## Requirements

- Create `src/lib/api/errors.ts` with ApiErrorCode enum
- Create ApiError class and ApiErrorResponse interface
- Create formatErrorResponse function
- Implement status code mapping for error codes

## Acceptance Criteria

- [ ] ApiErrorCode enum with all error types
- [ ] ApiError class for throwing typed errors
- [ ] ApiErrorResponse interface for consistent shape
- [ ] formatErrorResponse function created
- [ ] Error codes mapped to HTTP status codes
- [ ] Type-safe error handling

## Implementation Details

### Files to Create

- `src/lib/api/errors.ts`

### API Error Utilities

```typescript
export enum ApiErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Business logic errors (409, 422)
  CONFLICT = 'CONFLICT',
  SLOT_UNAVAILABLE = 'SLOT_UNAVAILABLE',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function formatErrorResponse(error: ApiError): ApiErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
    },
  };
}

export function getStatusCodeForError(code: ApiErrorCode): number {
  const statusMap: Record<ApiErrorCode, number> = {
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.INVALID_CREDENTIALS]: 401,
    [ApiErrorCode.SESSION_EXPIRED]: 401,
    [ApiErrorCode.FORBIDDEN]: 403,
    [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.INVALID_INPUT]: 400,
    [ApiErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.SLOT_UNAVAILABLE]: 409,
    [ApiErrorCode.ALREADY_EXISTS]: 409,
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ApiErrorCode.INTERNAL_ERROR]: 500,
    [ApiErrorCode.DATABASE_ERROR]: 500,
    [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 500,
  };

  return statusMap[code] || 500;
}
```

## References

- **Requirements**: Req 13.1-13.2
- **Design**: Section 10.3.2
