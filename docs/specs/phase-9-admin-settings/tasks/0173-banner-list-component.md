# Task 0173: Banner list component with status badges

## Description
Create the banner list component that displays all promotional banners with status indicators and action buttons.

## Acceptance Criteria
- [ ] Create `BannerList` component displaying all banners
- [ ] Show banner thumbnail, alt text, click URL, status badge
- [ ] Implement status badges with colors:
  - Draft (gray) - not active, no dates
  - Scheduled (blue) - has future start_date
  - Active (green) - is_active and within date range
  - Expired (red) - end_date has passed
- [ ] Display click count for each banner
- [ ] Add action buttons: Edit, Toggle Active, Delete
- [ ] Toggle active button with confirmation for active banners
- [ ] Delete button with confirmation dialog
- [ ] Show empty state when no banners exist with "Create Banner" CTA
- [ ] Implement loading skeleton while data fetches
- [ ] Handle error state with retry button

## Implementation Notes
- File: `src/components/admin/settings/banners/BannerList.tsx`
- Use DaisyUI badge component for status
- Table layout on desktop, card layout on mobile

## References
- Req 4.1, Req 5.8, Req 6.1, Req 6.5, Req 7.1
- Design: Banner List with Drag-Drop section

## Complexity
Medium

## Category
UI

## Dependencies
- 0169 (Banner list API)
