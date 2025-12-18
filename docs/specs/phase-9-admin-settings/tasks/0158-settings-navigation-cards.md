# Task 0158: Settings dashboard navigation cards

## Description
Create the navigation card components for the settings dashboard that display status, summary, and last updated information for each settings section.

## Acceptance Criteria
- [ ] Create `SettingsCard` component with title, description, icon, status badge, last updated, summary
- [ ] Implement status indicators: 'configured' (green), 'needs_attention' (yellow), 'not_configured' (gray)
- [ ] Create card for "Site Content" section linking to `/admin/settings/site-content`
- [ ] Create card for "Promo Banners" section linking to `/admin/settings/banners`
- [ ] Create card for "Booking Settings" section linking to `/admin/settings/booking`
- [ ] Create card for "Loyalty Program" section linking to `/admin/settings/loyalty`
- [ ] Create card for "Staff Management" section linking to `/admin/settings/staff`
- [ ] Display quick summaries (e.g., "24-hour cancellation policy", "3 active banners")
- [ ] Show "Last updated X days ago" for each section
- [ ] Highlight cards that need attention with warning indicator
- [ ] Add hover effects and click navigation
- [ ] Implement responsive 2-column grid on desktop, single column on mobile

## Implementation Notes
- File: `src/components/admin/settings/SettingsCard.tsx`
- File: `src/components/admin/settings/SettingsGrid.tsx`
- Use Lucide icons: FileText, Image, Calendar, Gift, Users
- Follow Clean & Elegant design system

## References
- Req 21.2, Req 21.3, Req 21.4, Req 21.5, Req 21.6
- Design: Settings Dashboard section

## Complexity
Small

## Category
UI

## Dependencies
- 0157 (Settings dashboard page)
