# Walk-In Appointment Feature - Design Specification

## Overview

The Walk-In Appointment feature enables admin staff to quickly register customers who arrive without a prior booking. Unlike the standard 5-step `ManualAppointmentModal`, this streamlined flow prioritizes speed and simplicity for in-person, immediate service.

**Key Differentiators from Standard Booking:**
- Date/time auto-set to NOW (current date, current time slot)
- Email is OPTIONAL (phone required for SMS contact)
- Consolidated single-page form instead of multi-step wizard
- Visual "Walk In" branding to differentiate from scheduled appointments

---

## User Flow

### Primary Flow
1. Admin clicks prominent "Walk In" button on dashboard
2. Walk-In Modal opens with date/time pre-filled to current moment
3. Admin searches for existing customer OR creates new walk-in customer
4. Admin selects existing pet OR creates new pet (quick inline form)
5. Admin selects service and optional add-ons
6. Admin reviews summary and confirms
7. Appointment is created with `source: 'walk_in'` flag

### Edge Cases
- Customer found in system but with different phone (allow override)
- Pet not in system (inline pet creation)
- All time slots for today are full (show warning, allow override)
- Service requires longer duration than remaining business hours (show warning)

---

## Layout Structure

### Walk-In Button Placement (Dashboard)

**Location**: Prominent floating action button (FAB) style OR inline hero action

**Option A - Floating Action Button (Recommended)**
```
Position: Fixed bottom-right corner (mobile) / Top-right of stats area (desktop)
Size: 56px diameter (mobile) / 48px diameter (desktop)
z-index: Above all dashboard content
```

**Option B - Inline Action Card**
```
Position: Above DashboardStats grid, right-aligned
Size: Compact button (auto-width) with icon + text
```

**Recommendation**: Use Option A (FAB) for mobile and a prominent inline button for desktop. The FAB ensures one-tap access regardless of scroll position.

### Dashboard Integration Points

```
Desktop Layout (1024px+):
+--------------------------------------------------+
|  Dashboard Header                    [Walk In]   |
+--------------------------------------------------+
|  Stats Grid (4 columns)                          |
+--------------------------------------------------+
|  Today's Appointments    |   Activity Feed       |
+--------------------------------------------------+

Mobile Layout (<640px):
+--------------------------------------------------+
|  Dashboard Header                                |
+--------------------------------------------------+
|  Stats (stacked)                                 |
+--------------------------------------------------+
|  Today's Appointments                            |
+--------------------------------------------------+
|  Activity Feed                                   |
+--------------------------------------------------+
|                              [FAB Walk In]       |
+--------------------------------------------------+
```

### Walk-In Button Styling

```
Desktop Inline Button:
- Background: Charcoal (#434E54)
- Text: White
- Height: 48px (touch-friendly)
- Padding: 16px 24px
- Border Radius: 12px (rounded-xl)
- Shadow: shadow-md
- Hover: Darker charcoal (#363F44), shadow-lg, subtle lift (-2px Y)
- Icon: Footprints or UserPlus (left of text)
- Label: "Walk In"

Mobile FAB:
- Background: Charcoal (#434E54)
- Size: 56px x 56px
- Border Radius: 28px (rounded-full)
- Shadow: shadow-lg
- Position: Fixed, bottom-right (24px from edges)
- Icon: Footprints (centered, 24px)
- Touch ripple effect on press
- Optional: Tooltip on long-press showing "Walk In"
```

---

## Modal Structure

### Modal Dimensions
- **Desktop**: 600px width, max-height 85vh
- **Tablet**: 90% width, max-height 90vh
- **Mobile**: Full-screen (100vw x 100vh)

### Simplified Layout (Single Page, Scrollable Sections)

```
+--------------------------------------------------+
|  Walk In                                    [X]  |
|  Quick appointment for customers at the door     |
+--------------------------------------------------+
|                                                  |
|  [NOW Badge]  Today, Dec 20 at 2:30 PM          |
|                                                  |
|  ---- CUSTOMER ----                              |
|  [Search existing] or [Quick add new]            |
|  +-- Inline new customer form (expanded) --+     |
|  | Name*  [First]     [Last]               |     |
|  | Phone* [_________]                      |     |
|  | Email  [_________] (optional)           |     |
|  +----------------------------------------+     |
|                                                  |
|  ---- PET ----                                   |
|  [Select existing pet] or [Add new pet]          |
|  +-- Inline new pet form (collapsed) --+         |
|                                                  |
|  ---- SERVICE ----                               |
|  [Service card selection - compact grid]         |
|  [Add-ons - checkbox list]                       |
|                                                  |
|  ---- SUMMARY ----                               |
|  [Price breakdown card]                          |
|                                                  |
+--------------------------------------------------+
|  [Cancel]                    [Create Walk-In]    |
+--------------------------------------------------+
```

### Section Breakdown

**1. Header Section**
- Title: "Walk In" (bold, charcoal)
- Subtitle: "Quick appointment for customers at the door"
- Close button: Ghost button with X icon

**2. DateTime Banner (Auto-filled, Non-editable by default)**
- Badge: "NOW" pill badge (success green background)
- Display: "Today, [Month Day] at [Time]" (e.g., "Today, Dec 20 at 2:30 PM")
- Optional: Small edit icon to allow time adjustment if needed
- Visual: Light cream background (#FFFBF7), subtle border

**3. Customer Section**
- Tab-like toggle: "Search Existing" | "New Customer"
- Search: Same debounced search as existing CustomerSelectionStep
- New Customer Form (inline, always visible):
  - First Name* (required)
  - Last Name* (required)
  - Phone* (required)
  - Email (OPTIONAL - clearly labeled)
- Validation: Phone format, no duplicate phone check (allow override)

**4. Pet Section**
- Conditionally shows after customer selected
- If existing customer: Show pet list first, "Add New" option
- If new customer: Show "Add New Pet" form directly
- New Pet Form:
  - Name* (required)
  - Breed (dropdown, optional for walk-ins)
  - Size* (required - 4 buttons: Small, Medium, Large, X-Large)
  - Weight (optional)

**5. Service Section**
- Compact card grid (2 columns desktop, 1 mobile)
- Service cards show: Name, Duration, Price (for selected pet size)
- Add-ons: Collapsible section with checkboxes
- Real-time price calculation

**6. Summary Section**
- Customer name + "Walk In" badge
- Pet name + size
- Service + add-ons
- Total price (bold, large)
- Notes field (optional textarea)

**7. Footer Actions**
- Cancel: Ghost button, left-aligned
- Create Walk-In: Primary button (success green #6BCB77), right-aligned
- Loading state: Spinner + "Creating..."

---

## Visual Design

### Color Usage

| Element | Color | Hex |
|---------|-------|-----|
| Modal background | White | #FFFFFF |
| Section headers | Charcoal | #434E54 |
| Labels | Charcoal/70 | #434E54 with 70% opacity |
| Helper text | Secondary gray | #6B7280 |
| "NOW" badge | Success green bg | #6BCB77 |
| Optional label | Muted gray | #9CA3AF |
| Required asterisk | Error red | #EF4444 |
| Input focus ring | Charcoal/20 | #434E54 with 20% opacity |
| Section divider | Light gray | #E5E5E5 |
| Summary card bg | Light cream | #FFFBF7 |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal title | 24px | Bold (700) | Charcoal |
| Modal subtitle | 14px | Regular (400) | Gray |
| Section header | 16px | Semibold (600) | Charcoal |
| Labels | 14px | Medium (500) | Charcoal |
| Input text | 16px | Regular (400) | Charcoal |
| Helper/Optional | 12px | Regular (400) | Muted gray |
| Price total | 24px | Bold (700) | Charcoal |

### Spacing

| Context | Value |
|---------|-------|
| Modal padding | 24px (desktop), 16px (mobile) |
| Section gap | 24px |
| Field gap | 16px |
| Inline field gap | 12px |
| Label to input | 8px |
| Button height | 48px (touch-friendly) |
| Input height | 48px (touch-friendly) |

### Shadows

| Element | Shadow |
|---------|--------|
| Modal | shadow-2xl (heavy, prominent) |
| Walk-In FAB | shadow-lg |
| Service cards | shadow-sm (rest) -> shadow-md (hover) |
| Summary card | shadow-sm with border |

### Border Radius

| Element | Radius |
|---------|--------|
| Modal | 16px (rounded-2xl) |
| Sections | 12px (rounded-xl) |
| Inputs | 12px (rounded-xl) |
| Buttons | 12px (rounded-xl) |
| Badges | 9999px (rounded-full) |

---

## Interaction Design

### Walk-In Button

```
Default State:
- Background: #434E54
- Shadow: shadow-md
- Transform: none

Hover State (200ms ease):
- Background: #363F44
- Shadow: shadow-lg
- Transform: translateY(-2px)

Active/Press State:
- Background: #2D3539
- Shadow: shadow-sm
- Transform: translateY(0)

Mobile Touch:
- Ripple effect from touch point
- Scale: 0.95 on press
```

### Modal Open/Close Animation

```
Open:
- Modal: Fade in (opacity 0 -> 1, 200ms) + Slide up (translateY(20px) -> 0, 200ms)
- Backdrop: Fade in (opacity 0 -> 0.5, 150ms)

Close:
- Modal: Fade out (200ms) + Slide down (200ms)
- Backdrop: Fade out (150ms)

Mobile (full-screen):
- Slide up from bottom (300ms, ease-out)
- Slide down to dismiss (300ms, ease-in)
```

### Form Interactions

```
Input Focus:
- Border: 2px solid #434E54
- Ring: 2px #434E54/20
- Transition: 150ms

Input Error:
- Border: 2px solid #EF4444
- Icon: Alert circle appears
- Helper text: Red error message below

Customer Search:
- Debounce: 300ms
- Loading spinner while searching
- Results appear in dropdown
- Click to select, auto-fills section

Pet/Service Selection:
- Radio cards with border highlight
- Selected: 2px charcoal border, cream bg, shadow-md
- Transition: 200ms
```

### Submit Flow

```
Button States:
1. Default: "Create Walk-In" (charcoal/green)
2. Validation error: Button disabled, show inline errors
3. Submitting: Spinner + "Creating..." (disabled)
4. Success: Modal closes, toast notification
5. Error: Show error banner, button re-enabled
```

---

## Responsive Behavior

### Desktop (1024px+)

```
Modal:
- Width: 600px centered
- Max-height: 85vh
- Scrollable content area

Walk-In Button:
- Inline button in dashboard header
- Position: Right side of header, same row as title
- Size: Auto-width, 48px height

Form Layout:
- Name fields: 2 columns (First | Last)
- Service grid: 2 columns
- Add-ons: 2 columns
```

### Tablet (640px - 1023px)

```
Modal:
- Width: 90% centered
- Max-height: 90vh

Walk-In Button:
- Inline button in header OR FAB
- Size: 44px height

Form Layout:
- Name fields: 2 columns
- Service grid: 2 columns
- Add-ons: 1 column
```

### Mobile (<640px)

```
Modal:
- Full-screen (100vw x 100vh)
- No border radius
- Slide-up animation

Walk-In Button:
- Floating Action Button (FAB)
- Position: Fixed bottom-right (24px from edges)
- Size: 56px x 56px
- Icon only (no text)
- z-index: 50 (above content)

Form Layout:
- All fields single column
- Service grid: 1 column (full-width cards)
- Add-ons: 1 column
- Footer: Sticky at bottom
```

---

## Accessibility Requirements

### Keyboard Navigation

1. **Tab Order**: Walk-In button -> Modal trigger -> Close (X) -> Customer toggle -> Search/Name fields -> Pet fields -> Service cards -> Add-ons -> Notes -> Cancel -> Create
2. **Focus Trap**: Focus stays within modal when open
3. **Escape Key**: Closes modal
4. **Enter Key**: Submits form (when valid)

### ARIA Labels

```html
<!-- Walk-In Button -->
<button aria-label="Create walk-in appointment">

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="walk-in-title">

<!-- NOW Badge -->
<span role="status" aria-live="polite">Appointment time: Today at 2:30 PM</span>

<!-- Required Fields -->
<input aria-required="true" aria-invalid="false/true">

<!-- Optional Email -->
<label>Email <span class="sr-only">(optional)</span></label>
<input aria-describedby="email-optional-hint">
<span id="email-optional-hint" class="sr-only">Email is optional for walk-in customers</span>

<!-- Error States -->
<input aria-invalid="true" aria-describedby="phone-error">
<span id="phone-error" role="alert">Please enter a valid phone number</span>
```

### Focus Management

1. **Modal Open**: Focus moves to first interactive element (Close button or Search input)
2. **Customer Selected**: Focus moves to Pet section
3. **Form Submission**: Focus moves to success/error message
4. **Modal Close**: Focus returns to Walk-In button

### Screen Reader Announcements

- Modal open: "Walk-in appointment dialog opened"
- Customer selected: "[Name] selected as customer"
- Pet selected: "[Pet name] selected"
- Service selected: "[Service name] selected, total [price]"
- Form submitted: "Walk-in appointment created successfully"
- Error: "Error creating appointment: [message]"

---

## Form Field Changes

### Email Field - Made Optional

**Current (ManualAppointmentModal)**:
```
Email *
[required input]
Validation: email format, duplicate check
```

**Walk-In Modal**:
```
Email (optional)
[optional input]
Validation: email format only (if provided)
No duplicate check for walk-ins
Helper text: "For appointment confirmations and receipts"
```

### DateTime - Auto-filled

**Current**:
- Step 4: Full date picker + time slot selection
- User must choose date and available time

**Walk-In Modal**:
```
Displayed as read-only banner:
[NOW] Today, December 20 at 2:30 PM

Time rounded to nearest 15-minute slot
e.g., 2:23 PM -> 2:30 PM

Optional edit capability:
- Small pencil icon
- Opens time-only picker (same day)
- For cases when walk-in needs slight adjustment
```

### Phone Field - Validation

**Current**: Standard validation
**Walk-In**: Same validation, but emphasized as primary contact
```
Phone *
[required input]
Helper: "Required for appointment notifications"
```

---

## State Management

### Walk-In Specific State

```typescript
interface WalkInAppointmentState {
  // Auto-set values
  appointmentDate: string; // Today's date (ISO)
  appointmentTime: string; // Current time rounded to 15min

  // Customer (simplified)
  customer: {
    id?: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string; // Optional
    isNew: boolean;
  } | null;

  // Pet
  pet: {
    id?: string;
    name: string;
    breed_id?: string;
    breed_name?: string;
    size: 'small' | 'medium' | 'large' | 'xlarge';
    weight?: number;
    isNew: boolean;
  } | null;

  // Service
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  } | null;

  // Add-ons
  addons: Array<{
    id: string;
    name: string;
    price: number;
  }>;

  // Optional
  notes: string;

  // UI State
  isSubmitting: boolean;
  submitError: string | null;
}
```

### API Payload Extension

```typescript
interface CreateWalkInPayload extends CreateAppointmentPayload {
  source: 'walk_in'; // New field to track origin
  email_optional: true; // Flag for validation
}
```

---

## Assets Needed

### Icons
- **Footprints** (Lucide: `Footprints`) - Walk-In button icon
- **Clock** (Lucide: `Clock`) - DateTime display
- **User** (Lucide: `User`) - Customer section
- **Heart** or **Dog** (Lucide) - Pet section
- **Scissors** (Lucide: `Scissors`) - Service section
- **Check** (Lucide: `Check`) - Selected state
- **X** (Lucide: `X`) - Close button
- **AlertCircle** (Lucide: `AlertCircle`) - Error states
- **Loader2** (Lucide: `Loader2`) - Loading spinner

### Visual Elements
- Subtle paw print watermark (optional, matches existing steps)
- "NOW" badge component (pill-shaped, green)
- Walk-In success animation (optional - checkmark burst)

---

## Component Hierarchy

```
DashboardClient.tsx
  |-- WalkInButton (new)
  |-- WalkInModal (new)
       |-- WalkInHeader
       |-- DateTimeBanner (auto-set to now)
       |-- WalkInCustomerSection
       |   |-- CustomerSearch (reuse existing logic)
       |   |-- WalkInCustomerForm (email optional)
       |-- WalkInPetSection
       |   |-- PetList (if existing customer)
       |   |-- WalkInPetForm
       |-- WalkInServiceSection
       |   |-- ServiceGrid (compact)
       |   |-- AddonsList (collapsible)
       |-- WalkInSummary
       |   |-- PriceBreakdown
       |   |-- NotesField
       |-- WalkInFooter
            |-- CancelButton
            |-- CreateButton
```

---

## Success Criteria

1. **Speed**: Walk-in registration completable in under 60 seconds for returning customers
2. **Clarity**: Clear visual distinction from scheduled appointment flow
3. **Flexibility**: Email optional, time adjustable if needed
4. **Mobile-first**: FAB accessible from any scroll position on mobile
5. **Accessibility**: Full keyboard navigation, screen reader support
6. **Error handling**: Graceful validation with inline feedback

---

## Next Steps

Design specification completed and saved at `.claude/design/walk-in-appointment.md`.

**Next Step**: Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan.

The implementation will include:
1. `WalkInButton` component for dashboard
2. `WalkInModal` component with consolidated form
3. Updates to `DashboardClient.tsx` to integrate the button and modal
4. API payload extension to support `source: 'walk_in'` flag
