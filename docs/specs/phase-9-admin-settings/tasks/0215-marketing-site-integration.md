# Task 0215: Integration with public marketing site

## Description
Ensure all site content and banner settings are properly integrated with the public marketing pages.

## Acceptance Criteria
- [ ] Homepage hero section displays dynamic content from site_content
- [ ] Hero headline, subheadline, background image, CTA buttons are rendered
- [ ] Page metadata uses SEO settings (title, description, OG tags)
- [ ] Footer displays dynamic business info (name, address, phone, email, social)
- [ ] Contact page displays dynamic business info
- [ ] Promo banner carousel displays active banners
- [ ] Banner clicks go through tracking endpoint
- [ ] Banner carousel hides when no active banners
- [ ] Changes reflect within 5 seconds (no aggressive caching)
- [ ] Fallback defaults display if content is missing
- [ ] Write automated test for content integration

## Implementation Notes
- Update: Marketing page components
- Ensure proper error handling for missing content
- Use server components for initial data fetch

## References
- IR-1.1, IR-1.2, IR-1.3
- NFR-1.1
- Req 1.9, Req 3.5
- Design: Public Site Integration section

## Complexity
Medium

## Category
Integration

## Dependencies
- 0168 (Site content integration)
- 0179 (Banner public integration)
