# Task 0019: Create AppointmentHistoryList component

**Group**: Customer Management (Week 4)

## Objective
Build filterable appointment history for customer profile

## Files to create/modify
- `src/components/admin/customers/AppointmentHistoryList.tsx` - History list component

## Requirements covered
- REQ-14.1, REQ-14.2, REQ-14.3, REQ-14.4, REQ-14.5, REQ-14.6, REQ-14.7, REQ-14.8, REQ-14.9

## Acceptance criteria
- [x] All appointments sorted by date descending (most recent first)
- [x] Cards show date, time, pet name, service, add-ons, status, total
- [x] Color-coded status badges
- [x] Filter by status: All, Completed, Cancelled, No-Show
- [x] Date range filter: Last 30 Days, Last 3 Months, Last Year, All Time
- [x] "No appointments found" when filters return empty
- [x] Report card thumbnail with click to expand
- [x] Click card opens appointment detail modal
- [x] Repeat customer metrics: Total Appointments, Total Spent, Favorite Service, Avg Visit Frequency

## Implementation Notes

**Completion Date**: 2025-12-12

### Files Created/Modified

1. **`src/components/admin/customers/AppointmentHistoryList.tsx`** (406 lines)
   - Filterable appointment history component
   - Customer metrics calculation
   - Integration with AppointmentDetailModal

2. **`src/app/api/admin/customers/[id]/appointments/route.ts`** (Created)
   - GET endpoint for customer appointments with related data

### Key Features Implemented

- ✅ **Customer Metrics Dashboard** (lines 191-246)
  - **Total Appointments**: Count of all appointments
  - **Total Spent**: Sum of completed appointment totals
  - **Favorite Service**: Most frequently booked service
  - **Avg Visit Frequency**: Days between appointments

- ✅ **Status Filter** (lines 257-268)
  - All Status (default)
  - Completed only
  - Cancelled only
  - No Show only
  - Real-time filtering with state management

- ✅ **Date Range Filter** (lines 270-282)
  - All Time (default)
  - Last 30 Days
  - Last 3 Months
  - Last Year
  - Uses date-fns for calculations

- ✅ **Appointment Cards** (lines 316-393)
  - Date and time with icons
  - Pet name and service
  - Add-ons list (if any)
  - Color-coded status badge
  - Total price with dollar icon
  - Report card indicator
  - Click to open detail modal

- ✅ **Sorting** (line 126)
  - Always descending by scheduled_at
  - Most recent appointments first
  - Applied after filtering

- ✅ **Empty States** (lines 304-313)
  - "No appointments found" message
  - Different message when filtered vs. no appointments
  - Helpful hint to adjust filters

### Technical Details

**Customer Metrics Calculation** (lines 132-172):

1. **Total Spent**:
```typescript
const completedAppointments = appointments.filter(apt => apt.status === 'completed');
const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.total_price || 0), 0);
```

2. **Favorite Service**:
```typescript
const serviceCounts: Record<string, number> = {};
completedAppointments.forEach(apt => {
  if (apt.service) {
    serviceCounts[apt.service.name] = (serviceCounts[apt.service.name] || 0) + 1;
  }
});

const favoriteService = Object.entries(serviceCounts)
  .sort((a, b) => b[1] - a[1])[0][0]; // Get service with highest count
```

3. **Avg Visit Frequency**:
```typescript
// Only calculate if 2+ completed appointments
if (completedAppointments.length >= 2) {
  const sortedDates = completedAppointments
    .map(apt => new Date(apt.scheduled_at).getTime())
    .sort((a, b) => a - b);

  // Calculate gaps between consecutive appointments
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    gaps.push(sortedDates[i] - sortedDates[i - 1]);
  }

  // Average gap in days
  const avgGapMs = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  avgFrequency = Math.round(avgGapMs / (1000 * 60 * 60 * 24));
}
```

**Filtering Logic** (lines 95-129):
```typescript
const filteredAppointments = useMemo(() => {
  let filtered = [...appointments];

  // Status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(apt => apt.status === statusFilter);
  }

  // Date range filter
  if (dateRangeFilter !== 'all') {
    const cutoffDate = calculateCutoff(dateRangeFilter);
    filtered = filtered.filter(apt => isAfter(new Date(apt.scheduled_at), cutoffDate));
  }

  // Sort descending by date
  filtered.sort((a, b) =>
    new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  return filtered;
}, [appointments, statusFilter, dateRangeFilter]);
```

**Status Color Mapping** (lines 45-54):
```typescript
const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  checked_in: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  ready: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  no_show: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};
```

### Integration with AppointmentDetailModal

**Modal Flow** (lines 174-186):
```typescript
const handleAppointmentClick = (appointmentId: string) => {
  setSelectedAppointmentId(appointmentId);
  setIsModalOpen(true);
};

const handleModalClose = () => {
  setIsModalOpen(false);
  setSelectedAppointmentId(null);
};

const handleModalUpdate = () => {
  fetchAppointments(); // Refresh on update
};

// Render modal (lines 396-402)
<AppointmentDetailModal
  appointmentId={selectedAppointmentId}
  isOpen={isModalOpen}
  onClose={handleModalClose}
  onUpdate={handleModalUpdate}
/>
```

### Performance Optimizations

**useMemo for Filtering** (line 95):
- Filters only recalculate when dependencies change
- Prevents unnecessary re-renders
- Dependencies: appointments, statusFilter, dateRangeFilter

**useMemo for Metrics** (line 132):
- Expensive calculations cached
- Only recalculates when appointments change
- Dependency: appointments array

### Design System Compliance

**Metrics Cards** (4-column grid):
- White background with shadow-sm
- Color-coded icon backgrounds (blue, green, purple, orange)
- Responsive with grid-cols-1 md:grid-cols-4

**Filter Controls**:
- Dropdown selects with border-gray-200
- Focus ring with primary color
- Icon indicator (Filter lucide icon)

**Appointment Cards**:
- Shadow-sm with hover:shadow-md transition
- Rounded corners (rounded-lg)
- Border with border-gray-200
- Cursor pointer for clickability

**Status Badges**:
- Rounded-full for pill shape
- Color-coded backgrounds matching status
- Uppercase text with text-xs
- Border for subtle definition

### User Experience

1. **Metrics at Top**: Immediate insights before scrolling
2. **Clear Filters**: Side-by-side with count display
3. **Scannable Cards**: Icon-based information layout
4. **Report Card Indicator**: Green icon when available
5. **Hover Effects**: Shadow increase on card hover
6. **Loading State**: Spinner during data fetch
7. **Empty State**: Contextual messaging based on filters

### Date Formatting

Uses `date-fns` for consistent formatting:
- **Card Date**: `MMM dd, yyyy` (e.g., "Dec 12, 2025")
- **Card Time**: `h:mm a` (e.g., "2:30 PM")
- All dates in user's local timezone

### Report Card Integration

**Indicator** (lines 378-382):
```typescript
{appointment.report_card && (
  <div className="flex items-center gap-1 text-green-600">
    <ImageIcon className="w-4 h-4" />
    <span className="text-xs font-medium">Report Card</span>
  </div>
)}
```

- Shows when report_card exists
- Green color for positive indicator
- Small icon with text label
- Clicking card opens modal with full report card view

### Future Enhancements

- Export appointment history to CSV/PDF
- Print-friendly view
- Advanced filters (by service, by pet, by date range picker)
- Chart visualization of visit frequency
- Appointment notes preview in cards
- Bulk actions (e.g., send reminders)
- Timeline view option
