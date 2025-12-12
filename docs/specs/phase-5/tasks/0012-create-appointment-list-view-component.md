# Task 0012: Create AppointmentListView component

**Group**: Appointments Management (Week 3)

## Objective
Build searchable, filterable appointment table

## Files to create/modify
- `src/components/admin/appointments/AppointmentListView.tsx` - Table view
- `src/app/api/admin/appointments/route.ts` - List appointments endpoint

## Requirements covered
- REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9, REQ-8.10, REQ-8.11, REQ-8.12

## Acceptance criteria
- [x] Table columns: Date/Time, Customer, Pet, Service, Status, Actions
- [x] Search by customer name, pet name, email, phone
- [x] Debounce search input for 300ms
- [x] Filter by: Status, Date Range, Service Type (AND logic)
- [x] Date range presets: Today, Tomorrow, This Week, This Month, Custom
- [x] Custom range shows date picker
- [x] Pagination: 25 per page with controls
- [x] Row click opens detail modal
- [x] Sortable by Date/Time, Customer Name, Status
- [x] "No appointments found" with clear filters button

## Implementation Notes

**Status:** ✅ Completed (2025-12-12)

**Files Created/Modified:**
- `src/components/admin/appointments/AppointmentListView.tsx` - Tabular list view with search, filters, and pagination
- `src/app/api/admin/appointments/route.ts` - List appointments API endpoint with query support
- `src/lib/admin/appointment-status.ts` - Status badge utilities

**Key Features Implemented:**
- ✓ Responsive table with 6 columns: Date/Time, Customer, Pet, Service, Status, Actions
- ✓ Real-time search across customer name, pet name, email, phone
- ✓ 300ms debounced search using useEffect + setTimeout pattern
- ✓ Multi-filter support with AND logic (status + service + date range)
- ✓ Five date range presets with automatic date calculation
- ✓ Custom date range with native HTML5 date pickers
- ✓ Server-side pagination (25 items per page)
- ✓ Click-to-open detail modal on any table row
- ✓ Three-way sorting: Date/Time, Customer Name, Status (asc/desc)
- ✓ Empty state with "Clear all filters" button

**Search Implementation:**
```typescript
// Debounce pattern
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
    setPage(1); // Reset to page 1 on search
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

**Date Range Presets:**
- **Today**: Current business day (LA timezone)
- **Tomorrow**: Next business day
- **This Week**: Monday - Sunday of current week
- **This Month**: First - last day of current month
- **Custom**: User-selectable start and end dates

**Filter Logic (AND combinator):**
```typescript
// API endpoint applies all filters simultaneously
const params = {
  search: 'John',           // AND
  status: 'confirmed',      // AND
  service: 'uuid',          // AND
  dateFrom: '2025-12-01',   // AND
  dateTo: '2025-12-31'      // AND
}
```

**Pagination Details:**
- Items per page: 25 (configurable via limit param)
- Server-side pagination with total count
- Previous/Next buttons with disabled states
- Page number display: "Page X of Y"
- Total results count: "Showing X of Y appointments"

**Sortable Columns:**
1. **Date/Time** (`scheduled_at`) - Default: ascending
2. **Customer Name** (`customer.last_name`, `customer.first_name`)
3. **Status** (`status`)

**API Query Parameters:**
```typescript
{
  page: number,           // Pagination
  limit: number,          // Items per page (25)
  search?: string,        // Debounced search query
  status?: string,        // Filter by status
  service?: string,       // Filter by service ID
  dateFrom?: string,      // Filter by date range start
  dateTo?: string,        // Filter by date range end
  sortBy?: string,        // Sort column
  sortOrder?: 'asc'|'desc' // Sort direction
}
```

**Status Badge Styling:**
Uses DaisyUI badge variants for visual clarity:
- Pending: `badge-ghost` (gray outline)
- Confirmed: `badge-info` (blue)
- Checked In: `badge-warning` (yellow/orange)
- In Progress: `badge-primary` (charcoal #434E54)
- Completed: `badge-success` (green)
- Cancelled: `badge-error` (red)
- No Show: `badge-error` (red)

**Empty State:**
Displays when no appointments match filters:
- Friendly message: "No appointments found"
- "Clear all filters" button to reset state
- Maintains professional design system aesthetic

**Performance Optimizations:**
- Debounced search prevents excessive API calls
- Server-side filtering and pagination
- Memoized filter calculations with useMemo
- Uses callback refs with useCallback
- Efficient re-renders with proper dependency arrays

**Technical Implementation:**
- Timezone-aware date handling with `getTodayInBusinessTimezone()`
- Dynamic service dropdown populated from database
- Row click handler with event delegation
- Loading states with skeleton UI
- Error handling with user-friendly messages
