# Task 0039: Reminder Conversion Tracking - Testing Guide

## Quick Start Testing

### Prerequisites

Ensure the following are set up:
- [ ] Campaign sends table has `tracking_id` column (Task 0037 migration)
- [ ] Notifications log has `tracking_id` and `clicked_at` columns
- [ ] Breed reminder scheduler is working (Task 0037)
- [ ] Notification templates are working (Task 0038)

### Test Data Setup

```sql
-- Create test customer
INSERT INTO users (id, email, first_name, last_name, role, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'Test',
  'Customer',
  'customer',
  '+15555551234'
);

-- Create test pet
INSERT INTO pets (id, owner_id, name, breed_id, size)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Fluffy',
  (SELECT id FROM breeds LIMIT 1),
  'medium'
);

-- Create test campaign send (simulating sent reminder)
INSERT INTO campaign_sends (
  id,
  user_id,
  pet_id,
  tracking_id,
  sent_at,
  attempt_count,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000004',
  NOW() - INTERVAL '2 days',
  1,
  NOW() - INTERVAL '2 days'
);

-- Create corresponding notification log entry
INSERT INTO notifications_log (
  id,
  customer_id,
  type,
  channel,
  recipient,
  tracking_id,
  status,
  sent_at,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'breed_reminder',
  'email',
  'test@example.com',
  '00000000-0000-0000-0000-000000000004',
  'sent',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);
```

## Test 1: Click Tracking

### Objective
Verify that clicking a reminder link updates the `clicked_at` timestamp.

### Steps

1. **Get the tracking link:**
   ```
   http://localhost:3000/api/track/00000000-0000-0000-0000-000000000004
   ```

2. **Open the link in a browser**
   - Should redirect to: `http://localhost:3000/book?tracking_id=00000000-0000-0000-0000-000000000004`

3. **Verify database update:**
   ```sql
   SELECT
     id,
     tracking_id,
     clicked_at,
     sent_at
   FROM notifications_log
   WHERE tracking_id = '00000000-0000-0000-0000-000000000004';
   ```

   **Expected:**
   - `clicked_at` should now be populated
   - `clicked_at` should be after `sent_at`

4. **Test idempotency (click again):**
   - Click the same link again
   - Query database again
   - **Expected:** `clicked_at` timestamp should NOT change (preserves first click)

### Expected Results

- ✅ Redirects to booking page with `tracking_id` parameter
- ✅ `notifications_log.clicked_at` is updated on first click
- ✅ Subsequent clicks don't change `clicked_at` timestamp
- ✅ Server logs show: `[Tracking] Processing click for tracking ID: ...`

### Troubleshooting

**No redirect:**
- Check tracking ID format (must be valid UUID)
- Check if tracking ID exists in `notifications_log`
- Check server logs for errors

**`clicked_at` not updating:**
- Verify Supabase client has write permissions
- Check for RLS policies blocking updates
- Review server error logs

## Test 2: Invalid Tracking IDs

### Objective
Verify graceful handling of invalid tracking IDs.

### Test Cases

```bash
# Case 1: Invalid UUID format
curl -I http://localhost:3000/api/track/not-a-uuid
# Expected: 307 redirect to /

# Case 2: Valid UUID but doesn't exist
curl -I http://localhost:3000/api/track/99999999-9999-9999-9999-999999999999
# Expected: 307 redirect to /

# Case 3: Empty tracking ID
curl -I http://localhost:3000/api/track/
# Expected: 404 Not Found (route doesn't match)
```

### Expected Results

- ✅ All invalid IDs redirect to home page (/)
- ✅ No errors thrown
- ✅ Server logs warnings about invalid IDs
- ✅ No database corruption

## Test 3: Conversion Linking

### Objective
Verify that bookings are correctly linked to reminders within the conversion window.

### Setup

You already have a clicked reminder from Test 1. Now create a booking:

```sql
-- Create test appointment (booking)
INSERT INTO appointments (
  id,
  customer_id,
  pet_id,
  service_id,
  groomer_id,
  scheduled_at,
  duration_minutes,
  status,
  total_price,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  (SELECT id FROM services LIMIT 1),
  NULL,
  NOW() + INTERVAL '7 days',
  60,
  'confirmed',
  70.00,
  NOW()  -- Booked today, 2 days after reminder
);
```

### Test Function

```typescript
// In Next.js API route or server action
import { linkBookingToReminder } from '@/lib/admin/reminder-analytics';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const supabase = await createServerSupabaseClient();

await linkBookingToReminder(
  supabase,
  '00000000-0000-0000-0000-000000000001', // customer_id
  '00000000-0000-0000-0000-000000000006', // booking_id
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // scheduled_at
);
```

### Verify Results

```sql
SELECT
  cs.id,
  cs.user_id,
  cs.pet_id,
  cs.tracking_id,
  cs.booking_id,
  cs.sent_at,
  a.total_price,
  EXTRACT(DAY FROM (a.created_at - cs.sent_at)) as days_to_conversion
FROM campaign_sends cs
LEFT JOIN appointments a ON cs.booking_id = a.id
WHERE cs.tracking_id = '00000000-0000-0000-0000-000000000004';
```

### Expected Results

- ✅ `campaign_sends.booking_id` is set to the appointment ID
- ✅ `days_to_conversion` is approximately 2 days
- ✅ Function runs without errors
- ✅ Only the most recent reminder is linked (if multiple exist)

### Edge Case: Outside Conversion Window

```sql
-- Create old reminder (35 days ago, outside 30-day window)
INSERT INTO campaign_sends (
  id,
  user_id,
  pet_id,
  tracking_id,
  sent_at,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000008',
  NOW() - INTERVAL '35 days',
  NOW() - INTERVAL '35 days'
);

-- Try to link booking
-- Expected: Function returns without error, but old reminder is NOT linked
```

## Test 4: Analytics - Overall Stats

### Objective
Verify `getReminderStats()` calculates metrics correctly.

### Test Data State

After Tests 1-3, you should have:
- 1 reminder sent 2 days ago
- 1 click tracked
- 1 conversion with $70 revenue
- 2 days to conversion

### Test Function

```typescript
import { getReminderStats } from '@/lib/admin/reminder-analytics';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const supabase = await createServerSupabaseClient();

const stats = await getReminderStats(
  supabase,
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  new Date().toISOString() // now
);

console.log(stats);
```

### Expected Output

```json
{
  "totalSent": 1,
  "totalClicked": 1,
  "totalConverted": 1,
  "clickRate": 100.0,
  "conversionRate": 100.0,
  "avgDaysToConversion": 2.0,
  "totalRevenue": 70.0,
  "avgRevenuePerConversion": 70.0
}
```

### Verify Calculations

- **Click Rate:** `(1 clicked / 1 sent) * 100 = 100%` ✅
- **Conversion Rate:** `(1 converted / 1 sent) * 100 = 100%` ✅
- **Avg Days to Convert:** `2 days / 1 conversion = 2.0 days` ✅
- **Avg Revenue per Conversion:** `$70 / 1 = $70.00` ✅

### Test with Multiple Reminders

```sql
-- Add more test data
INSERT INTO campaign_sends (user_id, pet_id, tracking_id, sent_at, created_at)
VALUES
  -- Sent but not clicked
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', uuid_generate_v4(), NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  -- Clicked but not converted
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', uuid_generate_v4(), NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Add click for second reminder
INSERT INTO notifications_log (customer_id, type, tracking_id, clicked_at, sent_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'breed_reminder', (SELECT tracking_id FROM campaign_sends ORDER BY created_at DESC LIMIT 1 OFFSET 0), NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
```

**Re-run analytics:**
```
Expected:
- totalSent: 3
- totalClicked: 2 (66.67%)
- totalConverted: 1 (33.33%)
```

## Test 5: Analytics - Breed Breakdown

### Objective
Verify `getReminderStatsByBreed()` groups correctly by breed.

### Setup

Ensure test data includes multiple breeds:

```sql
-- Get breed IDs
SELECT id, name FROM breeds LIMIT 3;

-- Create pets for different breeds
INSERT INTO pets (id, owner_id, name, breed_id, size)
VALUES
  ('pet-breed-a', '00000000-0000-0000-0000-000000000001', 'Dog A', (SELECT id FROM breeds WHERE name = 'Golden Retriever'), 'large'),
  ('pet-breed-b', '00000000-0000-0000-0000-000000000001', 'Dog B', (SELECT id FROM breeds WHERE name = 'Poodle'), 'medium');

-- Create reminders for each breed
INSERT INTO campaign_sends (user_id, pet_id, tracking_id, sent_at, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'pet-breed-a', uuid_generate_v4(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', 'pet-breed-b', uuid_generate_v4(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000001', 'pet-breed-b', uuid_generate_v4(), NOW(), NOW());
```

### Test Function

```typescript
import { getReminderStatsByBreed } from '@/lib/admin/reminder-analytics';

const breedStats = await getReminderStatsByBreed(
  supabase,
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  new Date().toISOString()
);

console.log(breedStats);
```

### Expected Output

```json
[
  {
    "breedId": "uuid-for-poodle",
    "breedName": "Poodle",
    "totalSent": 2,
    "totalClicked": 0,
    "totalConverted": 0,
    "clickRate": 0,
    "conversionRate": 0,
    "avgDaysToConversion": 0,
    "totalRevenue": 0,
    "avgRevenuePerConversion": 0
  },
  {
    "breedId": "uuid-for-golden-retriever",
    "breedName": "Golden Retriever",
    "totalSent": 1,
    "totalClicked": 0,
    "totalConverted": 0,
    "clickRate": 0,
    "conversionRate": 0,
    "avgDaysToConversion": 0,
    "totalRevenue": 0,
    "avgRevenuePerConversion": 0
  }
]
```

### Verify

- ✅ Results are grouped by breed
- ✅ Sorted by `totalSent` descending (Poodle with 2 comes first)
- ✅ Metrics calculated separately for each breed

## Test 6: Error Handling

### Test Database Errors

```typescript
// Test with invalid Supabase client
const stats = await getReminderStats(null as any, '2024-01-01', '2024-12-31');
// Expected: Returns empty stats { totalSent: 0, ... }

// Test with invalid date range
const stats2 = await getReminderStats(supabase, 'invalid-date', '2024-12-31');
// Expected: Gracefully handles error, returns empty stats
```

### Test Missing Data

```sql
-- Delete test notifications_log entry
DELETE FROM notifications_log WHERE tracking_id = '00000000-0000-0000-0000-000000000004';

-- Run analytics again
-- Expected: Click count should decrease, but no errors
```

### Test Orphaned Data

```sql
-- Create campaign_send with no corresponding notification_log
INSERT INTO campaign_sends (user_id, pet_id, tracking_id, sent_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'pet-breed-a', uuid_generate_v4(), NOW());

-- Run analytics
-- Expected: Counted in totalSent, but not in totalClicked (graceful handling)
```

## Test 7: Performance

### Large Dataset Test

```sql
-- Generate 1000 test reminders
INSERT INTO campaign_sends (user_id, pet_id, tracking_id, sent_at, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'pet-breed-a',
  uuid_generate_v4(),
  NOW() - (RANDOM() * INTERVAL '30 days'),
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM generate_series(1, 1000);
```

### Measure Query Time

```typescript
console.time('getReminderStats');
const stats = await getReminderStats(supabase, startDate, endDate);
console.timeEnd('getReminderStats');
// Target: < 2 seconds for 1000 records
```

### Check Index Usage

```sql
EXPLAIN ANALYZE
SELECT *
FROM campaign_sends cs
WHERE cs.pet_id IS NOT NULL
  AND cs.created_at >= '2024-01-01'
  AND cs.created_at <= '2024-12-31';

-- Expected: Should use idx_campaign_sends_pet
```

## Test 8: Integration with Booking Flow

### Objective
Test end-to-end flow from reminder to booking.

### Full Flow Test

1. **Setup:** Customer with pet, eligible for reminder
2. **Trigger scheduler:**
   ```typescript
   import { processBreedReminders } from '@/lib/admin/breed-reminder-scheduler';
   await processBreedReminders(supabase);
   ```
3. **Check email/SMS:** Verify tracking link format
4. **Click link:** Visit `/api/track/{trackingId}`
5. **Complete booking:** Fill out booking form
6. **Verify linkage:**
   ```sql
   SELECT * FROM campaign_sends WHERE booking_id IS NOT NULL;
   ```

### Expected Results

- ✅ Reminder sent with unique tracking_id
- ✅ Click tracked in notifications_log
- ✅ Booking created successfully
- ✅ campaign_sends.booking_id linked automatically
- ✅ Analytics show 1 conversion

## Cleanup

After testing, remove test data:

```sql
-- Delete test appointments
DELETE FROM appointments WHERE customer_id = '00000000-0000-0000-0000-000000000001';

-- Delete test campaign sends
DELETE FROM campaign_sends WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Delete test notifications
DELETE FROM notifications_log WHERE customer_id = '00000000-0000-0000-0000-000000000001';

-- Delete test pet
DELETE FROM pets WHERE id = '00000000-0000-0000-0000-000000000002';

-- Delete test user
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Success Criteria

All tests should pass with:

- [x] Click tracking updates database correctly
- [x] Invalid tracking IDs handled gracefully
- [x] Conversions link within 30-day window
- [x] Analytics calculate metrics accurately
- [x] Breed breakdown groups correctly
- [x] Error handling prevents crashes
- [x] Performance acceptable for 1000+ records
- [x] End-to-end flow works seamlessly

## Common Issues

### Issue: Click rate always 0%

**Cause:** notifications_log entries don't have matching tracking_ids

**Solution:**
```sql
-- Verify tracking_ids match
SELECT
  cs.tracking_id as campaign_tracking,
  nl.tracking_id as notification_tracking
FROM campaign_sends cs
LEFT JOIN notifications_log nl ON cs.tracking_id = nl.tracking_id
WHERE cs.pet_id IS NOT NULL;
```

### Issue: Conversions not linking

**Cause:** `linkBookingToReminder()` not being called in booking flow

**Solution:** Add to booking creation endpoint:
```typescript
// After appointment creation
if (trackingId) {
  await linkBookingToReminder(supabase, customerId, appointmentId, scheduledAt);
}
```

### Issue: Stats return empty

**Cause:** Date range doesn't include test data

**Solution:** Use wide date range:
```typescript
const stats = await getReminderStats(
  supabase,
  '2020-01-01',  // Far past
  '2030-12-31'   // Far future
);
```

---

**Testing Complete** - Verify all test cases pass before deploying to production.
