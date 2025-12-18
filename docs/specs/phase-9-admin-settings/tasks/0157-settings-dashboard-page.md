# Task 0157: Settings dashboard page structure

## Description
Create the main settings dashboard hub page at `/admin/settings` that displays categorized setting sections with navigation cards.

## Acceptance Criteria
- [ ] Create page at `src/app/(admin)/settings/page.tsx`
- [ ] Create `SettingsDashboardClient.tsx` client component
- [ ] Display page title "Settings" with breadcrumb navigation
- [ ] Create responsive grid layout for settings section cards
- [ ] Implement loading skeleton state while data loads
- [ ] Verify admin role before rendering using `requireAdmin()`
- [ ] Handle error states gracefully with retry option
- [ ] Add proper TypeScript types for all components

## Implementation Notes
- File: `src/app/(admin)/settings/page.tsx`
- File: `src/components/admin/settings/SettingsDashboardClient.tsx`
- Use DaisyUI card components
- Follow existing admin page patterns
- Server component with client component for interactivity

## References
- Req 21.1, Req 21.8
- Design: Settings Dashboard section

## Complexity
Medium

## Category
UI

## Dependencies
- 0156 (TypeScript types)
