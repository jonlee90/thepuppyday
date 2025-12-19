# RecurringBlockedDays Component

**Task 0188: Recurring blocked days configuration**

A sophisticated component for configuring recurring blocked days (e.g., block all Sundays) in The Puppy Day booking system.

## Features

### 1. Day of Week Toggles
- 7 toggle switches for Sunday through Saturday
- Toggle ON = that day is always blocked for bookings
- Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
- Visual distinction between blocked and available days

### 2. Business Hours Integration
- Detects which days are marked as closed in business hours
- Shows info badge for days already closed
- Quick action button: "Block All Closed Days from Business Hours"
- Suggests blocking days that are already marked as closed

### 3. Affected Dates Preview
- When a day is blocked, shows next 4-5 affected dates
- Example: Enable Sunday → Shows "Dec 24, Dec 31, Jan 7, Jan 14"
- Helps admin understand immediate impact
- Updates in real-time as toggles change

### 4. Appointment Conflict Warning
- Checks for existing appointments when enabling a block
- If conflicts exist:
  - Shows warning modal
  - Displays count: "12 future appointments on Sundays"
  - Requires confirmation to proceed
- Only checks when toggling ON (not when toggling OFF)

### 5. UX Features
- Unsaved changes indicator (orange alert)
- Save button with loading state
- Reset button to revert to saved state
- Success/error toast notifications
- Loading states during API calls
- Smooth animations (Framer Motion)

## Props

```typescript
interface RecurringBlockedDaysProps {
  /**
   * Current booking settings (includes recurring_blocked_days)
   */
  bookingSettings: BookingSettings;

  /**
   * Callback when settings are successfully saved
   */
  onSettingsSaved: (settings: BookingSettings) => void;

  /**
   * Optional callback when loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}
```

## Usage

```tsx
import { RecurringBlockedDays } from '@/components/admin/settings/booking';

function BookingSettingsPage() {
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    min_advance_hours: 2,
    max_advance_days: 90,
    cancellation_cutoff_hours: 24,
    buffer_minutes: 15,
    blocked_dates: [],
    recurring_blocked_days: [0], // Sundays blocked
  });

  return (
    <RecurringBlockedDays
      bookingSettings={bookingSettings}
      onSettingsSaved={(updatedSettings) => {
        setBookingSettings(updatedSettings);
      }}
      onLoadingChange={(loading) => {
        console.log('Loading:', loading);
      }}
    />
  );
}
```

## Data Structure

The `recurring_blocked_days` field is an array of day indices:

```typescript
type RecurringBlockedDays = number[]; // [0, 6] = Sundays and Saturdays blocked
```

**Day Index Mapping:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

**Examples:**
```typescript
// Block Sundays only
recurring_blocked_days: [0]

// Block Sundays and Saturdays
recurring_blocked_days: [0, 6]

// Block weekdays (Mon-Fri)
recurring_blocked_days: [1, 2, 3, 4, 5]

// No recurring blocks
recurring_blocked_days: []
```

## API Integration

### Fetch Settings
```typescript
GET /api/admin/settings/booking
Response: {
  data: {
    recurring_blocked_days: number[],
    // ... other booking settings
  }
}
```

### Save Settings
```typescript
PUT /api/admin/settings/booking
Body: {
  recurring_blocked_days: [0, 6],
  // ... other booking settings
}
Response: {
  data: BookingSettings,
  message: "Booking settings updated successfully"
}
```

### Fetch Business Hours
```typescript
GET /api/admin/settings/business-hours
Response: {
  businessHours: {
    sunday: { is_open: false, ... },
    monday: { is_open: true, ... },
    // ...
  }
}
```

### Check Appointment Conflicts (TODO)
Currently mocked. Will need to implement:
```typescript
// Check appointments on recurring days
GET /api/admin/appointments/check-recurring?day_index=0
Response: {
  conflict_count: 12,
  conflicts: [
    { date: "2025-01-05", count: 3 },
    { date: "2025-01-12", count: 2 },
    // ...
  ]
}
```

## Design System

Follows **Clean & Elegant Professional** design aesthetic:

### Colors
- Background: `#F8EEE5` (warm cream)
- Primary: `#434E54` (charcoal)
- Cards: `#FFFFFF` (white)
- Secondary: `#EAE0D5` (lighter cream)
- Text: `#434E54`, `#6B7280`, `#9CA3AF`

### Components
- **Day Toggles**: Grid layout with bordered cards
- **Active State**: Charcoal border, cream background
- **Badges**: Cream background for date previews
- **Icons**: Lucide React (CalendarClock, Ban, Save, AlertTriangle, Info)
- **Animations**: Framer Motion for smooth transitions

### Layout
```
┌─────────────────────────────────────┐
│ 📅 Recurring Blocked Days           │
├─────────────────────────────────────┤
│ Block specific days every week      │
│                                     │
│ ┌─────────┐  ┌─────────┐           │
│ │ Sunday  │  │ Monday  │           │
│ │ [●]     │  │ [ ]     │           │
│ │ Always  │  │         │           │
│ │ Blocked │  │         │           │
│ └─────────┘  └─────────┘           │
│ ... (7 days total)                 │
│                                     │
│ ℹ️ Sunday already closed in hours   │
│ [Block All Closed Days]             │
│                                     │
│ 📅 Next affected dates (Sunday):    │
│ [Dec 24] [Dec 31] [Jan 7] [Jan 14] │
│                                     │
│ ⚠️ You have unsaved changes         │
│ [Reset] [Save Changes]              │
└─────────────────────────────────────┘
```

## State Management

### Local State
- `recurringBlockedDays`: Current blocked days (array of indices)
- `originalBlockedDays`: Original state for comparison
- `businessHours`: Business hours data
- `appointmentConflicts`: Map of day index to conflict count
- `isSaving`: Save operation in progress
- `isCheckingConflicts`: Conflict check in progress
- `showConflictWarning`: Show conflict modal

### Computed State
- `hasUnsavedChanges`: Compare current vs original
- `closedButNotBlocked`: Days closed in hours but not blocked
- `nextAffectedDates`: Preview dates for each blocked day

## Validation

- Days are unique (no duplicates)
- Day indices are 0-6
- Conflict checks before enabling blocks
- Proper error handling for API failures

## Accessibility

- Label associations for toggles
- Keyboard navigation support
- ARIA attributes on modals
- Proper contrast ratios
- Loading states with spinners
- Clear error messages

## Related Components

- `BlockedDatesCalendar` - Specific date blocking
- `BlockedDatesManager` - List view of blocked dates
- `BlockedDatesSection` - Combined view
- `AdvanceBookingWindow` - Booking time constraints
- `CancellationPolicy` - Cancellation rules

## Future Enhancements

1. **Appointment Conflict API**: Implement actual conflict checking
2. **Bulk Actions**: Enable/disable multiple days at once
3. **Templates**: Preset patterns (weekends only, weekdays only)
4. **History**: View past changes to recurring blocks
5. **Export/Import**: Save and restore configurations
6. **Multi-location**: Support for different recurring blocks per location

## Testing Checklist

- [ ] Toggle days on/off
- [ ] Save changes
- [ ] Reset to original state
- [ ] Business hours integration (suggest closed days)
- [ ] Block all closed days action
- [ ] Preview of affected dates
- [ ] Conflict warning modal (when implemented)
- [ ] Unsaved changes indicator
- [ ] Toast notifications
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive layout
- [ ] Keyboard navigation
