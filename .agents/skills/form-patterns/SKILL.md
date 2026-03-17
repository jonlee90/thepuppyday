---
name: form-patterns
description: Enforces consistent form handling patterns for The Puppy Day — React Hook Form + Zod for complex forms, toast notifications on every mutation, and validation patterns. Auto-invoke when creating or modifying forms, handling form submissions, or implementing mutation feedback.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# Form Patterns

Consistent form handling, validation, and user feedback patterns for The Puppy Day.

## When to Apply

Reference these patterns when:
- Creating new forms or form components
- Adding validation to form fields
- Handling form submissions (POST/PUT/PATCH/DELETE)
- Implementing success/error feedback

## Rule 1: Form Complexity Decision

| Form Type | Fields | Pattern | Validation |
|-----------|--------|---------|------------|
| Complex form | 3+ fields | React Hook Form + Zod | Zod schema |
| Simple form | 1-2 fields | `useState` | Inline check |
| Inline edit | Single value | `useState` | Inline check |

## Rule 2: Complex Form Pattern (React Hook Form + Zod)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

// 1. Define Zod schema
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
  // 2. Initialize React Hook Form with Zod resolver
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

  // 3. Submit handler with toast feedback
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
      reset(data); // Reset dirty state
      onSuccess();
    } catch (err) {
      console.error('[ServiceForm] Submit error:', err);
      toast.error(
        initialData ? 'Failed to update service' : 'Failed to create service'
      );
    }
  };

  // 4. Render with field-level errors
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          {...register('name')}
          className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
        />
        {errors.name && (
          <label className="label">
            <span className="label-text-alt text-error">{errors.name.message}</span>
          </label>
        )}
      </div>

      {/* ... more fields ... */}

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

## Rule 3: Simple Form Pattern (useState)

```typescript
'use client';

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function QuickNoteForm({ appointmentId, onSuccess }: QuickNoteFormProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) return; // Simple inline validation

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
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSaving || !note.trim()}
        aria-busy={isSaving}
      >
        {isSaving ? 'Saving...' : 'Add'}
      </button>
    </form>
  );
}
```

## Rule 4: Toast Notifications — MANDATORY

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
toast.success('Add-on created');
toast.success('Settings saved');
```

### Error Messages ("Failed to ..." format)
```typescript
toast.error('Failed to confirm appointment');
toast.error('Failed to update customer');
toast.error('Failed to delete record');
```

### Required For
- ALL `POST` / `PUT` / `PATCH` / `DELETE` API calls from client components
- ALL Supabase `.insert()`, `.update()`, `.upsert()`, `.delete()` from client components
- ALL form submissions that write to the database

### Pattern
```typescript
try {
  const res = await fetch('/api/...', { method: 'POST', ... });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || `HTTP ${res.status}`);
  }
  toast.success('Done!');
} catch (err) {
  console.error('[ComponentName] action error:', err);
  toast.error('Failed to complete action');
}
```

## Rule 5: Delete Confirmation Pattern

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

## Rule 6: Zod Schema Location

| Scope | Location |
|-------|----------|
| Form-specific (used once) | Same file as the form component |
| API route validation | Same file as the API route |
| Shared (used by form + API) | `src/lib/validation/schemas.ts` |

## Rule 7: Error Display

| Error Type | Display Method |
|------------|---------------|
| Field validation error | Inline below field (`label-text-alt text-error`) |
| API error on submit | Toast notification |
| Auth error | Redirect to login or toast |
| Network error | Toast with retry option |

## Audit Checklist

- [ ] Complex forms (3+ fields) use React Hook Form + Zod
- [ ] Every mutation shows a toast (success AND error)
- [ ] Success messages are past tense and specific
- [ ] Error messages use "Failed to ..." format
- [ ] Delete operations have confirmation dialog
- [ ] Submit buttons show loading state with `aria-busy`
- [ ] Submit buttons are disabled during submission
- [ ] `console.error` with component context tag in catch blocks

## Reference Files

- `src/hooks/use-toast.ts` — Toast notification hook
- `src/components/admin/addons/AddOnForm.tsx` — Complex form (needs migration to RHF)
- `src/app/api/admin/appointments/route.ts` — Zod schema example
