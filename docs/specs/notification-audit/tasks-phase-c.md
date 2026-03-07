# Notification Audit - Phase C: React Performance Fixes

## Overview

Phase C addresses React performance violations across the admin notification pages: suppressed `react-hooks/exhaustive-deps` warnings hiding stale closure bugs, missing `React.memo` on list/dashboard child components, and a stale closure in the LogFilters debounce. These do not break functionality but degrade admin UX and violate React best practices.

**Progress**: 4/4 tasks complete (100%)

**Document References**:
- Design: `docs/specs/notification-audit/design.md`
- Design Section: Issue 4 (React Performance Fixes), subsections 4a-4e

---

## Section C.1: useEffect Dependency Fixes

### Task 0107: Fix useEffect Dependencies in All Admin Notification Pages
- [x] **`src/app/admin/notifications/page.tsx`**: Wrap `fetchNotifications` in `useCallback` with dependencies `[page, filters]`. Replace the `eslint-disable-next-line react-hooks/exhaustive-deps` comment with proper `[fetchNotifications]` dependency in the `useEffect`. Remove the ESLint suppression comment.
- [x] **`src/app/admin/notifications/dashboard/page.tsx`**: Wrap `fetchDashboardData` in `useCallback` with dependency `[selectedPeriod]`. Replace the ESLint suppression with proper `[fetchDashboardData]` dependency in the `useEffect`. Remove the suppression comment.
- [x] **`src/app/admin/notifications/templates/page.tsx`**: Wrap `applyFilters` in `useCallback` with dependencies `[templates, filters]`. Replace the ESLint suppression with proper `[applyFilters]` dependency in the `useEffect`. Remove the suppression comment.
- [x] **`src/app/admin/notifications/log/page.tsx`**: Wrap `fetchLogs` in `useCallback` with dependencies `[filters, currentPage]`. Replace the ESLint suppression with proper `[fetchLogs]` dependency in the `useEffect`. Remove the suppression comment.
- [x] Verify no infinite re-render loops are introduced by testing each page loads correctly
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All four admin notification pages have proper useEffect dependencies with no ESLint suppressions for `react-hooks/exhaustive-deps`. Pages load and re-fetch data correctly when their dependencies change. No infinite loops.
- **References**: Design Section "Issue 4: React Performance Fixes", subsection 4a
- **Files**:
  - `src/app/admin/notifications/page.tsx`
  - `src/app/admin/notifications/dashboard/page.tsx`
  - `src/app/admin/notifications/templates/page.tsx`
  - `src/app/admin/notifications/log/page.tsx`

---

## Section C.2: Component Memoization

### Task 0108: Add React.memo to Dashboard Child Components
- [x] **`src/app/admin/notifications/components/OverviewCards.tsx`**: Wrap the exported component with `memo()` from React. Use the named function pattern: `export const OverviewCards = memo(function OverviewCards(...) { ... })`
- [x] **`src/app/admin/notifications/components/TimelineChart.tsx`**: Same `memo()` wrapping pattern
- [x] **`src/app/admin/notifications/components/ChannelBreakdown.tsx`**: Same `memo()` wrapping pattern
- [x] **`src/app/admin/notifications/components/TypeBreakdown.tsx`**: Same `memo()` wrapping pattern
- [x] **`src/app/admin/notifications/components/RecentFailures.tsx`**: Same `memo()` wrapping pattern
- [x] In the parent dashboard page (`dashboard/page.tsx`), memoize any callback props passed to these components with `useCallback` so that `React.memo` can effectively skip re-renders
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All 5 dashboard child components are wrapped with `React.memo`. Parent callback props are memoized with `useCallback`. Dashboard page renders correctly with no visual regressions.
- **References**: Design Section "Issue 4: React Performance Fixes", subsection 4b
- **Files**:
  - `src/app/admin/notifications/components/OverviewCards.tsx`
  - `src/app/admin/notifications/components/TimelineChart.tsx`
  - `src/app/admin/notifications/components/ChannelBreakdown.tsx`
  - `src/app/admin/notifications/components/TypeBreakdown.tsx`
  - `src/app/admin/notifications/components/RecentFailures.tsx`
  - `src/app/admin/notifications/dashboard/page.tsx`

### Task 0109: Add React.memo to TemplateCard and Memoize Parent Callbacks
- [x] **`src/app/admin/notifications/templates/components/TemplateCard.tsx`**: Wrap with `memo()` using the named function pattern
- [x] In the parent templates page (`templates/page.tsx`), memoize `onTest` and `onToggleActive` callback props with `useCallback` so that `React.memo` on TemplateCard can skip re-renders when the list re-renders
- [x] If a `TemplateEditor` component exists with a live preview that updates on every keystroke, add `useDeferredValue` for the preview content to prevent jank during typing (no TemplateEditor with live preview exists)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: TemplateCard is wrapped with `React.memo`. Parent callbacks are memoized. Template list renders correctly. If TemplateEditor exists, preview uses deferred value.
- **References**: Design Section "Issue 4: React Performance Fixes", subsections 4c and 4e
- **Files**:
  - `src/app/admin/notifications/templates/components/TemplateCard.tsx`
  - `src/app/admin/notifications/templates/page.tsx`

---

## Section C.3: Stale Closure Fix

### Task 0110: Fix LogFilters Stale Closure with Ref Pattern
- [x] In `src/app/admin/notifications/log/components/LogFilters.tsx`, add a `useRef` for `filters` that updates on every render: `const filtersRef = useRef(filters); filtersRef.current = filters;`
- [x] In the debounce `useEffect`, replace direct `filters` access inside the `setTimeout` callback with `filtersRef.current` to avoid stale closure
- [x] Add `onFilterChange` to the `useEffect` dependency array (remove the ESLint suppression if present)
- [x] Keep `searchInput` as a dependency to trigger the debounce timer when search text changes
- [x] Do NOT add `filters` to the dependency array (the ref handles it) to prevent the debounce timer from resetting when non-search filters change
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: The search debounce in LogFilters uses current filter values (not stale). Changing non-search filters does not reset the debounce timer. The ESLint `exhaustive-deps` suppression is removed. Search filtering works correctly with a 300ms debounce.
- **References**: Design Section "Issue 4: React Performance Fixes", subsection 4d
- **Files**: `src/app/admin/notifications/log/components/LogFilters.tsx`
