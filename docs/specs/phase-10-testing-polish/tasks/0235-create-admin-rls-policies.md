# Task 0235: Create Admin RLS Policies

## Description
Create comprehensive RLS policies granting admin and groomer roles full access to all data tables.

## Checklist
- [ ] Create admin full access policies for all customer data tables
- [ ] Create admin full access policies for services, addons, gallery
- [ ] Create admin full access policies for notifications_log
- [ ] Verify admins can bypass customer restrictions

## Acceptance Criteria
Admins have full CRUD access, verified with test queries

## References
- Requirement 6.5
- Design 10.2.1

## Files to Create/Modify
- `supabase/migrations/20251227_rls_admin_policies.sql`

## Implementation Notes
Admin policies may already exist in previous migrations. Verification and consolidation needed.
