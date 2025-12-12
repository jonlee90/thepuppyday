# Task 0011: Install and configure FullCalendar

**Group**: Appointments Management (Week 3)

## Objective
Set up FullCalendar React library with required plugins

## Files to create/modify
- `package.json` - Add FullCalendar dependencies
- `src/components/admin/appointments/AppointmentCalendar.tsx` - Calendar component

## Requirements covered
- REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.6, REQ-7.7, REQ-7.8, REQ-7.9, REQ-7.10, REQ-7.11, REQ-7.12

## Acceptance criteria
- [x] Day view with 30-min slots from 9 AM - 5 PM
- [x] Week view with 7-day grid starting Monday
- [x] Month view with appointment counts per day
- [x] Appointment blocks show customer name, pet name, service
- [x] Click event opens detail modal
- [x] Status-based colors: gray/blue/yellow/green/dark-green/red
- [x] Previous/next navigation and date picker
- [x] Gray out times outside business hours
- [x] Horizontally stack overlapping appointments

## Implementation Notes

**Status:** ✅ Completed (2025-12-12)

**Files Created/Modified:**
- `package.json` / `package-lock.json` - Added FullCalendar v6.1.19 dependencies
- `src/components/admin/appointments/AppointmentCalendar.tsx` - Calendar component with day/week/month views
- `src/lib/admin/appointment-status.ts` - Status color mapping and utilities

**FullCalendar Packages Installed:**
- `@fullcalendar/core@6.1.19` - Core calendar library
- `@fullcalendar/react@6.1.19` - React integration
- `@fullcalendar/daygrid@6.1.19` - Month view plugin
- `@fullcalendar/timegrid@6.1.19` - Day/week view plugins
- `@fullcalendar/interaction@6.1.19` - Click/drag interaction support

**Key Features Implemented:**
- ✓ Three view modes: Day, Week, Month with toggle buttons
- ✓ 30-minute time slot granularity (slotDuration: '00:30:00')
- ✓ Business hours: 9 AM - 5 PM (grays out non-business hours)
- ✓ Week starts on Monday (firstDay: 1)
- ✓ Event click handler opens detail modal via onEventClick callback
- ✓ Dynamic date range fetching based on visible calendar range
- ✓ Performance optimization: Limit 200 appointments per view
- ✓ Horizontal event stacking for overlapping appointments

**Calendar Configuration:**
```typescript
{
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek,dayGridMonth'
  },
  slotMinTime: '09:00:00',
  slotMaxTime: '17:00:00',
  slotDuration: '00:30:00',
  allDaySlot: false,
  firstDay: 1, // Monday
  height: 'auto',
  eventMaxStack: 3, // Stack overlapping events
}
```

**Status-Based Event Colors:**
- Pending: #9CA3AF (gray)
- Confirmed: #74B9FF (blue)
- Checked In: #FFB347 (yellow/orange)
- In Progress: #6BCB77 (green)
- Completed: #2D6A4F (dark green)
- Cancelled: #EF4444 (red)
- No Show: #DC2626 (dark red)

**Event Display Format:**
```
{Customer Name} - {Pet Name}
{Service Name}
```

**Technical Implementation:**
- Uses `getCalendarEventColor()` helper for consistent status colors
- Calculates end time from scheduled_at + duration_minutes
- Fetches appointments with full customer, pet, and service joins
- Real-time updates via date range change callback
- Loading states during data fetch
- Error handling with console logging

**Performance Optimizations:**
- Limits to 200 appointments per view to prevent UI slowdown
- Debounced date range changes
- Only fetches appointments for visible date range
- Uses memoized callbacks with useCallback
