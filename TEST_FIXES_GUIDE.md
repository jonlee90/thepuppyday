# Test Fixes Guide - Staff Management API Tests

## Overview
This document outlines the remaining test fixes needed for the comprehensive staff management test suite.

## Issues & Solutions

### Issue 1: Mock Chain Setup in [id]/route.test.ts

**Problem:** The `.single()` method needs to be included in the query chain mock.

**Current Pattern (Incorrect):**
```typescript
const mockSelectQuery = {
  eq: vi.fn().mockResolvedValue({
    data: mockStaffProfile,
    error: null,
  }),
};
```

**Fixed Pattern (Correct):**
```typescript
const mockSelectQuery = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockStaffProfile,
    error: null,
  }),
};
```

**Why:** Supabase queries use method chaining. Each method that returns the query object (like `.eq()`) must return `this` to allow chaining to the next method (like `.single()`).

**Affected Tests in `[id]/route.test.ts`:**
1. All tests in "Calculate upcoming appointments correctly"
2. All tests in "Include recent appointments (last 10)"
3. All tests in "Include commission settings in response"
4. All tests in "Handle missing commission settings"
5. All tests in "Return null rating when no report cards exist"
6. Error case: "Return 404 for non-existent staff"
7. Admin role test: "Retrieve admin user details"

**Fix Template:**
```typescript
// For staff profile query (uses .single())
const mockSelectQuery = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockStaffProfile,
    error: null,
  }),
};

// For commission query (uses .single())
const mockCommissionQuery = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: mockCommissionSettings,
    error: null,
  }),
};

// For count queries (uses .lte())
const mockCountQuery = {
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockResolvedValue({ count: 15, error: null }),
};
```

### Issue 2: Commission Route Tests Error Messages

**Problem:** Error response messages don't match expected values in tests.

**Current Issue:** When `.request.json()` fails, routes return "Internal server error" instead of specific error messages.

**Tests Affected in `[id]/commission/route.test.ts`:**
1. "should handle database upsert errors" - Expected: "Failed to update commission settings"
2. "should handle service validation errors" - Expected: "Failed to validate service IDs"
3. "should handle malformed JSON in request body" - Expected: 400, Received: 500

**Reason:** The route implementation catches JSON parsing errors in try/catch blocks that return 500 errors rather than 400.

**Solutions:**

#### Solution 1: Update Tests to Match Implementation
Change test expectations to match actual behavior:
```typescript
// Instead of:
expect(response.status).toBe(400);

// Use:
expect(response.status).toBe(500); // or whatever actual code returns
```

#### Solution 2: Update Route Implementation (Recommended)
Add specific error handling for JSON parsing:
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    // ... rest of code
  } catch (parseError) {
    // Handle JSON parse errors specifically
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
}
```

### Issue 3: Audit Log Mocking in Commission Tests

**Problem:** Mock not properly tracking function calls with complex parameters.

**Test:** "should log commission settings update in audit trail"

**Issue:** `logSettingsChange` is being called but mock isn't tracking it properly because the function parameters include `mockSupabaseClient`.

**Solution:** Verify mock is being set up correctly before the test:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(logSettingsChange).mockResolvedValue(undefined); // ✓ Add this
  // ... other setup
});
```

## Systematic Fixes by Test File

### File: `__tests__/api/admin/settings/staff/[id]/route.test.ts`

**Lines to Fix:**
- Lines 218-264: Update mockSelectQuery pattern
- Lines 225-253: Update mockCommissionQuery pattern
- Lines 299-365: Update for "include recent appointments" test
- Lines 394-462: Update for "include commission settings" test
- Lines 491-559: Update for "handle missing commission settings" test
- Lines 588-656: Update for "return null rating" test
- Lines 689-738: Update for "404 non-existent staff" test
- Lines 791-839: Update for "admin role handling" test

**Standard Fix:**
Replace all instances of:
```typescript
const mockSelectQuery = {
  eq: vi.fn().mockResolvedValue({...}),
};
```

With:
```typescript
const mockSelectQuery = {
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({...}),
};
```

### File: `__tests__/api/admin/settings/staff/[id]/commission/route.test.ts`

**Database Error Tests (Lines 988-1044):**
Option A (Recommended): Keep tests and update route to return specific errors
Option B: Update tests to match current implementation

**Malformed JSON Test (Lines 1050-1063):**
Add try/catch in PUT route for JSON parsing, or update test expectation from 400 to 500.

## Recommended Fix Order

1. **High Priority:** Fix mock chain setups in `[id]/route.test.ts` (affects 7 tests)
2. **Medium Priority:** Fix error message expectations in commission route tests (affects 3 tests)
3. **Low Priority:** Verify audit log mocking setup (should pass after other fixes)

## Quick Fix Script

To apply mocks fixes systematically:

```bash
# 1. Update [id] route test mocks (manual - use find/replace)
# Find: const mockSelectQuery = {\n        eq: vi.fn().mockResolvedValue({
# Replace with: const mockSelectQuery = {\n        eq: vi.fn().mockReturnThis(),\n        single: vi.fn().mockResolvedValue({

# 2. Update commission route - ensure mock setup
# Add: vi.mocked(logSettingsChange).mockResolvedValue(undefined);

# 3. Re-run tests
npm test -- __tests__/api/admin/settings/staff
```

## Expected Outcomes After Fixes

- **Current Status:** 49 failed, 34 passed (83 total)
- **Expected Status:** All tests passing (83/83)
- **Coverage:** >80% of staff management code

## Prevention for Future Tests

When writing similar tests:
1. Always chain methods properly in mocks - return `this` for chainable methods
2. Match mock error messages to actual implementation
3. Test JSON parsing errors separately
4. Verify audit logging setup in beforeEach
5. Use consistent mock patterns across test files

## Validation Checklist

- [ ] All `.eq()` methods return `this` for chaining
- [ ] All `.single()` methods resolve with proper data
- [ ] Error messages match route implementation
- [ ] Audit log mocks are initialized in beforeEach
- [ ] JSON parsing errors handled appropriately
- [ ] Run full test suite: `npm test -- __tests__/api/admin/settings/staff`
- [ ] Verify all 83 tests pass
- [ ] Check code coverage: `npm test -- __tests__/api/admin/settings/staff --coverage`

## Questions & Clarifications

**Q: Why do some mocks return `this` and others don't?**
A: Methods that are part of a query chain (like `.eq()`, `.gte()`, `.select()`) need to return `this`. Terminal methods like `.single()` that execute the query can resolve to the data directly.

**Q: Why are error messages different in tests vs. implementation?**
A: The route implementation catches all errors in a broad try/catch, while tests expected more specific error types. Either update tests or add more specific error handling in routes.

**Q: How should I mock complex Supabase queries?**
A: Build from the end of the chain backwards:
1. Define what `.single()` or `.limit()` returns
2. Add chainable methods before it that return `this`
3. Mock `from()` to return the `select()` method

Example:
```typescript
// End of chain
const query = {
  single: vi.fn().mockResolvedValue({ data: {...}, error: null }),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
};

// Mock the chain
mockSupabaseClient.from.mockReturnValue({
  select: vi.fn().mockReturnValue(query),
});
```
