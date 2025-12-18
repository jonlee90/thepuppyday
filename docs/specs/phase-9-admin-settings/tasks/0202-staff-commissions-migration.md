# Task 0202: Staff commissions table migration

## Description
Ensure the staff_commissions table exists with proper structure for tracking groomer commission settings. This may have been created in task 0155, but verify and add any missing elements.

## Acceptance Criteria
- [ ] Verify `staff_commissions` table exists with all required columns
- [ ] Ensure columns: id, groomer_id, rate_type, rate, include_addons, service_overrides (JSONB), created_at, updated_at
- [ ] Verify unique constraint on groomer_id
- [ ] Verify foreign key to users table
- [ ] Verify RLS policies for admin full access
- [ ] Verify RLS policy for groomers to view own commission
- [ ] Create updated_at trigger if not exists
- [ ] Add index on groomer_id for performance
- [ ] Test table with sample data insert/update/delete

## Implementation Notes
- File: `supabase/migrations/[timestamp]_verify_staff_commissions.sql` (if needed)
- May be a verification task if 0155 already handled this
- Ensure proper cascading on user delete

## References
- Design: Staff Commission Table section
- Req 18.1, Req 18.8

## Complexity
Small

## Category
Database

## Dependencies
- 0155 (Database migrations)
