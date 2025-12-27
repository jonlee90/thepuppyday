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
Create appointment manually (admin-created or walk-in).

**Body**: Same as public appointment creation, plus:
```json
{
  "internal_notes": "Admin-only notes",
  "bypass_availability": true,
  "source": "manual_admin" | "walk_in", // Creation method
  "payment_status": "pending" | "paid" | "partially_paid",
  "payment_details": {
    "amount_paid": 50.00,
    "payment_method": "cash" | "card" | "check" | "venmo" | "zelle" | "other"
  }
}
```

**Walk-In Appointments**:
- Set `source: 'walk_in'` to mark as walk-in customer
- `scheduled_at` defaults to current time rounded to next slot
- Email is optional (phone required for SMS contact)
- Can create customer and pet inline during appointment creation

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

### Admin Settings Endpoints ✅

#### Site Content Management

**`GET /api/admin/settings/site-content`**
Retrieve homepage and SEO content settings.

**`PUT /api/admin/settings/site-content`**
Update site content.

**Body**:
```json
{
  "hero_headline": "Professional Dog Grooming",
  "hero_subheadline": "Making your pup look their best",
  "hero_cta_text": "Book Now",
  "hero_image_url": "https://...",
  "seo_title": "Puppy Day - Dog Grooming La Mirada",
  "seo_description": "Professional dog grooming services...",
  "seo_keywords": "dog grooming, pet grooming, la mirada",
  "business_name": "Puppy Day",
  "business_address": "14936 Leffingwell Rd, La Mirada, CA 90638",
  "business_phone": "(657) 252-2903",
  "business_email": "puppyday14936@gmail.com"
}
```

**`POST /api/admin/settings/site-content/upload`**
Upload hero background images.

---

#### Promo Banner Management

**`GET /api/admin/settings/banners`**
List all promotional banners.

**`POST /api/admin/settings/banners`**
Create new banner.

**Body**:
```json
{
  "title": "Holiday Special",
  "description": "20% off all services",
  "image_url": "https://...",
  "cta_text": "Book Now",
  "cta_link": "/book",
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "is_active": true
}
```

**`PUT /api/admin/settings/banners/[id]`**
Update banner.

**`DELETE /api/admin/settings/banners/[id]`**
Delete banner.

**`PUT /api/admin/settings/banners/reorder`**
Reorder banners via drag-and-drop.

**Body**:
```json
{
  "banner_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**`POST /api/admin/settings/banners/upload`**
Upload banner images.

**`GET /api/admin/settings/banners/[id]/analytics`**
Get click analytics for specific banner.

---

#### Booking Settings

**`GET /api/admin/settings/booking`**
Get booking configuration.

**`PUT /api/admin/settings/booking`**
Update booking settings.

**Body**:
```json
{
  "advance_booking_days": 30,
  "cancellation_hours": 24,
  "buffer_time_minutes": 15,
  "max_concurrent_appointments": 3,
  "default_service_duration": 60
}
```

**`GET /api/admin/settings/booking/blocked-dates`**
List blocked dates (holidays, closures).

**`POST /api/admin/settings/booking/blocked-dates`**
Add blocked date.

**Body**:
```json
{
  "date": "2025-12-25",
  "reason": "Christmas",
  "is_recurring": false,
  "recurrence_pattern": "yearly" | "monthly" | "weekly"
}
```

**`DELETE /api/admin/settings/booking/blocked-dates/[id]`**
Remove blocked date.

---

#### Business Hours

**`GET /api/admin/settings/business-hours`**
Get operating hours for all days.

**`PUT /api/admin/settings/business-hours`**
Update business hours.

**Body**:
```json
{
  "monday": { "open": "09:00", "close": "17:00", "is_closed": false },
  "tuesday": { "open": "09:00", "close": "17:00", "is_closed": false },
  "sunday": { "is_closed": true }
}
```

---

#### Loyalty Program Settings

**`GET /api/admin/settings/loyalty`**
Get loyalty program configuration.

**`PUT /api/admin/settings/loyalty`**
Update loyalty settings.

**`GET /api/admin/settings/loyalty/earning-rules`**
Get points earning rules.

**`PUT /api/admin/settings/loyalty/earning-rules`**
Update earning rules.

**Body**:
```json
{
  "points_per_dollar": 10,
  "birthday_bonus": 500,
  "eligible_services": ["uuid1", "uuid2"]
}
```

**`GET /api/admin/settings/loyalty/redemption-rules`**
Get redemption rules.

**`PUT /api/admin/settings/loyalty/redemption-rules`**
Update redemption rules.

**Body**:
```json
{
  "min_points_redemption": 100,
  "point_value_dollars": 0.01,
  "max_discount_percentage": 50
}
```

**`GET /api/admin/settings/loyalty/referral`**
Get referral program settings.

**`PUT /api/admin/settings/loyalty/referral`**
Update referral program.

**Body**:
```json
{
  "referrer_reward": 500,
  "referred_discount": 10.00,
  "min_purchase_for_reward": 50.00
}
```

---

#### Staff Management

**`GET /api/admin/settings/staff`**
List all staff members.

**`POST /api/admin/settings/staff`**
Create new staff member.

**Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "phone": "(555) 123-4567",
  "role": "groomer",
  "hire_date": "2025-01-01",
  "is_active": true
}
```

**`GET /api/admin/settings/staff/[id]`**
Get staff details.

**`PUT /api/admin/settings/staff/[id]`**
Update staff member.

**`DELETE /api/admin/settings/staff/[id]`**
Remove staff member.

**`GET /api/admin/settings/staff/[id]/commission`**
Get commission settings for staff.

**`PUT /api/admin/settings/staff/[id]/commission`**
Update commission settings.

**Body**:
```json
{
  "commission_type": "percentage",
  "commission_rate": 40,
  "applies_to_services": ["uuid1", "uuid2"]
}
```

**`GET /api/admin/settings/staff/earnings`**
Get earnings report.

**Query Params**:
- `staff_id`: Filter by staff member
- `start_date`: Report start date
- `end_date`: Report end date

**Response**:
```json
{
  "staff_id": "uuid",
  "total_services": 45,
  "total_revenue": 2500.00,
  "total_commission": 1000.00,
  "breakdown_by_service": [
    {
      "service_name": "Basic Grooming",
      "count": 30,
      "revenue": 1800.00,
      "commission": 720.00
    }
  ]
}
```

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

### Calendar Error Recovery (Phase 11) ✅

#### `GET /api/admin/calendar/quota`
Get current API quota status.

**Response**:
```json
{
  "date": "2025-12-26",
  "request_count": 450000,
  "daily_limit": 1000000,
  "warning_threshold": 80,
  "percentage_used": 45,
  "is_warning": false,
  "requests_remaining": 550000
}
```

#### `GET /api/admin/calendar/sync/errors`
List failed calendar sync operations with filters.

**Query Params**:
- `error_type`: Filter by error classification (optional)
- `operation_type`: Filter by operation (create, update, delete)
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "errors": [
    {
      "id": "uuid",
      "operation_type": "create",
      "appointment_id": "uuid",
      "error_type": "auth_error",
      "error_message": "Token expired",
      "retry_count": 2,
      "max_retries": 3,
      "next_retry_at": "2025-12-26T15:30:00Z",
      "created_at": "2025-12-26T14:00:00Z"
    }
  ],
  "total": 15,
  "has_more": false
}
```

**Security Note**: Input validation on `error_type` to prevent SQL injection.

#### `POST /api/admin/calendar/sync/retry`
Retry failed sync operations (individual or batch).

**Body**:
```json
{
  "retry_ids": ["uuid1", "uuid2"],  // Optional: specific retry entries
  "retry_all": false                // Optional: retry all pending
}
```

**Response**:
```json
{
  "retried_count": 2,
  "succeeded": 1,
  "failed": 1,
  "errors": [
    {
      "retry_id": "uuid2",
      "error": "Still failing: Token expired"
    }
  ]
}
```

**Security**: CSRF protection via Server Actions wrapper.

#### `POST /api/admin/calendar/sync/resync`
Force resync appointments (delete + recreate in Google Calendar).

**Body**:
```json
{
  "appointment_ids": ["uuid1", "uuid2"]
}
```

**Response**:
```json
{
  "resynced_count": 2,
  "succeeded": 2,
  "failed": 0
}
```

**Security**: Admin-only, validates appointment ownership.

#### `POST /api/admin/calendar/connection/resume`
Resume auto-sync for paused calendar connection.

**Body**:
```json
{
  "connection_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Auto-sync resumed successfully",
  "consecutive_failures_reset": true
}
```

**Security**: CSRF-protected Server Action.

#### `GET /api/admin/calendar/sync/queue-stats`
Get retry queue statistics.

**Response**:
```json
{
  "total_pending": 15,
  "by_operation": {
    "create": 8,
    "update": 5,
    "delete": 2
  },
  "by_error_type": {
    "auth_error": 7,
    "quota_exceeded": 3,
    "network_error": 5
  },
  "avg_retry_count": 1.8,
  "oldest_entry": "2025-12-20T10:00:00Z"
}
```

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

**Last Updated**: 2025-12-26
