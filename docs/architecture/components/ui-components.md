# UI Components - Architecture Documentation

> **Module**: Base UI Components
> **Location**: `src/components/ui/` (shared) and `src/components/admin/ui/` (admin-specific)
> **Status**: Completed
> **Design System**: DaisyUI + Clean & Elegant Professional
> **Last Updated**: 2026-03-09

## Overview

Base reusable UI components built on DaisyUI with custom styling to match The Puppy Day brand aesthetic. All components are TypeScript-typed, accessible (WCAG AA), and follow consistent patterns.

---

## Component Library

### Button (`button.tsx`)

**Purpose**: Primary interactive element with multiple variants, sizes, loading state, and icon support. Implemented as a `forwardRef` component.

**Props**:
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline' | 'error' | 'success' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Usage**:
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="primary" isLoading loadingText="Saving..." leftIcon={<Plus />}>
  Save Changes
</Button>
```

**Variants**:
- `primary`: `btn-primary` - Main CTAs
- `secondary`: `btn-secondary` - Secondary actions
- `accent`: `btn-accent` - Playful accents
- `ghost`: `btn-ghost` - Tertiary actions
- `outline`: `btn-outline` - Alternative style
- `error`, `success`, `warning`, `info`: Contextual actions

**Loading State**: When `isLoading` is true, the button is disabled and shows a DaisyUI `loading-spinner` followed by either `loadingText` or the original `children`. Uses `aria-busy` for the loading signal and `!opacity-100` on the spinner to prevent DaisyUI's opacity reduction from dimming it.

**DaisyUI Classes**:
```tsx
className={cn('btn', variantClasses[variant], sizeClasses[size], className)}
```

---

### AdminButton (`src/components/admin/ui/AdminButton.tsx`)

**Purpose**: Admin-panel-specific button with a reduced variant set, design-system-correct colors, and a visible loading spinner. Uses `aria-busy` (not `disabled`) for loading state to prevent DaisyUI from applying opacity reduction to the spinner. Implemented as `memo(forwardRef(...))`.

**Props**:
```typescript
export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}
```

**Variants**:
| Variant | Style |
|---------|-------|
| `primary` | Charcoal (#434E54) bg, white text — default |
| `secondary` | Outlined, charcoal border/text, fills on hover |
| `danger` | Red-600 bg, white text |
| `ghost` | Transparent, charcoal text, cream hover bg |

**Loading behavior**: When `isLoading` is true, `onClick` is swallowed (set to `undefined`), `aria-busy` is set, and a spinner with `!opacity-100` (forces full opacity) and variant-matched text color is shown alongside `loadingText` or `children`.

**Usage**:
```tsx
import { AdminButton } from '@/components/admin/ui/AdminButton';

<AdminButton variant="primary" onClick={handleSave}>Save</AdminButton>
<AdminButton variant="danger" isLoading={deleting} loadingText="Deleting...">Delete</AdminButton>
```

**Consumers**: `StatusTransitionButton`, `AppointmentDetailModal`, CSV upload steps (`DuplicateHandler`, `FileUploadStep`, `ValidationPreview`), `FillSlotModal`.

---

### Input (`input.tsx`)

**Purpose**: Form text input with label, error states, helper text, and left/right element slots. Implemented as a `forwardRef` component.

**Props**:
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}
```

**Usage**:
```tsx
import { Input } from '@/components/ui/input';

<Input
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  error={errors.email?.message}
  leftElement={<Mail className="w-4 h-4" />}
  required
/>
```

**Features**:
- DaisyUI `form-control` wrapper with `label` and `label-text`
- Error state uses `input-error` class with `label-text-alt text-error` message
- Helper text shown below input when no error is present
- `leftElement` and `rightElement` positioned absolutely inside input
- `aria-invalid` and `aria-describedby` attributes for accessibility
- Auto-generates `id` from `props.name` if not provided

---

### Skeleton (`skeleton.tsx`)

**Purpose**: Animated placeholder for loading states. Base `Skeleton` component plus pre-built variants.

**Components**:
```typescript
// Base skeleton - animated pulse with rounded corners
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)

// Pre-built variants
function SkeletonCard()       // Card with avatar, title, text, and button placeholders
function SkeletonImage({ className }: { className?: string })
function SkeletonText({ lines = 3 }: { lines?: number })
function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' })
function SkeletonButton({ className }: { className?: string })
```

**Usage**:
```tsx
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton';

// Custom skeleton
<Skeleton className="h-8 w-48" />

// Pre-built card skeleton
<SkeletonCard />

// Text block skeleton
<SkeletonText lines={4} />
```

**DaisyUI Classes**: Uses `animate-pulse rounded-md bg-base-300` for the base component.

### Skeleton Presets (`skeletons/`)

Pre-built skeleton components for specific page sections:

| File | Purpose |
|------|---------|
| `AppointmentCardSkeleton.tsx` | Appointment card loading state |
| `DashboardSkeleton.tsx` | Dashboard page loading state |
| `PetCardSkeleton.tsx` | Pet card loading state |
| `TableSkeleton.tsx` | Data table loading state |
| `Skeleton.tsx` | Additional skeleton utilities |
| `index.ts` | Barrel exports |

---

### Toast (`toast.tsx`)

**Purpose**: Individual toast notification with animated entry/exit, auto-dismiss, and action support.

**Props**:
```typescript
interface ToastProps {
  toast: Toast; // from @/hooks/use-toast
  onDismiss: (id: string) => void;
}
```

**Toast Type** (from `use-toast` hook):
```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number; // ms, auto-dismiss after this time
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Features**:
- Framer Motion slide-in from right with scale animation
- Type-specific SVG icons (checkmark, X, warning triangle, info circle)
- Clean white card with left border accent in charcoal (#434E54)
- Progress bar for timed toasts (linear countdown)
- Dismiss button with hover state
- Action button with underline styling
- ARIA `role="alert"` and `aria-live="polite"` for accessibility

---

### Toaster (`toaster.tsx`)

**Purpose**: Toast container that renders all active toasts via React portal.

**Usage**:
```tsx
// Add to root layout
import { Toaster } from '@/components/ui/toaster';

<Toaster />
```

**Features**:
- Renders via `createPortal` to `document.body`
- Fixed position: top-right on desktop, top-center on mobile
- `z-[100]` to appear above all other content
- Uses `AnimatePresence` for smooth mount/unmount transitions
- Responsive: checks viewport width for mobile layout
- Integrates with `useToast()` hook from `@/hooks/use-toast`

---

### EmptyState (`EmptyState.tsx`)

**Purpose**: Placeholder component for sections with no data, featuring an icon, title, description, and optional action buttons.

**Props**:
```typescript
type EmptyStateIcon = 'calendar' | 'dog' | 'file' | 'gift' | 'search' | 'photo' | 'notification' | 'chart' | 'settings' | 'users';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  action?: EmptyStateAction; // Deprecated, kept for backwards compatibility
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Predefined States** (exported as `emptyStates`):
- `noAppointments` - "No appointments yet" with booking CTA
- `noPets` - "No pets added" with add pet CTA
- `noSearchResults` - "No results found"
- `noNotifications` - "All caught up!"
- `noReportCards` - "No report cards yet"
- `noGalleryImages` - "Gallery is empty"
- `noAnalyticsData` - "No data yet"
- `noWaitlistEntries` - "Waitlist is empty"

**Usage**:
```tsx
import { EmptyState, emptyStates } from '@/components/ui/EmptyState';

// Using a predefined state
<EmptyState {...emptyStates.noAppointments} />

// Custom empty state
<EmptyState
  icon="search"
  title="No results"
  description="Try different search terms"
  size="sm"
/>
```

**Design**: Centered layout with circular icon container (cream background), animated entry with Framer Motion. Action buttons render as `Link` components (if `href`) or `button` elements (if `onClick`).

---

### ConfirmationModal (`ConfirmationModal.tsx`)

**Purpose**: Accessible dialog for confirming destructive or important actions.

**Props**:
```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;    // Default: 'Confirm'
  cancelText?: string;     // Default: 'Cancel'
  variant?: 'default' | 'error';
  isLoading?: boolean;     // External loading control
  additionalInfo?: React.ReactNode;
}
```

**Usage**:
```tsx
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

<ConfirmationModal
  isOpen={showCancel}
  onClose={() => setShowCancel(false)}
  onConfirm={handleCancelAppointment}
  title="Cancel Appointment"
  description="Are you sure you want to cancel this appointment?"
  confirmText="Yes, Cancel"
  variant="error"
/>
```

**Features**:
- Framer Motion animated backdrop and modal
- Focus trap via `createFocusTrap` from `@/lib/accessibility/focus`
- Escape key closes modal (when not loading)
- Backdrop click closes modal (when not loading)
- Body scroll lock while open
- `role="alertdialog"` with `aria-modal`, `aria-labelledby`, `aria-describedby`
- Internal loading state management (auto-closes on success) or external via `isLoading` prop
- Variant styling: `error` variant uses red confirm button and warning icon; `default` uses charcoal with question mark icon

---

### StatusBadge (`StatusBadge.tsx`)

**Purpose**: Appointment status indicator with colored dot and label.

**Props**:
```typescript
interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Supported Statuses**:
| Status | Label | Dot/BG Color | Text Color |
|--------|-------|-------------|------------|
| `pending` | Pending | Yellow (#FCD34D) | Amber (#92400E) |
| `confirmed` | Confirmed | Green (#10B981) | Dark green (#065F46) |
| `in_progress` | In Progress | Gray (#6B7280) | Dark gray (#374151) |
| `completed` | Completed | Charcoal (#434E54) | Charcoal (#434E54) |
| `cancelled` | Cancelled | Red (#EF4444) | Dark red (#991B1B) |
| `no_show` | No Show | Dark red (#DC2626) | Darker red (#7F1D1D) |

**Fallback**: Unknown statuses are auto-formatted (underscores to spaces, title case) with default charcoal styling.

**Helper Export**: `getStatusLabel(status)` returns just the display label string.

**Shared Usage**: The StatusBadge is used across both customer and admin views, including `AppointmentListView` and `AppointmentDetailModal` (replacing the old DaisyUI `badge` + `getStatusBadgeColor()` pattern).

**Usage**:
```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

<StatusBadge status="confirmed" size="md" />
```

**Design**: Rounded pill (`rounded-full`) with inline dot indicator and font-medium text. Uses colorful, status-specific colors for clear visual differentiation.

---

## Design Patterns

### Controlled Components

All form components are controlled:
```tsx
const [email, setEmail] = useState('');

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### forwardRef Pattern

Button and Input use `forwardRef` for ref forwarding:
```tsx
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return <button ref={ref} className={cn('btn', ...)} {...props} />;
  }
);
Button.displayName = 'Button';
```

### cn Utility

All components use the `cn()` utility from `@/lib/utils` for conditional class merging (clsx + tailwind-merge).

---

## Accessibility

All components follow WCAG AA standards:

### Keyboard Navigation
- All interactive elements are keyboard-accessible
- Tab order follows visual flow
- Focus indicators visible (`focus:ring-2 focus:ring-primary`)

### Screen Readers
```tsx
// ARIA labels for icon-only buttons
<Button aria-label="Close modal">
  <X className="w-4 h-4" />
</Button>

// Form labels associated with inputs
<Input id="email" label="Email Address" type="email" />
```

### Color Contrast
- Text on background: 7.2:1 (charcoal on cream)
- Error text: 4.5:1 minimum
- Disabled states: Visual + ARIA indicators

---

## Theming

Components use DaisyUI theme variables defined in `globals.css`:

```css
[data-theme="light"] {
  --p: 67 78 84;      /* Primary: Charcoal */
  --s: 234 224 213;   /* Secondary: Cream */
  --a: 78 205 196;    /* Accent: Sky Blue */
  --b1: 248 238 229;  /* Base: Warm cream background */
}
```

---

## Related Documentation

- [Design System](../ARCHITECTURE.md#global-design-system)
- [DaisyUI Documentation](https://daisyui.com/components/)
- [Booking Flow Components](./booking-flow.md)

---

**Last Updated**: 2026-03-09 by Claude Code
**Changes**: Added `AdminButton` (`src/components/admin/ui/AdminButton.tsx`) — admin-specific button with 4 variants, `aria-busy` loading pattern, `!opacity-100` spinner fix. Updated `button.tsx` loading note to reflect `aria-busy` usage. Updated module location header to include `src/components/admin/ui/`.
