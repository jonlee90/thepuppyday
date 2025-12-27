# Task 0231: Enable RLS on All Tables

## Description
Enable Row Level Security on all database tables to enforce data access policies at the database level.

## Checklist
- [ ] Create migration to enable RLS on users, pets, appointments, waitlist tables
- [ ] Enable RLS on report_cards, customer_flags, notifications_log tables
- [ ] Enable RLS on customer_loyalty, loyalty_punches, loyalty_redemptions tables
- [ ] Create helper functions: auth.user_id() and auth.is_admin_or_staff()

## Acceptance Criteria
All tables have RLS enabled, helper functions created

## References
- Requirement 6 (Row Level Security)
- Design 10.2.1

## Files to Create/Modify
- `supabase/migrations/20251227_enable_rls.sql`

## Implementation Notes
Helper functions may already exist from previous migrations. Verify before creating.
