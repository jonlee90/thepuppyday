# Task 0171: Banner reorder API route

## Description
Create API route for updating the display order of promotional banners.

## Acceptance Criteria
- [ ] Create PUT `/api/admin/settings/banners/reorder` endpoint
- [ ] Accept array of { id: string, display_order: number } objects
- [ ] Validate all banner IDs exist
- [ ] Update display_order for all provided banners in a single transaction
- [ ] Return success response
- [ ] Implement `requireAdmin()` authentication check
- [ ] Handle race conditions with optimistic locking
- [ ] Return 400 if display_order values have duplicates

## Implementation Notes
- File: `src/app/api/admin/settings/banners/reorder/route.ts`
- Use Supabase transaction for atomic update
- Consider using upsert for efficiency

## References
- Req 6.3
- Design: Promo Banners API section

## Complexity
Small

## Category
API

## Dependencies
- 0169 (Banner list API)
