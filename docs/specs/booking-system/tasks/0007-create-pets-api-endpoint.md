# Task 7: Create GET/POST /api/pets Endpoints

## Description
Create API routes for fetching user's pets and creating new pet profiles during the booking flow.

## Files to create
- `src/app/api/pets/route.ts`

## Requirements References
- Req 3.1: Display user's existing active pets
- Req 3.3: Display pet creation form for new pets
- Req 3.4: Require name, size; optionally breed and weight
- Req 3.5: Associate pet with authenticated user or booking record for guests

## Implementation Details

### Route: GET /api/pets

**Authentication:** Required (returns 401 if not authenticated)

**Response Format:**
```json
{
  "pets": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Max",
      "size": "medium",
      "breed_id": "uuid",
      "breed_custom": null,
      "weight": 25.5,
      "photo_url": "/images/max.jpg",
      "is_active": true,
      "notes": "Very friendly"
    }
  ]
}
```

### Route: POST /api/pets

**Authentication:** Required (or guest user ID in request body)

**Request Body:**
```json
{
  "name": "Buddy",
  "size": "large",
  "breed_id": "uuid-or-null",
  "breed_custom": "Golden Retriever Mix",
  "weight": 55.0,
  "notes": "First time grooming"
}
```

**Response Format:**
```json
{
  "pet": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Buddy",
    "size": "large",
    "created_at": "2025-12-10T10:00:00Z"
  }
}
```

**Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { petFormSchema } from '@/lib/booking/validation';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user (from mock auth or session)
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = getMockStore();
    const pets = store.select('pets', {
      column: 'owner_id',
      value: userId,
      // Additional filter for is_active = true
    }).filter(p => p.is_active);

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = petFormSchema.parse(body);

    // Get authenticated user or require owner_id in body
    const userId = await getAuthenticatedUserId(req) || body.owner_id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = getMockStore();
    const pet = {
      id: uuidv4(),
      owner_id: userId,
      ...validated,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.insert('pets', pet);

    return NextResponse.json({ pet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating pet:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [x] GET returns only authenticated user's active pets
- [x] GET returns 401 for unauthenticated requests
- [x] POST validates required fields (name, size)
- [x] POST validates size is valid enum value
- [x] POST creates pet associated with authenticated user
- [x] POST returns 400 for validation errors
- [x] POST returns 401 for unauthenticated requests without owner_id
- [x] Response matches TypeScript Pet type

## Status
✅ **COMPLETED** - Implemented in commit 1b00eca
- Added authorization check to prevent users from creating pets for others (403 Forbidden)

## Estimated Complexity
Medium

## Phase
Phase 2: API Routes

## Dependencies
- Task 1 (validation schemas)
- Task 2 (mock data)
