# Task 0244: Configure Security Headers

## Description
Configure comprehensive security headers in Next.js to protect against common web vulnerabilities.

## Checklist
- [ ] Add security headers to `next.config.mjs` headers() function
- [ ] Configure Content-Security-Policy with Stripe, Supabase, Google domains
- [ ] Add X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] Add Strict-Transport-Security and Permissions-Policy headers

## Acceptance Criteria
All security headers present in responses, CSP allows required external scripts

## References
- Requirement 11 (Security Headers)
- Design 10.2.5

## Files to Create/Modify
- `next.config.mjs`

## Implementation Notes
CSP configuration partially exists. Need to verify and complete with all required domains.
