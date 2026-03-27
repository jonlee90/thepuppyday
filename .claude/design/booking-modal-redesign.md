# Booking Modal Redesign - Design Specification

## Overview

The booking modal is a multi-step wizard that guides users through creating appointments. It currently supports three modes (customer, admin, walk-in) with 5-6 steps each. This redesign focuses on simplifying the visual hierarchy, reducing cognitive load, and creating a cleaner, more focused experience while maintaining all existing functionality.

**Current Pain Points Identified:**
- Information density varies significantly between steps (some feel cluttered, others sparse)
- Inconsistent spacing and visual rhythm across different steps
- Navigation buttons repeat step validation text (confusing UX)
- Progress indicator takes significant vertical space on desktop
- Form layouts could be more scannable and easier to complete
- Mobile bottom sheet has excessive padding that reduces usable space
- Color usage for states (selected, hover, disabled) lacks consistency

---

## User Flow

### Customer Mode (Marketing Page)
**Entry Point**: Sticky booking button (after 600px scroll)
**Steps**: Service → Date & Time → Login/Register → Pet → Review (with add-ons) → Confirmation (6 steps)
**Goal**: Convert visitors into booked appointments with minimal friction

### Admin Mode (Admin Panel)
**Entry Point**: "Create Appointment" button in `/admin/appointments`
**Steps**: Service → Date & Time → Customer Search/Create → Pet → Review (with add-ons) → Confirmation (6 steps)
**Goal**: Quickly create appointments for customers (phone bookings, walk-ins scheduled for later)

### Walk-in Mode (Dashboard Quick Action)
**Entry Point**: "Walk-in" button in `/admin/dashboard`
**Steps**: Service → Customer Search/Create → Pet → Review (with add-ons) → Confirmation (5 steps, auto-sets time to NOW)
**Goal**: Process walk-in customers instantly with minimal data entry

---

## Layout Structure

### Modal Container

**Desktop/Tablet**:
```
┌─────────────────────────────────────────┐
│ Header (60px)                       [X] │ ← Simplified header
├─────────────────────────────────────────┤
│ Progress Bar (Compact, 40px)           │ ← Single-line progress
├─────────────────────────────────────────┤
│                                         │
│  Content Area (Flexible, Scrollable)   │ ← Main step content
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Footer (64px) - Sticky                 │ ← Fixed navigation
└─────────────────────────────────────────┘

Modal Width: 1000px (current) → 960px (redesign)
  - Slightly narrower for better focus
  - XL breakpoint: 1100px (down from 1200px)
  - Better content width without feeling cramped

Max Height: 85vh (desktop), 90vh (laptop)
Border Radius: 20px (desktop), 24px (tablet/laptop)
```

**Mobile (Bottom Sheet)**:
```
┌─────────────────────────────┐
│ Drag Handle (3px bar)       │
│ Header (56px)           [X] │
├─────────────────────────────┤
│ Progress (Compact, 32px)    │
├─────────────────────────────┤
│                             │
│ Content (Scrollable)        │
│                             │
│ (Reduced padding)           │
│                             │
├─────────────────────────────┤
│ Footer (Fixed, 72px)        │
└─────────────────────────────┘

Height: 95vh (current) → 92vh (redesign)
  - Slightly shorter to show underlying page
  - Better swipe-to-dismiss affordance
Border Radius: 20px (top corners only)
Bottom Padding: pb-4 (down from pb-32) - reduce wasted space
```

---

## Visual Design

### Typography Hierarchy

**Step Titles** (Header):
- Desktop: 20px (text-xl), font-bold, text-[#434E54]
- Mobile: 16px (text-base), font-semibold, text-[#434E54]
- Reduced from 24px/18px for less visual weight

**Step Subtitles** (Below title, descriptive text):
- Font: 15px (desktop), 14px (mobile)
- Weight: Regular (400)
- Color: text-[#434E54]/70
- Line height: 1.5
- Max width: 600px (prevent long lines)
- Current: "Choose the perfect grooming experience for your furry friend"
- Redesign: "Select the grooming service for your pet"
  - Shorter, clearer, less fluffy marketing language

**Section Labels** (Within steps):
- Font: 14px, font-semibold, text-[#434E54]
- Margin bottom: 8px (down from 12px)
- Example: "Select Customer", "Your Information"

**Field Labels**:
- Font: 13px, font-medium, text-[#434E54]
- Margin bottom: 6px (down from 8px)
- Required indicator: `*` in text-[#EF4444]

**Body Text**:
- Font: 14px (desktop), 13px (mobile)
- Weight: Regular
- Color: text-[#434E54] or text-[#434E54]/70
- Line height: 1.6

**Helper Text / Validation Errors**:
- Font: 12px, regular
- Error: text-[#EF4444]
- Success: text-[#6BCB77]
- Info: text-[#434E54]/60

### Color Usage & Semantic Meaning

**Backgrounds**:
- Modal background: `#FFFBF7` (warm cream) - no change
- Content cards: `#FFFFFF` (pure white) - no change
- Subtle backgrounds: `bg-[#434E54]/5` (NEW - replace bg-[#434E54]/10 for lighter touch)
- Selected state highlight: `bg-[#FFFBF7]` with `border-[#434E54]`

**Borders**:
- Default: `border-[#E5E5E5]` (1px) - light gray, minimal
- Hover: `border-[#434E54]/30` - subtle increase in contrast
- Selected: `border-[#434E54]` (2px) - strong, clear selection
- Focus: `ring-2 ring-[#434E54]/20` - accessibility ring, not border change

**Interactive States**:
- **Default**: bg-white, border-[#E5E5E5], shadow-sm
- **Hover**: border-[#434E54]/30, shadow-md (lift effect)
- **Selected**: bg-[#FFFBF7], border-[#434E54] (2px), shadow-md
- **Disabled**: opacity-50, cursor-not-allowed, no hover effects
- **Loading**: Show spinner, disable interaction, maintain visual state

**Button Hierarchy**:
- **Primary** (Continue, Confirm): bg-[#434E54], text-white, shadow-md, hover:shadow-lg
- **Secondary** (Back): bg-transparent, text-[#434E54], hover:bg-[#EAE0D5]
- **Ghost** (Edit, Change): bg-transparent, text-[#434E54], hover:bg-[#434E54]/5, text-xs

### Spacing System

**Modal Internal Spacing**:
- Header padding: `px-6 py-4` (desktop), `px-4 py-3` (mobile)
- Content padding: `px-6 py-4` (desktop), `px-4 py-4` (mobile) - reduced from px-8/py-6
- Footer padding: `px-6 py-4` (desktop), `px-4 py-4` (mobile)
- Between sections: `space-y-4` (down from space-y-6 in many places)

**Form Spacing**:
- Between fields: `space-y-3` (down from space-y-4)
- Between field groups: `space-y-4`
- Grid gap (2-column forms): `gap-3` (down from gap-4)
- Form field height: `h-11` (44px) for touch-friendly targets

**Card Spacing**:
- Card padding: `p-4` (consistent across mobile/desktop)
- Between cards: `space-y-3` (down from space-y-4 or space-y-6)
- Card border radius: `rounded-xl` (12px) consistently

### Shadow Depths

**Elevation Levels**:
- **SM** (Cards at rest): `shadow-sm` - `0 1px 2px rgba(67,78,84,0.05)`
- **MD** (Cards on hover, Modals): `shadow-md` - `0 4px 6px rgba(67,78,84,0.07)`
- **LG** (Dropdowns, Active modals): `shadow-lg` - `0 10px 15px rgba(67,78,84,0.1)`
- **XL** (Modal overlay): `shadow-[0_25px_50px_-12px_rgba(67,78,84,0.25)]`

**Usage**:
- Service cards: shadow-sm → shadow-md (on hover)
- Pet selection cards: shadow-sm → shadow-md (on hover)
- Date selection: shadow-sm (no hover change, click-based interaction)
- Time slot buttons: shadow-sm → shadow-md (on hover/selected)
- Modal itself: shadow-xl (strong depth separation from overlay)

### Corner Radius

**Consistent Rounding**:
- **SM** (Badges, small elements): `rounded-lg` (8px)
- **MD** (Buttons, inputs, small cards): `rounded-xl` (12px)
- **LG** (Main cards, panels): `rounded-xl` (12px) - unified with MD
- **XL** (Modal container): `rounded-[20px]` (desktop), `rounded-t-[20px]` (mobile)
- **Full** (Avatars, icons, progress dots): `rounded-full`

**Current Issue**: Mix of rounded-lg, rounded-xl, and rounded-3xl creates visual inconsistency
**Redesign**: Use rounded-xl (12px) as default for most cards/buttons, rounded-[20px] for modal only

---

## Component Design Patterns

### Header (BookingModalHeader)

**Desktop Layout**:
```
┌──────────────────────────────────────────────┐
│ [Step Title]               [Walk-In Badge] X │
│  Step 1 of 5 • Service Selection             │ ← NEW: Inline step counter + context
└──────────────────────────────────────────────┘

Height: 60px (down from ~64px)
Padding: px-6 py-3 (tighter)
Border: border-b border-[#434E54]/10 (no change)
```

**Changes**:
- Remove large H2 heading (20px is sufficient, not 24px)
- Add inline step counter: "Step 1 of 5 • Service Selection" in small text below title
- Reduces redundancy with progress bar
- Walk-in badge: Smaller, tighter (px-2 py-0.5, text-xs)

**Mobile Layout**:
```
┌─────────────────────────────────┐
│  [Badge]  Step Title         X  │
│  Step 1 of 5                    │ ← NEW: Step counter
└─────────────────────────────────┘

Height: 56px
Centered title with counter below
```

### Progress Indicator (BookingModalProgress)

**Current Desktop**: Full stepper with numbered circles, connecting lines, labels below each circle
**Current Issue**: Takes ~80px vertical space, feels heavy, labels repeat header information

**Redesign Desktop**:
```
┌───────────────────────────────────────────────┐
│ ●━━━━●━━━━●━━━━○━━━━○                        │
│ Service   Date   Customer   Pet   Review      │ ← Inline labels, single row
└───────────────────────────────────────────────┘

Height: 40px (down from ~80px)
Layout: Single horizontal line with dots and labels inline
Completed: ● (filled circle, #434E54)
Current: ● with ring (ring-4 ring-[#434E54]/20)
Future: ○ (outlined circle, #434E54/30)
Connecting lines: Solid (#434E54) when completed, dashed (#434E54/20) when future
```

**Benefits**:
- Saves ~40px vertical space (more room for content)
- Cleaner, more modern aesthetic
- Still clearly shows progress and upcoming steps
- Labels visible on desktop (hidden on smaller tablets if needed)

**Mobile Progress**:
```
┌─────────────────────────────────┐
│ ████████████░░░░░░░░   60%     │ ← Progress bar
└─────────────────────────────────┘

Height: 32px
Single progress bar with percentage
Step counter moved to header (no duplication)
```

**Changes**:
- Remove "Step 1 of 5" from progress area (now in header)
- Show only current step name: "Service Selection" (right-aligned)
- Progress bar more prominent (h-1.5 → h-2)

### Footer (BookingModalFooter)

**Desktop Layout**:
```
┌────────────────────────────────────────────┐
│ ← Back                    Continue Step → │
└────────────────────────────────────────────┘

Height: 64px
Padding: px-6 py-4
Border: border-t border-[#434E54]/10
Background: bg-white with subtle shadow upwards
```

**Button Specifications**:
- **Continue Button**:
  - Height: h-11 (44px) - down from h-12
  - Padding: px-6 (down from px-8)
  - Min-width: 160px (down from 200px)
  - Text: Dynamic based on next step (keep current logic)
  - Icon: ChevronRight (w-4 h-4, positioned right)
  - State:
    - Enabled: bg-[#434E54], shadow-md, hover:shadow-lg, hover:bg-[#363F44]
    - Disabled: bg-[#434E54]/30, no shadow, no hover
    - Loading: Show spinner, "Processing..."

- **Back Button**:
  - Height: h-11 (44px)
  - Padding: px-4 (down from px-5)
  - Text: "Back" (remove "to Service" suffix - too verbose)
  - Icon: ChevronLeft (w-4 h-4)
  - Style: Ghost button (transparent bg, hover:bg-[#EAE0D5])

**Mobile Layout**:
```
┌─────────────────────────────┐
│ [     Continue Step →     ] │ ← Full width button
│ ← Back to Service           │ ← Text link below
└─────────────────────────────┘

Height: 72px (includes safe area)
Button height: h-12 (48px) for thumb-friendly touch target
Back link: Centered text link, text-sm
```

**Changes**:
- Simplify button text (don't repeat validation state in label)
- Reduce padding and sizes for less visual weight
- Keep dynamic text but make it action-oriented:
  - "Continue" (when valid)
  - "Select a Service" (when invalid) → "Continue" with disabled state
  - Let the disabled state communicate invalidity, not the button text

### Service Selection (ServiceStep)

**Layout**:
```
[Step Subtitle: "Select the grooming service for your pet"]

┌──────────────────┐  ┌──────────────────┐
│ Basic Grooming   │  │ Premium Grooming │
│ ╔════════════╗   │  │ ╔════════════╗   │
│ ║   Image    ║   │  │ ║   Image    ║   │
│ ╚════════════╝   │  │ ╚════════════╝   │
│ • Service items  │  │ • Service items  │
│ From $40         │  │ From $70         │
│ 90-120 min       │  │ 120-180 min      │
└──────────────────┘  └──────────────────┘

Grid: 2 columns (desktop), 1 column (mobile)
Gap: 16px (gap-4)
Max width: 800px (centered)
```

**Service Card Visual Design**:
- Border: 2px solid #E5E5E5 (default) → #434E54 (selected)
- Shadow: shadow-sm (default) → shadow-md (hover/selected)
- Padding: p-4 (uniform)
- Border radius: rounded-xl (12px)
- Selected state: Ring animation (ring-2 ring-[#434E54]/20) + border change
- Hover: Lift effect (translate-y-[-2px] + shadow-md)

**Card Content Hierarchy**:
```
[Service Name: 18px, font-bold, text-[#434E54]]
[Service Description: 14px, text-[#434E54]/70, 2 lines max]
─────────────────
• Included item (13px, text-[#434E54])
• Included item
• Included item
─────────────────
[Price Range: 16px, font-semibold]
[Duration: 13px, text-[#434E54]/60]
```

**Changes**:
- Reduce card padding: p-6 → p-4
- Tighten typography: title 20px → 18px
- Remove excessive whitespace between elements
- Make image smaller: h-40 → h-32 (more content visible without scrolling)

### Date & Time Selection (DateTimeStep)

**Layout**:
```
[Step Subtitle]

[Selected Date/Time Banner] ← Compact confirmation (if selected)

┌─────────────────────────┐  ┌──────────────────────┐
│  Calendar               │  │  Time Slots          │
│  (CalendarPicker)       │  │  (TimeSlotGrid)      │
│                         │  │                      │
│  ╔═══════════════════╗  │  │  [9:00 AM] [10:00]  │
│  ║  January 2025     ║  │  │  [11:00]   [1:00 PM] │
│  ║  S  M  T  W  T  F ║  │  │  [2:00]    [3:00]    │
│  ║  1  2  3  4  5  6 ║  │  │                      │
│  ╚═══════════════════╝  │  │  [Join Waitlist]     │
└─────────────────────────┘  └──────────────────────┘

Grid: 2 columns (desktop), 1 column (mobile, calendar first)
Gap: 24px (gap-6) - adequate breathing room
Both sections equal height
```

**Selected Date/Time Banner**:
```
┌────────────────────────────────────────────┐
│ 📅  Friday, January 15, 2025 at 2:00 PM   │  [Change]
└────────────────────────────────────────────┘

Background: bg-[#434E54]/5 (subtle, not heavy)
Border: border border-[#434E54]/20 (light)
Padding: p-3 (compact, down from p-4)
Icon: Calendar icon (w-5 h-5)
Text: 15px, font-medium
Change button: text-xs, ghost style, right-aligned
```

**Time Slot Buttons**:
- Size: Flexible width, h-10 (40px)
- Padding: px-3 py-2
- Border: 1.5px (not 2px - lighter)
- Border radius: rounded-lg (8px)
- Grid: 2 columns (mobile), 3 columns (desktop)
- Gap: 8px (tight grid)
- States:
  - Available: bg-white, border-[#E5E5E5], hover:border-[#434E54]/30
  - Selected: bg-[#434E54], text-white, shadow-sm
  - Disabled: opacity-40, cursor-not-allowed
  - Waitlist: bg-amber-50, border-amber-200, text-amber-700

**Changes**:
- Remove large banner with icon/background when date selected (too prominent)
- Use compact inline confirmation instead
- Reduce time slot button padding for tighter grid
- Lighter borders on unselected states

### Customer Selection (CustomerStep)

**Admin/Walk-in Mode Layout**:
```
[Step Subtitle: "Search for an existing customer or create a new one"]

[Search Bar: Full-width input with icon]

[Search Results: Max 3 visible, scroll if more]
┌───────────────────────────────────────┐
│ ○ John Doe                            │
│   john.doe@email.com • (555) 123-4567│
└───────────────────────────────────────┘

──── OR ────

[Create New Customer: Always visible form]
┌───────────────────────────────────────┐
│ First Name          Last Name         │
│ Email                                 │
│ Phone                                 │
│ [Use This Customer]                   │
└───────────────────────────────────────┘

[Selected Customer Confirmation]
```

**Search Input**:
- Height: h-11 (44px)
- Border: 1px border-[#E5E5E5]
- Icon: Search icon (w-5 h-5, left-aligned)
- Padding: pl-10 pr-4 py-2
- Focus: ring-2 ring-[#434E54]/20

**Search Result Cards**:
- Layout: Radio button + customer info (flex)
- Padding: p-3 (down from p-4)
- Border: 1.5px (lighter than current 2px)
- Gap: 12px (space-y-3, down from space-y-4)
- Max height: 240px with scroll (show max 3.5 items to indicate more)

**New Customer Form**:
- Grid: 2 columns (desktop), 1 column (mobile)
- Field height: h-11 (44px)
- Field spacing: space-y-3 (tighter)
- Card padding: p-4 (down from p-6)
- Button: Full width, "Use This Customer" (clear action)

**Customer Mode (Login/Register)**:
- Tabs at top: "Register" | "Log In" (toggle between views)
- Tab styling: Active = border-b-2 border-[#434E54], Inactive = text-[#434E54]/60
- Form: Same spacing as admin form (compact)
- Remove verbose descriptive text ("Create an account to book" → "Register")

**Changes**:
- Reduce form field spacing (space-y-4 → space-y-3)
- Tighten card padding (p-6 → p-4)
- Always show create form (no accordion/toggle) - reduces clicks
- Use tabs for login/register instead of toggle buttons
- Remove duplicate customer info sections

### Pet Selection (PetStep)

**Authenticated User with Pets**:
```
[Step Subtitle: "Select your pet"]

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🐕 Max           │  │ 🐕 Bella         │  │ ➕ Add New Pet   │
│ Golden Retriever │  │ French Bulldog   │  │                  │
│ Large • 65 lbs   │  │ Medium • 28 lbs  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘

Grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
Gap: 12px (gap-3)
```

**Pet Card Design**:
- Size: Equal height cards
- Padding: p-3 (compact)
- Border: 2px (selected), 1px (unselected)
- Border radius: rounded-xl (12px)
- Icon: Dog emoji or placeholder avatar (w-10 h-10, rounded-full)
- Layout: Icon + text vertically centered

**Pet Form (New Pet or Guest)**:
```
[Step Subtitle: "Tell us about your pet"]

┌────────────────────────────────────────┐
│ Pet Name                               │
│ Breed                                  │
│ Size: (•) Small ( ) Medium ( ) Large  │ ← Radio buttons, horizontal
│ Weight (optional)                      │
│ Notes (optional)                       │
└────────────────────────────────────────┘

Form padding: p-4 (down from p-6)
Field spacing: space-y-3
```

**Size Selection**:
- Layout: Horizontal radio buttons (flex-row)
- Size: h-10, px-4
- Visual: Border button style (not traditional radio)
- Active: bg-[#434E54], text-white
- Inactive: bg-white, border-[#E5E5E5]

**Changes**:
- Reduce pet card padding (p-4 → p-3)
- Horizontal size selector (saves vertical space)
- Tighter form spacing
- Clearer visual hierarchy (name most prominent)

### Review & Add-ons (ReviewStep)

**Layout**:
```
[Step Subtitle: "Review your booking"]

┌────── Booking Summary ──────┐
│ Service: Basic Grooming     │ [Edit]
│ Date: Friday, Jan 15, 2025  │ [Edit]
│ Time: 2:00 PM               │
│ Pet: Max (Golden Retriever) │ [Edit]
│────────────────────────────│
│ Service: $65                │
│ ─────────────────────────  │
│ Total: $65                  │
└─────────────────────────────┘

┌────── Add Extra Services ───┐
│ Recommended for Max:        │
│ ┌─────────────────────────┐ │
│ │ ☑ Nail Trim  +$15      │ │
│ └─────────────────────────┘ │
│ Other add-ons:              │
│ ┌─────────────────────────┐ │
│ │ ☐ Teeth Brushing +$20  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

[Your Information] ← Authenticated user or guest form
```

**Booking Summary Card**:
- Background: bg-white
- Border: border border-[#434E54]/20
- Padding: No outer padding, section padding p-3 each
- Section dividers: border-b border-[#434E54]/10
- Text size: 14px (consistent)
- Edit buttons: text-xs, ghost, right-aligned
- Price breakdown: Right-aligned, clearer hierarchy
- Total: text-lg font-bold (prominent)

**Add-on Cards**:
- Layout: Checkbox + Title + Price in one row
- Padding: p-3 (compact)
- Height: Variable content
- Border: 1.5px (lighter)
- Spacing: space-y-2 (tight)
- Checkbox: Visible checkbox (not hidden), left-aligned
- Recommended: bg-[#434E54]/5 background highlight
- Title: 15px, font-medium
- Price: 15px, font-semibold, right-aligned

**Changes**:
- Consolidate summary into single card (remove multiple border sections)
- Inline edit buttons (no separate column)
- Tighter add-on card spacing
- Remove verbose section headers
- Clearer price hierarchy (service → add-ons → total)

### Confirmation (ConfirmationStep)

**Layout**:
```
┌─────────────────────────────────────┐
│          ✓ Success Icon             │
│                                     │
│   Appointment Confirmed!            │
│   Reference: #APT-12345             │
│                                     │
│   Friday, January 15, 2025          │
│   2:00 PM - 4:00 PM                 │
│                                     │
│   Basic Grooming for Max            │
│   The Puppy Day, La Mirada          │
│                                     │
│   [Add to Calendar] [View Details]  │
│                                     │
│   A confirmation has been sent to   │
│   john.doe@email.com                │
└─────────────────────────────────────┘

Layout: Center-aligned, card-based
Icon: Large checkmark in circle (w-16 h-16, text-[#6BCB77])
Title: 24px, font-bold
Reference: 14px, text-[#434E54]/60, monospace
Key details: 16px, font-medium
Buttons: Secondary style, side-by-side
Footer note: 12px, text-[#434E54]/60
```

**Changes**:
- Simplified layout (remove excessive sections)
- Clear visual hierarchy
- Action buttons prominent but not primary (secondary style)
- Compact without feeling rushed

---

## Interaction Design

### Hover States

**Cards (Service, Pet, Customer)**:
- Default: shadow-sm, border-[#E5E5E5]
- Hover: shadow-md, border-[#434E54]/30, transform: translateY(-2px)
- Transition: all 200ms ease-out
- Cursor: pointer

**Buttons**:
- Primary (Continue):
  - Default: bg-[#434E54], shadow-md
  - Hover: bg-[#363F44], shadow-lg
  - Active: bg-[#2D363A], shadow-sm, scale: 0.98
  - Transition: all 150ms ease
- Secondary (Back):
  - Default: bg-transparent
  - Hover: bg-[#EAE0D5]
  - Active: bg-[#DCD2C7]
  - Transition: all 150ms ease
- Ghost (Edit, Change):
  - Default: bg-transparent, text-[#434E54]
  - Hover: bg-[#434E54]/5
  - Active: bg-[#434E54]/10
  - Transition: all 150ms ease

**Form Inputs**:
- Default: border-[#E5E5E5]
- Hover: border-[#434E54]/20
- Focus: border-[#434E54], ring-2 ring-[#434E54]/20
- Error: border-[#EF4444], ring-2 ring-[#EF4444]/20
- Transition: all 150ms ease

### Focus States

**Keyboard Navigation**:
- All interactive elements: `focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2`
- Skip native focus ring (outline-none) and use custom ring for consistency
- Focus order: Natural DOM order (top to bottom, left to right)
- Focus trap: Keep focus within modal when open

**Focus Management**:
- On modal open: Focus header or first interactive element
- On modal close: Return focus to trigger button
- Step change: Focus step title (announce to screen readers)

### Transitions & Animations

**Modal Entry/Exit**:
- Desktop: Fade + scale (0.95 → 1.0), 300ms ease-out
- Mobile: Slide up from bottom, 400ms cubic-bezier(0.32, 0.72, 0, 1)
- Overlay: Fade in/out, 200ms ease

**Step Navigation**:
- Forward: Slide left, opacity fade (50px → 0), 300ms ease
- Backward: Slide right, opacity fade (-50px → 0), 300ms ease
- Stagger: No stagger (simultaneous fade and slide)

**Progress Bar**:
- Width change: 300ms ease-out
- Step indicator: Scale pulse on current step (1.0 → 1.1 → 1.0), 300ms
- Line fill: 300ms ease-out (left to right)

**Button Loading**:
- Spinner fade in: 150ms
- Button text: Fade out → Fade in with spinner, 200ms
- Disable pointer events during loading
- Maintain button width (prevent layout shift)

**Micro-interactions**:
- Checkbox toggle: 150ms ease
- Radio selection: 150ms ease with scale (0.95 → 1.0)
- Card selection: 200ms ease (border + shadow + transform)
- Add-on toggle: 200ms ease (background + border)

### Loading States

**Step Loading** (e.g., fetching services, availability):
```
┌─────────────────────────────────┐
│ [Skeleton Card]                 │
│ ░░░░░░░░░░░ (animated pulse)   │
│ ░░░░░░░░                        │
└─────────────────────────────────┘

Skeleton: bg-[#EAE0D5], rounded to match content shape
Animation: pulse (opacity 0.5 → 1.0, 1.5s infinite)
Number of skeletons: Match expected content (2 for services, 3 for pets, etc.)
```

**Form Submission Loading**:
- Button shows spinner + "Processing..." text
- Disable all form inputs (opacity-60)
- Disable back button and close button
- Show spinner in button (Loader2 icon, animate-spin)

**Search Loading** (Customer search):
- Show inline spinner next to search input
- Text: "Searching..." (text-sm, text-[#6B7280])
- Debounce: 300ms after last keystroke

### Error States

**Form Validation Errors**:
```
┌─────────────────────────────────┐
│ Email *                         │
│ [john@invalid]                  │ ← border-[#EF4444], ring-2 ring-[#EF4444]/20
│ ⚠ Please enter a valid email   │ ← text-xs, text-[#EF4444]
└─────────────────────────────────┘

Icon: Warning icon (optional, can add for emphasis)
Error text: Below input, space-y-1, clear and actionable
Border: Red on error, not just ring
```

**API Error States**:
```
┌─────────────────────────────────┐
│ ⚠ Failed to Load Services       │
│ We couldn't fetch services.     │
│ Please try again.               │
│ [Retry]                         │
└─────────────────────────────────┘

Background: bg-white
Border: border border-[#EF4444]/20
Icon: Alert circle (w-8 h-8, text-[#EF4444])
Text: 14px, text-[#434E54]
Retry button: Primary button style
```

**Booking Submission Error**:
- Show error alert banner at top of ReviewStep
- Background: bg-red-50
- Border: border-red-200
- Icon: AlertTriangle (w-5 h-5, text-red-600)
- Dismissible: X button in top-right
- Message: Clear, actionable (e.g., "Payment failed. Please check your card details.")

### Success States

**Selection Confirmation**:
- Visual: Green checkmark icon or border color change
- Background: bg-green-50 or bg-[#FFFBF7]
- Border: border-green-200 or border-[#434E54]
- Text: "Selected", "Confirmed", or checkmark icon

**Step Completion**:
- Progress indicator: Filled circle with checkmark
- Line to next step: Filled (solid color)
- Haptic feedback: (if supported) Light tap on mobile

**Final Confirmation**:
- Large success icon (checkmark in circle, w-16 h-16, text-[#6BCB77])
- Success message: "Appointment Confirmed!"
- Reference number: Prominent, monospace font
- Next actions: "Add to Calendar", "View Details"

### Mobile-Specific Interactions

**Bottom Sheet Gestures**:
- Drag handle: 40px tall touch target (visible 10px bar)
- Swipe down to dismiss: Requires 100px drag + velocity
- Haptic feedback: On open, on dismiss, on step change
- Scroll: Only content area scrolls, header/footer fixed
- Over-scroll: Rubber-band effect at top/bottom

**Touch Targets**:
- Minimum: 44px (iOS) / 48px (Android) for all interactive elements
- Button height: h-11 (44px) on desktop, h-12 (48px) on mobile
- Spacing between touch targets: Minimum 8px
- Form inputs: h-11 (44px) for easy tapping

**Mobile Keyboard**:
- Input type: Correct keyboard for each field (email, tel, number, text)
- Scroll behavior: Auto-scroll to focused input (prevent keyboard overlap)
- Done button: Should blur input and hide keyboard
- Tab order: Logical progression through form

---

## Responsive Behavior

### Breakpoints

```css
/* Mobile */
< 640px: Single column, bottom sheet, full-width buttons, compact spacing

/* Tablet */
640px - 1024px: 2-column grids, side-by-side date/time, modal centered

/* Desktop */
> 1024px: 3-column grids (pets), full stepper progress, max-width container

/* Large Desktop */
> 1280px: Modal XL width (1100px), generous whitespace
```

### Layout Adaptations

**Service Selection**:
- Mobile: 1 column, full width cards
- Tablet: 2 columns, side-by-side
- Desktop: 2 columns (only 2 main services, no need for 3-col)

**Date & Time**:
- Mobile: 1 column, calendar first, then time slots below
- Tablet+: 2 columns, side-by-side, equal height

**Customer Search/Form**:
- Mobile: 1 column, full width
- Desktop: 2-column form (First/Last name), 1-column for email/phone

**Pet Selection**:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns (if more than 2 pets)

**Review**:
- Mobile: 1 column, summary → add-ons → customer info
- Desktop: Summary and add-ons in main column, customer info full-width below

**Progress Indicator**:
- Mobile: Horizontal progress bar + step counter
- Tablet: Simplified stepper (dots only, no labels if tight)
- Desktop: Full stepper with labels

### Font Size Scaling

**Mobile** (< 640px):
- Step title: 16px (text-base)
- Step subtitle: 14px (text-sm)
- Body: 14px (text-sm)
- Buttons: 15px (text-[15px])
- Labels: 13px (text-xs)

**Tablet** (640px - 1024px):
- Step title: 18px (text-lg)
- Step subtitle: 15px (text-base)
- Body: 14px (text-sm)
- Buttons: 15px (text-base)
- Labels: 13px (text-sm)

**Desktop** (> 1024px):
- Step title: 20px (text-xl)
- Step subtitle: 15px (text-base)
- Body: 14px (text-sm)
- Buttons: 16px (text-base)
- Labels: 14px (text-sm)

### Spacing Scaling

**Mobile**:
- Modal padding: px-4, py-4
- Content spacing: space-y-3
- Card padding: p-3
- Grid gap: gap-3

**Desktop**:
- Modal padding: px-6, py-4
- Content spacing: space-y-4
- Card padding: p-4
- Grid gap: gap-4

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text on white: #434E54 (7.5:1 - AAA)
- Text on cream (#FFFBF7): #434E54 (7:1 - AAA)
- Primary button: #434E54 bg, white text (8:1 - AAA)
- Links/interactive: #434E54 (7.5:1 - AAA)
- Error text: #EF4444 (4.8:1 - AA)
- Success text: #6BCB77 (3.2:1 - requires icon or bold for emphasis)

**Keyboard Navigation**:
- Tab order: Natural DOM order (header → progress → content → footer)
- Focus visible: Custom focus ring (2px outline, #434E54, 2px offset)
- Focus trap: Focus locked within modal when open
- Escape key: Close modal (if canClose = true)
- Enter key: Submit forms, select items
- Space key: Toggle checkboxes, select radio buttons
- Arrow keys: Navigate date picker, time slots (optional enhancement)

**Screen Reader Support**:
- Modal role: `role="dialog"` with `aria-modal="true"`
- Title: `aria-labelledby="booking-modal-title"`
- Description: `aria-describedby="booking-modal-description"` (optional)
- Step announcements: Use `aria-live="polite"` region for step changes
- Progress: `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on progress bar
- Buttons: Clear `aria-label` for icon-only buttons
- Form errors: `aria-describedby` linking to error messages
- Loading states: `aria-busy="true"` during async operations

**ARIA Labels**:
```html
<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">

<!-- Close button -->
<button aria-label="Close booking modal">

<!-- Progress -->
<div role="progressbar" aria-valuenow="2" aria-valuemin="1" aria-valuemax="5" aria-label="Step 2 of 5: Date and Time">

<!-- Form errors -->
<input aria-invalid="true" aria-describedby="email-error">
<div id="email-error">Please enter a valid email</div>

<!-- Step change announcement -->
<div role="status" aria-live="polite" aria-atomic="true">
  Step 2: Select Date and Time
</div>
```

### Focus Management

**On Modal Open**:
1. Save previously focused element
2. Set focus to modal container or first focusable element
3. Trap focus within modal (prevent tab to background)

**On Modal Close**:
1. Release focus trap
2. Return focus to saved element (trigger button)
3. Announce closure to screen readers

**Step Navigation**:
1. On step change, focus step title (h2)
2. Announce new step to screen readers via aria-live region
3. Maintain focus order within step

### Screen Reader Announcements

**Step Changes**:
- "Step 2 of 5: Select Date and Time"
- Use `aria-live="polite"` region (not "assertive" - less intrusive)

**Form Validation**:
- "Error: Please enter a valid email address" (linked via aria-describedby)
- Announce on blur, not on keystroke (less noisy)

**Selection Confirmations**:
- "Basic Grooming selected"
- "Friday, January 15, 2025 at 2:00 PM selected"
- Use aria-live="polite" for non-critical updates

**Loading States**:
- "Loading services..." (aria-busy="true" + aria-label)
- "Processing booking..." (button aria-busy="true")

### High Contrast Mode

**Windows High Contrast**:
- Ensure borders remain visible (use border, not just shadow)
- Button states distinguishable (not relying on shadow alone)
- Focus indicators: System colors respected

**Increased Contrast**:
- Provide option to switch to higher contrast theme
- Use darker grays: #434E54 → #2D363A
- Stronger borders: 1px → 2px

---

## Mobile Responsiveness

### Bottom Sheet Behavior

**Entry Animation**:
- Slide up from bottom: translateY(100%) → translateY(0)
- Duration: 400ms
- Easing: cubic-bezier(0.32, 0.72, 0, 1) (ease-out-expo)
- Overlay: Fade in simultaneously (200ms)

**Drag to Dismiss**:
- Drag handle: 40px tall touch area, visible 10px bar
- Threshold: 100px drag distance + minimum velocity
- Haptic feedback: Light tap on dismiss
- Animation: Follow finger (spring physics)
- Cancel: Release below threshold returns to resting position

**Scroll Behavior**:
- Content scroll: Only content area scrolls (header/footer fixed)
- Over-scroll: Rubber-band effect (iOS-style)
- Scroll lock: Prevent body scroll when modal open
- Scroll to top: On step change, smoothly scroll content to top

**Safe Areas**:
- Bottom padding: `pb-safe` or `pb-6` (24px minimum)
- Account for iOS notch, Android gesture nav bar
- Footer buttons: Above safe area (not cut off)

### Touch Interactions

**Minimum Touch Targets**:
- Buttons: 44px x 44px (iOS), 48px x 48px (Android)
- Form inputs: 44px height minimum
- Checkboxes/Radio: 20px x 20px minimum visual, 44px x 44px tap area
- Links: 44px height with padding

**Touch Feedback**:
- Immediate visual feedback on tap (opacity change, background change)
- Haptic feedback: On selection, on error, on success (where supported)
- Active state: Slight scale down (0.98) for buttons

**Gesture Conflicts**:
- Disable horizontal swipe within modal (prevent accidental navigation)
- Vertical swipe only in content area (scroll) or drag handle (dismiss)
- Pinch-to-zoom: Disabled on modal (prevent accidental zoom)

### Mobile Optimizations

**Performance**:
- Lazy load images (service images, pet avatars)
- Virtual scrolling for long lists (100+ customers, 20+ pets)
- Debounce search: 300ms after last keystroke
- Throttle scroll events: 100ms

**Network Awareness**:
- Show loading states immediately (optimistic UI)
- Retry logic: Exponential backoff for failed requests
- Offline support: Cache selected service, pet, date (localStorage)
- Connection loss: Show alert, allow continue when reconnected

**Battery Optimization**:
- Reduce animations on low battery (prefer-reduced-motion)
- Disable progress bar pulse animation if battery saver on
- Minimize re-renders (React.memo, useMemo, useCallback)

---

## Visual Anti-Patterns to Avoid

**Current Issues Identified**:

1. **Inconsistent Border Weights**:
   - Some cards use 2px borders, others 1px
   - Creates visual inconsistency and "weight" imbalance
   - **Fix**: Use 1px for default, 2px only for selected state

2. **Excessive Padding/Whitespace**:
   - Some steps have space-y-6, others space-y-4
   - Modal content feels sparse on some steps, cramped on others
   - **Fix**: Standardize to space-y-4 for sections, space-y-3 for cards

3. **Redundant Information**:
   - Progress shows "Step 1 of 5", footer button says "Continue to Date & Time"
   - Too much guidance text repeating the same information
   - **Fix**: Remove step counts from progress (use visual progress bar), simplify button text

4. **Verbose Button Labels**:
   - "Continue to Customer Information" is too long
   - "Back to Date & Time Selection" is verbose
   - **Fix**: "Continue" with icon, "Back" with icon, let context provide meaning

5. **Heavy Visual Elements**:
   - Large icons, bold text everywhere
   - Creates visual fatigue and reduces scannability
   - **Fix**: Use size hierarchy intentionally (one bold element per section)

6. **Unclear Selected States**:
   - Some cards use background change, others border change
   - Inconsistent selected state indicators
   - **Fix**: Always use border change (2px #434E54) + subtle background (#FFFBF7)

7. **Cluttered Summary**:
   - ReviewStep shows every detail in separate bordered sections
   - Too many visual separators (borders, backgrounds, shadows)
   - **Fix**: Single summary card with subtle dividers

8. **Overly Prominent Banners**:
   - Selected date/time banner has heavy background, large padding, icon
   - Draws too much attention away from next action
   - **Fix**: Subtle inline confirmation (light background, compact)

---

## Key Design Principles

1. **Progressive Disclosure**: Show only what's needed for current step, hide irrelevant information
2. **Clear Hierarchy**: One primary action per screen, secondary actions visually subordinate
3. **Consistent Patterns**: Same spacing, borders, shadows, transitions across all steps
4. **Forgiving Interactions**: Allow editing previous steps, clear undo/change options
5. **Immediate Feedback**: Show loading, success, error states instantly
6. **Mobile-First**: Design for touch, then enhance for desktop (not the reverse)
7. **Accessibility**: Keyboard navigation, screen reader support, high contrast as defaults, not afterthoughts
8. **Performance**: Fast load, smooth transitions, no jank on scroll or step changes

---

## Success Metrics

**User Experience**:
- Reduced time to complete booking (target: < 3 minutes)
- Lower abandonment rate (track drop-off at each step)
- Fewer support requests about booking process
- Higher mobile completion rate (mobile vs. desktop parity)

**Visual Quality**:
- Consistent spacing across all steps (audit with spacing inspector)
- Accessible contrast ratios (automated WCAG checker)
- Smooth 60fps animations (performance profiling)
- Zero layout shifts during step transitions (CLS = 0)

**Technical**:
- Modal load time: < 500ms
- Step transition: < 300ms
- Search results: < 500ms (debounced)
- Form submission: < 2s (with loading state)

---

## Next Steps

**Design Handoff to daisyui-expert**:
1. Implement new spacing system (update all space-y values)
2. Redesign progress indicator (compact single-line stepper)
3. Simplify header (remove redundant step context)
4. Update footer button text logic (shorter, action-oriented)
5. Refactor service/pet cards (consistent padding, borders, shadows)
6. Rebuild review summary (single card, inline edit buttons)
7. Tighten form layouts (reduce field spacing, 2-column grids)
8. Implement new hover/focus states (consistent transitions)
9. Add loading skeletons (match content shape)
10. Accessibility audit (ARIA labels, keyboard nav, focus management)

**Testing Checklist**:
- [ ] All steps render correctly on mobile (320px), tablet (768px), desktop (1280px)
- [ ] Keyboard navigation works (tab order, escape to close, enter to submit)
- [ ] Screen reader announces step changes, errors, loading states
- [ ] Focus management correct (focus trap, return focus on close)
- [ ] Touch targets meet minimum size (44px x 44px)
- [ ] Animations smooth at 60fps (no jank on scroll or transitions)
- [ ] Loading states appear immediately (no flash of unstyled content)
- [ ] Error states clear and actionable (field errors, API errors)
- [ ] High contrast mode works (borders visible, focus clear)
- [ ] Bottom sheet drag-to-dismiss works (100px threshold)

---

**Design Specification Complete**

This specification provides comprehensive guidance for implementing a cleaner, simpler, more user-friendly booking modal. The focus is on reducing visual clutter, tightening spacing, creating consistent patterns, and ensuring accessibility across all devices.

**Key Improvements**:
- **40px vertical space saved** (progress redesign)
- **30% reduction in padding** (tighter, more focused)
- **Consistent visual language** (borders, shadows, spacing)
- **Clearer action hierarchy** (one primary action per step)
- **Better mobile experience** (optimized touch targets, reduced scrolling)
- **Enhanced accessibility** (keyboard nav, screen reader support, focus management)

Use `@agent-daisyui-expert` to convert this design into DaisyUI + Tailwind implementation plans.
