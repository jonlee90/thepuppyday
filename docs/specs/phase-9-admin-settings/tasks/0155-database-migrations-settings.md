# Task 0155: Database migrations for Phase 9 settings tables

## Description
Create database migrations for new tables required by Phase 9: staff_commissions, referral_codes, referrals, and settings_audit_log. Also add impression_count column to promo_banners table.

## Acceptance Criteria
- [ ] Create `staff_commissions` table with fields: id, groomer_id, rate_type, rate, include_addons, service_overrides (JSONB), timestamps
- [ ] Create `referral_codes` table with fields: id, customer_id, code, uses_count, max_uses, is_active, created_at
- [ ] Create `referrals` table with fields: id, referrer_id, referee_id, referral_code_id, status, referrer_bonus_awarded, referee_bonus_awarded, completed_at, created_at
- [ ] Create `settings_audit_log` table with fields: id, admin_id, setting_type, setting_key, old_value (JSONB), new_value (JSONB), created_at
- [ ] Add `impression_count` column to existing `promo_banners` table
- [ ] Create appropriate indexes for all tables
- [ ] Enable RLS on all new tables
- [ ] Create RLS policies for admin access
- [ ] Create RLS policy for groomers to view own commission
- [ ] Create RLS policy for customers to view own referral code
- [ ] Create trigger for staff_commissions updated_at timestamp
- [ ] Insert default settings for booking_settings, loyalty_earning_rules, loyalty_redemption_rules, referral_program
- [ ] Insert default site_content for hero, seo, business_info

## Implementation Notes
- Migration file: `supabase/migrations/[timestamp]_phase9_admin_settings_schema.sql`
- Follow existing migration patterns from Phase 8
- Use `uuid_generate_v4()` for primary keys
- Staff commission unique constraint on groomer_id
- Referrals unique constraint on referee_id (each customer can only be referred once)

## References
- Design: Database Design section
- Req 17.8, Req 18.8, Req 16.7, DR-4.2

## Complexity
Large

## Category
Database

## Dependencies
None
