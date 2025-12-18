# Task 0169: Banner API routes (GET, POST)

## Description
Create API routes for listing and creating promotional banners.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/banners` to fetch all banners
- [ ] Support query param `status` to filter: all, active, scheduled, expired, draft
- [ ] Return banners array with total count
- [ ] Order by display_order ascending
- [ ] Include computed status field based on is_active, start_date, end_date
- [ ] Create POST `/api/admin/settings/banners` to create new banner
- [ ] Accept: image_url, alt_text (required), click_url, start_date, end_date, is_active
- [ ] Set is_active to false by default
- [ ] Auto-assign next display_order value
- [ ] Validate URL formats for image_url and click_url
- [ ] Implement `requireAdmin()` authentication check
- [ ] Return created banner with id

## Implementation Notes
- File: `src/app/api/admin/settings/banners/route.ts`
- Status logic: Draft (not active, no dates), Scheduled (start_date > now), Active (is_active and within dates), Expired (end_date < now)
- Use Supabase queries with filters

## References
- Req 4.1, Req 4.6, Req 4.8
- Req 5.8
- Design: Promo Banners API section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0156 (TypeScript types)
