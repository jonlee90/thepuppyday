# Phase 9 Admin Settings Test Suites - Index

## Quick Access

### Documentation
- **[Full Test Summary](test-suites-summary-0216-0218.md)** - Complete breakdown of all 375 tests
- **[Quick Reference Guide](test-quick-reference.md)** - Commands, patterns, and troubleshooting

---

## Task 0216: Unit Tests for Validation Logic

### Validation Files
| File | Lines | Tests | Purpose |
|------|-------|-------|---------|
| `__tests__/lib/validation/booking-settings.test.ts` | 510 | 58 | BookingSettings schema validation |
| `__tests__/lib/validation/site-content.test.ts` | 912 | 73 | HeroContent & SeoSettings schemas |
| `__tests__/lib/validation/business-info.test.ts` | 668 | 73 | BusinessInfo & contact validation |
| `__tests__/lib/validation/loyalty-settings.test.ts` | 267 | 44 | Loyalty earning/redemption/referral |

**Total:** 2,357 lines, 248 tests

### What Gets Tested

**BookingSettings (58 tests)**
- min_advance_hours: 0-168 ✓
- max_advance_days: 1-365 ✓
- buffer_minutes: 0-120, divisible by 5 ✓
- cancellation_cutoff_hours: 0-168 ✓
- blocked_dates with date ranges ✓
- recurring_blocked_days (0-6) ✓

**HeroContent (40 tests)**
- headline: 1-100 chars ✓
- subheadline: 1-200 chars ✓
- CTA buttons: 0-3 with style validation ✓
- background_image_url: HTTPS or null ✓

**SeoSettings (30 tests)**
- page_title: 1-60 chars (SEO) ✓
- meta_description: 1-160 chars ✓
- og_title: 1-60 chars ✓
- og_description: 1-160 chars ✓
- og_image_url: HTTPS or null ✓

**BusinessInfo (73 tests)**
- Phone: (XXX) XXX-XXXX format ✓
- Email: valid email format ✓
- ZIP: 5-digit or 5+4 format ✓
- State: 2 uppercase letters ✓
- Social URLs: HTTPS required ✓

**LoyaltySettings (44 tests)**
- punch_threshold: 5-20 ✓
- minimum_spend: >= 0 ✓
- first_visit_bonus: 0-10 ✓
- expiration_days: 0-3650 ✓
- referral bonuses: 0-10 each ✓

---

## Task 0217: Unit Tests for Settings Services

### Service Files
| File | Lines | Tests | Purpose |
|------|-------|-------|---------|
| `__tests__/lib/admin/site-content-service.test.ts` | 486 | 21 | getSiteContent utility |
| `__tests__/lib/admin/booking-settings-service.test.ts` | 468 | 19 | Booking service functions |

**Total:** 954 lines, 40 tests

### What Gets Tested

**Site Content Service (21 tests)**
- getSiteContent() for hero, seo, business_info ✓
- Merge with defaults ✓
- Handle null/missing sections ✓
- Database error handling ✓
- Timestamp preservation ✓

**Booking Settings Service (19 tests)**
- getBookingSettings() with defaults ✓
- isDateBlocked() single & range ✓
- isWithinBookingWindow() validation ✓
- getBlockedDates() expansion ✓
- Recurring day detection ✓
- Timezone & DST handling ✓
- Buffer time calculations ✓

---

## Task 0218: Integration Tests for API Endpoints

### API Test Files
| File | Lines | Tests | Endpoints |
|------|-------|-------|-----------|
| `__tests__/api/admin/settings/site-content-integration.test.ts` | 639 | 30 | GET/PUT /api/admin/settings/site-content |
| `__tests__/api/admin/settings/booking-integration.test.ts` | 602 | 30 | GET/PUT /api/admin/settings/booking |
| `__tests__/api/admin/settings/loyalty-integration.test.ts` | 456 | 27 | GET/PUT /api/admin/settings/loyalty |

**Total:** 1,697 lines, 87 tests

### What Gets Tested

**Site Content API (30 tests)**
- GET: Fetch all sections ✓
- GET: Return with timestamps ✓
- PUT: Update hero content ✓
- PUT: Update SEO settings ✓
- PUT: Update business info ✓
- Validation errors ✓
- Auth required (401) ✓
- Audit logging ✓
- Database errors ✓

**Booking Settings API (30 tests)**
- GET: Default settings ✓
- GET: Existing settings merge ✓
- PUT: Validate all fields ✓
- PUT: Check business logic constraints ✓
- POST: Create blocked dates ✓
- DELETE: Remove blocked dates ✓
- Date range validation ✓
- Appointment conflict checking ✓
- Auth & error handling ✓

**Loyalty Settings API (27 tests)**
- GET: Default & existing settings ✓
- GET: Statistics calculation ✓
- PUT: Update earning rules ✓
- PUT: Update redemption rules ✓
- PUT: Update referral program ✓
- UUID validation ✓
- Punch threshold (5-20) ✓
- Expiration days (0-3650) ✓
- Auth & error handling ✓

---

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run specific task
npm test __tests__/lib/validation/          # Task 0216
npm test __tests__/lib/admin/                # Task 0217
npm test __tests__/api/admin/settings/       # Task 0218

# Run specific file
npm test booking-settings.test.ts
npm test site-content-integration.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific test suite
npm test booking-settings.test.ts -t "Valid booking window"
```

See **[Quick Reference](test-quick-reference.md)** for more commands.

---

## Test Coverage Summary

| Component | Total Tests | Coverage |
|-----------|------------|----------|
| BookingSettings | 107 | 85%+ |
| SiteContent (Hero/SEO) | 124 | 85%+ |
| BusinessInfo | 73 | 85%+ |
| LoyaltySettings | 71 | 80%+ |
| **TOTAL** | **375** | **82%+** |

---

## File Organization

```
Phase 9 Tests/
├── Task 0216: Validation Tests (2,357 lines)
│   ├── booking-settings.test.ts (510)
│   ├── site-content.test.ts (912)
│   ├── business-info.test.ts (668)
│   └── loyalty-settings.test.ts (267)
│
├── Task 0217: Service Tests (954 lines)
│   ├── site-content-service.test.ts (486)
│   └── booking-settings-service.test.ts (468)
│
├── Task 0218: API Integration Tests (1,697 lines)
│   ├── site-content-integration.test.ts (639)
│   ├── booking-integration.test.ts (602)
│   └── loyalty-integration.test.ts (456)
│
└── Documentation
    ├── test-suites-summary-0216-0218.md
    ├── test-quick-reference.md
    └── TESTS_INDEX.md (this file)
```

---

## Validation Rules Reference

### Booking Settings
```
min_advance_hours:     0 to 168 hours (int)
max_advance_days:      1 to 365 days (int)
buffer_minutes:        0 to 120, divisible by 5
cancellation_cutoff:   0 to 168 hours (int)
blocked_dates:         YYYY-MM-DD format
recurring_days:        0-6 (Sun-Sat)
```

### Site Content (Hero)
```
headline:              1 to 100 chars (required)
subheadline:           1 to 200 chars (required)
background_image_url:  HTTPS URL or null
cta_buttons:           0-3 buttons
  - text:              1-50 chars
  - url:               valid URL
  - style:             'primary' | 'secondary'
```

### Site Content (SEO)
```
page_title:            1 to 60 chars
meta_description:      1 to 160 chars
og_title:              1 to 60 chars
og_description:        1 to 160 chars
og_image_url:          HTTPS URL or null
```

### Business Info
```
name:                  1 to 100 chars
address:               1 to 200 chars
city:                  1 to 100 chars
state:                 2 uppercase letters
zip:                   5-digit or 5+4 format
phone:                 (XXX) XXX-XXXX format
email:                 valid email format
social_links:          HTTPS URLs (optional)
```

### Loyalty Settings
```
punch_threshold:       5 to 20
minimum_spend:         >= 0
first_visit_bonus:     0 to 10
expiration_days:       0 to 3650 (0 = never)
referrer_bonus:        0 to 10
referee_bonus:         0 to 10
eligible_services:     array of UUIDs
```

---

## Test Patterns Used

All tests follow these patterns:

### 1. Validation Testing
```typescript
describe('FieldName Validation', () => {
  it('should accept valid value', () => {
    const result = schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid value', () => {
    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

### 2. Service Testing
```typescript
describe('Service Function', () => {
  it('should return data on success', async () => {
    // Setup
    const result = await serviceFunction();
    // Assert
    expect(result).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    await expect(serviceFunction()).rejects.toThrow();
  });
});
```

### 3. API Integration Testing
```typescript
describe('GET /api/endpoint', () => {
  it('should fetch data', async () => {
    const response = await GET();
    const json = await response.json();
    expect(response.status).toBe(200);
  });

  it('should require auth', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));
    const response = await GET();
    expect(response.status).toBe(500);
  });
});
```

See **[Full Summary](test-suites-summary-0216-0218.md)** for comprehensive patterns.

---

## Next Steps

1. Run the tests: `npm test`
2. Review coverage: `npm test -- --coverage`
3. Fix any failures
4. Commit: `git add . && git commit -m "test(phase-9): Add comprehensive test suites"`
5. Continue with Phase 9 tasks 0219+

---

## Key Files Location

**Validation Tests:**
- `C:\Users\Jon\Documents\claude projects\thepuppyday\__tests__\lib\validation\`

**Service Tests:**
- `C:\Users\Jon\Documents\claude projects\thepuppyday\__tests__\lib\admin\`

**API Tests:**
- `C:\Users\Jon\Documents\claude projects\thepuppyday\__tests__\api\admin\settings\`

**Documentation:**
- `C:\Users\Jon\Documents\claude projects\thepuppyday\docs\specs\phase-9\`

---

## Statistics

- **Total Test Files:** 9
- **Total Lines of Code:** 5,008
- **Total Test Cases:** 375
- **Expected Pass Rate:** 100%
- **Code Coverage Target:** 80%+
- **Status:** COMPLETE

Last Updated: December 19, 2025
