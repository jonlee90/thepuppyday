# Task 0235: Create RLS policies for admin tables

**Phase**: 10.2 Security
**Prerequisites**: 0231
**Estimated effort**: 2-3 hours

## Objective

Create Row Level Security policies granting admin and staff full access to all tables.

## Requirements

- Create full access policies for admin/groomer roles on all tables
- Create policies for notifications_log, report_cards, customer_flags
- Ensure admins have CRUD access to all data

## Acceptance Criteria

- [ ] Admin users have full SELECT/INSERT/UPDATE/DELETE on all tables
- [ ] Groomer users have appropriate access based on role
- [ ] Admin policies tested with admin user account
- [ ] Policies don't conflict with customer policies

## Implementation Details

### Migration to Create

- Add RLS policies for admin access

### Example Policies

```sql
-- Admin full access to all tables
CREATE POLICY "admin_full_access"
  ON appointments FOR ALL
  TO authenticated
  USING (auth.is_admin_or_staff());

CREATE POLICY "admin_report_cards"
  ON report_cards FOR ALL
  TO authenticated
  USING (auth.is_admin_or_staff());

CREATE POLICY "admin_notifications"
  ON notifications_log FOR ALL
  TO authenticated
  USING (auth.is_admin_or_staff());
```

### Tables Requiring Admin Policies

- appointments
- report_cards
- notifications_log
- customer_flags
- settings
- promo_banners (CRUD)
- gallery_images (CRUD)

## References

- **Requirements**: Req 6.5
- **Design**: Section 10.2.1
