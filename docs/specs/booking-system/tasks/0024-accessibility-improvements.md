# Task 24: Add ARIA Labels and Keyboard Navigation

## Description
Enhance the booking wizard with proper ARIA labels, keyboard navigation, and screen reader support for WCAG 2.1 AA compliance.

## Files to modify
- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/BookingProgress.tsx`
- `src/components/booking/CalendarPicker.tsx`
- `src/components/booking/TimeSlotGrid.tsx`
- All step components

## Requirements References
- Implicit accessibility requirements for public-facing booking system
- WCAG 2.1 AA compliance target

## Implementation Details

### Progress Indicator Accessibility
```tsx
// BookingProgress.tsx
export function BookingProgress({ currentStep, onStepClick, canNavigateToStep }) {
  return (
    <nav aria-label="Booking progress" className="py-4">
      <ol className="flex justify-between items-center">
        {STEP_LABELS.map((label, index) => (
          <li
            key={label}
            className="flex-1"
            aria-current={currentStep === index ? 'step' : undefined}
          >
            <button
              onClick={() => onStepClick(index)}
              disabled={!canNavigateToStep(index)}
              className={cn('step-button', ...)}
              aria-label={`Step ${index + 1}: ${label}${
                currentStep === index ? ' (current)' : ''
              }${index < currentStep ? ' (completed)' : ''}`}
            >
              <span className="sr-only">Step {index + 1}:</span>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep + 1} of {STEP_LABELS.length}: {STEP_LABELS[currentStep]}
      </div>
    </nav>
  );
}
```

### Wizard Container Accessibility
```tsx
// BookingWizard.tsx
<div role="region" aria-label="Appointment booking wizard">
  <BookingProgress ... />

  <main id="booking-step-content" aria-live="polite" aria-atomic="true">
    {/* Current step content */}
  </main>

  {/* Price summary */}
  <aside aria-label="Price summary" aria-live="polite">
    <PriceSummary ... />
  </aside>
</div>
```

### Calendar Keyboard Navigation
```tsx
// CalendarPicker.tsx
const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      focusPreviousDay(date);
      break;
    case 'ArrowRight':
      e.preventDefault();
      focusNextDay(date);
      break;
    case 'ArrowUp':
      e.preventDefault();
      focusPreviousWeek(date);
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusNextWeek(date);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (!isDisabled(date)) {
        onSelectDate(dateStr);
      }
      break;
    case 'Home':
      e.preventDefault();
      focusFirstDayOfMonth();
      break;
    case 'End':
      e.preventDefault();
      focusLastDayOfMonth();
      break;
  }
};

// Calendar cell
<button
  ref={ref => dateRefs.current[dateStr] = ref}
  role="gridcell"
  tabIndex={isFocused ? 0 : -1}
  aria-selected={isSelected}
  aria-disabled={isDisabled}
  aria-label={`${format(date, 'EEEE, MMMM d, yyyy')}${
    isDisabled ? ' (unavailable)' : ''
  }${isSelected ? ' (selected)' : ''}`}
  onKeyDown={(e) => handleKeyDown(e, date)}
  onClick={() => onSelectDate(dateStr)}
>
  {getDate(date)}
</button>
```

### Form Accessibility
```tsx
// FormInput with full accessibility
<div className="form-control">
  <label htmlFor={inputId} className="label">
    <span className="label-text">
      {label}
      {required && (
        <span className="text-error ml-1" aria-label="required">*</span>
      )}
    </span>
  </label>
  <input
    id={inputId}
    type={type}
    aria-required={required}
    aria-invalid={!!error}
    aria-describedby={cn(
      error && `${inputId}-error`,
      helpText && `${inputId}-help`
    )}
    className={cn('input input-bordered', error && 'input-error')}
    {...props}
  />
  {helpText && (
    <p id={`${inputId}-help`} className="text-sm text-base-content/70 mt-1">
      {helpText}
    </p>
  )}
  {error && (
    <p id={`${inputId}-error`} role="alert" className="text-error text-sm mt-1">
      {error}
    </p>
  )}
</div>
```

### Focus Management
```tsx
// Focus management on step change
useEffect(() => {
  // Focus the step heading when step changes
  const heading = document.querySelector(`#step-${currentStep}-heading`);
  if (heading instanceof HTMLElement) {
    heading.focus();
  }
}, [currentStep]);

// In each step
<h2
  id={`step-${stepNumber}-heading`}
  tabIndex={-1}
  className="text-2xl font-bold outline-none"
>
  {title}
</h2>
```

### Skip Link
```tsx
// At the top of BookingWizard
<a
  href="#booking-step-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-base-100"
>
  Skip to booking content
</a>
```

### Price Update Announcements
```tsx
// Announce price changes
const previousTotal = useRef(totalPrice);

useEffect(() => {
  if (previousTotal.current !== totalPrice) {
    // Announce to screen readers
    const announcement = totalPrice > previousTotal.current
      ? `Price increased to $${totalPrice.toFixed(2)}`
      : `Price decreased to $${totalPrice.toFixed(2)}`;

    announceToScreenReader(announcement);
    previousTotal.current = totalPrice;
  }
}, [totalPrice]);

function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}
```

### Focus Visible Styles
```css
/* In globals.css */
.btn:focus-visible,
.input:focus-visible,
button:focus-visible {
  outline: 2px solid hsl(var(--p));
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
.btn:focus:not(:focus-visible),
.input:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}
```

## Acceptance Criteria
- [ ] Progress indicator has aria-label and aria-current
- [ ] Screen reader announces current step on change
- [ ] Calendar supports full keyboard navigation (arrows, Home, End)
- [ ] Calendar cells have descriptive aria-labels with date
- [ ] Form inputs have proper aria-required, aria-invalid, aria-describedby
- [ ] Error messages use role="alert"
- [ ] Price summary is in an aria-live region
- [ ] Focus moves to step heading on step change
- [ ] Skip link to main content
- [ ] Visible focus indicators (2px outline)
- [ ] No focus trapping (except modals)

## Estimated Complexity
Medium

## Phase
Phase 7: Mobile Responsiveness & Accessibility

## Dependencies
- All step component tasks (14-18)
