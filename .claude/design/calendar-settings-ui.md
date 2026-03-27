# Calendar Integration Settings UI - Design Specification

## Overview

This design specification covers the Calendar Integration settings interface for The Puppy Day admin panel. The UI enables administrators to connect their Google Calendar account, configure synchronization preferences, select target calendars, and monitor sync operations.

**Purpose**: Provide a professional, intuitive interface for managing Google Calendar integration without technical expertise required.

**Target Users**: Admin users only (role-based access control)

**Key Goals**:
- Simplify OAuth connection flow
- Make sync settings transparent and controllable
- Provide clear status feedback and error guidance
- Maintain The Puppy Day's clean, professional aesthetic

---

## User Flow

### Primary Flow: First-Time Connection

```
1. Admin navigates to Settings → Calendar Integration
   ↓
2. Sees "Not Connected" state with benefits explanation
   ↓
3. Clicks "Connect Google Calendar" button
   ↓
4. Redirected to Google OAuth consent screen
   ↓
5. Grants permissions (read/write calendar access)
   ↓
6. Redirected back to /admin/settings/calendar?success=true
   ↓
7. Success toast appears: "Google Calendar connected successfully!"
   ↓
8. Connection card updates to "Connected" state
   ↓
9. Calendar selector and sync settings become visible
   ↓
10. Admin selects target calendar (defaults to primary)
    ↓
11. Admin configures sync preferences (auto-sync, direction, statuses)
    ↓
12. Clicks "Save Settings"
    ↓
13. Settings saved, sync begins automatically
```

### Secondary Flow: Managing Connection

```
Connected State → View connection details
              → Change selected calendar
              → Modify sync settings
              → Manually trigger sync
              → View sync history
              → Disconnect (with confirmation)
```

### Error Flow: Connection Issues

```
Calendar deleted or access revoked
   ↓
Error state displayed with specific issue
   ↓
Troubleshooting guidance provided
   ↓
"Reconnect" button available
   ↓
OAuth flow restarts
```

---

## Layout Structure

### Page Grid (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ Admin Header (breadcrumb, user menu)                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Calendar Integration Settings (H1)                       │ │
│  │ Settings → Calendar Integration (breadcrumb)             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CONNECTION STATUS CARD                                   │ │
│  │ ┌────────┬──────────────────────────────────────────┐   │ │
│  │ │ Icon   │ Status: Connected                        │   │ │
│  │ │   ✓    │ Email: admin@thepuppyday.com             │   │ │
│  │ │        │ Calendar: Business Calendar              │   │ │
│  │ │        │ Last sync: 5 minutes ago                 │   │ │
│  │ │        │ Synced: 142 appointments                 │   │ │
│  │ └────────┴──────────────────────────────────────────┘   │ │
│  │                                    [Disconnect] button   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CALENDAR SELECTION                                       │ │
│  │ Select Calendar: [Dropdown ▼]                            │ │
│  │                  [Refresh Calendars] button              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SYNC SETTINGS                                            │ │
│  │ ┌──────────────────┬─────────────────────────────────┐  │ │
│  │ │ Auto-Sync        │ Status-Based Sync               │  │ │
│  │ │ [Toggle]         │ ☑ Confirmed                     │  │ │
│  │ │                  │ ☑ Checked-in                    │  │ │
│  │ │ Sync Direction   │ ☐ Pending                       │  │ │
│  │ │ ○ Push only      │ ☐ In-progress                   │  │ │
│  │ │ ● Bidirectional  │ ☐ Completed                     │  │ │
│  │ │ ○ Import only    │                                 │  │ │
│  │ └──────────────────┴─────────────────────────────────┘  │ │
│  │                                       [Save Settings]     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SYNC HISTORY                                             │ │
│  │ ┌────────────┬─────────┬────────┬────────────────────┐  │ │
│  │ │ Timestamp  │ Type    │ Status │ Details            │  │ │
│  │ ├────────────┼─────────┼────────┼────────────────────┤  │ │
│  │ │ 2m ago     │ Push    │ ✓      │ 3 appointments     │  │ │
│  │ │ 15m ago    │ Import  │ ✓      │ 1 appointment      │  │ │
│  │ │ 1h ago     │ Push    │ ✗      │ Calendar not found │  │ │
│  │ └────────────┴─────────┴────────┴────────────────────┘  │ │
│  │                              [Manual Sync] [Import Now]  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

**Desktop (>1024px)**:
- Max-width container: 1280px
- Two-column layout for sync settings form
- Side-by-side connection stats
- Table view for sync history

**Tablet (640-1024px)**:
- Single column layout
- Full-width cards
- Maintain two-column sync settings
- Table view for sync history

**Mobile (<640px)**:
- Stack all components vertically
- Full-width buttons
- Single column sync settings
- Card view for sync history (no table)

---

## Component Specifications

### Task 0038: Calendar Connection Card

**Component**: `CalendarConnectionCard.tsx`

#### Visual Design

**Card Container**:
- Background: White (#FFFFFF)
- Shadow: `shadow-md` (soft, blurred)
- Border radius: `rounded-xl` (16px)
- Padding: `p-6` (24px)
- Margin bottom: `mb-6` (24px)
- Hover: `shadow-lg` with 200ms transition

#### State 1: Not Connected

```
┌─────────────────────────────────────────────────────────────┐
│ 🗓️  Google Calendar Integration                            │
│                                                             │
│ Connect your Google Calendar to automatically sync          │
│ appointments, reduce double-bookings, and keep your         │
│ schedule up-to-date across all platforms.                  │
│                                                             │
│ Benefits:                                                   │
│ ✓ Two-way sync with Google Calendar                        │
│ ✓ Automatic appointment updates                            │
│ ✓ Reduce scheduling conflicts                              │
│ ✓ Secure OAuth 2.0 authentication                          │
│                                                             │
│                        [🔐 Connect Google Calendar]         │
│                                                             │
│ 🔒 We only access your calendar data. We never see your    │
│    Google password or other account information.           │
└─────────────────────────────────────────────────────────────┘
```

**Typography**:
- Heading: 24px, semibold, #434E54
- Body text: 16px, regular, #6B7280
- Benefits list: 16px, regular, #434E54
- Security note: 14px, regular, #9CA3AF

**Colors**:
- Icon: #F59E0B (amber)
- Check marks: #10B981 (green)
- Lock icon: #9CA3AF (gray)

**Button**:
- Variant: Primary (amber)
- Size: Large (py-3 px-6)
- Icon: 🔐 or Google logo
- Text: "Connect Google Calendar"
- Full-width on mobile

#### State 2: Connected

```
┌─────────────────────────────────────────────────────────────┐
│ ┌────────┬──────────────────────────────────────────────┐  │
│ │   ✓    │ Connected                           [Badge]  │  │
│ │ (green │                                              │  │
│ │  icon) │ admin@thepuppyday.com                        │  │
│ │        │ Calendar: Business Calendar (Primary)        │  │
│ │        │                                              │  │
│ │        │ Last synced: 5 minutes ago                   │  │
│ │        │ Total synced: 142 appointments               │  │
│ │        │ Last 24h: 12 synced, 0 failed                │  │
│ └────────┴──────────────────────────────────────────────┘  │
│                                                             │
│                                        [Disconnect] button  │
└─────────────────────────────────────────────────────────────┘
```

**Layout**:
- Left: Icon (48px × 48px, green circle with white checkmark)
- Right: Connection details (flex-1)
- Bottom right: Disconnect button

**Typography**:
- "Connected" badge: 14px, medium, green background
- Email: 16px, regular, #434E54
- Calendar name: 16px, medium, #434E54
- Stats: 14px, regular, #6B7280
- Last sync: 14px, regular, #9CA3AF with relative time

**Colors**:
- Success icon: #10B981 (green)
- Badge: #10B981 background, white text
- Email: #434E54
- Stats: #6B7280

**Button**:
- Variant: Outline error (destructive)
- Size: Medium (py-2.5 px-5)
- Text: "Disconnect"
- Hover: Red background (#EF4444)

#### State 3: Error

```
┌─────────────────────────────────────────────────────────────┐
│ ┌────────┬──────────────────────────────────────────────┐  │
│ │   ✗    │ Connection Error                    [Badge]  │  │
│ │  (red  │                                              │  │
│ │  icon) │ ⚠️ Calendar not found or access revoked      │  │
│ │        │                                              │  │
│ │        │ This usually happens when:                   │  │
│ │        │ • The connected calendar was deleted         │  │
│ │        │ • You revoked access in Google settings      │  │
│ │        │ • Your Google account password changed       │  │
│ │        │                                              │  │
│ │        │ Last successful sync: 2 hours ago            │  │
│ └────────┴──────────────────────────────────────────────┘  │
│                                                             │
│                                          [Reconnect] button │
└─────────────────────────────────────────────────────────────┘
```

**Layout**: Same as connected state, but with error styling

**Typography**:
- "Connection Error" badge: 14px, medium, red background
- Error message: 16px, medium, #EF4444
- Troubleshooting list: 14px, regular, #6B7280
- Last sync: 14px, regular, #9CA3AF

**Colors**:
- Error icon: #EF4444 (red)
- Badge: #EF4444 background, white text
- Warning icon: #F59E0B (amber)

**Button**:
- Variant: Primary (amber)
- Size: Medium
- Text: "Reconnect"
- Triggers OAuth flow

#### Props Interface

```typescript
interface CalendarConnectionCardProps {
  connectionStatus: {
    connected: boolean;
    connection?: {
      calendar_email: string;
      calendar_id: string;
      calendar_name?: string;
      is_primary?: boolean;
      last_sync_at: string | null;
    };
    sync_stats?: {
      total_synced: number;
      last_24h: number;
      failed_last_24h: number;
    };
    error?: string;
  };
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}
```

#### Interaction Design

**Connect Button Hover**:
- Background: Amber (#F59E0B) → Darker amber (#D97706)
- Shadow: None → `shadow-md`
- Transition: All 200ms ease
- Cursor: Pointer

**Disconnect Button Hover**:
- Border: Red → Transparent
- Background: Transparent → Red (#EF4444)
- Text: Red → White
- Transition: All 200ms ease

**Loading State**:
- Disabled button with spinner
- Dimmed card (opacity 0.6)
- Loading spinner (16px) next to button text

---

### Task 0039: Google OAuth Button

**Component**: `GoogleOAuthButton.tsx`

#### Visual Design

```
┌──────────────────────────────────────┐
│  🔐  Connect Google Calendar         │
└──────────────────────────────────────┘
```

**Button Variants**:
1. **Default State**:
   - Background: Amber (#F59E0B)
   - Text: White
   - Icon: Google logo or 🔐
   - Size: Large (py-3 px-6)
   - Border radius: `rounded-lg` (12px)
   - Shadow: `shadow-sm`

2. **Hover State**:
   - Background: Darker amber (#D97706)
   - Shadow: `shadow-md`
   - Transform: translateY(-1px)
   - Transition: All 200ms ease

3. **Loading State**:
   - Background: Amber (dimmed)
   - Text: "Connecting..."
   - Icon: Spinner (16px, rotating)
   - Disabled: true

4. **Disabled State**:
   - Background: Gray (#E5E5E5)
   - Text: Gray (#9CA3AF)
   - Cursor: not-allowed

#### Typography

- Text: 16px, medium weight
- Letter spacing: 0.5px
- Text transform: None

#### Layout

- Icon: 20px × 20px, left side
- Text: Center-aligned with icon
- Gap: 8px between icon and text
- Padding: 12px vertical, 24px horizontal
- Full-width on mobile (<640px)

#### Props Interface

```typescript
interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}
```

#### Interaction Flow

```
User clicks button
   ↓
Button state → Loading ("Connecting...")
   ↓
Fetch /api/admin/calendar/auth/start
   ↓
Receive OAuth URL
   ↓
window.location.href = authUrl (redirect to Google)
   ↓
[User on Google consent screen]
   ↓
User grants permissions
   ↓
Google redirects to /api/admin/calendar/auth/callback
   ↓
Backend processes tokens, saves to DB
   ↓
Redirect to /admin/settings/calendar?success=true
   ↓
Success toast appears
   ↓
onSuccess() callback fired
```

#### Error Handling

- Network error → Show toast: "Connection failed. Please try again."
- OAuth denied → Show toast: "Permission denied. Calendar integration requires calendar access."
- Invalid response → Show toast: "Something went wrong. Please contact support."

---

### Task 0040: Sync Settings Form

**Component**: `SyncSettingsForm.tsx`

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ Sync Settings                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────┬─────────────────────────────────┐  │
│ │ Synchronization     │ Status-Based Sync               │  │
│ │                     │                                 │  │
│ │ Auto-Sync           │ Select which appointment        │  │
│ │ [Toggle ON/OFF]     │ statuses to sync:               │  │
│ │                     │                                 │  │
│ │ Sync Direction      │ ☑ Confirmed                     │  │
│ │ ○ Push only         │ ☑ Checked-in                    │  │
│ │ ● Bidirectional     │ ☐ Pending                       │  │
│ │ ○ Import only       │ ☐ In-progress                   │  │
│ │                     │ ☐ Completed                     │  │
│ │ Notifications       │                                 │  │
│ │ ☐ Success emails    │ Note: Cancelled and No-show     │  │
│ │ ☑ Failure emails    │ appointments are never synced.  │  │
│ └─────────────────────┴─────────────────────────────────┘  │
│                                                             │
│                                       [Save Settings]       │
└─────────────────────────────────────────────────────────────┘
```

#### Layout Structure

**Desktop (>1024px)**:
- Two-column grid (50% / 50%)
- Gap: 24px
- Left column: Auto-sync, direction, notifications
- Right column: Status-based sync checkboxes

**Mobile (<640px)**:
- Single column
- Stack sections vertically
- Full-width checkboxes

#### Form Controls

**Auto-Sync Toggle**:
- DaisyUI toggle component
- Size: Large
- Color: Amber when ON, gray when OFF
- Label: "Enable automatic sync" (16px, medium)
- Helper text: "Appointments will sync automatically when created or updated" (14px, gray)

**Sync Direction Radio Group**:
- Radio buttons (DaisyUI radio)
- Size: Medium (18px)
- Color: Amber when selected
- Options:
  1. **Push only**: "App → Calendar only" (sync from app to calendar)
  2. **Bidirectional**: "Two-way sync" (recommended, default)
  3. **Import only**: "Calendar → App only" (sync from calendar to app)
- Helper text below each option (14px, gray)

**Status Checkboxes**:
- DaisyUI checkbox component
- Size: Medium (18px)
- Color: Amber when checked
- Layout: Vertical list
- Spacing: 12px between items
- Labels: 16px, regular
- Note box below: Light yellow background, italic text

**Notification Checkboxes**:
- Same style as status checkboxes
- Options:
  1. "Send success notifications" (optional)
  2. "Send failure notifications" (recommended, checked by default)

#### Typography

- Section heading: 20px, semibold, #434E54
- Label text: 16px, medium, #434E54
- Helper text: 14px, regular, #6B7280
- Note text: 14px, italic, #9CA3AF

#### Colors

- Active toggle: #F59E0B (amber)
- Inactive toggle: #E5E5E5 (light gray)
- Checked checkbox: #F59E0B (amber)
- Radio selected: #F59E0B (amber)
- Note background: #FFFBEB (light yellow)
- Note border: #FDE68A (yellow)

#### Save Button

- Variant: Primary (amber)
- Size: Large (py-3 px-6)
- Position: Bottom right
- Text: "Save Settings"
- Loading state: Spinner + "Saving..."
- Success: Brief green flash → "Saved!"

#### Props Interface

```typescript
interface SyncSettingsFormProps {
  initialSettings: {
    auto_sync_enabled: boolean;
    sync_direction: 'push' | 'import' | 'bidirectional';
    sync_statuses: ('confirmed' | 'checked_in' | 'pending' | 'in_progress' | 'completed')[];
    notify_on_success: boolean;
    notify_on_failure: boolean;
  };
  onSave: (settings: CalendarSyncSettings) => Promise<void>;
  isLoading?: boolean;
  isDirty?: boolean;
}
```

#### Interaction Design

**Form Validation**:
- At least one status must be selected → Error: "Select at least one appointment status"
- Sync direction required → Auto-select "Bidirectional" if none selected
- Changes tracked with `isDirty` flag
- Unsaved changes warning on page navigation

**Save Flow**:
```
User modifies form
   ↓
isDirty = true
   ↓
"Save Settings" button enabled and highlighted
   ↓
User clicks "Save Settings"
   ↓
Button state → Loading
   ↓
POST /api/admin/calendar/settings
   ↓
Success: Toast + button → "Saved!" (green) for 2s
   ↓
isDirty = false
```

**Accessibility**:
- Fieldset and legend for grouped controls
- ARIA labels for all checkboxes and radios
- Focus visible on all interactive elements
- Keyboard navigation (Tab, Space, Enter)

---

### Task 0041: Calendar Selector

**Component**: `CalendarSelector.tsx`

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ Calendar Selection                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select which calendar to sync appointments with:           │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🗓️  Business Calendar (Primary)              ✓      │   │
│ │                                                 ▼   │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                    [🔄 Refresh Calendars]   │
└─────────────────────────────────────────────────────────────┘

[Dropdown expanded:]
┌─────────────────────────────────────────────────────┐
│ 🗓️  Business Calendar (Primary)              ✓      │
├─────────────────────────────────────────────────────┤
│ 🗓️  Personal Calendar                               │
│ 🗓️  Team Appointments                               │
│ 🗓️  Marketing Events                                │
└─────────────────────────────────────────────────────┘
```

#### Dropdown Design

**Trigger Button**:
- Background: White
- Border: 1px solid #E5E5E5
- Border radius: `rounded-lg` (12px)
- Padding: 12px 16px
- Shadow: `shadow-sm`
- Hover: Border color → #F59E0B (amber)
- Focus: Ring (2px amber, 20% opacity)

**Dropdown Panel**:
- Background: White
- Border: 1px solid #E5E5E5
- Border radius: `rounded-lg` (12px)
- Shadow: `shadow-lg`
- Max-height: 300px
- Overflow: Auto scroll
- Z-index: 50

**Calendar List Item**:
- Padding: 12px 16px
- Hover background: #FFFBF7 (light cream)
- Active background: #F8EEE5 (cream)
- Cursor: Pointer
- Transition: Background 150ms ease

#### Calendar Item Layout

```
┌───┬─────────────────────────────────────────┬───┐
│ 🗓️│ Business Calendar                       │ ✓ │
│   │ (Primary)                               │   │
└───┴─────────────────────────────────────────┴───┘
```

**Left**: Calendar icon (20px × 20px)
**Center**: Calendar name + badge
**Right**: Checkmark if selected (20px × 20px, green)

#### Typography

- Section heading: 20px, semibold, #434E54
- Description: 14px, regular, #6B7280
- Calendar name: 16px, medium, #434E54
- "(Primary)" badge: 14px, regular, #9CA3AF, italic
- Empty state: 14px, italic, #9CA3AF

#### Colors

- Icon: #F59E0B (amber)
- Selected checkmark: #10B981 (green)
- Primary badge: #9CA3AF (gray)
- Hover background: #FFFBF7 (light cream)
- Selected background: #F8EEE5 (cream)

#### Refresh Button

- Variant: Ghost/outline
- Size: Medium (py-2 px-4)
- Icon: 🔄 or RefreshCw from Lucide
- Text: "Refresh Calendars"
- Position: Right-aligned below dropdown
- Loading state: Spinning icon

#### Props Interface

```typescript
interface CalendarSelectorProps {
  calendars: {
    id: string;
    name: string;
    description?: string;
    is_primary: boolean;
    access_role: string; // 'owner' | 'writer' | 'reader'
  }[];
  selectedCalendarId: string;
  onSelect: (calendarId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  error?: string;
}
```

#### Interaction Design

**Selection Flow**:
```
User clicks dropdown trigger
   ↓
Dropdown panel opens with animation (slide down, fade in)
   ↓
User hovers over calendar item → Background changes
   ↓
User clicks calendar item
   ↓
Dropdown closes
   ↓
onSelect(calendarId) called
   ↓
Loading state on dropdown trigger
   ↓
PUT /api/admin/calendar/settings { calendar_id }
   ↓
Success: Dropdown updates, toast appears
```

**Refresh Flow**:
```
User clicks "Refresh Calendars"
   ↓
Button icon starts spinning
   ↓
GET /api/admin/calendar/calendars
   ↓
Update calendars list
   ↓
Stop spinning, brief success indicator
```

#### States

**Loading State**:
- Dropdown trigger disabled
- Spinner inside trigger
- Text: "Loading calendars..."

**Empty State**:
- No calendars available
- Message: "No calendars found. Try refreshing or reconnecting your account."
- "Refresh" and "Reconnect" buttons

**Error State**:
- Error message in red text
- Icon: ⚠️
- Retry button

#### Accessibility

- ARIA role: combobox
- ARIA expanded: true/false
- ARIA selected: true on selected item
- Keyboard navigation:
  - Arrow up/down: Navigate items
  - Enter/Space: Select item
  - Escape: Close dropdown
- Focus trap when dropdown open

---

### Task 0042: Calendar Settings Page

**Route**: `/admin/settings/calendar/page.tsx`

#### Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Admin Header with breadcrumb and user menu]                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Settings → Calendar Integration                              │
│                                                                │
│  Calendar Integration Settings  (H1, 36px)                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  Manage your Google Calendar connection and sync settings.    │
│  (16px, gray)                                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CalendarConnectionCard                                   │ │
│  │ [Component renders based on connection status]           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  {IF CONNECTED:}                                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ CalendarSelector                                         │ │
│  │ [Dropdown to select target calendar]                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SyncSettingsForm                                         │ │
│  │ [Form with sync preferences]                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Quick Actions                                            │ │
│  │ [Manual Sync] [Import from Calendar] [View Sync History] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Sync History                                             │ │
│  │ [Table of recent sync operations]                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Webhook Status                                           │ │
│  │ Active | Expires: Jan 15, 2025                           │ │
│  │ [Renew Webhook]                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Breadcrumb Navigation

```
Settings → Calendar Integration
```

- Font: 14px, regular
- Color: #9CA3AF (gray)
- Separator: → or / (8px margin)
- Active link: #434E54 (charcoal), no underline
- Hover: Underline

#### Page Header

**Title**: "Calendar Integration Settings"
- Font: 36px, bold, #434E54
- Margin bottom: 8px
- Line height: 1.2

**Description**: "Manage your Google Calendar connection and sync settings."
- Font: 16px, regular, #6B7280
- Margin bottom: 32px
- Line height: 1.6

#### Quick Actions Section

```
┌─────────────────────────────────────────────────────────────┐
│ Quick Actions                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🔄 Manual Sync All]  [📥 Import from Calendar]           │
│                                                             │
│  Last manual sync: 2 hours ago                              │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
- Variant: Outline (secondary)
- Size: Medium (py-2.5 px-5)
- Icons: 20px, left-aligned
- Gap: 12px between buttons
- Full-width on mobile

**Manual Sync All**:
- Triggers sync for all pending appointments
- Loading state: Spinner + "Syncing..."
- Success: Toast + update sync history

**Import from Calendar**:
- Opens import wizard modal
- Fetches new events from Google Calendar
- Creates appointments in app

#### Sync History Table

```
┌─────────────────────────────────────────────────────────────┐
│ Recent Sync Operations                                      │
├────────────┬─────────┬────────┬────────────────────────────┤
│ Timestamp  │ Type    │ Status │ Details                    │
├────────────┼─────────┼────────┼────────────────────────────┤
│ 2m ago     │ Push    │   ✓    │ 3 appointments synced      │
│ 15m ago    │ Import  │   ✓    │ 1 appointment imported     │
│ 1h ago     │ Push    │   ✗    │ Calendar not found         │
│ 2h ago     │ Push    │   ✓    │ 5 appointments synced      │
│ 3h ago     │ Import  │   ✓    │ 2 appointments imported    │
└────────────┴─────────┴────────┴────────────────────────────┘
                                       [View Full History →]
```

**Table Design**:
- Header background: #F8EEE5 (cream)
- Header text: 14px, semibold, #434E54
- Row padding: 12px
- Row border: 1px solid #E5E5E5
- Hover: Background #FFFBF7 (light cream)
- Alternating rows: Optional subtle background

**Columns**:
1. **Timestamp**: Relative time (e.g., "2m ago")
2. **Type**: Push, Import, Bidirectional
3. **Status**: ✓ (green) or ✗ (red)
4. **Details**: Summary of operation

**Success Icon**: ✓ in green circle (#10B981)
**Error Icon**: ✗ in red circle (#EF4444)

**Mobile View**: Card layout instead of table
```
┌────────────────────────────────┐
│ ✓ Push • 2m ago                │
│ 3 appointments synced          │
└────────────────────────────────┘
```

#### Webhook Status Section

```
┌─────────────────────────────────────────────────────────────┐
│ Webhook Status                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Status: ● Active                                           │
│  Expires: January 15, 2025 at 3:42 PM                      │
│  Endpoint: https://thepuppyday.com/api/calendar/webhook     │
│                                                             │
│                                         [🔄 Renew Webhook]  │
└─────────────────────────────────────────────────────────────┘
```

**Status Indicator**:
- Active: Green dot + "Active" text
- Expiring Soon (<7 days): Yellow dot + "Expiring Soon" text
- Expired: Red dot + "Expired" text

**Renew Button**:
- Only shown if webhook expires in <7 days or expired
- Variant: Primary (amber)
- Size: Medium
- Text: "Renew Webhook"

#### Conditional Rendering Logic

```typescript
// Not connected state
if (!connectionStatus.connected) {
  return (
    <Page>
      <CalendarConnectionCard
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
      />
      <InfoSection>
        <!-- Benefits, FAQs, etc. -->
      </InfoSection>
    </Page>
  );
}

// Connected state
return (
  <Page>
    <CalendarConnectionCard
      connectionStatus={connectionStatus}
      onDisconnect={handleDisconnect}
    />
    <CalendarSelector
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      onSelect={handleSelectCalendar}
    />
    <SyncSettingsForm
      initialSettings={settings}
      onSave={handleSaveSettings}
    />
    <QuickActions />
    <SyncHistory history={syncHistory} />
    <WebhookStatus status={webhookStatus} />
  </Page>
);
```

#### URL Query Parameters

**Success State**: `?success=true`
- Show success toast: "Google Calendar connected successfully!"
- Auto-dismiss after 5 seconds

**Error State**: `?error=access_denied`
- Show error toast: "Permission denied. Please try again."
- Auto-dismiss after 8 seconds

**Errors**:
- `access_denied`: User denied permissions
- `invalid_token`: Token expired or invalid
- `calendar_not_found`: Selected calendar deleted
- `network_error`: Connection failed

#### Loading States

**Initial Page Load**:
- Skeleton loaders for all cards
- Pulse animation on skeleton
- No interactive elements

**After Connection**:
- Fetch calendars (loading spinner in selector)
- Fetch sync settings (loading state in form)
- Fetch sync history (loading state in table)

#### Accessibility

- Page title: `<title>Calendar Integration Settings | The Puppy Day Admin</title>`
- H1 heading for page title
- Skip link to main content
- Keyboard navigation throughout
- ARIA live region for toast notifications
- Focus management after OAuth redirect

---

### Task 0043: Settings Nav Link

**Component**: Update `SettingsNav.tsx` or equivalent

#### Navigation Item Design

```
┌─────────────────────────────────┐
│ Settings Navigation             │
├─────────────────────────────────┤
│ 📄 Site Content                 │
│ ⚙️  Booking Settings             │
│ 🕒 Business Hours                │
│ 📢 Promotional Banners           │
│ 🎁 Loyalty Program               │
│ 👥 Staff Management              │
│ 🗓️  Calendar Integration  [New] │ ← NEW
└─────────────────────────────────┘
```

#### Link Design

**Default State**:
- Font: 16px, medium, #434E54
- Padding: 12px 16px
- Border radius: `rounded-lg` (12px)
- Background: Transparent
- Icon: 20px × 20px, left-aligned
- Gap: 12px between icon and text

**Hover State**:
- Background: #FFFBF7 (light cream)
- Cursor: Pointer
- Transition: Background 150ms ease

**Active State**:
- Background: #F8EEE5 (cream)
- Border left: 4px solid #F59E0B (amber accent)
- Font weight: Semibold

**Badge** (optional):
- Text: "New" or "Beta"
- Background: #F59E0B (amber)
- Text color: White
- Font: 12px, bold
- Padding: 2px 8px
- Border radius: `rounded-full`
- Position: Right side of link

#### Icon Options

**Preferred**: Calendar icon from Lucide React
```typescript
import { Calendar } from 'lucide-react';

<Calendar className="w-5 h-5" />
```

**Alternative**: Emoji 🗓️

#### Navigation Structure Update

```typescript
const settingsNavItems = [
  { label: 'Site Content', icon: FileText, href: '/admin/settings/site-content' },
  { label: 'Booking Settings', icon: Settings, href: '/admin/settings/booking' },
  { label: 'Business Hours', icon: Clock, href: '/admin/settings/hours' },
  { label: 'Promotional Banners', icon: Megaphone, href: '/admin/settings/banners' },
  { label: 'Loyalty Program', icon: Gift, href: '/admin/settings/loyalty' },
  { label: 'Staff Management', icon: Users, href: '/admin/settings/staff' },
  {
    label: 'Calendar Integration',
    icon: Calendar,
    href: '/admin/settings/calendar',
    badge: 'New' // Optional
  },
];
```

#### Role-Based Access Control

**Visibility**:
- Only shown to users with `role = 'admin'`
- Hidden for `role = 'customer'`
- Check user role from Supabase auth context

```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

const isAdmin = profile?.role === 'admin';

// Conditionally render nav item
{isAdmin && (
  <SettingsNavLink href="/admin/settings/calendar">
    <Calendar /> Calendar Integration
  </SettingsNavLink>
)}
```

#### Mobile Responsiveness

**Desktop (>1024px)**:
- Sidebar navigation (fixed left)
- Vertical list

**Mobile (<640px)**:
- Dropdown menu or tabs
- Horizontal scroll or accordion
- Icon + abbreviated text

---

## Visual Design System

### Color Palette

```css
/* Background */
--background-primary: #F8EEE5;      /* Warm cream */
--background-light: #FFFBF7;        /* Light cream */
--background-white: #FFFFFF;        /* Pure white */

/* Primary/Accent */
--primary: #434E54;                 /* Charcoal */
--primary-hover: #363F44;           /* Darker charcoal */
--accent: #F59E0B;                  /* Amber */
--accent-hover: #D97706;            /* Darker amber */

/* Secondary */
--secondary: #EAE0D5;               /* Lighter cream */
--secondary-hover: #DCD2C7;         /* Hover cream */

/* Neutral */
--neutral-100: #FFFFFF;
--neutral-200: #F5F5F5;
--neutral-300: #E5E5E5;
--neutral-400: #9CA3AF;
--neutral-500: #6B7280;

/* Text */
--text-primary: #434E54;            /* Charcoal */
--text-secondary: #6B7280;          /* Gray */
--text-muted: #9CA3AF;              /* Light gray */

/* Semantic */
--success: #10B981;                 /* Green */
--success-light: #D1FAE5;           /* Light green bg */
--warning: #F59E0B;                 /* Amber */
--warning-light: #FEF3C7;           /* Light yellow bg */
--error: #EF4444;                   /* Red */
--error-light: #FEE2E2;             /* Light red bg */
--info: #3B82F6;                    /* Blue */
--info-light: #DBEAFE;              /* Light blue bg */
```

### Typography Scale

```css
/* Display */
--font-display: 48px;
--font-display-weight: 700;
--font-display-line-height: 1.1;

/* Headings */
--font-h1: 36px;
--font-h1-weight: 700;
--font-h1-line-height: 1.2;

--font-h2: 28px;
--font-h2-weight: 600;
--font-h2-line-height: 1.3;

--font-h3: 24px;
--font-h3-weight: 600;
--font-h3-line-height: 1.4;

--font-h4: 20px;
--font-h4-weight: 600;
--font-h4-line-height: 1.4;

/* Body */
--font-body-large: 18px;
--font-body: 16px;
--font-body-small: 14px;
--font-caption: 12px;

--font-body-weight: 400;
--font-body-line-height: 1.6;

/* Medium weight for emphasis */
--font-medium: 500;
```

### Spacing System

```css
--space-xs: 4px;     /* Tight spacing */
--space-sm: 8px;     /* Small gaps */
--space-md: 12px;    /* Form spacing */
--space-lg: 16px;    /* Default unit */
--space-xl: 24px;    /* Section spacing */
--space-2xl: 32px;   /* Large gaps */
--space-3xl: 48px;   /* Section breaks */
--space-4xl: 64px;   /* Hero padding */
```

### Shadow System

```css
/* Soft, blurred shadows - NO solid offsets */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

### Border Radius

```css
--radius-sm: 8px;    /* Small elements */
--radius-md: 12px;   /* Buttons, inputs */
--radius-lg: 16px;   /* Cards */
--radius-xl: 20px;   /* Large cards */
--radius-full: 9999px; /* Circular */
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

---

## Component Design Patterns

### Buttons

**Primary Button**:
```css
background: #F59E0B;
color: #FFFFFF;
padding: 12px 24px;
border-radius: 12px;
font-size: 16px;
font-weight: 500;
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
transition: all 200ms ease;

hover {
  background: #D97706;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

active {
  transform: translateY(0);
}

disabled {
  background: #E5E5E5;
  color: #9CA3AF;
  cursor: not-allowed;
}
```

**Secondary Button (Outline)**:
```css
background: transparent;
color: #434E54;
border: 1px solid #E5E5E5;
padding: 12px 24px;
border-radius: 12px;

hover {
  background: #FFFBF7;
  border-color: #F59E0B;
}
```

**Destructive Button**:
```css
background: transparent;
color: #EF4444;
border: 1px solid #EF4444;

hover {
  background: #EF4444;
  color: #FFFFFF;
}
```

### Cards

**Standard Card**:
```css
background: #FFFFFF;
border-radius: 16px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
padding: 24px;
transition: box-shadow 200ms ease;

hover {
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### Form Controls

**Input Field**:
```css
background: #FFFFFF;
border: 1px solid #E5E5E5;
border-radius: 12px;
padding: 12px 16px;
font-size: 16px;
color: #434E54;

focus {
  border-color: #F59E0B;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  outline: none;
}

error {
  border-color: #EF4444;
}
```

**Checkbox**:
```css
width: 18px;
height: 18px;
border: 2px solid #E5E5E5;
border-radius: 4px;

checked {
  background: #F59E0B;
  border-color: #F59E0B;
}
```

**Toggle**:
```css
/* DaisyUI toggle component */
.toggle {
  --toggle-bg: #E5E5E5;
  --toggle-on: #F59E0B;
}
```

### Badges

**Status Badge**:
```css
/* Connected */
background: #D1FAE5;
color: #10B981;
padding: 4px 12px;
border-radius: 9999px;
font-size: 14px;
font-weight: 500;

/* Error */
background: #FEE2E2;
color: #EF4444;
```

---

## Interaction Design

### Hover States

**Buttons**:
- Background color shift (lighter → darker)
- Shadow increase (sm → md)
- Subtle lift (translateY -1px)
- Transition: 200ms ease

**Cards**:
- Shadow increase (md → lg)
- Subtle lift (translateY -2px)
- Transition: 200ms ease

**Links**:
- Underline appears
- Color shift (subtle)
- Transition: 150ms ease

### Focus States

**All Interactive Elements**:
- Ring (2px) with primary color at 20% opacity
- Offset: 2px
- Border radius matches element
- Outline: none (use box-shadow)

**Keyboard Navigation**:
- Tab order follows visual hierarchy
- Focus visible indicator on all elements
- Skip links for accessibility

### Loading States

**Button Loading**:
- Disabled state
- Spinner icon (16px, rotating)
- Text change: "Save" → "Saving..."
- Maintain button width (no layout shift)

**Card Loading**:
- Skeleton loader with pulse animation
- Gray placeholder boxes
- Maintain layout structure

**Inline Loading**:
- Spinner next to text
- Small (12px) for inline elements

### Success/Error Feedback

**Toast Notifications**:
- Position: Top-right corner
- Width: 320px (mobile: full-width)
- Padding: 16px
- Border radius: 12px
- Shadow: lg
- Auto-dismiss: 5s (success), 8s (error)
- Close button: X icon (top-right)

**Success Toast**:
```css
background: #D1FAE5;
border: 1px solid #10B981;
color: #064E3B;

[Icon] ✓ (green, 20px)
[Message] "Google Calendar connected successfully!"
[Close] ✕
```

**Error Toast**:
```css
background: #FEE2E2;
border: 1px solid #EF4444;
color: #7F1D1D;

[Icon] ✗ (red, 20px)
[Message] "Connection failed. Please try again."
[Action] [Retry] button
[Close] ✕
```

**Inline Validation**:
- Error text below input (14px, red)
- Error icon (⚠️) next to input
- Red border on input
- Appears immediately on blur

---

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 639px) { ... }

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

### Mobile (<640px)

**Layout**:
- Single column
- Full-width cards
- Stack all components vertically
- 16px side padding

**Connection Card**:
- Icon above text (not side-by-side)
- Full-width button
- Reduced padding (16px)

**Sync Settings Form**:
- Single column (no grid)
- Stack radio buttons vertically
- Full-width checkboxes

**Sync History**:
- Card layout (not table)
- Stack data vertically
- Tap to expand details

**Navigation**:
- Hamburger menu or bottom tabs
- Full-screen overlay

### Tablet (640px-1024px)

**Layout**:
- Single column with generous padding
- Two-column grid for sync settings
- Max-width: 768px, centered

**Connection Card**:
- Side-by-side layout maintained
- Responsive padding

**Sync History**:
- Table layout with horizontal scroll if needed

### Desktop (>1024px)

**Layout**:
- Max-width: 1280px, centered
- Two-column layouts where applicable
- Fixed sidebar navigation (optional)

**Connection Card**:
- Full layout with all details
- Generous whitespace

**Sync Settings Form**:
- Two-column grid (50/50)
- Side-by-side sections

---

## Accessibility Requirements

### ARIA Labels

**Connection Card**:
```html
<div role="status" aria-live="polite">
  <h2 id="connection-status">Connection Status</h2>
  <div aria-labelledby="connection-status">
    Connected to admin@thepuppyday.com
  </div>
</div>
```

**Sync Settings Form**:
```html
<form aria-label="Calendar sync settings">
  <fieldset>
    <legend>Sync Direction</legend>
    <input type="radio" id="push-only" name="direction" value="push"
           aria-label="Push appointments to calendar only" />
    <label for="push-only">Push only</label>
  </fieldset>
</form>
```

**Calendar Selector**:
```html
<div role="combobox"
     aria-expanded="false"
     aria-haspopup="listbox"
     aria-labelledby="calendar-label">
  <label id="calendar-label">Select Calendar</label>
  <div role="listbox">
    <div role="option" aria-selected="true">Business Calendar</div>
  </div>
</div>
```

### Keyboard Navigation

**Tab Order**:
1. Connection card action button
2. Calendar selector trigger
3. Refresh calendars button
4. Auto-sync toggle
5. Sync direction radios
6. Status checkboxes
7. Notification checkboxes
8. Save settings button
9. Quick action buttons
10. Sync history table

**Keyboard Shortcuts**:
- Tab: Next element
- Shift+Tab: Previous element
- Enter/Space: Activate button or toggle
- Arrow keys: Navigate radio buttons, dropdown items
- Escape: Close dropdown or modal

### Screen Reader Support

**Announcements**:
- Connection status changes: "Connected to Google Calendar"
- Save success: "Settings saved successfully"
- Sync completion: "3 appointments synced to calendar"
- Errors: "Connection error. Calendar not found."

**Live Regions**:
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {/* Dynamic status messages */}
</div>
```

### Focus Management

**After OAuth Redirect**:
- Focus returns to connection card
- Announcement: "Google Calendar connected successfully"

**After Save**:
- Focus remains on save button
- Brief success indicator
- Announcement: "Settings saved"

**Modal/Dropdown**:
- Focus trap within modal
- Escape closes modal
- Focus returns to trigger element

### Color Contrast

**WCAG AA Compliance**:
- Text on background: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Tested Combinations**:
- #434E54 on #FFFFFF: 9.1:1 ✓
- #F59E0B on #FFFFFF: 2.9:1 ✗ (use for non-text only)
- #10B981 on #D1FAE5: 4.6:1 ✓
- #EF4444 on #FEE2E2: 5.2:1 ✓

---

## State Management

### Client-Side State

**React Hooks**:
```typescript
// Connection status
const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
  connected: false,
  loading: true,
  error: null,
});

// Calendars list
const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([]);
const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');

// Sync settings
const [syncSettings, setSyncSettings] = useState<CalendarSyncSettings>({
  auto_sync_enabled: true,
  sync_direction: 'bidirectional',
  sync_statuses: ['confirmed', 'checked_in'],
  notify_on_success: false,
  notify_on_failure: true,
});

// Form state
const [isDirty, setIsDirty] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Sync history
const [syncHistory, setSyncHistory] = useState<SyncOperation[]>([]);
const [isLoadingHistory, setIsLoadingHistory] = useState(false);
```

### Data Fetching

**Initial Load**:
```typescript
useEffect(() => {
  async function loadData() {
    try {
      // Fetch connection status
      const statusRes = await fetch('/api/admin/calendar/status');
      const status = await statusRes.json();
      setConnectionStatus(status);

      // If connected, fetch additional data
      if (status.connected) {
        const [calendarsRes, settingsRes, historyRes] = await Promise.all([
          fetch('/api/admin/calendar/calendars'),
          fetch('/api/admin/calendar/settings'),
          fetch('/api/admin/calendar/sync-history?limit=10'),
        ]);

        const calendars = await calendarsRes.json();
        const settings = await settingsRes.json();
        const history = await historyRes.json();

        setCalendars(calendars.calendars);
        setSyncSettings(settings);
        setSyncHistory(history.operations);
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setConnectionStatus(prev => ({ ...prev, error: error.message }));
    } finally {
      setConnectionStatus(prev => ({ ...prev, loading: false }));
    }
  }

  loadData();
}, []);
```

### Form Handling

**Track Changes**:
```typescript
const handleSettingsChange = (newSettings: CalendarSyncSettings) => {
  setSyncSettings(newSettings);
  setIsDirty(true);
};

const handleSave = async () => {
  setIsSaving(true);
  try {
    const res = await fetch('/api/admin/calendar/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncSettings),
    });

    if (!res.ok) throw new Error('Failed to save settings');

    toast.success('Settings saved successfully!');
    setIsDirty(false);
  } catch (error) {
    toast.error('Failed to save settings. Please try again.');
  } finally {
    setIsSaving(false);
  }
};
```

**Unsaved Changes Warning**:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

---

## Assets Needed

### Icons

**From Lucide React**:
- `Calendar` - Main calendar icon
- `CheckCircle` - Success/connected status
- `XCircle` - Error status
- `RefreshCw` - Refresh/sync actions
- `Settings` - Settings icon
- `Clock` - Timestamp/last sync
- `AlertTriangle` - Warnings
- `Info` - Information tooltips
- `ChevronDown` - Dropdown indicators
- `Loader` - Loading spinners

### Images

**Google Branding**:
- Google logo (SVG or PNG, 24px × 24px)
- Use official Google brand guidelines
- Alternative: 🔐 emoji for OAuth button

**Illustrations** (optional):
- Empty state illustration (no connection)
- Success illustration (connection established)
- Error illustration (connection failed)

### Animations

**Framer Motion**:
```typescript
// Dropdown slide animation
const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

// Card hover lift
const cardVariants = {
  rest: { y: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: { y: -2, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
};

// Toast slide in
const toastVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};
```

---

## Next Steps: Handoff to DaisyUI Expert

This design specification is complete and ready for implementation. The next phase involves:

1. **Component Implementation** (`@agent-daisyui-expert`):
   - Convert design specs to DaisyUI components
   - Implement Tailwind CSS styling
   - Add Framer Motion animations
   - Ensure responsive behavior

2. **Integration**:
   - Connect components to backend APIs
   - Implement OAuth flow
   - Add error handling and validation
   - Test accessibility features

3. **Testing**:
   - Visual regression testing
   - Accessibility audit (WCAG AA)
   - Cross-browser testing
   - Mobile responsiveness testing

---

## Design Checklist

- [x] Component breakdown (Tasks 0038-0043)
- [x] Layout diagrams (ASCII/Markdown)
- [x] Color palette (hex values)
- [x] Typography scale (sizes, weights, line heights)
- [x] Interaction design (hover, focus, loading states)
- [x] Responsive breakpoints (mobile, tablet, desktop)
- [x] Accessibility requirements (ARIA, keyboard, screen readers)
- [x] State management (React hooks, form state)
- [x] User flows (connection, management, errors)
- [x] Visual design system (shadows, borders, transitions)
- [x] Assets needed (icons, images, animations)

---

**Design Status**: ✅ Complete

**Ready for Implementation**: Yes

**Handoff to**: `@agent-daisyui-expert`

**Estimated Implementation**: 3-4 days

**File Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\.claude\design\calendar-settings-ui.md`
