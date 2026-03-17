---
name: daisyui-components
description: DaisyUI 5 component patterns and theme configuration for The Puppy Day. Auto-invoke when using DaisyUI components, creating UI with Tailwind utility classes, or implementing modals, tables, forms, cards, or navigation elements.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# DaisyUI Component Patterns

DaisyUI 5 component usage guide tailored to The Puppy Day's theme and design system.

## When to Apply

Reference these patterns when:
- Using DaisyUI component classes
- Building modals, tables, forms, cards, or navigation
- Choosing between DaisyUI classes and custom Tailwind
- Implementing responsive layouts

## Rule 1: Use Semantic Theme Classes

ALWAYS prefer DaisyUI semantic classes over raw Tailwind colors:

```html
<!-- CORRECT — adapts to theme -->
<div class="bg-base-100 text-base-content">
<button class="btn btn-primary">

<!-- WRONG — hardcoded colors -->
<div class="bg-white text-gray-800">
<button class="bg-[#434E54] text-white">
```

### Semantic Class Reference
| Class | Maps To | Usage |
|-------|---------|-------|
| `bg-base-100` | `#F8EEE5` | Page background |
| `bg-base-200` | `#EAE0D5` | Section backgrounds |
| `bg-base-300` | `#DCD2C7` | Darker sections |
| `bg-primary` | `#434E54` | Primary buttons/accents |
| `bg-secondary` | `#EAE0D5` | Secondary elements |
| `bg-accent` | `#4ECDC4` | Accent highlights |
| `text-base-content` | `#434E54` | Primary text |
| `text-primary` | `#434E54` | Primary-colored text |

## Rule 2: Buttons

### Standard Buttons (Marketing/Customer)
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-outline">Outlined</button>
<button class="btn btn-error">Destructive</button>
```

### Button Sizes
```html
<button class="btn btn-xs">Tiny</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-md">Default</button>
<button class="btn btn-lg">Large</button>
```

### Admin Buttons
Use `AdminButton` component for all admin panel buttons:
```typescript
import { AdminButton } from '@/components/admin/ui/AdminButton';

<AdminButton variant="primary" isLoading={isSaving}>Save</AdminButton>
<AdminButton variant="danger" isLoading={isDeleting}>Delete</AdminButton>
<AdminButton variant="ghost" size="sm">Cancel</AdminButton>
```

### Loading Button
```html
<button class="btn btn-primary" disabled aria-busy="true">
  <span class="loading loading-spinner loading-sm"></span>
  Saving...
</button>
```

## Rule 3: Cards

```html
<div class="card bg-base-100 shadow-sm rounded-xl">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content here</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary btn-sm">Action</button>
    </div>
  </div>
</div>
```

With image:
```html
<div class="card bg-base-100 shadow-sm rounded-xl overflow-hidden">
  <figure><img src="..." alt="..." /></figure>
  <div class="card-body">...</div>
</div>
```

## Rule 4: Modals

Use the HTML `<dialog>` element with DaisyUI classes:

```typescript
'use client';
import { useRef } from 'react';

function MyModal({ isOpen, onClose, children }: MyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Modal Title</h3>
        {children}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Confirm</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
```

## Rule 5: Tables (Admin)

```html
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td><span class="badge badge-success badge-sm">Active</span></td>
        <td>
          <button class="btn btn-ghost btn-xs">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Rule 6: Form Inputs

```html
<!-- Text input -->
<div class="form-control">
  <label class="label">
    <span class="label-text">Name</span>
  </label>
  <input type="text" class="input input-bordered" placeholder="Enter name" />
  <label class="label">
    <span class="label-text-alt text-error">Error message</span>
  </label>
</div>

<!-- Select -->
<select class="select select-bordered w-full">
  <option disabled selected>Choose option</option>
  <option>Option 1</option>
</select>

<!-- Textarea -->
<textarea class="textarea textarea-bordered" rows="3" placeholder="Description"></textarea>

<!-- Checkbox -->
<div class="form-control">
  <label class="label cursor-pointer">
    <span class="label-text">Active</span>
    <input type="checkbox" class="checkbox checkbox-primary" />
  </label>
</div>

<!-- Toggle -->
<input type="checkbox" class="toggle toggle-primary" />
```

## Rule 7: Badges & Alerts

### Status Badges
```html
<span class="badge badge-success badge-sm">Active</span>
<span class="badge badge-warning badge-sm">Pending</span>
<span class="badge badge-error badge-sm">Cancelled</span>
<span class="badge badge-info badge-sm">New</span>
<span class="badge badge-ghost badge-sm">Draft</span>
```

### Alerts
```html
<div class="alert alert-info">
  <span>Informational message</span>
</div>
<div class="alert alert-success">
  <span>Success message</span>
</div>
<div class="alert alert-warning">
  <span>Warning message</span>
</div>
<div class="alert alert-error">
  <span>Error message</span>
</div>
```

## Rule 8: Loading States

```html
<!-- Spinner -->
<span class="loading loading-spinner loading-sm"></span>
<span class="loading loading-spinner loading-md"></span>
<span class="loading loading-spinner loading-lg text-primary"></span>

<!-- Skeleton -->
<div class="skeleton h-4 w-full"></div>
<div class="skeleton h-32 w-full rounded-xl"></div>
```

## Rule 9: Responsive Patterns

```html
<!-- Stack on mobile, side-by-side on desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Grid: 1 col mobile, 2 tablet, 3 desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Drawer (admin sidebar) -->
<div class="drawer lg:drawer-open">
```

## Rule 10: Avoid These Anti-Patterns

```html
<!-- WRONG: Don't mix DaisyUI and raw color classes -->
<button class="btn bg-blue-500 text-white">  <!-- Use btn-primary -->

<!-- WRONG: Don't use inline styles for theming -->
<div style="background: #F8EEE5">  <!-- Use bg-base-100 -->

<!-- WRONG: Don't use custom border-radius when DaisyUI provides it -->
<div class="rounded-[12px]">  <!-- Use rounded-xl -->
```

## Reference

- DaisyUI 5 docs: https://daisyui.com/components/
- Theme config: `src/app/globals.css`
- AdminButton: `src/components/admin/ui/AdminButton.tsx`
- Design system: `docs/architecture/ARCHITECTURE.md` (Global Design System section)
