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
- [ ] ServiceStep uses useServices hook instead of getMockStore
- [ ] PetStep uses usePets hook instead of getMockStore
- [ ] DateTimeStep uses useAvailability hook instead of getMockStore
- [ ] AddonsStep uses useAddons hook instead of getMockStore
- [ ] All steps handle loading states with skeletons
- [ ] All steps handle error states with retry option
- [ ] Existing functionality preserved (selection, navigation, etc.)
- [ ] No direct getMockStore imports in step components

## Estimated Complexity
Medium

## Phase
Phase 3: Booking Page & Integration

## Dependencies
- Task 3 (data fetching hooks)
- Task 4, 5, 6, 7 (API endpoints)
