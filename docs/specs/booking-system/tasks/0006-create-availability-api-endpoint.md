# Task 6: Create GET /api/availability Endpoint

## Description
Create the API route for calculating and returning available time slots for a specific date and service. This is a critical endpoint that prevents double-booking by checking existing appointments.

## Files to create
- `src/app/api/availability/route.ts`

## Requirements References
- Req 4.2: Display available time slots for selected date
- Req 4.3: Show slots in 30-minute increments during business hours
- Req 4.6: Only display slots within that day's operating hours
- Req 4.9: Ensure slots don't overlap with existing appointments
- Req 14.1: Exclude times with existing confirmed appointments
- Req 14.2: Block appropriate number of slots for appointment duration
- Req 14.3: Only show times within business hours for that day

## Implementation Details

### Route: GET /api/availability

**Query Parameters:**
- `date` (required): YYYY-MM-DD format
- `service_id` (required): UUID of the service

**Response Format:**
```json
{
  "date": "2025-12-15",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": true },
    { "time": "10:00", "available": false, "waitlistCount": 2 },
    { "time": "10:30", "available": false, "waitlistCount": 0 }
  ]
}
```

**Business Logic:**
1. Validate date format and service_id
2. Get business hours for the date's day of week
3. If business is closed that day, return empty slots array
4. Generate 30-minute time slots between open and close times
5. Query existing appointments for that date (not cancelled/no_show)
6. For each slot, check if it conflicts with existing appointments
7. Consider appointment duration when checking conflicts
8. Filter out past slots if date is today
9. Query waitlist entries to include waitlist count for unavailable slots

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { generateTimeSlots, hasConflict, filterPastSlots } from '@/lib/booking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');

    // Validate parameters
    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date and service_id' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const store = getMockStore();

    // Get service to check duration
    const services = store.select('services', { column: 'id', value: serviceId });
    if (services.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    const service = services[0];

    // Get business hours from settings
    const settings = store.select('settings', { column: 'key', value: 'business_hours' });
    const businessHours = settings[0]?.value || DEFAULT_BUSINESS_HOURS;

    // Generate slots and check availability
    // ... implementation using utility functions

    return NextResponse.json({ date, slots });
  } catch (error) {
    console.error('Error calculating availability:', error);
    return NextResponse.json(
      { error: 'Failed to calculate availability' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [ ] Validates date format (YYYY-MM-DD)
- [ ] Validates service_id exists
- [ ] Returns 400 for missing or invalid parameters
- [ ] Returns 404 for non-existent service
- [ ] Returns empty slots array for closed days
- [ ] Generates 30-minute interval slots
- [ ] Correctly identifies conflicting appointments
- [ ] Considers appointment duration for conflicts
- [ ] Filters past slots when date is today
- [ ] Includes waitlist count for unavailable slots
- [ ] Returns 200 with date and slots array on success

## Estimated Complexity
High

## Phase
Phase 2: API Routes

## Dependencies
- Task 1 (availability utility functions)
- Task 2 (mock data with business hours)
