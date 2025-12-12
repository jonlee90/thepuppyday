# Task 0009: Create ActivityFeed component

**Group**: Dashboard (Week 2)

## Objective
Build recent activity feed from notifications_log

## Files to create/modify
- `src/components/admin/dashboard/ActivityFeed.tsx` - Activity feed widget
- `src/app/api/admin/dashboard/activity/route.ts` - Activity feed endpoint

## Requirements covered
- REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5, REQ-6.6, REQ-6.7, REQ-6.8

## Acceptance criteria
- [x] Displays 10 most recent activities
- [x] Shows icon, message, timestamp, related entity
- [x] Relative time for <5 min ("2 minutes ago"), formatted time otherwise
- [x] Type-specific icons: calendar, x-circle, alert-triangle, user-plus, dollar-sign
- [x] Click navigates to related detail page
- [x] "No recent activity" when empty
- [x] Slide-down animation for new real-time activities

## Implementation Notes
**Completed**: 2025-12-12

**Files Implemented**:
- `src/components/admin/dashboard/ActivityFeed.tsx` - Activity feed component
- `src/app/api/admin/dashboard/activity/route.ts` - Activity API endpoint

**Key Features**:
- ✅ Displays 10 most recent entries from `notifications_log` table
- ✅ Type-specific icons mapping:
  - `appointment_created`, `appointment_confirmed` → Calendar
  - `appointment_cancelled` → XCircle
  - `appointment_reminder` → AlertTriangle
  - `customer_registered` → UserPlus
  - `payment_received` → DollarSign
  - Default → Activity
- ✅ Smart timestamp formatting:
  - <5 minutes: "2 minutes ago" (relative time using `formatDistanceToNow`)
  - ≥5 minutes: "3:45 PM" (formatted time)
- ✅ Clickable links to customer profile when `customer_id` available
- ✅ Empty state with Activity icon and descriptive message
- ✅ Slide-down animation (`animation: slideDown 0.3s ease-out`)
- ✅ Hover effect with warm cream background (#F8EEE5)
- ✅ Failed status indicator (red text) when `status='failed'`

**Data Source**:
- Table: `notifications_log`
- Sort: `created_at DESC`
- Limit: 10 entries
- Fields: `id`, `type`, `subject`, `content`, `customer_id`, `status`, `created_at`
