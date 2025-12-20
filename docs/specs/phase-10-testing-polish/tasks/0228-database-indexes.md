# Task 0228: Add database query indexes and optimize slow queries

**Phase**: 10.1 Performance
**Prerequisites**: 0227
**Estimated effort**: 2-3 hours

## Objective

Add database indexes on frequently queried columns and optimize slow queries.

## Requirements

- Ensure indexes on appointments.scheduled_at, appointments.status
- Ensure indexes on notifications_log.notification_type, status, created_at
- Limit calendar queries to visible date range only
- Ensure no query takes over 1 second

## Acceptance Criteria

- [ ] Indexes created on all frequently queried columns
- [ ] appointments table has indexes on scheduled_at, status, customer_id
- [ ] notifications_log has composite index on type, status, created_at
- [ ] Calendar queries limited to visible month only
- [ ] No query exceeds 1 second execution time
- [ ] Slow queries logged with details

## Implementation Details

### Migration to Create

- Create Supabase migration for adding indexes

### Indexes to Add

```sql
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer
  ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_composite
  ON notifications_log(notification_type, status, created_at DESC);
```

### Files to Modify

- Calendar query functions to add date range filters

## References

- **Requirements**: Req 4.6-4.9
- **Design**: Section 10.1.4
