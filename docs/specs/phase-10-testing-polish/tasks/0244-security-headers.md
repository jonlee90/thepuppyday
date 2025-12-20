# Task 0244: Configure security headers in Next.js

**Phase**: 10.2 Security
**Prerequisites**: None
**Estimated effort**: 2 hours

## Objective

Configure essential security headers in Next.js middleware and configuration.

## Requirements

- Add X-DNS-Prefetch-Control, Strict-Transport-Security
- Add X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff
- Add Referrer-Policy: strict-origin-when-cross-origin
- Add Permissions-Policy limiting camera, microphone, geolocation

## Acceptance Criteria

- [ ] All security headers present on responses
- [ ] HSTS header configured with 1-year max-age
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing
- [ ] Permissions-Policy restricts sensitive features
- [ ] Headers verified with security scanner

## Implementation Details

### Files to Modify

- `next.config.mjs` - Add headers configuration

### Security Headers Configuration

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ]
    }
  ];
}
```

## References

- **Requirements**: Req 11.1-11.5
- **Design**: Section 10.2.5
