# Task 0252: Configure Sentry context and source maps

**Phase**: 10.3 Error Handling
**Prerequisites**: 0251
**Estimated effort**: 2 hours

## Objective

Configure Sentry to include useful context with errors and enable source map uploads.

## Requirements

- Add user context (id, email) to error reports
- Add request context (URL, method, parameters)
- Configure source map uploads for readable stack traces
- Include release version for regression tracking

## Acceptance Criteria

- [ ] User ID and email included in error reports (when available)
- [ ] Request URL, method, params included
- [ ] Source maps uploaded to Sentry
- [ ] Release version included in errors
- [ ] Stack traces readable and point to original code
- [ ] Context helps with debugging

## Implementation Details

### Files to Modify

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `next.config.mjs` - Add Sentry webpack plugin

### Adding Context

```typescript
import { setUser, setContext } from '@sentry/nextjs';

// In auth context/middleware
export function setSentryUser(user: { id: string; email: string }) {
  setUser({
    id: user.id,
    email: user.email,
  });
}

// In API routes
export function setSentryRequestContext(request: Request) {
  setContext('request', {
    url: request.url,
    method: request.method,
    headers: {
      'user-agent': request.headers.get('user-agent'),
    },
  });
}
```

### Source Maps Configuration

In `next.config.mjs`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'your-org',
    project: 'thepuppyday',
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

## References

- **Requirements**: Req 14.2-14.3, 14.7, 14.10
- **Design**: Section 10.3.3
