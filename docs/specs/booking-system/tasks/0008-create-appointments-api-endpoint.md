# Task 8: Create POST /api/appointments Endpoint

## Description
Create the API route for creating new appointments. This is the most critical endpoint as it must prevent double-booking through pessimistic locking.

## Files to create
- `src/app/api/appointments/route.ts`

## Requirements References
- Req 6.5: Create appointment record with "pending" status
- Req 6.7: Trigger confirmation email to customer
- Req 14.5: Handle race conditions and prevent double-booking

## Implementation Details

### Route: POST /api/appointments

**Request Body:**
```json
{
  "customer_id": "uuid",
  "pet_id": "uuid",
  "service_id": "uuid",
  "scheduled_at": "2025-12-15T10:00:00Z",
  "duration_minutes": 60,
  "addon_ids": ["uuid1", "uuid2"],
  "total_price": 95.00,
  "notes": "First time customer",
  "guest_info": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567"
  }
}
```

**Response Format (Success):**
```json
{
  "success": true,
  "appointment_id": "uuid",
  "reference": "APT-2025-001234",
  "scheduled_at": "2025-12-15T10:00:00Z"
}
```

**Response Format (Conflict):**
```json
{
  "error": "Time slot no longer available",
  "code": "SLOT_CONFLICT"
}
```

**Business Logic:**
1. Validate request body with Zod schema
2. If guest_info provided, create or retrieve guest user
3. Verify time slot is still available (pessimistic locking)
4. Create appointment record with status "pending"
5. Create appointment_addon records for selected add-ons
6. Generate booking reference number (APT-YYYY-NNNNNN)
7. (Future: Send confirmation email)
8. Return success with appointment details

**Pessimistic Locking (Mock Implementation):**
```typescript
// In mock mode, use in-memory check
const conflictingAppointments = store.select('appointments', {
  column: 'scheduled_at',
  value: scheduledAt
}).filter(a => !['cancelled', 'no_show'].includes(a.status));

if (conflictingAppointments.length >= MAX_CONCURRENT_APPOINTMENTS) {
  return NextResponse.json(
    { error: 'Time slot no longer available', code: 'SLOT_CONFLICT' },
    { status: 409 }
  );
}
```

**Reference Number Generation:**
```typescript
function generateReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `APT-${year}-${random}`;
}
```

## Acceptance Criteria
- [ ] Validates all required fields (customer_id, pet_id, service_id, scheduled_at, duration_minutes, total_price)
- [ ] Returns 400 for validation errors
- [ ] Creates guest user if guest_info provided
- [ ] Checks for slot conflicts before creating appointment
- [ ] Returns 409 with SLOT_CONFLICT code if time slot taken
- [ ] Creates appointment record with status "pending"
- [ ] Creates appointment_addon records for each addon
- [ ] Generates unique booking reference number
- [ ] Returns success response with appointment_id and reference

## Estimated Complexity
High

## Phase
Phase 2: API Routes

## Dependencies
- Task 1 (validation schemas)
- Task 2 (mock data)
- Task 10 (guest user endpoint - for guest booking flow)
