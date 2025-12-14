# Task 0063: Create NotificationCenter page at `/admin/notifications`

**Group**: Notification Center (Week 4)

## Objective
Build notification history page

## Files to create/modify
- `src/app/(admin)/notifications/page.tsx`
- `src/components/admin/notifications/NotificationCenter.tsx`
- `src/app/api/admin/notifications/route.ts`

## Requirements covered
- REQ-6.17.1

## Acceptance criteria
- Page at `/admin/notifications`
- Lists all sent notifications (SMS + Email)
- Table: Type icon, Recipient, Subject/Preview, Status, Timestamp, Actions
- Pagination: 50 per page
