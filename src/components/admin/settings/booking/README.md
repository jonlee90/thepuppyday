# Business Hours Editor Component

**Task 0184**: Configure weekly business hours for The Puppy Day booking system.

## Overview

The `BusinessHoursEditor` component provides a comprehensive interface for managing weekly business hours with support for:

- **Weekly Schedule**: Configure hours for all 7 days
- **Multiple Time Ranges**: Support for split shifts and lunch breaks (up to 3 ranges per day)
- **Time Validation**: Prevents invalid time ranges and overlapping schedules
- **Quick Actions**: Copy hours between days, apply to weekdays, close weekends
- **Visual Preview**: See weekly schedule at a glance
- **Unsaved Changes Tracking**: Warns before leaving with unsaved edits

## Features

### 1. Per-Day Configuration
Each day can be:
- **Open/Closed**: Toggle to enable/disable booking for that day
- **Single or Multiple Ranges**: Add 1-3 time ranges per day
- **15-minute Increments**: All times are in 15-minute intervals

Example configurations:
- **Standard Hours**: `9:00 AM - 5:00 PM`
- **Split Shift**: `9:00 AM - 12:00 PM, 1:00 PM - 5:00 PM` (lunch break)
- **Multiple Shifts**: `9:00 AM - 11:00 AM, 11:30 AM - 1:30 PM, 2:00 PM - 5:00 PM`

### 2. Validation Rules

**Time Range Validation:**
- Close time must be after open time
- No overlapping time ranges within a day
- Each range must be valid (HH:mm format)

**Business Logic Validation:**
- Warns if all days are closed (no booking possible)
- Alerts if a day is marked open but has no time ranges
- Shows specific error messages for each validation issue

### 3. Quick Actions

**Copy Hours:**
- Copy from one day to another
- Apply to all weekdays at once
- Close all weekends with one click

**Templates:**
- Default hours: Monday-Saturday 9 AM - 5 PM, Sunday closed
- Easy to customize and save as your standard schedule

### 4. Visual Feedback

**Weekly Preview:**
- ✓ Green checkmark: Single time range (open)
- ● Orange dot: Multiple time ranges (split shift)
- ✗ Gray X: Closed

**Status Indicators:**
- Unsaved changes warning
- Validation error messages
- Success/error toasts on save

## Usage

### Basic Implementation

```tsx
import { BusinessHoursEditor } from '@/components/admin/settings/booking/BusinessHoursEditor';

export default function BookingSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Business Hours</h1>
      <BusinessHoursEditor />
    </div>
  );
}
```

### Integration with Admin Settings

The component automatically integrates with the booking settings API:

**GET `/api/admin/settings/booking`**
- Fetches current business hours from `settings.business_hours`
- Falls back to default hours if not configured

**PUT `/api/admin/settings/booking`**
- Saves updated business hours
- Validates data before saving
- Logs changes to audit log

## Data Structure

### TypeScript Types

```typescript
interface TimeRange {
  start: string; // "09:00" (HH:mm format)
  end: string;   // "17:00" (HH:mm format)
}

interface DayHours {
  isOpen: boolean;
  ranges: TimeRange[]; // 0-3 ranges per day
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}
```

### Example Data

**Default Schedule (Mon-Sat 9-5, Sunday closed):**
```json
{
  "monday": {
    "isOpen": true,
    "ranges": [{ "start": "09:00", "end": "17:00" }]
  },
  "tuesday": {
    "isOpen": true,
    "ranges": [{ "start": "09:00", "end": "17:00" }]
  },
  // ... wednesday through saturday same as monday
  "sunday": {
    "isOpen": false,
    "ranges": []
  }
}
```

**Split Shift with Lunch Break:**
```json
{
  "monday": {
    "isOpen": true,
    "ranges": [
      { "start": "09:00", "end": "12:00" },
      { "start": "13:00", "end": "17:00" }
    ]
  }
}
```

## API Integration

### Fetch Current Hours

```typescript
const response = await fetch('/api/admin/settings/booking');
const { data } = await response.json();
const businessHours = data.business_hours; // BusinessHours | undefined
```

### Save Updated Hours

```typescript
const updatedSettings = {
  ...currentSettings,
  business_hours: newBusinessHours,
};

await fetch('/api/admin/settings/booking', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updatedSettings),
});
```

## Design System

The component follows The Puppy Day's **Clean & Elegant Professional** design:

**Colors:**
- Background: `#F8EEE5` (warm cream) / `#FFFBF7` (light cream)
- Primary: `#434E54` (charcoal)
- Borders: `#434E54/10` (subtle)
- Success: Green (#6BCB77)
- Warning: Orange (#FFB347)
- Error: Red (#EF4444)

**Components:**
- Soft shadows (`shadow-sm`, `shadow-md`)
- Rounded corners (`rounded-lg`, `rounded-xl`)
- DaisyUI components: `btn`, `toggle`, `select`, `loading`
- Lucide React icons

## Validation Functions

### Time Range Validation

```typescript
function validateTimeRange(range: TimeRange): string | null {
  if (range.start >= range.end) {
    return 'Close time must be after open time';
  }
  return null;
}
```

### Overlap Detection

```typescript
function validateNoOverlap(ranges: TimeRange[]): string | null {
  // Checks all pairs of ranges for overlaps
  // Returns error message if overlap found, null otherwise
}
```

### Complete Validation

```typescript
function validateBusinessHours(hours: BusinessHours): {
  isValid: boolean;
  warnings: string[];
} {
  // Validates entire weekly schedule
  // Returns all validation warnings
}
```

## Testing

Comprehensive test coverage in `__tests__/components/admin/settings/booking/BusinessHoursEditor.test.tsx`:

- ✅ Time range validation (19 tests)
- ✅ Overlap detection
- ✅ Weekly schedule validation
- ✅ Edge cases (midnight, 24-hour format)
- ✅ Complex schedules with multiple ranges

Run tests:
```bash
npm test -- __tests__/components/admin/settings/booking/BusinessHoursEditor.test.tsx
```

## Accessibility

- **Keyboard Navigation**: All controls are keyboard accessible
- **Labels**: Proper ARIA labels for screen readers
- **Focus States**: Visible focus indicators
- **Error Messages**: Clear, descriptive error text
- **Color Contrast**: WCAG AA compliant

## Future Enhancements

Potential improvements for future versions:

1. **Holiday Hours**: Override business hours for specific dates
2. **Seasonal Schedules**: Different hours for summer/winter
3. **Groomer-Specific Hours**: Set availability per groomer
4. **Capacity Limits**: Max appointments per time slot
5. **Auto-Save**: Save changes automatically after timeout
6. **Import/Export**: Save and load schedule templates

## Related Files

- `src/types/settings.ts` - TypeScript types and Zod schemas
- `src/app/api/admin/settings/booking/route.ts` - API routes
- `__tests__/components/admin/settings/booking/BusinessHoursEditor.test.tsx` - Unit tests

## Support

For questions or issues, contact the development team or refer to the main project documentation.
