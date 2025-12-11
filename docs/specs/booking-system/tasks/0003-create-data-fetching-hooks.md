# Task 3: Create Data Fetching Hooks

## Description
Create React hooks for fetching services, add-ons, availability, and pets data. These hooks will abstract the data layer and support both mock mode and future API integration.

## Files to create
- `src/hooks/useServices.ts`
- `src/hooks/useAddons.ts`
- `src/hooks/useAvailability.ts`
- `src/hooks/usePets.ts`
- `src/hooks/index.ts`

## Requirements References
- Req 2.1: Display all active services
- Req 3.1: Display user's existing active pets
- Req 4.2: Display available time slots for selected date
- Req 5.1: Display all active add-ons

## Implementation Details

### useServices Hook
```typescript
interface UseServicesReturn {
  services: ServiceWithPrices[];
  isLoading: boolean;
  error: Error | null;
  getServiceById: (id: string) => ServiceWithPrices | undefined;
}
```
- Fetch active services with prices from mock store or API
- Sort by display_order
- Cache results during session

### useAddons Hook
```typescript
interface UseAddonsReturn {
  addons: Addon[];
  isLoading: boolean;
  error: Error | null;
  getUpsellAddons: (breedId: string | null) => Addon[];
}
```
- Fetch active add-ons from mock store or API
- Filter upsell add-ons by breed match
- Sort by display_order

### useAvailability Hook
```typescript
interface UseAvailabilityParams {
  date: string | null;
  serviceId: string | null;
}

interface UseAvailabilityReturn {
  slots: TimeSlot[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```
- Fetch available time slots for date/service combination
- Use availability utility functions
- Support refetch for real-time updates

### usePets Hook
```typescript
interface UsePetsReturn {
  pets: Pet[];
  isLoading: boolean;
  error: Error | null;
  createPet: (data: CreatePetInput) => Promise<Pet>;
  refetch: () => Promise<void>;
}
```
- Fetch authenticated user's active pets
- Support creating new pet during booking
- Handle unauthenticated users gracefully (return empty array)

## Acceptance Criteria
- [ ] useServices returns active services with prices
- [ ] useAddons returns active add-ons with upsell filtering
- [ ] useAvailability returns time slots for date/service
- [ ] usePets returns user's pets or empty array for guests
- [ ] All hooks have proper loading and error states
- [ ] All hooks support mock mode via getMockStore()
- [ ] Types exported for use in components

## Estimated Complexity
Medium

## Phase
Phase 1: Foundation & Data Layer

## Dependencies
- Task 1 (availability utility functions)
- Task 2 (mock data)
