# Task 0037: Breed Reminder Scheduler - Testing Guide

## Quick Testing Checklist

### 1. Development Environment Setup

```bash
# Ensure mock mode is enabled
echo "NEXT_PUBLIC_USE_MOCKS=true" >> .env.local

# Add cron secret for testing
echo "CRON_SECRET=dev_test_secret_123" >> .env.local

# Start development server
npm run dev
```

### 2. Test API Endpoint

```bash
# Test without authentication (should work in development)
curl http://localhost:3000/api/cron/breed-reminders

# Expected response:
{
  "success": true,
  "timestamp": "2024-12-13T...",
  "stats": {
    "eligible_count": 0,
    "sent_count": 0,
    "skipped_count": 0,
    "error_count": 0
  }
}
```

### 3. Test with Mock Data

Create test scenario in mock database:

1. **Add a test breed with 6-week frequency**:
```typescript
// In src/mocks/supabase/seed.ts
{
  id: 'breed-poodle',
  name: 'Poodle',
  grooming_frequency_weeks: 6,
  reminder_message: 'Time for your Poodle\'s grooming! Keep those curls healthy.',
  created_at: '2024-01-01T00:00:00Z'
}
```

2. **Add a test pet**:
```typescript
{
  id: 'pet-test-1',
  owner_id: 'customer-1',
  name: 'Fluffy',
  breed_id: 'breed-poodle',
  size: 'medium',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
}
```

3. **Add a completed appointment 35 days ago** (so pet is due in 7 days):
```typescript
{
  id: 'appt-test-1',
  customer_id: 'customer-1',
  pet_id: 'pet-test-1',
  service_id: 'service-1',
  scheduled_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'completed',
  // ... other fields
}
```

4. **Test the endpoint again**:
```bash
curl http://localhost:3000/api/cron/breed-reminders
```

Expected: `eligible_count: 1, sent_count: 1`

### 4. Verify Database Records

Check that records were created:

```sql
-- Check notifications_log
SELECT * FROM notifications_log
WHERE type = 'breed_reminder'
ORDER BY created_at DESC
LIMIT 5;

-- Check campaign_sends
SELECT * FROM campaign_sends
WHERE pet_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Test Skip Conditions

#### Test: Skip if upcoming appointment exists

```typescript
// Add upcoming appointment
{
  id: 'appt-upcoming',
  customer_id: 'customer-1',
  pet_id: 'pet-test-1',
  service_id: 'service-1',
  scheduled_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'confirmed'
}
```

Run endpoint - should skip this pet.

#### Test: Max attempts limit

```typescript
// Add 2 previous campaign_sends for same pet
{
  id: 'send-1',
  user_id: 'customer-1',
  pet_id: 'pet-test-1',
  sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  attempt_count: 1
}
{
  id: 'send-2',
  user_id: 'customer-1',
  pet_id: 'pet-test-1',
  sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  attempt_count: 2
}
```

Run endpoint - should skip this pet (max 2 attempts reached).

#### Test: Customer opted out

```typescript
// Update customer preferences
{
  id: 'customer-1',
  preferences: {
    email_promotional: false,
    sms_promotional: false
  }
}
```

Run endpoint - should skip this pet.

### 6. Test Tracking ID Generation

```bash
# Run endpoint
curl http://localhost:3000/api/cron/breed-reminders

# Check database for tracking_id
SELECT tracking_id FROM campaign_sends WHERE pet_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;

# Should return a valid UUID
```

### 7. Production Testing

```bash
# Set production CRON_SECRET
export CRON_SECRET="your-production-secret"

# Test with authentication
curl https://thepuppyday.com/api/cron/breed-reminders \
  -H "Authorization: Bearer $CRON_SECRET"

# Test without auth (should fail)
curl https://thepuppyday.com/api/cron/breed-reminders
# Expected: 401 Unauthorized
```

### 8. Monitor Logs

```bash
# Vercel logs
vercel logs --follow

# Look for:
# - "[Breed Reminder Scheduler] Starting daily reminder processing..."
# - "[Breed Reminder Scheduler] Found X eligible pets"
# - "[Breed Reminder Scheduler] Sent reminder for pet..."
# - "[Breed Reminder Scheduler] Completed. Stats: ..."
```

### 9. Conversion Tracking Test

1. **Send reminder** (creates tracking_id)
2. **Customer clicks link** with `?tracking={tracking_id}`
3. **Customer books appointment**
4. **Verify campaign_send updated**:

```sql
SELECT
  cs.id,
  cs.tracking_id,
  cs.booking_id,
  a.id as appointment_id,
  a.total_price
FROM campaign_sends cs
LEFT JOIN appointments a ON a.id = cs.booking_id
WHERE cs.pet_id IS NOT NULL
ORDER BY cs.created_at DESC
LIMIT 1;
```

Should show `booking_id` populated.

## Manual Testing Checklist

- [ ] Endpoint accessible at `/api/cron/breed-reminders`
- [ ] Returns 401 without CRON_SECRET in production
- [ ] Works without auth in development
- [ ] Finds eligible pets correctly (7 days before due)
- [ ] Skips pets with upcoming appointments
- [ ] Skips pets with appointments within 14 days
- [ ] Skips after 2 attempts
- [ ] Respects customer notification preferences
- [ ] Generates unique tracking_ids
- [ ] Creates notifications_log records
- [ ] Creates campaign_sends records
- [ ] Returns accurate statistics
- [ ] Handles errors gracefully
- [ ] Logs detailed information

## Edge Cases to Test

### 1. Pet with no completed appointments
- Should skip (no last_appointment_date)

### 2. Pet with breed but no grooming_frequency_weeks
- Should skip (can't calculate due date)

### 3. Pet without breed_id
- Should skip (filtered in query)

### 4. Customer with invalid email/phone
- Should log error but not crash

### 5. Multiple pets for same customer
- Should send separate reminders for each eligible pet

### 6. Pet due today (not in 7 days)
- Should skip (not matching target date)

### 7. Database connection failure
- Should return error response with 500 status

### 8. Notification service failure
- Should log error, update attempt count, continue to next pet

## Performance Testing

### Simulate 1000 pets

```typescript
// Generate test data
const pets = Array.from({ length: 1000 }, (_, i) => ({
  id: `pet-${i}`,
  owner_id: `customer-${i % 100}`, // 100 customers
  name: `Pet ${i}`,
  breed_id: 'breed-poodle',
  size: 'medium',
  is_active: true
}));
```

Expected performance:
- Should complete in < 60 seconds
- Memory usage stable
- No timeouts

## Automated Tests (Future)

```typescript
// tests/breed-reminder-scheduler.test.ts

describe('Breed Reminder Scheduler', () => {
  it('should find pets due in 7 days', async () => {
    const stats = await processBreedReminders(mockSupabase);
    expect(stats.eligible_count).toBe(5);
  });

  it('should skip pets with upcoming appointments', async () => {
    // Test implementation
  });

  it('should enforce max 2 attempts', async () => {
    // Test implementation
  });

  it('should generate unique tracking IDs', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### No eligible pets found

**Possible causes**:
1. No pets with breeds in database
2. No completed appointments
3. Grooming frequency doesn't match 7-day window
4. All pets have upcoming appointments

**Solution**: Check database queries manually

### Reminders not sending

**Possible causes**:
1. Customer opted out of promotional notifications
2. Invalid email/phone in database
3. Max attempts reached
4. Mock mode enabled (notifications logged but not sent)

**Solution**: Check notifications_log for error messages

### 401 Unauthorized in production

**Possible causes**:
1. CRON_SECRET not set in environment
2. Wrong Authorization header format
3. Mismatched secrets

**Solution**: Verify environment variable matches header

### Timeout errors

**Possible causes**:
1. Too many pets to process
2. Database slow queries
3. Network issues

**Solution**: Add pagination, optimize queries, increase timeout

## Success Metrics

After deployment, monitor:

1. **Daily execution**: Check logs for daily 9 AM execution
2. **Eligible count**: Should see consistent numbers based on grooming patterns
3. **Sent count**: Should be ~80% of eligible (accounting for skips)
4. **Error rate**: Should be < 5%
5. **Conversion rate**: Track bookings from reminders (aim for 20%+)
6. **Revenue attribution**: Calculate ROI of reminder system

## Next Steps After Testing

1. Deploy to production
2. Configure Vercel cron
3. Set CRON_SECRET environment variable
4. Monitor first week of executions
5. Analyze conversion metrics
6. Iterate on message content based on performance
