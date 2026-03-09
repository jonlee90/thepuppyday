# Admin Dashboard Components - Architecture Documentation

> **Module**: Admin Dashboard
> **Location**: `src/components/admin/dashboard/`
> **Status**: Complete (Phases A-F, admin-dashboard-redesign spec, Phase 10 polish)
> **Last Updated**: 2026-03-09

## Overview

The admin dashboard is a modern command center assembled from purpose-built widgets. All data fetching is handled client-side via the `useDashboardData` hook — the page itself is a thin server component with no server-side data fetching.

---

## Component Tree

```
src/app/admin/dashboard/
├── page.tsx                    # Thin server component — renders DashboardClient only
└── DashboardClient.tsx         # Root client orchestrator — layout + modal state

src/components/admin/dashboard/
├── DashboardHeader.tsx         # Title, date, New Booking + Walk-in buttons
├── RevenueOverview.tsx         # 3-card revenue grid: Today / This Week / This Month
├── DashboardTimeline.tsx       # Vertical timeline of today's appointments
├── ProductivityWidget.tsx      # SVG ring showing completion ratio + stats
├── WaitlistWidget.tsx          # Self-fetching waitlist summary (top 3 + fill rate)
├── PendingActionsWidget.tsx    # Up to 5 pending appointments; returns null when empty
├── WalkInButton.tsx            # Floating action button for mobile walk-ins
├── CalendarSyncWidget.tsx      # Calendar sync status widget
├── ActivityFeed.tsx            # Recent activity feed (retained, not in primary layout)
└── index.ts                    # Barrel exports for all active components

# Removed components:
# QuickAccess.tsx               # Navigation pills — removed from dashboard layout
```

---

## Data Flow

```
page.tsx (Server Component)
  └── DashboardClient.tsx (Client)
        ├── useDashboardData() — fetches all 3 endpoints in parallel on mount
        │     ├── GET /api/admin/dashboard/revenue-overview
        │     ├── GET /api/admin/dashboard/appointments
        │     └── GET /api/admin/dashboard/pending-appointments
        │
        ├── DashboardHeader        (props: onNewBooking, onWalkIn, isConnected, isPolling)
        ├── RevenueOverview        (props: revenueData, loading, error, onRetry)
        ├── PendingActionsWidget   (props: pending, loading, error, onStatusUpdate) — full width, hidden when empty
        ├── grid lg:grid-cols-5:
        │     ├── DashboardTimeline      (col-span-3, props: appointments, loading, error, onStatusUpdate)
        │     └── col-span-2 sidebar:
        │           ├── ProductivityWidget   (props: appointments, revenueData, loading)
        │           └── WaitlistWidget       (self-fetching — no props)
        └── BookingModal x2        (admin + walkin modes)
```

**Note**: `QuickAccess` component was removed from the dashboard layout. `PendingActionsWidget` is now rendered above the main grid (full-width) rather than in the sidebar.

---

## Components

### `DashboardClient` (`src/app/admin/dashboard/DashboardClient.tsx`)

Root client orchestrator. Owns all modal state and wires callbacks.

**State**:
- `adminBookingOpen: boolean` — controls admin BookingModal
- `walkInOpen: boolean` — controls walk-in BookingModal

**Layout** (responsive grid):
```
DashboardHeader (isConnected, isPolling props passed for connection banner)
RevenueOverview (3 columns on md+)
PendingActionsWidget — full-width row, hidden (returns null) when empty
grid-cols-1 lg:grid-cols-5:
  ├── DashboardTimeline    (col-span-3)
  └── Sidebar col-span-2 (sm:grid-cols-2 lg:grid-cols-1 gap-6):
        ├── ProductivityWidget
        └── WaitlistWidget
BookingModal x2 (admin + walkin)
```

**Changes vs. previous layout**: `PendingActionsWidget` moved from the sidebar into a full-width position above the main grid. `QuickAccess` removed entirely. Connection status banner responsibility shifted to `DashboardHeader` via `isConnected`/`isPolling` props.

---

### `DashboardHeader` (`DashboardHeader.tsx`)

**Props**:
```typescript
interface DashboardHeaderProps {
  onNewBooking: () => void;
  onWalkIn: () => void;
}
```

**Behavior**:
- Displays "Dashboard" heading and formatted business-timezone date
- "New Booking" button visible on all breakpoints
- "Walk-in" button: `hidden lg:inline-flex` (hidden on both mobile and tablet; mobile FAB `WalkInButton` handles mobile)
- Responsive: `flex-col md:flex-row` stacking

---

### `RevenueOverview` (`RevenueOverview.tsx`)

**Props**:
```typescript
interface RevenueOverviewProps {
  revenueData: RevenueOverviewResponse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}
```

**Behavior**:
- `grid-cols-1 md:grid-cols-3` card grid
- Framer Motion staggered entrance: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}` at `delay: index * 0.1`
- Animated counter on value change (500ms, 20 steps)
- Trend badges: `TrendingUp` (green), `TrendingDown` (red), `Minus` (gray), null → "N/A"
- Loading: skeleton placeholders; Error: "--" with retry button (`aria-label="Retry loading revenue data"`)
- `aria-live="polite"` on container for screen reader announcements

**Data source**: `GET /api/admin/dashboard/revenue-overview`

---

### `DashboardTimeline` (`DashboardTimeline.tsx`)

**Props**:
```typescript
interface DashboardTimelineProps {
  appointments: Appointment[];
  loading: boolean;
  error: boolean;
  onStatusUpdate?: (id: string, newStatus: AppointmentStatus) => void;
  onAppointmentClick?: (appointmentId: string) => void;
}
```

**Sub-components**:
- `TimeMarkers`: Hour labels 9 AM–5 PM from `BUSINESS_HOURS` constants, 80px per hour
- `NowIndicator`: Red pulsing dot + horizontal line at current time; auto-scrolls on mount; updates every 60s; hidden outside business hours
- `TimelineAppointmentCard`: Left color stripe (`STATUS_COLORS`), time/customer/pet/service/price, `StatusBadge`, status action button (Confirm/Start/Complete); Framer Motion entrance `delay: index * 0.06`
- `AvailableSlotGap`: Dashed border slots for hours without appointments

**Layout**: Scrollable container `max-h-[calc(100vh-300px)] overflow-y-auto`; relative positioning model at 80px/hour

**Accessibility**: Cards have `role="button"`, `tabIndex={0}`, `aria-label`, keyboard handler (`Enter`/`Space`)

---

### `ProductivityWidget` (`ProductivityWidget.tsx`)

**Props**:
```typescript
interface ProductivityWidgetProps {
  appointments: Appointment[];
  revenueData?: RevenueOverviewResponse | null;
  loading: boolean;
}
```

**Behavior**:
- SVG circular ring (80x80px, radius 40, stroke-width 8)
- Background: `stroke="#EAE0D5"`, foreground: `stroke="#434E54"`
- Framer Motion `strokeDashoffset` animation on mount (`duration: 1, ease: "easeOut"`)
- Center label: "completed/total"
- Stats row: Capacity `%` and Avg Revenue per appointment
- Zero-appointment edge case handled (no division by zero)
- Revenue: uses `revenueData.today.completed` if available, falls back to summing appointments array

---

### `WaitlistWidget` (`WaitlistWidget.tsx`)

Self-fetching component — no props.

**Behavior**:
- Fetches `GET /api/admin/waitlist?status=active&limit=3&sort_by=priority&sort_order=desc`
- Displays: header with count badge, fill rate progress bar, top 3 entries (customer name, pet name, requested date), "View All" link
- Auto-refreshes every 60 seconds; pauses when `document.hidden`
- Empty state: `Bone` icon + "No one on the waitlist"
- Loading skeleton and error state with retry button

---

### `PendingActionsWidget` (`PendingActionsWidget.tsx`)

**Props**:
```typescript
interface PendingActionsWidgetProps {
  pending: Appointment[];
  loading: boolean;
  error: boolean;
  onStatusUpdate?: () => void;
}
```

**Behavior**:
- Shows up to 5 pending appointments (`MAX_VISIBLE = 5`)
- **Returns `null` when empty** (and not loading/error) — widget is completely hidden from the layout when there are no pending appointments
- Framer Motion staggered entrance: `initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}` at `delay: index * 0.06`
- Confirm button: POSTs to `/api/admin/appointments/{id}/status`, optimistic removal from local list; uses `toast.success`/`toast.error` from `@/hooks/use-toast`
- "View All" link to `/admin/appointments?status=pending` when `pending.length > 5`
- Count badge: `aria-live="polite" aria-atomic="true"`
- Rendered full-width above the main timeline/sidebar grid (not in sidebar)

**Empty behavior**: The component returns `null` when `!loading && !error && localPending.length === 0`, so no empty-state card appears — the section vanishes entirely.

---

### `QuickAccess` (`QuickAccess.tsx`) — REMOVED

**Status**: Removed from the dashboard layout as of Phase 10 polish. The file may still exist in `src/components/admin/dashboard/` but is no longer imported or rendered by `DashboardClient`.

---

## `useDashboardData` Hook

**File**: `src/hooks/admin/use-dashboard-data.ts`

Primary data source for the dashboard. Replaces the deprecated `useDashboardRealtime`.

**Interface**:
```typescript
interface DashboardData {
  revenue: RevenueOverviewResponse | null;
  appointments: Appointment[];
  pendingAppointments: Appointment[];
  loading: { revenue: boolean; appointments: boolean; pending: boolean };
  errors: { revenue: boolean; appointments: boolean; pending: boolean };
  isConnected: boolean;
  isPolling: boolean;
  refetch: () => void;
}
```

**Behavior**:
- On mount: fires `Promise.allSettled` for all 3 endpoints in parallel
- Independent loading/error state per endpoint — partial failures don't block other data
- 30-second polling interval with `document.visibilityState` awareness (pauses when tab hidden)
- In production: Supabase Realtime subscription on `appointments` table filtered to today's date range; falls back to polling on subscription failure
- `refetch()`: triggers immediate re-fetch of all 3 endpoints

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/admin/dashboard/revenue-overview` | GET | Today, this-week, this-month revenue with change percentages |
| `/api/admin/dashboard/appointments` | GET | Today's appointments with customer/pet/service joins |
| `/api/admin/dashboard/pending-appointments` | GET | Appointments with status=pending |
| `/api/admin/appointments/{id}/status` | POST | Update appointment status |

### `RevenueOverviewResponse` type (`src/app/api/admin/dashboard/revenue-overview/route.ts`):
```typescript
export interface RevenueOverviewResponse {
  today: {
    completed: number;
    pending: number;
    total: number;
    changePercent: number | null;
  };
  thisWeek: {
    total: number;
    changePercent: number | null;
  };
  thisMonth: {
    total: number;
    changePercent: number | null;
  };
}
```

Mock mode returns: `{ today: { completed: 220, pending: 100, total: 320, changePercent: 12 }, thisWeek: { total: 1840, changePercent: 8 }, thisMonth: { total: 6200, changePercent: 5 } }`

---

## Removed Files (Phase F cleanup)

The following files were deleted as part of the admin-dashboard-redesign:

| Deleted File | Replaced By |
|---|---|
| `DashboardStats.tsx` | `RevenueOverview.tsx` |
| `TodayAppointments.tsx` | `DashboardTimeline.tsx` |
| `PendingAppointments.tsx` | `PendingActionsWidget.tsx` |

### Deprecated (retained for reference)

- `src/hooks/admin/use-dashboard-realtime.ts` — superseded by `useDashboardData`. No longer imported anywhere. Marked `@deprecated`.

---

## Responsive Behavior

| Breakpoint | Revenue Cards | Pending Widget | Main Grid |
|---|---|---|---|
| Mobile (< 768px) | 1 column stacked | Full width (or hidden) | Single column |
| Tablet (768–1023px) | 3 columns | Full width (or hidden) | Single column |
| Desktop (>= 1024px) | 3 columns | Full width (or hidden) | `grid-cols-5` (Timeline 3 + Sidebar 2) |

Sidebar at tablet: `sm:grid-cols-2 lg:grid-cols-1` — ProductivityWidget and WaitlistWidget sit side-by-side on tablet, stack vertically on desktop.

Walk-in on mobile/tablet: `DashboardHeader`'s Walk-in button is `hidden lg:inline-flex` (hidden on mobile and tablet); the `WalkInButton` FAB component handles mobile walk-ins.

---

## Accessibility

- All interactive elements have `aria-label` attributes
- Timeline cards: `role="button"`, `tabIndex={0}`, keyboard handler (`Enter`/`Space`)
- Revenue container: `aria-live="polite"` for dynamic value updates
- Pending count badge: `aria-live="polite" aria-atomic="true"`
- Connection status banner: `role="status" aria-live="polite"` (managed in `DashboardHeader`)
- ProductivityWidget SVG ring: `role="img"` with descriptive `aria-label`
- WaitlistWidget fill rate bar: `role="progressbar"` with `aria-valuenow/min/max`
