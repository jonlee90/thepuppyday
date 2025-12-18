# Phase 9: Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PHASE 9 NEW TABLES                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   users (existing)   │
│──────────────────────│
│ id (PK)             │◄─────────────┐
│ email               │              │
│ first_name          │              │
│ last_name           │              │
│ role                │              │
└──────────────────────┘              │
         ▲                            │
         │                            │
         │                            │
    ┌────┴─────────────┬──────────────┼──────────────┬───────────────┐
    │                  │              │              │               │
    │                  │              │              │               │
┌───┴──────────────┐ ┌─┴──────────────┴─┐  ┌────────┴─────────┐ ┌───┴─────────────────┐
│ staff_commissions│ │  referral_codes   │  │   referrals      │ │ settings_audit_log  │
│──────────────────│ │───────────────────│  │──────────────────│ │─────────────────────│
│ id (PK)          │ │ id (PK)           │  │ id (PK)          │ │ id (PK)             │
│ groomer_id (FK)  │ │ customer_id (FK)  │  │ referrer_id (FK) │ │ admin_id (FK)       │
│ rate_type        │ │ code (UNIQUE)     │  │ referee_id (FK)  │ │ setting_type        │
│ rate             │ │ uses_count        │  │ referral_code_id │ │ setting_key         │
│ include_addons   │ │ max_uses          │  │ status           │ │ old_value (JSONB)   │
│ service_overrides│ │ is_active         │  │ referrer_bonus   │ │ new_value (JSONB)   │
│ created_at       │ │ created_at        │  │ referee_bonus    │ │ created_at          │
│ updated_at       │ └───────────────────┘  │ completed_at     │ └─────────────────────┘
└──────────────────┘           │            │ created_at       │
                               │            └──────────────────┘
                               │                     ▲
                               │                     │
                               │              ┌──────┘
                               │              │ (FK)
                               └──────────────┼──────────────┐
                                              │              │
                                    ┌─────────▼──────────┐   │
                                    │   referrals        │   │
                                    │────────────────────│   │
                                    │ referral_code_id ──┼───┘
                                    │ (FK to            │
                                    │  referral_codes)  │
                                    └───────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      MODIFIED EXISTING TABLE                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   promo_banners      │
│──────────────────────│
│ id (PK)              │
│ image_url            │
│ alt_text             │
│ click_url            │
│ start_date           │
│ end_date             │
│ is_active            │
│ display_order        │
│ click_count          │
│ impression_count NEW │ ◄── ADDED: Tracks banner display counts
│ created_at           │
└──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           HELPER VIEW                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│  staff_commission_earnings (VIEW) │
│──────────────────────────────────│
│ Joins:                            │
│   - staff_commissions             │
│   - users                         │
│   - appointments                  │
│                                   │
│ Calculates:                       │
│   - total_appointments            │
│   - total_revenue                 │
│   - estimated_commission          │
└───────────────────────────────────┘
```

## Table Relationships

### 1. staff_commissions → users
- **Relationship:** Many-to-One (each groomer has one commission record)
- **Foreign Key:** `groomer_id` → `users.id`
- **Constraint:** UNIQUE on `groomer_id` (one commission per groomer)
- **On Delete:** CASCADE (commission deleted when groomer deleted)

### 2. referral_codes → users
- **Relationship:** Many-to-One (customers can have multiple codes)
- **Foreign Key:** `customer_id` → `users.id`
- **Constraint:** UNIQUE on `code` (codes must be unique across all customers)
- **On Delete:** CASCADE (codes deleted when customer deleted)

### 3. referrals → users (referrer)
- **Relationship:** Many-to-One (customer can refer many people)
- **Foreign Key:** `referrer_id` → `users.id`
- **On Delete:** CASCADE (referrals deleted when referrer deleted)

### 4. referrals → users (referee)
- **Relationship:** One-to-One (each customer can only be referred once)
- **Foreign Key:** `referee_id` → `users.id`
- **Constraint:** UNIQUE on `referee_id` (one referral per referred customer)
- **On Delete:** CASCADE (referral deleted when referee deleted)

### 5. referrals → referral_codes
- **Relationship:** Many-to-One (many referrals can use same code)
- **Foreign Key:** `referral_code_id` → `referral_codes.id`
- **On Delete:** CASCADE (referrals deleted when code deleted)

### 6. settings_audit_log → users
- **Relationship:** Many-to-One (admin makes many changes)
- **Foreign Key:** `admin_id` → `users.id`
- **On Delete:** SET NULL (preserve audit log even if admin deleted)
- **Note:** Append-only table (no updates/deletes)

## Data Flow Examples

### Commission Calculation Flow
```
1. Admin creates commission record
   staff_commissions (groomer_id, rate_type, rate)

2. Groomer completes appointments
   appointments (groomer_id, status='completed', total_price)

3. View calculates earnings
   staff_commission_earnings
   └─ Joins staff_commissions + appointments
   └─ Calculates: total_revenue × (rate / 100) OR count × rate
```

### Referral Flow
```
1. Customer signs up and gets referral code
   referral_codes (customer_id, code='JOHN2024')

2. Friend uses code during signup
   referrals (referrer_id, referee_id, referral_code_id, status='pending')
   referral_codes.uses_count += 1

3. Friend completes first appointment
   UPDATE referrals
   SET status='completed',
       completed_at=NOW(),
       referrer_bonus_awarded=true,
       referee_bonus_awarded=true

4. Both get loyalty punch bonuses
   loyalty_punches (customer_id, bonus_reason='referral')
```

### Settings Change Audit Flow
```
1. Admin updates a setting
   UPDATE settings
   SET value = new_value
   WHERE key = 'booking_settings'

2. Application logs the change
   INSERT INTO settings_audit_log
   (admin_id, setting_type, setting_key, old_value, new_value)

3. Admin can view history
   SELECT * FROM settings_audit_log
   WHERE setting_key = 'booking_settings'
   ORDER BY created_at DESC
```

### Banner Impression Tracking Flow
```
1. Customer views homepage
   Banner component renders

2. Impression recorded
   UPDATE promo_banners
   SET impression_count = impression_count + 1
   WHERE id = banner_id

3. Admin views analytics
   SELECT
     image_url,
     impression_count,
     click_count,
     (click_count::float / NULLIF(impression_count, 0)) as ctr
   FROM promo_banners
   ORDER BY impression_count DESC
```

## Index Strategy

### Performance Optimizations

**staff_commissions:**
- `idx_staff_commissions_groomer` - Fast groomer lookup
- Purpose: Find commission for logged-in groomer

**referral_codes:**
- `idx_referral_codes_customer` - Fast customer lookup
- `idx_referral_codes_code` - Fast code validation (partial: active only)
- `idx_referral_codes_active` - List active codes
- Purpose: Validate codes during signup, list customer's codes

**referrals:**
- `idx_referrals_referrer` - Find all people customer referred
- `idx_referrals_referee` - Check if customer was referred
- `idx_referrals_code` - Track code usage
- `idx_referrals_status` - Filter by status (pending/completed)
- `idx_referrals_created` - Recent referrals first
- Purpose: Customer dashboard stats, admin reporting

**settings_audit_log:**
- `idx_settings_audit_log_admin` - Find changes by admin
- `idx_settings_audit_log_type` - Filter by setting category
- `idx_settings_audit_log_created` - Recent changes first
- `idx_settings_audit_log_key` - History for specific setting
- Purpose: Audit trail queries, compliance reporting

## RLS Security Model

### Access Control Matrix

| Table                | Admin | Groomer | Customer | Anonymous |
|---------------------|-------|---------|----------|-----------|
| staff_commissions   | CRUD  | R (own) | -        | -         |
| referral_codes      | CRUD  | -       | CR (own) | -         |
| referrals           | CRUD  | -       | CR (own) | -         |
| settings_audit_log  | CRUD  | -       | -        | -         |
| promo_banners       | CRUD  | R       | R        | R         |

**Legend:**
- C = CREATE
- R = READ
- U = UPDATE
- D = DELETE
- (own) = Only their own records

### Policy Examples

**Groomer viewing own commission:**
```sql
-- Policy: groomers_view_own_commission
WHERE groomer_id = auth.uid()
  AND user.role = 'groomer'
```

**Customer creating referral code:**
```sql
-- Policy: customers_create_own_referral_codes
WITH CHECK (customer_id = auth.uid())
```

**Admin viewing all audit logs:**
```sql
-- Policy: admins_all_access_settings_audit_log
WHERE EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
)
```

## Constraints & Business Rules

### staff_commissions
- ✓ One commission record per groomer (UNIQUE groomer_id)
- ✓ Rate type must be 'percentage' or 'flat_rate'
- ✓ Rate must be non-negative
- ✓ Service overrides stored as JSONB for flexibility

### referral_codes
- ✓ Codes must be unique across system
- ✓ Uses count cannot be negative
- ✓ Uses count cannot exceed max_uses (if set)
- ✓ Max uses can be NULL (unlimited)

### referrals
- ✓ Each customer can only be referred once (UNIQUE referee_id)
- ✓ Customer cannot refer themselves (CHECK referrer_id != referee_id)
- ✓ Status must be 'pending', 'completed', or 'cancelled'
- ✓ Bonuses tracked separately for referrer and referee

### settings_audit_log
- ✓ All changes recorded (append-only)
- ✓ Old and new values preserved as JSONB
- ✓ Setting type categorization enforced
- ✓ Admin can be NULL (deleted admins don't break audit)

## Storage Estimates

### Expected Row Counts (after 1 year)

| Table                | Estimated Rows | Growth Rate    |
|---------------------|----------------|----------------|
| staff_commissions   | 5-10           | Very Low       |
| referral_codes      | 100-500        | Low-Medium     |
| referrals           | 200-1000       | Low-Medium     |
| settings_audit_log  | 500-2000       | Low            |

### Storage Requirements

**staff_commissions:** ~1KB per row
- Small table, minimal storage

**referral_codes:** ~500B per row
- TEXT code + metadata
- Total: ~250KB - 500KB

**referrals:** ~300B per row
- 3 UUIDs + status + timestamps
- Total: ~300KB - 600KB

**settings_audit_log:** ~1-5KB per row (depends on JSONB size)
- Can grow larger with complex settings
- Total: ~2.5MB - 10MB (consider archival after 1 year)

**Total Phase 9 Storage:** < 15MB (very low impact)

## Migration Rollback Strategy

If issues occur, rollback in reverse dependency order:

```sql
-- 1. Drop view (no dependencies)
DROP VIEW IF EXISTS public.staff_commission_earnings;

-- 2. Drop settings_audit_log (no dependencies)
DROP TABLE IF EXISTS public.settings_audit_log CASCADE;

-- 3. Drop referrals (depends on referral_codes)
DROP TABLE IF EXISTS public.referrals CASCADE;

-- 4. Drop referral_codes (depends on users)
DROP TABLE IF EXISTS public.referral_codes CASCADE;

-- 5. Drop staff_commissions (depends on users)
DROP TABLE IF EXISTS public.staff_commissions CASCADE;

-- 6. Revert promo_banners change
ALTER TABLE public.promo_banners
DROP COLUMN IF EXISTS impression_count;

-- 7. Clean up default data
DELETE FROM public.settings
WHERE key IN ('booking_settings', 'loyalty_earning_rules',
              'loyalty_redemption_rules', 'referral_program');

DELETE FROM public.site_content
WHERE key IN ('hero', 'seo', 'business_info');
```

**Estimated Rollback Time:** < 2 seconds

## Future Enhancements

### Potential Additions

1. **Commission History Table**
   - Track commission rate changes over time
   - Calculate historical earnings accurately

2. **Referral Tiers**
   - Multiple reward levels
   - Bonus for X successful referrals

3. **Settings Version Control**
   - Full diff view in audit log
   - Rollback capability

4. **Banner A/B Testing**
   - Track multiple variants
   - Conversion tracking beyond impressions

5. **Commission Payments Table**
   - Track actual payouts to groomers
   - Payment status and methods
