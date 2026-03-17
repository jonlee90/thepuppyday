---
name: state-patterns
description: Enforces consistent Zustand store patterns and state management decisions for The Puppy Day. Auto-invoke when creating Zustand stores, managing client-side state, or deciding between state management approaches.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# State Management Patterns

Consistent Zustand store structure and state management decisions for The Puppy Day.

## When to Apply

Reference these patterns when:
- Creating new Zustand stores
- Modifying existing stores
- Deciding how to manage component state
- Adding persistence to stores

## Rule 1: When to Use What

| State Type | Solution | Example |
|------------|----------|---------|
| UI state (single component) | `useState` | Modal open/close, form inputs |
| UI state (few siblings) | Props / lifting state | Selected tab shared between panels |
| URL-driven state | `searchParams` / URL | Filters, pagination, active tab |
| Cross-component state | Zustand store | Booking wizard, auth state |
| Server data | Server Component / fetch | Page-level data, initial load |
| Server data + client updates | `useState` with initial props | Lists with client-side filtering |

**Default to the simplest option.** Only use Zustand when state must be shared across unrelated components.

## Rule 2: Store Structure

Separate `State` (data) and `Actions` (methods) interfaces:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. State interface — data only
export interface BookingState {
  currentStep: number;
  selectedServiceId: string | null;
  selectedDate: string | null;
}

// 2. Actions interface — methods only
export interface BookingActions {
  setCurrentStep: (step: number) => void;
  selectService: (serviceId: string) => void;
  selectDate: (date: string) => void;
  reset: () => void;
}

// 3. Combined type
type BookingStore = BookingState & BookingActions;

// 4. Initial state (reusable for reset)
const initialState: BookingState = {
  currentStep: 0,
  selectedServiceId: null,
  selectedDate: null,
};

// 5. Store creation
export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),
      selectService: (serviceId) => set({ selectedServiceId: serviceId }),
      selectDate: (date) => set({ selectedDate: date }),
      reset: () => set(initialState),
    }),
    {
      name: 'booking-store',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
```

## Rule 3: Action Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `setX` | Simple setter | `setCurrentStep(step)` |
| `selectX` | User selection action | `selectService(serviceId)` |
| `resetX` / `reset` | Reset to initial state | `reset()`, `resetFilters()` |
| `fetchX` | Async data loading | `fetchAppointments()` |
| `addX` | Add to collection | `addAddon(addon)` |
| `removeX` | Remove from collection | `removeAddon(addonId)` |
| `toggleX` | Boolean toggle | `toggleSidebar()` |
| `updateX` | Partial update | `updateCustomer(partial)` |

## Rule 4: Persistence

| Storage | When to Use | Example |
|---------|-------------|---------|
| `sessionStorage` | Ephemeral (dies with tab) | Booking wizard state, form progress |
| `localStorage` | Persistent across sessions | Admin sidebar preference, theme |
| None | Transient (dies with navigation) | Loading states, temporary UI state |

Always specify `name` and `version`:
```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'store-name',     // Unique key in storage
    version: 1,              // Bump on breaking changes
    storage: createJSONStorage(() => sessionStorage),
  }
)
```

## Rule 5: Store File Naming

```
src/stores/
├── bookingStore.ts     // camelCase with 'Store' suffix
├── admin-store.ts      // kebab-case also acceptable
├── auth-store.ts       // Prefer one convention per project
```

Hook naming: `useXStore` (e.g., `useBookingStore`, `useAdminStore`).

## Rule 6: Selectors for Performance

Use selectors to prevent unnecessary re-renders:

```typescript
// CORRECT — only re-renders when currentStep changes
const currentStep = useBookingStore((state) => state.currentStep);

// WRONG — re-renders on ANY store change
const store = useBookingStore();
const currentStep = store.currentStep;
```

## Audit Checklist

- [ ] Separate `State` and `Actions` interfaces
- [ ] `initialState` object defined for reset functionality
- [ ] Action names follow the naming convention
- [ ] Persist middleware specifies `name` and `version`
- [ ] Components use selectors (not full store destructuring)
- [ ] Store has a `reset()` action

## Reference Files

- `src/stores/bookingStore.ts` — Well-structured store (reference pattern)
- `src/stores/admin-store.ts` — Admin panel state
