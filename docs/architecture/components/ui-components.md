# UI Components - Architecture Documentation

> **Module**: Base UI Components
> **Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\ui\`
> **Status**: ✅ Completed
> **Design System**: DaisyUI + Clean & Elegant Professional

## Overview

Base reusable UI components built on DaisyUI with custom styling to match The Puppy Day brand aesthetic. All components are TypeScript-typed, accessible (WCAG AA), and follow consistent patterns.

---

## Component Library

### Button (`button.tsx`)

**Purpose**: Primary interactive element with multiple variants and states.

**Props**:
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline' | 'error' | 'success' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
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

<Button variant="primary" isLoading leftIcon={<Plus />}>
  Save Changes
</Button>
```

**Variants**:
- `primary`: Charcoal (#434E54) - Main CTAs
- `secondary`: Lighter cream (#EAE0D5) - Secondary actions
- `accent`: Sky blue (#4ECDC4) - Playful accents
- `ghost`: Transparent - Tertiary actions
- `outline`: Bordered - Alternative style
- `error`, `success`, `warning`, `info`: Contextual actions

**DaisyUI Classes**:
```tsx
className={cn(
  'btn',                      // Base DaisyUI button
  variantClasses[variant],    // Variant-specific class
  sizeClasses[size],          // Size-specific class
  className                   // Custom className override
)}
```

---

### Input (`input.tsx`)

**Purpose**: Form text input with label, error states, and icons.

**Props**:
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
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
  leftIcon={<Mail className="w-4 h-4" />}
  required
/>
```

**States**:
- Normal: `border-gray-200`
- Focus: `focus:ring-2 focus:ring-primary`
- Error: `border-error` with error message below
- Disabled: `opacity-50 cursor-not-allowed`

---

### Select (`select.tsx`)

**Purpose**: Dropdown select input.

**Props**:
```typescript
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}
```

**Usage**:
```tsx
<Select
  label="Pet Size"
  options={[
    { value: 'small', label: 'Small (0-18 lbs)' },
    { value: 'medium', label: 'Medium (19-35 lbs)' },
    { value: 'large', label: 'Large (36-65 lbs)' },
    { value: 'xlarge', label: 'X-Large (66+ lbs)' },
  ]}
  placeholder="Select size"
  error={errors.size?.message}
/>
```

---

### Textarea (`textarea.tsx`)

**Purpose**: Multi-line text input.

**Props**:
```typescript
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}
```

**Usage**:
```tsx
<Textarea
  label="Special Instructions"
  placeholder="Any special requests or medical notes"
  rows={4}
  maxLength={500}
  helperText="500 characters maximum"
/>
```

---

### Checkbox (`checkbox.tsx`)

**Purpose**: Boolean input with custom styling.

**Props**:
```typescript
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}
```

**Usage**:
```tsx
<Checkbox
  label="I agree to terms and conditions"
  description="By checking this box, you agree to our privacy policy"
  required
/>
```

**DaisyUI Styling**:
```tsx
<input
  type="checkbox"
  className="checkbox checkbox-primary"  // DaisyUI checkbox with primary color
/>
```

---

### Radio (`radio.tsx`)

**Purpose**: Single-choice selection from multiple options.

**Props**:
```typescript
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
<RadioGroup label="Time Preference" error={errors.time?.message}>
  <Radio
    name="time"
    value="morning"
    label="Morning (9:00 AM - 12:00 PM)"
  />
  <Radio
    name="time"
    value="afternoon"
    label="Afternoon (12:00 PM - 5:00 PM)"
  />
  <Radio
    name="time"
    value="any"
    label="Any Time"
  />
</RadioGroup>
```

---

### Modal (`modal.tsx`)

**Purpose**: Dialog overlay for forms, confirmations, and content.

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Usage**:
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Confirm Cancellation"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="error" onClick={handleConfirm}>
        Confirm Cancellation
      </Button>
    </>
  }
>
  <p>Are you sure you want to cancel this appointment?</p>
  <p className="text-sm text-gray-600 mt-2">
    This action cannot be undone.
  </p>
</Modal>
```

**Backdrop**:
- Overlay: `bg-black/50 backdrop-blur-sm`
- Closes on backdrop click (unless `closeOnBackdrop={false}`)
- Closes on ESC key

---

### Alert (`alert.tsx`)

**Purpose**: Status messages and notifications.

**Props**:
```typescript
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}
```

**Usage**:
```tsx
<Alert variant="success" dismissible onClose={() => setAlert(null)}>
  <CheckCircle className="w-5 h-5" />
  <span>Appointment booked successfully!</span>
</Alert>

<Alert variant="error" title="Booking Failed">
  Unable to book appointment. Please try again or contact support.
</Alert>
```

**DaisyUI Classes**:
```tsx
<div className={cn(
  'alert',
  variant === 'success' && 'alert-success',
  variant === 'error' && 'alert-error',
  variant === 'warning' && 'alert-warning',
  variant === 'info' && 'alert-info',
)}>
```

---

### Card (`card.tsx`)

**Purpose**: Content container with consistent styling.

**Props**:
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
  hoverable?: boolean;
  className?: string;
}
```

**Usage**:
```tsx
<Card
  title="Basic Grooming"
  subtitle="$40 - $85"
  image="/images/basic-grooming.jpg"
  hoverable
  footer={
    <Button variant="primary" fullWidth>
      Book Now
    </Button>
  }
>
  <p>Includes shampoo, nail trim, ear cleaning, and sanitary cut.</p>
</Card>
```

**DaisyUI Card Structure**:
```tsx
<div className="card bg-white shadow-md hover:shadow-lg transition-shadow">
  {image && <figure><img src={image} alt={title} /></figure>}
  <div className="card-body">
    {title && <h3 className="card-title">{title}</h3>}
    {children}
  </div>
  {footer && <div className="card-actions">{footer}</div>}
</div>
```

---

### Badge (`badge.tsx`)

**Purpose**: Status indicators and labels.

**Props**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Usage**:
```tsx
// Appointment status
<Badge variant="success">Confirmed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>

// Customer flags
<Badge variant="primary" size="sm">VIP</Badge>
```

**DaisyUI Classes**:
```tsx
<span className={cn(
  'badge',
  variantClasses[variant],
  sizeClasses[size]
)} />
```

---

### LoadingSpinner (`loading-spinner.tsx`)

**Purpose**: Loading state indicator.

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent';
  fullScreen?: boolean;
}
```

**Usage**:
```tsx
// Inline spinner
<LoadingSpinner size="md" />

// Full-screen loading overlay
<LoadingSpinner fullScreen size="lg" />
```

**DaisyUI Spinner**:
```tsx
<span className={cn(
  'loading loading-spinner',
  sizeClasses[size],
  colorClasses[color]
)} />
```

---

## Design Patterns

### Composition Pattern

Components are composable and follow single-responsibility principle:

```tsx
// Good: Composable
<Card>
  <div className="flex justify-between items-center">
    <h3>Appointment Details</h3>
    <Badge variant="success">Confirmed</Badge>
  </div>
  <p>January 15, 2025 at 10:00 AM</p>
  <div className="mt-4">
    <Button variant="outline">Reschedule</Button>
    <Button variant="error">Cancel</Button>
  </div>
</Card>

// Avoid: Monolithic component with too many responsibilities
<AppointmentCard
  showBadge
  showActions
  enableReschedule
  enableCancel
  // ... too many props
/>
```

### Controlled vs Uncontrolled

**Form Components** (controlled):
```tsx
const [email, setEmail] = useState('');

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Modal** (controlled state):
```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
```

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
<label htmlFor="email">Email Address</label>
<Input id="email" type="email" />
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

**Custom Theme Overrides**:
```tsx
<Button className="bg-[#434E54] hover:bg-[#363F44]">
  Custom Color
</Button>
```

---

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toContainHTML('loading-spinner');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

## Related Documentation

- [Design System](../ARCHITECTURE.md#global-design-system)
- [DaisyUI Documentation](https://daisyui.com/components/)

---

**Last Updated**: 2025-12-20
