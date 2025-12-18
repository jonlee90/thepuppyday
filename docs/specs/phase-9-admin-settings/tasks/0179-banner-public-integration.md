# Task 0179: Banner integration with public site

## Description
Integrate promotional banners with the public marketing site homepage.

## Acceptance Criteria
- [ ] Create `PromoBannerCarousel` component for marketing pages
- [ ] Fetch active banners from database: is_active=true, within date range
- [ ] Order banners by display_order
- [ ] Display banners in carousel/slider if multiple active
- [ ] Auto-rotate banners every 5 seconds
- [ ] Include navigation dots and prev/next arrows
- [ ] Banner click goes through tracking endpoint before redirect
- [ ] Hide banner section entirely if no active banners
- [ ] Implement lazy loading for banner images
- [ ] Ensure responsive design for all screen sizes
- [ ] Track impressions by incrementing impression_count on view

## Implementation Notes
- File: `src/components/marketing/PromoBannerCarousel.tsx`
- Update: `src/app/(marketing)/page.tsx` to include carousel
- Use Swiper.js or similar for carousel functionality
- Server component fetches data, client component handles carousel

## References
- Req 6.6, Req 6.7
- IR-1.2
- Design: Public Site Integration section

## Complexity
Medium

## Category
UI, Integration

## Dependencies
- 0169 (Banner list API)
- 0177 (Banner click tracking)
