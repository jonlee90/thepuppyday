# Task 0017: Implement view tracking and expiration

**Group**: Report Card System - Public Page (Week 1-2)

## Objective
Track report card views and handle expiration

## Files to create/modify
- `src/app/api/report-cards/[uuid]/route.ts`

## Requirements covered
- REQ-6.2.1

## Acceptance criteria
- view_count incremented on each view
- last_viewed_at timestamp updated
- 410 Gone returned for expired report cards
- Expiration configurable (default 90 days)
