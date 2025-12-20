# Task 0241: Implement CSRF protection middleware

**Phase**: 10.2 Security
**Prerequisites**: None
**Estimated effort**: 3-4 hours

## Objective

Implement CSRF protection for all state-changing API routes.

## Requirements

- Create `src/lib/security/csrf.ts` with validateCsrf function
- Check Origin header against allowed domains
- Fall back to Referer header validation
- Create withCsrfProtection wrapper for API routes

## Acceptance Criteria

- [ ] CSRF validation function created
- [ ] Origin header validated against allowed list
- [ ] Referer header used as fallback
- [ ] Returns 403 for failed CSRF validation
- [ ] Applied to all POST/PUT/DELETE/PATCH routes
- [ ] GET requests not affected by CSRF checks

## Implementation Details

### Files to Create

- `src/lib/security/csrf.ts`

### CSRF Validation Function

```typescript
export async function validateCsrf(request: Request): Promise<boolean> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://thepuppyday.com',
    'https://www.thepuppyday.com',
  ];

  // Check Origin header
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  // Fall back to Referer header
  const referer = request.headers.get('referer');
  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed))) {
    return true;
  }

  return false;
}

export function withCsrfProtection(handler: Function) {
  return async (request: Request) => {
    if (request.method !== 'GET') {
      const isValid = await validateCsrf(request);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }
    return handler(request);
  };
}
```

## References

- **Requirements**: Req 8.1-8.4, 8.8
- **Design**: Section 10.2.3
