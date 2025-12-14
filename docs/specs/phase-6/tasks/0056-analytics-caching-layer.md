# Task 0056: Create analytics caching layer

**Group**: Analytics Dashboard (Week 3-4)

## Objective
Implement 15-minute cache for analytics queries

## Files to create/modify
- `src/lib/admin/analytics-cache.ts`
- `src/app/api/cron/analytics-refresh/route.ts`

## Requirements covered
- REQ-6.10.1

## Acceptance criteria
- Check analytics_cache table before computing
- Return cached data if not expired
- Compute and cache new data if expired
- 15-minute cache TTL
- Cron job to pre-warm common date ranges
