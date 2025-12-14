# Task 0039: Reminder Conversion Tracking - Quick Reference

## What Was Built

Conversion tracking system to measure ROI of breed reminder campaigns.

## Files Created

1. **`src/lib/admin/reminder-analytics.ts`** (455 lines)
   - `getReminderStats()` - Overall campaign metrics
   - `getReminderStatsByBreed()` - Breed-specific breakdown
   - `linkBookingToReminder()` - Attribution linking

2. **`src/app/api/track/[trackingId]/route.ts`** (84 lines)
   - Click tracking redirect endpoint
   - Updates `notifications_log.clicked_at`
   - Redirects to `/book?tracking_id=...`

## How It Works

```
1. Scheduler sends reminder → Creates campaign_send + notifications_log
2. Customer clicks link → /api/track/{trackingId}
3. Endpoint logs click → Updates clicked_at timestamp
4. Redirects to booking → /book?tracking_id={trackingId}
5. Customer books → linkBookingToReminder() called
6. Links conversion → campaign_sends.booking_id updated
7. Analytics report → Metrics calculated from data
```

## Key Functions

### Get Overall Stats

```typescript
import { getReminderStats } from '@/lib/admin/reminder-analytics';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const supabase = await createServerSupabaseClient();
const stats = await getReminderStats(
  supabase,
  '2024-01-01',
  '2024-12-31'
);

// Returns:
// {
//   totalSent: 150,
//   totalClicked: 75,
//   totalConverted: 25,
//   clickRate: 50.0,
//   conversionRate: 16.67,
//   avgDaysToConversion: 3.2,
//   totalRevenue: 2500,
//   avgRevenuePerConversion: 100
// }
```

### Get Breed Breakdown

```typescript
import { getReminderStatsByBreed } from '@/lib/admin/reminder-analytics';

const breedStats = await getReminderStatsByBreed(
  supabase,
  '2024-01-01',
  '2024-12-31'
);

// Returns array:
// [
//   {
//     breedId: "uuid",
//     breedName: "Golden Retriever",
//     totalSent: 50,
//     clickRate: 45.0,
//     conversionRate: 20.0,
//     totalRevenue: 1000
//   },
//   ...
// ]
```

### Link Booking to Reminder

```typescript
import { linkBookingToReminder } from '@/lib/admin/reminder-analytics';

// Call after creating appointment
await linkBookingToReminder(
  supabase,
  customerId,      // string
  appointmentId,   // string
  scheduledAt      // ISO date string
);

// Finds most recent reminder within 30 days
// Updates campaign_sends.booking_id
```

## Integration Points

### 1. Email/SMS Templates (Already Done)

Templates already include tracking links:

```typescript
const trackingUrl = `https://thepuppyday.com/api/track/${trackingId}`;
```

### 2. Booking Flow (TODO)

Add to booking creation endpoint:

```typescript
// src/app/api/bookings/route.ts or booking action

// Extract tracking_id from query params
const trackingId = req.nextUrl.searchParams.get('tracking_id');

// After creating appointment
if (trackingId) {
  await linkBookingToReminder(
    supabase,
    customerId,
    appointmentId,
    scheduledAt
  );
}
```

### 3. Admin Dashboard (TODO - Future Task)

```typescript
// src/app/(admin)/analytics/reminders/page.tsx

import { getReminderStats, getReminderStatsByBreed } from '@/lib/admin/reminder-analytics';

export default async function ReminderAnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  const last30Days = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  };

  const [overallStats, breedStats] = await Promise.all([
    getReminderStats(supabase, last30Days.start, last30Days.end),
    getReminderStatsByBreed(supabase, last30Days.start, last30Days.end)
  ]);

  return (
    <div>
      <h1>Reminder Campaign Analytics</h1>
      <StatsCards stats={overallStats} />
      <BreedPerformanceTable breeds={breedStats} />
    </div>
  );
}
```

## Database Queries

### Check Tracking Status

```sql
-- See which reminders have been clicked
SELECT
  cs.id,
  cs.tracking_id,
  cs.sent_at,
  nl.clicked_at,
  cs.booking_id,
  CASE
    WHEN cs.booking_id IS NOT NULL THEN 'Converted'
    WHEN nl.clicked_at IS NOT NULL THEN 'Clicked'
    ELSE 'Sent'
  END as status
FROM campaign_sends cs
LEFT JOIN notifications_log nl ON cs.tracking_id = nl.tracking_id
WHERE cs.pet_id IS NOT NULL
ORDER BY cs.created_at DESC
LIMIT 10;
```

### Calculate Manual ROI

```sql
-- Overall campaign performance
SELECT
  COUNT(*) as total_sent,
  COUNT(nl.clicked_at) as total_clicked,
  COUNT(cs.booking_id) as total_converted,
  ROUND(COUNT(nl.clicked_at)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as click_rate,
  ROUND(COUNT(cs.booking_id)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
  SUM(a.total_price) as total_revenue,
  ROUND(AVG(EXTRACT(EPOCH FROM (a.created_at - cs.sent_at)) / 86400), 1) as avg_days_to_convert
FROM campaign_sends cs
LEFT JOIN notifications_log nl ON cs.tracking_id = nl.tracking_id
LEFT JOIN appointments a ON cs.booking_id = a.id
WHERE cs.pet_id IS NOT NULL
  AND cs.created_at >= '2024-01-01'
  AND cs.created_at <= '2024-12-31';
```

## Testing Quick Start

```bash
# 1. Create test data (see TASK_0039_TESTING_GUIDE.md)

# 2. Test click tracking
curl http://localhost:3000/api/track/00000000-0000-0000-0000-000000000004
# Should redirect to /book?tracking_id=...

# 3. Verify clicked_at updated
psql $DATABASE_URL -c "SELECT clicked_at FROM notifications_log WHERE tracking_id = '00000000-0000-0000-0000-000000000004';"

# 4. Test analytics
# Run in Next.js console or API route
const stats = await getReminderStats(supabase, '2024-01-01', '2024-12-31');
console.log(stats);
```

## Metrics Formulas

| Metric | Formula | Example |
|--------|---------|---------|
| Click Rate | `(clicked / sent) * 100` | `75 / 150 * 100 = 50%` |
| Conversion Rate | `(converted / sent) * 100` | `25 / 150 * 100 = 16.67%` |
| Avg Days to Convert | `sum(days) / conversions` | `80 / 25 = 3.2 days` |
| Avg Revenue per Send | `revenue / sent` | `$2500 / 150 = $16.67` |
| Cost per Acquisition | `cost / conversions` | `$11.85 / 25 = $0.47` |
| ROI | `(revenue - cost) / cost * 100` | `($2500 - $12) / $12 * 100 = 20733%` |

## Troubleshooting

### Clicks not tracking
- Check tracking_id exists in notifications_log
- Verify UUID format is valid
- Check server logs for errors

### Conversions not linking
- Verify `linkBookingToReminder()` is called in booking flow
- Check 30-day conversion window
- Ensure customer_id matches

### Stats returning zero
- Check date range includes test data
- Verify campaign_sends has pet_id set (breed reminders only)
- Query database directly to verify data exists

## Next Steps

1. **Integration:**
   - [ ] Add `linkBookingToReminder()` to booking creation flow
   - [ ] Pass `tracking_id` from URL to booking API

2. **Admin UI:**
   - [ ] Create reminder analytics dashboard page
   - [ ] Add charts for visual representation
   - [ ] Implement date range filtering

3. **Optimization:**
   - [ ] Add caching for daily stats
   - [ ] Create materialized view for performance
   - [ ] Set up automated ROI reports

## File Paths

```
src/
├── lib/
│   └── admin/
│       └── reminder-analytics.ts ✅ NEW
└── app/
    └── api/
        └── track/
            └── [trackingId]/
                └── route.ts ✅ NEW

Docs:
├── TASK_0039_IMPLEMENTATION_SUMMARY.md ✅
├── TASK_0039_TESTING_GUIDE.md ✅
└── TASK_0039_QUICK_REFERENCE.md ✅ (this file)
```

## Dependencies

- Task 0001: Database migrations (campaign_sends, notifications_log)
- Task 0037: Breed reminder scheduler
- Task 0038: Notification templates (email/SMS)

## Status

✅ **Task 0039 Complete** - Ready for integration and testing

---

**Need Help?** See detailed docs:
- Implementation: `TASK_0039_IMPLEMENTATION_SUMMARY.md`
- Testing: `TASK_0039_TESTING_GUIDE.md`
