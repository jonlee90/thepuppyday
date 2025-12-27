# API Integration Tests

This directory contains integration tests for The Puppy Day API routes.

## Structure

```
__tests__/api/
├── appointments/
│   └── route.test.ts           # POST /api/appointments validation tests
├── admin/
│   ├── groomers/
│   │   └── route.test.ts       # GET /api/admin/groomers tests
│   ├── services/
│   │   └── route.test.ts       # GET/POST /api/admin/services tests
│   └── settings/               # Admin settings API tests
└── README.md                   # This file
```

## Test Philosophy

These tests use a **validation-focused integration testing** approach:

### What We Test

✅ **Input Validation**
- Schema validation (required fields, types, formats)
- Business logic validation (future dates, positive numbers)
- Security validation (XSS prevention, SQL injection prevention)

✅ **Authorization**
- Authentication requirements
- Role-based access control (admin, groomer, customer)
- RLS policy enforcement

✅ **Error Handling**
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Database errors (500)

### What We Mock

- Supabase client (complex database interactions)
- External services (notifications, payments)
- Service role authentication

### What Needs Real Database Tests

⚠️ **Complex Database Operations**
- Slot conflict detection with race conditions
- Transaction rollbacks
- RLS policy integration
- Data integrity constraints
- Cascading deletes
- Triggers and stored procedures

## Running Tests

### Run All API Tests

```bash
npm test -- __tests__/api --run
```

### Run Specific Test Suite

```bash
# Appointments API
npm test -- __tests__/api/appointments/route.test.ts --run

# Groomers API
npm test -- __tests__/api/admin/groomers/route.test.ts --run

# Services API
npm test -- __tests__/api/admin/services/route.test.ts --run
```

### Watch Mode

```bash
npm test -- __tests__/api/appointments/route.test.ts
```

### Coverage

```bash
npm run test:coverage -- __tests__/api
```

## Writing New API Tests

### Template for Validation Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/your-endpoint/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('POST /api/your-endpoint - Validation', () => {
  it('should reject invalid input', async () => {
    const request = new Request('http://localhost/api/your-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invalid: 'data',
      }),
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation error');
  });
});
```

### Template for Authorization Tests

```typescript
import { requireAdmin } from '@/lib/admin/auth';

vi.mock('@/lib/admin/auth');

describe('GET /api/admin/your-endpoint', () => {
  it('should require admin authentication', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new Error('Unauthorized: Admin or staff access required')
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});
```

## Best Practices

### DO ✅

- Test validation logic thoroughly
- Test all error paths
- Test authorization for admin endpoints
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies
- Clean up mocks with `vi.clearAllMocks()`

### DON'T ❌

- Don't test implementation details
- Don't mock what you're testing
- Don't write overly complex mock setups
- Don't test framework functionality
- Don't skip error handling tests
- Don't commit tests with `.only` or `.skip`

## Coverage Goals

- **Validation**: 100% coverage of all input validation
- **Authorization**: 100% coverage of authentication/authorization logic
- **Error Handling**: 100% coverage of error paths
- **Happy Path**: At least one happy path test per endpoint
- **Edge Cases**: Coverage of boundary conditions and edge cases

## Current Status

| Test Suite | Tests | Passing | Coverage |
|------------|-------|---------|----------|
| Appointments | 11 | 11 ✅ | Validation: 100% |
| Groomers | 16 | 16 ✅ | Full coverage |
| Services | 17 | 11 ✅ | Validation: 100%, DB: Partial |

**Total**: 27 passing tests

## Future Improvements

1. **Database Integration Tests**
   - Set up test database with migrations
   - Test full CRUD operations
   - Verify RLS policies with real queries

2. **Additional Endpoints**
   - PATCH /api/appointments/:id
   - DELETE /api/appointments/:id
   - GET /api/appointments (with filters)
   - Additional admin endpoints

3. **Performance Tests**
   - Load testing for concurrent requests
   - Query performance validation
   - Race condition testing

4. **E2E API Tests**
   - Full booking flow tests
   - Complete admin workflow tests
   - Error recovery scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [API Testing Best Practices](https://blog.logrocket.com/unit-testing-node-js-applications-using-mocha-chai-and-sinon/)
