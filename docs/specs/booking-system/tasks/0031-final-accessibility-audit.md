# Task 31: Final Accessibility Audit

## Description
Perform comprehensive accessibility testing using automated tools and manual testing to ensure WCAG 2.1 AA compliance.

## Files to create/modify
- `src/components/booking/__tests__/accessibility.test.tsx`
- Update components based on audit findings

## Requirements References
- Implicit accessibility requirements for public-facing booking system
- WCAG 2.1 AA compliance target

## Implementation Details

### Automated Testing with jest-axe
```typescript
// accessibility.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { BookingWizard } from '../BookingWizard';
import { ServiceStep } from '../steps/ServiceStep';
import { PetStep } from '../steps/PetStep';
import { DateTimeStep } from '../steps/DateTimeStep';
import { AddonsStep } from '../steps/AddonsStep';
import { ReviewStep } from '../steps/ReviewStep';
import { ConfirmationStep } from '../steps/ConfirmationStep';

expect.extend(toHaveNoViolations);

describe('Booking Wizard Accessibility', () => {
  it('BookingWizard has no accessibility violations', async () => {
    const { container } = render(<BookingWizard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ServiceStep has no accessibility violations', async () => {
    const { container } = render(<ServiceStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('PetStep has no accessibility violations', async () => {
    const { container } = render(<PetStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DateTimeStep has no accessibility violations', async () => {
    const { container } = render(<DateTimeStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AddonsStep has no accessibility violations', async () => {
    const { container } = render(<AddonsStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ReviewStep has no accessibility violations', async () => {
    const { container } = render(<ReviewStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ConfirmationStep has no accessibility violations', async () => {
    const { container } = render(<ConfirmationStep />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab key moves focus through all interactive elements
- [ ] Focus order follows logical reading order
- [ ] Focus indicators visible on all interactive elements
- [ ] No keyboard traps (except modal dialogs)
- [ ] Escape key closes modals
- [ ] Arrow keys navigate calendar dates
- [ ] Enter/Space selects services, times, addons
- [ ] Back button is accessible via keyboard

#### Screen Reader Testing
Using VoiceOver (Mac) or NVDA (Windows):
- [ ] Page title announced on load
- [ ] Progress indicator reads current step
- [ ] Service cards announce name, description, price
- [ ] Form labels read correctly
- [ ] Error messages announced immediately
- [ ] Price updates announced
- [ ] Confirmation details read completely

#### Color Contrast
- [ ] Text: minimum 4.5:1 contrast ratio
- [ ] Large text: minimum 3:1 contrast ratio
- [ ] Focus indicators: minimum 3:1 contrast
- [ ] Error text: readable against background
- [ ] Selected state distinguishable without color alone

#### Forms
- [ ] All inputs have associated labels
- [ ] Required fields indicated visually and programmatically
- [ ] Error messages linked to inputs via aria-describedby
- [ ] Inputs have appropriate type attributes
- [ ] Autocomplete attributes set correctly

#### Images & Icons
- [ ] Decorative images have empty alt or role="presentation"
- [ ] Informative icons have accessible names
- [ ] Service images have descriptive alt text

#### Responsive
- [ ] Content reflows at 320px viewport
- [ ] No horizontal scrolling at 100% zoom
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Text resizable up to 200% without loss

### Common Issues to Check

```typescript
// Issue: Missing label
// Bad
<input type="text" placeholder="Pet name" />

// Good
<label>
  <span>Pet name</span>
  <input type="text" />
</label>

// Issue: Non-descriptive button
// Bad
<button>Click here</button>

// Good
<button>Select Basic Grooming</button>

// Issue: Missing alt text
// Bad
<img src="/service.jpg" />

// Good
<img src="/service.jpg" alt="Dog being groomed with shampoo" />

// Issue: Color-only indication
// Bad
<span className="text-success">Available</span>

// Good
<span className="text-success">
  <CheckIcon aria-hidden="true" />
  Available
</span>

// Issue: Focus trap in modal
// Good - focus management
useEffect(() => {
  if (isOpen) {
    previousFocus.current = document.activeElement;
    firstFocusable.current?.focus();
  } else {
    previousFocus.current?.focus();
  }
}, [isOpen]);
```

### Testing Tools
1. **Chrome DevTools** - Accessibility panel
2. **axe DevTools** - Browser extension
3. **WAVE** - Web accessibility evaluator
4. **Lighthouse** - Accessibility audit
5. **VoiceOver** (Mac) - Screen reader testing
6. **NVDA** (Windows) - Screen reader testing

### Lighthouse Accessibility Target
- Score: 90+ for accessibility
- Run via Chrome DevTools > Lighthouse > Accessibility

## Acceptance Criteria
- [ ] All jest-axe tests pass with no violations
- [ ] Keyboard navigation works through entire flow
- [ ] VoiceOver can complete booking flow
- [ ] Color contrast meets WCAG AA standards
- [ ] All form inputs have labels
- [ ] All images have appropriate alt text
- [ ] Focus indicators visible
- [ ] Error messages properly linked
- [ ] Lighthouse accessibility score 90+
- [ ] Document any known issues with justification

## Estimated Complexity
Medium

## Phase
Phase 9: Polish & Integration

## Dependencies
- Task 24 (accessibility improvements)
- All component tasks completed
