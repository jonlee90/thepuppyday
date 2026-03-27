# Booking Widget Modal - Design Specification

## Overview

A popup modal that presents the full booking experience on the marketing page. The modal provides an elegant, focused booking flow while allowing users to remain in context on the marketing page. It wraps the existing `BookingWizard` component functionality within a beautifully designed modal container.

**Purpose**: Enable users to book appointments directly from the marketing page without navigating away, creating a seamless conversion experience.

**Target Users**: First-time visitors, returning customers, pet owners looking to quickly book grooming services.

---

## User Flow

### Entry Points
1. **Primary CTA Button**: "Book Now" / "Schedule Appointment" buttons throughout marketing page
2. **Hero Section CTA**: Main call-to-action in hero banner
3. **Service Cards**: "Book This Service" buttons on service descriptions
4. **Sticky Header CTA**: Persistent booking button in navigation (mobile/desktop)

### Flow Sequence by Mode

**Customer Mode** (Marketing Page - 7 steps):
```
Step 0: Service Selection
    ↓
Step 1: Date & Time Selection
    ↓
Step 2: Customer Information
    ↓
Step 3: Pet Information
    ↓
Step 4: Add-ons (Optional)
    ↓
Step 5: Review & Confirm
    ↓
Step 6: Confirmation (Success)
```

**Admin Mode** (Admin Appointments - 7 steps):
```
Step 0: Service Selection
    ↓
Step 1: Date & Time Selection
    ↓
Step 2: Customer Search/Create
    ↓
Step 3: Pet Selection
    ↓
Step 4: Add-ons (Optional)
    ↓
Step 5: Review Appointment
    ↓
Step 6: Appointment Created
```

**Walk-in Mode** (Admin Dashboard - 5 steps):
```
Step 0: Service Selection
    ↓
Step 1: Customer Search/Create
    ↓
Step 2: Pet Selection
    ↓
Step 3: Add-ons (Optional)
    ↓
Step 4: Walk-in Confirmed
```

> **Note**: Walk-in mode skips Date/Time (auto-set to NOW) and Review steps.

### Exit Points
- Close button (X) in modal header
- Click outside modal (overlay click)
- Escape key press
- Successful booking completion (auto-close after delay or manual close)
- Browser back button (should close modal, not navigate away)

---

## Layout Structure

### Desktop Layout (>1024px)

```
+----------------------------------------------------------+
|                    OVERLAY (rgba(0,0,0,0.5))             |
|  +----------------------------------------------------+  |
|  |                 MODAL CONTAINER                     |  |
|  |  Max-width: 900px | Min-height: 600px              |  |
|  |  Centered horizontally and vertically              |  |
|  |                                                     |  |
|  |  +----------------------------------------------+  |  |
|  |  |              MODAL HEADER                    |  |  |
|  |  |  [Paw Icon] The Puppy Day     [X Close]     |  |  |
|  |  +----------------------------------------------+  |  |
|  |                                                     |  |
|  |  +----------------------------------------------+  |  |
|  |  |           PROGRESS INDICATOR                 |  |  |
|  |  |  (1)---(2)---(3)---(4)---(5)               |  |  |
|  |  +----------------------------------------------+  |  |
|  |                                                     |  |
|  |  +----------------------------------------------+  |  |
|  |  |                                              |  |  |
|  |  |            STEP CONTENT AREA                 |  |  |
|  |  |         (BookingWizard Steps)                |  |  |
|  |  |                                              |  |  |
|  |  |     Scrollable if content exceeds height     |  |  |
|  |  |                                              |  |  |
|  |  +----------------------------------------------+  |  |
|  |                                                     |  |
|  |  +----------------------------------------------+  |  |
|  |  |              MODAL FOOTER                    |  |  |
|  |  |   Trust badges | Hours | Contact             |  |  |
|  |  +----------------------------------------------+  |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

**Dimensions**:
- Modal max-width: 900px
- Modal max-height: 90vh
- Modal min-height: 600px
- Border radius: 24px (rounded-3xl)
- Padding: 0 (content areas have their own padding)
- Shadow: `0 25px 50px -12px rgba(67, 78, 84, 0.25)`

### Tablet Layout (640px - 1024px)

```
+------------------------------------------+
|              OVERLAY                      |
|  +------------------------------------+  |
|  |         MODAL (95% width)          |  |
|  |  Max-width: 700px                  |  |
|  |                                    |  |
|  |  [Header with close button]        |  |
|  |  [Compact progress bar]            |  |
|  |  [Step content - scrollable]       |  |
|  |  [Footer - trust signals]          |  |
|  +------------------------------------+  |
+------------------------------------------+
```

**Adjustments**:
- Modal width: 95% (max 700px)
- Compact progress indicator (horizontal bar style)
- Reduced padding: 16px horizontal

### Mobile Layout (<640px) - Bottom Sheet Style

```
+---------------------------+
|                           |
|       Marketing Page      |
|       (dimmed overlay)    |
|                           |
+---------------------------+
|  +---------------------+  | <- Drag handle
|  |    MODAL HEADER     |  |
|  | [Back] Title [Close]|  |
+---------------------------+
|                           |
|   PROGRESS (compact bar)  |
|                           |
+---------------------------+
|                           |
|                           |
|     STEP CONTENT          |
|     (Full screen height)  |
|     (Scrollable)          |
|                           |
|                           |
+---------------------------+
|    FOOTER / CTA BUTTON    |
| [Continue] or [Book Now]  |
+---------------------------+
```

**Mobile Behavior**:
- Slides up from bottom (bottom sheet pattern)
- Height: 95vh (leaves sliver of page visible)
- Drag handle at top for dismissal gesture
- Swipe down to close
- Fixed footer with primary CTA button

---

## Visual Design

### Color Palette Usage

| Element | Color | Value |
|---------|-------|-------|
| Modal Background | Cream | `#FFFBF7` |
| Overlay | Dark with opacity | `rgba(67, 78, 84, 0.6)` |
| Header Background | White | `#FFFFFF` |
| Header Border | Light gray | `rgba(67, 78, 84, 0.1)` |
| Footer Background | Light cream | `#F8EEE5` |
| Primary Button | Charcoal | `#434E54` |
| Primary Button Hover | Darker charcoal | `#363F44` |
| Close Button | Charcoal with opacity | `#434E54` at 60% |
| Close Button Hover | Full charcoal | `#434E54` |
| Progress Active | Charcoal | `#434E54` |
| Progress Inactive | Secondary cream | `#EAE0D5` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header Title | 18px | Semibold (600) | `#434E54` |
| Step Title | 24px | Bold (700) | `#434E54` |
| Step Subtitle | 16px | Regular (400) | `#6B7280` |
| Body Text | 16px | Regular (400) | `#434E54` |
| Button Text | 16px | Semibold (600) | White |
| Caption | 14px | Medium (500) | `#9CA3AF` |

### Shadows

| Element | Shadow |
|---------|--------|
| Modal Container | `0 25px 50px -12px rgba(67, 78, 84, 0.25)` |
| Header (subtle) | `0 1px 3px rgba(67, 78, 84, 0.05)` |
| Close Button (hover) | `0 2px 8px rgba(67, 78, 84, 0.15)` |
| Primary Button | `0 4px 14px rgba(67, 78, 84, 0.25)` |

### Border Radius

| Element | Radius |
|---------|--------|
| Modal Container | 24px (desktop), 20px top-only (mobile) |
| Close Button | 12px |
| Primary Button | 12px |
| Input Fields | 12px |
| Cards within steps | 16px |

---

## Component Breakdown

### 1. Modal Overlay Component

**Purpose**: Darkened backdrop that focuses attention on modal

**Specifications**:
- Background: `rgba(67, 78, 84, 0.6)` with `backdrop-blur-sm`
- Click to close (configurable)
- Fade in/out animation (300ms)
- z-index: 50

### 2. Modal Container Component

**Purpose**: Main modal wrapper with positioning and sizing

**Specifications**:
- Position: Fixed, centered (flex centering)
- Background: `#FFFBF7`
- Border radius: 24px (desktop), 20px 20px 0 0 (mobile)
- Shadow: Large, soft
- Overflow: Hidden (content scrolls internally)
- z-index: 51

### 3. Modal Header Component

**Purpose**: Branding, title, and close action

**Layout**:
```
+--------------------------------------------------+
| [Paw Icon] The Puppy Day          [X Close Btn] |
+--------------------------------------------------+
```

**Specifications**:
- Height: 64px
- Background: White
- Border-bottom: 1px solid `rgba(67, 78, 84, 0.1)`
- Padding: 0 24px
- Logo/Icon: 32x32px paw print icon in charcoal
- Title: "The Puppy Day" or step-specific title
- Close button: 40x40px touch target, 32x32px visual

**Close Button States**:
- Default: `#434E54` at 60% opacity, no background
- Hover: `#434E54` at 100%, background `#EAE0D5`
- Active: Scale 0.95
- Focus: Ring 2px `#434E54` at 30%

### 4. Progress Indicator (Compact Modal Version)

**Purpose**: Show booking progress within modal context

**Desktop Version**:
- Horizontal stepper with numbered circles
- Connected by lines
- Completed steps: Filled charcoal with checkmark
- Current step: Filled charcoal with pulse animation
- Future steps: Light cream background

**Mobile Version**:
- Compact progress bar with percentage
- Step counter: "Step 2 of 5"
- Current step name displayed

### 5. Content Area Component

**Purpose**: Container for BookingWizard step content

**Specifications**:
- Flex: 1 (fills available space)
- Overflow-y: auto (scrollable)
- Padding: 24px (desktop), 16px (mobile)
- Background: Gradient from white to cream
- Min-height: 400px (desktop)
- Max-height: calc(90vh - header - footer)

**Scroll Behavior**:
- Custom scrollbar styling (thin, charcoal track)
- Scroll shadow indicators at top/bottom when scrollable
- Smooth scroll-snap for mobile

### 6. Modal Footer Component

**Purpose**: Trust signals and secondary information

**Layout**:
```
+--------------------------------------------------+
| [Check] No payment required  [Clock] Mon-Sat 9-5 |
|              [Heart] Expert grooming care         |
+--------------------------------------------------+
```

**Specifications**:
- Height: Auto (content-based), min 60px
- Background: `#F8EEE5`
- Border-top: 1px solid `rgba(67, 78, 84, 0.1)`
- Padding: 16px 24px
- Flex wrap for responsive badges

**Mobile Footer Alternative**:
- Fixed position at bottom
- Contains primary CTA button
- Trust signals hidden or minimal

### 7. Trigger Button Component

**Purpose**: Button that opens the booking modal

**Variants**:

**Primary (Hero CTA)**:
- Size: Large (py-4 px-8)
- Background: `#434E54`
- Text: White, 18px, semibold
- Border radius: 12px
- Shadow: Medium
- Icon: Calendar or paw print (optional)

**Secondary (Inline)**:
- Size: Medium (py-3 px-6)
- Background: `#434E54`
- Text: White, 16px, semibold
- Border radius: 10px

**Outline (Subtle)**:
- Size: Medium
- Background: Transparent
- Border: 2px solid `#434E54`
- Text: `#434E54`

**States**:
- Hover: Darken background, increase shadow
- Active: Scale 0.98
- Focus: Ring 2px offset
- Loading: Spinner replacing text

---

## Interaction Design

### Modal Open Animation

**Desktop**:
```
Duration: 300ms
Easing: cubic-bezier(0.16, 1, 0.3, 1) (ease-out-expo)

Overlay:
  - Opacity: 0 --> 1

Modal Container:
  - Opacity: 0 --> 1
  - Scale: 0.95 --> 1
  - Y: 20px --> 0
```

**Mobile (Bottom Sheet)**:
```
Duration: 400ms
Easing: cubic-bezier(0.32, 0.72, 0, 1) (spring-like)

Overlay:
  - Opacity: 0 --> 1

Modal Container:
  - Y: 100% --> 0
```

### Modal Close Animation

**Desktop**:
```
Duration: 200ms
Easing: cubic-bezier(0.4, 0, 1, 1) (ease-in)

Overlay:
  - Opacity: 1 --> 0

Modal Container:
  - Opacity: 1 --> 0
  - Scale: 1 --> 0.95
```

**Mobile**:
```
Duration: 300ms
Easing: ease-in

Modal Container:
  - Y: 0 --> 100%
```

### Step Transitions (Within Modal)

Leverage existing BookingWizard animations:
```
Duration: 300ms
Easing: cubic-bezier(0.22, 1, 0.36, 1)

Entering step:
  - X: 50px --> 0 (forward) or -50px --> 0 (backward)
  - Opacity: 0 --> 1

Exiting step:
  - X: 0 --> -50px (forward) or 0 --> 50px (backward)
  - Opacity: 1 --> 0
```

### Close Button Interaction

```
Hover:
  - Background: transparent --> #EAE0D5
  - Opacity: 60% --> 100%
  - Duration: 150ms

Active:
  - Scale: 1 --> 0.95
  - Duration: 100ms
```

### Overlay Click to Close

- Click on overlay area triggers close
- Brief highlight feedback (optional)
- Configurable: Can be disabled during critical steps (e.g., payment)

### Escape Key

- Pressing Escape closes modal
- Should be disabled during submission/loading states

### Mobile Drag to Dismiss

```
Gesture: Swipe down from header or drag handle
Threshold: 100px drag distance
Animation: Spring physics to snap closed
Feedback: Modal follows finger with resistance
```

### Focus Management

1. On open: Focus trapped within modal
2. First focusable element receives focus (skip to content link or first input)
3. Tab cycles through modal elements only
4. On close: Return focus to trigger button

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Bottom sheet (full-width, slides up) |
| 640px - 1024px | Centered modal (95% width, max 700px) |
| > 1024px | Centered modal (max 900px) |

### Mobile-Specific Adaptations

1. **Bottom Sheet Pattern**
   - Modal attaches to bottom of viewport
   - Rounded corners only on top
   - Drag handle for gestural dismiss
   - 95vh height (peek of page behind)

2. **Compact Header**
   - Back button (for step navigation)
   - Centered step title
   - Close button (X)

3. **Fixed Footer CTA**
   - Primary action button always visible
   - Sticky at bottom of modal
   - Full-width button

4. **Simplified Progress**
   - Horizontal progress bar (not circles)
   - "Step X of Y" text
   - Current step name

5. **Touch-Optimized**
   - Minimum 44px touch targets
   - Swipe gestures supported
   - No hover states (tap feedback instead)

### Tablet Adaptations

1. Modal width: 95% of viewport (max 700px)
2. Progress indicator: Compact stepper
3. Two-column layouts within steps where appropriate

### Desktop Features

1. Keyboard navigation fully supported
2. Hover states on all interactive elements
3. Full stepper progress indicator
4. Optional: Floating price summary sidebar

---

## Accessibility Requirements

### ARIA Attributes

```html
<!-- Modal container -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Book Your Appointment</h2>
  <p id="modal-description">Complete the form to schedule your pet's grooming session</p>
</div>

<!-- Close button -->
<button
  aria-label="Close booking modal"
  type="button"
>
  <span aria-hidden="true">X</span>
</button>

<!-- Progress indicator -->
<nav aria-label="Booking progress">
  <ol>
    <li aria-current="step">Service Selection</li>
    <li>Pet Information</li>
    ...
  </ol>
</nav>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift + Tab | Move to previous focusable element |
| Escape | Close modal |
| Enter | Activate button/link |
| Space | Activate button, toggle checkbox |
| Arrow keys | Navigate within form fields, calendar |

### Focus Management

1. **On Open**: Focus moves to modal (first focusable element or skip link)
2. **Focus Trap**: Tab cycling stays within modal
3. **On Close**: Focus returns to trigger button
4. **Step Change**: Focus moves to step heading or first interactive element

### Screen Reader Announcements

- Modal open: "Booking modal opened. Step 1 of 5: Service Selection"
- Step change: "Step 2 of 5: Pet Information"
- Validation errors: "Error: Please select a service"
- Success: "Booking confirmed. Reference number: ABC123"

### Color Contrast

All text meets WCAG 2.1 AA standards:
- Primary text (`#434E54` on `#FFFBF7`): 7.5:1 ratio
- Secondary text (`#6B7280` on `#FFFBF7`): 4.8:1 ratio
- Button text (white on `#434E54`): 8.2:1 ratio

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .modal-enter,
  .modal-exit,
  .step-transition {
    animation: none;
    transition: opacity 0.1s;
  }
}
```

---

## State Management Integration

### Using Existing BookingStore

The modal will leverage the existing `useBookingStore` Zustand store:

```typescript
// Modal-specific state additions (if needed)
interface ModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  preSelectedServiceId?: string;
}
```

### Session Persistence

- Booking progress saved to sessionStorage (existing behavior)
- If user closes modal and reopens, progress is restored
- 30-minute session timeout (existing behavior)

### Modal State Hooks

```typescript
// Recommended hook interface
function useBookingModal() {
  return {
    isOpen: boolean;
    open: (options?: { serviceId?: string }) => void;
    close: () => void;
    canClose: boolean; // False during submission
  };
}
```

---

## Integration with Existing Components

### BookingWizard Integration

The modal wraps `BookingWizard` with `embedded={true}`:

```tsx
<BookingModal isOpen={isOpen} onClose={handleClose}>
  <BookingWizard embedded={true} preSelectedServiceId={serviceId} />
</BookingModal>
```

### BookingProgress Integration

Use existing `BookingProgress` component with compact styling:

```tsx
<BookingProgress
  currentStep={currentStep}
  onStepClick={setStep}
  canNavigateToStep={canNavigateToStep}
  variant="compact" // New prop for modal context
/>
```

### EmbeddedBookingWidget Reference

The modal design can reference `EmbeddedBookingWidget` for:
- Loading state spinner
- Trust signals footer
- Overall styling patterns

---

## Loading & Error States

### Initial Loading

```
+------------------------------------+
|         MODAL HEADER               |
+------------------------------------+
|                                    |
|     [Animated paw print spinner]   |
|                                    |
|     Loading booking experience...  |
|                                    |
+------------------------------------+
```

- Dual-ring spinner (existing pattern)
- Centered in content area
- Subtle pulse animation

### Step Loading

- Skeleton loaders for services/pets lists
- Spinner on submit buttons
- Disabled state during async operations

### Error States

```
+------------------------------------+
|         MODAL HEADER               |
+------------------------------------+
|                                    |
|     [Warning icon in circle]       |
|                                    |
|     Something went wrong           |
|     We couldn't load the services  |
|                                    |
|     [Retry Button]                 |
|                                    |
+------------------------------------+
```

- Clear error messaging
- Retry action available
- Option to close and try again

### Offline State

- Detect network status
- Show friendly offline message
- Auto-retry when connection restored

---

## Success/Confirmation State

### Confirmation View

```
+------------------------------------+
|         MODAL HEADER               |
|                              [X]   |
+------------------------------------+
|                                    |
|     [Checkmark in circle - green]  |
|                                    |
|     Booking Confirmed!             |
|                                    |
|     Your appointment is scheduled  |
|     for [Date] at [Time]           |
|                                    |
|     Reference: #ABC123             |
|                                    |
|     [Add to Calendar]              |
|                                    |
|     [Close] [View Details]         |
|                                    |
+------------------------------------+
```

**Animations**:
- Checkmark draws in with spring animation
- Confetti or subtle celebration particles (optional)
- Text fades in sequentially

**Actions**:
- Add to Calendar (Google, Apple, Outlook options)
- View Details (navigate to customer portal)
- Close (return to marketing page)

---

## Assets Needed

### Icons (Lucide React)
- X (close)
- ChevronLeft / ChevronRight (navigation)
- Calendar
- Clock
- Check / CheckCircle
- Heart
- AlertCircle (errors)
- Loader (spinner)
- GripHorizontal (drag handle)

### Illustrations
- Puppy mascot illustration (welcome state) - if desired
- Paw print decorative elements
- Bone decorative elements (subtle)

### Animations
- Spinner (existing dual-ring)
- Step transitions (existing Framer Motion)
- Success checkmark draw
- Optional: Confetti burst

---

## Technical Considerations

### Portal Rendering

Modal should render via React Portal to document.body to avoid z-index and overflow issues.

### Body Scroll Lock

When modal is open:
- `document.body.style.overflow = 'hidden'`
- Prevent background scroll on mobile
- Restore on close

### URL State (Optional)

Consider updating URL when modal opens:
- `?booking=open` or `#book`
- Enables sharing link that opens modal
- Browser back closes modal

### Performance

- Lazy load modal component
- Preload on hover over trigger button
- Skeleton loading for step content

---

## Next Steps

**Handoff to Implementation**:

This design specification is ready for implementation by `@agent-daisyui-expert`.

**Implementation Priority**:
1. Modal container and overlay
2. Header with close functionality
3. Integration with BookingWizard (embedded mode)
4. Responsive behavior (desktop first, then mobile bottom sheet)
5. Animations (open/close, step transitions)
6. Accessibility features
7. Trigger button variants

**Files to Create/Modify**:
- `src/components/booking/BookingModal.tsx` (new)
- `src/components/booking/BookingModalTrigger.tsx` (new)
- `src/hooks/useBookingModal.ts` (new)
- Update marketing page to use modal trigger

---

**Design Specification Complete**

Created by: frontend-expert agent
Date: December 22, 2024
**Last Updated**: December 22, 2024 (Mode-specific step orders updated)
Output: `.claude/design/booking-widget-modal.md`

## Implementation Status

✅ **Implemented Components**:
- `BookingModal.tsx` - Modal container with responsive layouts
- `BookingModalTrigger.tsx` - Trigger buttons (HeroBookingButton, AdminCreateButton, WalkInButton)
- `BookingModalHeader.tsx` - Dynamic header with step titles
- `BookingModalFooter.tsx` - Sticky footer with continue button
- `BookingModalProgress.tsx` - Progress indicator
- `useBookingModal.ts` - Modal state management with MODE_CONFIG

✅ **Step Components**:
- `ServiceStep.tsx` - Service selection
- `DateTimeStep.tsx` - Date/time picker
- `CustomerStep.tsx` - Customer search/create (for admin/walk-in modes)
- `PetStep.tsx` - Pet selection with customerId support
- `AddonsStep.tsx` - Add-on selection
- `ReviewStep.tsx` - Booking review
- `ConfirmationStep.tsx` - Success confirmation

✅ **Step Validation**:
- `step-validation.ts` - Mode-aware validation logic
