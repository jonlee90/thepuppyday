# Task 0242: Configure secure cookie settings

**Phase**: 10.2 Security
**Prerequisites**: 0241
**Estimated effort**: 2 hours

## Objective

Configure secure cookie settings for authentication and session management.

## Requirements

- Set SameSite to Strict or Lax on auth cookies
- Set Secure and HttpOnly flags in production
- Return 403 for failed CSRF validation
- Document cookie configuration

## Acceptance Criteria

- [ ] SameSite=Lax set on all auth cookies
- [ ] Secure flag set in production
- [ ] HttpOnly flag set on session cookies
- [ ] Cookies not accessible via JavaScript
- [ ] CSRF validation returns 403 on failure
- [ ] Cookie configuration documented

## Implementation Details

### Files to Modify

- `src/lib/supabase/server.ts` - Supabase client cookie config
- `src/lib/security/csrf.ts` - Add 403 response

### Cookie Configuration

```typescript
const cookieOptions = {
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
```

## References

- **Requirements**: Req 8.3, 8.5, 8.7
- **Design**: Section 10.2.3
