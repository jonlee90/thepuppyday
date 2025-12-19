# Task 0190: Integration with Availability API - Implementation Summary

## Overview

This task enhances the existing availability calculation system to integrate with the new booking settings from Task 0180. The integration adds support for blocked dates, booking windows, buffer times, and other administrative controls while maintaining backward compatibility.

## Files Created

### 1. `src/lib/admin/booking-settings.ts`

Utility module for fetching and working with booking settings.

**Key Functions:**

- **`getBookingSettings()`** - Fetches settings from API with 1-minute cache
- **`clearBookingSettingsCache()`** - Invalidates cache after settings updates
- **`isDateBlocked()`** - Checks if a date is blocked (single date or range)
- **`getEarliestBookableTime()`** - Calculates earliest bookable time based on min_advance_hours
- **`getLatestBookableDate()`** - Calculates latest bookable date based on max_advance_days
- **`isWithinBookingWindow()`** - Validates if datetime falls within booking window

**Caching Strategy:**

```typescript
// Simple in-memory cache with 60-second TTL
let cachedSettings: BookingSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000;
```

**Benefits:**
- Reduces API calls during availability calculations
- Consistent settings across multiple slot checks
- Minimal memory footprint
- Easy to invalidate after updates

## Files Updated

### 2. `src/lib/booking/availability.ts`

Enhanced existing availability functions to support booking settings.

**Changes Made:**

#### Added Imports
```typescript
import type { BookingSettings } from '@/types/settings';
import { isDateBlocked, isWithinBookingWindow } from '@/lib/admin/booking-settings';
```

#### Updated `getAvailableSlots()` Function

**New Parameter:**
- `bookingSettings?: BookingSettings` - Optional settings parameter

**New Features:**
1. **Blocked Date Check** - Returns empty array if date is blocked
2. **Dynamic Advance Notice** - Uses `min_advance_hours` from settings (defaults to 30 min)
3. **Booking Window Validation** - Checks min/max advance restrictions
4. **Buffer Time** - Adds `buffer_minutes` between appointments
5. **Enhanced Conflict Detection** - Includes buffer in conflict calculation

**Before:**
```typescript
export function getAvailableSlots(
  date: string,
  serviceDuration: number,
  existingAppointments: Appointment[],
  businessHours: BusinessHours
): TimeSlot[]
```

**After:**
```typescript
export function getAvailableSlots(
  date: string,
  serviceDuration: number,
  existingAppointments: Appointment[],
  businessHours: BusinessHours,
  bookingSettings?: BookingSettings // NEW - optional for backward compatibility
): TimeSlot[]
```

#### Updated `getDisabledDates()` Function

**New Parameter:**
- `bookingSettings?: BookingSettings` - Optional settings parameter

**New Features:**
1. **Max Advance Days** - Disables dates beyond max_advance_days
2. **Blocked Dates** - Marks specific blocked dates as disabled
3. **Recurring Blocks** - Handles weekly recurring blocked days

**Before:**
```typescript
export function getDisabledDates(
  startDate: Date,
  endDate: Date,
  businessHours: BusinessHours
): string[]
```

**After:**
```typescript
export function getDisabledDates(
  startDate: Date,
  endDate: Date,
  businessHours: BusinessHours,
  bookingSettings?: BookingSettings // NEW - optional
): string[]
```

## Integration Logic

### Blocked Date Detection

```typescript
// Single date block
{ date: "2025-12-25", reason: "Christmas" }

// Date range block
{ date: "2025-07-01", end_date: "2025-07-07", reason: "Vacation" }

// Recurring weekly block (Sunday = 0)
recurring_blocked_days: [0] // Blocks all Sundays
```

### Booking Window Enforcement

```typescript
// Example: 2 hours minimum, 90 days maximum
const settings = {
  min_advance_hours: 2,
  max_advance_days: 90,
  // ...
};

// Slot at 3 PM today (currently 12 PM)
isWithinBookingWindow('2025-12-19', '15:00', 2, 90);
// → { allowed: true }

// Slot at 1 PM today (only 1 hour advance)
isWithinBookingWindow('2025-12-19', '13:00', 2, 90);
// → { allowed: false, reason: 'too_soon' }

// Slot 100 days from now
isWithinBookingWindow('2026-03-29', '10:00', 2, 90);
// → { allowed: false, reason: 'too_far' }
```

### Buffer Time Application

```typescript
// Service: 60 minutes
// Buffer: 15 minutes
// Total slot time: 75 minutes

const bufferMinutes = bookingSettings?.buffer_minutes || 0;
const totalDuration = serviceDuration + bufferMinutes;

// Check if slot fits before closing time
if (slotMinutes + totalDuration > closeMinutes) return false;

// Check for conflicts with buffer included
hasConflict(slotTime, totalDuration, existingAppointments, date);
```

## Backward Compatibility

All changes maintain full backward compatibility:

1. **Optional Parameters** - `bookingSettings` is optional in both functions
2. **Default Behavior** - Without settings, functions work as before
3. **Fallback Values** - Uses sensible defaults (30 min advance, 0 buffer)
4. **No Breaking Changes** - Existing code continues to work unchanged

## Migration Guide

### For Existing Booking Components

#### Before (Current Code)
```typescript
const slots = getAvailableSlots(
  selectedDate,
  serviceDuration,
  appointments,
  businessHours
);
```

#### After (With Settings Integration)
```typescript
import { getBookingSettings } from '@/lib/admin/booking-settings';

// Option 1: Server-side (RSC)
const bookingSettings = await getBookingSettings();
const slots = getAvailableSlots(
  selectedDate,
  serviceDuration,
  appointments,
  businessHours,
  bookingSettings
);

// Option 2: Client-side (fetch settings first)
const [settings, setSettings] = useState<BookingSettings | null>(null);

useEffect(() => {
  getBookingSettings().then(setSettings);
}, []);

const slots = settings
  ? getAvailableSlots(selectedDate, serviceDuration, appointments, businessHours, settings)
  : getAvailableSlots(selectedDate, serviceDuration, appointments, businessHours);
```

### For Calendar Components

#### Before
```typescript
const disabledDates = getDisabledDates(
  startDate,
  endDate,
  businessHours
);
```

#### After
```typescript
import { getBookingSettings } from '@/lib/admin/booking-settings';

const bookingSettings = await getBookingSettings();
const disabledDates = getDisabledDates(
  startDate,
  endDate,
  businessHours,
  bookingSettings
);
```

### Cache Invalidation

When updating booking settings, clear the cache:

```typescript
// In your settings update handler
import { clearBookingSettingsCache } from '@/lib/admin/booking-settings';

async function updateBookingSettings(newSettings: BookingSettings) {
  // Update settings via API
  await fetch('/api/admin/settings/booking', {
    method: 'PUT',
    body: JSON.stringify(newSettings),
  });

  // Clear cache to force fresh fetch
  clearBookingSettingsCache();
}
```

## Testing Checklist

### Unit Tests

- [ ] **isDateBlocked()** function
  - [ ] Single date blocking
  - [ ] Date range blocking
  - [ ] Recurring day blocking
  - [ ] No blocks (returns false)
  - [ ] Multiple overlapping blocks

- [ ] **isWithinBookingWindow()** function
  - [ ] Slots within valid window
  - [ ] Slots too soon (< min_advance_hours)
  - [ ] Slots too far (> max_advance_days)
  - [ ] Edge cases (exactly at boundaries)

- [ ] **getBookingSettings()** caching
  - [ ] First call fetches from API
  - [ ] Second call uses cache
  - [ ] Cache expires after TTL
  - [ ] Error handling for failed API calls

- [ ] **clearBookingSettingsCache()** function
  - [ ] Invalidates cache
  - [ ] Next call fetches fresh data

### Integration Tests

- [ ] **getAvailableSlots()** with settings
  - [ ] Blocked dates return empty slots
  - [ ] Buffer time prevents overlapping bookings
  - [ ] Min advance hours filter today's slots
  - [ ] Max advance days limit future availability
  - [ ] Backward compatibility (no settings provided)

- [ ] **getDisabledDates()** with settings
  - [ ] Past dates disabled
  - [ ] Dates beyond max_advance_days disabled
  - [ ] Specific blocked dates disabled
  - [ ] Recurring blocked days disabled
  - [ ] Closed business days disabled
  - [ ] Backward compatibility (no settings provided)

### End-to-End Tests

- [ ] **Booking flow** with settings enabled
  - [ ] Calendar shows blocked dates as disabled
  - [ ] Time slots respect min advance hours
  - [ ] Cannot book beyond max advance days
  - [ ] Buffer time prevents back-to-back bookings
  - [ ] Recurring blocks apply to all matching days

- [ ] **Admin settings update**
  - [ ] Changing min_advance_hours affects slot availability
  - [ ] Adding blocked date disables that date
  - [ ] Removing blocked date re-enables that date
  - [ ] Cache invalidation works correctly

## Example Usage Scenarios

### Scenario 1: Holiday Closure

**Admin Action:**
```typescript
// Block Christmas week
const blockedDate = {
  date: '2025-12-25',
  end_date: '2025-12-31',
  reason: 'Holiday Closure'
};
```

**Customer Experience:**
- Calendar shows Dec 25-31 as disabled (grayed out)
- No time slots available for those dates
- Booking flow prevents selecting these dates

### Scenario 2: Same-Day Booking Prevention

**Admin Action:**
```typescript
// Require 24 hours advance notice
const settings = {
  min_advance_hours: 24,
  // ...
};
```

**Customer Experience:**
- Today's date is selectable but shows no slots
- Tomorrow's slots appear starting from current time + 24h
- Prevents last-minute bookings that can't be accommodated

### Scenario 3: Buffer Time Between Appointments

**Admin Action:**
```typescript
// 15-minute buffer for cleanup
const settings = {
  buffer_minutes: 15,
  // ...
};
```

**System Behavior:**
- 60-minute service now occupies 75 minutes
- Next available slot is 75 minutes after previous booking
- Prevents overlapping appointments
- Provides time for cleanup and preparation

## API Dependencies

### Required Endpoint
- **GET** `/api/admin/settings/booking`
  - Returns: `{ data: BookingSettings }`
  - Should be accessible without authentication for public booking
  - Or provide a public endpoint: `/api/booking-settings` (read-only)

### Response Format
```typescript
{
  "data": {
    "min_advance_hours": 2,
    "max_advance_days": 90,
    "cancellation_cutoff_hours": 24,
    "buffer_minutes": 15,
    "blocked_dates": [
      {
        "date": "2025-12-25",
        "end_date": null,
        "reason": "Christmas"
      }
    ],
    "recurring_blocked_days": [0], // Sundays
    "business_hours": { /* optional */ }
  }
}
```

## Performance Considerations

1. **Caching Strategy**
   - 60-second cache reduces API calls significantly
   - Settings rarely change, cache hit rate will be high
   - Minimal memory usage (single object)

2. **Blocked Date Lookup**
   - Linear search through blocked dates
   - Acceptable for typical usage (< 50 blocks)
   - For heavy usage, consider indexing by date

3. **Slot Calculation**
   - Settings checked once per date
   - Window validation is O(1) operation
   - Buffer time adds negligible overhead

## Security Considerations

1. **Public Access**
   - Booking settings should be publicly readable
   - No sensitive information in settings
   - Consider rate limiting the settings endpoint

2. **Cache Invalidation**
   - Only admin actions should clear cache
   - Client-side cannot bypass cache
   - Settings updates are admin-only

3. **Validation**
   - All settings validated via Zod schemas
   - Client cannot provide arbitrary settings
   - API endpoint enforces access control

## Future Enhancements

1. **Dynamic Buffer Times**
   - Different buffers for different service types
   - Peak hours vs. off-peak buffers

2. **Capacity Management**
   - Multiple concurrent appointments
   - Staff assignment integration

3. **Smart Suggestions**
   - Suggest alternative dates when blocked
   - Show next available date to customer

4. **Analytics Integration**
   - Track blocked date impact
   - Measure advance booking patterns
   - Optimize buffer times based on data

## Quick Reference: Usage Examples

### Example 1: Basic Integration (Client Component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getBookingSettings } from '@/lib/admin/booking-settings';
import { getAvailableSlots, getDisabledDates } from '@/lib/booking/availability';
import type { BookingSettings } from '@/types/settings';

export function BookingCalendar() {
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    getBookingSettings()
      .then(setSettings)
      .catch(console.error);
  }, []);

  const disabledDates = settings
    ? getDisabledDates(new Date(), futureDate, businessHours, settings)
    : getDisabledDates(new Date(), futureDate, businessHours);

  const slots = selectedDate && settings
    ? getAvailableSlots(selectedDate, duration, appointments, businessHours, settings)
    : [];

  return (
    <div>
      {/* Calendar and time slot UI */}
    </div>
  );
}
```

### Example 2: Server Component Integration

```typescript
// app/booking/page.tsx
import { getBookingSettings } from '@/lib/admin/booking-settings';
import { getDisabledDates } from '@/lib/booking/availability';

export default async function BookingPage() {
  // Fetch settings on server
  const bookingSettings = await getBookingSettings();

  const disabledDates = getDisabledDates(
    new Date(),
    futureDate,
    businessHours,
    bookingSettings
  );

  return (
    <BookingClient
      initialSettings={bookingSettings}
      disabledDates={disabledDates}
    />
  );
}
```

### Example 3: API Route Integration

```typescript
// app/api/availability/route.ts
import { NextResponse } from 'next/server';
import { getBookingSettings } from '@/lib/admin/booking-settings';
import { getAvailableSlots } from '@/lib/booking/availability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const serviceId = searchParams.get('service_id');

  // Fetch settings with caching
  const bookingSettings = await getBookingSettings();

  // Calculate slots with settings applied
  const slots = getAvailableSlots(
    date,
    serviceDuration,
    appointments,
    businessHours,
    bookingSettings // Settings applied here
  );

  return NextResponse.json({ slots });
}
```

### Example 4: Cache Invalidation After Settings Update

```typescript
// In admin settings update handler
import { clearBookingSettingsCache } from '@/lib/admin/booking-settings';

async function handleSaveSettings(newSettings: BookingSettings) {
  // 1. Update settings in database
  const response = await fetch('/api/admin/settings/booking', {
    method: 'PUT',
    body: JSON.stringify(newSettings),
  });

  if (!response.ok) {
    throw new Error('Failed to update settings');
  }

  // 2. Clear cache so next fetch gets fresh data
  clearBookingSettingsCache();

  // 3. Optionally refetch to update UI
  const updatedSettings = await getBookingSettings();
  return updatedSettings;
}
```

## Conclusion

This integration successfully enhances the availability system with administrative controls while maintaining full backward compatibility. The modular design allows for gradual adoption and easy testing.

**Key Benefits:**
- Flexible blocking policies (specific dates + recurring)
- Configurable booking windows (min/max advance)
- Buffer time management for operational efficiency
- Backward compatible (existing code works unchanged)
- Cached for performance
- Well-typed with TypeScript

**Next Steps:**
1. Update booking components to use new parameters
2. Add comprehensive test coverage
3. Deploy settings API endpoint
4. Train admin users on new features
5. Monitor performance and adjust cache TTL if needed

**Files Created:**
- `src/lib/admin/booking-settings.ts` - Booking settings utilities with caching
- `docs/specs/phase-9/task-0190-integration-summary.md` - This documentation

**Files Updated:**
- `src/lib/booking/availability.ts` - Enhanced with booking settings support
