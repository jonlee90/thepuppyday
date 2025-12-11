# Task 5: Create GET /api/addons Endpoint

## Description
Create the API route for fetching active add-on services with their upsell information.

## Files to create
- `src/app/api/addons/route.ts`

## Requirements References
- Req 5.1: Display all active add-ons with name, description, and price
- Req 5.2: Highlight breed-specific upsells with upsell_prompt message

## Implementation Details

### Route: GET /api/addons

**Response Format:**
```json
{
  "addons": [
    {
      "id": "uuid",
      "name": "Teeth Brushing",
      "description": "Professional dental cleaning for fresh breath",
      "price": 10.00,
      "upsell_prompt": "Recommended for breeds prone to dental issues",
      "upsell_breeds": ["poodle-id", "chihuahua-id"],
      "is_active": true,
      "display_order": 0
    }
  ]
}
```

**Implementation:**
```typescript
import { NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';

export async function GET() {
  try {
    const store = getMockStore();

    // Get active addons ordered by display_order
    const addons = store.select('addons', {
      column: 'is_active',
      value: true,
      order: { column: 'display_order', ascending: true }
    });

    return NextResponse.json({ addons });
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [x] Returns active add-ons only (is_active = true)
- [x] Add-ons sorted by display_order ascending
- [x] Each add-on includes upsell_prompt and upsell_breeds fields
- [x] Returns 200 with addons array on success
- [x] Returns 500 with error message on failure
- [x] Response matches TypeScript Addon type

## Status
✅ **COMPLETED** - Implemented in commit 1b00eca

## Estimated Complexity
Low

## Phase
Phase 2: API Routes

## Dependencies
- Task 2 (mock data seeded)
