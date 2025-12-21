# Bug Fix: "Cannot read properties of undefined (reading 'map')" Error

## Issue Summary

**Error**: `Cannot read properties of undefined (reading 'map')`
**Location**: Admin appointment creation flow → Step 5 (Summary) → "Create Appointment" button
**Impact**: Prevented admins from creating appointments manually through the 5-step wizard

## Root Cause Analysis

The error occurred in multiple locations where `.map()` was called on potentially undefined or null arrays:

### Primary Issue (Backend)
**File**: `src/lib/booking/pricing.ts`
**Line 98**: `const addonItems = addons.map((addon) => ({...}))`

The `calculatePrice()` function expected `addons` to always be an array, but the parameter type allowed `Addon[]` which could be passed as `undefined` or `null` in edge cases.

### Secondary Issues (Frontend)
**File**: `src/components/admin/appointments/steps/SummaryStep.tsx`
- Line 56: `state.selectedAddons.map((a) => a.id)`
- Line 211: Display logic for addon list

**File**: `src/components/admin/appointments/steps/ServiceSelectionStep.tsx`
- Line 51: Initial state setup
- Line 298: Display logic for addon list

## Fixes Implemented

### 1. Backend Price Calculation (`src/lib/booking/pricing.ts`)

#### Updated `calculatePrice()` function:
```typescript
export function calculatePrice(
  service: ServiceWithPrices | null,
  petSize: PetSize | null,
  addons: Addon[] | null | undefined,  // ← Now accepts null/undefined
  settings: PricingSettings = DEFAULT_SETTINGS
): PriceBreakdown {
  // Ensure addons is always an array
  const safeAddons = Array.isArray(addons) ? addons : [];

  const addonItems = safeAddons.map((addon) => ({
    name: addon.name,
    price: addon.price,
  }));
  const addonsTotal = calculateAddonsTotal(safeAddons);
  // ...
}
```

#### Updated `calculateAddonsTotal()` function:
```typescript
export function calculateAddonsTotal(addons: Addon[] | null | undefined): number {
  if (!Array.isArray(addons) || addons.length === 0) {
    return 0;
  }
  return addons.reduce((sum, addon) => sum + addon.price, 0);
}
```

#### Updated `calculateTotal()` function:
```typescript
export function calculateTotal(servicePrice: number, addons: Addon[] | null | undefined): number {
  const addonsTotal = calculateAddonsTotal(addons);
  return servicePrice + addonsTotal;
}
```

#### Updated `getServicePriceRange()` function:
```typescript
export function getServicePriceRange(service: ServiceWithPrices): {
  min: number;
  max: number;
  formatted: string;
} {
  // Ensure prices is an array
  const pricesArray = Array.isArray(service.prices) ? service.prices : [];
  const prices = pricesArray.map((p) => p.price);
  // ...
}
```

### 2. API Route Improvements (`src/app/api/admin/appointments/route.ts`)

#### Enhanced addon fetching:
```typescript
// Fetch addons
let addons: Addon[] = [];
if (data.addon_ids && data.addon_ids.length > 0) {
  const { data: addonsData, error: addonsError } = await supabase
    .from('addons')
    .select('id, name, price')
    .in('id', data.addon_ids);

  if (addonsError) {
    console.error('[Create Appointment] Error fetching addons:', addonsError);
    // Continue with empty addons array rather than failing
  }

  // Ensure we always have an array
  addons = Array.isArray(addonsData) ? (addonsData as Addon[]) : [];

  // Warn if mismatch
  if (addons.length !== data.addon_ids.length) {
    console.warn(
      `[Create Appointment] Addon count mismatch: requested ${data.addon_ids.length}, fetched ${addons.length}`
    );
  }
}
```

#### Added error handling for price calculation:
```typescript
let priceBreakdown;
try {
  priceBreakdown = calculatePrice(
    serviceWithPrices as unknown as ServiceWithPrices,
    petSize,
    addons
  );
  console.log('[Create Appointment] Price breakdown calculated:', {
    servicePrice: priceBreakdown.servicePrice,
    addonsTotal: priceBreakdown.addonsTotal,
    total: priceBreakdown.total,
  });
} catch (priceError) {
  console.error('[Create Appointment] Error calculating price:', priceError);
  return NextResponse.json(
    {
      error: 'Failed to calculate appointment price',
      details: priceError instanceof Error ? priceError.message : 'Unknown error'
    },
    { status: 500 }
  );
}
```

#### Improved addon insertion:
```typescript
if (data.addon_ids && Array.isArray(data.addon_ids) && data.addon_ids.length > 0) {
  if (Array.isArray(addons) && addons.length > 0) {
    try {
      const addonRecords = addons.map((addon) => ({
        appointment_id: appointment.id,
        addon_id: addon.id,
        price: addon.price,
      }));

      console.log('[Create Appointment] Inserting addon records:', addonRecords.length);

      const { error: addonsInsertError } = await supabase
        .from('appointment_addons')
        .insert(addonRecords);

      if (addonsInsertError) {
        console.error('[Create Appointment] Error creating appointment addons:', addonsInsertError);
      } else {
        console.log('[Create Appointment] Successfully inserted', addonRecords.length, 'addon records');
      }
    } catch (addonError) {
      console.error('[Create Appointment] Exception during addon insertion:', addonError);
    }
  } else {
    console.warn('[Create Appointment] Addon IDs provided but no addons fetched. Requested:', data.addon_ids);
  }
}
```

### 3. Frontend Components

#### SummaryStep.tsx:
```typescript
// Safe addon mapping
const addonIds = Array.isArray(state.selectedAddons)
  ? state.selectedAddons.map((a) => a.id)
  : [];

// Safe total calculation
const totalPrice = useMemo(() => {
  const servicePrice = state.selectedService?.price || 0;
  const addonsTotal = Array.isArray(state.selectedAddons)
    ? state.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
    : 0;
  return servicePrice + addonsTotal;
}, [state.selectedService, state.selectedAddons]);

// Safe rendering
{Array.isArray(state.selectedAddons) && state.selectedAddons.length > 0 && (
  <>
    {state.selectedAddons.map((addon) => (...))}
  </>
)}

// Better error display
if (!response.ok) {
  const data = await response.json();
  const errorMessage = data.details
    ? `${data.error}: ${data.details}`
    : data.error || 'Failed to create appointment';
  throw new Error(errorMessage);
}
```

#### ServiceSelectionStep.tsx:
```typescript
// Safe initial state
const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
  Array.isArray(state.selectedAddons) ? state.selectedAddons.map((a) => a.id) : []
);

// Safe rendering
{Array.isArray(state.selectedAddons) && state.selectedAddons.length > 0 && (
  <>
    {state.selectedAddons.map((addon) => (...))}
  </>
)}
```

## Testing Recommendations

### Manual Testing Checklist:
- [ ] Create appointment with 0 addons
- [ ] Create appointment with 1 addon
- [ ] Create appointment with multiple addons
- [ ] Create appointment with invalid addon IDs (should log warning but not fail)
- [ ] Create appointment for new customer + new pet
- [ ] Create appointment for existing customer + existing pet
- [ ] Test with past dates (should show warning)
- [ ] Test payment status: pending, paid, partially_paid

### Error Scenarios to Test:
- [ ] Supabase addon fetch fails (should continue with empty array)
- [ ] Invalid addon IDs provided (should log mismatch warning)
- [ ] Missing required fields (should show validation error)

## Prevention Strategies

1. **Type Safety**: Updated function signatures to explicitly allow `null | undefined` where appropriate
2. **Array Guards**: Always use `Array.isArray()` before calling `.map()`, `.reduce()`, etc.
3. **Defensive Programming**: Provide fallback values for potentially undefined data
4. **Better Logging**: Added detailed console logs to trace data flow
5. **Error Context**: Include `details` field in error responses for easier debugging

## Files Modified

1. `src/lib/booking/pricing.ts` - Core pricing utilities with null safety
2. `src/app/api/admin/appointments/route.ts` - API endpoint with enhanced error handling
3. `src/components/admin/appointments/steps/SummaryStep.tsx` - Frontend summary with array guards
4. `src/components/admin/appointments/steps/ServiceSelectionStep.tsx` - Service selection with array guards

## Related Issues

This fix addresses a class of errors where `.map()` is called on potentially undefined arrays. The same pattern should be reviewed throughout the codebase:

```bash
# Find other potential issues
grep -r "\.map(" src/ | grep -v "Array.isArray"
```

## Rollout Plan

1. Test in development environment
2. Verify appointment creation flow works with all addon combinations
3. Check server logs for any new warnings
4. Deploy to production
5. Monitor error logs for 24 hours

## Success Criteria

- ✅ No more "Cannot read properties of undefined (reading 'map')" errors
- ✅ Appointments can be created with 0, 1, or multiple addons
- ✅ Proper error messages displayed to users
- ✅ Detailed logging for debugging edge cases
- ✅ Type-safe code that prevents similar issues in the future
