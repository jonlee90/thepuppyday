# Admin Appointments Date Selection - PST Timezone Design Specification

## Overview

This design specification addresses timezone handling in the admin appointment creation flow, specifically in the "Select date" section (Step 4 of the ManualAppointmentModal wizard). The goal is to ensure all date/time displays and selections are timezone-aware and consistently use Pacific Standard Time (PST / America/Los_Angeles) - the business timezone for The Puppy Day in La Mirada, CA.

## Current State Analysis

### Problems Identified

1. **DateTimeStep.tsx (Admin)**:
   - Uses `new Date().toISOString().split('T')[0]` for minDate calculation which uses the user's local timezone, not business timezone
   - Past date check uses local timezone: `new Date(selectedDate) < new Date()` without timezone awareness
   - Sunday check uses local timezone: `new Date(selectedDate).getDay()` could be incorrect for edge-case timezone differences
   - No visual indicator showing that dates are in PST timezone

2. **AppointmentCalendar.tsx**:
   - `toLocaleString` is used for slot display but without explicit timezone option
   - Past time check `if (slotTime < new Date())` uses user's local timezone
   - No timezone indicator in the calendar header or time displays

3. **AppointmentListView.tsx**:
   - Uses `getTodayInBusinessTimezone()` correctly for "Today" preset
   - But "Tomorrow", "This Week", "This Month" presets still use local `new Date()` without timezone conversion
   - Date display in table rows uses `format(new Date(...))` without timezone specification

4. **CalendarPicker.tsx (Customer booking)**:
   - Same issue - uses local `new Date()` for today calculation
   - No timezone awareness in date generation

5. **Timezone utility exists** (`src/lib/utils/timezone.ts`) but is underutilized:
   - `getTodayDateString()` - returns YYYY-MM-DD in business timezone
   - `isDateInPast()` - checks against business timezone
   - `getDayOfWeekInBusinessTimezone()` - gets correct day for business timezone
   - `isSundayInBusinessTimezone()` - checks Sunday correctly
   - `formatDateInBusinessTimezone()` - formats dates correctly

## User Flow

### Admin Creating an Appointment (Step 4: Choose Date & Time)

1. Admin opens "Create Appointment" modal
2. Navigates to Step 4 (Date & Time)
3. Sees date picker with:
   - Clear timezone indicator showing "Pacific Time (PT)"
   - Today's date highlighted correctly in PST
   - Past dates disabled based on PST
   - Sundays disabled (business closed)
4. Selects a date
5. Time slots appear with:
   - Times displayed in PST format
   - Clear timezone label
   - Unavailable slots properly calculated in PST
6. Selects a time slot
7. Confirmation shows selected datetime with timezone label

## Layout Structure

### Date Selection Section

```
+------------------------------------------------------------------+
|  Select Date *                                                    |
|  Pacific Time (PT) - La Mirada, CA                  [Timezone Badge]
+------------------------------------------------------------------+
|  [Calendar Icon]  [ Date Input: YYYY-MM-DD ]                     |
|                                                                   |
|  [Warning Banner if Sunday - "Business is closed on Sundays"]    |
|  [Warning Banner if Past - "This date is in the past" + Override]|
|  [Info Banner if Override - "Admin override: past date allowed"] |
+------------------------------------------------------------------+
```

### Time Selection Section

```
+------------------------------------------------------------------+
|  Select Time *                                                    |
|  Showing available slots in Pacific Time (PT)                     |
+------------------------------------------------------------------+
|  [Grid of Time Slot Buttons]                                     |
|                                                                   |
|  9:00 AM PT  | 9:30 AM PT  | 10:00 AM PT | 10:30 AM PT           |
|  11:00 AM PT | 11:30 AM PT | 12:00 PM PT | 12:30 PM PT           |
|  ...                                                              |
+------------------------------------------------------------------+
```

### Summary Display (Step 5 and Confirmation)

```
+------------------------------------------------------------------+
|  Appointment Date & Time                                          |
|  -----------------------------------------------------------------|
|  Friday, December 20, 2024                                        |
|  10:00 AM PT (Pacific Time)                                       |
+------------------------------------------------------------------+
```

## Visual Design

### Timezone Badge Component

**Purpose**: Clear visual indicator that dates/times are in Pacific Time

**Appearance**:
- Background: `#EAE0D5` (secondary cream)
- Text: `#434E54` (charcoal)
- Font: 12px, medium weight
- Icon: Clock icon (Lucide `Clock` or `Globe`)
- Border-radius: 8px (rounded-lg)
- Padding: 4px 8px (py-1 px-2)

**Content Options**:
- Compact: "PT" or "PST"
- Standard: "Pacific Time (PT)"
- Verbose: "Pacific Time - La Mirada, CA"

**States**:
- Default: Static badge near date/time labels
- Hover: Tooltip with full timezone info "America/Los_Angeles - Pacific Standard Time / Pacific Daylight Time"

### Date Input Enhancement

**Label Section**:
```
Select Date *
Pacific Time (PT)     [Clock Icon]
```

**Typography**:
- Label: 14px semibold, charcoal (#434E54)
- Timezone hint: 12px regular, muted (#9CA3AF)

### Time Slot Buttons

**Format Change**:
- Current: "9:00 AM"
- New: "9:00 AM" with subtle "PT" suffix or timezone badge above grid

**Visual Update**:
- Add single timezone indicator above the grid: "Times shown in Pacific Time (PT)"
- Time slots themselves remain clean without individual TZ labels

### Warning/Info Banners

**Past Date Warning**:
- Background: Warning yellow (#FFB347 at 20% opacity)
- Border: 1px solid (#FFB347 at 40% opacity)
- Icon: AlertTriangle (Lucide)
- Text: "This date is in the past (Pacific Time)"
- Action: "Override" button (ghost style)

**Sunday Warning**:
- Background: Warning yellow
- Text: "Business is closed on Sundays (Pacific Time)"

**Admin Override Info**:
- Background: Info blue (#74B9FF at 20% opacity)
- Border: 1px solid (#74B9FF at 40% opacity)
- Icon: Info (Lucide)
- Text: "Admin override: past date allowed"

## Interaction Design

### Date Selection

**On Date Change**:
1. Validate against business timezone "today"
2. Check if Sunday in business timezone
3. Clear previously selected time
4. Fetch available slots for the date

**Past Date Override**:
1. Show warning with "Override" button
2. On click, set `adminOverridePastDate = true`
3. Show info banner confirming override
4. Allow time slot selection

### Timezone Tooltip

**Trigger**: Hover over timezone badge or help icon
**Content**:
```
Pacific Time Zone
America/Los_Angeles
Currently: PST (UTC-8) or PDT (UTC-7)
The Puppy Day - La Mirada, CA
```
**Delay**: 200ms hover delay before showing
**Transition**: Fade in 150ms

### Calendar Navigation

- Today button jumps to current date in PST
- Month/week navigation respects business timezone
- "Now" indicator (if shown) uses PST time

## Responsive Behavior

### Mobile (< 640px)

- Timezone badge: Compact "PT" format
- Time slots: 3 columns
- Date input: Full width
- Timezone hint below label, smaller font (11px)

### Tablet (640px - 1024px)

- Timezone badge: "Pacific Time (PT)"
- Time slots: 4 columns
- Date input: Standard width

### Desktop (> 1024px)

- Timezone badge: Full "Pacific Time (PT) - La Mirada, CA"
- Time slots: 5 columns
- Side-by-side layout possible

## Accessibility Requirements

### ARIA Labels

```html
<!-- Date input -->
<label id="date-label">
  Select Date (required)
  <span class="sr-only">Times are in Pacific Time zone</span>
</label>
<input
  type="date"
  aria-labelledby="date-label"
  aria-describedby="timezone-hint"
/>
<span id="timezone-hint">Pacific Time (PT)</span>

<!-- Timezone badge -->
<span role="note" aria-label="All times shown in Pacific Time zone">
  PT
</span>

<!-- Time slot button -->
<button
  aria-label="9:00 AM Pacific Time, available"
  aria-pressed="false"
>
  9:00 AM
</button>
```

### Keyboard Navigation

- Tab through date input, time slots
- Arrow keys to navigate time slot grid
- Enter/Space to select
- Escape to close any tooltips

### Screen Reader Experience

- Announce "Pacific Time" with every date/time reading
- Announce when date is past or Sunday with reason
- Announce override confirmation

## Technical Implementation Notes

### Utility Functions to Use

From `src/lib/utils/timezone.ts`:

```typescript
// Get today's date string in PST
const todayPST = getTodayDateString(); // "2024-12-20"

// Check if date is past in PST
const isPast = isDateInPast(selectedDate); // true/false

// Check if Sunday in PST
const isSunday = isSundayInBusinessTimezone(selectedDate); // true/false

// Format for display
const formatted = formatDateInBusinessTimezone(selectedDate, 'EEEE, MMMM d, yyyy');
```

### New Utility Functions Needed

```typescript
// Format time with timezone label
function formatTimeWithTimezone(time: string): string {
  return `${time} PT`;
}

// Get timezone abbreviation (PST or PDT based on date)
function getTimezoneAbbreviation(date?: string): 'PST' | 'PDT' {
  // Logic to determine if in daylight saving
}

// Format datetime for display with full timezone
function formatDateTimeWithTimezone(date: string, time: string): string {
  const formattedDate = formatDateInBusinessTimezone(date, 'EEEE, MMMM d, yyyy');
  return `${formattedDate} at ${time} PT (Pacific Time)`;
}
```

### Component Updates Required

1. **DateTimeStep.tsx** (Admin):
   - Import and use timezone utilities
   - Add timezone badge component
   - Update minDate calculation
   - Update isPastDate/isSunday checks
   - Add timezone hint to labels

2. **AppointmentCalendar.tsx**:
   - Add timezone indicator to header
   - Use business timezone for past slot detection
   - Format times with timezone

3. **AppointmentListView.tsx**:
   - Fix date preset calculations to use business timezone
   - Add timezone indicator to date display

4. **SummaryStep.tsx** (Admin):
   - Display selected date/time with timezone label

## Assets Needed

### Icons
- Clock icon (Lucide `Clock`) - for timezone badge
- Globe icon (Lucide `Globe`) - alternative for timezone
- AlertTriangle icon (Lucide) - already imported
- Info icon (Lucide `Info`) - for override confirmation

### No Additional Images Required

## Component Specifications

### TimezoneBadge Component

```typescript
interface TimezoneBadgeProps {
  variant?: 'compact' | 'standard' | 'verbose';
  showTooltip?: boolean;
  className?: string;
}

// Compact: "PT"
// Standard: "Pacific Time (PT)"
// Verbose: "Pacific Time (PT) - La Mirada, CA"
```

### DateTimezoneLabel Component

```typescript
interface DateTimezoneLabelProps {
  label: string;
  required?: boolean;
  variant?: 'compact' | 'standard';
}

// Renders label with timezone hint
```

## Error States

### API Failure
- Show error message
- Retry button
- Timezone indicator still visible

### Invalid Date Format
- Show validation error
- Indicate expected format (YYYY-MM-DD)
- Timezone context maintained

## Success Criteria

1. All dates displayed in admin appointments reflect PST timezone
2. "Today" is correctly calculated as today in PST, not user's local timezone
3. Sunday detection works correctly for PST dates
4. Past date detection works correctly for PST dates
5. Clear visual indicator shows timezone is Pacific Time
6. Tooltips provide full timezone information on hover
7. Screen readers announce timezone context
8. Date presets (Today, Tomorrow, This Week) calculate correctly in PST
9. Calendar navigation uses PST for "today" highlight
10. Time slots display with timezone context

## Next Steps

Design specification completed and saved at `.claude/design/admin-appointments-timezone-date-selection.md`.

**Next Step**: Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan that:
1. Creates the TimezoneBadge component
2. Updates DateTimeStep.tsx with proper timezone utilities
3. Updates AppointmentCalendar.tsx with timezone indicators
4. Fixes AppointmentListView.tsx date preset calculations
5. Ensures consistent timezone display across all admin appointment views
