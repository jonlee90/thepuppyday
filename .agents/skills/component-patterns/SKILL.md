---
name: component-patterns
description: Enforces consistent React 19 component patterns for The Puppy Day — props typing, file structure, data fetching strategy, hooks, loading states, and Suspense boundaries. Auto-invoke when creating or modifying React components, custom hooks, or pages.
metadata:
  author: thepuppyday
  version: "2.0.0"
---

# Component Patterns

Consistent patterns for React 19 components, hooks, and pages in The Puppy Day (Next.js 16).

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

## Rule 2: React 19 — ref is a Regular Prop (NO forwardRef)

In React 19, `forwardRef` is DEPRECATED. Pass `ref` directly as a prop:

```typescript
// CORRECT (React 19) — ref as a regular prop
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
  error?: string;
}

function Input({ ref, label, error, ...props }: InputProps) {
  return (
    <div className="form-control">
      <label className="label"><span className="label-text">{label}</span></label>
      <input ref={ref} className="input input-bordered" {...props} />
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
}

// WRONG (deprecated) — do NOT use forwardRef in new code
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => { ... });
```

## Rule 3: Component File Structure

Follow this order in every component file:

```typescript
// 1. 'use client' directive (if client component)
'use client';

// 2. Imports (grouped: react, next, third-party, local components, hooks, types, utils)
import { useState, useCallback, use } from 'react';
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

// 4. Component definition
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

## Rule 4: Server vs Client Components

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

**Push `'use client'` as deep as possible.** Pages should be Server Components that pass data to Client Component children.

**Data fetching strategy:**
```typescript
// Server Component page — fetches data directly
export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('users').select('*').eq('role', 'customer');

  return <CustomerList initialData={data ?? []} />;
}

// Client Component — receives data, handles interaction
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

## Rule 5: React 19 use() Hook

The `use()` hook can read promises and context CONDITIONALLY (unlike other hooks):

```typescript
import { use } from 'react';

// Read context conditionally
function UserProfile({ userId }: { userId?: string }) {
  if (!userId) return <div>No user selected</div>;
  const theme = use(ThemeContext); // OK — conditional call allowed with use()
  return <div className={theme.className}>...</div>;
}
```

**When to use `use()` vs `useContext()`:**
- `use()` — When you need conditional context reading
- `useContext()` — Standard unconditional context reading (still valid)

## Rule 6: Suspense Boundaries for Loading States

Use nested Suspense boundaries for independent loading states:

```typescript
import { Suspense } from 'react';

// Page with independent loading sections
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      <Suspense fallback={<div className="skeleton h-32 w-full rounded-xl" />}>
        <RevenueOverview />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<div className="skeleton h-48 w-full rounded-xl" />}>
          <TodayAppointments />
        </Suspense>

        <Suspense fallback={<div className="skeleton h-48 w-full rounded-xl" />}>
          <PendingActions />
        </Suspense>
      </div>
    </div>
  );
}
```

Use `loading.tsx` for full-page loading states, Suspense for section-level.

## Rule 7: Custom Hook Return Types

ALL custom hooks MUST return an object with consistent naming:

```typescript
interface UseResourceReturn {
  data: Resource[] | null;
  isLoading: boolean;      // ALWAYS 'isLoading', never 'loading'
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useResource(): UseResourceReturn {
  const [data, setData] = useState<Resource[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

NEVER use: `loading`, `submitting`, `fetching`.

## Rule 8: Loading States

```typescript
// Admin buttons — use AdminButton with isLoading prop
<AdminButton isLoading={isSaving} onClick={handleSave}>
  Save Changes
</AdminButton>

// Standard buttons (customer/marketing)
<button
  className="btn btn-primary"
  disabled={isSaving}
  aria-busy={isSaving}
  onClick={handleSave}
>
  {isSaving ? 'Saving...' : 'Save Changes'}
</button>

// Page-level loading (use loading.tsx or Suspense)
<div className="flex items-center justify-center min-h-[200px]">
  <span className="loading loading-spinner loading-lg text-primary" />
</div>

// Error state with retry
<div className="alert alert-error">
  <span>{error.message}</span>
  <button className="btn btn-sm" onClick={refetch}>Retry</button>
</div>
```

## Rule 9: Export Pattern

```typescript
// Shared components — named export
export function PetCard({ ... }: PetCardProps) { }

// Page components — default export
export default function CustomersPage() { }
export default async function CustomersPage() { } // Server component

// Hooks — named export with 'use' prefix
export function useAvailability() { }
```

## Rule 10: Accessibility

- All interactive elements must be keyboard accessible
- Use `aria-busy` on buttons during loading states
- Use `aria-label` for icon-only buttons
- Use semantic HTML: `<button>` not `<div onClick>`
- Use `role="status"` for loading indicators

## Audit Checklist

- [ ] Props interface named `ComponentNameProps`
- [ ] NO `forwardRef` in new code — use ref as prop (React 19)
- [ ] File structure follows the standard order
- [ ] `'use client'` only when needed, pushed as deep as possible
- [ ] Hooks return `isLoading` (not `loading`)
- [ ] Loading states use `aria-busy` and Suspense boundaries
- [ ] Admin buttons use `AdminButton` component
- [ ] Data fetching at page level (Server Component) when possible

## Reference Files

- `src/components/admin/ui/AdminButton.tsx` — Admin button component
- `src/hooks/useAvailability.ts` — Good hook pattern example
- `src/hooks/useBookingSubmit.ts` — Complex hook with mutation state
- `src/stores/bookingStore.ts` — Well-structured state with types
