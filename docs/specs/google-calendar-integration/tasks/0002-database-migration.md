# Task 0002: Create database migration for calendar tables

## Description
Create Supabase migration to add three new tables for Google Calendar integration with proper indexes, RLS policies, and default settings.

## Files to Create
- `supabase/migrations/[TIMESTAMP]_calendar_integration.sql` - Migration SQL file

## Dependencies
- Task 0001 (TypeScript types should be defined first for reference)

## Acceptance Criteria
- [ ] `calendar_connections` table created with all fields (including encrypted token columns)
- [ ] `calendar_event_mapping` table created for bidirectional sync tracking
- [ ] `calendar_sync_log` table created for audit trail
- [ ] All required indexes created for performance
- [ ] RLS policies added (admin-only access)
- [ ] Default `calendar_sync_settings` inserted into settings table
- [ ] Migration includes rollback script in comments
- [ ] Migration tested locally

## Implementation Notes
- Use AES-256-GCM for token encryption (store encrypted_access_token, encrypted_refresh_token)
- Add indexes on foreign keys and frequently queried columns
- RLS policy: Only admin users can access calendar tables
- Reference schema design from design document Section 3.2

## Requirements Coverage
- Req 1: OAuth Authentication
- Req 21: Audit Logging
- Req 28: Performance Optimization

## Estimated Effort
3 hours
