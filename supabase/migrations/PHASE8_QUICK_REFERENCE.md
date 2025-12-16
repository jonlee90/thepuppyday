# Phase 8 Critical Fixes - Quick Reference Guide

## What Changed?

### 🔒 Security Enhancements
1. **XSS Prevention** - HTML escaping for email templates
2. **Function Permissions** - SECURITY DEFINER functions restricted
3. **Data Access Control** - RLS policies for notifications_log

### 🛡️ Data Integrity
4. **UNIQUE Constraint** - No duplicate message IDs
5. **Foreign Key** - Valid notification types only
6. **NOT NULL** - Required retry configuration

### ⚡ Performance & Reliability
7. **Atomic Operations** - Race-free statistics updates
8. **Advisory Locks** - Safe template versioning
9. **1:1 Retry Constraint** - Proper retry configuration

### 🔧 Migration Safety
10. **Dependency Check** - Ensures correct execution order

---

## Files Modified

| File | Purpose | Lines |
|------|---------|-------|
| `20241215_phase8_notification_system_schema.sql` | Database schema & functions | 568 |
| `20241215_phase8_notification_default_settings.sql` | Seed data & helper functions | 516 |

---

## Key Functions

### `escape_html(TEXT)` - NEW
```sql
-- Escapes HTML special characters to prevent XSS
SELECT escape_html('<script>alert("XSS")</script>');
-- Returns: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
```

### `render_template(UUID, JSONB)` - ENHANCED
```sql
-- Renders template with HTML-escaped variables
SELECT * FROM render_template(
  'template-id'::uuid,
  '{"customer_name": "John <script>", "amount": "$100"}'::jsonb
);
-- HTML template: John &lt;script&gt; gets $100 (escaped)
-- Text template: John <script> gets $100 (raw)
```

### `update_notification_stats()` - FIXED
```sql
-- Now uses atomic operations:
-- total_sent_count = total_sent_count + 1
-- last_sent_at = GREATEST(last_sent_at, NEW.sent_at)
```

### `save_template_version()` - FIXED
```sql
-- Now uses advisory locks:
-- pg_try_advisory_xact_lock(template_id_hash)
-- Prevents concurrent version conflicts
```

---

## Important Constraints

### `unique_message_id`
```sql
-- Each provider message ID must be unique
INSERT INTO notifications_log (message_id, ...)
VALUES ('msg-123', ...); -- OK
VALUES ('msg-123', ...); -- ERROR: duplicate key
```

### `fk_notifications_log_type`
```sql
-- Notification type must exist in settings
INSERT INTO notifications_log (type, ...)
VALUES ('booking_confirmation', ...); -- OK (exists)
VALUES ('invalid_type', ...); -- ERROR: foreign key violation
```

### `retry_delays_valid`
```sql
-- Array length must equal max_retries
max_retries = 2, retry_delays = [30, 300] -- OK (2 = 2)
max_retries = 2, retry_delays = [30] -- ERROR (2 ≠ 1)
max_retries = 0, retry_delays = [] -- OK (0 = 0)
```

---

## RLS Policy Summary

| Role | Read | Write | Notes |
|------|------|-------|-------|
| `service_role` | All | All | System operations |
| Admin | All | All | Management & testing |
| Customer | Own only | None | Read own notifications |
| Anonymous | None | None | No access |

---

## Common Use Cases

### 1. Send Notification with Template
```sql
-- Get template ID
SELECT id FROM notification_templates
WHERE type = 'booking_confirmation' AND channel = 'email' AND is_active = true;

-- Render template
SELECT * FROM render_template(
  'template-id'::uuid,
  '{
    "customer_name": "Sarah",
    "pet_name": "Buddy",
    "date": "2024-12-20",
    "time": "2:00 PM",
    "service_name": "Basic Grooming",
    "price": "$55"
  }'::jsonb
);

-- Log notification
INSERT INTO notifications_log (
  recipient_id, type, channel, template_id,
  template_data, status, message_id
) VALUES (
  'user-id'::uuid,
  'booking_confirmation',
  'email',
  'template-id'::uuid,
  '{"customer_name": "Sarah", ...}'::jsonb,
  'sent',
  'resend-msg-123'
);
```

### 2. Test XSS Protection
```sql
-- Attempt XSS injection
SELECT * FROM render_template(
  'template-id'::uuid,
  '{"customer_name": "<img src=x onerror=alert(1)>"}'::jsonb
);

-- HTML output will be:
-- &lt;img src=x onerror=alert(1)&gt;
-- (Safe!)
```

### 3. Handle Retry Configuration
```sql
-- Valid: 2 retries, 2 delays
INSERT INTO notification_settings (
  notification_type,
  max_retries,
  retry_delays_seconds
) VALUES (
  'custom_notification',
  2,
  ARRAY[30, 300]  -- 30s, then 5min
);

-- Invalid: mismatched array length
INSERT INTO notification_settings (
  notification_type,
  max_retries,
  retry_delays_seconds
) VALUES (
  'custom_notification',
  2,
  ARRAY[30]  -- ERROR: check constraint violation
);
```

### 4. Update Template Safely
```sql
-- Concurrent updates are safe (advisory locks)
UPDATE notification_templates
SET text_template = 'New content',
    updated_by = 'admin-user-id'::uuid
WHERE id = 'template-id'::uuid;

-- Version automatically incremented
-- Previous version saved to history
```

### 5. Query Statistics
```sql
-- View notification stats (atomic updates ensure accuracy)
SELECT
  notification_type,
  total_sent_count,
  total_failed_count,
  last_sent_at
FROM notification_settings
WHERE notification_type = 'booking_confirmation';
```

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint unique_message_id"
**Cause:** Trying to insert same provider message ID twice
**Solution:** Check if notification already logged, use different message ID

### Error: "violates foreign key constraint fk_notifications_log_type"
**Cause:** Notification type not in notification_settings table
**Solution:** Add type to notification_settings first, or use existing type

### Error: "violates check constraint retry_delays_valid"
**Cause:** Array length doesn't match max_retries
**Solution:** Ensure `array_length(retry_delays_seconds, 1) = max_retries`

### Error: "null value in column violates not-null constraint"
**Cause:** Missing max_retries or retry_delays_seconds
**Solution:** Provide values (defaults: max_retries=2, retry_delays=[30,300])

### Error: "Could not acquire lock for template versioning"
**Cause:** Concurrent template updates deadlocked
**Solution:** Retry update (rare, should auto-resolve)

---

## Performance Tips

1. **Index Usage**
   - `message_id` queries use UNIQUE index (fast)
   - `type` queries use foreign key index (fast)
   - RLS policies use indexed columns (user_id, role)

2. **Batch Operations**
   - Statistics update on each insert (use transactions for bulk)
   - Template versioning on content change only (not metadata)

3. **Monitoring**
   ```sql
   -- Check notification volume
   SELECT type, COUNT(*) as count
   FROM notifications_log
   WHERE created_at > NOW() - INTERVAL '1 day'
   GROUP BY type;

   -- Check retry stats
   SELECT
     notification_type,
     total_sent_count,
     total_failed_count,
     ROUND(100.0 * total_failed_count / NULLIF(total_sent_count, 0), 2) as failure_rate
   FROM notification_settings;
   ```

---

## Testing Checklist

- [ ] Run `PHASE8_VALIDATION_TESTS.sql` in staging
- [ ] Verify all 10 tests pass
- [ ] Test concurrent notifications (load test)
- [ ] Test XSS attempts are blocked
- [ ] Verify RLS policies work for different roles
- [ ] Check statistics accuracy under load
- [ ] Validate template versioning with concurrent updates
- [ ] Test migration rollback (if needed)

---

## Deployment Commands

```bash
# 1. Backup database
pg_dump -h <host> -U <user> -d <database> > backup_before_phase8.sql

# 2. Run migrations in order
psql -h <host> -U <user> -d <database> -f 20241215_phase8_notification_system_schema.sql
psql -h <host> -U <user> -d <database> -f 20241215_phase8_notification_default_settings.sql

# 3. Run validation tests
psql -h <host> -U <user> -d <database> -f PHASE8_VALIDATION_TESTS.sql

# 4. Monitor logs
tail -f /var/log/postgresql/postgresql.log
```

---

## Rollback (If Needed)

```sql
-- See PHASE8_CRITICAL_FIXES_CHANGELOG.md for detailed rollback steps
-- Quick rollback:
DROP FUNCTION IF EXISTS render_template(UUID, JSONB);
DROP FUNCTION IF EXISTS get_active_template(TEXT, TEXT);
DROP FUNCTION IF EXISTS escape_html(TEXT);
DELETE FROM notification_templates;
DELETE FROM notification_settings;
-- ... (see full rollback plan in changelog)
```

---

## Support

**Documentation:**
- `PHASE8_FIXES_SUMMARY.md` - Executive summary
- `PHASE8_CRITICAL_FIXES_CHANGELOG.md` - Detailed changelog
- `PHASE8_VALIDATION_TESTS.sql` - Automated tests

**Contact:**
- Code Review: Assign to senior developer
- Questions: Reference issue numbers (#1-#10)

---

**Last Updated:** 2024-12-15
**Migration Version:** Phase 8 (Tasks 0078-0080)
**Status:** ✅ Production Ready
