# Admin Mobile Responsiveness — Implementation Tasks

> **Feature:** Admin Mobile Responsiveness — Progressive Improvement
> **Status:** Draft
> **Created:** 2026-03-17
> **Design:** `docs/specs/admin-mobile-responsiveness/design.md`

---

## Overview

Fix broken/unusable mobile experiences across all admin pages, then progressively enhance with layout improvements and POS-inspired polish. UI-only changes — no database or API modifications.

**Progress**: 14/14 tasks complete (100%)

## Requirement Traceability

| Requirement | Task(s) | Status |
|-------------|---------|--------|
| REQ-1a: CustomerTable mobile card view | Task 0152 | Done |
| REQ-1b: GroomerComparisonTable mobile card view | Task 0153 | Done |
| REQ-1c: Modal responsive widths | Task 0154, Task 0155 | Done |
| REQ-1d: Touch targets | Task 0156 | Done |
| REQ-1e: Safe area padding | N/A — already confirmed working | Done |
| REQ-2a: Content page restructuring | Task 0157 | Done (already responsive) |
| REQ-2b: Form optimization | Task 0158 | Done |
| REQ-2c: Charts mobile optimization | Task 0159 | Done |
| REQ-2d: sm: breakpoint sweep | Task 0160 | Done |
| REQ-3a: Bottom sheet modals | Task 0161 | Done |
| REQ-3b: Micro-interactions | Task 0162 | Done |
| REQ-3c: Pull-to-refresh | Task 0163 | Done |

---

## Phase 1: Critical Fixes (Broken/Unusable)

### Task 0152: Add Mobile Card View to CustomerTable
- [ ] Wrap existing `<div className="overflow-x-auto">` table block in `hidden lg:block`
- [ ] Add sibling `<div className="lg:hidden space-y-3">` with card layout per customer (name + flag badges header, 2-col grid with phone/pets/appointments, `truncate` on name)
- [ ] Move infinite scroll sentinel div outside both views so it works in both
- [ ] Make entire card tappable via existing `handleRowClick`, add `cursor-pointer`
- [ ] Verify card uses design tokens: `bg-white rounded-xl shadow-sm p-4 border border-[#434E54]/5`
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-1a
- **Design Ref**: Section 3a, Section 6 (Mobile Card View Pattern)
- **Files**: `src/components/admin/customers/CustomerTable.tsx`
- **Acceptance Criteria**: At 375px width, table is hidden and card view is visible with customer name, phone, pets count, flag badges. At 1024px+, table is visible and cards are hidden. Infinite scroll works in both views.
- **Depends On**: None
- **Verification**: Chrome DevTools at 375px — cards visible, no horizontal scroll. Toggle to 1024px — table visible, cards hidden.

### Task 0153: Add Mobile Card View to GroomerComparisonTable
- [ ] Wrap existing table in `hidden lg:block`
- [ ] Add `lg:hidden` card view with groomer name header and 2-col stats grid (appointments, revenue, rating, addon rate, completion rate)
- [ ] Include below-average indicators (red text + `TrendingDown` icon) in card layout
- [ ] Use same card styling tokens as Task 0152
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-1b
- **Design Ref**: Section 3b
- **Files**: `src/components/admin/analytics/GroomerComparisonTable.tsx`
- **Acceptance Criteria**: At 375px, groomer stats display as cards with below-average indicators. At 1024px+, table view shows.
- **Depends On**: None
- **Verification**: Chrome DevTools at 375px — cards visible with all stats, below-average metrics highlighted.

### Task 0154: Make AdminModal and Close Button Responsive
- [ ] Add `max-sm:max-w-[calc(100vw-2rem)]` to the motion.div className in AdminModal
- [ ] Change header padding from `p-6 pb-4` to `p-4 sm:p-6 pb-4`
- [ ] Change footer padding from `p-6 pt-4` to `p-4 sm:p-6 pt-4`
- [ ] Add `min-h-[44px] min-w-[44px] flex items-center justify-center` to close button
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-1c, REQ-1d
- **Design Ref**: Section 3c, Section 6 (Modal Mobile Behavior)
- **Files**: `src/components/admin/shared/AdminModal.tsx`
- **Acceptance Criteria**: All modals using AdminModal fill mobile width minus 2rem margin, have reduced padding on mobile, and close button meets 44px touch target.
- **Depends On**: None
- **Verification**: Open any AdminModal-based modal at 375px — fills width with 1rem margin each side, close button is 44x44px.

### Task 0155: Make Non-AdminModal Modals Responsive
- [ ] `AppointmentDetailModal.tsx`: Add `max-sm:max-w-[calc(100vw-1rem)] max-sm:max-h-[calc(100vh-2rem)] max-sm:rounded-b-none` to motion wrapper, verify close button is 44px
- [ ] `GalleryUploadModal.tsx`: Add `max-sm:max-w-[calc(100vw-2rem)]` to motion wrapper
- [ ] `GalleryImageEditModal.tsx`: Add `max-sm:max-w-[calc(100vw-2rem)]` to motion wrapper
- [ ] `CreateCampaignModal.tsx`: Add `max-sm:max-w-[calc(100vw-2rem)]` to motion wrapper
- [ ] `ImportWizard.tsx`: Add `max-sm:max-w-[calc(100vw-2rem)]` to motion wrapper
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-1c
- **Design Ref**: Section 3d, Section 3e
- **Files**: `src/components/admin/appointments/AppointmentDetailModal.tsx`, `src/components/admin/gallery/GalleryUploadModal.tsx`, `src/components/admin/gallery/GalleryImageEditModal.tsx`, `src/components/admin/marketing/CreateCampaignModal.tsx`, `src/components/admin/calendar/import/ImportWizard.tsx`
- **Acceptance Criteria**: All 5 modals fit within mobile viewport without horizontal scroll. AppointmentDetailModal is near-fullscreen on mobile.
- **Depends On**: None
- **Verification**: Open each modal at 375px — no overflow, content accessible.

### Task 0156: Audit and Fix Touch Targets in Modified Files
- [ ] `CustomerTable.tsx` sort header buttons: add `min-h-[44px]` to sort button elements
- [ ] `AppointmentDetailModal.tsx` close button: ensure 44px minimum
- [ ] Audit all icon-only action buttons in table rows across files modified in Tasks 0152-0155, add `min-h-[44px] min-w-[44px]` where needed
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-1d
- **Design Ref**: Section 6 (Touch Target Audit)
- **Files**: `src/components/admin/customers/CustomerTable.tsx`, `src/components/admin/appointments/AppointmentDetailModal.tsx`
- **Acceptance Criteria**: All interactive elements in modified files meet 44px minimum touch target.
- **Depends On**: Task 0152, Task 0155
- **Verification**: Inspect button dimensions in DevTools — all >= 44x44px.

---

## Phase 2: Layout Improvements

### Task 0157: Make Admin Content Pages Responsive
- [ ] Settings index (`src/app/admin/settings/page.tsx`): ensure grid collapses to single column on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- [ ] Customer detail (`src/app/admin/customers/[id]/page.tsx`): single-column mobile layout, collapsible sections with chevron toggles
- [ ] Analytics (`src/app/admin/analytics/page.tsx`): KPI grid uses `grid-cols-2 md:grid-cols-4`
- [ ] Notifications pages (`src/app/admin/notifications/*/page.tsx`): stack side-by-side layouts on mobile
- [ ] Staff page (`src/app/admin/staff/page.tsx`): mobile layout audit, ensure cards stack
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-2a
- **Design Ref**: Section 8 (Phase 2, 2a)
- **Files**: `src/app/admin/settings/page.tsx`, `src/app/admin/customers/[id]/page.tsx`, `src/app/admin/analytics/page.tsx`, `src/app/admin/notifications/*/page.tsx`, `src/app/admin/staff/page.tsx`
- **Acceptance Criteria**: All listed pages display correctly at 375px — single column layouts, no horizontal scroll, all content accessible.
- **Depends On**: None
- **Verification**: Load each page at 375px and 768px — grids collapse correctly, no overlap.

### Task 0158: Optimize Admin Forms for Mobile
- [ ] Find all `grid-cols-2` in admin settings forms and change to `grid-cols-1 sm:grid-cols-2`
- [ ] Verify all form inputs have at minimum `py-2.5` (no `input-sm`/`input-xs` on date/time inputs)
- [ ] Ensure form action buttons stack vertically on mobile if needed
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-2b
- **Design Ref**: Section 8 (Phase 2, 2b)
- **Files**: Various settings forms under `src/components/admin/settings/`
- **Acceptance Criteria**: All admin forms are single-column on mobile, inputs are comfortably tappable.
- **Depends On**: None
- **Verification**: Open settings forms at 375px — all fields stack vertically, inputs are full-width.

### Task 0159: Optimize Charts for Mobile Viewports
- [ ] In `RevenueOverview.tsx` and analytics chart components, use `currentBreakpoint` from `useAdminStore` to detect mobile
- [ ] On mobile: reduce tick count (`maxTicksAutoSkip: 5`), move legend to bottom, reduce font size to 10px
- [ ] Set `maintainAspectRatio: false` with explicit container height on mobile
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-2c
- **Design Ref**: Section 5 (State Management), Section 8 (Phase 2, 2c)
- **Files**: `src/components/admin/dashboard/RevenueOverview.tsx`, analytics chart components under `src/components/admin/analytics/`
- **Acceptance Criteria**: Charts are legible at 375px — labels don't overlap, legend is below chart, ticks are sparse enough to read.
- **Depends On**: None
- **Verification**: Load dashboard and analytics at 375px — charts render without label overlap.

### Task 0160: Systematic sm:/md: Breakpoint Sweep
- [ ] Audit all admin components that jump directly from default to `lg:` with no intermediate breakpoints
- [ ] Add `sm:` and `md:` intermediate steps where layouts feel cramped at 640-1023px
- [ ] Focus on: grid layouts, flex wrap behavior, padding/margin scaling
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-2d
- **Design Ref**: Section 6 (Responsive Breakpoint Strategy)
- **Files**: Various admin components
- **Acceptance Criteria**: Admin pages have smooth responsive transitions at 640px and 768px — no sudden layout jumps.
- **Depends On**: Task 0157, Task 0158
- **Verification**: Slowly resize browser from 320px to 1024px — layouts transition smoothly at each breakpoint.

---

## Phase 3: POS-Style Polish

### Task 0161: Convert AppointmentDetailModal to Bottom Sheet on Mobile
- [ ] Detect mobile via `currentBreakpoint` from Zustand store
- [ ] On mobile: animate from bottom (`y: '100%'` to `y: 0`), rounded top corners only, full width
- [ ] Add drag handle bar at top (40px wide, 4px tall, centered, `bg-[#434E54]/20 rounded-full`)
- [ ] Implement drag-to-dismiss using Framer Motion `drag="y"` with `dragConstraints` and `onDragEnd` threshold
- [ ] Ensure focus trap and escape key still work, add proper aria attributes
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-3a
- **Design Ref**: Section 8 (Phase 3, 3a)
- **Files**: `src/components/admin/appointments/AppointmentDetailModal.tsx`
- **Acceptance Criteria**: On mobile, modal slides up from bottom with drag handle. Dragging down past threshold dismisses. Desktop behavior unchanged.
- **Depends On**: Task 0155
- **Verification**: Test at 375px — modal slides up, drag handle visible, drag-to-dismiss works.

### Task 0162: Add Micro-Interactions to Mobile Cards
- [ ] Add `whileTap={{ scale: 0.98 }}` to all tappable cards (customer cards from Task 0152, groomer cards from Task 0153)
- [ ] Add subtle status badge color transitions with Framer Motion
- [ ] Add paw print loading animation variant for mobile card loading states
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-3b
- **Design Ref**: Section 8 (Phase 3, 3b)
- **Files**: `src/components/admin/customers/CustomerTable.tsx`, `src/components/admin/analytics/GroomerComparisonTable.tsx`
- **Acceptance Criteria**: Tapping cards produces a subtle press animation. Status changes animate smoothly.
- **Depends On**: Task 0152, Task 0153
- **Verification**: Tap cards on mobile/DevTools — press feedback visible.

### Task 0163: Add Pull-to-Refresh on Dashboard and Appointments
- [ ] Create a reusable `PullToRefresh` wrapper component with touch event handling
- [ ] Add paw-print spinner animation during refresh
- [ ] Integrate on admin dashboard and appointments list pages
- [ ] Ensure pull gesture only activates when scrolled to top
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-3c
- **Design Ref**: Section 8 (Phase 3, 3c)
- **Files**: New: `src/components/admin/shared/PullToRefresh.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/admin/appointments/page.tsx`
- **Acceptance Criteria**: Pulling down from top of dashboard or appointments list triggers refresh with paw spinner animation.
- **Depends On**: None
- **Verification**: Test on real device or simulator — pull gesture triggers refresh with animation.

---

## Phase 4: Verification and Code Review

### Task 0164: Manual Verification and Build Check
- [ ] Run `npm run build` and confirm no errors
- [ ] Complete all manual verification checklist items from design doc Section 9
- [ ] Test on iPhone SE (375px), iPad (768px), and desktop (1024px+) viewports
- [ ] Verify no regressions on desktop layouts
- **Agent**: `@agent-app-dev`
- **Requirements**: All
- **Design Ref**: Section 9 (Testing Strategy)
- **Files**: N/A
- **Acceptance Criteria**: Build passes, all manual checklist items pass, no desktop regressions.
- **Depends On**: All prior tasks
- **Verification**: Build succeeds, all checklist items checked off.

### Task 0165: Run Code Review
- [ ] Run `@agent-code-reviewer` on all new/modified files
- [ ] Verify design system compliance (colors, shadows, rounded corners)
- [ ] Verify no `<dialog>` elements introduced
- [ ] Verify touch targets meet 44px minimum
- [ ] Verify `max-sm:` prefix works correctly in Tailwind CSS 4
- **Agent**: `@agent-code-reviewer`
- **Requirements**: All
- **Acceptance Criteria**: No critical issues found; all patterns compliant.
- **Depends On**: All prior tasks
