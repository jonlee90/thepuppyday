# API Routes - Architecture Documentation

> **Module**: API Routes
> **Status**: ✅ Core Complete, 🚧 Some endpoints pending
> **Base Path**: `/api/`
> **Framework**: Next.js 14+ App Router API Routes

## Overview

RESTful API endpoints organized by domain. All routes follow consistent patterns for authentication, validation, error handling, and response formats.

---

## API Organization

```
src/app/api/
├── admin/                   # Admin-only endpoints (protected)
│   ├── appointments/
│   ├── customers/
│   ├── services/
│   ├── addons/
│   ├── gallery/
│   ├── analytics/
│   ├── notifications/
│   └── settings/
├── customer/                # Customer endpoints (session-auth)
│   └── preferences/
├── appointments/            # Public appointment endpoints
├── availability/            # Public availability checking
├── services/                # Public service listing
├── addons/                  # Public addon listing
├── pets/                    # Public pet creation (guest booking)
├── waitlist/                # Public waitlist submission
├── unsubscribe/             # Public unsubscribe handler
├── cron/                    # Scheduled job handlers
└── webhooks/                # External service webhooks (Stripe)
```

---

## API Patterns

### Route Handler Structure

**Standard Pattern**:
```typescript
// route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

// GET handler
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Authentication check (if needed)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');

    // Business logic
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .range((page - 1) * 25, page * 25 - 1);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validation
    const schema = z.object({
      field: z.string().min(1),
    });
    const validatedData = schema.parse(body);

    // Business logic
    const { data, error } = await supabase
      .from('table')
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Authentication Patterns

### 1. Public Endpoints
No authentication required (services, availability).

```typescript
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true);

  return NextResponse.json({ data });
}
```

### 2. Customer Endpoints
Session-based authentication required.

```typescript
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with user-specific logic
}
```

### 3. Admin Endpoints
Admin/groomer role required.

```typescript
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, role } = await requireAdmin(supabase); // Throws if not admin/groomer

  // Admin-only logic
}
```

### 4. Owner-Only Endpoints
Admin role required (not groomer).

```typescript
import { requireOwner } from '@/lib/admin/auth';

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, role } = await requireOwner(supabase); // Throws if not admin

  // Owner-only logic (sensitive operations)
}
```

---

## Key Endpoints

### Public Endpoints

#### `GET /api/services`
Fetch active grooming services with size-based pricing.

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Basic Grooming",
      "description": "...",
      "duration_minutes": 60,
      "prices": [
        { "size": "small", "price": 40.00 },
        { "size": "medium", "price": 55.00 },
        { "size": "large", "price": 70.00 },
        { "size": "xlarge", "price": 85.00 }
      ]
    }
  ]
}
```

#### `GET /api/addons`
Fetch active add-on services.

#### `GET /api/availability?date=2025-01-15&service_id=xxx`
Check appointment availability for a specific date and service.

**Query Params**:
- `date`: ISO date string (YYYY-MM-DD)
- `service_id`: Service UUID

**Response**:
```json
{
  "available_slots": [
    "09:00", "10:00", "11:00", "14:00", "15:00"
  ],
  "booked_slots": [
    "13:00", "16:00"
  ]
}
```

#### `POST /api/appointments`
Create new appointment (customer booking).

**Body**:
```json
{
  "customer_id": "uuid",
  "pet_id": "uuid",
  "service_id": "uuid",
  "scheduled_at": "2025-01-15T10:00:00Z",
  "addon_ids": ["uuid1", "uuid2"],
  "notes": "Special instructions"
}
```

#### `POST /api/waitlist`
Add customer to waitlist for fully-booked slot.

**Body**:
```json
{
  "customer_id": "uuid",
  "pet_id": "uuid",
  "service_id": "uuid",
  "preferred_date": "2025-01-15",
  "time_preference": "morning"
}
```

---

### Admin Endpoints

#### `GET /api/admin/appointments`
List appointments with filters and pagination.

**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 25)
- `status`: Filter by status
- `service`: Filter by service ID
- `dateFrom`, `dateTo`: Date range filter
- `search`: Customer name or pet name search
- `sortBy`: Column to sort (default: scheduled_at)
- `sortOrder`: asc or desc (default: asc)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "customer": { "first_name": "John", "last_name": "Doe" },
      "pet": { "name": "Buddy", "size": "medium" },
      "service": { "name": "Basic Grooming" },
      "scheduled_at": "2025-01-15T10:00:00Z",
      "status": "confirmed",
      "total_price": 65.00
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

#### `POST /api/admin/appointments`
Create appointment manually (admin-created).

**Body**: Same as public appointment creation, plus:
```json
{
  "internal_notes": "Admin-only notes",
  "bypass_availability": true
}
```

#### `POST /api/admin/appointments/import`
Bulk import appointments from CSV.

**Request**: `multipart/form-data` with CSV file

**Response**:
```json
{
  "imported": 45,
  "errors": [
    {
      "row": 12,
      "email": "invalid@email",
      "error": "Invalid email format"
    }
  ],
  "customers_created": 10,
  "activation_emails_sent": 10
}
```

#### `GET /api/admin/customers`
List all customers with search and filters.

#### `GET /api/admin/customers/[id]`
Get customer profile with full details.

#### `PUT /api/admin/customers/[id]`
Update customer information.

#### `GET /api/admin/notifications/log`
Fetch notification delivery log.

**Query Params**:
- `page`, `limit`: Pagination
- `channel`: email or sms
- `status`: sent, failed, pending
- `type`: Notification type
- `dateFrom`, `dateTo`: Date range
- `customer_id`: Filter by customer

---

### Customer Endpoints

#### `GET /api/customer/preferences/notifications`
Get customer's notification preferences.

**Response**:
```json
{
  "marketing_enabled": true,
  "email_appointment_reminders": true,
  "sms_appointment_reminders": false,
  "email_retention_reminders": true,
  "sms_retention_reminders": false
}
```

#### `PUT /api/customer/preferences/notifications`
Update notification preferences.

**Body** (all fields optional):
```json
{
  "marketing_enabled": false,
  "email_appointment_reminders": true
}
```

---

### Special Endpoints

#### `GET /api/unsubscribe?token=xxx`
Process unsubscribe request via token.

**Flow**:
1. Validate token (signature, expiration)
2. Decode payload (userId, notificationType, channel)
3. Update user preferences
4. Log unsubscribe action
5. Redirect to success/error page

#### `POST /api/cron/reminder-notifications`
Scheduled job to send appointment reminders.

**Auth**: Vercel Cron Secret header

**Flow**:
1. Find appointments in next 24 hours
2. Send reminders via notification service
3. Log results

#### `POST /api/webhooks/stripe`
Handle Stripe webhook events (Phase 7).

**Events**:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `charge.refunded`

**Flow**:
1. Verify webhook signature
2. Parse event type
3. Update payment/appointment status
4. Send confirmation notifications

---

## Validation

**Zod Schemas** for all mutations:

```typescript
// Appointment creation
const createAppointmentSchema = z.object({
  customer_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  addon_ids: z.array(z.string().uuid()).optional(),
  notes: z.string().max(500).optional(),
});

// Pet creation
const createPetSchema = z.object({
  owner_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  breed_id: z.string().uuid().optional(),
  breed_custom: z.string().max(100).optional(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().optional(),
  birth_date: z.string().optional(),
  medical_info: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});
```

---

## Error Handling

**Standard Error Response**:
```json
{
  "error": "Error message",
  "details": { /* Optional additional info */ }
}
```

**HTTP Status Codes**:
- `200`: Success (GET, PUT, DELETE)
- `201`: Created (POST)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (authenticated but wrong role)
- `404`: Not Found
- `500`: Internal Server Error

**Validation Error Example**:
```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

---

## Rate Limiting

**Phase 9 Enhancement**:
```typescript
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(ip, { max: 10, window: 60 });

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Proceed with request
}
```

---

## CORS

**Configuration** (if needed for external clients):
```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## Testing

### Integration Tests

```typescript
import { POST } from '@/app/api/appointments/route';

describe('POST /api/appointments', () => {
  it('creates appointment with valid data', async () => {
    const request = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: 'uuid',
        pet_id: 'uuid',
        service_id: 'uuid',
        scheduled_at: '2025-01-15T10:00:00Z',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.id).toBeDefined();
  });

  it('returns 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

---

## Related Documentation

- [Admin Auth Helper](../services/admin-auth.md)
- [Validation Schemas](../validation/schemas.md)
- [Supabase Client](../services/supabase.md)

---

**Last Updated**: 2025-12-20
