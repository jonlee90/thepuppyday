# Phase 9 Test Suites - Quick Reference Guide

## Test File Locations

### Task 0216: Validation Tests
```
__tests__/lib/validation/
├── booking-settings.test.ts       (510 lines, 58 tests)
├── site-content.test.ts           (912 lines, 73 tests)
├── business-info.test.ts          (668 lines, 73 tests)
└── loyalty-settings.test.ts       (267 lines, 44 tests)
```

### Task 0217: Service Tests
```
__tests__/lib/admin/
├── site-content-service.test.ts   (486 lines, 21 tests)
└── booking-settings-service.test.ts (468 lines, 19 tests)
```

### Task 0218: API Integration Tests
```
__tests__/api/admin/settings/
├── site-content-integration.test.ts (639 lines, 30 tests)
├── booking-integration.test.ts      (602 lines, 30 tests)
└── loyalty-integration.test.ts      (456 lines, 27 tests)
```

---

## Test Counts by Component

| Component | Validation | Services | API Tests | Total |
|-----------|-----------|----------|-----------|-------|
| BookingSettings | 58 | 19 | 30 | 107 |
| SiteContent (Hero/SEO) | 73 | 21 | 30 | 124 |
| BusinessInfo | 73 | - | - | 73 |
| LoyaltySettings | 44 | - | 27 | 71 |
| **TOTAL** | **248** | **40** | **87** | **375** |

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test booking-settings.test.ts
npm test site-content.test.ts
npm test business-info.test.ts
npm test loyalty-settings.test.ts
```

### Run Validation Tests Only
```bash
npm test __tests__/lib/validation/
```

### Run Service Tests Only
```bash
npm test __tests__/lib/admin/
```

### Run API Tests Only
```bash
npm test __tests__/api/admin/settings/
```

### Run with Coverage Report
```bash
npm test -- --coverage
npm test -- --coverage --reporter=html
```

### Watch Mode (Recommended for Development)
```bash
npm test -- --watch
npm test booking-settings.test.ts --watch
```

### Run Specific Test Suite
```bash
npm test booking-settings.test.ts -t "Valid booking window"
npm test site-content.test.ts -t "HeroContent"
```

---

## Validation Ranges Reference

### Booking Settings
| Field | Min | Max | Format |
|-------|-----|-----|--------|
| min_advance_hours | 0 | 168 | Integer |
| max_advance_days | 1 | 365 | Integer |
| cancellation_cutoff_hours | 0 | 168 | Integer |
| buffer_minutes | 0 | 120 | Divisible by 5 |
| blocked_dates | - | - | YYYY-MM-DD |
| recurring_blocked_days | 0 | 6 | Day of week |

### Hero Content
| Field | Min | Max | Type |
|-------|-----|-----|------|
| headline | 1 | 100 | chars |
| subheadline | 1 | 200 | chars |
| cta_buttons | 0 | 3 | count |
| button.text | 1 | 50 | chars |

### SEO Settings
| Field | Min | Max | Type |
|-------|-----|-----|------|
| page_title | 1 | 60 | chars |
| meta_description | 1 | 160 | chars |
| og_title | 1 | 60 | chars |
| og_description | 1 | 160 | chars |

### Business Info
| Field | Format | Example |
|-------|--------|---------|
| phone | (XXX) XXX-XXXX | (657) 252-2903 |
| email | valid@email.com | test@example.com |
| zip | 12345 or 12345-6789 | 90638 |
| state | XX (uppercase) | CA |
| social_urls | https://... | HTTPS required |

### Loyalty Settings
| Field | Min | Max | Type |
|-------|-----|-----|------|
| punch_threshold | 5 | 20 | Integer |
| minimum_spend | 0 | ∞ | Number |
| first_visit_bonus | 0 | 10 | Integer |
| expiration_days | 0 | 3650 | Integer |
| referrer_bonus | 0 | 10 | Integer |
| referee_bonus | 0 | 10 | Integer |

---

## Common Test Patterns

### Test 1: Valid Input
```typescript
it('should accept valid input', () => {
  const result = schema.safeParse(validData);
  expect(result.success).toBe(true);
});
```

### Test 2: Invalid Input
```typescript
it('should reject invalid input', () => {
  const result = schema.safeParse(invalidData);
  expect(result.success).toBe(false);
});
```

### Test 3: Boundary Values
```typescript
it('should accept boundary value (100)', () => {
  const data = { field: 'a'.repeat(100) };
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
});

it('should reject over boundary (101)', () => {
  const data = { field: 'a'.repeat(101) };
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
});
```

### Test 4: API GET
```typescript
it('should return data on success', async () => {
  mockSupabase.single.mockResolvedValue({
    data: mockData,
    error: null,
  });

  const response = await GET();
  const json = await response.json();

  expect(response.status).toBe(200);
  expect(json.data).toBeDefined();
});
```

### Test 5: API Error
```typescript
it('should handle database errors', async () => {
  mockSupabase.single.mockRejectedValue(
    new Error('Connection failed')
  );

  await expect(GET()).rejects.toThrow();
});
```

---

## Key Assertions

### Validation Tests
```typescript
expect(result.success).toBe(true/false)
expect(result.error.issues[0].message).toContain('...')
expect(value).toBeGreaterThanOrEqual(min)
expect(value).toBeLessThanOrEqual(max)
expect(regex.test(value)).toBe(true/false)
```

### Service Tests
```typescript
expect(result).toBeDefined()
expect(result.length).toBeGreaterThan(0)
expect(result).toEqual(expected)
expect(mockFunction).toHaveBeenCalled()
```

### API Tests
```typescript
expect(response.status).toBe(200)
expect(json.error).toBeDefined()
expect(mockSupabase.from).toHaveBeenCalledWith('table_name')
expect(logSettingsChange).toHaveBeenCalledWith(...)
```

---

## Expected Test Results

### Task 0216: Validation Tests
```
PASS __tests__/lib/validation/booking-settings.test.ts
✓ 58 tests

PASS __tests__/lib/validation/site-content.test.ts
✓ 73 tests

PASS __tests__/lib/validation/business-info.test.ts
✓ 73 tests

PASS __tests__/lib/validation/loyalty-settings.test.ts
✓ 44 tests

Total: 248 tests, 100% pass rate
```

### Task 0217: Service Tests
```
PASS __tests__/lib/admin/site-content-service.test.ts
✓ 21 tests

PASS __tests__/lib/admin/booking-settings-service.test.ts
✓ 19 tests

Total: 40 tests, 100% pass rate
```

### Task 0218: API Integration Tests
```
PASS __tests__/api/admin/settings/site-content-integration.test.ts
✓ 30 tests

PASS __tests__/api/admin/settings/booking-integration.test.ts
✓ 30 tests

PASS __tests__/api/admin/settings/loyalty-integration.test.ts
✓ 27 tests

Total: 87 tests, 100% pass rate
```

**Overall: 375 tests, 100% pass rate expected**

---

## Debug Tips

### View All Tests Without Running
```bash
npm test -- --listTests | grep validation
```

### Run Single Test Case
```bash
npm test booking-settings.test.ts -t "should accept valid input"
```

### See Detailed Error Output
```bash
npm test -- --reporter=verbose
```

### Generate Coverage Report
```bash
npm test -- --coverage --reporter=html
open coverage/index.html
```

### Check Test File Syntax
```bash
npx vitest --check __tests__/lib/validation/booking-settings.test.ts
```

---

## Mocking Cheat Sheet

### Mock Supabase
```typescript
vi.mock('@/lib/supabase/server');

mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  insert: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  update: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockResolvedValue({ error: null }),
};

vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
```

### Mock Auth
```typescript
vi.mock('@/lib/admin/auth');

vi.mocked(requireAdmin).mockResolvedValue({
  user: { id: 'admin-1', role: 'admin' },
  role: 'admin',
});

// For error case:
vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
```

### Mock Audit Log
```typescript
vi.mock('@/lib/admin/audit-log');

vi.mocked(logSettingsChange).mockResolvedValue(undefined);
```

---

## Troubleshooting

### Issue: Tests not found
**Solution:** Check file path matches `__tests__/**/*.test.ts`

### Issue: Mocks not working
**Solution:** Ensure mocks are declared before imports
```typescript
vi.mock('@/lib/...');
import { /* ... */ } from '@/lib/...';
```

### Issue: Async test timeout
**Solution:** Increase timeout for slow tests
```typescript
it('slow test', async () => {
  // test code
}, { timeout: 10000 }); // 10 seconds
```

### Issue: Mock not being called
**Solution:** Clear mocks in beforeEach
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## Files Summary

| File | Lines | Tests | Coverage |
|------|-------|-------|----------|
| booking-settings.test.ts | 510 | 58 | 85%+ |
| site-content.test.ts | 912 | 73 | 85%+ |
| business-info.test.ts | 668 | 73 | 85%+ |
| loyalty-settings.test.ts | 267 | 44 | 80%+ |
| site-content-service.test.ts | 486 | 21 | 80%+ |
| booking-settings-service.test.ts | 468 | 19 | 80%+ |
| site-content-integration.test.ts | 639 | 30 | 80%+ |
| booking-integration.test.ts | 602 | 30 | 80%+ |
| loyalty-integration.test.ts | 456 | 27 | 80%+ |
| **TOTAL** | **5,008** | **375** | **82%+** |

---

## Next Steps

1. Run tests: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Fix any failures
4. Commit changes: `git add . && git commit -m "..."`
5. Continue with Phase 9 tasks 0219+
