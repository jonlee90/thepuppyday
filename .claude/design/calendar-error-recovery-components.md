# Google Calendar Error Recovery Components - Design Specification

## Overview

This specification defines three interconnected UI components for monitoring and recovering from Google Calendar sync failures:

1. **QuotaWarning Component** - Proactive monitoring banner for API quota usage
2. **SyncErrorRecovery Component** - Comprehensive error management panel
3. **PausedSyncBanner Component** - Critical alert when auto-sync is disabled

These components provide administrators with visibility into sync health and tools to resolve issues without technical expertise.

---

## User Flow

### Primary User Journey

```
Admin accesses Calendar Settings
    ↓
[If quota > 80%] → QuotaWarning appears at top
    ↓
[If sync paused] → PausedSyncBanner appears prominently
    ↓
Admin clicks "View Errors" → SyncErrorRecovery panel opens
    ↓
Admin reviews failed syncs → Selects retry action
    ↓
System attempts retry → Shows loading state
    ↓
Success: Toast notification + remove from list
OR
Failure: Updated error message + retry count increment
```

### Edge Cases
- **No errors state**: SyncErrorRecovery shows encouraging empty state
- **All retries exhausted**: Disable retry button, show "Contact Support" CTA
- **Quota fully exceeded**: QuotaWarning becomes critical (red) with urgent messaging
- **Auto-resume after manual retry success**: PausedSyncBanner auto-hides

---

## Component 1: QuotaWarning Component

### Purpose
Proactive warning system to prevent quota exhaustion before it causes service disruption.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  API Quota Warning                                    [Dismiss]│
│                                                                   │
│ Google Calendar API usage: 850 / 1,000,000 requests (85%)       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░│ │ (Gradient bar)
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Quota resets in: 4 hours 30 minutes                             │
│                                                                   │
│ Suggested actions:                                               │
│ • Monitor sync frequency settings                                │
│ • Review recent appointment activity                             │
│ • Consider upgrading quota in Google Cloud Console               │
│                                                                   │
│ [View Google Cloud Console →]                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Design

**Container:**
- Background: Warning severity gradient
  - 80-89%: `bg-amber-50` with `border-l-4 border-amber-400`
  - 90-94%: `bg-orange-50` with `border-l-4 border-orange-500`
  - 95%+: `bg-red-50` with `border-l-4 border-red-500`
- Padding: `p-6` (24px)
- Corner radius: `rounded-xl` (16px)
- Shadow: `shadow-md` (soft elevation)
- Full width with max-width: `max-w-6xl`

**Typography:**
- Header: 18px, semibold, charcoal (#434E54)
- Usage text: 16px, medium, charcoal
- Percentage: 16px, bold, severity color (amber/orange/red)
- Reset time: 14px, regular, text-secondary (#6B7280)
- Action items: 14px, regular, text-secondary
- Link: 14px, medium, primary with underline on hover

**Progress Bar:**
- Height: 16px
- Background: `bg-neutral-200` (light gray)
- Corner radius: `rounded-full`
- Gradient fill (left to right):
  - 0-79%: Green (#10B981)
  - 80-89%: Amber (#F59E0B)
  - 90-94%: Orange (#FB923C)
  - 95-100%: Red (#EF4444)
- Smooth transition: `transition-all duration-500 ease-in-out`

**Icons:**
- Warning icon: Lucide `AlertTriangle` (20px)
- Color matches severity (amber/orange/red)
- Position: Left of header, vertically centered

**Dismiss Button:**
- Position: Top-right corner
- Icon: Lucide `X` (16px)
- Hover state: `hover:bg-neutral-200/50 rounded-full`
- Padding: `p-2`

### Component States

**State 1: Warning (80-89%)**
- Border: Amber (`border-amber-400`)
- Background: `bg-amber-50`
- Icon: Amber `AlertTriangle`
- Progress bar: Amber portion visible

**State 2: High Warning (90-94%)**
- Border: Orange (`border-orange-500`)
- Background: `bg-orange-50`
- Icon: Orange `AlertTriangle`
- Progress bar: Orange portion visible
- Header changes to: "⚠️ High API Quota Usage"

**State 3: Critical (95%+)**
- Border: Red (`border-red-500`)
- Background: `bg-red-50`
- Icon: Red `AlertTriangle`
- Progress bar: Red portion visible
- Header changes to: "🚨 Critical API Quota Usage"
- Additional urgent text: "Service may be interrupted soon"

**State 4: Dismissed**
- Component slides up and fades out (`transition-all duration-300`)
- Reappears on next page load if quota still above threshold

**State 5: Auto-hide (quota < 80%)**
- Component fades out automatically
- Does not reappear until quota exceeds 80% again

### Interaction Design

**Dismiss Action:**
- User clicks `[X]` button
- Component slides up with fade-out animation (300ms)
- Sets session storage flag: `quotaWarningDismissed_{timestamp}`
- Reappears on page refresh

**View Console Link:**
- Opens Google Cloud Console in new tab
- Direct link: `https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas?project={project_id}`
- Hover: Underline animation (100ms)

**Progress Bar Animation:**
- On mount: Animate from 0 to current percentage (800ms ease-out)
- On update: Smooth transition to new value (500ms ease-in-out)

### Responsive Behavior

**Desktop (>1024px):**
- Full layout as shown above
- Horizontal action list (bullets in single line)

**Tablet (640px-1024px):**
- Same layout, slightly reduced padding (`p-5`)
- Font sizes unchanged for readability

**Mobile (<640px):**
- Vertical stacking
- Header and dismiss button on same line
- Progress bar full width
- Action items stack vertically (no bullets)
- Link button full width
- Padding: `p-4`

### Accessibility Requirements

**ARIA Labels:**
- Role: `alert` (for screen reader announcement)
- `aria-label="API quota warning: {percentage}% used"`
- Progress bar: `role="progressbar" aria-valuenow="{value}" aria-valuemin="0" aria-valuemax="100"`
- Dismiss button: `aria-label="Dismiss quota warning"`

**Keyboard Navigation:**
- Tab order: Dismiss button → Console link
- Enter/Space on dismiss button closes alert
- Focus ring visible on all interactive elements

**Screen Reader:**
- Announce severity level: "Warning", "High warning", "Critical"
- Read full usage text: "850 of 1,000,000 requests used, 85 percent"
- Read reset time: "Quota resets in 4 hours 30 minutes"

**Color Contrast:**
- All text meets WCAG 2.1 AA (4.5:1 for normal text)
- Severity conveyed through icons, borders, AND text (not color alone)

---

## Component 2: SyncErrorRecovery Component

### Purpose
Comprehensive error management interface for viewing, filtering, and retrying failed Google Calendar sync operations.

### Layout Structure

```
┌───────────────────────────────────────────────────────────────────────┐
│ Sync Error Recovery                                                   │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Filters:                                                          │ │
│ │ [Date Range ▼] [Error Type ▼] [Search appointments...]   [Reset] │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ 🐾 Bella - Poodle Mix                                    Failed 2h ago│
│ │ Dec 26, 2025 • 2:00 PM • Premium Grooming                         │
│ │                                                                    │
│ │ ⚠️ Error: Calendar event creation failed (rate limit exceeded)    │
│ │                                                                    │
│ │ Retry attempts: 2/3 • Next auto-retry: 1h 15m                     │
│ │                                                                    │
│ │ [↻ Retry Now]  [🔄 Resync]                            [Details ▼] │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ 🐾 Max - German Shepherd                             Failed 5h ago │
│ │ Dec 26, 2025 • 10:00 AM • Basic Grooming                          │
│ │                                                                    │
│ │ ⚠️ Error: Invalid calendar ID (calendar may have been deleted)    │
│ │                                                                    │
│ │ Retry attempts: 3/3 • Manual intervention required                │
│ │                                                                    │
│ │ [Contact Support]                                      [Details ▼] │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [Select All] [Retry All Selected (2)]  [Clear Resolved Errors]       │
└───────────────────────────────────────────────────────────────────────┘
```

### Visual Design

**Page Container:**
- Background: Cream `bg-[#F8EEE5]`
- Max width: `max-w-6xl mx-auto`
- Padding: `px-6 py-8`

**Header:**
- Typography: 28px, semibold, charcoal (#434E54)
- Margin bottom: `mb-6`
- Optional subtitle: 14px, regular, text-secondary
  - "Manage failed calendar sync operations and retry them manually"

**Filter Bar:**
- Background: White (`bg-white`)
- Padding: `p-4`
- Corner radius: `rounded-lg`
- Shadow: `shadow-sm`
- Flex layout: `flex flex-wrap gap-3 items-center`
- Margin bottom: `mb-6`

**Filter Elements:**
- Date Range Dropdown: DaisyUI select, 180px width
- Error Type Dropdown: DaisyUI select, 200px width
- Search Input: DaisyUI input, flex-grow, placeholder "Search by pet or appointment..."
- Reset Button: Ghost button, "Reset Filters"

**Error Card:**
- Background: White (`bg-white`)
- Padding: `p-5`
- Corner radius: `rounded-xl`
- Border: `border border-neutral-300`
- Shadow: `shadow-sm` at rest → `shadow-md` on hover
- Margin bottom: `mb-4`
- Transition: `transition-all duration-200`

**Card Header (Pet Info):**
- Layout: Flex row, space-between
- Pet name + breed: 18px, semibold, charcoal
- Icon: 🐾 emoji (16px) or Lucide `PawPrint`
- Time ago: 14px, regular, text-muted (#9CA3AF), right-aligned

**Card Appointment Details:**
- Typography: 14px, regular, text-secondary
- Separator: Bullet points (•)
- Format: "Date • Time • Service"
- Margin bottom: `mb-3`

**Error Message:**
- Background: Red tint `bg-red-50`
- Padding: `p-3`
- Corner radius: `rounded-lg`
- Border left: `border-l-4 border-red-400`
- Icon: Lucide `AlertCircle` (16px, red)
- Typography: 14px, regular, charcoal
- Margin bottom: `mb-3`

**Retry Status:**
- Typography: 13px, medium, text-secondary
- Separator: Bullet points (•)
- Retry count color:
  - 0-1 attempts: text-secondary (#6B7280)
  - 2 attempts: text-orange-600
  - 3 attempts: text-red-600
- Next retry time: text-secondary with clock icon (Lucide `Clock`)

**Action Buttons:**
- Layout: Flex row, space-between
- Primary action (Retry Now): DaisyUI btn-primary, charcoal background
- Secondary action (Resync): DaisyUI btn-ghost
- Tertiary action (Details): DaisyUI btn-ghost, right-aligned
- Size: `btn-sm` (small)
- Icons: Lucide `RotateCw`, `RefreshCw`, `ChevronDown`

**Bulk Actions Bar:**
- Background: White (`bg-white`)
- Padding: `p-4`
- Corner radius: `rounded-lg`
- Shadow: `shadow-sm`
- Margin top: `mt-6`
- Layout: Flex row, space-between
- Sticky: `sticky bottom-4` (stays visible on scroll)

**Bulk Action Buttons:**
- Select All: Checkbox + label
- Retry All: DaisyUI btn-primary, disabled if no selection
- Clear Resolved: DaisyUI btn-ghost, red text

### Component States

**State 1: Loading (Initial Load)**
- Show skeleton cards (3-4 placeholders)
- Animated pulse effect: `animate-pulse`
- Skeleton structure matches card layout

**State 2: Empty State (No Errors)**
- Background: White card with cream tint
- Icon: Lucide `CheckCircle` (48px, green)
- Heading: 20px, semibold, "All syncs are healthy!"
- Subtext: 14px, regular, "No failed calendar events to report"
- Illustration: Optional success graphic
- Center-aligned content
- Padding: `p-12`

**State 3: Active Errors (List View)**
- Cards displayed as per layout above
- Real-time updates: Poll every 30 seconds
- New errors appear at top with subtle slide-down animation

**State 4: Retry in Progress**
- Card shows loading overlay
- Disable all buttons on that card
- Show spinner icon (Lucide `Loader2` with spin animation)
- Text: "Retrying sync..." (14px, medium, text-secondary)
- Dim background: `opacity-60`

**State 5: Retry Success**
- Card flashes green border briefly (500ms)
- Success toast appears: "✓ Sync successful for Bella's appointment"
- Card fades out and slides up (300ms)
- Removed from list after animation

**State 6: Retry Failure**
- Error message updates with new details
- Retry count increments (2/3 → 3/3)
- Error toast appears: "✗ Retry failed - See updated error message"
- Card border briefly flashes red (500ms)
- If max retries reached: Show "Contact Support" button

**State 7: All Retries Exhausted (3/3)**
- Retry button disabled and hidden
- Show "Manual intervention required" badge (red)
- Display "Contact Support" button (DaisyUI btn-error)
- Error message background darker red tint

**State 8: Filters Applied**
- Filter bar shows active filters with badges
- Card count updates: "Showing 2 of 8 errors"
- Empty state if no matches: "No errors match your filters"

### Interaction Design

**Retry Now Button:**
- Click → Show loading spinner on card
- API call: `POST /api/admin/calendar/retry-sync`
- Payload: `{ appointmentId, errorId }`
- Success: Toast + remove card with slide-up animation (300ms)
- Failure: Toast + update error message + increment retry count
- Transition: `transition-all duration-200`

**Resync Button (Delete + Recreate):**
- Click → Show confirmation modal:
  - Title: "Resync Calendar Event?"
  - Body: "This will delete the existing event and create a new one. Use this if event details have changed."
  - Actions: [Cancel] [Resync Event]
- Confirm → Loading state → Same success/failure flow as Retry

**Details Dropdown:**
- Click → Expand card to show:
  - Full error stack trace (formatted in code block)
  - Appointment ID and Event ID
  - Sync attempt timestamps
  - Google API response (if available)
- Icon rotates 180° when expanded (chevron points up)
- Animate height expansion: `transition-all duration-300 ease-in-out`

**Filter Interactions:**
- Date Range: Dropdown with presets (Today, Last 7 days, Last 30 days, Custom)
- Error Type: Dropdown with options (Rate limit, Auth error, Invalid ID, Network error, Other)
- Search: Debounced input (300ms delay)
- Reset Filters: Clear all filters and reload full list

**Bulk Actions:**
- Select All: Checkbox in each card header appears when checked
- Retry All: Confirm modal → "Retry {count} selected errors?"
- Clear Resolved: Confirm modal → "Remove {count} resolved errors from history?"

**Auto-refresh:**
- Poll API every 30 seconds
- Update card data in place (no page reload)
- Show subtle flash animation on cards that update
- Pause polling if user is actively interacting (typing, dropdown open)

**Toast Notifications:**
- Position: Top-right corner
- Duration: 4 seconds (success), 6 seconds (error)
- Success: Green background, white text, checkmark icon
- Error: Red background, white text, X icon
- Multi-line support for long messages
- Dismiss on click

### Responsive Behavior

**Desktop (>1024px):**
- Full layout as shown
- Cards: 2-column grid if space permits
- Filter bar: Horizontal layout

**Tablet (640px-1024px):**
- Single column card list
- Filter bar: Wrap to 2 rows if needed
- Action buttons remain horizontal

**Mobile (<640px):**
- Single column layout
- Filter bar: Stack vertically
  - Date range and error type full width
  - Search input full width below
- Card layout:
  - Pet name and time ago stack vertically
  - Action buttons stack vertically, full width
  - Details button moves to top-right corner
- Bulk actions: Stack vertically, full width buttons
- Sticky bulk actions bar: Reduce padding (`p-3`)

### Accessibility Requirements

**ARIA Labels:**
- Error list: `role="list"`, each card `role="listitem"`
- Retry button: `aria-label="Retry sync for {pet_name}'s appointment"`
- Resync button: `aria-label="Resync calendar event for {pet_name}"`
- Details button: `aria-expanded="false"` (toggles to "true")
- Filter inputs: Proper label associations (`for` and `id` attributes)
- Bulk select checkbox: `aria-label="Select error for {pet_name}"`

**Keyboard Navigation:**
- Tab order: Filters → Error cards (top to bottom) → Bulk actions
- Within card: Retry → Resync → Details
- Enter/Space: Activate buttons
- Arrow keys: Navigate dropdown filters
- Escape: Close expanded details, clear search focus

**Screen Reader:**
- Announce card count: "Showing 5 sync errors"
- Announce filter changes: "Filtered to rate limit errors only"
- Announce retry status: "Retry in progress", "Retry successful", "Retry failed"
- Read full error message on focus
- Announce retry count: "2 of 3 retry attempts used"

**Focus Management:**
- Clear focus rings on all interactive elements
- Focus trap in confirmation modals
- Return focus to retry button after modal close
- Skip link: "Skip to error list" for keyboard users

**Color Contrast:**
- All text meets WCAG 2.1 AA
- Error states conveyed with icons AND color
- Disabled buttons have sufficient contrast with background

---

## Component 3: PausedSyncBanner Component

### Purpose
Critical alert banner to inform administrators that automatic Google Calendar sync has been disabled due to repeated failures, requiring immediate attention.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🚨 Calendar Auto-Sync Paused                                            │
│                                                                          │
│ Automatic syncing was paused at Dec 26, 2025 2:30 PM due to consecutive │
│ failures. New appointments will not sync to Google Calendar until       │
│ resolved.                                                                │
│                                                                          │
│ Recent errors: 5 rate limit failures, 2 authentication errors           │
│                                                                          │
│ [View Error Details]  [Resume Auto-Sync]                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Design

**Container:**
- Background: Red gradient `bg-gradient-to-r from-red-500 to-red-600`
- Text color: White (`text-white`)
- Padding: `p-6`
- Corner radius: `rounded-xl` (16px)
- Shadow: `shadow-lg` (strong elevation)
- Border: None (relies on strong background color)
- Full width with max-width: `max-w-6xl`
- Margin bottom: `mb-6` (prominent placement)

**Alternative Severity (Amber - for warnings):**
- Background: `bg-gradient-to-r from-amber-500 to-orange-500`
- Use when: Paused due to quota warnings (not critical failures)

**Typography:**
- Header: 20px, bold, white
- Icon: 🚨 emoji (24px) or Lucide `AlertOctagon` (white)
- Body text: 15px, regular, white with reduced opacity (`text-white/90`)
- Error summary: 14px, medium, white
- Timestamp: 14px, regular, white with reduced opacity

**Action Buttons:**
- Primary (Resume): DaisyUI btn, white background, red text
  - `bg-white text-red-600 hover:bg-red-50`
  - Size: `btn-md`
  - Icon: Lucide `Play` (16px)
- Secondary (View Details): DaisyUI btn-ghost, white text
  - `text-white border border-white/30 hover:bg-white/10`
  - Size: `btn-md`
  - Icon: Lucide `ExternalLink` (16px)
- Layout: Flex row, gap-3, margin-top: `mt-4`

### Component States

**State 1: Active (Sync Paused)**
- Full banner visible with red background
- Shows pause timestamp and reason
- Both action buttons enabled
- Pulse animation on critical icon (subtle): `animate-pulse`

**State 2: Resume in Progress**
- "Resume Auto-Sync" button shows spinner
- Button text: "Resuming..."
- Disable both buttons during operation
- Loading spinner: Lucide `Loader2` with spin animation

**State 3: Resume Success**
- Banner flashes green briefly (500ms)
- Success message: "Auto-sync resumed successfully"
- Banner fades out and slides up (600ms)
- Toast confirmation: "✓ Calendar auto-sync is now active"
- Component unmounts after animation

**State 4: Resume Failure**
- Banner remains visible
- Error toast: "✗ Failed to resume sync - Resolve errors first"
- Shake animation on banner (300ms): `animate-shake`
- Emphasis on "View Error Details" button (pulsing glow)

**State 5: Hidden (Sync Active)**
- Component not rendered
- No space reserved in layout

### Interaction Design

**View Error Details Button:**
- Click → Navigate to SyncErrorRecovery component
- If on same page: Smooth scroll to error panel
- If on different page: Navigate with hash anchor (`/calendar-settings#errors`)
- Transition: Fade navigation (300ms)

**Resume Auto-Sync Button:**
- Click → Show confirmation modal:
  - Title: "Resume Automatic Sync?"
  - Body: "This will re-enable automatic calendar syncing. Ensure errors have been resolved to prevent repeated failures."
  - Warning: "If errors persist, sync will pause again after 5 consecutive failures."
  - Actions: [Cancel] [Resume Sync]
- Confirm → API call: `POST /api/admin/calendar/resume-sync`
- Success: Banner fades out + toast notification
- Failure: Error toast + banner remains

**Auto-hide Logic:**
- Component checks sync status every 30 seconds
- If sync resumed externally (e.g., all errors cleared): Auto-hide with fade-out
- Reappears immediately if sync pauses again

### Responsive Behavior

**Desktop (>1024px):**
- Full horizontal layout
- Buttons side-by-side at bottom
- Generous padding (`p-6`)

**Tablet (640px-1024px):**
- Same layout, slightly reduced padding (`p-5`)
- Buttons remain horizontal

**Mobile (<640px):**
- Vertical stacking
- Header and icon on same line (reduced icon size: 20px)
- Body text wraps
- Error summary on new line
- Buttons stack vertically, full width
- Reduced padding (`p-4`)
- Font sizes: Header 18px, body 14px

### Accessibility Requirements

**ARIA Labels:**
- Role: `alert` (immediate announcement)
- `aria-live="assertive"` (interrupts screen reader)
- `aria-label="Critical: Calendar auto-sync paused due to errors"`
- Resume button: `aria-label="Resume automatic calendar synchronization"`
- View details button: `aria-label="View sync error details"`

**Keyboard Navigation:**
- Tab order: View Details → Resume Auto-Sync
- Enter/Space: Activate buttons
- Escape: Close confirmation modal
- Focus ring: White ring with opacity for visibility on red background

**Screen Reader:**
- Announce banner immediately on page load: "Alert: Calendar auto-sync paused"
- Read full pause reason and timestamp
- Read error summary: "5 rate limit failures, 2 authentication errors"
- Announce button states: "Resume sync button, loading", "Resume sync button, enabled"

**Focus Management:**
- Auto-focus on "View Error Details" button on mount (draws attention)
- Focus trap in confirmation modal
- Return focus to Resume button after modal close

**Color Contrast:**
- White text on red background: Ensure 4.5:1 contrast ratio
- Button text (red on white): High contrast for readability
- Icon contrast sufficient for visibility

**Visual Indicators:**
- Critical severity conveyed through:
  - Red background (color)
  - Alert icon (symbol)
  - "Paused" text (language)
  - Strong shadow (elevation)
- Not reliant on color alone

---

## Cross-Component Interactions

### Integration Points

**QuotaWarning → PausedSyncBanner:**
- If quota hits 100%: QuotaWarning becomes critical AND PausedSyncBanner may appear
- Both can be visible simultaneously (quota exhaustion is one pause reason)

**PausedSyncBanner → SyncErrorRecovery:**
- "View Error Details" button navigates to SyncErrorRecovery
- SyncErrorRecovery filters to show only errors from current pause period
- Breadcrumb or back button to return

**SyncErrorRecovery → PausedSyncBanner:**
- When all errors cleared: SyncErrorRecovery shows success state
- If sync remains paused: Prompt to resume from SyncErrorRecovery
- If auto-resume enabled: PausedSyncBanner auto-hides

**QuotaWarning → SyncErrorRecovery:**
- "View Google Cloud Console" link includes note about current errors
- SyncErrorRecovery can show quota-related errors specifically

### State Synchronization

- All three components poll same API endpoint: `/api/admin/calendar/sync-status`
- Response includes:
  ```typescript
  {
    quotaUsage: { current: 850, limit: 1000000, percentage: 85 },
    isPaused: boolean,
    pauseReason: string,
    pausedAt: timestamp,
    failedSyncs: Array<ErrorObject>,
    lastSyncSuccess: timestamp
  }
  ```
- Poll interval: 30 seconds (staggered by 1-2 seconds to avoid simultaneous requests)
- WebSocket alternative for real-time updates (if available)

### Placement on Page

**Calendar Settings Page Layout:**

```
┌─────────────────────────────────────────────────────┐
│ [If sync paused] PausedSyncBanner (top priority)    │
├─────────────────────────────────────────────────────┤
│ [If quota > 80%] QuotaWarning (below critical banner)│
├─────────────────────────────────────────────────────┤
│ Calendar Settings Header                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Calendar Configuration                          │ │
│ │ • Calendar ID                                   │ │
│ │ • Sync frequency                                │ │
│ │ • Event settings                                │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Sync Error Recovery (SyncErrorRecovery component)   │
│ [Full panel as designed]                            │
└─────────────────────────────────────────────────────┘
```

**Admin Dashboard (QuotaWarning only):**
- Appears at top of dashboard, above summary cards
- Collapses to single-line alert on mobile

---

## Animation Specifications

### Entry Animations

**QuotaWarning:**
- Slide down from top + fade in
- Duration: 400ms
- Easing: `ease-out`
- Delay: 200ms after page load
- CSS: `animate-slideDown` (custom Tailwind animation)

**PausedSyncBanner:**
- Slide down + fade in + gentle shake (to draw attention)
- Duration: 500ms (slide) + 300ms (shake)
- Easing: `ease-out` (slide), `ease-in-out` (shake)
- Immediate on page load (no delay)
- CSS: `animate-slideDownShake`

**SyncErrorRecovery Cards:**
- Staggered fade-in from top to bottom
- Duration: 300ms per card
- Delay: 100ms between cards
- Easing: `ease-out`
- Max 5 cards animate (rest appear instantly)

### Exit Animations

**QuotaWarning Dismiss:**
- Slide up + fade out
- Duration: 300ms
- Easing: `ease-in`
- Height collapses to 0

**PausedSyncBanner Resume Success:**
- Flash green (500ms) → Slide up + fade out (600ms)
- Total duration: 1100ms
- Easing: `ease-in-out`

**SyncErrorRecovery Card Removal:**
- Slide up + fade out + height collapse
- Duration: 300ms
- Easing: `ease-in`
- Subsequent cards slide up to fill space (200ms)

### Transition Animations

**QuotaWarning Progress Bar:**
- Smooth width transition on percentage change
- Duration: 500ms
- Easing: `ease-in-out`
- Color gradient transition: 300ms

**SyncErrorRecovery Card Hover:**
- Shadow elevation increase
- Duration: 200ms
- Easing: `ease-out`
- Y-position: 0 → -2px (subtle lift)

**Button Hover (All Components):**
- Background color transition
- Duration: 200ms
- Easing: `ease-in-out`
- Scale: 1 → 1.02 (subtle)

### Loading Animations

**Spinner Icon:**
- Lucide `Loader2` with continuous spin
- Duration: 1000ms per rotation
- Easing: `linear` (constant speed)
- CSS: `animate-spin`

**Skeleton Loading (SyncErrorRecovery):**
- Pulse effect on gray backgrounds
- Duration: 1500ms
- Easing: `ease-in-out`
- Infinite loop
- CSS: `animate-pulse`

---

## Typography Specifications

### Font Family
- Primary: System font stack (DaisyUI default)
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Type Scale

**QuotaWarning:**
- Header: 18px / 1.4 line-height / semibold (font-weight: 600)
- Usage text: 16px / 1.5 / medium (font-weight: 500)
- Percentage: 16px / 1.5 / bold (font-weight: 700)
- Reset time: 14px / 1.5 / regular (font-weight: 400)
- Action items: 14px / 1.6 / regular
- Link: 14px / 1.5 / medium

**SyncErrorRecovery:**
- Page header: 28px / 1.3 / semibold
- Subtitle: 14px / 1.5 / regular
- Card pet name: 18px / 1.4 / semibold
- Card appointment details: 14px / 1.5 / regular
- Error message: 14px / 1.6 / regular
- Retry status: 13px / 1.5 / medium
- Button text: 14px / 1.5 / medium

**PausedSyncBanner:**
- Header: 20px / 1.3 / bold (font-weight: 700)
- Body text: 15px / 1.6 / regular
- Error summary: 14px / 1.5 / medium
- Timestamp: 14px / 1.5 / regular
- Button text: 15px / 1.5 / medium

### Text Colors

**On Light Backgrounds:**
- Primary text: Charcoal `#434E54`
- Secondary text: `#6B7280`
- Muted text: `#9CA3AF`
- Error text: `#EF4444`
- Success text: `#10B981`
- Warning text: `#F59E0B`

**On Dark/Colored Backgrounds:**
- Primary text: White `#FFFFFF`
- Reduced opacity: `rgba(255, 255, 255, 0.9)`
- Muted: `rgba(255, 255, 255, 0.7)`

---

## Spacing and Sizing Specifications

### Component Spacing

**QuotaWarning:**
- Container padding: 24px (desktop), 20px (tablet), 16px (mobile)
- Internal gaps: 16px between elements
- Progress bar margin: 12px top and bottom
- Action list item gap: 8px vertical
- Dismiss button padding: 8px

**SyncErrorRecovery:**
- Page padding: 32px vertical, 24px horizontal (desktop)
- Page padding: 24px vertical, 16px horizontal (mobile)
- Filter bar padding: 16px
- Filter element gap: 12px
- Card padding: 20px
- Card margin bottom: 16px
- Error message padding: 12px
- Button gap: 12px horizontal
- Bulk actions padding: 16px

**PausedSyncBanner:**
- Container padding: 24px (desktop), 20px (tablet), 16px (mobile)
- Internal gaps: 16px between paragraphs
- Button gap: 12px horizontal
- Button margin top: 16px

### Element Sizing

**Buttons:**
- Small: Height 36px, padding 8px 16px
- Medium: Height 40px, padding 10px 20px
- Large: Height 44px, padding 12px 24px
- Icon size in buttons: 16px (match text size)

**Icons:**
- Small: 16px
- Medium: 20px
- Large: 24px
- Hero (empty state): 48px

**Progress Bar:**
- Height: 16px
- Corner radius: 9999px (full round)

**Cards:**
- Min height: 120px (prevents layout shift)
- Border width: 1px
- Corner radius: 16px
- Shadow blur: 4px (sm), 8px (md), 12px (lg)

**Modals:**
- Max width: 500px
- Padding: 24px
- Corner radius: 20px
- Backdrop blur: 8px

---

## Color Specifications

### Severity Colors

**Success:**
- Background: `#ECFDF5` (green-50)
- Border: `#10B981` (green-500)
- Text: `#065F46` (green-800)
- Icon: `#10B981`

**Warning (80-89% quota):**
- Background: `#FFFBEB` (amber-50)
- Border: `#F59E0B` (amber-400)
- Text: `#92400E` (amber-800)
- Icon: `#F59E0B`

**High Warning (90-94% quota):**
- Background: `#FFF7ED` (orange-50)
- Border: `#FB923C` (orange-500)
- Text: `#9A3412` (orange-800)
- Icon: `#FB923C`

**Critical (95%+ quota, sync paused):**
- Background: `#FEF2F2` (red-50)
- Border: `#EF4444` (red-500)
- Text: `#991B1B` (red-800)
- Icon: `#EF4444`
- Banner background: `linear-gradient(to right, #EF4444, #DC2626)`

**Informational:**
- Background: `#EFF6FF` (blue-50)
- Border: `#3B82F6` (blue-500)
- Text: `#1E3A8A` (blue-900)
- Icon: `#3B82F6`

### Component-Specific Colors

**QuotaWarning Progress Bar:**
- Background track: `#E5E7EB` (neutral-200)
- Green fill (0-79%): `#10B981`
- Amber fill (80-89%): `#F59E0B`
- Orange fill (90-94%): `#FB923C`
- Red fill (95-100%): `#EF4444`
- Gradient transition between colors (smooth blend)

**SyncErrorRecovery Cards:**
- Background: `#FFFFFF`
- Border: `#E5E5E5` (neutral-300)
- Hover border: `#D1D5DB` (neutral-400)
- Error message background: `#FEF2F2` (red-50)
- Selected card background: `#F3F4F6` (neutral-100)

**PausedSyncBanner:**
- Critical gradient: `linear-gradient(90deg, #EF4444 0%, #DC2626 100%)`
- Warning gradient: `linear-gradient(90deg, #F59E0B 0%, #FB923C 100%)`
- Button background: `#FFFFFF`
- Button text: `#DC2626` (red-600)
- Button hover: `#FEF2F2` (red-50)

**Buttons:**
- Primary: Background `#434E54`, text white
- Primary hover: Background `#363F44`, text white
- Secondary: Background transparent, border `#E5E5E5`, text `#434E54`
- Secondary hover: Background `#F3F4F6`, border `#D1D5DB`
- Ghost: Background transparent, text `#434E54`
- Ghost hover: Background `#F3F4F6`
- Disabled: Background `#F3F4F6`, text `#D1D5DB`, cursor not-allowed

---

## Assets Needed

### Icons (Lucide React)

**QuotaWarning:**
- `AlertTriangle` (warning icon)
- `X` (dismiss button)
- `ExternalLink` (console link)

**SyncErrorRecovery:**
- `RotateCw` (retry button)
- `RefreshCw` (resync button)
- `ChevronDown` / `ChevronUp` (details toggle)
- `AlertCircle` (error message icon)
- `Clock` (next retry time)
- `CheckCircle` (empty state success)
- `Loader2` (loading spinner)
- `Search` (search input icon)
- `Filter` (filter icon)
- `PawPrint` (optional pet icon)

**PausedSyncBanner:**
- `AlertOctagon` (critical alert)
- `Play` (resume button)
- `ExternalLink` (view details)

**Toast Notifications:**
- `CheckCircle` (success)
- `XCircle` (error)
- `AlertCircle` (warning)
- `Info` (informational)

### Illustrations

**SyncErrorRecovery Empty State:**
- Option 1: Custom illustration of healthy calendar sync (calendar + checkmark + sync arrows)
- Option 2: Lucide `CheckCircle` icon at 48px (simpler)
- Style: Line art, minimal, charcoal color
- Format: SVG

**Quota Warning (Optional):**
- Small gauge/meter icon to visualize quota usage
- Format: SVG inline

### No Images Required
- All visual elements can be achieved with:
  - Lucide React icons
  - CSS gradients
  - Tailwind utilities
  - DaisyUI components
  - Optional SVG illustrations (simple line art)

---

## Implementation Notes for daisyui-expert

### DaisyUI Component Mappings

**QuotaWarning:**
- Container: `<div class="alert">` with custom classes for severity
- Dismiss button: `<button class="btn btn-sm btn-circle btn-ghost">`
- Progress bar: Custom div (not DaisyUI component)
- Link: `<a class="link link-hover">`

**SyncErrorRecovery:**
- Filter dropdowns: `<select class="select select-bordered">`
- Search input: `<input type="text" class="input input-bordered">`
- Cards: `<div class="card bg-base-100 shadow-sm">`
- Buttons: `<button class="btn btn-primary btn-sm">`, `<button class="btn btn-ghost btn-sm">`
- Checkbox: `<input type="checkbox" class="checkbox">`
- Modal: `<dialog class="modal">` (for confirmation dialogs)

**PausedSyncBanner:**
- Container: Custom div (no direct DaisyUI equivalent for gradient alerts)
- Buttons: `<button class="btn btn-md">` with custom classes

**Toast Notifications:**
- DaisyUI toast: `<div class="toast toast-top toast-end">`
- Alert inside toast: `<div class="alert alert-success">` (or alert-error)

### Custom Tailwind Classes Needed

```css
/* Slide down animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideDown {
  animation: slideDown 400ms ease-out;
}

/* Slide down with shake */
@keyframes slideDownShake {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  60% {
    opacity: 1;
    transform: translateY(0);
  }
  70% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
  90% {
    transform: translateX(-3px);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-slideDownShake {
  animation: slideDownShake 800ms ease-out;
}

/* Shake animation */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 300ms ease-in-out;
}
```

### API Integration Points

**Endpoint: `/api/admin/calendar/sync-status`**
- Method: GET
- Response type:
  ```typescript
  {
    quotaUsage: {
      current: number;
      limit: number;
      percentage: number;
      resetAt: string; // ISO timestamp
    };
    isPaused: boolean;
    pauseReason?: string;
    pausedAt?: string; // ISO timestamp
    failedSyncs: Array<{
      id: string;
      appointmentId: string;
      petName: string;
      petBreed: string;
      appointmentDate: string;
      appointmentTime: string;
      service: string;
      errorMessage: string;
      errorType: string;
      retryCount: number;
      maxRetries: number;
      nextRetryAt?: string;
      failedAt: string;
    }>;
    lastSyncSuccess?: string;
  }
  ```

**Endpoint: `/api/admin/calendar/retry-sync`**
- Method: POST
- Body: `{ appointmentId: string, errorId: string }`
- Response: `{ success: boolean, message: string }`

**Endpoint: `/api/admin/calendar/resync`**
- Method: POST
- Body: `{ appointmentId: string, errorId: string, deleteExisting: boolean }`
- Response: `{ success: boolean, message: string }`

**Endpoint: `/api/admin/calendar/resume-sync`**
- Method: POST
- Response: `{ success: boolean, message: string }`

**Endpoint: `/api/admin/calendar/retry-batch`**
- Method: POST
- Body: `{ errorIds: string[] }`
- Response: `{ success: boolean, results: Array<{ errorId: string, success: boolean }> }`

---

## Next Steps

**Design specification completed and saved at:**
`C:\Users\Jon\Documents\claude projects\thepuppyday\.claude\design\calendar-error-recovery-components.md`

**Next Step:** Use `@daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan and actual React/TypeScript components.

**Implementation Order Suggestion:**
1. Start with **QuotaWarning** (simplest, standalone)
2. Then **PausedSyncBanner** (depends on sync status API)
3. Finally **SyncErrorRecovery** (most complex, depends on error data structure)
4. Integrate all three into Calendar Settings page

**Testing Checklist:**
- [ ] QuotaWarning appears at 80%, 90%, 95% thresholds
- [ ] QuotaWarning dismisses and reappears correctly
- [ ] QuotaWarning auto-hides when quota drops below 80%
- [ ] PausedSyncBanner shows when sync paused
- [ ] PausedSyncBanner resume confirmation works
- [ ] PausedSyncBanner auto-hides when sync resumed
- [ ] SyncErrorRecovery loads error list
- [ ] SyncErrorRecovery filters work correctly
- [ ] Individual retry succeeds and removes card
- [ ] Individual retry fails and updates error
- [ ] Resync confirmation modal works
- [ ] Batch retry works for multiple selections
- [ ] Empty state shows when no errors
- [ ] Real-time polling updates (30-second interval)
- [ ] Toast notifications appear and dismiss
- [ ] All components responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all alerts and state changes
- [ ] Color contrast passes WCAG 2.1 AA
