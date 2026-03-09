# Customer Portal Routes - Architecture Documentation

> **Module**: Customer Portal
> **Status**: Completed (Phase 4)
> **Base Path**: `(customer)/`
> **Authentication**: Required (customer, admin, or groomer role)
> **Last Updated**: 2026-03-07

## Overview

The customer portal provides authenticated users with self-service tools to manage appointments, pets, profiles, loyalty points, and view report cards.

---

## Route Structure

```
src/app/(customer)/
├── layout.tsx              # Customer layout with CustomerNav
├── loading.tsx             # Loading skeleton (DashboardSkeleton)
├── error.tsx               # Error boundary
├── dashboard/
│   └── page.tsx            # Customer dashboard (/dashboard)
├── appointments/
│   ├── page.tsx            # Appointment list (/appointments)
│   └── [id]/
│       └── page.tsx        # Appointment detail (/appointments/[id])
├── pets/
│   ├── page.tsx            # Pets list (/pets)
│   └── [id]/
│       └── page.tsx        # Pet profile (/pets/[id])
├── profile/
│   └── page.tsx            # User profile (/profile)
├── loyalty/
│   └── page.tsx            # Loyalty program (/loyalty)
└── report-cards/
    └── page.tsx            # Report cards list (/report-cards)
```

### Public Report Card Route

There is a separate public route group for shared report cards:

```
src/app/(public)/report-cards/[uuid]/
├── page.tsx                # Public report card view
├── loading.tsx             # Loading state
└── not-found.tsx           # 404 page for invalid UUIDs
```

This route (`/report-cards/[uuid]`) is publicly accessible without authentication, allowing customers to share report cards via direct links.

---

## Layout (`layout.tsx`)

**File**: `src/app/(customer)/layout.tsx`

Client component (`'use client'`) that uses the `useAuth` hook for user data.

**Structure**:
```tsx
<div className="min-h-screen bg-[#F8EEE5]">
  <CustomerNav user={{ firstName, lastName, email, avatarUrl }} />
  <main className="lg:pl-64 pb-20 lg:pb-0">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {children}
    </div>
  </main>
  <Toaster />
</div>
```

**Key Details**:
- Uses `<CustomerNav>` component for all navigation (desktop sidebar + mobile bottom nav)
- Desktop: left padding `lg:pl-64` for sidebar
- Mobile: bottom padding `pb-20` for bottom nav
- Shows loading spinner while auth initializes
- Middleware ensures user is authenticated

---

## Routes

### 1. Dashboard (`/dashboard`)
**File**: `src/app/(customer)/dashboard/page.tsx`

Welcome message, upcoming appointments, recent report cards, loyalty points, quick actions.

**QuickActions** (`src/components/customer/dashboard/QuickActions.tsx`): Quick action grid with Book Appointment, Add Pet, View Report Cards, Loyalty Rewards. Uses `useMemo` for derived `quickActions` array and `useCallback` for the booking modal handler to prevent unnecessary re-renders.

### 2. Appointments (`/appointments`)
**File**: `src/app/(customer)/appointments/page.tsx`

List of all appointments (upcoming and past) with status filters and sort options.

**Appointment Detail** (`/appointments/[id]`): Full details, service info, addons, cancel/reschedule/rebook actions. The page passes `serviceDuration`, `petName`, and `serviceName` props to the client component.

**Rescheduling**: The `RescheduleModal` (`src/components/customer/appointments/RescheduleModal.tsx`) provides an in-page rescheduling flow using `CalendarPicker` + `TimeSlotGrid` to select a new date/time. Triggered via the Reschedule button on the appointment detail page (replaces the previous redirect to `/book?reschedule={id}`).

### 3. Pets (`/pets`)
**File**: `src/app/(customer)/pets/page.tsx`

Grid view of customer's pets with add/edit capabilities.

**Pet Profile** (`/pets/[id]`): Pet info, medical details, appointment history, photo upload.

### 4. Profile (`/profile`)
**File**: `src/app/(customer)/profile/page.tsx`

Server component that fetches user data from the `users` table.

**Sections**:
- Personal information (name, email, phone)
- Notification preferences
- Account settings

### 5. Loyalty (`/loyalty`)
**File**: `src/app/(customer)/loyalty/page.tsx`

Points balance, transaction history, rewards catalog (Phase 7).

### 6. Report Cards (`/report-cards`)
**File**: `src/app/(customer)/report-cards/page.tsx`

Grid of all grooming report cards for the customer's pets with before/after photos.

---

## Error & Loading States

**Error Boundary** (`error.tsx`): Customer portal error boundary with retry and home navigation.

**Loading State** (`loading.tsx`): Uses `DashboardSkeleton` component.

---

## API Endpoints

The customer portal uses only two custom API routes:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/customer/appointments/[id]` | PUT, DELETE | Reschedule or cancel an appointment |
| `/api/customer/preferences/notifications` | GET, PUT | Get/update notification preferences |

**Public report card route**:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/report-cards/[uuid]` | GET | Fetch report card by public UUID |

All other data fetching (dashboard, pets, appointments list, profile) is done server-side directly via Supabase queries in the page components, not through custom API routes.

---

## Security

### Route Protection
Middleware checks authentication and redirects unauthenticated users to `/login`.

### RLS Policies
- Users can only view their own appointments (`customer_id = auth.uid()`)
- Users can only view their own pets (`owner_id = auth.uid()`)

### Ownership Validation
All mutations validate that the user owns the resource before allowing changes.

---

## Related Documentation

- [Booking Flow](../components/booking-flow.md)
- [Auth Routes](./auth.md)
- [API Routes](./api.md#customer-endpoints)
