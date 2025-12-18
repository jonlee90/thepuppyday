# Task 0200: Loyalty settings page assembly

## Description
Create the main loyalty settings page that combines all loyalty configuration components.

## Acceptance Criteria
- [ ] Create page at `src/app/(admin)/settings/loyalty/page.tsx`
- [ ] Create `LoyaltySettingsClient` client component
- [ ] Include breadcrumb navigation back to settings dashboard
- [ ] Organize components in logical sections with headers:
  - Program Status & Punch Card Configuration
  - Earning Rules
  - Redemption Rules
  - Referral Program
- [ ] Implement tabbed or card-based layout for sections
- [ ] Load all loyalty settings on page load
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry
- [ ] Add "Save All" button for batch updates
- [ ] Individual section saves should also work
- [ ] Success toast after saves

## Implementation Notes
- File: `src/app/(admin)/settings/loyalty/page.tsx`
- File: `src/components/admin/settings/loyalty/LoyaltySettingsClient.tsx`
- Use consistent layout with other settings pages
- Server component fetches initial data

## References
- Req 13.1, Req 14.1, Req 15.1, Req 16.1
- Design: Component Hierarchy - Loyalty section

## Complexity
Medium

## Category
UI

## Dependencies
- 0192-0199 (All loyalty settings tasks)
