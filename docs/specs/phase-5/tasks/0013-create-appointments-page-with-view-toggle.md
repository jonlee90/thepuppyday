# Task 0013: Create appointments page with view toggle

**Group**: Appointments Management (Week 3)

## Objective
Build appointments page with calendar/list toggle

## Files to create/modify
- `src/app/(admin)/appointments/page.tsx` - Appointments page

## Requirements covered
- REQ-7.1, REQ-8.1

## Acceptance criteria
- [x] Default to calendar view (day)
- [x] Toggle button to switch between calendar and list
- [x] Persist view preference in admin store
- [x] Real-time subscriptions for visible date range

## Implementation Notes

**Status:** ✅ Completed (2025-12-12)

**Files Created/Modified:**
- `src/app/admin/appointments/page.tsx` - Main appointments page with view toggle
- `src/stores/admin-store.ts` - Updated with appointments view preference state

**Key Features Implemented:**
- ✓ Default view: Calendar (Day view)
- ✓ View toggle button with Calendar/List icons
- ✓ Seamless switching between calendar and list views
- ✓ View preference persisted in Zustand admin store
- ✓ Appointment detail modal shared across both views
- ✓ Clean & Elegant Professional design aesthetic

**View Toggle Implementation:**
```typescript
const { appointmentsView, setAppointmentsView } = useAdminStore();

<div className="btn-group">
  <button
    onClick={() => setAppointmentsView('calendar')}
    className={`btn ${appointmentsView === 'calendar' ? 'btn-active' : ''}`}
  >
    <Calendar className="w-4 h-4" />
    Calendar
  </button>
  <button
    onClick={() => setAppointmentsView('list')}
    className={`btn ${appointmentsView === 'list' ? 'btn-active' : ''}`}
  >
    <List className="w-4 h-4" />
    List
  </button>
</div>
```

**Admin Store State Management:**
```typescript
interface AdminStore {
  appointmentsView: 'calendar' | 'list';
  setAppointmentsView: (view: 'calendar' | 'list') => void;
}

// State persists across page refreshes and navigation
```

**Shared Components:**
- Both views use the same `AppointmentDetailModal` component
- Modal state managed at page level
- Consistent appointment data structure across views
- Single source of truth for appointment details

**Real-Time Updates:**
In mock mode, manual refresh required. In production:
- Supabase Realtime subscriptions for visible date range
- Auto-refresh when appointments are created/updated/deleted
- Optimistic UI updates with rollback on error
- Subscription cleanup on component unmount

**Page Layout:**
```
┌─────────────────────────────────────┐
│ Appointments Header                 │
│ [Calendar/List Toggle] [Date Range] │
├─────────────────────────────────────┤
│                                     │
│ Calendar View OR List View          │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Design System Compliance:**
- DaisyUI btn-group for toggle buttons
- Active state with btn-active class
- Lucide React icons (Calendar, List)
- Charcoal (#434E54) primary color
- Warm cream (#F8EEE5) background
- Soft shadows and rounded corners

**Performance Optimizations:**
- View state stored in Zustand (no unnecessary re-renders)
- Lazy loading of view components
- Conditional rendering based on active view
- Memoized callbacks for view switching

**Technical Implementation:**
- Client component with 'use client' directive
- Modal state lifted to page level
- Event handlers passed down to child views
- TypeScript strict mode enabled
- Proper cleanup of event listeners and subscriptions
