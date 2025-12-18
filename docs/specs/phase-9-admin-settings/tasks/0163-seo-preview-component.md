# Task 0163: SEO preview component (Google search result)

## Description
Create a preview component that shows how the page will appear in Google search results and social media shares.

## Acceptance Criteria
- [ ] Create `SeoPreview` component
- [ ] Display Google search result preview with:
  - Page title (truncated at 60 chars with ellipsis)
  - URL display (puppyday-la-mirada.com format)
  - Meta description (truncated at 160 chars)
- [ ] Display Open Graph preview showing:
  - OG image placeholder/preview
  - OG title
  - OG description
  - Site name
- [ ] Update preview in real-time as user types
- [ ] Show character count warnings (red when over limit)
- [ ] Use realistic Google/Facebook styling for previews
- [ ] Handle empty fields with placeholder text

## Implementation Notes
- File: `src/components/admin/settings/site-content/SeoPreview.tsx`
- Google preview should mimic actual Google search result styling
- OG preview should mimic Facebook/LinkedIn share card
- Consider tab toggle between Google and Social previews

## References
- Req 2.6
- Design: SEO Settings Component section

## Complexity
Small

## Category
UI

## Dependencies
- 0162 (SEO settings editor)
