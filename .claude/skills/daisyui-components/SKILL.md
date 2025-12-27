# DaisyUI Components Reference

Component reference for DaisyUI + Tailwind CSS implementation with The Puppy Day theme configuration.

---

## Theme Configuration

```javascript
// tailwind.config.js
module.exports = {
  daisyui: {
    themes: [
      {
        puppyday: {
          // Primary - Charcoal
          "primary": "#434E54",
          "primary-focus": "#363F44",
          "primary-content": "#FFFFFF",

          // Secondary - Lighter Cream
          "secondary": "#EAE0D5",
          "secondary-focus": "#DCD2C7",
          "secondary-content": "#434E54",

          // Accent
          "accent": "#5A6670",
          "accent-focus": "#434E54",
          "accent-content": "#FFFFFF",

          // Neutral
          "neutral": "#F5F5F5",
          "neutral-focus": "#E5E5E5",
          "neutral-content": "#434E54",

          // Base - Warm cream background
          "base-100": "#F8EEE5",
          "base-200": "#EAE0D5",
          "base-300": "#DCD2C7",
          "base-content": "#434E54",

          // Semantic colors
          "info": "#74B9FF",
          "success": "#6BCB77",
          "warning": "#FFB347",
          "error": "#EF4444",
        }
      }
    ]
  }
}
```

---

## Buttons

### Base Classes

```html
<!-- Variants -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>
<button class="btn btn-outline">Outline</button>

<!-- Sizes -->
<button class="btn btn-xs">Tiny</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-md">Medium</button>
<button class="btn btn-lg">Large</button>

<!-- States -->
<button class="btn" disabled>Disabled</button>
<button class="btn btn-primary loading">Loading</button>

<!-- With icon -->
<button class="btn btn-primary">
  <svg>...</svg>
  Book Now
</button>
```

### The Puppy Day Button Patterns

```tsx
// Primary CTA
<button className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none">
  Book Appointment
</button>

// Secondary action
<button className="btn btn-ghost text-[#434E54]">
  Cancel
</button>

// Loading state
<button className="btn btn-primary" disabled={loading}>
  {loading && <span className="loading loading-spinner loading-sm" />}
  {loading ? 'Saving...' : 'Save Changes'}
</button>

// Icon button
<button className="btn btn-ghost btn-circle" aria-label="Close">
  <X className="w-5 h-5" />
</button>
```

---

## Cards

### Base Structure

```html
<div class="card bg-white shadow-md">
  <figure>
    <img src="..." alt="..." />
  </figure>
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Description text</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Variants

```html
<!-- Compact -->
<div class="card card-compact">...</div>

<!-- Bordered -->
<div class="card card-bordered">...</div>

<!-- Side (horizontal) -->
<div class="card card-side">...</div>
```

### The Puppy Day Card Pattern

```tsx
<div className="card bg-white shadow-md hover:shadow-lg transition-all duration-200">
  <div className="card-body">
    {/* Header with icon */}
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
        <Scissors className="w-5 h-5 text-[#434E54]" />
      </div>
      <h3 className="card-title text-[#434E54]">{title}</h3>
    </div>

    {/* Content */}
    <p className="text-[#6B7280] text-sm leading-relaxed mb-4">
      {description}
    </p>

    {/* Actions */}
    <div className="card-actions">
      <button className="btn btn-primary w-full bg-[#434E54] hover:bg-[#363F44] border-none">
        Book Now
      </button>
    </div>
  </div>
</div>
```

---

## Forms

### Input

```html
<!-- Base -->
<input type="text" class="input input-bordered w-full" placeholder="Enter text" />

<!-- Variants -->
<input class="input input-primary" />
<input class="input input-secondary" />
<input class="input input-error" />
<input class="input input-success" />

<!-- Sizes -->
<input class="input input-xs" />
<input class="input input-sm" />
<input class="input input-md" />
<input class="input input-lg" />
```

### Select

```html
<select class="select select-bordered w-full">
  <option disabled selected>Pick one</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Textarea

```html
<textarea class="textarea textarea-bordered w-full" placeholder="Enter message"></textarea>
```

### Checkbox & Radio

```html
<!-- Checkbox -->
<input type="checkbox" class="checkbox checkbox-primary" />

<!-- Radio -->
<input type="radio" name="radio-1" class="radio radio-primary" />

<!-- Toggle -->
<input type="checkbox" class="toggle toggle-primary" />
```

### Form Control Pattern

```tsx
<div className="form-control w-full">
  <label className="label">
    <span className="label-text text-[#434E54]">Email</span>
  </label>
  <input
    type="email"
    className={`input input-bordered transition-colors duration-200
      ${error ? 'border-error focus:border-error' : 'border-[#E5E5E5] focus:border-[#434E54]'}
    `}
    placeholder="you@example.com"
  />
  {error && (
    <label className="label">
      <span className="label-text-alt text-error">{error}</span>
    </label>
  )}
</div>
```

---

## Modal

### Base Structure

```html
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Title</h3>
    <p class="py-4">Content</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

### React Modal Pattern

```tsx
'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#434E54]">{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </dialog>
  );
}
```

---

## Drawer

```html
<div class="drawer">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content -->
    <label for="my-drawer" class="btn btn-primary drawer-button">Open drawer</label>
  </div>
  <div class="drawer-side">
    <label for="my-drawer" class="drawer-overlay"></label>
    <ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
      <li><a>Menu Item 1</a></li>
      <li><a>Menu Item 2</a></li>
    </ul>
  </div>
</div>
```

---

## Navigation

### Navbar

```html
<div class="navbar bg-base-100">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">Logo</a>
  </div>
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a>Item 1</a></li>
      <li><a>Item 2</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <a class="btn btn-primary">Get started</a>
  </div>
</div>
```

### Menu

```html
<ul class="menu bg-base-200 w-56 rounded-box">
  <li><a>Item 1</a></li>
  <li><a>Item 2</a></li>
  <li>
    <details>
      <summary>Parent</summary>
      <ul>
        <li><a>Submenu 1</a></li>
        <li><a>Submenu 2</a></li>
      </ul>
    </details>
  </li>
</ul>
```

### Tabs

```html
<div role="tablist" class="tabs tabs-bordered">
  <a role="tab" class="tab">Tab 1</a>
  <a role="tab" class="tab tab-active">Tab 2</a>
  <a role="tab" class="tab">Tab 3</a>
</div>
```

### Breadcrumbs

```html
<div class="breadcrumbs text-sm">
  <ul>
    <li><a>Home</a></li>
    <li><a>Documents</a></li>
    <li>Current Page</li>
  </ul>
</div>
```

---

## Feedback

### Alert

```html
<div class="alert">
  <span>Default alert</span>
</div>
<div class="alert alert-info">
  <span>Info alert</span>
</div>
<div class="alert alert-success">
  <span>Success alert</span>
</div>
<div class="alert alert-warning">
  <span>Warning alert</span>
</div>
<div class="alert alert-error">
  <span>Error alert</span>
</div>
```

### Badge

```html
<span class="badge">default</span>
<span class="badge badge-primary">primary</span>
<span class="badge badge-secondary">secondary</span>
<span class="badge badge-outline">outline</span>
```

### Loading

```html
<span class="loading loading-spinner loading-xs"></span>
<span class="loading loading-spinner loading-sm"></span>
<span class="loading loading-spinner loading-md"></span>
<span class="loading loading-spinner loading-lg"></span>

<span class="loading loading-dots loading-md"></span>
<span class="loading loading-ring loading-md"></span>
<span class="loading loading-ball loading-md"></span>
```

### Progress

```html
<progress class="progress w-56" value="0" max="100"></progress>
<progress class="progress progress-primary w-56" value="70" max="100"></progress>
```

### Toast

```html
<div class="toast toast-end">
  <div class="alert alert-success">
    <span>Message sent successfully.</span>
  </div>
</div>
```

---

## Layout Utilities

### Divider

```html
<div class="divider">OR</div>
```

### Stack

```html
<div class="stack">
  <div class="card bg-primary text-primary-content">...</div>
  <div class="card bg-secondary text-secondary-content">...</div>
  <div class="card bg-accent text-accent-content">...</div>
</div>
```

---

## Tailwind Utility Guidelines

### Layout

```css
/* Flexbox */
flex, flex-col, flex-row, gap-4, items-center, justify-between

/* Grid */
grid, grid-cols-3, gap-6

/* Spacing */
p-4, px-6, py-8, m-4, mx-auto, space-y-4
```

### Typography

```css
/* Size */
text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

/* Weight */
font-normal, font-medium, font-semibold, font-bold

/* Color (The Puppy Day) */
text-[#434E54]  /* Primary */
text-[#6B7280]  /* Secondary */
text-[#9CA3AF]  /* Muted */
```

### Effects

```css
/* Shadows (soft, blurred) */
shadow-sm, shadow-md, shadow-lg

/* Transitions */
transition-all duration-200 ease-in-out

/* Hover */
hover:shadow-lg, hover:bg-[#363F44], hover:-translate-y-0.5
```

### Responsive Breakpoints

```css
/* Mobile first */
Default (no prefix)  /* < 640px */
md:                  /* >= 640px */
lg:                  /* >= 1024px */
xl:                  /* >= 1280px */
2xl:                 /* >= 1536px */
```

---

## Micro-Interactions

### Hover Transitions

```tsx
// Card hover - elevation + lift
className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"

// Button hover - color shift
className="transition-colors duration-200 hover:bg-[#363F44]"

// Link hover - opacity
className="transition-opacity duration-200 hover:opacity-80"
```

### Loading States

```tsx
// Spinner in button
<button className="btn btn-primary" disabled={loading}>
  {loading && <span className="loading loading-spinner loading-sm" />}
  {loading ? 'Saving...' : 'Save Changes'}
</button>

// Skeleton loader
<div className="animate-pulse">
  <div className="h-4 bg-[#EAE0D5] rounded w-3/4 mb-2" />
  <div className="h-4 bg-[#EAE0D5] rounded w-1/2" />
</div>
```

### Button Press Feedback

```tsx
className="btn active:scale-[0.98] transition-transform duration-100"
```

---

## Icon Containers

```tsx
// Decorative icon container
<div className="p-2.5 bg-[#EAE0D5] rounded-lg">
  <Scissors className="w-5 h-5 text-[#434E54]" />
</div>

// Circular icon button
<button className="btn btn-ghost btn-circle">
  <Bell className="w-5 h-5" />
</button>
```

---

## Responsive Grid Patterns

```tsx
// Service cards grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {services.map(service => <ServiceCard key={service.id} {...service} />)}
</div>

// Two column layout
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
  <div className="flex-1">Left content</div>
  <div className="flex-1">Right content</div>
</div>

// Sidebar + content
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 shrink-0">Sidebar</aside>
  <main className="flex-1 p-4 lg:p-6">Content</main>
</div>
```
