# Phase 9: Admin Settings & Content Management - Quick Reference

## Migration: 20241217_phase9_admin_settings_schema.sql

### New Tables Created

#### 1. `staff_commissions`
Stores commission rates for groomers/staff members.

**Columns:**
- `id` (UUID, PK)
- `groomer_id` (UUID, FK → users.id, UNIQUE)
- `rate_type` (TEXT: 'percentage' or 'flat_rate')
- `rate` (DECIMAL)
- `include_addons` (BOOLEAN, default false)
- `service_overrides` (JSONB) - Per-service commission rates
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Example Usage:**
```sql
-- Set 50% commission for a groomer
INSERT INTO staff_commissions (groomer_id, rate_type, rate, include_addons)
VALUES ('groomer-uuid', 'percentage', 50.00, true);

-- Set per-service overrides
UPDATE staff_commissions
SET service_overrides = '{
  "premium-service-id": {"rate_type": "percentage", "rate": 60.00},
  "basic-service-id": {"rate_type": "flat_rate", "rate": 25.00}
}'::jsonb
WHERE groomer_id = 'groomer-uuid';
```

#### 2. `referral_codes`
Stores customer referral codes for the referral program.

**Columns:**
- `id` (UUID, PK)
- `customer_id` (UUID, FK → users.id)
- `code` (TEXT, UNIQUE)
- `uses_count` (INTEGER, default 0)
- `max_uses` (INTEGER, nullable - NULL = unlimited)
- `is_active` (BOOLEAN, default true)
- `created_at` (TIMESTAMPTZ)

**Example Usage:**
```sql
-- Create referral code for customer
INSERT INTO referral_codes (customer_id, code, max_uses)
VALUES ('customer-uuid', 'JOHN-SMITH-2024', 10);

-- Increment uses when code is used
UPDATE referral_codes
SET uses_count = uses_count + 1
WHERE code = 'JOHN-SMITH-2024';
```

#### 3. `referrals`
Tracks individual referrals and their completion status.

**Columns:**
- `id` (UUID, PK)
- `referrer_id` (UUID, FK → users.id) - Customer who referred
- `referee_id` (UUID, FK → users.id, UNIQUE) - Customer who was referred
- `referral_code_id` (UUID, FK → referral_codes.id)
- `status` (TEXT: 'pending', 'completed', 'cancelled')
- `referrer_bonus_awarded` (BOOLEAN, default false)
- `referee_bonus_awarded` (BOOLEAN, default false)
- `completed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)

**Example Usage:**
```sql
-- Create referral when new customer uses code
INSERT INTO referrals (referrer_id, referee_id, referral_code_id, status)
VALUES ('referrer-uuid', 'new-customer-uuid', 'code-uuid', 'pending');

-- Complete referral after first visit
UPDATE referrals
SET status = 'completed',
    completed_at = NOW(),
    referrer_bonus_awarded = true,
    referee_bonus_awarded = true
WHERE referee_id = 'new-customer-uuid';
```

#### 4. `settings_audit_log`
Audit trail for all admin settings changes.

**Columns:**
- `id` (UUID, PK)
- `admin_id` (UUID, FK → users.id)
- `setting_type` (TEXT: 'booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other')
- `setting_key` (TEXT) - Specific setting identifier
- `old_value` (JSONB)
- `new_value` (JSONB)
- `created_at` (TIMESTAMPTZ)

**Example Usage:**
```sql
-- Log a settings change
INSERT INTO settings_audit_log (admin_id, setting_type, setting_key, old_value, new_value)
VALUES (
  'admin-uuid',
  'booking',
  'min_advance_hours',
  '{"value": 2}'::jsonb,
  '{"value": 4}'::jsonb
);

-- View recent changes
SELECT * FROM settings_audit_log
ORDER BY created_at DESC
LIMIT 20;
```

### Modified Tables

#### `promo_banners`
Added `impression_count` column (BIGINT, default 0) to track banner display counts.

**Example Usage:**
```sql
-- Increment impression count
UPDATE promo_banners
SET impression_count = impression_count + 1
WHERE id = 'banner-uuid';
```

### Indexes Created

#### staff_commissions
- `idx_staff_commissions_groomer` on `groomer_id`

#### referral_codes
- `idx_referral_codes_customer` on `customer_id`
- `idx_referral_codes_code` on `code` (WHERE is_active = true)
- `idx_referral_codes_active` on `is_active` (WHERE is_active = true)

#### referrals
- `idx_referrals_referrer` on `referrer_id`
- `idx_referrals_referee` on `referee_id`
- `idx_referrals_code` on `referral_code_id`
- `idx_referrals_status` on `status`
- `idx_referrals_created` on `created_at DESC`

#### settings_audit_log
- `idx_settings_audit_log_admin` on `admin_id`
- `idx_settings_audit_log_type` on `setting_type`
- `idx_settings_audit_log_created` on `created_at DESC`
- `idx_settings_audit_log_key` on `setting_key`

### RLS Policies

#### staff_commissions
- **Admins**: Full access (all operations)
- **Groomers**: Can view their own commission (SELECT only)

#### referral_codes
- **Admins**: Full access (all operations)
- **Customers**: Can view and create their own codes (SELECT, INSERT)

#### referrals
- **Admins**: Full access (all operations)
- **Customers**: Can view referrals where they are referrer or referee (SELECT)
- **Customers**: Can create referrals as referee (INSERT)

#### settings_audit_log
- **Admins**: Full access (all operations)

### Default Settings Inserted

#### 1. `booking_settings`
```json
{
  "min_advance_hours": 2,
  "max_advance_days": 90,
  "cancellation_cutoff_hours": 24,
  "buffer_minutes": 15
}
```

#### 2. `loyalty_earning_rules`
```json
{
  "qualifying_services": [],
  "minimum_spend": 0,
  "first_visit_bonus": 0
}
```

#### 3. `loyalty_redemption_rules`
```json
{
  "eligible_services": [],
  "expiration_days": 365,
  "max_value": null
}
```

#### 4. `referral_program`
```json
{
  "is_enabled": false,
  "referrer_bonus_punches": 1,
  "referee_bonus_punches": 1
}
```

### Default Site Content Inserted

#### 1. `hero`
```json
{
  "headline": "Professional Dog Grooming in La Mirada",
  "subheadline": "We treat your pup like family with gentle, expert care",
  "cta_buttons": [
    {"text": "Book Appointment", "url": "/booking"},
    {"text": "View Services", "url": "/services"}
  ],
  "background_image_url": null
}
```

#### 2. `seo`
```json
{
  "page_title": "Puppy Day - Professional Dog Grooming | La Mirada, CA",
  "meta_description": "Professional dog grooming services in La Mirada, CA. Expert care for dogs of all sizes. Book your appointment today at Puppy Day!",
  "og_title": "Puppy Day - Professional Dog Grooming in La Mirada",
  "og_description": "We treat your pup like family with gentle, expert grooming care. Serving La Mirada and surrounding areas."
}
```

#### 3. `business_info`
```json
{
  "name": "Puppy Day",
  "address": "14936 Leffingwell Rd, La Mirada, CA 90638",
  "phone": "(657) 252-2903",
  "email": "puppyday14936@gmail.com",
  "hours": {
    "monday": "9:00 AM - 5:00 PM",
    "tuesday": "9:00 AM - 5:00 PM",
    "wednesday": "9:00 AM - 5:00 PM",
    "thursday": "9:00 AM - 5:00 PM",
    "friday": "9:00 AM - 5:00 PM",
    "saturday": "9:00 AM - 5:00 PM",
    "sunday": "Closed"
  },
  "social_media": {
    "instagram": "@puppyday_lm",
    "yelp": "Puppy Day La Mirada"
  }
}
```

### Helper Views

#### `staff_commission_earnings`
Summary view of staff commission earnings from completed appointments.

**Columns:**
- `id` - Commission record ID
- `groomer_id` - Groomer user ID
- `groomer_name` - Full name
- `rate_type` - Commission type
- `rate` - Commission rate
- `include_addons` - Whether addons are included
- `total_appointments` - Count of completed appointments
- `total_revenue` - Sum of appointment total prices
- `estimated_commission` - Calculated commission amount

**Example Usage:**
```sql
-- View all groomer earnings
SELECT * FROM staff_commission_earnings
ORDER BY estimated_commission DESC;

-- View specific groomer's earnings
SELECT * FROM staff_commission_earnings
WHERE groomer_id = 'groomer-uuid';
```

### Triggers

#### `trigger_staff_commissions_updated_at`
Automatically updates `updated_at` timestamp on `staff_commissions` table when row is modified.

### Constraints

#### staff_commissions
- `staff_commissions_rate_type_check` - Ensures rate_type is 'percentage' or 'flat_rate'
- `staff_commissions_rate_check` - Ensures rate >= 0
- `staff_commissions_groomer_id_key` - Ensures one commission record per groomer (UNIQUE)

#### referral_codes
- `referral_codes_code_key` - Ensures referral codes are unique (UNIQUE)
- `referral_codes_uses_count_check` - Ensures uses_count >= 0
- `max_uses_check` - Ensures uses_count <= max_uses (if max_uses is set)

#### referrals
- `referrals_status_check` - Ensures status is 'pending', 'completed', or 'cancelled'
- `referrals_referee_id_key` - Ensures each customer can only be referred once (UNIQUE)
- `referrer_not_referee` - Ensures referrer_id != referee_id

## Common Queries

### Get active referral codes for a customer
```sql
SELECT * FROM referral_codes
WHERE customer_id = 'customer-uuid'
AND is_active = true
ORDER BY created_at DESC;
```

### Check if referral code is valid and available
```sql
SELECT
  code,
  uses_count,
  max_uses,
  (max_uses IS NULL OR uses_count < max_uses) as can_use
FROM referral_codes
WHERE code = 'REFERRAL-CODE'
AND is_active = true;
```

### Get referral statistics for a customer
```sql
SELECT
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals
FROM referrals
WHERE referrer_id = 'customer-uuid';
```

### Get groomer commission summary
```sql
SELECT * FROM staff_commission_earnings
WHERE groomer_id = 'groomer-uuid';
```

### Audit recent settings changes
```sql
SELECT
  sal.setting_type,
  sal.setting_key,
  sal.old_value,
  sal.new_value,
  u.first_name || ' ' || u.last_name as admin_name,
  sal.created_at
FROM settings_audit_log sal
LEFT JOIN users u ON u.id = sal.admin_id
ORDER BY sal.created_at DESC
LIMIT 50;
```

## Migration Notes

1. **Dependencies**: This migration depends on the `users` table and `update_updated_at()` function being present (from initial schema).

2. **Idempotent**: The migration uses `IF NOT EXISTS` clauses and `ON CONFLICT DO NOTHING` to ensure it can be run multiple times safely.

3. **Data Seeding**: Default settings and site content are inserted automatically. These can be updated later through the admin interface.

4. **RLS**: All new tables have Row Level Security enabled with appropriate policies for admin and customer access.

5. **Performance**: Indexes are created on frequently queried columns to ensure good performance as data grows.

6. **Audit Trail**: The `settings_audit_log` table provides a complete audit trail of all admin settings changes for compliance and debugging.

## Validation

Run the validation tests in `PHASE9_VALIDATION_TESTS.sql` to verify the migration was successful:

```bash
psql -f supabase/migrations/PHASE9_VALIDATION_TESTS.sql
```

All tests should return 'PASS' status.
