# Settings Form Patterns Guide

**Task 0166: Site Content Form Patterns**

This guide explains how to use the shared form patterns for all settings editors in The Puppy Day admin panel.

## Overview

Three components work together to provide a consistent, professional form experience:

1. **`useSettingsForm`** - Custom hook for form state management
2. **`UnsavedChangesIndicator`** - Visual indicator for unsaved changes
3. **`LeaveConfirmDialog`** - Prevent accidental navigation with unsaved changes

## Quick Start

### Basic Usage

```tsx
'use client';

import { useSettingsForm } from '@/hooks/admin/use-settings-form';
import { UnsavedChangesIndicator } from '@/components/admin/settings/UnsavedChangesIndicator';
import { LeaveConfirmDialog } from '@/components/admin/settings/LeaveConfirmDialog';

interface MySettings {
  setting1: string;
  setting2: number;
}

export function MySettingsForm() {
  // 1. Initialize the form
  const form = useSettingsForm({
    initialData: {
      setting1: 'value',
      setting2: 42,
    },
    onSave: async (data) => {
      // Call API to save
      const response = await fetch('/api/admin/settings/my-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const result = await response.json();
      return result.data; // Return updated data
    },
    onSuccess: (data) => {
      console.log('Saved successfully:', data);
    },
    onError: (error) => {
      console.error('Save failed:', error);
    },
  });

  return (
    <div className="space-y-6">
      {/* 2. Add navigation protection */}
      <LeaveConfirmDialog
        isDirty={form.isDirty}
        isSaving={form.isSaving}
        onSave={form.save}
      />

      {/* 3. Add unsaved changes indicator */}
      <UnsavedChangesIndicator
        isDirty={form.isDirty}
        isSaving={form.isSaving}
        error={form.error}
        lastSaved={form.lastSaved}
        onSave={form.save}
        onDiscard={form.discard}
        onRetry={form.retry}
      />

      {/* 4. Build your form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <input
          type="text"
          value={form.data.setting1}
          onChange={(e) => form.updateData({ setting1: e.target.value })}
          className="input"
        />

        <input
          type="number"
          value={form.data.setting2}
          onChange={(e) => form.updateData({ setting2: parseInt(e.target.value) })}
          className="input"
        />

        {/* Optional: Manual save button */}
        <button
          onClick={() => form.save()}
          disabled={!form.isDirty || form.isSaving}
          className="btn"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
```

---

## `useSettingsForm` Hook

### Parameters

```tsx
interface UseSettingsFormOptions<T> {
  initialData: T;
  onSave: (data: T) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoSaveDelay?: number; // Optional: milliseconds
}
```

- **`initialData`**: Initial form state
- **`onSave`**: Async save handler. Must return updated data on success, throw on failure
- **`onSuccess`**: Optional callback on successful save
- **`onError`**: Optional callback on save failure
- **`autoSaveDelay`**: Optional delay in ms for auto-save (default: disabled)

### Return Values

```tsx
interface UseSettingsFormReturn<T> {
  data: T;                        // Current form data
  originalData: T;                // Original data (before changes)
  updateData: (partial: Partial<T>) => void;  // Update fields
  setData: (data: T) => void;     // Replace all data
  save: () => Promise<boolean>;   // Save changes
  retry: () => Promise<boolean>;  // Retry failed save
  discard: () => void;            // Discard changes
  reset: (newData: T) => void;    // Reset to new data
  isDirty: boolean;               // Has unsaved changes
  isSaving: boolean;              // Save in progress
  error: string | null;           // Save error message
  lastSaved: Date | null;         // Last save timestamp
}
```

### Features

#### Optimistic Updates with Rollback

The hook automatically handles optimistic UI updates. If save fails, it rolls back to the previous state:

```tsx
// User changes data
form.updateData({ name: 'new value' }); // UI updates immediately

// Save fails
await form.save(); // Automatically rolls back to previous state
```

#### Auto-Save

Enable auto-save by providing `autoSaveDelay`:

```tsx
const form = useSettingsForm({
  initialData,
  onSave: saveHandler,
  autoSaveDelay: 3000, // Auto-save 3 seconds after last change
});
```

Auto-save is automatically debounced - rapid changes reset the timer.

#### Retry Logic

If a save fails, users can retry:

```tsx
if (form.error) {
  // Show retry button
  <button onClick={() => form.retry()}>Retry</button>
}
```

---

## `UnsavedChangesIndicator` Component

### Props

```tsx
interface UnsavedChangesIndicatorProps {
  isDirty: boolean;
  isSaving?: boolean;
  error?: string | null;
  lastSaved?: Date | null;
  onSave: () => void;
  onDiscard: () => void;
  onRetry?: () => void;
  saveText?: string;    // Default: "Save Changes"
  discardText?: string; // Default: "Discard"
}
```

### States

The indicator shows different states automatically:

1. **Unsaved Changes** - Shows when `isDirty={true}` and no error
2. **Saving** - Shows when `isSaving={true}`
3. **Error** - Shows when `error` is present
4. **Success** - Shows when not dirty and `lastSaved` exists

### Placement

Place it in a sticky container at the top of your form:

```tsx
<div className="sticky top-0 z-10">
  <UnsavedChangesIndicator {...props} />
</div>
```

### Customization

```tsx
<UnsavedChangesIndicator
  isDirty={form.isDirty}
  onSave={form.save}
  onDiscard={form.discard}
  saveText="Apply Settings"
  discardText="Cancel"
/>
```

---

## `LeaveConfirmDialog` Component

### Props

```tsx
interface LeaveConfirmDialogProps {
  isDirty: boolean;
  isSaving?: boolean;
  onSave?: () => Promise<boolean>;
  message?: string;
}
```

### Features

#### Browser Navigation Protection

Automatically warns users when:
- Closing the browser tab
- Refreshing the page
- Navigating to external URL

#### Internal Navigation Protection

Intercepts clicks on internal links (`<a href="/...">`) and shows confirmation dialog.

#### Dialog Actions

Users can choose from three actions:

1. **Cancel** - Stay on current page
2. **Leave** - Navigate without saving
3. **Save & Leave** - Save changes then navigate (if `onSave` provided)

### Custom Warning Message

```tsx
<LeaveConfirmDialog
  isDirty={form.isDirty}
  message="Your custom warning message here"
/>
```

---

## Complete Example

See `src/components/admin/settings/SettingsFormExample.tsx` for a complete working example.

### Loading Initial Data from API

```tsx
export function MySettingsForm() {
  const [initialData, setInitialData] = useState<MySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/my-settings');
        const result = await response.json();
        setInitialData(result.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const form = useSettingsForm({
    initialData: initialData || getDefaultSettings(),
    onSave: saveHandler,
  });

  // Reset form when initial data loads
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    // ... form implementation
  );
}
```

### Validation

Add validation before saving:

```tsx
const handleSave = async () => {
  // Validate data
  if (!form.data.name || form.data.name.trim() === '') {
    alert('Name is required');
    return;
  }

  if (form.data.count < 0) {
    alert('Count must be positive');
    return;
  }

  // Save if valid
  await form.save();
};

// Use in button
<button onClick={handleSave}>Save</button>
```

Or use with react-hook-form for advanced validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  count: z.number().min(0, 'Must be positive'),
});

export function ValidatedSettingsForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const form = useSettingsForm({
    initialData,
    onSave: saveHandler,
  });

  const onSubmit = handleSubmit(async (data) => {
    form.setData(data);
    await form.save();
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit">Save</button>
    </form>
  );
}
```

---

## Design System

All components follow the **Clean & Elegant Professional** design system:

### Colors

- **Background**: `#F8EEE5` (warm cream)
- **Primary**: `#434E54` (charcoal)
- **Borders**: `border-[#434E54]/20` (subtle)
- **Success**: Green indicator
- **Warning**: `#FFB347` (warm orange)
- **Error**: Red

### Visual Style

- Soft shadows (`shadow-sm`, `shadow-md`)
- Rounded corners (`rounded-lg`, `rounded-xl`)
- Smooth transitions (`transition-colors duration-200`)
- Professional typography (semibold for headings, regular for body)

---

## Testing

All components have comprehensive test coverage:

- `__tests__/hooks/use-settings-form.test.ts`
- `__tests__/components/admin/settings/UnsavedChangesIndicator.test.tsx`
- `__tests__/components/admin/settings/LeaveConfirmDialog.test.tsx`

Run tests:

```bash
npm test
```

---

## Best Practices

1. **Always use all three components together** for consistency
2. **Place `LeaveConfirmDialog` at the top** of your component tree
3. **Place `UnsavedChangesIndicator` in a sticky container** for visibility
4. **Provide meaningful error messages** in your `onSave` handler
5. **Return updated data** from your save handler (server might modify data)
6. **Use `form.reset()`** when loading fresh data from server
7. **Enable auto-save** for frequently-changing settings
8. **Disable auto-save** for critical settings that need explicit confirmation

---

## Migration Guide

If you have existing settings forms, migrate them to use these patterns:

### Before

```tsx
const [data, setData] = useState(initial);
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) });
  } catch (error) {
    alert('Save failed');
  } finally {
    setIsSaving(false);
  }
};
```

### After

```tsx
const form = useSettingsForm({
  initialData: initial,
  onSave: async (data) => {
    const res = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Save failed');
    return (await res.json()).data;
  },
});

// Use form.data, form.updateData(), form.save(), etc.
```

---

## Troubleshooting

### "Save doesn't trigger"

Make sure you're calling `form.save()` as an async function:

```tsx
// ❌ Wrong
<button onClick={form.save}>Save</button>

// ✅ Correct
<button onClick={() => form.save()}>Save</button>
```

### "Form doesn't mark as dirty"

Use `form.updateData()` to update fields, not `form.setData()` directly:

```tsx
// ❌ Wrong - doesn't trigger dirty detection
form.data.name = 'new value';

// ✅ Correct
form.updateData({ name: 'new value' });
```

### "Auto-save triggers too often"

Increase the `autoSaveDelay`:

```tsx
const form = useSettingsForm({
  initialData,
  onSave: saveHandler,
  autoSaveDelay: 5000, // 5 seconds instead of 3
});
```

### "Navigation dialog doesn't appear"

Make sure you're using `<a>` tags for internal links, not Next.js `<Link>` components, or the dialog is placed in the component tree:

```tsx
// The dialog must be rendered
return (
  <>
    <LeaveConfirmDialog isDirty={form.isDirty} onSave={form.save} />
    {/* rest of your form */}
  </>
);
```

---

## API Reference

See TypeScript definitions in source files for complete API documentation:

- `src/hooks/admin/use-settings-form.ts`
- `src/components/admin/settings/UnsavedChangesIndicator.tsx`
- `src/components/admin/settings/LeaveConfirmDialog.tsx`
