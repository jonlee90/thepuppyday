# Task 0046: Implement campaign send functionality

**Group**: Retention Marketing - Campaign Builder (Week 3)

## Objective
Build campaign execution with queue processing

## Files to create/modify
- `src/app/api/admin/campaigns/[id]/send/route.ts`
- `src/lib/admin/campaign-sender.ts`

## Requirements covered
- REQ-6.9.1
- REQ-6.9.3

## Acceptance criteria
- Get audience based on segment criteria
- Create campaign_sends records for each customer
- Check unsubscribe status before sending
- Queue notifications for background processing
- Update campaign status: draft → scheduled → sending → sent
- Track: sent count, delivered count
