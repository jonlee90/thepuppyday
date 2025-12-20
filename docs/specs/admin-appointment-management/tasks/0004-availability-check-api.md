# Task 0004: Availability Check API

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0001, 0002
**Estimated Effort**: 2 hours

## Objective

Create API endpoint for checking time slot availability for manual appointment creation.

## Requirements

- REQ-6.1: Date selection with business hours enforcement
- REQ-6.2: Time slot availability checking
- REQ-6.4: Booked slots marked unavailable
- REQ-6.5: Sundays marked as closed
- REQ-6.8: Real-time availability status

## Implementation Details

### Files to Create

**`src/app/api/admin/appointments/availability/route.ts`**

**Note**: Leverage existing `src/lib/booking/availability.ts` utilities

Implement GET endpoint:
```typescript
import { getAvailableSlots, hasConflict } from '@/lib/booking/availability';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // YYYY-MM-DD
  const duration = parseInt(searchParams.get('duration_minutes') || '60');

  // Validate date
  if (!date) {
    return NextResponse.json({ error: 'Date required' }, { status: 400 });
  }

  const appointmentDate = new Date(date);

  // Check if Sunday (closed)
  if (appointmentDate.getDay() === 0) {
    return NextResponse.json({
      available: false,
      reason: 'Closed on Sundays',
      slots: [],
    });
  }

  // Use existing getAvailableSlots utility
  const timeSlots = await getAvailableSlots(date, duration);

  // Check existing appointments for conflicts
  const existingAppointments = await getAppointmentsForDate(date);

  // Build slots with availability status
  const slotsWithStatus = timeSlots.map((slot) => {
    const conflicts = existingAppointments.filter((apt) =>
      hasConflict(slot.start, slot.end, apt.time, apt.duration_minutes)
    );

    const maxConcurrent = 3; // Configurable
    const isAvailable = conflicts.length < maxConcurrent;

    return {
      time: slot.start, // HH:mm format
      available: isAvailable,
      booked_count: conflicts.length,
      max_concurrent: maxConcurrent,
    };
  });

  return NextResponse.json({
    date,
    slots: slotsWithStatus,
    business_hours: { open: '09:00', close: '17:00' },
  });
}
```

### Existing Utilities to Use

From `src/lib/booking/availability.ts`:
- `getAvailableSlots(date, duration)` - Generate time slots within business hours
- `hasConflict(start1, end1, start2, duration2)` - Check if two appointments conflict
- `isDateAvailable(date)` - Check if date is available (not Sunday, not past)

## Acceptance Criteria

- [ ] GET endpoint returns time slots for valid date
- [ ] Business hours (9am-5pm Mon-Sat) enforced
- [ ] Sundays return closed status with empty slots
- [ ] Each slot includes availability status
- [ ] Booked count shown per slot
- [ ] Fully booked slots (≥ max concurrent) marked unavailable
- [ ] Returns proper error for missing date parameter
- [ ] Leverages existing availability utilities

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-6)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1)
- **Existing Utilities**: src/lib/booking/availability.ts
