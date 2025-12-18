# Task 0170: Banner individual API routes (GET, PUT, DELETE)

## Description
Create API routes for managing individual promotional banners including fetch, update, and delete operations.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/banners/[id]` to fetch single banner
- [ ] Return 404 if banner not found
- [ ] Include click analytics summary (total clicks, impressions)
- [ ] Create PUT `/api/admin/settings/banners/[id]` to update banner
- [ ] Accept partial updates: alt_text, click_url, start_date, end_date, is_active
- [ ] Validate end_date is after start_date
- [ ] Create DELETE `/api/admin/settings/banners/[id]` to delete banner
- [ ] Soft-delete if banner has click analytics data (set is_active=false, deleted_at=now)
- [ ] Hard-delete if no analytics data exists
- [ ] Return 409 Conflict if trying to delete banner with pending analytics
- [ ] Implement `requireAdmin()` authentication check on all routes
- [ ] Create audit log entries for updates and deletes

## Implementation Notes
- File: `src/app/api/admin/settings/banners/[id]/route.ts`
- Consider adding deleted_at column for soft delete if not exists
- Preserve historical analytics on delete

## References
- Req 4.5, Req 6.8
- Design: Promo Banners API section

## Complexity
Medium

## Category
API

## Dependencies
- 0169 (Banner list API)
