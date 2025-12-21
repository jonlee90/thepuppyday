# Admin Appointment Steps - Design Specification

## Overview

Redesign the 5-step admin manual appointment creation wizard to match the visual language, polish, and mobile-first approach of the customer-facing booking flow. The goal is to create a unified, professional experience that feels trustworthy and warm while being optimized for touch devices (tablets and mobile phones) that staff may use in the grooming salon.

---

## Current State Analysis

### Customer Booking Flow (Reference)
The customer booking flow exhibits these design patterns:
- **Themed headers** with icon badges (40x40px cream background, rounded-xl)
- **Subtle paw print decorations** (opacity-[0.04]) for brand personality
- **White cards** with soft shadows (shadow-md) and rounded-xl corners
- **Consistent typography**: H2 at 24px bold, body at 14-16px
- **Selection cards** with clear active states (border-2 primary, cream background, shadow-md)
- **Animated transitions** using Framer Motion for summaries
- **Clear navigation** with Back/Continue buttons, disabled states
- **Price summaries** with clear breakdown and dividers

### Admin Steps (Current Issues)
- Missing themed headers with icon badges
- No paw print decorations (lacks brand personality)
- Inconsistent card styling and padding
- Smaller touch targets (buttons, inputs)
- Basic grid layouts not optimized for tablets
- Missing loading skeletons matching customer flow
- Less polished empty states
- Inconsistent navigation button styling

---

## Design Principles for Redesign

### 1. Unified Visual Language
- Match customer flow headers with icon badges in cream (#EAE0D5) backgrounds
- Add subtle paw print decorations for brand consistency
- Use same card patterns: white bg, shadow-md, rounded-xl, p-4 to p-6

### 2. Mobile-First, Touch-Friendly
- Minimum touch target: 44px height
- Full-width inputs and buttons on mobile
- Generous padding (16px minimum) on interactive elements
- Stack layouts on mobile, 2-column on tablet+

### 3. Admin-Specific Enhancements
- Keep admin-specific features (past date override, payment status)
- Add visual indicators for admin-only capabilities
- Maintain efficiency for power users (keyboard navigation)

---

## Step-by-Step Design Specifications

---

## Step 1: Customer Selection

### Layout Structure

```
Mobile (<640px):
- Single column layout
- Full-width search input (44px height minimum)
- Stacked search results
- Full-width "Create New Customer" accordion

Tablet/Desktop (>=640px):
- Single column layout (max-width: 640px centered)
- Same structure, more breathing room
```

### Header Design

```
[Icon Badge: User icon in cream background, 40x40px, rounded-xl, shadow-sm]
"Select Customer"  (text-2xl font-bold text-[#434E54])
"Search for an existing customer or create a new one"  (text-[#434E54]/70)

Paw print decoration: absolute, top-right, opacity-[0.04]
```

### Search Section

```
Label: "Search Existing Customer" (text-sm font-semibold text-[#434E54])
Input:
  - Height: 48px (touch-friendly)
  - Left icon: Search (text-[#9CA3AF])
  - Placeholder: "Search by name, email, or phone..."
  - Border: border-[#E5E5E5], focus:border-[#434E54]
  - Background: white
  - Rounded: rounded-lg

Loading State:
  - "Searching..." text below input with subtle pulse animation
```

### Search Results

```
Container: max-height: 320px, overflow-y-auto, space-y-3

Customer Card (each result):
  - Container: p-4 rounded-xl border-2 cursor-pointer transition-all
  - Default: border-[#E5E5E5] bg-white hover:border-[#434E54]/30
  - Selected: border-[#434E54] bg-[#FFFBF7] shadow-md

  Layout:
  - Left: Radio button (custom styled, 20px diameter, touch area 44px)
  - Right: Customer info
    - Name: font-semibold text-[#434E54]
    - Email: text-sm text-[#6B7280]
    - Phone: text-sm text-[#6B7280]

  Touch target: Entire card is tappable
```

### Divider

```
"OR" divider:
  - Horizontal line with centered text
  - Line: border-[#E5E5E5]
  - Text: text-[#9CA3AF] text-sm bg-[#F8EEE5] px-4
```

### New Customer Form Toggle

```
Button:
  - Display: flex items-center gap-2
  - Icon: UserPlus (20px)
  - Text: "Create New Customer" (font-semibold text-[#434E54])
  - Chevron: Up/Down indicator (16px)
  - Hover: text-[#363F44]

Form Container (when expanded):
  - Background: bg-[#FFFBF7]
  - Border: border border-[#E5E5E5]
  - Rounded: rounded-xl
  - Padding: p-6 (desktop), p-4 (mobile)
  - Margin-top: mt-4

Form Fields:
  Grid: 2 columns on tablet+, 1 column on mobile

  Each field:
    - Label: text-sm font-medium text-[#434E54] mb-2
    - Required indicator: text-[#EF4444]
    - Input: 48px height, full-width, rounded-lg
    - Error: text-sm text-[#EF4444] mt-1

  Submit Button:
    - Full width
    - Height: 48px
    - Background: bg-[#434E54] hover:bg-[#363F44]
    - Text: white, font-semibold
    - Rounded: rounded-lg
```

### Selected Customer Confirmation

```
Container:
  - Background: bg-[#6BCB77]/10
  - Border: border-2 border-[#6BCB77]
  - Rounded: rounded-xl
  - Padding: p-4

Header:
  - Green dot (8px) + "Customer Selected" label

Content:
  - Name: font-semibold text-[#434E54]
  - "New" badge if applicable
  - Email, Phone: text-sm text-[#6B7280]
```

### Interactions

```
Search Input:
  - Focus: Ring (2px) with primary color at 20% opacity
  - Debounce: 300ms before search

Customer Card Hover:
  - Border transitions to [#434E54]/30
  - Transition: 200ms ease

Customer Card Selection:
  - Border snaps to [#434E54]
  - Background fades to [#FFFBF7]
  - Shadow elevates to shadow-md
```

---

## Step 2: Pet Selection

### Header Design

```
[Icon Badge: Heart icon in cream background, 40x40px, rounded-xl, shadow-sm]
"Select Pet"  (text-2xl font-bold text-[#434E54])
"Choose an existing pet or add a new one"  (text-[#434E54]/70)

Paw print decoration: absolute, top-left, opacity-[0.04]
```

### Existing Pets Section

```
Label: "Select Existing Pet (X)" (text-sm font-semibold text-[#434E54])

Pet Cards (similar to Customer Cards):
  Container: max-height: 320px, overflow-y-auto, space-y-3

  Pet Card:
  - Same styling as Customer cards
  - Left: Radio button
  - Right: Pet info
    - Name: font-semibold text-[#434E54]
    - Breed: text-sm text-[#6B7280]
    - Badges row:
      - Size badge: bg-[#EAE0D5] text-[#434E54] rounded-lg px-3 py-1
      - Weight badge: same styling (if weight exists)
```

### Empty State

```
Container:
  - Background: bg-white
  - Rounded: rounded-xl
  - Shadow: shadow-md
  - Padding: p-8
  - Text-align: center

Icon: Dog icon in cream circle (64px)
Text: "No existing pets found. Please add a new pet below."
Color: text-[#6B7280]
```

### New Pet Form

```
Same toggle pattern as Customer Selection

Form Fields:
  Pet Name:
    - Full width, 48px height

  Breed (Select):
    - Full width, 48px height
    - Searchable dropdown preferred for long breed lists

  Size (Button Group):
    - 2x2 grid on mobile
    - 4 columns on tablet+
    - Each button: 48px height minimum
    - Selected: bg-[#434E54] text-white
    - Default: btn-outline border-[#E5E5E5]

  Weight (Optional):
    - Number input, 48px height
    - Helper text for size recommendation
    - Warning alert if weight/size mismatch
```

---

## Step 3: Service Selection

### Header Design

```
[Icon Badge: Sparkles/Star icon in cream background, 40x40px, rounded-xl, shadow-sm]
"Select Service"  (text-2xl font-bold text-[#434E54])
"Choose the grooming service for this appointment"  (text-[#434E54]/70)

Paw print decoration: absolute, top-right, opacity-[0.04]
```

### Services Section

```
Label: "Select Service *" (text-sm font-semibold text-[#434E54])

Service Cards:
  Layout: Stack on mobile, 2-column grid on tablet+

  Card Design:
  - Container: p-4 rounded-xl border-2 transition-all
  - Selected: border-[#434E54] bg-[#FFFBF7] shadow-md
  - Default: border-[#E5E5E5] bg-white hover:border-[#434E54]/30

  Layout:
  - Left: Radio button (44px touch area)
  - Center: Service info
    - Name: font-semibold text-[#434E54]
    - Description: text-sm text-[#6B7280] line-clamp-2
    - Duration badge: bg-[#EAE0D5] text-[#434E54] text-xs
  - Right: Price
    - Price: font-bold text-[#434E54] text-lg
    - Size context: text-xs text-[#6B7280]
```

### Add-ons Section

```
Label: "Add-ons (Optional)" (text-sm font-semibold text-[#434E54])

Addon Cards:
  Similar to service cards but with checkboxes

  - Checkbox: Custom styled, 24px, touch area 44px
  - Multiple selection allowed
  - Same hover/selected states
```

### Price Summary Panel

```
Container:
  - Background: bg-[#FFFBF7]
  - Border: border border-[#E5E5E5]
  - Rounded: rounded-xl
  - Padding: p-6

Header: "Price Summary" (font-semibold text-[#434E54])

Line Items:
  - Service name + price (flex justify-between)
  - Addon items (if any)

Divider: border-t border-[#E5E5E5] my-3

Total:
  - "Total" label: font-bold text-[#434E54]
  - Amount: font-bold text-xl text-[#434E54]
```

---

## Step 4: Date & Time

### Header Design

```
[Icon Badge: Calendar icon in cream background, 40x40px, rounded-xl, shadow-sm]
"Select Date & Time"  (text-2xl font-bold text-[#434E54])
"Pick the appointment date and time slot"  (text-[#434E54]/70)

Paw print decoration: absolute, top-right, opacity-[0.04]
```

### Date Selection

```
Label: "Select Date *" (text-sm font-semibold text-[#434E54])

Date Input:
  - Height: 48px
  - Left icon: Calendar
  - Full width
  - Native date picker (touch-friendly on mobile)

Warnings:
  Past Date:
    - Alert: bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-3
    - Icon: AlertTriangle
    - Text: "This date is in the past"
    - Override button (admin-only capability)

  Blocked Date:
    - Similar alert styling
    - Explains why date is unavailable
```

### Time Slots

```
Label: "Select Time *" (text-sm font-semibold text-[#434E54])

Time Slot Grid:
  Mobile: 3 columns
  Tablet: 4 columns
  Desktop: 5 columns
  Gap: 8px

  Each Slot Button:
    - Height: 44px minimum
    - Display: flex items-center justify-center gap-1
    - Icon: Clock (12px)
    - Time: AM/PM format

    States:
    - Default: btn-outline border-[#E5E5E5] text-[#434E54]
    - Selected: bg-[#434E54] text-white
    - Disabled (Full): bg-[#F5F5F5] text-[#9CA3AF] cursor-not-allowed

  Hover: border-[#434E54] (200ms transition)
```

### Notes Section

```
Label: "Notes (Optional)" (text-sm font-semibold text-[#434E54])

Textarea:
  - Min-height: 120px
  - Full width
  - Rounded: rounded-lg
  - Placeholder: "Add any special instructions or notes..."

Character Count:
  - Position: text-right below textarea
  - Format: "X / 1000 characters"
  - Color: text-[#9CA3AF] text-xs
```

### Payment Status Section

```
Label: "Payment Status *" (text-sm font-semibold text-[#434E54])

Status Button Group:
  Layout: flex gap-2 (3 buttons)
  Mobile: Stack if needed, or equal-width flex

  Buttons:
    - Height: 48px
    - Flex: flex-1 (equal width)
    - Selected: bg-[#434E54] text-white
    - Default: btn-outline border-[#E5E5E5] text-[#434E54]

    Labels: "Pending" | "Paid" | "Partially Paid"
```

### Payment Details (Conditional)

```
Container (when paid/partially paid):
  - Background: bg-[#FFFBF7]
  - Border: border border-[#E5E5E5]
  - Rounded: rounded-xl
  - Padding: p-6
  - Space-y: 16px

Amount Paid:
  - Input with $ icon prefix
  - Helper: "Total: $XX.XX"

Payment Method:
  - Select dropdown, 48px height
  - Options: Cash, Card, Check, Venmo, Zelle, Other
```

---

## Step 5: Summary

### Header Design

```
[Icon Badge: CheckCircle icon in cream background, 40x40px, rounded-xl, shadow-sm]
"Review Appointment"  (text-2xl font-bold text-[#434E54])
"Please review all details before creating the appointment"  (text-[#434E54]/70)

Paw print decoration: absolute, top-left, opacity-[0.04]
```

### Summary Cards

Each section follows this pattern:

```
Card Container:
  - Background: bg-white
  - Border: border border-[#E5E5E5]
  - Rounded: rounded-xl
  - Shadow: shadow-sm
  - Padding: p-6

Card Header:
  - Icon badge (cream background, 32px, rounded-lg)
  - Section title (font-semibold text-[#434E54])
  - Flex items-center gap-3 mb-4

Card Content:
  - Key-value pairs
  - Label: text-[#6B7280]
  - Value: font-medium text-[#434E54]
  - Layout: flex justify-between
```

### Section Order

1. **Customer Information**
   - Icon: User
   - Fields: Name (with "New" badge if applicable), Email, Phone

2. **Pet Information**
   - Icon: Dog/Heart
   - Fields: Name (with "New" badge), Breed, Size, Weight (if exists)

3. **Service Details**
   - Icon: Scissors
   - Fields: Service name, Service price
   - Add-ons subsection (if any)

4. **Appointment Schedule**
   - Icon: Calendar
   - Fields: Date (formatted nicely), Time
   - Notes subsection (if exists)

5. **Payment Information**
   - Icon: DollarSign
   - Fields: Total Price (bold, larger), Payment Status
   - Amount Paid, Payment Method (if paid/partially paid)

### Warnings

```
Past Date Warning:
  - Container: bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-4
  - Icon: AlertTriangle
  - Text: "Warning: This appointment is scheduled for a past date"
```

---

## Navigation Design (All Steps)

### Layout

```
Container:
  - Position: sticky bottom on mobile, or at end of content
  - Padding: pt-4 (with border-t on mobile if sticky)
  - Layout: flex justify-between items-center
```

### Back Button

```
Design:
  - Style: Ghost/text button
  - Icon: ChevronLeft (20px) before text
  - Text: "Back"
  - Color: text-[#434E54]
  - Padding: py-2.5 px-5
  - Rounded: rounded-lg

Hover:
  - Background: bg-[#EAE0D5]
  - Transition: 200ms

Touch Target:
  - Minimum: 44px height
```

### Continue/Submit Button

```
Design:
  - Background: bg-[#434E54]
  - Text: white, font-semibold
  - Icon: ChevronRight (20px) after text (or Checkmark for final step)
  - Padding: py-3 px-8
  - Rounded: rounded-lg
  - Shadow: shadow-md

Hover:
  - Background: bg-[#363F44]
  - Shadow: shadow-lg
  - Transition: 200ms

Disabled:
  - Background: bg-[#434E54]/40
  - Opacity: 50%
  - Cursor: not-allowed

Loading State:
  - Spinner (20px) + "Creating..."
```

---

## Loading States

### Skeleton Patterns

```
Customer/Pet Search Loading:
  - 2 skeleton cards
  - Card: bg-white rounded-xl shadow-md p-4 animate-pulse
  - Inner elements: bg-[#EAE0D5] rounded

Services Loading:
  - 2 skeleton service cards
  - Each with header bar (h-5 w-3/4) + body bars + price

Time Slots Loading:
  - Grid of 6-8 skeleton buttons
  - Each: bg-[#EAE0D5] rounded h-10
```

### Inline Loading

```
Searching:
  - Spinner (16px) + "Searching..." text
  - Position: below search input
  - Color: text-[#6B7280]
```

---

## Error States

### Form Field Errors

```
Input Border: border-[#EF4444]
Error Message:
  - Color: text-[#EF4444]
  - Size: text-sm
  - Position: mt-1 below input
```

### API Errors

```
Alert Container:
  - Background: bg-[#EF4444]/10
  - Border: border border-[#EF4444]
  - Rounded: rounded-lg
  - Padding: p-4

Content:
  - Icon: AlertTriangle
  - Title: "Error" (font-semibold)
  - Message: text-sm
  - Retry button (if applicable)
```

---

## Micro-Interactions

### Card Selection

```
Transition Properties:
  - border-color: 200ms ease
  - background-color: 200ms ease
  - box-shadow: 200ms ease

On Select:
  1. Border snaps to primary (no animation, immediate feedback)
  2. Background fades to cream (200ms)
  3. Shadow elevates (200ms)
```

### Button Press

```
Active State:
  - Scale: 0.98
  - Transition: 100ms

Success Button Click:
  - Brief scale pulse (1.02 -> 1.0)
```

### Form Focus

```
Input Focus:
  - Ring: ring-2 ring-[#434E54]/20
  - Border: border-[#434E54]
  - Transition: 150ms
```

### Summary Reveal

```
On Step Entry:
  - Cards fade in staggered (100ms delay each)
  - Initial: opacity-0, translateY(10px)
  - Final: opacity-1, translateY(0)
  - Duration: 300ms
  - Easing: ease-out
```

---

## Responsive Breakpoints

### Mobile (<640px)

- Single column layouts
- Full-width buttons and inputs
- 16px horizontal padding
- Stack navigation buttons if needed
- Larger touch targets (48px minimum)
- Collapsible sections for long content

### Tablet (640px - 1024px)

- 2-column grids where appropriate
- Side-by-side service/addon cards
- 24px horizontal padding
- Comfortable spacing between elements

### Desktop (>1024px)

- Max-width container (768px for wizard content)
- 32px horizontal padding
- More generous whitespace
- Horizontal layouts for compact elements

---

## Accessibility Requirements

### Keyboard Navigation

- Tab order follows visual order
- Enter/Space activates buttons and radio/checkboxes
- Arrow keys navigate within radio groups
- Escape closes expanded sections

### Focus States

- Visible focus ring on all interactive elements
- Focus ring: ring-2 ring-[#434E54]/40 ring-offset-2
- High contrast against all backgrounds

### ARIA Labels

- Radio groups: role="radiogroup" with aria-label
- Checkboxes: clear aria-checked state
- Loading states: aria-busy="true"
- Error messages: linked via aria-describedby

### Screen Reader

- Step progress announced on navigation
- Form validation errors announced immediately
- Success/error states have role="alert"
- Selected states clearly announced

---

## Assets Needed

### Icons (Lucide React)

- User, UserPlus
- Search
- ChevronDown, ChevronUp, ChevronLeft, ChevronRight
- Heart (or Dog for pet)
- Scissors, Sparkles
- Calendar, Clock
- DollarSign
- AlertTriangle
- CheckCircle
- Plus

### Paw Print SVG

```svg
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
</svg>
```

---

## Next Steps

Design specification completed and saved at `.claude/design/admin-appointment-steps.md`.

**Next Step**: Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan.

The daisyui-expert will:
1. Map these design specifications to DaisyUI component classes
2. Create responsive Tailwind utility class combinations
3. Implement the actual React/TypeScript components
4. Ensure consistency with existing DaisyUI patterns in the codebase
