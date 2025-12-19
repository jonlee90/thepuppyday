# Blocked Dates Management Components

Comprehensive UI for managing blocked dates in The Puppy Day booking system.

## Components Overview

### 1. BlockedDatesManager
List-based management interface with add/remove functionality.

**Features:**
- Table view of all blocked dates (sorted chronologically)
- Add single date or date range
- Optional reason for blocking (200 char max)
- Conflict detection with existing appointments
- Force block option after conflict warning
- Delete confirmation dialogs
- Real-time loading states
- Success/error toast notifications

**Usage:**
```tsx
import { BlockedDatesManager } from '@/components/admin/settings/booking';

<BlockedDatesManager
  blockedDates={blockedDates}
  onBlockedDatesChange={setBlockedDates}
  onLoadingChange={setIsLoading}
/>
```

**Props:**
- `blockedDates`: BlockedDate[] - Current blocked dates array
- `onBlockedDatesChange`: (dates: BlockedDate[]) => void - Callback when dates change
- `onLoadingChange?`: (loading: boolean) => void - Optional loading state callback

---

### 2. BlockedDatesCalendar
Interactive calendar view for visualizing and managing blocked dates.

**Features:**
- Monthly calendar grid (Sun-Sat)
- Month/year navigation (prev/next/today)
- Color-coded date states:
  - Green: Available
  - Blue: Has appointments
  - Gray: Blocked
  - Red: Blocked WITH appointments
- Hover tooltips showing:
  - Block reason (if any)
  - Appointment count (if any)
- Click-to-toggle blocking
- Interactive modals for add/remove
- Responsive layout

**Usage:**
```tsx
import { BlockedDatesCalendar } from '@/components/admin/settings/booking';

<BlockedDatesCalendar
  blockedDates={blockedDates}
  onBlockedDatesChange={setBlockedDates}
  onLoadingChange={setIsLoading}
/>
```

**Props:**
- `blockedDates`: BlockedDate[] - Current blocked dates array
- `onBlockedDatesChange`: (dates: BlockedDate[]) => void - Callback when dates change
- `onLoadingChange?`: (loading: boolean) => void - Optional loading state callback

---

### 3. BlockedDatesSection
Combined layout integrating both Manager and Calendar with shared state.

**Features:**
- Side-by-side layout (desktop)
- Stacked layout (mobile)
- Shared state management
- Global loading overlay
- Responsive grid system

**Usage:**
```tsx
import { BlockedDatesSection } from '@/components/admin/settings/booking';

export default function BlockedDatesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BlockedDatesSection />
    </div>
  );
}
```

---

## API Integration

All components integrate with the blocked dates API:

**Endpoints:**
- `GET /api/admin/settings/booking/blocked-dates` - Fetch all blocked dates
- `POST /api/admin/settings/booking/blocked-dates` - Add new blocked date(s)
- `DELETE /api/admin/settings/booking/blocked-dates` - Remove blocked date(s)

**Request/Response Types:**

```typescript
// BlockedDate type
interface BlockedDate {
  date: string;        // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD (for ranges)
  reason?: string;
}

// POST request
{
  date: string;
  end_date?: string | null;
  reason?: string;
  force?: boolean;  // Force block despite conflicts
}

// Conflict response (409)
{
  error: string;
  affected_appointments: number;
  conflicts: Array<{
    date: string;
    count: number;
  }>;
}

// Success response
{
  blocked_dates: BlockedDate[];
  message: string;
}
```

---

## Conflict Handling

When adding blocked dates with existing appointments:

1. **Initial Check**: API returns 409 with conflict details
2. **Warning Dialog**: Shows affected appointment count and dates
3. **User Choice**:
   - Cancel: Abort blocking
   - Force Block: Proceed with `force: true` parameter
4. **Note**: Existing appointments remain, but new bookings are prevented

---

## Design System Compliance

All components follow The Puppy Day's **Clean & Elegant Professional** design:

**Colors:**
- Background: `#F8EEE5` (warm cream)
- Primary: `#434E54` (charcoal)
- Cards: `#FFFFFF`, `#FFFBF7`
- Text: `#434E54` (primary), `#6B7280` (secondary)

**Components:**
- Soft shadows (`shadow-sm`, `shadow-md`, `shadow-lg`)
- Subtle borders (1px, `border-gray-200`)
- Gentle corners (`rounded-lg`, `rounded-xl`)
- Professional typography (semibold for headers)
- Smooth transitions (200ms)

**Icons:**
- Lucide React icons
- Colors: `#434E54` (primary), `#6B7280` (secondary)
- Sizes: 16px (sm), 20px (md), 24px (lg)

---

## State Management

Components use shared state for synchronization:

```tsx
const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
const [isCalendarLoading, setIsCalendarLoading] = useState(false);
const [isManagerLoading, setIsManagerLoading] = useState(false);

// Pass to both components
<BlockedDatesManager
  blockedDates={blockedDates}
  onBlockedDatesChange={setBlockedDates}
  onLoadingChange={setIsManagerLoading}
/>

<BlockedDatesCalendar
  blockedDates={blockedDates}
  onBlockedDatesChange={setBlockedDates}
  onLoadingChange={setIsCalendarLoading}
/>
```

Both components:
- Fetch blocked dates on mount
- Update shared state after mutations
- Reflect changes in real-time
- Handle loading states independently

---

## User Experience Features

**Loading States:**
- Spinner overlays during API calls
- Disabled buttons while processing
- Global loading overlay (optional)

**Error Handling:**
- Try-catch blocks around all API calls
- User-friendly error messages
- Toast notifications for feedback

**Validation:**
- Date format validation (YYYY-MM-DD)
- End date must be >= start date
- Reason max length (200 chars)
- Character counter on textareas

**Accessibility:**
- ARIA labels on icon buttons
- Keyboard navigation support
- Focus states on interactive elements
- Semantic HTML structure

**Responsive Design:**
- Mobile-first approach
- Grid layout adjusts to screen size
- Touch-friendly targets on mobile
- Readable text sizes

---

## Example Page Implementation

```tsx
// src/app/(admin)/admin/settings/booking/blocked-dates/page.tsx
import { BlockedDatesSection } from '@/components/admin/settings/booking';

export const metadata = {
  title: 'Blocked Dates - Booking Settings | Admin',
  description: 'Manage blocked dates for appointment bookings',
};

export default function BlockedDatesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BlockedDatesSection />
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Fetch blocked dates on mount
- [ ] Add single blocked date
- [ ] Add date range
- [ ] Handle conflict warning (409 response)
- [ ] Force block with appointments
- [ ] Remove blocked date
- [ ] Delete confirmation works
- [ ] Calendar month navigation
- [ ] Calendar "Today" button
- [ ] Date state colors are correct
- [ ] Tooltips show on hover
- [ ] Click date to toggle block
- [ ] Real-time sync between calendar and list
- [ ] Loading states display correctly
- [ ] Success toasts appear
- [ ] Error toasts appear
- [ ] Validation prevents invalid dates
- [ ] Responsive layout on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility

---

## Tasks Completed

**Task 0186:** BlockedDatesManager component
- ✅ List view with table layout
- ✅ Add single date button
- ✅ Add date range button
- ✅ Modal with date picker and reason
- ✅ Conflict detection
- ✅ Force block option
- ✅ Delete with confirmation
- ✅ Toast notifications

**Task 0187:** BlockedDatesCalendar component
- ✅ Monthly calendar grid
- ✅ Month/year navigation
- ✅ Today button
- ✅ Color-coded date states
- ✅ Hover tooltips
- ✅ Click to toggle blocking
- ✅ Add/remove modals
- ✅ Real-time synchronization

**Integration:**
- ✅ BlockedDatesSection for combined layout
- ✅ Shared state management
- ✅ API route support for force parameter
- ✅ Demo page implementation
- ✅ Export from index.ts
- ✅ Documentation

---

## Future Enhancements

- [ ] Bulk delete (select multiple dates)
- [ ] Recurring blocked patterns (e.g., every Sunday)
- [ ] Import/export blocked dates (CSV)
- [ ] Copy blocked dates to next month
- [ ] Appointment count API integration (real data)
- [ ] Calendar year view
- [ ] Print calendar view
- [ ] Audit log for changes

---

**Last Updated:** 2025-12-19
**Tasks:** 0186, 0187
**Components:** BlockedDatesManager, BlockedDatesCalendar, BlockedDatesSection
