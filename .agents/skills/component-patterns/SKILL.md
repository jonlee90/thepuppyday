---
name: component-patterns
description: Enforces consistent React component patterns for The Puppy Day — props typing, file structure, data fetching strategy, hooks, and loading states. Auto-invoke when creating or modifying React components, custom hooks, or pages.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# Component Patterns

Consistent patterns for React components, hooks, and pages in The Puppy Day.

## When to Apply

Reference these patterns when:
- Creating new React components or pages
- Defining component props interfaces
- Writing custom hooks
- Deciding between Server and Client components
- Implementing loading/error states

## Rule 1: Props Interface Naming

ALWAYS name props interfaces as `ComponentNameProps`. NEVER use bare `Props`.

```typescript
// CORRECT
interface CustomerProfileProps {
  customerId: string;
  onClose: () => void;
}

// WRONG
interface Props {
  customerId: string;
}
```

## Rule 2: Component File Structure

Follow this order in every component file:

```typescript
// 1. 'use client' directive (if client component)
'use client';

// 2. Imports (grouped: react, next, third-party, local components, hooks, types, utils)
import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { useAvailability } from '@/hooks/useAvailability';
import type { Pet } from '@/types/database';
import { formatDate } from '@/lib/utils';

// 3. Types/interfaces
interface PetCardProps {
  pet: Pet;
  onSelect: (petId: string) => void;
  isSelected?: boolean;
}

// 4. Component definition (named export preferred for pages, default for shared components)
export function PetCard({ pet, onSelect, isSelected = false }: PetCardProps) {
  // 4a. Hooks first
  const [isLoading, setIsLoading] = useState(false);

  // 4b. Handlers
  const handleSelect = useCallback(() => {
    onSelect(pet.id);
  }, [pet.id, onSelect]);

  // 4c. Render
  return (/* JSX */);
}
```

## Rule 3: Server vs Client Components

**Use Server Components (default) for:**
- Page-level data fetching (`page.tsx` files)
- Static layouts and wrappers
- Components that don't need interactivity or browser APIs

**Use Client Components (`'use client'`) for:**
- User interaction (onClick, onChange, onSubmit)
- Browser APIs (localStorage, window, document)
- React hooks (useState, useEffect, useRef)
- Framer Motion animations
- Third-party client libraries

**Data fetching strategy:**
```typescript
// Server Component page — fetches data
export default async function CustomersPage() {
  // Fetch at page level
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/customers`);
  const { data } = await response.json();

  // Pass to client component
  return <CustomerList initialData={data} />;
}

// Client Component — receives data as props, handles interaction
'use client';
function CustomerList({ initialData }: CustomerListProps) {
  const [data, setData] = useState(initialData);
  // ... interaction logic
}
```

**Exception:** Client components MAY fetch their own data when:
- Data is user-triggered (search, filter, pagination)
- Data requires real-time updates
- Component is a modal/dialog that loads on demand

## Rule 4: Custom Hook Return Types

ALL custom hooks MUST return an object with consistent naming:

```typescript
// Standard hook return interface
interface UseResourceReturn {
  data: Resource[] | null;
  isLoading: boolean;      // ALWAYS 'isLoading', never 'loading'
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useResource(): UseResourceReturn {
  const [data, setData] = useState<Resource[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);   // true initially
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resources');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, isLoading, error, refetch };
}
```

**Naming conventions:**
| Name | Purpose |
|------|---------|
| `isLoading` | Data fetching in progress |
| `isSaving` | Mutation/submit in progress |
| `isDeleting` | Delete operation in progress |
| `error` | Error state (Error object or null) |
| `refetch` | Re-run the data fetch |

NEVER use: `loading`, `submitting`, `fetching`, `isSubmitting` (except in form context with React Hook Form).

## Rule 5: Loading States

```typescript
// Buttons — use AdminButton with isLoading prop (admin)
<AdminButton isLoading={isSaving} onClick={handleSave}>
  Save Changes
</AdminButton>

// Buttons — standard pattern (customer/marketing)
<button
  className="btn btn-primary"
  disabled={isSaving}
  aria-busy={isSaving}
  onClick={handleSave}
>
  {isSaving ? 'Saving...' : 'Save Changes'}
</button>

// Page-level loading
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

// Error state
if (error) {
  return (
    <div className="alert alert-error">
      <span>{error.message}</span>
      <button className="btn btn-sm" onClick={refetch}>Retry</button>
    </div>
  );
}
```

## Rule 6: Export Pattern

```typescript
// Shared components — named export
export function PetCard({ ... }: PetCardProps) { }

// Page components — default export
export default function CustomersPage() { }
export default async function CustomersPage() { } // Server component

// Hooks — named export with 'use' prefix
export function useAvailability() { }
```

## Rule 7: Accessibility

- All interactive elements must be keyboard accessible
- Use `aria-busy` on buttons during loading states
- Use `aria-label` for icon-only buttons
- Use semantic HTML: `<button>` not `<div onClick>`
- Use `role="status"` for loading indicators

## Audit Checklist

- [ ] Props interface named `ComponentNameProps`
- [ ] File structure follows the standard order
- [ ] `'use client'` only when needed
- [ ] Hooks return `isLoading` (not `loading`)
- [ ] Loading states use `aria-busy`
- [ ] Admin buttons use `AdminButton` component
- [ ] Data fetching at page level when possible

## Reference Files

- `src/components/admin/ui/AdminButton.tsx` — Admin button component
- `src/hooks/useAvailability.ts` — Good hook pattern example
- `src/hooks/useBookingSubmit.ts` — Complex hook with mutation state
- `src/stores/bookingStore.ts` — Well-structured state with types
