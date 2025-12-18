# Task 0168: Site content integration with marketing pages

## Description
Integrate site content settings with the public marketing pages so changes reflect immediately without deployment.

## Acceptance Criteria
- [ ] Update marketing homepage to fetch hero content from site_content table
- [ ] Update homepage hero section with dynamic headline, subheadline, background image, CTA buttons
- [ ] Update page metadata to use SEO settings from site_content table
- [ ] Update footer component to use business info from site_content table
- [ ] Update contact page to use dynamic business info
- [ ] Ensure changes reflect within 5 seconds (no aggressive caching)
- [ ] Handle missing content gracefully with fallback defaults
- [ ] Use server components for initial data fetch
- [ ] Create reusable `getSiteContent` utility function

## Implementation Notes
- Update: `src/app/(marketing)/page.tsx`
- Update: `src/components/marketing/Footer.tsx`
- Update: `src/app/(marketing)/contact/page.tsx`
- Use dynamic rendering or short revalidation time
- Consider ISR with revalidate: 1 for near-instant updates

## References
- Req 1.9
- NFR-1.1
- IR-1.1, IR-1.3
- Design: Public Site Integration section

## Complexity
Medium

## Category
Integration

## Dependencies
- 0159 (Site content API)
- 0160-0165 (All site content editors)
