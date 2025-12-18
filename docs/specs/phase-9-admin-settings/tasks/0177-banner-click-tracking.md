# Task 0177: Banner click tracking endpoint

## Description
Create public endpoint for tracking banner clicks and incrementing click count.

## Acceptance Criteria
- [ ] Create GET `/api/banners/[id]/click` endpoint (public, no auth)
- [ ] Increment click_count atomically in promo_banners table
- [ ] Redirect to banner's click_url after tracking
- [ ] Return 404 if banner not found or not active
- [ ] Skip tracking if banner has no click_url
- [ ] Update public banner component to use tracking endpoint
- [ ] Add utm_source parameter to redirect URL for attribution
- [ ] Implement rate limiting (100 clicks per IP per minute)
- [ ] Log click events for analytics

## Implementation Notes
- File: `src/app/api/banners/[id]/click/route.ts`
- Use SQL atomic increment: UPDATE ... SET click_count = click_count + 1
- Consider tracking unique clicks via cookies/localStorage in future
- Redirect using 302 status code

## References
- Req 7.2, Req 7.6
- Design: Banner Click Tracking section

## Complexity
Small

## Category
API

## Dependencies
- 0170 (Banner individual API)
