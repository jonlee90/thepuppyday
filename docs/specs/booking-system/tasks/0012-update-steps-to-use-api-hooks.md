# Task 12: Update Step Components to Use API Hooks

## Description
Refactor the existing step components to use the new data fetching hooks instead of directly accessing the mock store. This improves code organization and prepares for future API integration.

## Files to modify
- `src/components/booking/steps/ServiceStep.tsx`
- `src/components/booking/steps/PetStep.tsx`
- `src/components/booking/steps/DateTimeStep.tsx`
- `src/components/booking/steps/AddonsStep.tsx`

## Requirements References
- Req 2.1: Display all active services
- Req 3.1: Display user's existing active pets
- Req 4.2: Display available time slots
- Req 5.1: Display all active add-ons

## Implementation Details

### ServiceStep Updates
Replace:
```typescript
// Before
import { getMockStore } from '@/mocks/supabase/store';
const store = getMockStore();
const servicesData = store.select('services', { ... });
```

With:
```typescript
// After
import { useServices } from '@/hooks/useServices';
const { services, isLoading, error } = useServices();
```

### PetStep Updates
Replace direct mock store access with:
```typescript
import { usePets } from '@/hooks/usePets';
const { pets, isLoading, error, createPet } = usePets();
```

### DateTimeStep Updates
Replace availability calculation with:
```typescript
import { useAvailability } from '@/hooks/useAvailability';
const { slots, isLoading, error, refetch } = useAvailability({
  date: selectedDate,
  serviceId: selectedServiceId,
});
```

### AddonsStep Updates
Replace direct mock store access with:
```typescript
import { useAddons } from '@/hooks/useAddons';
const { addons, isLoading, error, getUpsellAddons } = useAddons();
```

### Error Handling Pattern
Each step should handle loading and error states consistently:
```typescript
if (isLoading) {
  return <StepSkeleton />;
}

if (error) {
  return (
    <div className="alert alert-error">
      <span>Failed to load data. Please try again.</span>
      <button onClick={refetch} className="btn btn-sm">Retry</button>
    </div>
  );
}
```

## Acceptance Criteria
- [x] ServiceStep uses useServices hook instead of getMockStore
- [x] PetStep uses usePets hook instead of getMockStore
- [x] DateTimeStep uses useAvailability hook instead of getMockStore
- [x] AddonsStep uses useAddons hook instead of getMockStore
- [x] All steps handle loading states with skeletons
- [x] All steps handle error states with retry option
- [x] Existing functionality preserved (selection, navigation, etc.)
- [x] No direct getMockStore imports in step components

## Estimated Complexity
Medium

## Phase
Phase 3: Booking Page & Integration

## Dependencies
- Task 3 (data fetching hooks)
- Task 4, 5, 6, 7 (API endpoints)

## Implementation Notes
**Status:** ✅ Completed

**Files Modified:**
- `src/components/booking/steps/ServiceStep.tsx` - Refactored to use useServices hook
- `src/components/booking/steps/PetStep.tsx` - Refactored to use usePets hook
- `src/components/booking/steps/DateTimeStep.tsx` - Refactored to use useAvailability hook
- `src/components/booking/steps/AddonsStep.tsx` - Refactored to use useAddons hook

**ServiceStep Changes:**
- Replaced `getMockStore()` with `useServices()` hook
- Added loading skeleton with professional pulse animation
- Added error state with retry functionality
- Maintained size-based pricing display
- Preserved service card interactions and animations

**PetStep Changes:**
- Replaced mock store with `usePets()` hook
- Added loading skeleton for pet cards
- Implemented comprehensive error handling with retry
- Fixed React Hook dependency array (pets.length instead of pets)
- Maintained pet selection, form display, and new pet creation flow
- Preserved authenticated vs guest user logic

**DateTimeStep Changes:**
- Replaced mock availability calculation with `useAvailability()` hook
- Added loading skeleton for calendar and time slots
- Implemented error handling with retry option
- Maintained calendar navigation and slot selection
- Preserved waitlist integration
- Fixed date formatting and timezone handling

**AddonsStep Changes:**
- Replaced mock store with `useAddons()` hook
- Added loading skeleton for addon cards
- Implemented error state with retry functionality
- Removed unused variables (newPetData)
- Maintained upsell recommendations logic
- Preserved addon selection and pricing display

**Consistent Error Handling Pattern:**
All steps now follow this pattern:
```typescript
if (isLoading) {
  return <StepSkeleton />;
}

if (error) {
  return (
    <ErrorDisplay
      message={error.message}
      onRetry={() => window.location.reload() || refetch()}
    />
  );
}
```

**Design System Compliance:**
- All skeletons use #EAE0D5 (warm cream) for placeholder backgrounds
- Error states use #EF4444 with 10% opacity backgrounds
- Maintained #434E54 (charcoal) for primary actions
- Consistent rounded corners (rounded-xl) and soft shadows

**Code Quality Improvements:**
- Removed all direct getMockStore imports
- Fixed linting issues (unused variables, React Hook warnings)
- Maintained TypeScript type safety throughout
- Preserved all existing functionality and user interactions
