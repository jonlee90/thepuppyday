# Task 0017: Implement view tracking and expiration ✅

**Group**: Report Card System - Public Page (Week 1-2)
**Status**: COMPLETED
**Completed**: 2025-12-13

## Objective
Track report card views and handle expiration

## Files to create/modify
- `src/app/api/report-cards/[uuid]/route.ts` ✅

## Requirements covered
- REQ-6.2.1 ✅

## Acceptance criteria
- view_count incremented on each view ✅
- last_viewed_at timestamp updated ✅
- 410 Gone returned for expired report cards ✅
- Expiration configurable (default 90 days) ✅

## Implementation Details
- Uses increment_report_card_views RPC function
- Fire-and-forget async tracking (doesn't block response)
- Checks expires_at field against current timestamp
- Returns 410 Gone status for expired cards
- Draft cards are filtered out (only published cards accessible)
- Joined query for efficient data fetching
