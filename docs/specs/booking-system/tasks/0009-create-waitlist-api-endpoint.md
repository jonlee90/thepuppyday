# Task 9: Create POST /api/waitlist Endpoint

## Description
Create the API route for adding customers to the waitlist when their preferred time slot is fully booked.

## Files to create
- `src/app/api/waitlist/route.ts`

## Requirements References
- Req 9.2: Create waitlist entry with selected date and time preference
- Req 9.5: Inform user instead of creating duplicate if already on waitlist for same date
- Req 9.6: Allow user to specify time preference (morning, afternoon, any)

## Implementation Details

### Route: POST /api/waitlist

**Request Body:**
```json
{
  "customer_id": "uuid",
  "pet_id": "uuid",
  "service_id": "uuid",
  "requested_date": "2025-12-15",
  "time_preference": "morning"
}
```

**Response Format (Success):**
```json
{
  "success": true,
  "waitlist_id": "uuid",
  "position": 3
}
```

**Response Format (Already on waitlist):**
```json
{
  "error": "Already on waitlist for this date",
  "code": "DUPLICATE_ENTRY",
  "existing_entry": {
    "waitlist_id": "uuid",
    "time_preference": "morning"
  }
}
```

**Business Logic:**
1. Validate request body
2. Check if customer already has an active waitlist entry for the same date
3. If duplicate found, return 409 with existing entry info
4. Create waitlist entry with status "active"
5. Calculate position in queue for that date
6. Return success with waitlist_id and position

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const waitlistSchema = z.object({
  customer_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  service_id: z.string().uuid(),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_preference: z.enum(['morning', 'afternoon', 'any']).default('any'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = waitlistSchema.parse(body);

    const store = getMockStore();

    // Check for existing active entry for same customer/date
    const existingEntries = store.select('waitlist', {
      column: 'customer_id',
      value: validated.customer_id,
    }).filter(w =>
      w.requested_date === validated.requested_date &&
      w.status === 'active'
    );

    if (existingEntries.length > 0) {
      return NextResponse.json({
        error: 'Already on waitlist for this date',
        code: 'DUPLICATE_ENTRY',
        existing_entry: {
          waitlist_id: existingEntries[0].id,
          time_preference: existingEntries[0].time_preference,
        }
      }, { status: 409 });
    }

    // Create waitlist entry
    const entry = {
      id: uuidv4(),
      ...validated,
      status: 'active',
      notified_at: null,
      created_at: new Date().toISOString(),
    };
    store.insert('waitlist', entry);

    // Calculate position (count active entries for this date)
    const position = store.select('waitlist', {
      column: 'requested_date',
      value: validated.requested_date,
    }).filter(w => w.status === 'active').length;

    return NextResponse.json({
      success: true,
      waitlist_id: entry.id,
      position,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [ ] Validates all required fields
- [ ] Validates time_preference is valid enum value
- [ ] Validates date format (YYYY-MM-DD)
- [ ] Returns 400 for validation errors
- [ ] Detects existing active waitlist entry for same customer/date
- [ ] Returns 409 with DUPLICATE_ENTRY code if already on waitlist
- [ ] Creates waitlist entry with status "active"
- [ ] Returns position in queue for that date
- [ ] Returns success response with waitlist_id and position

## Estimated Complexity
Medium

## Phase
Phase 2: API Routes

## Dependencies
- Task 2 (mock data structure for waitlist table)
