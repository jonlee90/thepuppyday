# Admin Panel Routes - Architecture Documentation

> **Module**: Admin Panel
> **Status**: Phases 5, 6, 8, 9, 11 Complete | Phase 7 Pending (Payments)
> **Base Path**: `admin/`
> **Authentication**: Required (admin or groomer role)
> **Last Updated**: 2026-03-06

## Overview

Comprehensive business management interface for administrators and staff to manage appointments, customers, services, analytics, and system settings.

---

## Route Structure

```
src/app/(admin)/
├── error.tsx                         # Admin error boundary
└── loading.tsx                       # Admin loading state

src/app/admin/
├── layout.tsx                        # Admin layout (responsive sidebar + mobile nav)
├── page.tsx                          # Redirects to /admin/dashboard
├── loading.tsx                       # Admin loading skeleton
├── dashboard/
│   ├── page.tsx                      # Dashboard overview
│   └── DashboardClient.tsx           # Client-side dashboard component
├── appointments/
│   ├── page.tsx                      # Appointment management (calendar + list)
│   └── [id]/
│       └── report-card/page.tsx      # Create/edit report card
├── customers/
│   ├── page.tsx                      # Customer list
│   └── [id]/page.tsx                 # Customer profile
├── services/
│   ├── page.tsx                      # Service management
│   └── ServicesClient.tsx            # Client component
├── addons/
│   ├── page.tsx                      # Add-on management
│   └── AddOnsClient.tsx              # Client component
├── gallery/page.tsx                  # Gallery management
├── analytics/page.tsx                # Business analytics
├── waitlist/page.tsx                 # Waitlist management
├── marketing/
│   └── campaigns/
│       ├── page.tsx                  # Marketing campaigns list
│       └── [id]/page.tsx             # Campaign detail/edit
├── notifications/
│   ├── page.tsx                      # Notification overview
│   ├── dashboard/page.tsx            # Notification metrics
│   ├── templates/
│   │   ├── page.tsx                  # Template management
│   │   └── [id]/
│   │       └── edit/
│   │           ├── page.tsx          # Template editor
│   │           └── components/       # Editor sub-components
│   ├── log/
│   │   ├── page.tsx                  # Notification log
│   │   └── components/              # Log sub-components
│   └── settings/
│       ├── page.tsx                  # Notification settings
│       └── components/              # Settings sub-components
└── settings/
    ├── page.tsx                      # Settings dashboard
    ├── banners/
    │   ├── page.tsx                  # Promo banner management
    │   └── BannersClient.tsx         # Client component
    ├── booking/
    │   ├── page.tsx                  # Booking configuration
    │   └── blocked-dates/page.tsx    # Blocked dates manager
    ├── business-hours/
    │   ├── page.tsx                  # Operating hours
    │   └── SettingsClient.tsx        # Client component
    ├── calendar/
    │   ├── page.tsx                  # Calendar sync settings
    │   ├── actions.ts                # Server actions
    │   └── CalendarSettingsClient.tsx # Client component
    ├── loyalty/
    │   ├── page.tsx                  # Loyalty program settings
    │   └── punch-card-demo/page.tsx  # Punch card preview
    ├── site-content/
    │   ├── page.tsx                  # Homepage & SEO content
    │   └── client.tsx                # Client component
    └── staff/page.tsx                # Staff & commission management
```

**Note**: The `(admin)` route group contains only `error.tsx` and `loading.tsx`. All actual admin pages are under the `admin/` directory (without parentheses).

---

## Core Routes

### 1. Dashboard (`/admin/dashboard`)
**File**: `src/app/admin/dashboard/page.tsx`

Server component that fetches dashboard data, rendered by `DashboardClient.tsx`.

**Sections**:
- Stats cards (today's appointments, revenue, pending tasks)
- Today's schedule
- Recent activity feed
- Quick actions (Create Appointment, Walk-in, View Waitlist)

**API Routes Used**:
- `/api/admin/dashboard/stats`
- `/api/admin/dashboard/appointments`
- `/api/admin/dashboard/pending-appointments`
- `/api/admin/dashboard/activity`

---

### 2. Appointments (`/admin/appointments`)
**File**: `src/app/admin/appointments/page.tsx`

Client component with toggleable calendar/list views.

**Views**:
1. **Calendar View** (FullCalendar) - Day/week/month, color-coded by status
2. **List View** - Filterable table with pagination and bulk actions

**Features**:
- Appointment detail modal
- CSV bulk import modal
- Admin create button (opens BookingModal)

**Manual Appointment Creation** (via BookingModal `mode="admin"`):
- **6-step wizard**: Service -> Date/Time -> Customer -> Pet -> Review+Addons -> Confirmation
- Can search/select existing customers or create new
- Admin can bypass availability constraints

**Walk-In Appointments** (via BookingModal `mode="walkin"`):
- **5-step wizard**: Service -> Customer -> Pet -> Review+Addons -> Confirmation
- Date/time auto-set to current moment
- Email optional (phone required for SMS)
- Appointment marked with `source: 'walk_in'`

---

### 3. Report Cards (`/admin/appointments/[id]/report-card`)
**File**: `src/app/admin/appointments/[id]/report-card/page.tsx`

Create/edit grooming report cards with before/after photos, groomer notes, and health observations.

---

### 4. Customers (`/admin/customers`)
**File**: `src/app/admin/customers/page.tsx`

**Features**:
- Customer table with search and filters
- Customer flags (VIP, Flagged)
- Account activation status

**Customer Profile** (`/admin/customers/[id]`):
- Personal information, pets, appointment history
- Customer flags/notes, account activation controls

---

### 5. Services & Addons

**Services** (`/admin/services`): CRUD with size-based pricing, duration, display order.

**Addons** (`/admin/addons`): CRUD with fixed pricing, display order.

---

### 6. Gallery (`/admin/gallery`)
Upload, manage, and organize gallery images with drag-and-drop reordering.

---

### 7. Waitlist (`/admin/waitlist`)
View entries, filter by status, notify customers, convert to appointments.

---

### 8. Marketing Campaigns (`/admin/marketing/campaigns`)

**Campaign List** (`/admin/marketing/campaigns`): View and manage campaigns.

**Campaign Detail** (`/admin/marketing/campaigns/[id]`): Edit individual campaign, view analytics, send.

---

### 9. Notifications

| Route | Purpose |
|-------|---------|
| `/admin/notifications` | Overview |
| `/admin/notifications/dashboard` | Metrics: delivery rates, channel breakdown, timeline |
| `/admin/notifications/templates` | Template list |
| `/admin/notifications/templates/[id]/edit` | Template editor with live preview, variable inserter, test send, version history |
| `/admin/notifications/log` | Searchable delivery log with export and resend |
| `/admin/notifications/settings` | Enable/disable types, retry settings |

---

### 10. Analytics (`/admin/analytics`)
Revenue analytics, appointment trends, customer acquisition, service popularity, groomer performance.

---

### 11. Settings

| Route | Purpose |
|-------|---------|
| `/admin/settings` | Settings dashboard with navigation cards |
| `/admin/settings/site-content` | Hero section, SEO settings, business info |
| `/admin/settings/banners` | Promo banner CRUD with scheduling and analytics |
| `/admin/settings/booking` | Advance booking window, cancellation policy, buffer time |
| `/admin/settings/booking/blocked-dates` | Holiday/closure management |
| `/admin/settings/business-hours` | Operating hours per day |
| `/admin/settings/calendar` | Google Calendar sync, error recovery, quota tracking |
| `/admin/settings/loyalty` | Punch card, earning rules, redemption, referral |
| `/admin/settings/loyalty/punch-card-demo` | Visual punch card preview |
| `/admin/settings/staff` | Staff directory, commission settings, earnings |

---

## Responsive Layout (`layout.tsx`)

**File**: `src/app/admin/layout.tsx`

Server component that fetches admin user data via `getAuthenticatedAdmin()`.

### Layout Components by Breakpoint

**Desktop (>1024px)**:
- `AdminSidebar` (256px expanded, 80px collapsed)
- `AdminMainContent` with dynamic left padding

**Tablet (768px-1023px)**:
- `TabletSidebar` (72px icon-only, always visible)
- Popover submenus for Notifications/Settings

**Mobile (<768px)**:
- `MobileHeader` (56px fixed top)
- `AdminMobileNav` (slide-in drawer, 280px from right)
- `MobileBottomTabs` (72px fixed bottom: Home, Appointments, Walk-in, Customers, More)
- Walk-in button elevated in bottom tabs center

### Key Layout Components

| Component | File |
|-----------|------|
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` |
| `AdminMainContent` | `src/components/admin/AdminMainContent.tsx` |
| `AdminLayoutClient` | `src/components/admin/AdminLayoutClient.tsx` |
| `TabletSidebar` | `src/components/admin/layout/TabletSidebar.tsx` |
| `MobileHeader` | `src/components/admin/layout/MobileHeader.tsx` |
| `MobileBottomTabs` | `src/components/admin/layout/MobileBottomTabs.tsx` |
| `AdminMobileNav` | `src/components/admin/AdminMobileNav.tsx` |

---

## BookingModal Integration

The admin panel uses the reusable `BookingModal` component for appointment creation.

| Feature | `admin` Mode | `walkin` Mode |
|---------|-------------|---------------|
| **Steps** | 6 steps | 5 steps |
| **Step Order** | Service -> DateTime -> Customer -> Pet -> Review+Addons -> Confirm | Service -> Customer -> Pet -> Review+Addons -> Confirm |
| **DateTime** | Manual selection | Auto-set to NOW |
| **Email** | Required | Optional |
| **Bypass Availability** | Yes | Yes |

**Key Files**:
- `src/components/booking/BookingModal.tsx`
- `src/components/booking/BookingWizard.tsx`
- `src/hooks/useBookingModal.ts`
- `src/lib/booking/step-validation.ts`

---

## Security

### Role-Based Access

**Middleware** protects all `/admin/*` routes. Layout verifies admin/groomer role via `getAuthenticatedAdmin()`.

**requireAdmin Helper** (`src/lib/admin/auth.ts`): Validates admin or groomer role.

**Owner-Only Operations**: Sensitive actions (deleting customers, managing staff, system settings) require `admin` role specifically.

---

## State Management

**Admin Store** (Zustand, `src/stores/admin-store.ts`):
- Sidebar collapse state
- Current breakpoint (mobile/tablet/desktop)
- Mobile drawer open/close
- Active bottom tab
- Appointments view preference (calendar/list)

---

## Related Documentation

- [Booking Flow Architecture](../components/booking-flow.md)
- [API Routes](./api.md)
- [Notification System](../services/notifications.md)
