# Task 0251: Integrate Sentry for error tracking

**Phase**: 10.3 Error Handling
**Prerequisites**: None
**Estimated effort**: 2-3 hours

## Objective

Integrate Sentry for production error tracking and monitoring.

## Requirements

- Install @sentry/nextjs and configure
- Create `src/lib/error-tracking/index.ts` with initErrorTracking
- Configure beforeSend to scrub sensitive data (passwords, tokens)
- Set up ignoreErrors for network/browser extension errors

## Acceptance Criteria

- [ ] Sentry installed and configured
- [ ] Errors automatically reported in production
- [ ] Sensitive data scrubbed before sending
- [ ] Network errors and browser extensions ignored
- [ ] Error tracking initialized on app start
- [ ] Source maps configured for readable stack traces

## Implementation Details

### Packages to Install

```bash
npm install @sentry/nextjs
```

### Files to Create

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `src/lib/error-tracking/index.ts`

### Sentry Configuration

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Scrub sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Scrub sensitive form data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      if (data.password) data.password = '[Filtered]';
      if (data.token) data.token = '[Filtered]';
    }

    return event;
  },

  // Ignore known errors
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'Non-Error promise rejection',
    /extension/i, // Browser extensions
  ],
});
```

### Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
```

## References

- **Requirements**: Req 14.1-14.5, 14.9
- **Design**: Section 10.3.3
