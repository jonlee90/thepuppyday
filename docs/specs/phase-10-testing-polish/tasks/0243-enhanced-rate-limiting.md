# Task 0243: Enhance rate limiting with predefined configurations

**Phase**: 10.2 Security
**Prerequisites**: None
**Estimated effort**: 3-4 hours

## Objective

Enhance the existing rate limiting system with endpoint-specific configurations and better feedback.

## Requirements

- Create RATE_LIMITS object with configs for different endpoint types
- Implement sliding window algorithm
- Add Retry-After header and X-RateLimit-* headers
- Log rate limit hits with IP and endpoint

## Acceptance Criteria

- [ ] Rate limits configured per endpoint type
- [ ] Auth endpoints limited to 5/min
- [ ] Booking endpoints limited to 10/min
- [ ] Availability endpoints limited to 30/min
- [ ] Waitlist endpoints limited to 5/min
- [ ] Admin endpoints limited to 100/min
- [ ] Webhook endpoints limited to 500/min
- [ ] Retry-After header included in 429 responses
- [ ] X-RateLimit-Limit and X-RateLimit-Remaining headers sent
- [ ] Rate limit violations logged

## Implementation Details

### Files to Create/Modify

- `src/lib/rate-limit.ts` - Enhance existing rate limiter

### Rate Limit Configurations

```typescript
export const RATE_LIMITS = {
  auth: { requests: 5, window: 60 }, // 5 per minute
  booking: { requests: 10, window: 60 }, // 10 per minute
  availability: { requests: 30, window: 60 }, // 30 per minute
  waitlist: { requests: 5, window: 60 }, // 5 per minute
  admin: { requests: 100, window: 60 }, // 100 per minute
  webhook: { requests: 500, window: 60 }, // 500 per minute
  default: { requests: 20, window: 60 }, // 20 per minute
};
```

## References

- **Requirements**: Req 9.1-9.10
- **Design**: Section 10.2.4
