# Booking Modal Sticky Footer - Design Specification

## Overview

Redesign the booking modal footer to feature a sticky, full-width continue button that persists during scrolling. This replaces the current trust signals/admin info content and consolidates navigation from individual step components into a unified footer control.

**Problem Being Solved:**
- Continue buttons are currently embedded within each step component, requiring users to scroll to find navigation
- On mobile, the footer displays trust signals but not actionable navigation
- Inconsistent button placement across steps creates cognitive load
- Long content in steps (like service cards or review summaries) can push the continue button out of view

**Solution:**
- A sticky footer with a prominent, full-width continue button
- Back navigation integrated into the footer (when applicable)
- Step-aware button text that communicates the next action
- Loading and disabled states for form validation feedback

---

## User Flow

1. **User views step content** - Footer is always visible at the bottom
2. **User scrolls** - Footer remains fixed/sticky, content scrolls beneath it
3. **User completes step requirements** - Continue button becomes enabled (visual change)
4. **User clicks Continue** - Button shows loading state, then transitions to next step
5. **User needs to go back** - Back button (when shown) returns to previous step

---

## Layout Structure

### Desktop Modal Layout
```
+------------------------------------------+
|  Modal Header                             |
+------------------------------------------+
|  Progress Indicator                       |
+------------------------------------------+
|                                           |
|  Scrollable Content Area                  |
|  (flex-1, overflow-y-auto)                |
|                                           |
+------------------------------------------+
|  [Sticky Footer - Full Width Button]      |  <- Fixed at bottom
+------------------------------------------+
```

### Mobile Bottom Sheet Layout
```
+------------------------------------------+
|  Drag Handle                              |
+------------------------------------------+
|  Modal Header                             |
+------------------------------------------+
|  Progress Indicator                       |
+------------------------------------------+
|                                           |
|  Scrollable Content Area                  |
|  (with bottom padding for footer)         |
|                                           |
+------------------------------------------+
|  [Sticky Footer - Full Width Button]      |  <- Fixed at bottom (safe area)
+------------------------------------------+
```

### Footer Internal Layout

**Desktop (with back button):**
```
+------------------------------------------+
|  px-6 py-4                                |
|  +--------------------------------------+ |
|  | [< Back]          [   Continue   ->] | |
|  +--------------------------------------+ |
+------------------------------------------+
```

**Desktop (first step, no back):**
```
+------------------------------------------+
|  px-6 py-4                                |
|  +--------------------------------------+ |
|  |                   [   Continue   ->] | |
|  +--------------------------------------+ |
+------------------------------------------+
```

**Mobile:**
```
+------------------------------------------+
|  px-4 py-4 pb-safe                        |
|  +--------------------------------------+ |
|  |        [   Continue   ->]            | |  <- Full width
|  +--------------------------------------+ |
|  |  [< Back to previous]                | |  <- Link-style below (optional)
+------------------------------------------+
```

---

## Visual Design

### Footer Container

**Desktop:**
- Background: `#FFFFFF` (white) with subtle top border
- Border: `1px solid rgba(67, 78, 84, 0.1)` (charcoal at 10%)
- Padding: `16px 24px` (py-4 px-6)
- Shadow: `0 -4px 16px rgba(67, 78, 84, 0.08)` - subtle upward shadow for depth
- Position: Sticky at bottom of modal (not absolute, flows with flex layout)

**Mobile:**
- Background: `#FFFFFF` with backdrop blur (`backdrop-blur-sm`)
- Border: `1px solid rgba(67, 78, 84, 0.1)`
- Padding: `16px` with safe area bottom padding (`pb-safe`)
- Shadow: `0 -4px 20px rgba(67, 78, 84, 0.12)` - slightly stronger for mobile
- Position: Fixed at bottom of bottom sheet

### Continue Button (Primary Action)

**Sizing:**
- Desktop: Full width within footer padding, height `48px`
- Mobile: Full width (edge-to-edge within padding), height `52px` (larger touch target)

**Visual States:**

| State | Background | Text | Border | Shadow | Other |
|-------|------------|------|--------|--------|-------|
| Default (Enabled) | `#434E54` (charcoal) | `#FFFFFF` white | none | `shadow-md` | - |
| Hover | `#363F44` (darker charcoal) | `#FFFFFF` white | none | `shadow-lg` | cursor: pointer |
| Active/Pressed | `#2D363A` | `#FFFFFF` white | none | `shadow-sm` | scale: 0.98 |
| Disabled | `rgba(67, 78, 84, 0.3)` | `rgba(255, 255, 255, 0.6)` | none | none | cursor: not-allowed, opacity: 0.6 |
| Loading | `#434E54` | `#FFFFFF` | none | `shadow-md` | spinner icon, cursor: wait |

**Typography:**
- Font size: `16px` (desktop), `17px` (mobile)
- Font weight: `600` (semibold)
- Letter spacing: `0.01em`
- Text transform: none (sentence case)

**Corner Radius:**
- `12px` (rounded-xl) - matches design system for buttons

**Transitions:**
- All color/shadow changes: `200ms ease`
- Scale on press: `100ms ease-out`

### Back Button (Secondary Action)

**Desktop:** Shown inline to the left of continue button

**Sizing:**
- Height: `48px`
- Width: Auto (content-based with padding)
- Padding: `12px 20px`

**Visual States:**

| State | Background | Text | Border | Other |
|-------|------------|------|--------|-------|
| Default | `transparent` | `#434E54` (charcoal) | none | - |
| Hover | `#EAE0D5` (secondary cream) | `#434E54` | none | - |
| Active | `#DCD2C7` | `#434E54` | none | - |

**Typography:**
- Font size: `15px`
- Font weight: `500` (medium)

**Icon:**
- Lucide `ChevronLeft` icon, `20px` size
- Positioned left of text with `8px` gap

**Mobile Alternative:**
- On mobile, back button appears as a text link below the continue button
- Text: "Back to [previous step name]"
- Color: `#434E54` at 70% opacity
- Font size: `14px`
- Centered, with `12px` top margin

### When to Show Back Button

| Step | Current Step Name | Show Back? | Back Goes To |
|------|-------------------|------------|--------------|
| 0 | Service | No | - |
| 1 | Pet | Yes | Service |
| 2 | Date & Time | Yes | Pet |
| 3 | Add-ons | Yes | Date & Time |
| 4 | Review | Yes | Add-ons |
| 5 | Confirmation | No (hide footer) | - |

---

## Step-Specific Button Text

The continue button text should clearly communicate the next action:

| Current Step | Button Text (Enabled) | Button Text (Disabled) | Condition for Enabled |
|--------------|----------------------|------------------------|----------------------|
| 0 - Service | "Continue to Pet Details" | "Select a Service" | Service selected |
| 1 - Pet | "Continue to Date & Time" | "Add Pet Information" | Pet size selected |
| 2 - Date & Time | "Continue to Add-ons" | "Select Date & Time" | Date and time selected |
| 3 - Add-ons | "Review Your Booking" | "Review Your Booking" | Always enabled (addons optional) |
| 4 - Review | "Confirm Booking" | "Complete Your Information" | All required info provided |
| 5 - Confirmation | (Footer hidden) | - | - |

**Mode-Specific Variations:**

| Mode | Step 4 (Review) Button Text |
|------|----------------------------|
| Customer | "Confirm Booking" |
| Admin | "Create Appointment" |
| Walk-in | "Start Service" |

---

## Interaction Design

### Button Click Behavior

1. **Click on Continue (Enabled)**
   - Immediately show loading spinner (replace arrow icon)
   - Change button text to progressive form (e.g., "Saving..." or keep same)
   - Disable button to prevent double-click
   - After action completes (typically instant for navigation), proceed to next step
   - For Review step (submission): Show loading for duration of API call

2. **Click on Continue (Disabled)**
   - Button does not respond (cursor: not-allowed)
   - Optional: Show tooltip explaining what's needed
   - Consider subtle shake animation to draw attention to incomplete fields

3. **Click on Back**
   - Immediate navigation (no loading state needed)
   - Smooth step transition animation

### Loading State Design

**Spinner:**
- Lucide `Loader2` icon with `animate-spin` class
- Size: `20px`
- Color: `#FFFFFF`
- Position: Replaces the arrow icon (right side of button text)

**Button During Loading:**
- Background: Same as enabled state (`#434E54`)
- Text: Same text or contextual (e.g., "Processing...")
- Pointer: `cursor-wait`
- Disabled: Yes (no additional clicks)

### Focus States (Accessibility)

**Continue Button Focus:**
- Outline: `2px solid #434E54` with `2px offset`
- Visible only on keyboard navigation (`:focus-visible`)

**Back Button Focus:**
- Outline: `2px solid #434E54` with `2px offset`
- Background: `#EAE0D5` (same as hover)

### Keyboard Navigation

- `Tab` navigates between Back and Continue buttons (if both visible)
- `Enter` or `Space` activates focused button
- Focus order: Back button (if present) -> Continue button
- Focus trap remains within modal

---

## Responsive Behavior

### Desktop (>= 640px)

- Footer is part of modal flex layout (not position: fixed)
- Uses `flex justify-between items-center`
- Back button on left, Continue button on right
- Continue button: `w-auto` with min-width `200px`
- Total footer height: ~80px including padding

### Mobile (< 640px)

- Footer is `position: fixed` at bottom
- Content area has bottom padding to prevent overlap (~100px)
- Continue button: `w-full`
- Back navigation: Link-style below button (if applicable)
- Safe area padding for devices with home indicator
- Total footer height: ~100px + safe area

### Breakpoint Transition

At `sm` (640px) breakpoint:
- Switch from fixed positioning to flex-based sticky
- Change from stacked layout (button + link) to inline layout (back button + continue button)
- Adjust button sizing (52px mobile -> 48px desktop)

---

## Integration with Modal Structure

### BookingModal.tsx Changes

1. **Desktop Modal Structure:**
```
<div className="flex flex-col max-h-[90vh]">
  <BookingModalHeader />
  <BookingModalProgress />
  <div className="flex-1 overflow-y-auto">
    <BookingWizard />
  </div>
  <BookingModalFooter /> <!-- Sticky via flex, no position: fixed -->
</div>
```

2. **Mobile Bottom Sheet Structure:**
```
<div className="flex flex-col h-[95vh]">
  <DragHandle />
  <BookingModalHeader />
  <BookingModalProgress />
  <div className="flex-1 overflow-y-auto pb-28"> <!-- Padding for fixed footer -->
    <BookingWizard />
  </div>
  <BookingModalFooter isMobile={true} /> <!-- position: fixed -->
</div>
```

### Props Interface for New Footer

```typescript
interface BookingModalFooterProps {
  mode: BookingModalMode;
  currentStep: number;
  totalSteps: number;
  isMobile?: boolean;

  // Navigation handlers (passed from parent or used from store)
  onContinue: () => void | Promise<void>;
  onBack?: () => void;

  // Button state
  canContinue: boolean;
  isLoading?: boolean;

  // Optional customization
  continueText?: string;
  loadingText?: string;
}
```

### Data Flow

The footer needs access to:

1. **Current step** - To determine button text and back visibility
2. **Validation state** - Whether continue should be enabled
3. **Mode** - For mode-specific button text (customer/admin/walkin)
4. **Loading state** - For submission on review step

**Recommended approach:**
- Footer receives props from BookingModal
- BookingModal reads from `useBookingStore` and `useBookingModal`
- Step-specific validation logic lives in a helper function or hook

---

## Accessibility Requirements

### ARIA Labels

```html
<footer role="contentinfo" aria-label="Booking navigation">
  <button
    aria-label="Go back to previous step"
    aria-disabled={currentStep === 0}
  >
    Back
  </button>

  <button
    aria-label={`Continue to ${nextStepName}`}
    aria-disabled={!canContinue}
    aria-busy={isLoading}
  >
    {buttonText}
  </button>
</footer>
```

### Screen Reader Announcements

- When step changes, announce new step name
- When button becomes enabled, no announcement needed (visual only)
- When loading starts, announce "Processing your request"
- On error, announce error message

### Focus Management

- When modal opens, focus moves to modal (header or first interactive element)
- When navigating between steps, focus moves to step content (not footer)
- When step content is short, continue button should be reachable without scrolling

### Color Contrast

- Button text on charcoal background: AAA compliant (white on #434E54)
- Disabled state maintains 3:1 minimum contrast ratio
- Back button text on transparent: AA compliant (#434E54 on #FFFBF7)

---

## Assets Needed

### Icons (Lucide React)

- `ChevronRight` - Continue button arrow (enabled state)
- `ChevronLeft` - Back button arrow
- `Loader2` - Loading spinner (with animate-spin)

### No Additional Images Required

The design uses system fonts and Lucide icons only.

---

## Edge Cases

### 1. Very Short Content
- Footer should not overlap with content
- Minimum content area height ensures proper spacing

### 2. Very Long Content (Mobile)
- Content scrolls, footer remains fixed
- Shadow on footer provides visual separation
- Safe area padding prevents content being hidden

### 3. Confirmation Step
- Footer is completely hidden (return null)
- Confirmation step has its own close/action buttons

### 4. Network Error During Submission
- Loading state ends
- Error message shown in step content (not footer)
- Button returns to enabled state
- User can retry

### 5. Rapid Navigation (Keyboard)
- Debounce navigation to prevent double-steps
- Disable buttons during step transitions

---

## Design Tokens Summary

```css
/* Footer Container */
--footer-bg: #FFFFFF;
--footer-border: rgba(67, 78, 84, 0.1);
--footer-shadow-desktop: 0 -4px 16px rgba(67, 78, 84, 0.08);
--footer-shadow-mobile: 0 -4px 20px rgba(67, 78, 84, 0.12);
--footer-padding-desktop: 16px 24px;
--footer-padding-mobile: 16px;

/* Continue Button */
--btn-primary-bg: #434E54;
--btn-primary-bg-hover: #363F44;
--btn-primary-bg-active: #2D363A;
--btn-primary-bg-disabled: rgba(67, 78, 84, 0.3);
--btn-primary-text: #FFFFFF;
--btn-primary-text-disabled: rgba(255, 255, 255, 0.6);
--btn-primary-radius: 12px;
--btn-primary-height-desktop: 48px;
--btn-primary-height-mobile: 52px;

/* Back Button */
--btn-secondary-bg: transparent;
--btn-secondary-bg-hover: #EAE0D5;
--btn-secondary-text: #434E54;

/* Transitions */
--transition-duration: 200ms;
--transition-easing: ease;
```

---

## Next Steps

**Design specification completed and saved at:**
`C:\Users\Jon\Documents\claude projects\thepuppyday\.claude\design\booking-modal-sticky-footer.md`

**Next Step:** Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan that:

1. Updates `BookingModalFooter.tsx` with the new sticky footer design
2. Removes navigation buttons from individual step components (`ServiceStep.tsx`, `PetStep.tsx`, etc.)
3. Updates `BookingModal.tsx` to pass required props to the new footer
4. Creates a `useStepValidation` hook or helper for determining `canContinue` state
5. Ensures proper responsive behavior between desktop and mobile layouts
