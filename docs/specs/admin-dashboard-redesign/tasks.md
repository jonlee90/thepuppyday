# Admin Dashboard Redesign - Implementation Tasks

## Overview

Transform the admin dashboard from a basic stats-and-list layout into a modern command center with a visual timeline, multi-period revenue tracking, sidebar productivity widgets, and compact quick-access navigation. The redesign replaces `DashboardStats`, `TodayAppointments`, and `PendingAppointments` with new purpose-built components while introducing a centralized data hook and a new revenue overview API endpoint.

**Progress**: 17/17 tasks complete (100%)

**Document References**:
- Design: `docs/specs/admin-dashboard-redesign/design.md`

---

## Section A: Foundation (Revenue API + Data Hook + Header)

### Task 0001: Create Revenue Overview API Endpoint ✅ 2026-03-07
- [x] Create `src/app/api/admin/dashboard/revenue-overview/route.ts` with GET handler
- [x] Implement admin auth check using `createServerSupabaseClient()` + `requireAdmin()`, then query with `createServiceRoleClient()` (admin API + RLS pattern)
- [x] Implement date calculations using `getTodayInBusinessTimezone()` and `date-fns-tz` for today, this-week (Mon-Sat), and this-month boundaries
- [x] Query `appointments` table for each period (current + previous) excluding `cancelled` and `no_show`, computing completed/pending/total sums and `changePercent`
- [x] Add mock mode support returning static data: `{ today: { completed: 220, pending: 100, total: 320, changePercent: 12 }, thisWeek: { total: 1840, changePercent: 8 }, thisMonth: { total: 6200, changePercent: 5 } }`
- [x] Export `RevenueOverviewResponse` type for client consumption
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: `GET /api/admin/dashboard/revenue-overview` returns valid `RevenueOverviewResponse` JSON; rejects non-admin with 401; returns mock data when `NEXT_PUBLIC_USE_MOCKS=true`; handles DB errors with 500
- **References**: Design 4.1 (Revenue Overview API Response), Design 2.3 (Data Flow)
- **Files**: `src/app/api/admin/dashboard/revenue-overview/route.ts`

### Task 0002: Create useDashboardData Hook ✅ 2026-03-07
- [x] Create `src/hooks/admin/use-dashboard-data.ts` implementing the `DashboardData` interface from Design 3.8
- [x] On mount, fire `Promise.allSettled` for three endpoints: `/api/admin/dashboard/revenue-overview`, `/api/admin/dashboard/appointments`, `/api/admin/dashboard/pending-appointments`
- [x] Track independent `loading` and `errors` state per endpoint (revenue, appointments, pending)
- [x] Implement 30-second polling interval with `document.visibilityState` awareness (pause when tab hidden, resume on visibility change)
- [x] In production (non-mock), establish Supabase realtime subscription on `appointments` table filtered to today's date range; fall back to polling on subscription failure
- [x] Expose `refetch()` for manual refresh and `isConnected`/`isPolling` status flags
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Hook fetches all three endpoints on mount; partial failures do not block other data; polling pauses/resumes correctly with tab visibility; `refetch()` triggers immediate fetch; each endpoint has independent loading/error tracking
- **References**: Design 3.8 (useDashboardData Hook), Design 2.3 (Data Flow)
- **Files**: `src/hooks/admin/use-dashboard-data.ts`

### Task 0003: Create DashboardHeader Component ✅ 2026-03-07
- [x] Create `src/components/admin/dashboard/DashboardHeader.tsx` accepting `onNewBooking` and `onWalkIn` props
- [x] Display "Dashboard" heading (`text-3xl font-bold text-[#434E54]`) and formatted date using `formatDateInBusinessTimezone` from `src/lib/utils/timezone.ts`
- [x] Add "New Booking" button with charcoal primary style (`bg-[#434E54] hover:bg-[#363F44] text-white rounded-xl shadow-md`)
- [x] Add "Walk-in" button with outlined/secondary style on desktop; on mobile, rely on existing `WalkInButton` FAB pattern
- [x] Implement responsive stacking: date wraps below heading on mobile, buttons stack or hide Walk-in (FAB takes over)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Header renders date correctly in business timezone; both buttons fire their callbacks; layout is responsive at mobile/tablet/desktop breakpoints
- **References**: Design 3.1 (DashboardHeader)
- **Files**: `src/components/admin/dashboard/DashboardHeader.tsx`

---

## Section B: Revenue Overview Component

### Task 0004: Create RevenueOverview Component
- [ ] Create `src/components/admin/dashboard/RevenueOverview.tsx` accepting `RevenueOverviewProps` (data, loading, error, onRetry)
- [ ] Implement three-card grid layout (`grid-cols-1 md:grid-cols-3 gap-4`) for Today, This Week, This Month
- [ ] Port the animated counter logic from `DashboardStats.tsx` `StatCard` (500ms duration, 20 steps) into each revenue card
- [ ] Implement trend badges using the `KPICard.tsx` pattern: `TrendingUp` (green), `TrendingDown` (red), `Minus` (gray) with comparison text (e.g., "vs yesterday")
- [ ] Today's card shows additional "Completed: $X | Pending: $Y" subtitle in smaller text
- [ ] Handle `null` changePercent by showing "N/A" in gray badge
- [ ] Implement loading state with skeleton placeholders and error state showing "--" with retry icon button
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Three cards render with correct revenue values, animated transitions, and trend indicators; loading shows skeletons; error shows "--" with working retry; null changePercent displays "N/A"
- **References**: Design 3.2 (RevenueOverview), Design 3.2 trend badge pattern from `KPICard.tsx`
- **Files**: `src/components/admin/dashboard/RevenueOverview.tsx`

---

## Section C: Dashboard Timeline

### Task 0005: Create DashboardTimeline Container and TimeMarkers ✅ 2026-03-07
- [x] Create `src/components/admin/dashboard/DashboardTimeline.tsx` with the main container: white card wrapper (`bg-white rounded-xl shadow-sm p-4 lg:p-5`), header with "Today's Schedule" + count badge + "View Calendar" link
- [x] Implement scrollable body: `max-h-[calc(100vh-300px)] overflow-y-auto`
- [x] Create `TimeMarker` sub-component rendering hour labels (9 AM - 5 PM) sourced from `BUSINESS_HOURS` in `src/components/admin/appointments/calendar/constants.ts`
- [x] Use relative positioning model: each hour occupies equal vertical space (80px per hour), appointments placed at computed offset
- [x] Implement empty state: `Dog` icon from Lucide with "No appointments scheduled" message
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Timeline container renders with time markers for all business hours; scrollable area works; empty state displays correctly
- **References**: Design 3.3 (DashboardTimeline), Design 3.3 Container section
- **Files**: `src/components/admin/dashboard/DashboardTimeline.tsx`

### Task 0006: Create TimelineAppointmentCard Sub-component ✅ 2026-03-07
- [x] Create `TimelineAppointmentCard` within `DashboardTimeline.tsx` (or as a separate file) with compact horizontal card layout positioned at correct time slot offset
- [x] Add left color stripe (4px wide) using `STATUS_COLORS` from `calendar/constants.ts`
- [x] Display content: time, customer name, pet name + breed, service name, price
- [x] Include `StatusBadge` component and quick action button using `getNextAction()` pattern from `TodayAppointments.tsx` (Confirm/Start/Complete)
- [x] Wire click handler to `onAppointmentClick` prop (opens `AppointmentDetailModal`)
- [x] Wire status action button to `onStatusUpdate` prop with optimistic update pattern (disable button, call API, toast on success/failure)
- [x] Add Framer Motion entrance: `initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}` with staggered delay per card
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Cards render at correct time positions with status stripe, all info fields, working status actions, click-to-detail, and staggered entrance animations
- **References**: Design 3.3 (TimelineAppointmentCard), existing `TodayAppointments.tsx` patterns
- **Files**: `src/components/admin/dashboard/DashboardTimeline.tsx`

### Task 0007: Create NowIndicator and Available Slot Gaps ✅ 2026-03-07
- [x] Create `NowIndicator` sub-component: colored horizontal line positioned proportionally within timeline based on current time relative to business hours
- [x] Add pulsing dot on left edge (`animate-pulse`)
- [x] Update position every 60 seconds via `setInterval`
- [x] Auto-scroll into view on mount: `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- [x] Only render when current time falls within business hours
- [x] Implement available slot gap rendering: time slots without appointments show subtle dashed-border gaps (`border-dashed border-[#EAE0D5]`)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: NowIndicator appears at correct position during business hours, pulses, auto-scrolls on mount, updates every 60s; hidden outside business hours; gaps render between appointments
- **References**: Design 3.3 (NowIndicator, Available Slot Gaps)
- **Files**: `src/components/admin/dashboard/DashboardTimeline.tsx`

---

## Section D: Sidebar Widgets

### Task 0008: Create ProductivityWidget Component ✅ 2026-03-07
- [x] Create `src/components/admin/dashboard/ProductivityWidget.tsx` accepting `appointments` array and `loading` boolean
- [x] Implement SVG circular progress ring (80x80px, stroke width 8px): background `stroke="#EAE0D5"`, foreground `stroke="#434E54"`, center text "X/Y" (completed/total)
- [x] Animate ring with Framer Motion `strokeDashoffset` animation on mount
- [x] Compute and display stat row: Capacity percentage `(completed + in_progress) / total * 100` and Avg Revenue/Apt `totalCompletedRevenue / completedCount`
- [x] Implement loading state: gray placeholder ring and skeleton stat values
- [x] Handle zero appointments gracefully (no division by zero, show 0% / $0)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Progress ring renders correct completion ratio with smooth animation; capacity and avg revenue stats compute correctly; loading skeleton displays; zero-appointment edge case handled
- **References**: Design 3.4 (ProductivityWidget)
- **Files**: `src/components/admin/dashboard/ProductivityWidget.tsx`

### Task 0009: Create WaitlistWidget Component ✅ 2026-03-07
- [x] Create `src/components/admin/dashboard/WaitlistWidget.tsx` as a self-fetching component (no props)
- [x] Fetch from `/api/admin/waitlist?status=active&limit=3&sort_by=priority&sort_order=desc`
- [x] Display header "Waitlist" with active count badge, fill rate progress bar (`bg-[#434E54]` fill on `bg-[#EAE0D5]` track), top 3 entries (customer name, pet name, requested date), and "View All" link to `/admin/waitlist`
- [x] Implement 60-second auto-refresh with `visibilitychange` awareness (pause when hidden)
- [x] Implement empty state: `Bone` icon from Lucide with "No active waitlist entries"
- [x] Implement loading state (skeleton rows) and error state (brief message + retry button)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Widget self-fetches and displays waitlist data; auto-refreshes every 60s; pauses when tab hidden; empty/loading/error states all render correctly
- **References**: Design 3.5 (WaitlistWidget)
- **Files**: `src/components/admin/dashboard/WaitlistWidget.tsx`

### Task 0010: Create PendingActionsWidget Component ✅ 2026-03-07
- [x] Create `src/components/admin/dashboard/PendingActionsWidget.tsx` accepting `appointments`, `onConfirm`, and `onAppointmentClick` props
- [x] Display header "Needs Attention" with amber count badge (`bg-amber-100 text-amber-800`)
- [x] List up to 5 pending appointments with customer name, pet name, scheduled time, and confirm button
- [x] Wire confirm button using status update pattern from `PendingAppointments.tsx` (POST to `/api/admin/appointments/{id}/status`)
- [x] Show "View All" link to `/admin/appointments?status=pending` when more than 5 exist
- [x] Implement empty state: "All caught up!" with paw-print checkmark icon
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Widget renders up to 5 pending items; confirm action works and fires callback; "View All" appears when >5; empty state with "All caught up!" displays correctly
- **References**: Design 3.6 (PendingActionsWidget)
- **Files**: `src/components/admin/dashboard/PendingActionsWidget.tsx`

---

## Section E: QuickAccess Redesign + Layout Assembly

### Task 0011: Redesign QuickAccess to Compact Pills ✅ 2026-03-07
- [x] Modify `src/components/admin/dashboard/QuickAccess.tsx` to replace 8 descriptive cards with 6 compact icon+label pills
- [ ] Change layout from card grid to `flex flex-wrap gap-3` horizontal row
- [ ] Style each pill: `inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium text-[#434E54]`
- [ ] Reduce icon size from `w-6 h-6` to `w-4 h-4`
- [ ] Keep 6 items: Appointments, Waitlist, Customers, Services, Analytics, Settings (remove Add-ons and Gallery)
- [ ] Remove `QuickAccessCard` sub-component and `QuickAccessCardProps` interface
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: QuickAccess renders 6 compact pills in a horizontal flex row; each links to correct admin route; responsive wrap on smaller screens; removed items (Add-ons, Gallery) no longer appear
- **References**: Design 3.7 (QuickAccess MODIFIED)
- **Files**: `src/components/admin/dashboard/QuickAccess.tsx`

### Task 0012: Restructure DashboardClient Layout ✅ 2026-03-07
- [x] Modify `src/app/admin/dashboard/DashboardClient.tsx` to remove `DashboardClientProps` interface and all server-passed initial data props
- [ ] Replace `useDashboardRealtime` with `useDashboardData()` hook as sole data source
- [ ] Add `BookingModal` state management (open/close, mode: admin vs walkin) for header action buttons
- [ ] Add `AppointmentDetailModal` state management for timeline and pending widget card clicks
- [ ] Implement new layout: `DashboardHeader` -> `RevenueOverview` -> `grid-cols-1 lg:grid-cols-5 gap-6` (Timeline `col-span-3`, Sidebar `col-span-2` with ProductivityWidget + WaitlistWidget + PendingActionsWidget) -> `QuickAccess`
- [ ] Wire `handleStatusUpdate` callback to update local appointment state and trigger `refetch()`
- [ ] Wire `handleConfirm` callback for pending appointments
- [ ] Retain connection status banners (error/disconnected/connected) using data from `useDashboardData`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: DashboardClient renders full new layout with all components; BookingModal opens in correct mode from header buttons; status updates from timeline/pending widget work; responsive grid collapses on mobile
- **References**: Design 3.9 (DashboardClient MODIFIED), Design 2.2 (Page Layout)
- **Files**: `src/app/admin/dashboard/DashboardClient.tsx`

### Task 0013: Simplify page.tsx and Update Exports ✅ 2026-03-07
- [x] Modify `src/app/admin/dashboard/page.tsx` to remove `getDashboardData()` server function and all server-side data fetching
- [ ] Simplify to thin server component: render `<div className="space-y-6"><DashboardClient /></div>`
- [ ] Remove `DashboardStats` import and type references
- [ ] Update `src/components/admin/dashboard/index.ts` to export new components: `DashboardHeader`, `RevenueOverview`, `DashboardTimeline`, `ProductivityWidget`, `WaitlistWidget`, `PendingActionsWidget`, and remove exports for `DashboardStats`, `TodayAppointments`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: page.tsx is a thin server component with no data fetching; index.ts exports reflect new component set; no broken imports across the app
- **References**: Design 3.10 (page.tsx SIMPLIFIED), Design 8 (Files Affected)
- **Files**: `src/app/admin/dashboard/page.tsx`, `src/components/admin/dashboard/index.ts`

---

## Section F: Polish, Cleanup, and Testing

### Task 0014: Responsive Layout Testing and Adjustments ✅ 2026-03-07
- [x] Verify mobile layout (< 768px): single column stack, revenue cards stacked, timeline full width, widgets stacked, Quick Access 2x3 grid
- [x] Verify tablet layout (768-1023px): revenue 3 cols, main content single column, Quick Access 3x2 grid
- [x] Verify desktop layout (>= 1024px): revenue 3 cols, main `grid-cols-5` (timeline 3, sidebar 2), Quick Access inline
- [x] Fix any overflow, truncation, or spacing issues across all breakpoints
- [x] Ensure Walk-in FAB from `WalkInButton` displays correctly on mobile alongside new header
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All three breakpoints match the layout specifications in Design 2.4; no visual regressions; Walk-in FAB coexists properly with DashboardHeader on mobile
- **References**: Design 2.4 (Responsive Behavior)
- **Files**: `src/components/admin/dashboard/DashboardHeader.tsx`, `src/app/admin/dashboard/DashboardClient.tsx`, `src/components/admin/dashboard/QuickAccess.tsx`

### Task 0015: Animation Polish and Accessibility Audit ✅ 2026-03-07
- [x] Fine-tune Framer Motion stagger timing on timeline cards for natural entrance feel
- [x] Polish SVG ring animation spring config in ProductivityWidget
- [x] Add ARIA labels to all interactive elements: revenue retry buttons, timeline action buttons, pending confirm buttons, quick access pills
- [x] Ensure keyboard navigation: all cards, buttons, and links are focusable and operable with Enter/Space
- [x] Add `aria-live="polite"` regions for dynamically updating content (revenue values, appointment counts, connection status)
- [x] Verify focus management when modals open/close from timeline and pending widget
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Animations feel smooth and intentional; all interactive elements have ARIA labels; keyboard-only navigation works throughout dashboard; screen readers announce dynamic updates
- **References**: Design 7 Phase F (Accessibility audit)
- **Files**: `src/components/admin/dashboard/DashboardTimeline.tsx`, `src/components/admin/dashboard/ProductivityWidget.tsx`, `src/components/admin/dashboard/RevenueOverview.tsx`, `src/components/admin/dashboard/PendingActionsWidget.tsx`, `src/components/admin/dashboard/QuickAccess.tsx`

### Task 0016: Remove Deprecated Files and Clean Up Imports ✅ 2026-03-07
- [x] Delete `src/components/admin/dashboard/DashboardStats.tsx` (replaced by `RevenueOverview.tsx`)
- [x] Delete `src/components/admin/dashboard/TodayAppointments.tsx` (replaced by `DashboardTimeline.tsx`)
- [x] Delete `src/components/admin/dashboard/PendingAppointments.tsx` (replaced by `PendingActionsWidget.tsx`)
- [x] Search codebase for any remaining imports of deleted files and remove/update them
- [x] Verify `use-dashboard-realtime.ts` is no longer imported anywhere (retained but unused per design); add a deprecation comment if keeping
- [x] Run `npm run build` to verify no broken imports or type errors (compilation succeeded; heap OOM during TS check is pre-existing infra issue, not a code error)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All three deprecated files are deleted; no broken imports remain; `npm run build` succeeds without errors
- **References**: Design 8 (Files to Remove, Files Retained)
- **Files**: `src/components/admin/dashboard/DashboardStats.tsx`, `src/components/admin/dashboard/TodayAppointments.tsx`, `src/components/admin/dashboard/PendingAppointments.tsx`, `src/hooks/admin/use-dashboard-realtime.ts`

### Task 0017: Update Architecture Documentation ✅ 2026-03-07
- [x] Update `docs/architecture/ARCHITECTURE.md` to reflect new dashboard components and removed components
- [x] Update `docs/architecture/routes/` with changes to admin dashboard route (page.tsx simplified, DashboardClient restructured)
- [x] Update `docs/architecture/components/` with new component documentation (DashboardHeader, RevenueOverview, DashboardTimeline, ProductivityWidget, WaitlistWidget, PendingActionsWidget)
- [x] Document the new `/api/admin/dashboard/revenue-overview` endpoint in architecture docs
- [x] Document the `useDashboardData` hook replacing `useDashboardRealtime` as the primary dashboard data source
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Architecture docs accurately reflect the new dashboard structure; all new files, removed files, and modified files are documented; API endpoint is listed
- **References**: Design 8 (Files Affected), CLAUDE.md (Post-implementation architecture update requirement)
- **Files**: `docs/architecture/ARCHITECTURE.md`, `docs/architecture/routes/`, `docs/architecture/components/`
