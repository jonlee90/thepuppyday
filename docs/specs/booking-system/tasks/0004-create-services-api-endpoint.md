# Task 4: Create GET /api/services Endpoint

## Description
Create the API route for fetching active grooming services with their size-based pricing information.

## Files to create
- `src/app/api/services/route.ts`

## Requirements References
- Req 2.1: Display all active services with name, description, image, and price range
- Req 2.2: Display the price range with note about size-based pricing

## Implementation Details

### Route: GET /api/services

**Response Format:**
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Basic Grooming",
      "description": "Shampoo, conditioner, nail trimming...",
      "image_url": "/images/basic-grooming.jpg",
      "duration_minutes": 60,
      "is_active": true,
      "display_order": 0,
      "prices": [
        { "id": "uuid", "service_id": "uuid", "size": "small", "price": 40.00 },
        { "id": "uuid", "service_id": "uuid", "size": "medium", "price": 55.00 },
        { "id": "uuid", "service_id": "uuid", "size": "large", "price": 70.00 },
        { "id": "uuid", "service_id": "uuid", "size": "xlarge", "price": 85.00 }
      ]
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

    // Get active services ordered by display_order
    const services = store.select('services', {
      column: 'is_active',
      value: true,
      order: { column: 'display_order', ascending: true }
    });

    // Join prices for each service
    const servicesWithPrices = services.map(service => {
      const prices = store.select('service_prices', {
        column: 'service_id',
        value: service.id
      });
      return { ...service, prices };
    });

    return NextResponse.json({ services: servicesWithPrices });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
```

## Acceptance Criteria
- [ ] Returns active services only (is_active = true)
- [ ] Services sorted by display_order ascending
- [ ] Each service includes prices array with all sizes
- [ ] Returns 200 with services array on success
- [ ] Returns 500 with error message on failure
- [ ] Response matches TypeScript ServiceWithPrices type

## Estimated Complexity
Low

## Phase
Phase 2: API Routes

## Dependencies
- Task 2 (mock data seeded)
