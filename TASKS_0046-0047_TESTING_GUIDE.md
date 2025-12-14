# Tasks 0046-0047 Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure migrations are applied (campaign_sends table exists)
2. Mock mode enabled: `NEXT_PUBLIC_USE_MOCKS=true`
3. Admin user logged in

---

## Test Task 0046: Campaign Send Functionality

### Test 1: Create and Send a Simple Campaign

**Steps**:
1. Navigate to `/admin/marketing/campaigns`
2. Click "Create Campaign"
3. Fill in campaign details:
   - Name: "Holiday Grooming Special"
   - Type: One-time
   - Channel: Both (Email + SMS)
4. Set segment criteria:
   - Min appointments: 1
   - Last visit days: 60
5. Compose message:
   - SMS: "Hi {first_name}, special holiday rates! Book now: {booking_link}"
   - Email subject: "Holiday Special for {customer_name}"
   - Email body: "Hi {first_name}, we're offering special holiday grooming rates..."
6. Skip scheduling (leave blank for immediate send)
7. Save as draft
8. Find the campaign in the list
9. Click actions menu → "Send Now"
10. Confirm send

**Expected Results**:
- ✅ Campaign status changes from "draft" to "sending" to "sent"
- ✅ Success toast shows: "Successfully sent to X customers"
- ✅ Campaign card updates to show "sent" badge
- ✅ Console logs show:
  ```
  [Campaign Send API] Starting send for campaign: Holiday Grooming Special
  [Campaign Sender] Found X audience members
  [Campaign Sender] Created X campaign_send records
  [Campaign Sender] Campaign send complete. Sent: X, Skipped: 0
  ```

**Verify in Database** (if using real Supabase):
```sql
-- Check campaign status
SELECT id, name, status, sent_at FROM marketing_campaigns WHERE name = 'Holiday Grooming Special';

-- Check campaign_sends created
SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = 'campaign-id-here';

-- Check notification logs
SELECT COUNT(*) FROM notifications_log WHERE campaign_id = 'campaign-id-here';
```

---

### Test 2: A/B Test Campaign

**Steps**:
1. Create campaign: "Win-Back A/B Test"
2. Enable A/B test toggle
3. Set split: 50/50
4. Variant A message:
   - SMS: "We miss you {first_name}! Come back for 10% off: {booking_link}"
5. Variant B message:
   - SMS: "Hi {first_name}, we have a special offer for you! Book now: {booking_link}"
6. Send campaign

**Expected Results**:
- ✅ ~50% of sends get variant A
- ✅ ~50% of sends get variant B
- ✅ campaign_sends.variant field set to 'A' or 'B'

**Verify**:
```sql
-- Check variant distribution
SELECT variant, COUNT(*)
FROM campaign_sends
WHERE campaign_id = 'campaign-id-here'
GROUP BY variant;
```

---

### Test 3: Segment Filtering

**Test 3a: Last Visit Days**
- Segment: last_visit_days = 30
- Expected: Only customers with appointments in last 30 days

**Test 3b: Service Filter**
- Segment: service_ids = ['premium-groom-id']
- Expected: Only customers who booked premium groom

**Test 3c: Membership Filter**
- Segment: has_membership = true
- Expected: Only customers with active memberships

**Test 3d: Combined Filters**
- Segment: last_visit_days = 60 AND min_visits = 3 AND pet_size = ['large', 'xlarge']
- Expected: Customers with large/xlarge pets, 3+ visits, last visit within 60 days

**Verify**: Check audience preview count before sending

---

### Test 4: Unsubscribe Handling

**Steps**:
1. Create unsubscribe record:
```sql
INSERT INTO marketing_unsubscribes (customer_id, unsubscribed_from)
VALUES ('customer-id-here', 'email');
```
2. Create campaign with email channel
3. Send campaign

**Expected Results**:
- ✅ Customer with email unsubscribe is skipped
- ✅ Skipped count in response > 0
- ✅ No email sent to unsubscribed customer

---

### Test 5: Error Handling

**Test 5a: No Matching Audience**
- Create campaign with impossible criteria: min_visits = 1000
- Send campaign
- Expected: Error "No customers match the segment criteria"
- Campaign status returns to "draft"

**Test 5b: Already Sent Campaign**
- Send a campaign successfully
- Try to send again
- Expected: Error "Campaign has already been sent"

**Test 5c: Cancelled Campaign**
- Create campaign, manually set status to "cancelled"
- Try to send
- Expected: Error "Cannot send cancelled campaign"

---

## Test Task 0047: Campaign Performance Tracking

### Test 6: View Performance Dashboard

**Steps**:
1. Send a campaign (from Test 1)
2. Wait for status = "sent"
3. Click actions menu → "View Performance"
4. OR navigate to `/admin/marketing/campaigns/[id]`

**Expected Results**:
- ✅ Page loads with campaign header
- ✅ 4 KPI cards display:
  - Sent count
  - Delivered count with %
  - Clicked count with CTR %
  - Conversions count with conversion rate %
- ✅ 3 metric cards:
  - Revenue Generated (total + per send)
  - Click Rate (percentage + progress bar)
  - ROI (percentage + trend icon)
- ✅ Conversion Funnel shows:
  - Sent → Delivered → Clicked → Converted
  - Progress bars sized correctly
  - Dropoff counts between stages

---

### Test 7: A/B Test Performance Comparison

**Steps**:
1. Send an A/B test campaign (from Test 2)
2. View performance dashboard
3. Scroll to "A/B Test Comparison" table

**Expected Results**:
- ✅ Table shows Variant A vs Variant B columns
- ✅ 8 metrics compared:
  - Sent, Delivered, Clicked, Click Rate
  - Conversions, Conversion Rate, Revenue, Avg Revenue/Send
- ✅ "Winner" column shows badge (A or B) for each metric
- ✅ Higher value wins for each metric

**Manual Data Setup** (for testing):
```sql
-- Simulate some conversions for variant A
UPDATE campaign_sends
SET booking_id = 'appointment-id-1', clicked_at = NOW()
WHERE campaign_id = 'campaign-id' AND variant = 'A'
LIMIT 3;

-- Simulate some conversions for variant B
UPDATE campaign_sends
SET booking_id = 'appointment-id-2', clicked_at = NOW()
WHERE campaign_id = 'campaign-id' AND variant = 'B'
LIMIT 5;
```

Expected: Variant B shows as winner for conversions

---

### Test 8: Conversion Tracking

**Steps**:
1. Create campaign_send record with booking_id
2. View performance dashboard
3. Scroll to "Conversions" table

**Expected Results**:
- ✅ Table lists all conversions
- ✅ Shows: Customer name, Booking date, Revenue, Days to convert
- ✅ Footer shows total revenue and avg days

**Manual Data Setup**:
```sql
-- Link a campaign_send to an appointment
UPDATE campaign_sends
SET booking_id = (SELECT id FROM appointments LIMIT 1)
WHERE campaign_id = 'campaign-id'
LIMIT 1;
```

---

### Test 9: Performance Metrics Accuracy

**Setup Test Data**:
```sql
-- Campaign with 100 sends
INSERT INTO campaign_sends (campaign_id, customer_id, sent_at, tracking_id)
SELECT 'test-campaign-id', id, NOW(), gen_random_uuid()
FROM users WHERE role = 'customer' LIMIT 100;

-- 90 delivered
UPDATE campaign_sends SET delivered_at = NOW()
WHERE campaign_id = 'test-campaign-id'
LIMIT 90;

-- 50 clicked
UPDATE campaign_sends SET clicked_at = NOW()
WHERE campaign_id = 'test-campaign-id'
LIMIT 50;

-- 10 conversions
UPDATE campaign_sends cs
SET booking_id = a.id
FROM appointments a
WHERE cs.campaign_id = 'test-campaign-id'
  AND a.status = 'completed'
LIMIT 10;
```

**Expected Metrics**:
- Sent: 100
- Delivered: 90
- Delivery Rate: 90%
- Clicked: 50
- Click Rate: 55.56% (50/90)
- Conversions: 10
- Conversion Rate: 10% (10/100)
- Revenue: Sum of appointment.total_price for 10 bookings

**Verify**: Check calculated metrics match expectations

---

### Test 10: Loading and Error States

**Test 10a: Loading State**
- Navigate to performance page
- Before API response, skeleton should show:
  - ✅ Header skeleton (gray box)
  - ✅ 4 KPI card skeletons
  - ✅ 2 section skeletons
  - ✅ Pulse animation

**Test 10b: Error State**
- Mock API error (temporarily modify fetch to throw error)
- Expected:
  - ✅ Alert shows: "Failed to load campaign analytics"
  - ✅ Error message displayed

**Test 10c: Empty State (Non-Sent Campaign)**
- View performance for draft campaign
- Expected:
  - ✅ Shows: "Performance Analytics Unavailable"
  - ✅ Message: "Performance metrics will be available after the campaign has been sent."

---

## Mock Mode Testing

All tests can run in mock mode. Verify:

1. **Check Environment**:
```bash
# In .env.local
NEXT_PUBLIC_USE_MOCKS=true
```

2. **Mock Services Used**:
- Email: `src/mocks/resend/client.ts`
- SMS: `src/mocks/twilio/client.ts`
- Database: `src/mocks/supabase/store.ts`

3. **Console Logs**:
```
[Mock Email] Sending email to: customer@example.com
[Mock SMS] Sending SMS to: (555) 123-4567
```

---

## Production Testing Checklist

Before deploying to production:

### Campaign Send
- [ ] Test with real email (check inbox)
- [ ] Test with real SMS (check phone)
- [ ] Verify unsubscribe links work
- [ ] Test rate limiting (if implemented)
- [ ] Monitor notification costs

### Performance Tracking
- [ ] Verify click tracking works (tracking_id redirect)
- [ ] Verify conversion attribution (booking_id set correctly)
- [ ] Test with large datasets (1000+ sends)
- [ ] Check query performance on analytics endpoint

### Security
- [ ] Admin-only access enforced
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized inputs)
- [ ] Rate limiting on send endpoint

---

## Common Issues & Solutions

### Issue: Campaign sends but no notifications received
**Solution**: Check mock mode is enabled, or verify email/SMS credentials

### Issue: Performance metrics show 0 for everything
**Solution**: Ensure campaign_sends records created, check campaign_id matches

### Issue: A/B test shows no data
**Solution**: Verify ab_test_config.enabled = true and variant field populated

### Issue: Conversions not tracked
**Solution**: Check booking_id set on campaign_sends, verify appointments.total_price exists

### Issue: ROI calculation is wrong
**Solution**: Ensure notifications_log.cost_cents populated, check cost calculation logic

---

## Debug Commands

### Check Campaign Data
```sql
SELECT * FROM marketing_campaigns WHERE id = 'campaign-id';
```

### Check Send Records
```sql
SELECT cs.*, u.email, u.phone
FROM campaign_sends cs
JOIN users u ON cs.customer_id = u.id
WHERE cs.campaign_id = 'campaign-id';
```

### Check Notifications
```sql
SELECT * FROM notifications_log
WHERE campaign_id = 'campaign-id'
ORDER BY created_at DESC;
```

### Check Conversions
```sql
SELECT cs.customer_id, a.total_price, a.scheduled_at
FROM campaign_sends cs
JOIN appointments a ON cs.booking_id = a.id
WHERE cs.campaign_id = 'campaign-id';
```

---

## Performance Benchmarks

Expected performance:
- Send 100 notifications: < 10 seconds
- Calculate analytics for 1000 sends: < 2 seconds
- Load performance dashboard: < 1 second

If slower, check:
- Database indexes on campaign_sends (campaign_id, customer_id)
- Database indexes on notifications_log (campaign_id, campaign_send_id)
- API response caching

---

## Success Criteria

Tasks 0046-0047 are considered complete when:

✅ Campaign can be sent to filtered audience
✅ Notifications sent via email/SMS
✅ Unsubscribes respected
✅ A/B variants assigned correctly
✅ Performance dashboard displays all metrics
✅ A/B comparison table shows data
✅ Conversion funnel visualizes correctly
✅ All loading/error states work
✅ No console errors
✅ Tests pass in both mock and production modes

---

## Next Testing Phase

After Tasks 0046-0047 pass, move to:
- Task 0048: Campaign templates
- Task 0049: Scheduled campaign sends
- Task 0050: Recurring campaigns
