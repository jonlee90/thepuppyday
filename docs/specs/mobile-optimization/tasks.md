# Mobile Optimization: Admin Appointments Page — Implementation Tasks

> **Feature:** Mobile Optimization - Admin Appointments Page
> **Status:** Draft
> **Created:** 2026-03-18
> **Design:** `docs/specs/mobile-optimization/design.md`

---

## Overview

Make the admin appointments page usable on phones (< 768px) by creating mobile-specific agenda and list views with card-based layouts, replacing the desktop calendar swimlane and HTML table. Desktop views remain untouched. All mobile components use `next/dynamic` with `ssr: false` for code splitting.

**Progress**: 0/8 tasks complete (0%)

---

## Phase 1: Reusable Mobile Components

### Task 0166: Create MobileSegmentedControl Component
- [ ] Create `src/components/admin/mobile/MobileSegmentedControl.tsx` with generic `<T extends string>` props
- [ ] Implement pill-shaped container (`bg-[#EAE0D5]/50 rounded-xl p-1`) with Framer Motion `layoutId` sliding highlight (`bg-white rounded-lg shadow-sm`)
- [ ] Support optional icon per segment, `min-h-[44px]` touch targets
- [ ] Add accessibility: `role="tablist"`, `role="tab"` children, `aria-selected`, keyboard arrow navigation
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.1, Section 6 (Accessibility)
- **Files**: `src/components/admin/mobile/MobileSegmentedControl.tsx`
- **Acceptance Criteria**: Component renders segments with sliding animation; 44px touch targets; keyboard navigable; `aria-selected` toggles correctly
- **Depends On**: None
- **Verification**: Import and render in a test page with 2-3 options; verify animation, tap, and keyboard behavior

### Task 0167: Create MobileChipRow, MobileFAB, and MobileEmptyState Components
- [ ] Create `src/components/admin/mobile/MobileChipRow.tsx` with horizontal scroll, snap scrolling, right-edge gradient fade, optional count badge
- [ ] Add `role="radiogroup"` (single select) or `role="group"` (multi), chips get `role="radio"`/`role="checkbox"`
- [ ] Create `src/components/admin/mobile/MobileFAB.tsx` with `fixed bottom-24 right-4 z-40`, `w-14 h-14 rounded-full bg-[#434E54] text-white shadow-lg`, spring scale entry animation, `sr-only` label
- [ ] Create `src/components/admin/mobile/MobileEmptyState.tsx` with PawPrint icon default (`w-16 h-16 text-[#D4A574]/40`), optional action button using `AdminButton`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.2, 3.3, 3.5
- **Files**: `src/components/admin/mobile/MobileChipRow.tsx`, `src/components/admin/mobile/MobileFAB.tsx`, `src/components/admin/mobile/MobileEmptyState.tsx`
- **Acceptance Criteria**: ChipRow scrolls horizontally with snap; FAB is fixed bottom-right with spring animation; EmptyState shows dog-themed empty state; all meet 44px touch targets
- **Depends On**: None
- **Verification**: Render each component in isolation with mock props; verify scroll behavior, positioning, and accessibility attributes

### Task 0168: Create MobileFilterSheet Component
- [ ] Create `src/components/admin/mobile/MobileFilterSheet.tsx` with bottom sheet pattern matching AppointmentDetailModal
- [ ] Implement backdrop (`fixed inset-0 bg-black/50 backdrop-blur-sm z-50`), sheet slides up with spring animation (`damping: 25, stiffness: 300`)
- [ ] Add drag-to-dismiss (`drag="y"`, dismiss if `offset.y > 100`), drag handle bar (`w-10 h-1 rounded-full bg-[#434E54]/20`)
- [ ] Add footer with Apply/Reset `AdminButton` pair in `bg-[#EAE0D5]/30`
- [ ] Implement focus trap using `createFocusTrap`, Escape to close, `role="dialog"` `aria-modal="true"` (NOT `<dialog>`)
- [ ] Max height `max-h-[70vh]`, sheet `bg-[#F8EEE5] rounded-t-2xl shadow-xl`
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.4, Section 6 (Accessibility)
- **Files**: `src/components/admin/mobile/MobileFilterSheet.tsx`
- **Acceptance Criteria**: Sheet slides up from bottom with spring animation; drag-to-dismiss works; focus trapped; Escape closes; Apply/Reset buttons fire callbacks
- **Depends On**: None
- **Verification**: Render with `isOpen={true}`, verify drag dismiss, focus trap, and button callbacks

---

## Phase 2: Mobile Appointment Components

### Task 0169: Create MobileAppointmentCard Component
- [ ] Create `src/components/admin/appointments/mobile/MobileAppointmentCard.tsx` using `CalendarAppointment` type
- [ ] Implement card layout: left accent strip (`w-1 rounded-l-xl`) with groomer color (or `bg-[#D4A574]` if unassigned), content area with time, pet name (bold), customer + service, groomer name
- [ ] Use existing `StatusBadge` component with `size="sm"`
- [ ] Add entry animation: `y: 16` slide-up with `delay: index * 0.05` stagger, `active:scale-[0.98]` press feedback
- [ ] Add `role="button"` `tabIndex={0}` `onKeyDown` for Enter/Space, `aria-label` with appointment summary
- [ ] Add `truncate` on pet/customer names for overflow handling
- [ ] Apply `content-visibility: auto` with `contain-intrinsic-size: 0 88px` via inline style or CSS class
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.6, Section 6 (Accessibility, Touch Targets)
- **Files**: `src/components/admin/appointments/mobile/MobileAppointmentCard.tsx`
- **Acceptance Criteria**: Card displays appointment info with groomer color strip; tapping calls `onClick(id)`; stagger animation works; accessible via keyboard
- **Depends On**: None
- **Verification**: Render with mock `CalendarAppointment` data; verify layout, click handler, keyboard interaction, and animation

### Task 0170: Create MobileAgendaView Component
- [ ] Create `src/components/admin/appointments/mobile/MobileAgendaView.tsx`
- [ ] Implement date navigation header with left/right arrows (`w-11 h-11` = 44px touch targets), formatted date ("Wed, Mar 18"), and "Today" button
- [ ] Fetch appointments from `/api/admin/appointments/calendar?start=DATE&end=DATE` and groomers in parallel using `Promise.all`
- [ ] Group appointments by hour slot with sticky time headers (`sticky top-0 z-10 bg-[#F8EEE5]/95 backdrop-blur-sm`)
- [ ] Add `MobileChipRow` groomer filter (All + groomer names) at top
- [ ] Render `MobileAppointmentCard` for each appointment
- [ ] Add loading state: 3 skeleton cards with pulse animation, `aria-busy="true"`
- [ ] Add empty state: `MobileEmptyState` with "No appointments on [date]"
- [ ] Add error handling: toast error + retry button in empty state area
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.7, Section 6, Section 7
- **Files**: `src/components/admin/appointments/mobile/MobileAgendaView.tsx`
- **Acceptance Criteria**: Shows today's appointments grouped by time; date navigation works; groomer filter works; loading/empty/error states handled
- **Depends On**: Task 0167 (MobileChipRow, MobileEmptyState), Task 0169 (MobileAppointmentCard)
- **Verification**: Open in dev at mobile width; verify data loads, date navigation changes appointments, groomer filter works

### Task 0171: Create MobileListView Component
- [ ] Create `src/components/admin/appointments/mobile/MobileListView.tsx`
- [ ] Implement search bar (44px height, `bg-white rounded-xl border border-[#E5E5E5] px-4 py-3`, Search icon left, clear X button) with 300ms debounce
- [ ] Add status filter via `MobileChipRow` (All, Pending, Confirmed, In Progress, Completed, Cancelled, No Show)
- [ ] Add date range quick select via `MobileChipRow` (Today, Tomorrow, This Week, This Month)
- [ ] Fetch from `/api/admin/appointments?search=QUERY&status=STATUS&dateFrom=DATE&dateTo=DATE&page=N&limit=20`
- [ ] Render `MobileAppointmentCard` list with "Load More" pagination button at bottom
- [ ] Add loading state (skeleton cards), empty state (`MobileEmptyState`), error handling (toast + retry)
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 3.8, Section 6, Section 7
- **Files**: `src/components/admin/appointments/mobile/MobileListView.tsx`
- **Acceptance Criteria**: Search filters results with debounce; status and date chips filter correctly; "Load More" loads next page; loading/empty/error states handled
- **Depends On**: Task 0167 (MobileChipRow, MobileEmptyState), Task 0169 (MobileAppointmentCard)
- **Verification**: Open in dev at mobile width; search for a customer name; toggle status chips; verify pagination

---

## Phase 3: Page Wiring

### Task 0172: Wire Mobile Views into Appointments Page
- [ ] Add `next/dynamic` imports for `MobileAgendaView`, `MobileListView`, `MobileFAB`, `MobileSegmentedControl` with `{ ssr: false }`
- [ ] Add `useIsMobile()` from `@/lib/utils/breakpoints` for JS conditional rendering
- [ ] Wrap existing desktop view in `{!isMobile && ...}` block (NO changes to desktop code)
- [ ] Add mobile view block: `{isMobile && ...}` with `MobileSegmentedControl` (Agenda/List toggle using existing `appointmentsView` store field), conditional `MobileAgendaView`/`MobileListView`, and `MobileFAB` (opens `BookingModal` in admin mode)
- [ ] Wire `MobileAppointmentCard` tap to open existing `AppointmentDetailModal` with correct appointment ID
- [ ] Wire `refreshKey` increment on modal `onUpdate` callback so mobile views refetch
- [ ] Verify desktop view renders identically at 768px+ (regression check)
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 2 (Architecture), Section 6 (Component Hierarchy), Section 8 (Phase 3)
- **Files**: `src/app/(admin)/admin/appointments/page.tsx`
- **Acceptance Criteria**: Mobile view appears at < 768px with segmented control, agenda/list views, and FAB; desktop view appears unchanged at >= 768px; card tap opens detail modal; FAB opens booking modal; status updates in modal refresh the mobile view
- **Depends On**: Task 0166, Task 0167, Task 0168, Task 0169, Task 0170, Task 0171
- **Verification**: Open `/admin/appointments` on mobile (375px); toggle between Agenda and List; tap a card to open detail modal; update status and verify card reflects change; tap FAB to open booking modal; resize to 768px+ and verify desktop view is unchanged

---

## Phase 4: Code Review

### Task 0173: Run Code Review on Mobile Optimization
- [ ] Run `@agent-code-reviewer` on all new files in `src/components/admin/mobile/` and `src/components/admin/appointments/mobile/`
- [ ] Review modified `page.tsx` for regression risk
- [ ] Verify design system compliance (colors, shadows, corners, Lucide icons only)
- [ ] Verify accessibility (ARIA roles, keyboard nav, focus trap, sr-only labels, 44px touch targets)
- [ ] Verify no `<dialog>` element usage
- [ ] Verify PascalCase filenames
- [ ] Verify no barrel `index.ts` exports in mobile directories
- [ ] Verify `content-visibility` applied to card lists
- [ ] Verify `next/dynamic` with `ssr: false` on all mobile imports
- [ ] Verify toast notifications on any DB mutations (status updates go through existing modal)
- **Agent**: `@agent-code-reviewer`
- **Acceptance Criteria**: No critical issues found; all patterns compliant with design system and project conventions
- **Depends On**: All prior tasks (0166-0172)
- **Verification**: Review report with no critical findings
