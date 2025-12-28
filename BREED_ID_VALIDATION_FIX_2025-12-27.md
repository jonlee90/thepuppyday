# Breed ID Validation Fix - 2025-12-27

## Issue Summary

**Error:** When creating an appointment through the booking modal on the marketing page with a custom pet name, users encountered a validation error:

```json
{
  "error": "Validation error",
  "details": [{
    "expected": "string",
    "code": "invalid_type",
    "path": ["new_pet", "breed_id"],
    "message": "Invalid input: expected string, received undefined"
  }]
}
```

## Root Cause Analysis

### Schema Mismatch

The validation schemas were inconsistent across the application:

1. **Frontend Pet Form Schema** (`src/lib/booking/validation.ts`, line 55):
   - `breed_id: z.string().optional()` - Correctly marked as **OPTIONAL**
   - `breed_custom: z.string().optional()` - Custom breed name field

2. **API Request Schema** (`src/app/api/appointments/route.ts`, line 29):
   - `breed_id: z.string().uuid()` - **REQUIRED** (missing `.optional()`)
   - This caused validation to fail when users entered custom breed names

3. **Database Schema** (`.claude/doc/database.md`, line 304):
   - `breed_id` column: `is_nullable: YES` - Database allows NULL values

### User Flow That Failed

1. Customer opens booking modal from marketing page
2. Fills out pet form with custom breed name (e.g., "Golden Doodle")
3. Does NOT select a breed from dropdown (breed_id remains undefined)
4. Frontend validation passes (breed_id is optional in `petFormSchema`)
5. API receives payload: `{ name: "Buddy", size: "medium", breed_custom: "Golden Doodle" }`
6. **API validation fails** because breed_id is required in `appointmentRequestSchema`
7. User sees error message

## The Fix

### File: `src/app/api/appointments/route.ts`

**Change 1: Line 29 - Make breed_id optional in validation schema**

```typescript
// BEFORE
new_pet: z.object({
  name: z.string().min(1),
  breed_id: z.string().uuid(),  // ❌ Required
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().optional(),
  breed_custom: z.string().optional(),
}).optional(),

// AFTER
new_pet: z.object({
  name: z.string().min(1),
  breed_id: z.string().uuid().optional(),  // ✅ Optional
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().optional(),
  breed_custom: z.string().optional(),
}).optional(),
```

**Change 2: Line 155 - Ensure NULL is inserted when breed_id is undefined**

```typescript
// BEFORE
const { data: newPet, error: petError } = await supabase
  .from('pets')
  .insert({
    owner_id: customerId,
    name: validated.new_pet.name,
    breed_id: validated.new_pet.breed_id,  // Could be undefined
    size: validated.new_pet.size,
    weight: validated.new_pet.weight || null,
    breed_custom: validated.new_pet.breed_custom || null,
  })

// AFTER
const { data: newPet, error: petError } = await supabase
  .from('pets')
  .insert({
    owner_id: customerId,
    name: validated.new_pet.name,
    breed_id: validated.new_pet.breed_id || null,  // ✅ Explicit null
    size: validated.new_pet.size,
    weight: validated.new_pet.weight || null,
    breed_custom: validated.new_pet.breed_custom || null,
  })
```

## Verification

### Schema Validation Tests

```javascript
const schema = z.object({
  name: z.string().min(1),
  breed_id: z.string().uuid().optional(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().optional(),
  breed_custom: z.string().optional(),
});

// Test 1: With breed_id - PASS ✅
schema.parse({
  name: 'Buddy',
  breed_id: '123e4567-e89b-12d3-a456-426614174000',
  size: 'medium',
});

// Test 2: Without breed_id (custom breed) - PASS ✅
schema.parse({
  name: 'Buddy',
  breed_custom: 'Golden Doodle',
  size: 'medium',
});

// Test 3: With neither - PASS ✅
schema.parse({
  name: 'Buddy',
  size: 'medium',
});
```

### Other API Endpoints Reviewed

1. **`/api/admin/appointments` (POST)** - Already handled correctly:
   ```typescript
   breed_id: z
     .union([z.string().uuid(), z.literal(''), z.null(), z.undefined()])
     .transform((val) => (val && val !== '' ? val : undefined))
   ```

2. **`/api/pets` (POST)** - Already handled correctly:
   ```typescript
   breed_id: validated.breed_id || null
   ```

## Expected Behavior After Fix

### Scenario 1: User selects breed from dropdown
- Frontend sends: `{ name: "Buddy", breed_id: "uuid-123", size: "medium" }`
- API validates: ✅ Pass
- Database inserts: `breed_id = "uuid-123"`, `breed_custom = null`

### Scenario 2: User enters custom breed name
- Frontend sends: `{ name: "Buddy", breed_custom: "Golden Doodle", size: "medium" }`
- API validates: ✅ Pass
- Database inserts: `breed_id = null`, `breed_custom = "Golden Doodle"`

### Scenario 3: User provides neither
- Frontend sends: `{ name: "Buddy", size: "medium" }`
- API validates: ✅ Pass
- Database inserts: `breed_id = null`, `breed_custom = null`

## Design Rationale

### Why breed_id is Optional

1. **User Experience**: Customers may have mixed breeds or rare breeds not in the dropdown
2. **Database Design**: The `breed_custom` field exists specifically for this use case
3. **Flexibility**: Allows both structured (breed_id) and unstructured (breed_custom) data

### Database Schema Support

```sql
-- pets table structure
CREATE TABLE pets (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  breed_id UUID REFERENCES breeds(id),  -- Nullable FK
  breed_custom TEXT,                     -- Free-text custom breed
  size TEXT NOT NULL,
  weight NUMERIC,
  ...
);
```

The database schema explicitly supports:
- `breed_id IS NULL` when using custom breed names
- Both fields can be populated for reference (rare case)
- At least one is recommended but neither is strictly required

## Files Modified

1. `/Users/jonathanlee/Desktop/thepuppyday/src/app/api/appointments/route.ts`
   - Line 29: Added `.optional()` to `breed_id` in `new_pet` schema
   - Line 155: Changed `validated.new_pet.breed_id` to `validated.new_pet.breed_id || null`

## Testing Recommendations

### Manual Testing

1. **Test 1: Custom Breed Name**
   - Open booking modal on marketing page
   - Select service and date/time
   - Enter pet details:
     - Name: "Buddy"
     - Breed: Leave dropdown empty, enter "Golden Doodle" in custom field
     - Size: Medium
   - Complete booking
   - **Expected**: Appointment created successfully

2. **Test 2: Selected Breed**
   - Same flow as Test 1
   - Select "Golden Retriever" from breed dropdown
   - **Expected**: Appointment created successfully

3. **Test 3: No Breed Info**
   - Same flow as Test 1
   - Leave both breed dropdown and custom field empty
   - **Expected**: Appointment created successfully

### Automated Testing

Consider adding unit tests for the validation schema:

```typescript
// src/app/api/appointments/__tests__/validation.test.ts
describe('Appointment Request Schema', () => {
  it('should accept new_pet without breed_id', () => {
    const result = appointmentRequestSchema.safeParse({
      new_pet: {
        name: 'Buddy',
        breed_custom: 'Golden Doodle',
        size: 'medium',
      },
      // ... other required fields
    });
    expect(result.success).toBe(true);
  });
});
```

## Related Issues

This fix aligns with the existing patterns in:
- Admin appointment creation (`/api/admin/appointments`)
- Direct pet creation (`/api/pets`)

All three endpoints now consistently treat `breed_id` as optional.

## Status

- ✅ **Fixed**: Validation schema updated
- ✅ **Tested**: Zod schema validation passes
- ⏳ **Pending**: Manual user testing in staging/production
- ⏳ **Pending**: Automated test coverage

## Impact

- **Severity**: High - Blocked all guest bookings with custom breeds
- **Affected Users**: All customers booking through marketing page
- **Frequency**: Every booking with custom breed name
- **Fix Complexity**: Low - Two-line change
- **Risk**: Minimal - Makes validation more permissive (safe direction)
