# Task 0167: Audit logging for settings changes

## Description
Implement audit logging functionality to track all settings changes with admin user ID, timestamp, and old/new values.

## Acceptance Criteria
- [ ] Create `logSettingsChange` utility function
- [ ] Log admin_id, setting_type, setting_key, old_value, new_value, created_at
- [ ] Setting types: 'booking', 'loyalty', 'site_content', 'banner', 'staff'
- [ ] Integrate audit logging into site content API route
- [ ] Store old_value before update, new_value after update
- [ ] Handle JSONB serialization for complex values
- [ ] Create helper to compare old and new values to detect actual changes
- [ ] Only log when values actually changed (not on no-op saves)
- [ ] Create `getAuditLog` function for viewing recent changes
- [ ] Add RLS policy allowing only admins to read audit log

## Implementation Notes
- File: `src/lib/admin/audit-log.ts`
- Use Supabase client to insert into settings_audit_log table
- Consider batching audit logs for bulk operations
- Ensure audit logging doesn't block main operation on failure

## References
- NFR-2.3
- Design: Audit Log Table section

## Complexity
Small

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0159 (Site content API)
