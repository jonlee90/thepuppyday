# Task 27: Write Integration Tests for API Routes

## Description
Create integration tests for the booking API routes, testing appointment creation, conflict handling, and validation.

## Files to create
- `src/app/api/__tests__/services.test.ts`
- `src/app/api/__tests__/appointments.test.ts`
- `src/app/api/__tests__/waitlist.test.ts`

## Requirements References
- Req 6.5: Create appointment record with "pending" status
- Req 14.5: Handle race conditions and prevent double-booking

## Implementation Details

### Test Setup
```typescript
// test-utils/api-test-helpers.ts
import { NextRequest } from 'next/server';

export function createMockRequest(
  method: string,
  url: string,
  body?: object
): NextRequest {
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return request;
}

export function createAuthenticatedRequest(
  method: string,
  url: string,
  userId: string,
  body?: object
): NextRequest {
  const request = createMockRequest(method, url, body);
  // Add auth headers/cookies based on your auth implementation
  return request;
}
```

### services.test.ts
```typescript
import { GET } from '../services/route';
import { getMockStore } from '@/mocks/supabase/store';

describe('GET /api/services', () => {
  beforeEach(() => {
    // Reset mock store
    getMockStore().reset();
    // Seed test data
    seedTestServices();
  });

  it('returns active services with prices', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.services).toHaveLength(2); // Basic and Premium
    expect(data.services[0]).toHaveProperty('prices');
    expect(data.services[0].prices).toHaveLength(4); // 4 sizes
  });

  it('returns services sorted by display_order', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.services[0].display_order).toBeLessThan(
      data.services[1].display_order
    );
  });

  it('excludes inactive services', async () => {
    const store = getMockStore();
    store.insert('services', {
      id: 'inactive-service',
      name: 'Inactive',
      is_active: false,
    });

    const response = await GET();
    const data = await response.json();

    const inactiveService = data.services.find(
      (s: any) => s.id === 'inactive-service'
    );
    expect(inactiveService).toBeUndefined();
  });
});
```

### appointments.test.ts
```typescript
import { POST } from '../appointments/route';
import { createMockRequest } from '@/test-utils/api-test-helpers';
import { getMockStore } from '@/mocks/supabase/store';

describe('POST /api/appointments', () => {
  beforeEach(() => {
    getMockStore().reset();
    seedTestData();
  });

  const validAppointmentData = {
    customer_id: 'customer-1',
    pet_id: 'pet-1',
    service_id: 'service-1',
    scheduled_at: '2025-12-15T10:00:00Z',
    duration_minutes: 60,
    addon_ids: ['addon-1'],
    total_price: 65.00,
  };

  it('creates appointment with valid data', async () => {
    const request = createMockRequest('POST', '/api/appointments', validAppointmentData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.appointment_id).toBeDefined();
    expect(data.reference).toMatch(/^APT-\d{4}-\d{6}$/);
  });

  it('returns 400 for missing required fields', async () => {
    const invalidData = { customer_id: 'customer-1' }; // Missing other fields
    const request = createMockRequest('POST', '/api/appointments', invalidData);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 409 for conflicting time slot', async () => {
    // Create existing appointment
    const store = getMockStore();
    store.insert('appointments', {
      id: 'existing-appt',
      scheduled_at: '2025-12-15T10:00:00Z',
      duration_minutes: 60,
      status: 'confirmed',
    });

    const request = createMockRequest('POST', '/api/appointments', validAppointmentData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe('SLOT_CONFLICT');
  });

  it('allows booking when existing appointment is cancelled', async () => {
    const store = getMockStore();
    store.insert('appointments', {
      id: 'cancelled-appt',
      scheduled_at: '2025-12-15T10:00:00Z',
      duration_minutes: 60,
      status: 'cancelled',
    });

    const request = createMockRequest('POST', '/api/appointments', validAppointmentData);
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('creates appointment_addon records for selected addons', async () => {
    const request = createMockRequest('POST', '/api/appointments', validAppointmentData);
    const response = await POST(request);
    const data = await response.json();

    const store = getMockStore();
    const appointmentAddons = store.select('appointment_addons', {
      column: 'appointment_id',
      value: data.appointment_id,
    });

    expect(appointmentAddons).toHaveLength(1);
    expect(appointmentAddons[0].addon_id).toBe('addon-1');
  });

  it('creates guest user when guest_info provided', async () => {
    const dataWithGuest = {
      ...validAppointmentData,
      guest_info: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
      },
    };

    const request = createMockRequest('POST', '/api/appointments', dataWithGuest);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify user was created
    const store = getMockStore();
    const users = store.select('users', { column: 'email', value: 'john@example.com' });
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe('customer');
  });

  it('validates scheduled_at is in the future', async () => {
    const pastData = {
      ...validAppointmentData,
      scheduled_at: '2020-01-01T10:00:00Z', // Past date
    };

    const request = createMockRequest('POST', '/api/appointments', pastData);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### waitlist.test.ts
```typescript
import { POST } from '../waitlist/route';
import { createMockRequest } from '@/test-utils/api-test-helpers';
import { getMockStore } from '@/mocks/supabase/store';

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    getMockStore().reset();
    seedTestData();
  });

  const validWaitlistData = {
    customer_id: 'customer-1',
    pet_id: 'pet-1',
    service_id: 'service-1',
    requested_date: '2025-12-15',
    time_preference: 'morning',
  };

  it('creates waitlist entry with valid data', async () => {
    const request = createMockRequest('POST', '/api/waitlist', validWaitlistData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.waitlist_id).toBeDefined();
    expect(data.position).toBe(1);
  });

  it('returns position in queue', async () => {
    const store = getMockStore();
    // Add existing waitlist entries
    store.insert('waitlist', {
      id: 'waitlist-1',
      customer_id: 'other-customer',
      requested_date: '2025-12-15',
      status: 'active',
    });
    store.insert('waitlist', {
      id: 'waitlist-2',
      customer_id: 'another-customer',
      requested_date: '2025-12-15',
      status: 'active',
    });

    const request = createMockRequest('POST', '/api/waitlist', validWaitlistData);
    const response = await POST(request);
    const data = await response.json();

    expect(data.position).toBe(3);
  });

  it('returns 409 for duplicate entry on same date', async () => {
    const store = getMockStore();
    store.insert('waitlist', {
      id: 'existing-waitlist',
      customer_id: 'customer-1',
      requested_date: '2025-12-15',
      status: 'active',
    });

    const request = createMockRequest('POST', '/api/waitlist', validWaitlistData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe('DUPLICATE_ENTRY');
    expect(data.existing_entry.waitlist_id).toBe('existing-waitlist');
  });

  it('allows entry if existing waitlist entry is cancelled', async () => {
    const store = getMockStore();
    store.insert('waitlist', {
      id: 'cancelled-waitlist',
      customer_id: 'customer-1',
      requested_date: '2025-12-15',
      status: 'cancelled',
    });

    const request = createMockRequest('POST', '/api/waitlist', validWaitlistData);
    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('validates time_preference enum', async () => {
    const invalidData = {
      ...validWaitlistData,
      time_preference: 'invalid',
    };

    const request = createMockRequest('POST', '/api/waitlist', invalidData);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('validates date format', async () => {
    const invalidData = {
      ...validWaitlistData,
      requested_date: '12-15-2025', // Wrong format
    };

    const request = createMockRequest('POST', '/api/waitlist', invalidData);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

## Acceptance Criteria
- [ ] Services endpoint returns active services with prices
- [ ] Appointments endpoint creates appointments successfully
- [ ] Appointments endpoint validates required fields
- [ ] Appointments endpoint detects time slot conflicts (409)
- [ ] Appointments endpoint ignores cancelled appointments for conflicts
- [ ] Appointments endpoint creates appointment_addons
- [ ] Appointments endpoint creates guest user when provided
- [ ] Waitlist endpoint creates entries successfully
- [ ] Waitlist endpoint returns correct queue position
- [ ] Waitlist endpoint detects duplicate entries
- [ ] All endpoints validate input data
- [ ] All tests pass with `npm run test`

## Estimated Complexity
High

## Phase
Phase 8: Testing

## Dependencies
- Task 4, 8, 9 (API routes to test)
- Task 2 (mock data for testing)
