# Calendar Sync Status Components - Design Specification

## Overview

This specification covers three interconnected components that provide visual feedback and management for Google Calendar sync operations within The Puppy Day's admin interface:

1. **SyncStatusBadge**: Inline status indicator for individual appointments
2. **SyncHistoryPopover**: Detailed sync history overlay
3. **CalendarSyncWidget**: Dashboard-level sync health metrics

These components work together to give administrators clear visibility into calendar synchronization status, errors, and overall system health.

---

## User Flow

### Primary User Journey

1. **Admin views appointment list** → Sees SyncStatusBadge next to each appointment
2. **Admin hovers over badge** → Tooltip shows "Last synced: 2 minutes ago"
3. **Admin clicks badge** → SyncHistoryPopover opens with detailed sync log
4. **Admin reviews sync history** → Identifies failed sync with error message
5. **Admin clicks Google Calendar link** → Opens event in new tab to verify/fix
6. **Admin checks dashboard** → CalendarSyncWidget shows overall sync health
7. **Admin notices pending syncs** → Clicks "Sync All Now" button
8. **Widget refreshes** → Shows updated statistics after bulk sync

### Secondary Flows

- **Troubleshooting**: Admin sees red error badge → Opens history → Reads error message → Takes corrective action
- **Monitoring**: Widget auto-refreshes every 60 seconds → Admin passively monitors sync health
- **Setup verification**: Admin connects calendar → Widget appears → Confirms syncs are working

---

## Component 1: SyncStatusBadge

### Layout Structure

**Component Dimensions:**
- Height: 24px (compact, inline with appointment row)
- Width: Auto (icon + optional text)
- Padding: 4px horizontal, 2px vertical
- Border-radius: 6px (rounded-md)

**Visual Hierarchy:**
```
[Icon] [Optional Label]
 16px    12px text
```

**States & Variants:**

1. **Synced (Success)**
   - Icon: CheckCircle2 (Lucide)
   - Color: Success green (#10B981)
   - Background: Success green at 10% opacity (#10B98110)
   - Border: None
   - Label: "Synced" (optional, for verbose mode)

2. **Pending**
   - Icon: Clock (Lucide)
   - Color: Amber (#F59E0B)
   - Background: Amber at 10% opacity (#F59E0B10)
   - Border: None
   - Label: "Pending" (optional)

3. **Failed**
   - Icon: AlertCircle (Lucide)
   - Color: Error red (#EF4444)
   - Background: Error red at 10% opacity (#EF444410)
   - Border: None
   - Label: "Failed" (optional)

4. **Not Eligible**
   - No visual indicator rendered
   - Component returns null

**Spacing & Alignment:**
- Inline with appointment row text (vertical-align: middle)
- Margin-left: 8px (from appointment title)
- Icon and label centered vertically within badge

### Visual Design

**Typography:**
- Label text: 12px, medium weight (font-medium)
- Font family: System default (inherit)

**Colors:**
- Success: #10B981 (text), #10B98110 (background)
- Pending: #F59E0B (text), #F59E0B10 (background)
- Error: #EF4444 (text), #EF444410 (background)

**Shadows:**
- None (flat design for inline badges)

**Borders:**
- None (background color provides sufficient contrast)

### Interaction Design

**Hover State:**
- Cursor: pointer
- Background: Darken by 5% (e.g., #10B98120 for success)
- Shadow: shadow-sm (soft elevation)
- Transition: all 150ms ease
- Tooltip appears after 300ms delay

**Active State (Clicked):**
- Background: Darken by 10%
- Shadow: none (pressed effect)
- Opens SyncHistoryPopover immediately

**Focus State (Keyboard Navigation):**
- Ring: 2px solid primary color at 40% opacity
- Ring offset: 2px
- Outline: none (use ring instead)

**Tooltip Content:**
- Text: "Last synced: [relative time]" or "Sync failed: [error summary]"
- Background: Charcoal (#434E54)
- Text color: White
- Padding: 8px 12px
- Border-radius: 8px
- Max-width: 200px
- Font-size: 13px
- Shadow: shadow-lg (elevated)
- Arrow pointing to badge

### Responsive Behavior

**Mobile (<640px):**
- Icon only (no label text)
- Slightly larger touch target (32px min height)
- Tooltip appears on tap (closes on second tap or outside click)

**Tablet (640px-1024px):**
- Icon + label in verbose mode
- Standard 24px height

**Desktop (>1024px):**
- Full display with optional label
- Hover tooltip enabled

### Accessibility Requirements

**ARIA Attributes:**
- `role="button"` (clickable badge)
- `aria-label="Sync status: [status]. Last synced: [timestamp]. Click for details"`
- `aria-describedby="sync-tooltip-[id]"` (links to tooltip)
- `tabindex="0"` (keyboard accessible)

**Keyboard Navigation:**
- Tab: Focus badge
- Enter/Space: Open SyncHistoryPopover
- Escape: Close popover (when open)

**Screen Reader:**
- Announces status immediately: "Sync status: Synced. Last updated 2 minutes ago"
- Button role indicates interactivity

**Color Contrast:**
- Icon color meets WCAG AA (4.5:1) against white backgrounds
- Background colors provide secondary visual cue (not sole indicator)

### Integration Points

**Data Props:**
```typescript
interface SyncStatusBadgeProps {
  appointmentId: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'not_eligible';
  lastSyncAt?: string; // ISO timestamp
  errorMessage?: string;
  showLabel?: boolean; // Default: false (icon only)
  onOpenHistory?: () => void; // Callback when clicked
}
```

**Parent Components:**
- Admin appointment list rows
- Appointment detail cards
- Calendar view event items

**State Management:**
- Fetches sync status from `calendar_sync_log` table
- Real-time updates via Supabase subscription (optional)
- Loading state shows skeleton (pulsing gray circle)

---

## Component 2: SyncHistoryPopover

### Layout Structure

**Popover Dimensions:**
- Width: 400px (desktop), 100vw - 32px (mobile)
- Max-height: 500px
- Border-radius: 12px (rounded-lg)
- Shadow: shadow-lg (strong elevation)

**Internal Layout:**
```
┌─────────────────────────────────────┐
│ [Header]                      [×]   │ ← 48px height
├─────────────────────────────────────┤
│ [Sync History List]                 │ ← Scrollable area
│   [Entry 1: Created - Success]      │   (max 400px)
│   [Entry 2: Updated - Failed]       │
│   [Entry 3: Deleted - Success]      │
│   ...                                │
└─────────────────────────────────────┘
```

**Grid Structure:**
- Header: Fixed at top (sticky)
- List area: Scrollable (overflow-y: auto)
- Each entry: 80px min-height

### Visual Design

**Header Section:**
- Background: Cream (#F8EEE5)
- Border-bottom: 1px solid #E5E5E5
- Padding: 16px
- Typography: "Sync History" - 16px, semibold, charcoal

**Close Button:**
- Position: Absolute top-right (12px, 12px)
- Icon: X (Lucide), 20px
- Hover: Background gray-200, rounded-full
- Transition: 150ms ease

**List Entry Structure:**
```
[Icon] [Action Type]        [Timestamp]
       [Result Status]      [Link Icon]
       [Error Message if failed]
```

**Entry Layout:**
- Padding: 12px 16px
- Border-bottom: 1px solid #E5E5E5 (except last)
- Hover: Background #FFFBF7 (cream-light)

**Icons by Action:**
- Created: PlusCircle (16px, success green)
- Updated: RefreshCw (16px, blue #3B82F6)
- Deleted: Trash2 (16px, neutral gray #6B7280)

**Status Indicators:**
- Success: CheckCircle2 (14px, success green)
- Failed: XCircle (14px, error red)

**Typography:**
- Action type: 14px, semibold, charcoal
- Result status: 13px, medium, color-coded
- Timestamp: 12px, regular, text-muted (#9CA3AF)
- Error message: 13px, regular, error red, italic

**Colors:**
- Background: White (#FFFFFF)
- Dividers: #E5E5E5
- Hover background: #FFFBF7
- Success: #10B981
- Error: #EF4444
- Info (updated): #3B82F6
- Neutral: #6B7280

**Shadows:**
- Popover: shadow-lg (0 10px 25px rgba(0,0,0,0.15))

### Interaction Design

**Opening Animation:**
- Fade in: 200ms ease
- Scale: 0.95 → 1.0
- Origin: From badge position

**Closing Animation:**
- Fade out: 150ms ease
- Scale: 1.0 → 0.95

**Scroll Behavior:**
- Smooth scrolling
- Scrollbar: Thin (8px), auto-hide on desktop
- Momentum scrolling on mobile

**Google Calendar Link:**
- Icon: ExternalLink (Lucide), 14px
- Position: Right side of entry
- Hover: Primary color (#434E54), underline
- Opens in new tab: `target="_blank"` `rel="noopener noreferrer"`
- Only shown for created/updated events (not deleted)

**Entry Hover:**
- Background: #FFFBF7 (cream-light)
- Cursor: default (not clickable unless link)
- Transition: 150ms ease

**Outside Click:**
- Closes popover
- Smooth fade-out transition

### Responsive Behavior

**Mobile (<640px):**
- Width: calc(100vw - 32px)
- Max-height: 70vh
- Position: Bottom sheet style (slides up from bottom)
- Header sticky at top
- Full-width entries, stack timestamp below action

**Tablet (640px-1024px):**
- Width: 400px
- Position: Anchored to badge (floating popover)
- Standard desktop layout

**Desktop (>1024px):**
- Width: 400px
- Max-height: 500px
- Positioned below and to the right of badge
- Auto-adjusts if near viewport edge

### Accessibility Requirements

**ARIA Attributes:**
- `role="dialog"`
- `aria-label="Sync history for appointment"`
- `aria-modal="false"` (non-modal, can click outside)
- `aria-live="polite"` (announces new entries if real-time)

**Keyboard Navigation:**
- Tab: Cycle through Google Calendar links and close button
- Escape: Close popover
- Focus trap: No (allow background interaction)

**Screen Reader:**
- Announces each entry: "Created, success, 2 minutes ago"
- Error messages read in full
- Link announced: "Open in Google Calendar, link, opens in new tab"

**Focus Management:**
- On open: Focus close button
- On close: Return focus to badge that opened it

**Semantic HTML:**
- `<dialog>` element or `<div role="dialog">`
- List: `<ul>` with `<li>` items
- Links: Proper `<a>` tags with descriptive text

### States

**Loading State:**
- Show skeleton entries (3-4 pulsing gray rows)
- Header displays "Loading sync history..."
- No close button disabled

**Empty State:**
- Icon: FileQuestion (Lucide), 48px, gray
- Text: "No sync history available"
- Subtext: "This appointment hasn't been synced yet"
- Centered vertically in popover
- Typography: 14px regular, text-muted

**Error State:**
- Icon: AlertTriangle (Lucide), 48px, error red
- Text: "Failed to load sync history"
- Subtext: Error message or "Please try again later"
- Retry button: "Retry" (secondary button style)

### Integration Points

**Data Props:**
```typescript
interface SyncHistoryPopoverProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement; // Badge element for positioning
}
```

**Data Fetching:**
- Query: `calendar_sync_log` filtered by `appointment_id`
- Order: `created_at DESC` (newest first)
- Limit: 50 entries (paginate if more)
- Real-time: Optional Supabase subscription for live updates

**Parent Components:**
- Triggered by SyncStatusBadge click
- Portal rendered at document root (for z-index stacking)

---

## Component 3: CalendarSyncWidget

### Layout Structure

**Widget Dimensions:**
- Width: 100% of dashboard grid column (typically 400px-500px)
- Height: Auto (min 200px)
- Padding: 24px
- Border-radius: 16px (rounded-xl)

**Internal Layout:**
```
┌───────────────────────────────────────┐
│ [Icon] Calendar Sync Health           │ ← Header (40px)
│                                        │
│ [Connection Status Indicator]          │ ← Status (32px)
│                                        │
│ ┌──────────┬──────────┬──────────┐   │ ← Stats Grid
│ │ [✓ 45]   │ [⏱ 3]   │ [✗ 2]    │   │   (80px)
│ │ Synced   │ Pending  │ Failed   │   │
│ └──────────┴──────────┴──────────┘   │
│                                        │
│ Last sync: 2 minutes ago               │ ← Timestamp (24px)
│                                        │
│ [Sync All Now Button]                  │ ← Action (40px)
│ [View Calendar Settings →]             │ ← Link (24px)
└───────────────────────────────────────┘
```

**Grid Structure:**
- Header: Flex row (icon + title)
- Connection status: Full width bar
- Stats: 3-column grid (equal width)
- Footer: Stacked (timestamp → button → link)

### Visual Design

**Card Container:**
- Background: White (#FFFFFF)
- Border: 1px solid #E5E5E5
- Shadow: shadow-md (0 4px 12px rgba(0,0,0,0.1))
- Hover: shadow-lg (elevated)
- Transition: shadow 200ms ease

**Header Section:**
- Icon: Calendar (Lucide), 24px, primary charcoal
- Title: "Calendar Sync Health", 18px, semibold, charcoal
- Spacing: Icon 12px margin-right from title

**Connection Status:**
- Background: Success green at 10% opacity (#10B98110)
- Border-left: 4px solid success green (#10B981)
- Padding: 8px 12px
- Border-radius: 8px
- Typography: "Connected to Google Calendar", 14px, medium, success green
- Icon: CheckCircle2 (16px) inline before text

**Stats Grid:**
- 3 columns, equal width (1fr each)
- Gap: 12px
- Each stat card:
  - Background: Neutral-100 (#F9FAFB)
  - Border-radius: 8px
  - Padding: 12px
  - Text-align: center

**Stat Card Structure:**
```
[Icon + Number]  ← 24px, bold, color-coded
[Label]          ← 12px, regular, text-secondary
```

**Stat Colors:**
- Synced: Success green (#10B981)
- Pending: Amber (#F59E0B)
- Failed: Error red (#EF4444)

**Icons:**
- Synced: CheckCircle2
- Pending: Clock
- Failed: AlertCircle

**Last Sync Timestamp:**
- Typography: 13px, regular, text-muted (#9CA3AF)
- Icon: RefreshCw (14px) inline before text
- Format: "Last sync: [relative time]" (e.g., "2 minutes ago")

**Sync All Now Button:**
- Style: Primary button (DaisyUI btn-primary)
- Background: Charcoal (#434E54)
- Text: White, 14px, medium
- Padding: 10px 20px
- Border-radius: 8px
- Width: 100%
- Icon: RefreshCw (16px) before text
- Shadow: shadow-sm
- Hover: Background darker (#363F44), shadow-md
- Disabled: Gray-300 background, cursor not-allowed

**Settings Link:**
- Typography: 13px, medium, primary charcoal
- Icon: ArrowRight (14px) after text
- Hover: Underline, primary-light color
- Text-align: center
- Margin-top: 8px

### Interaction Design

**Auto-Refresh:**
- Interval: 60 seconds
- Loading indicator: Subtle pulsing dot next to timestamp
- No full widget reload (smooth data swap)

**Sync All Now Button:**
- Click: Triggers bulk sync API call
- Loading state:
  - Icon spins (rotation animation)
  - Text: "Syncing..."
  - Button disabled
- Success state:
  - Brief green flash (200ms)
  - Stats update immediately
- Error state:
  - Toast notification: "Sync failed. Please try again."
  - Button re-enabled

**Settings Link:**
- Click: Navigate to `/admin/settings?tab=calendar`
- Hover: Text color shifts to primary-light, underline appears

**Widget Hover:**
- Shadow: shadow-md → shadow-lg
- Subtle lift (transform: translateY(-2px))
- Transition: 200ms ease

**Stat Card Hover:**
- Background: Darken slightly (#F3F4F6)
- Cursor: default (not clickable)
- Optional: Tooltip with more details (e.g., "45 appointments synced")

### Responsive Behavior

**Mobile (<640px):**
- Full width card
- Stats grid: 3 columns → 1 column (stacked vertically)
- Padding: 16px (reduced from 24px)
- Font sizes: Reduce by 1-2px

**Tablet (640px-1024px):**
- Grid: 2 columns (stats: synced+pending in row 1, failed in row 2)
- Standard padding (24px)

**Desktop (>1024px):**
- Full 3-column stats grid
- Max-width: 500px (don't stretch too wide)

### Accessibility Requirements

**ARIA Attributes:**
- Widget: `role="region"` `aria-label="Calendar sync health widget"`
- Stats: `role="group"` for each stat card
- Button: `aria-label="Sync all appointments now"`
- Link: `aria-label="View calendar settings"`

**Keyboard Navigation:**
- Tab: Focus button → focus link
- Enter/Space: Activate button or link
- No keyboard traps

**Screen Reader:**
- Announces connection status: "Connected to Google Calendar"
- Reads stats in order: "45 synced, 3 pending, 2 failed"
- Timestamp: "Last sync: 2 minutes ago"
- Button state: "Sync all now button" or "Syncing, button disabled"

**Live Region:**
- Stats container: `aria-live="polite"` `aria-atomic="true"`
- Updates announced when stats change after sync

**Color Contrast:**
- All text meets WCAG AA (4.5:1)
- Icon colors meet contrast requirements
- Button has sufficient contrast in all states

### States

**Loading State (Initial Load):**
- Skeleton widget: Gray pulsing card
- Header visible, stats show "---"
- Button disabled

**Auto-Refresh Loading:**
- Small spinner (12px) next to timestamp
- No full widget skeleton (avoid jarring)
- Stats fade slightly (opacity 0.6) during refresh

**Error State:**
- Icon: AlertTriangle (Lucide), 48px, error red
- Text: "Failed to load sync data"
- Subtext: "Please refresh the page or check your connection"
- Retry button: "Retry"
- No stats displayed

**Disconnected State:**
- Connection status bar:
  - Background: Gray-100
  - Border-left: Gray-400
  - Text: "Calendar not connected"
  - Icon: XCircle (gray)
- Stats hidden
- Button replaced with: "Connect Calendar" (navigates to settings)

**No Calendar Connected (Hidden):**
- Widget does not render at all
- Controlled by `isCalendarConnected` prop

### Integration Points

**Data Props:**
```typescript
interface CalendarSyncWidgetProps {
  isCalendarConnected: boolean;
  onSyncAll: () => Promise<void>;
}
```

**Data Fetching:**
- Query: Aggregate stats from `calendar_sync_log`
  - Count `status = 'synced'`
  - Count `status = 'pending'`
  - Count `status = 'failed'`
- Last sync: Max `created_at` from successful syncs
- Auto-refresh: `useEffect` with 60s interval

**API Integration:**
- Sync All: POST `/api/admin/calendar/sync-all`
- Returns: Updated stats and timestamp

**Parent Components:**
- Admin dashboard (`/admin/dashboard`)
- Positioned in widgets grid (typically top-right)

---

## Cross-Component Integration

### Data Flow

1. **SyncStatusBadge** shows inline status for each appointment
2. Clicking badge opens **SyncHistoryPopover** with detailed log
3. **CalendarSyncWidget** aggregates all appointment sync data
4. Widget "Sync All Now" updates statuses across all badges

### Shared State

**Context or Zustand Store:**
```typescript
interface CalendarSyncState {
  syncStatuses: Record<string, SyncStatus>; // appointment_id → status
  lastSyncTimestamp: string;
  stats: { synced: number; pending: number; failed: number };
  isRefreshing: boolean;
}
```

**Real-time Updates:**
- Supabase subscription to `calendar_sync_log` table
- On new log entry:
  - Update badge status
  - Refresh widget stats
  - Add entry to popover history (if open)

### Consistent Styling

**All components share:**
- Color palette (success green, amber, error red, charcoal)
- Icon library (Lucide React)
- Border-radius (8px, 12px, 16px)
- Shadow system (shadow-sm, shadow-md, shadow-lg)
- Typography scale (12-18px range)
- Transition timing (150-200ms ease)

---

## Accessibility Summary

### WCAG 2.1 AA Compliance

**Perceivable:**
- Color is not the sole indicator (icons + text labels)
- All text meets 4.5:1 contrast ratio
- Icons have text alternatives (aria-label)

**Operable:**
- All components keyboard navigable
- Focus indicators visible (ring with offset)
- No keyboard traps
- Sufficient click/touch targets (min 24px)

**Understandable:**
- Clear, descriptive labels
- Consistent interaction patterns
- Error messages provide guidance
- Status changes announced to screen readers

**Robust:**
- Semantic HTML (`<button>`, `<a>`, `<dialog>`)
- ARIA attributes follow best practices
- Works with assistive technologies

---

## Assets Needed

### Icons (Lucide React)

**SyncStatusBadge:**
- CheckCircle2 (synced)
- Clock (pending)
- AlertCircle (failed)

**SyncHistoryPopover:**
- X (close)
- PlusCircle (created)
- RefreshCw (updated)
- Trash2 (deleted)
- CheckCircle2 (success)
- XCircle (failed)
- ExternalLink (Google Calendar link)
- FileQuestion (empty state)
- AlertTriangle (error state)

**CalendarSyncWidget:**
- Calendar (header)
- CheckCircle2 (connected, synced stat)
- Clock (pending stat)
- AlertCircle (failed stat)
- RefreshCw (sync button, timestamp)
- ArrowRight (settings link)
- XCircle (disconnected state)

### No Custom Graphics

All icons come from Lucide React. No custom illustrations or images needed.

---

## Implementation Notes

### DaisyUI Components to Use

**SyncStatusBadge:**
- `tooltip` (hover tooltip)
- `badge` (base styling, though custom styles preferred)

**SyncHistoryPopover:**
- `dropdown` or `modal` (base positioning logic)
- Custom popover implementation recommended for precise positioning

**CalendarSyncWidget:**
- `card` (widget container)
- `btn` and `btn-primary` (Sync All button)
- `stats` (for stats grid, optional)

### Tailwind Utilities

**Common Patterns:**
- Flexbox: `flex`, `items-center`, `justify-between`
- Grid: `grid`, `grid-cols-3`, `gap-3`
- Spacing: `p-6`, `px-4`, `py-2`, `space-x-2`
- Colors: `bg-[#F8EEE5]`, `text-[#434E54]`, custom color classes
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`
- Transitions: `transition-all`, `duration-200`, `ease-in-out`

### Performance Considerations

- **Virtualization**: Not needed (history limited to 50 entries)
- **Debouncing**: Auto-refresh uses 60s interval (no rapid polling)
- **Memoization**: Memoize stat calculations in widget
- **Lazy Loading**: Popover content loads only when opened

---

## Next Steps

Design specification completed and saved at `.claude/design/calendar-sync-status-components.md`.

**Next Step**: Use `@agent-daisyui-expert` to convert this design into a DaisyUI + Tailwind implementation plan for all three components:
1. `SyncStatusBadge.tsx`
2. `SyncHistoryPopover.tsx`
3. `CalendarSyncWidget.tsx`

The daisyui-expert will read this specification and create the actual React/TypeScript component code with proper DaisyUI integration and Tailwind styling.
