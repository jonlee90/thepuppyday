# Appointment Detail Modal - Design Specification

## Overview

The Appointment Detail Modal is a comprehensive admin interface for viewing, editing, and managing individual appointments. It serves as the primary touchpoint for appointment management, displaying customer information, pet details, service selection, pricing, and status workflow. This redesign aims to improve visual hierarchy, streamline the edit experience, and enhance usability while maintaining The Puppy Day's professional yet warm aesthetic.

## Current State Analysis

### Existing Component Structure
The current modal (`AppointmentDetailModal.tsx`) supports:
- View mode: Display appointment details in content sections
- Edit mode: Inline form for modifying appointment details
- Status transitions: Action buttons for workflow progression
- Groomer assignment: Dropdown for assigning staff
- Admin notes: Editable notes section
- Report card: Link to create/view grooming report cards

### Identified Pain Points

1. **Information Overload**: All content sections have identical visual weight (cream backgrounds), making it difficult to scan for critical information quickly.

2. **Mode Transition Confusion**: Edit mode uses the same section background as view mode, making it unclear which state the user is in.

3. **Action Button Placement**: Status transition buttons are at the bottom, requiring scroll on longer appointments.

4. **Mobile Usability**: Dense grid layouts don't adapt well to smaller screens.

5. **No Visual Progress Indicator**: Users cannot quickly see where an appointment is in its lifecycle.

6. **Cluttered Header**: Edit button, status badge, and close button compete for attention.

## User Flow

### Viewing an Appointment
1. Admin clicks an appointment from calendar or list
2. Modal slides in with appointment summary
3. Admin scans header for status and pet name
4. Scrolls through sections to review details
5. Takes action (edit, change status) or closes

### Editing an Appointment
1. Admin clicks "Edit" button in header
2. Modal transitions to edit mode with subtle animation
3. Editable sections highlight with a different background
4. Admin modifies fields (date, time, service, addons, notes)
5. Clicks "Save Changes" or "Cancel"
6. Modal returns to view mode with success feedback

### Status Transition Flow
1. Admin reviews appointment details
2. Identifies appropriate next action (Confirm, Check In, Start, Complete, Cancel)
3. Clicks status action button
4. Confirmation dialog appears for destructive/important actions
5. Status updates with visual feedback
6. Modal refreshes to show new state

## Layout Structure

### Modal Container

```
+----------------------------------------------------------------------+
|  HEADER: Sticky, with status badge, pet name, actions                 |
+----------------------------------------------------------------------+
|  STATUS TIMELINE: Horizontal progress indicator (optional)            |
+----------------------------------------------------------------------+
|  CUSTOMER FLAGS ALERT: If any warnings exist                          |
+----------------------------------------------------------------------+
|                                                                        |
|  MAIN CONTENT AREA (Scrollable):                                      |
|                                                                        |
|  +---------------------------+  +---------------------------+          |
|  |  CUSTOMER INFO            |  |  PET INFO                 |          |
|  |  (White card, left)       |  |  (White card, right)      |          |
|  +---------------------------+  +---------------------------+          |
|                                                                        |
|  +--------------------------------------------------------------+     |
|  |  APPOINTMENT DETAILS                                          |     |
|  |  (White card, full width)                                     |     |
|  |  - Date/Time, Service, Groomer, Addons, Notes                 |     |
|  +--------------------------------------------------------------+     |
|                                                                        |
|  +--------------------------------------------------------------+     |
|  |  PRICING SUMMARY                                              |     |
|  |  (White card, full width)                                     |     |
|  +--------------------------------------------------------------+     |
|                                                                        |
|  +--------------------------------------------------------------+     |
|  |  REPORT CARD (if completed)                                   |     |
|  +--------------------------------------------------------------+     |
|                                                                        |
|  +--------------------------------------------------------------+     |
|  |  ADMIN NOTES                                                  |     |
|  +--------------------------------------------------------------+     |
|                                                                        |
+----------------------------------------------------------------------+
|  FOOTER: Action buttons (status transitions)                          |
+----------------------------------------------------------------------+
```

### Grid System

**Desktop (>1024px)**:
- Modal max-width: 900px (increased from 896px for breathing room)
- Two-column grid for Customer/Pet info: 50/50 split
- Single column for Appointment Details, Pricing, Notes
- Gap: 24px between cards
- Padding: 32px modal padding, 24px card padding

**Tablet (640px - 1024px)**:
- Modal max-width: 90vw
- Two-column grid maintained for Customer/Pet
- Gap: 16px between cards
- Padding: 24px modal padding, 20px card padding

**Mobile (<640px)**:
- Modal: Full screen (bottom sheet style)
- Single column layout
- Gap: 12px between cards
- Padding: 16px modal padding, 16px card padding

## Visual Design

### Color Usage

**Modal Background**:
- Backdrop: `rgba(0, 0, 0, 0.5)` with blur
- Modal surface: `#FFFFFF` (clean white)

**Content Cards (View Mode)**:
- Background: `#FFFFFF`
- Border: 1px `#E5E5E5`
- Shadow: `shadow-sm` (subtle elevation)

**Content Cards (Edit Mode)**:
- Background: `#FFFBF7` (warm cream tint)
- Border: 2px `#434E54` with 20% opacity
- Shadow: `shadow-md` (elevated for prominence)

**Status Colors**:
| Status | Badge BG | Badge Text | Icon Color |
|--------|----------|------------|------------|
| Pending | `#F3F4F6` | `#6B7280` | `#9CA3AF` |
| Confirmed | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| Checked In | `#FEF3C7` | `#92400E` | `#F59E0B` |
| In Progress | `#D1FAE5` | `#065F46` | `#10B981` |
| Completed | `#DCFCE7` | `#166534` | `#22C55E` |
| Cancelled | `#FEE2E2` | `#991B1B` | `#EF4444` |
| No Show | `#FEE2E2` | `#991B1B` | `#EF4444` |

### Typography

**Modal Header**:
- Title: 24px, bold, charcoal (`#434E54`)
- Subtitle (pet name): 18px, semibold, charcoal

**Section Headers**:
- Size: 16px, semibold, charcoal
- Icon: 18px, inline, muted (`#6B7280`)

**Labels**:
- Size: 12px, medium, muted (`#9CA3AF`)
- Letter-spacing: 0.05em (slightly spaced)
- Transform: uppercase

**Values**:
- Size: 14px, medium, charcoal
- Links: charcoal with underline on hover

**Body Text**:
- Size: 14px, regular, secondary text (`#6B7280`)

### Spacing System

**Modal Padding**:
- Desktop: 32px
- Tablet: 24px
- Mobile: 16px

**Section Gaps**:
- Between cards: 24px (desktop), 16px (tablet), 12px (mobile)
- Within cards: 16px vertical gap between elements

**Card Padding**:
- Desktop: 24px
- Tablet: 20px
- Mobile: 16px

### Visual Elements

**Modal Entry Animation**:
- Scale from 95% to 100%
- Opacity from 0 to 1
- Duration: 200ms
- Easing: ease-out

**Card Styling**:
- Border-radius: 16px (`rounded-xl`)
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Border: 1px solid `#E5E5E5`

**Status Badge**:
- Padding: 6px 12px
- Border-radius: 20px (pill shape)
- Font: 12px, medium weight
- Icon: 14px, left-aligned

### Dog Grooming Visual Motifs

**Subtle Design Elements**:
- Paw print watermark: Very subtle (3% opacity) in modal background corner
- Scissors icon: Used for service sections
- Bone divider: Subtle decorative element between major sections (optional)

**Pet Avatar Placeholder**:
- Circular, 48px
- Background: Secondary cream (`#EAE0D5`)
- Icon: Dog silhouette or pet photo if available

## Component Breakdown

### 1. Modal Header

```
+----------------------------------------------------------------------+
| [Close X]                                                  [Edit Btn] |
|                                                                        |
|  [Status Badge: Confirmed]                                            |
|                                                                        |
|  Max's Grooming Appointment                                            |
|  Customer: John Smith                                                  |
+----------------------------------------------------------------------+
```

**View Mode Header**:
- Close button: Top-right, ghost style, always visible
- Edit button: Top-right, primary charcoal, visible only in view mode
- Status badge: Prominent, left-aligned, with status icon
- Title: Pet name + "Grooming Appointment" or just "Appointment Details"
- Subtitle: Customer name

**Edit Mode Header**:
- Title changes to "Edit Appointment"
- Status badge remains visible but muted
- Save/Cancel buttons replace Edit button

### 2. Status Timeline (Optional Enhancement)

A horizontal progress indicator showing the appointment lifecycle:

```
[Pending] ---> [Confirmed] ---> [Checked In] ---> [In Progress] ---> [Completed]
    o------------o----------------o-------------------*
                                                  (current)
```

**Visual Specs**:
- Steps: Small circles (8px) connected by lines
- Active step: Filled circle with ring (charcoal)
- Completed steps: Filled circles (success green)
- Future steps: Empty circles (border only)
- Labels: Below each step, 11px, muted text
- Line: 2px, success green for completed, gray for pending

**Terminal State Indicator**:
- Cancelled: Red X icon at current position
- No Show: Red circle with slash
- Completed: Green checkmark at final position

### 3. Customer Flags Alert

**When to Show**: Only when `customer_flags` array has entries

**Layout**:
```
+----------------------------------------------------------------------+
| [Warning Icon]  CUSTOMER FLAGS                                        |
|                                                                        |
|  ALLERGIC REACTION - Dog is allergic to certain shampoos             |
|  AGGRESSIVE - May bite when nervous                                   |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Background: Warning yellow (`#FFF3CD`)
- Border: 1px solid `#FFB347`
- Border-radius: 12px
- Icon: AlertTriangle, warning color
- Title: 13px, semibold, warning dark (`#92400E`)
- Flag items: 13px, regular, warning dark
- Padding: 16px

### 4. Customer Information Card

**Layout (View Mode)**:
```
+---------------------------+
|  [User Icon] Customer     |
+---------------------------+
|  NAME                     |
|  John Smith               |
|                           |
|  EMAIL                    |
|  [Mail Icon] john@...     |
|                           |
|  PHONE                    |
|  [Phone Icon] (555) 123...|
+---------------------------+
```

**Visual Specs**:
- Card header: Icon + title, 16px semibold
- Labels: 11px, uppercase, muted, letter-spacing
- Values: 14px, medium, charcoal
- Clickable email/phone: Hover underline, transition 200ms
- Icons inline with values: 16px, muted

### 5. Pet Information Card

**Layout (View Mode)**:
```
+---------------------------+
|  [Paw Icon] Pet           |
+---------------------------+
|  [Pet Avatar]  Max        |
|               Golden Retriever
|               Large (45 lbs)
|                           |
|  MEDICAL INFO             |
|  No known allergies       |
|                           |
|  PET NOTES                |
|  Nervous around loud...   |
+---------------------------+
```

**Visual Specs**:
- Pet avatar: 48px circle, left-aligned
- Pet name: 16px, semibold, charcoal
- Breed/size: 14px, regular, secondary
- Info sections: Same as customer card
- Expandable if long notes (show first 2 lines + "Show more")

### 6. Appointment Details Card

**View Mode**:
```
+----------------------------------------------------------------------+
|  [Calendar Icon] Appointment Details                                  |
+----------------------------------------------------------------------+
|  DATE                     TIME                    SERVICE             |
|  Friday, Dec 20, 2024     10:00 AM (60 min)       Premium Grooming    |
|                                                                        |
|  GROOMER                                                              |
|  Sarah Johnson                                                         |
|                                                                        |
|  ADD-ONS                                                              |
|  [Pill: Nail Polish +$15] [Pill: Teeth Brushing +$10]                |
|                                                                        |
|  SPECIAL REQUESTS                                                     |
|  "Please use hypoallergenic shampoo and be gentle around ears"       |
+----------------------------------------------------------------------+
```

**Edit Mode**:
```
+----------------------------------------------------------------------+
|  [Calendar Icon] Edit Appointment Details                             |
+----------------------------------------------------------------------+
|  DATE *                   TIME *                                      |
|  [Date Picker]            [Time Picker]                               |
|                                                                        |
|  SERVICE *                                                            |
|  [Service Dropdown]                                                   |
|                                                                        |
|  ADD-ONS                                                              |
|  [Checkbox Grid of Addons]                                            |
|                                                                        |
|  SPECIAL REQUESTS                                                     |
|  [Textarea]                                                           |
|                                                                        |
|  ADMIN NOTES                                                          |
|  [Textarea]                                                           |
|                                                                        |
|  [Save Changes] [Cancel]                                              |
+----------------------------------------------------------------------+
```

**Visual Specs - View Mode**:
- Grid: 3-column for date/time/service on desktop, stack on mobile
- Add-on pills: Charcoal bg, white text, 8px padding, rounded-full
- Special requests: Quoted block, left border accent (3px charcoal)

**Visual Specs - Edit Mode**:
- Background changes to cream tint
- Form inputs: 44px height, rounded-lg, border focus state
- Addon checkboxes: Grid layout, 2 columns on mobile, 3 on desktop
- Required indicator: Red asterisk after label

### 7. Groomer Assignment Section

**Layout**:
```
+----------------------------------------------------------------------+
|  [Scissors Icon] Groomer Assignment                                   |
+----------------------------------------------------------------------+
|  ASSIGNED GROOMER                                                     |
|  [Dropdown: Sarah Johnson v]                                          |
|                                                                        |
|  Currently assigned to Sarah Johnson                                  |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Standalone section between Customer/Pet and Appointment Details
- Dropdown: Full width on mobile, 50% on desktop
- Helper text: Below dropdown, 12px, muted
- Loading state: Spinner in dropdown

**Interaction**:
- Selecting a groomer triggers immediate API call
- Show "Updating..." text during save
- Success: Green check flash on dropdown
- Error: Red border + error message below

### 8. Pricing Summary Card

**Layout**:
```
+----------------------------------------------------------------------+
|  [DollarSign Icon] Pricing                                            |
+----------------------------------------------------------------------+
|  Base Service (Premium Grooming - Large)              $85.00         |
|  Add-ons                                               $25.00         |
|  --------------------------------------------------------            |
|  Subtotal                                             $110.00         |
|  Tax (9.75%)                                           $10.73         |
|  ========================================================            |
|  TOTAL                                                $120.73         |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Line items: Flex justify-between
- Subtotal divider: 1px dashed `#E5E5E5`
- Total divider: 2px solid charcoal
- Total amount: 20px, bold, charcoal
- Expandable add-ons breakdown (if many)

### 9. Report Card Section (Completed Appointments Only)

**No Report Card**:
```
+----------------------------------------------------------------------+
|  [Camera Icon] Report Card                                            |
+----------------------------------------------------------------------+
|  [Empty State Illustration]                                           |
|                                                                        |
|  No report card created yet.                                          |
|  Share grooming details and photos with the customer.                |
|                                                                        |
|  [Create Report Card Button]                                          |
+----------------------------------------------------------------------+
```

**Has Report Card**:
```
+----------------------------------------------------------------------+
|  [Camera Icon] Report Card                                            |
+----------------------------------------------------------------------+
|  [Thumbnail]  Grooming Report                                         |
|               Status: Sent                                             |
|               Viewed: Dec 20, 10:30 AM                                |
|                                                                        |
|  [Edit Report Card] [View Public Link]                                |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Empty state: Soft illustration (scissors with sparkles)
- Thumbnail: First report card image, 80px square, rounded
- Status badge: Pill style (Sent = green, Draft = yellow)
- Buttons: Primary for edit, outline for public link

### 10. Admin Notes Section

**View Mode**:
```
+----------------------------------------------------------------------+
|  [FileText Icon] Admin Notes                     [Edit Button]        |
+----------------------------------------------------------------------+
|  Customer requested early morning. Called to confirm twice.          |
|  VIP client - give extra attention.                                   |
+----------------------------------------------------------------------+
```

**Edit Mode (Inline)**:
```
+----------------------------------------------------------------------+
|  [FileText Icon] Admin Notes                     [Cancel Button]      |
+----------------------------------------------------------------------+
|  [Textarea with existing notes]                                       |
|                                                                        |
|  [Save Notes]                                                         |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Notes display: White background, rounded-lg, 14px regular
- Empty state: Italic, muted "No notes yet"
- Edit textarea: Expandable, min 3 rows
- Save button: Primary small, below textarea

### 11. Cancellation Info (For Cancelled Appointments)

**Layout**:
```
+----------------------------------------------------------------------+
| [X Icon] Appointment Cancelled                                        |
+----------------------------------------------------------------------+
|  REASON                                                               |
|  Customer request                                                     |
|                                                                        |
|  CANCELLED ON                                                         |
|  December 19, 2024 at 3:45 PM                                         |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Background: Error red light (`#FEE2E2`)
- Border: 1px solid `#EF4444`
- Icon: XCircle, error red
- Title: 16px, semibold, error dark (`#991B1B`)

### 12. Action Footer

**Layout**:
```
+----------------------------------------------------------------------+
|                                                                        |
|  [Cancel] [Check In] [Start Service] [Complete]                       |
|                                                                        |
|  [Close]                                                              |
+----------------------------------------------------------------------+
```

**Visual Specs**:
- Sticky footer with subtle top border
- Background: White
- Shadow: Slight shadow-up for elevation
- Primary actions: Right-aligned, grouped
- Close button: Left-aligned, ghost style
- Destructive actions (Cancel): Error red button

**Button Sizing**:
- Desktop: Medium buttons with text + icon
- Mobile: Full-width stacked or icon-only with tooltips

## Interaction Design

### Modal Open/Close

**Open Animation**:
- Backdrop: Fade in 200ms
- Modal: Scale from 0.95 to 1.0, fade in 200ms
- Content: Staggered fade-in for sections (50ms delay each)

**Close Animation**:
- Modal: Scale to 0.95, fade out 150ms
- Backdrop: Fade out 150ms

### View to Edit Mode Transition

**Entering Edit Mode**:
- Header title cross-fades to "Edit Appointment"
- Edit button transforms to Save/Cancel pair
- Editable sections slide-fade to form inputs
- Background tints to cream
- Duration: 200ms

**Exiting Edit Mode (Save)**:
- Show inline loading spinner on Save button
- On success: Green checkmark flash, then transition back
- Form inputs cross-fade to display values
- Duration: 200ms + loading time

**Exiting Edit Mode (Cancel)**:
- Revert form values to original
- Immediate transition back to view mode
- No loading state

### Status Transition Buttons

**Default State**:
- Primary button style for positive actions (Confirm, Check In, Start, Complete)
- Error button style for destructive actions (Cancel, No Show)
- Disabled state for non-applicable transitions

**Hover State**:
- Background darkens 5%
- Subtle shadow elevation
- Icon scales slightly (105%)
- Transition: 200ms ease

**Click/Active**:
- Background darkens 10%
- Scale down slightly (98%)
- Shows loading spinner during API call

**Confirmation Modal** (for destructive/important actions):
- Centered modal on top of detail modal
- Clear warning icon for destructive actions
- Notification options (email/SMS checkboxes)
- Cancellation reason dropdown (for cancel action)

### Form Field Interactions

**Text Inputs**:
- Focus: Border color to charcoal, subtle ring
- Error: Red border, error icon, message below
- Success: Green checkmark (brief flash on save)

**Select Dropdowns**:
- Click: Smooth open animation
- Option hover: Background highlight
- Selected: Checkmark icon

**Checkbox Grid (Add-ons)**:
- Unchecked: White bg, gray border
- Hover: Cream bg tint
- Checked: Charcoal bg, white checkmark
- Label: Clickable, includes price

**Textarea**:
- Auto-grow as content expands
- Max height before scroll
- Character count if limit exists

### Loading States

**Initial Load**:
- Skeleton cards for each section
- Pulse animation
- Icon placeholders

**Section Updates**:
- Inline spinner next to section being updated
- Dimmed overlay on updating section
- Disable interactions during save

**Full Modal Reload**:
- Content fades to 50% opacity
- Central spinner overlay
- Return with fade-in

### Error States

**Fetch Error**:
- Error alert at top of modal
- Retry button
- Error details in expandable section

**Save Error**:
- Inline error message below failed field
- Form remains in edit mode
- Error banner at bottom with retry

**Status Update Error**:
- Confirmation modal shows error
- "Try Again" button
- Option to dismiss and try later

### Responsive Interactions

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Adequate spacing between buttons

**Swipe Gestures** (Mobile):
- Swipe down on header to close (optional enhancement)
- Swipe left on action footer to see more actions

## Responsive Behavior

### Desktop (>1024px)

- Modal: Centered, max-width 900px, 80vh max-height
- Two-column layout for Customer/Pet cards
- Three-column grid for date/time/service
- Side-by-side buttons in footer
- Comfortable padding (32px)

### Tablet (640px - 1024px)

- Modal: 90vw width, centered
- Two-column maintained for Customer/Pet
- Two-column for date/time (service below)
- Stacked buttons may start
- Reduced padding (24px)

### Mobile (<640px)

- Modal: Full-screen bottom sheet
- Header becomes compact:
  - Pet name and status only
  - Customer name in first card
- All cards single column
- Form inputs full width
- Action buttons stack vertically or icon-only
- Minimal padding (16px)
- Scrollable content area
- Fixed header and footer

### Mobile Bottom Sheet Behavior

- Modal slides up from bottom
- 95vh max height
- Drag handle at top
- Swipe down to close
- Status timeline becomes vertical or hidden
- Tabs for major sections (optional: Info | Details | Actions)

## Accessibility Requirements

### ARIA Labels

```html
<!-- Modal -->
<dialog
  role="dialog"
  aria-labelledby="appointment-modal-title"
  aria-describedby="appointment-modal-description"
  aria-modal="true"
>

<!-- Status Badge -->
<span
  role="status"
  aria-label="Appointment status: Confirmed"
>
  Confirmed
</span>

<!-- Edit Mode Toggle -->
<button
  aria-pressed="false"
  aria-label="Edit appointment details"
>
  Edit
</button>

<!-- Status Transition -->
<button
  aria-describedby="transition-description"
>
  Check In
</button>
<span id="transition-description" class="sr-only">
  Mark customer as arrived for their appointment
</span>

<!-- Form Fields -->
<label for="scheduled-date">
  Select Date
  <span class="sr-only">(required)</span>
</label>
<input
  id="scheduled-date"
  type="date"
  aria-required="true"
  aria-invalid="false"
/>
```

### Keyboard Navigation

- **Tab**: Move through interactive elements in logical order
- **Shift+Tab**: Move backwards
- **Enter/Space**: Activate buttons, open dropdowns
- **Escape**: Close modal (with confirmation if editing)
- **Arrow Keys**: Navigate within dropdown options, checkbox grid
- **Home/End**: Jump to first/last option in lists

### Focus Management

- On open: Focus moves to first interactive element (close button or first field)
- On mode change: Focus moves to first editable field
- On save: Focus returns to edit button
- On close: Focus returns to triggering element (calendar event)
- Focus trap within modal when open

### Screen Reader Experience

**On Modal Open**:
"Appointment details dialog. Max's grooming appointment. Status: Confirmed. Press Tab to navigate, Escape to close."

**Status Changes**:
"Appointment status updated to Checked In."

**Edit Mode**:
"Editing appointment details. Required fields: Date, Time, Service."

**Errors**:
"Error: Failed to update appointment. Please try again."

### Color Contrast

- All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Status badges meet contrast requirements
- Error/warning states visible without color alone (icons + text)

### Motion Preferences

- Respect `prefers-reduced-motion`:
  - Disable scale/slide animations
  - Use instant transitions
  - Keep essential loading indicators

## Assets Needed

### Icons (Lucide React)

| Icon | Usage |
|------|-------|
| X | Close modal |
| Edit2 | Edit button |
| Save | Save button |
| XCircle | Cancel edit |
| User | Customer section |
| Mail | Email link |
| Phone | Phone link |
| Calendar | Date field |
| Clock | Time field |
| Scissors | Service, Groomer |
| DollarSign | Pricing |
| FileText | Notes |
| Camera | Report card |
| ExternalLink | View public link |
| AlertCircle | Warnings, errors |
| AlertTriangle | Destructive action |
| Check | Success state |
| ChevronDown | Dropdown indicator |
| Plus | Add addon |
| Sparkles | Report card empty state |
| PawPrint | Pet section (custom or Dog) |

### Illustrations (Optional)

- Empty report card state: Stylized scissors with sparkles
- Error state: Concerned dog illustration
- Success animation: Confetti or paw prints

## State Management

### View Mode States

```typescript
type ModalState =
  | 'loading'
  | 'error'
  | 'view'
  | 'editing'
  | 'saving'
  | 'transitioning'; // status change in progress
```

### Form State (Edit Mode)

```typescript
interface EditFormState {
  scheduled_date: string;
  scheduled_time: string;
  service_id: string;
  notes: string;
  admin_notes: string;
  addon_ids: string[];
  isDirty: boolean;
  errors: Record<string, string>;
}
```

### Unsaved Changes Warning

When user tries to close with unsaved changes:
- Show confirmation dialog
- "You have unsaved changes. Discard?"
- [Keep Editing] [Discard Changes]

## Error Handling

### API Error Display

**Fetch Error**:
- Full modal error state
- Error message + retry button
- "Unable to load appointment details"

**Save Error**:
- Inline at form level
- Specific field errors highlighted
- General error message at bottom

**Status Transition Error**:
- Within confirmation modal
- Clear error message
- Option to retry or close

### Validation Errors

**Required Fields**:
- Red border on field
- Error message below: "This field is required"
- Focus on first error field

**Invalid Date**:
- "Please select a valid date"
- Past date warning with override option

**Sunday Selection**:
- Warning banner (not blocking for admin)
- "Business is closed on Sundays"

## Success Criteria

1. Modal opens smoothly with proper loading state
2. All appointment information is clearly organized and scannable
3. Edit mode is visually distinct and intuitive
4. Status transitions work smoothly with proper confirmations
5. Form validation provides clear feedback
6. Responsive design works on all screen sizes
7. All interactions are keyboard accessible
8. Screen readers can navigate effectively
9. Error states provide actionable feedback
10. Loading states prevent user confusion
11. Unsaved changes are protected

## Next Steps

Design specification completed and saved at `.claude/design/appointment-detail-modal.md`.

**Next Step**: Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan that:

1. Restructures the modal layout with proper visual hierarchy
2. Implements the enhanced header with status badge
3. Creates distinct view vs edit mode styling
4. Builds responsive card layouts for customer/pet info
5. Implements the status timeline component (optional)
6. Adds proper form validation and error states
7. Implements smooth transitions between modes
8. Ensures full accessibility compliance
9. Adds loading skeletons and success feedback
10. Optimizes for mobile with bottom sheet behavior
