---
name: form-patterns
description: Enforces consistent form handling patterns for The Puppy Day — Server Actions for mutations, React Hook Form + Zod for complex client forms, useActionState for progressive enhancement, and toast notifications on every mutation. Auto-invoke when creating or modifying forms, handling form submissions, or implementing mutation feedback.
metadata:
  author: thepuppyday
  version: "2.0.0"
---

# Form Patterns

Consistent form handling, validation, and user feedback patterns for The Puppy Day.
Updated for Next.js 16 + React 19.

## When to Apply

Reference these patterns when:
- Creating new forms or form components
- Adding validation to form fields
- Handling form submissions (create/update/delete)
- Implementing success/error feedback

## Rule 1: Form Approach Decision (Next.js 16 + React 19)

| Scenario | Approach | Why |
|----------|----------|-----|
| **New mutation form** | Server Action + `useActionState` | Progressive enhancement, type-safe, no API route needed |
| **Existing form calling API route** | Keep as-is, migrate gradually | Don't break working code |
| **Complex multi-step form** | React Hook Form + Zod | Better UX for step validation, field-level errors |
| **Simple 1-2 field form** | `useState` or Server Action | Minimal overhead |
| **Form serving external API** | API route + React Hook Form | External consumers need HTTP endpoints |

## Rule 2: Server Action Form Pattern (PREFERRED for new forms)

```typescript
// src/app/actions/services.ts
'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.coerce.number().int().min(15).max(480),
});

export async function createService(prevState: unknown, formData: FormData) {
  // 1. Auth
  const authSupabase = await createServerSupabaseClient();
  await requireAdmin(authSupabase);
  const supabase = createServiceRoleClient();

  // 2. Validate with Zod
  const parsed = CreateServiceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    duration_minutes: formData.get('duration_minutes'),
  });

  if (!parsed.success) {
    return { error: 'Validation error', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 3. Mutate
  const { data, error } = await supabase
    .from('services')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { error: 'Failed to create service' };

  // 4. Revalidate cache
  revalidateTag('services');
  return { success: true, data };
}
```

```typescript
// src/components/admin/services/ServiceForm.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createService } from '@/app/actions/services';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Submit button as child component (required for useFormStatus)
function SubmitButton({ label = 'Create' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? 'Saving...' : label}
    </button>
  );
}

export function ServiceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction] = useActionState(createService, null);

  // Toast feedback on state changes
  useEffect(() => {
    if (state?.success) {
      toast.success('Service created');
      onSuccess?.();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          name="name"
          className={`input input-bordered ${state?.fieldErrors?.name ? 'input-error' : ''}`}
          required
        />
        {state?.fieldErrors?.name && (
          <p className="text-error text-sm mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* ... more fields ... */}

      <SubmitButton />
    </form>
  );
}
```

## Rule 3: React Hook Form + Zod Pattern (for complex client-side forms)

Use when: multi-step forms, dynamic field arrays, complex validation interdependencies, or forms with 5+ fields needing real-time validation.

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

const ServiceFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.number().int().min(15).max(480),
  is_active: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof ServiceFormSchema>;

interface ServiceFormProps {
  initialData?: ServiceFormData;
  onSuccess: () => void;
}

export function ServiceForm({ initialData, onSuccess }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      duration_minutes: 60,
      is_active: true,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const res = await fetch('/api/admin/services', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || `HTTP ${res.status}`);
      }

      toast.success(initialData ? 'Service updated' : 'Service created');
      reset(data);
      onSuccess();
    } catch (err) {
      console.error('[ServiceForm] Submit error:', err);
      toast.error(initialData ? 'Failed to update service' : 'Failed to create service');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <fieldset disabled={isSubmitting}>
        <div className="form-control">
          <label className="label"><span className="label-text">Name</span></label>
          <input
            {...register('name')}
            className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        {/* ... more fields ... */}
      </fieldset>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting || !isDirty}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

**Key difference from Server Actions**: Use `<fieldset disabled={isSubmitting}>` to disable all fields during submission.

## Rule 4: Simple Form Pattern (useState)

For 1-2 field forms where the overhead of RHF or Server Actions isn't justified:

```typescript
'use client';

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function QuickNoteForm({ appointmentId, onSuccess }: QuickNoteFormProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success('Note added');
      setNote('');
      onSuccess();
    } catch (err) {
      console.error('[QuickNoteForm] Submit error:', err);
      toast.error('Failed to add note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input input-bordered flex-1"
        placeholder="Add a note..."
      />
      <button type="submit" className="btn btn-primary" disabled={isSaving || !note.trim()} aria-busy={isSaving}>
        {isSaving ? 'Saving...' : 'Add'}
      </button>
    </form>
  );
}
```

## Rule 5: Toast Notifications — MANDATORY

**EVERY database mutation MUST show a toast notification.** No exceptions.

### Import
```typescript
import { toast } from '@/hooks/use-toast';
```

### Success Messages (past tense, short, specific)
```typescript
toast.success('Appointment confirmed');
toast.success('Customer updated');
toast.success('Record deleted');
```

### Error Messages ("Failed to ..." format)
```typescript
toast.error('Failed to confirm appointment');
toast.error('Failed to update customer');
```

### Required For
- ALL Server Action results (check state in useEffect)
- ALL `fetch` POST/PUT/PATCH/DELETE calls from client components
- ALL Supabase `.insert()`, `.update()`, `.delete()` from client components
- ALL form submissions that write to the database

### Server Action Toast Pattern
```typescript
useEffect(() => {
  if (state?.success) toast.success('Saved successfully');
  if (state?.error) toast.error(state.error);
}, [state]);
```

## Rule 6: React 19 useOptimistic Pattern

For instant UI feedback before the server responds:

```typescript
'use client';

import { useOptimistic } from 'react';
import { toggleFavorite } from '@/app/actions/favorites';

export function FavoriteButton({ petId, isFavorited }: FavoriteButtonProps) {
  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(isFavorited);

  const handleToggle = async () => {
    setOptimisticFavorited(!optimisticFavorited);
    await toggleFavorite(petId);
  };

  return (
    <form action={handleToggle}>
      <button type="submit">
        {optimisticFavorited ? 'Unfavorite' : 'Favorite'}
      </button>
    </form>
  );
}
```

## Rule 7: Delete Confirmation Pattern

Always confirm before delete:

```typescript
const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this item?')) return;

  setIsDeleting(true);
  try {
    const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    toast.success('Item deleted');
    onSuccess();
  } catch (err) {
    console.error('[Component] Delete error:', err);
    toast.error('Failed to delete item');
  } finally {
    setIsDeleting(false);
  }
};
```

## Rule 8: Zod Schema Location

| Scope | Location |
|-------|----------|
| Server Action validation | Same file as the action (`src/app/actions/`) |
| Form-specific client validation | Same file as the form component |
| Shared (used by action + client form) | `src/lib/validation/schemas.ts` |
| API route validation | Same file as the API route |

## Rule 9: Error Display

| Error Type | Display Method |
|------------|---------------|
| Field validation error | Inline below field (`text-error text-sm mt-1`) |
| Server Action error | Toast notification (via useEffect on state) |
| API error on submit | Toast notification |
| Auth error | Redirect to login or toast |

## Rule 10: useFormStatus Must Be a Child Component

`useFormStatus()` ONLY works when called from a component that is a **child** of the `<form>` element. It does NOT work in the same component that uses `useActionState`.

```typescript
// CORRECT — SubmitButton is a child component
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

function MyForm() {
  const [state, formAction] = useActionState(myAction, null);
  return (
    <form action={formAction}>
      <input name="field" />
      <SubmitButton /> {/* Child component — useFormStatus works here */}
    </form>
  );
}
```

## Audit Checklist

- [ ] New mutation forms use Server Actions when possible
- [ ] Complex forms (5+ fields) use React Hook Form + Zod
- [ ] Every mutation shows a toast (success AND error)
- [ ] Success messages are past tense and specific
- [ ] Error messages use "Failed to ..." format
- [ ] Delete operations have confirmation dialog
- [ ] Submit buttons show loading state with `aria-busy`
- [ ] `useFormStatus` is in a child component, not the form component
- [ ] Server Action results checked in `useEffect` for toast feedback

## Reference Files

- `src/hooks/use-toast.ts` — Toast notification hook
- `src/app/api/admin/appointments/route.ts` — Zod schema example
- `src/components/booking/GuestInfoForm.tsx` — React Hook Form example
