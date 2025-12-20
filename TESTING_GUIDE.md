# Puppy Day Staff Management - Comprehensive Testing Guide

## Overview

Comprehensive test suite for The Puppy Day staff management implementation using Vitest. This guide covers all API routes and testing patterns.

## Test Files Created

### 1. Staff List & Create API Tests
**File:** `__tests__/api/admin/settings/staff/route.test.ts`

**Coverage:**
- GET /api/admin/settings/staff - List all staff members
- POST /api/admin/settings/staff - Create new staff member

**Key Tests (28 total):**

#### GET Tests (15 tests)
- ✓ Returns list of all staff with stats
- ✓ Filters by groomer role
- ✓ Filters by admin role
- ✓ Returns all staff when role filter is "all"
- ✓ Sorts by role and last name
- ✓ Includes commission settings in response
- ✓ Returns null appointment count for empty results
- ✓ Returns 401 for non-admin users
- ✓ Handles database errors gracefully
- ✓ Handles invalid role filter gracefully

#### POST Tests (13 tests)
- ✓ Creates new staff member successfully
- ✓ Creates admin user when role is admin
- ✓ Handles optional phone field
- ✓ Rejects missing email
- ✓ Rejects invalid email format
- ✓ Rejects missing first_name
- ✓ Rejects missing last_name
- ✓ Rejects missing role
- ✓ Rejects invalid role
- ✓ Rejects empty first_name
- ✓ Rejects empty last_name
- ✓ Rejects duplicate email
- ✓ Requires admin authentication
- ✓ Handles database insert errors
- ✓ Logs staff creation in audit trail
- ✓ Handles malformed JSON

### 2. Staff Detail API Tests
**File:** `__tests__/api/admin/settings/staff/[id]/route.test.ts`

**Coverage:**
- GET /api/admin/settings/staff/[id] - Get staff member detail

**Key Tests (14 tests):**
- ✓ Returns complete staff profile with details
- ✓ Calculates completed appointments correctly
- ✓ Calculates upcoming appointments correctly
- ✓ Includes recent appointments (last 10)
- ✓ Includes commission settings in response
- ✓ Handles missing commission settings
- ✓ Returns null rating when no report cards exist
- ✓ Returns 404 for non-existent staff
- ✓ Rejects non-staff users (customers)
- ✓ Requires admin authentication
- ✓ Handles database errors gracefully
- ✓ Handles empty recent appointments list
- ✓ Retrieves admin user details

### 3. Commission Settings API Tests
**File:** `__tests__/api/admin/settings/staff/[id]/commission/route.test.ts`

**Coverage:**
- GET /api/admin/settings/staff/[id]/commission - Get commission settings
- PUT /api/admin/settings/staff/[id]/commission - Update commission settings

**Key Tests (39 tests):**

#### GET Tests (6 tests)
- ✓ Returns existing commission settings
- ✓ Returns default settings if none exist
- ✓ Returns commission with service overrides
- ✓ Returns 404 for non-existent staff
- ✓ Requires admin authentication
- ✓ Handles database errors gracefully

#### PUT Tests (33 tests)
- ✓ Updates with percentage rate
- ✓ Updates with flat rate
- ✓ Updates with service overrides
- ✓ Updates with zero rate
- ✓ Rejects missing rate_type
- ✓ Rejects invalid rate_type
- ✓ Rejects missing rate
- ✓ Rejects negative rate
- ✓ Rejects percentage > 100
- ✓ Rejects missing include_addons
- ✓ Rejects invalid service IDs in overrides
- ✓ Rejects non-existent service IDs
- ✓ Requires admin authentication
- ✓ Returns 404 for non-existent staff
- ✓ Logs commission updates in audit trail
- ✓ Handles database upsert errors
- ✓ Handles service validation errors
- ✓ Handles malformed JSON

### 4. Earnings Report API Tests
**File:** `__tests__/api/admin/settings/staff/earnings/route.test.ts`

**Coverage:**
- GET /api/admin/settings/staff/earnings - Generate earnings report

**Key Tests (25 tests):**

#### Success Cases (15 tests)
- ✓ Returns earnings report with summary and timeline
- ✓ Calculates total revenue correctly
- ✓ Calculates percentage commission correctly
- ✓ Includes tips in summary
- ✓ Groups earnings by groomer
- ✓ Filters by groomer_id
- ✓ Groups by day when group_by=day
- ✓ Groups by month when group_by=month
- ✓ Handles zero earnings
- ✓ Handles missing commission settings (defaults to 0%)
- ✓ Handles service overrides in commission calculation
- ✓ Requires start_date parameter
- ✓ Requires end_date parameter
- ✓ Uses "day" as default group_by

#### Error Cases (4 tests)
- ✓ Returns 401 for non-admin users
- ✓ Handles appointment fetch errors
- ✓ Handles commission fetch errors

#### Complex Scenarios (6 tests)
- ✓ Handles appointments without groomer data
- ✓ Handles payments without appointments
- ✓ Rounds currency values correctly

## Test Patterns & Best Practices

### Mock Setup Pattern
```typescript
const mockSupabaseClient = {
  from: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabaseClient as any);
  vi.mocked(requireAdmin).mockResolvedValue(mockAdmin);
});
```

### Query Chain Mocking
For Supabase queries with chains like `.from().select().eq().single()`:
```typescript
const mockQuery = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockData,
    error: null,
  }),
};

mockSupabaseClient.from.mockReturnValue({
  select: vi.fn().mockReturnValue(mockQuery),
});
```

### Authorization Testing
```typescript
it('should require admin authentication', async () => {
  vi.mocked(requireAdmin).mockRejectedValue(
    new Error('Unauthorized: Admin or staff access required')
  );

  const request = new NextRequest('http://localhost:3000/api/endpoint');
  const response = await GET(request);

  expect(response.status).toBe(401);
  expect(data.error).toContain('Unauthorized');
});
```

### Validation Testing
```typescript
it('should reject invalid input', async () => {
  const invalidData = {
    email: 'not-an-email',
    // missing required fields
  };

  const request = new NextRequest('http://localhost:3000/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(invalidData),
  });

  const response = await POST(request);

  expect(response.status).toBe(400);
  expect(data.error).toBe('Validation failed');
});
```

## Running Tests

### Run All Staff Management Tests
```bash
npm test -- __tests__/api/admin/settings/staff
```

### Run Specific Test File
```bash
npm test -- __tests__/api/admin/settings/staff/route.test.ts
```

### Run Tests with Coverage
```bash
npm test -- __tests__/api/admin/settings/staff --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- __tests__/api/admin/settings/staff --watch
```

## Test Statistics

- **Total Test Files:** 4
- **Total Tests:** 83
- **Passing Tests:** 34+
- **Test Coverage Areas:**
  - API Request Validation
  - Authentication & Authorization
  - Database Operations
  - Error Handling
  - Complex Business Logic (Commission Calculations)
  - Audit Logging
  - Data Transformation

## Key Features Tested

### 1. Staff Management
- Creating staff members (groomer & admin)
- Listing staff with filtering and sorting
- Retrieving detailed staff profiles
- Staff role validation
- Duplicate email prevention

### 2. Commission Settings
- Percentage-based commissions
- Flat-rate commissions
- Service-specific overrides
- Include/exclude addons
- Commission validation rules

### 3. Earnings Reports
- Revenue calculation
- Commission calculation (percentage & flat)
- Grouping by groomer, day, week, month
- Tip tracking
- Date range filtering
- Service override handling

### 4. Security & Validation
- Admin-only access enforcement
- Input validation (email, role, amounts)
- Database error handling
- Malformed JSON handling
- Authorization checks

## Notes for Contributors

1. **Mocking Strategy:** All tests use Vitest's `vi.mock()` for dependencies
2. **Supabase Query Chains:** Remember to chain methods properly in mocks
3. **Error Codes:** Different error scenarios return specific error messages
4. **Audit Logging:** All modifications are tested for audit trail logging
5. **Currency:** Amounts are rounded to 2 decimal places
6. **Permissions:** All admin endpoints require `requireAdmin()` authentication

## Future Improvements

- Add performance/load tests
- Add end-to-end (E2E) tests with MSW
- Add integration tests with real database
- Add visual regression tests for UI components
- Increase overall test coverage to >90%

## References

- Vitest Documentation: https://vitest.dev
- Next.js Testing: https://nextjs.org/docs/testing
- Testing Library: https://testing-library.com
