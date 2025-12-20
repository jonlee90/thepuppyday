# Task 0245: Configure Content-Security-Policy header

**Phase**: 10.2 Security
**Prerequisites**: 0244
**Estimated effort**: 3 hours

## Objective

Configure Content Security Policy header allowing necessary third-party integrations while preventing XSS.

## Requirements

- Configure CSP with script-src allowing self and js.stripe.com
- Allow style-src for self and fonts.googleapis.com
- Allow connect-src for supabase and api.stripe.com
- Allow frame-src for js.stripe.com

## Acceptance Criteria

- [ ] CSP configured in Next.js headers
- [ ] script-src allows self and Stripe
- [ ] style-src allows self and Google Fonts
- [ ] connect-src allows Supabase and Stripe API
- [ ] frame-src allows Stripe iframe
- [ ] img-src allows self, data:, and cdn domains
- [ ] Stripe checkout still functional
- [ ] Supabase still functional
- [ ] No CSP violations in console

## Implementation Details

### Files to Modify

- `next.config.mjs` - Add CSP header

### CSP Configuration

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; ')
}
```

### Testing

- Test Stripe checkout flow
- Test Supabase auth
- Check browser console for CSP violations
- Use CSP validator tool

## References

- **Requirements**: Req 11.6-11.8
- **Design**: Section 10.2.5
