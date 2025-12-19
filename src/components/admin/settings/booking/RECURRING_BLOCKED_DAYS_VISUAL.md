# RecurringBlockedDays Component - Visual Reference

## Component Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  📅 Recurring Blocked Days                                              │
├────────────────────────────────────────────────────────────────────────┤
│  Block specific days of the week every week. For example, block all    │
│  Sundays or all Saturdays.                                             │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Select Days to Block                                            │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │  │
│  │  │ Sunday      ℹ️ │  │ Monday        │  │ Tuesday       │      │  │
│  │  │ ● Always      │  │               │  │               │      │  │
│  │  │   Blocked     │  │         [ ]   │  │         [ ]   │      │  │
│  │  │         [●]   │  │               │  │               │      │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘      │  │
│  │                                                                  │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │  │
│  │  │ Wednesday     │  │ Thursday      │  │ Friday        │      │  │
│  │  │               │  │               │  │               │      │  │
│  │  │         [ ]   │  │         [ ]   │  │         [ ]   │      │  │
│  │  │               │  │               │  │               │      │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘      │  │
│  │                                                                  │  │
│  │  ┌───────────────┐                                              │  │
│  │  │ Saturday    ℹ️ │                                              │  │
│  │  │ ● Always      │                                              │  │
│  │  │   Blocked     │                                              │  │
│  │  │         [●]   │                                              │  │
│  │  └───────────────┘                                              │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ℹ️  Tip: The following day(s) are marked as closed in business  │  │
│  │     hours but not blocked for bookings:                         │  │
│  │                                                                  │  │
│  │     [ Sunday ]                                                  │  │
│  │                                                                  │  │
│  │     [Block All Closed Days]                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📅 Next Affected Dates                                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  Sundays                                                         │  │
│  │  [Dec 24] [Dec 31] [Jan 7] [Jan 14]                            │  │
│  │                                                                  │  │
│  │  Saturdays                                                       │  │
│  │  [Dec 23] [Dec 30] [Jan 6] [Jan 13]                            │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️  You have unsaved changes                                     │  │
│  │                                        [Reset] [Save Changes]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## State Variations

### Empty State (No Days Blocked)

```
┌────────────────────────────────────────────┐
│  All toggles OFF                           │
│  No "Next Affected Dates" section         │
│  Message: "No recurring blocked days       │
│           configured."                     │
└────────────────────────────────────────────┘
```

### Conflict Warning Modal

```
┌────────────────────────────────────────────┐
│  ⚠️  Appointments Exist                     │
├────────────────────────────────────────────┤
│                                            │
│  There are 12 future appointments on       │
│  Sundays.                                  │
│                                            │
│  Blocking this day will prevent customers  │
│  from booking on Sundays, but existing     │
│  appointments will remain. You may need    │
│  to contact affected customers.            │
│                                            │
│                    [Cancel] [Block Anyway] │
└────────────────────────────────────────────┘
```

### Toast Notifications

```
Success:
┌────────────────────────────────────┐
│ ✅ Recurring blocked days saved    │
│    successfully                    │
└────────────────────────────────────┘

Error:
┌────────────────────────────────────┐
│ ❌ Failed to save changes          │
└────────────────────────────────────┘

Warning:
┌────────────────────────────────────┐
│ ⚠️  12 appointments on Sundays     │
└────────────────────────────────────┘
```

## Color Scheme

### Day Toggle Cards

**Available (Not Blocked):**
```
Background: #FFFFFF (white)
Border: #E5E7EB (gray-200)
Text: #434E54 (charcoal)
Toggle: OFF (gray)
```

**Blocked (Active):**
```
Background: #F8EEE5 (warm cream)
Border: #434E54 (charcoal) - 2px
Text: #434E54 (charcoal)
Badge: "Always Blocked"
Toggle: ON (charcoal #434E54)
```

**Closed in Business Hours:**
```
Info icon: #9CA3AF (gray-400)
Tooltip: "Closed in business hours"
```

### Sections

**Business Hours Info Alert:**
```
Background: #DBEAFE (blue-50)
Border: #BFDBFE (blue-200)
Icon: #2563EB (blue-600)
Text: #1E3A8A (blue-900)
Button: #2563EB (blue-600)
```

**Unsaved Changes Alert:**
```
Background: #FEF3C7 (orange-50)
Border: #FDE68A (orange-200)
Icon: #D97706 (orange-600)
Text: #92400E (orange-900)
```

**Date Preview Badges:**
```
Background: #EAE0D5 (secondary cream)
Text: #434E54 (charcoal)
Border: None
Padding: 0.25rem 0.75rem
Border-radius: 0.5rem
```

## Responsive Behavior

### Desktop (≥1024px)
```
Day toggles: 4 columns grid
Next dates: 3 columns grid
Full width alerts and actions
```

### Tablet (768px - 1023px)
```
Day toggles: 2 columns grid
Next dates: 2 columns grid
Full width alerts and actions
```

### Mobile (<768px)
```
Day toggles: 1 column stack
Next dates: 1 column stack
Full width everything
Reduced padding
```

## Interactive Elements

### Toggle Switch (DaisyUI)
```tsx
<input
  type="checkbox"
  className="toggle toggle-md"
  style={{ '--tglbg': isBlocked ? '#434E54' : '#D1D5DB' }}
/>
```

### Buttons

**Primary (Save):**
```
Background: #434E54 (charcoal)
Text: #FFFFFF (white)
Hover: #363F44 (darker charcoal)
Icon: Save (Lucide)
```

**Secondary (Reset):**
```
Background: transparent
Text: #434E54 (charcoal)
Hover: light gray
Icon: RotateCcw (Lucide)
```

**Info Action (Block All Closed):**
```
Background: #2563EB (blue-600)
Text: #FFFFFF (white)
Hover: #1D4ED8 (blue-700)
Size: Small
```

## Animation Effects

### Card Hover
```css
transition: all 200ms ease
hover: shadow-md (elevation)
```

### Alert Entry/Exit
```css
initial: opacity 0, y: -10px
animate: opacity 1, y: 0px
duration: 200ms
```

### Modal
```css
initial: opacity 0, scale: 0.9
animate: opacity 1, scale: 1
exit: opacity 0, scale: 0.9
duration: 200ms
```

### Toast
```css
initial: opacity 0, y: 50px
animate: opacity 1, y: 0px
exit: opacity 0, y: 50px
duration: 300ms
```

## Icons Used (Lucide React)

- **CalendarClock** - Section header
- **Ban** - "Always Blocked" badge
- **Save** - Save button
- **AlertTriangle** - Warning icons
- **Info** - Info badges and alerts
- **Calendar** - Date preview section
- **RotateCcw** - Reset button

## Accessibility Features

- ✅ Label associations for all toggles
- ✅ Keyboard navigation support
- ✅ ARIA attributes on modals
- ✅ Proper contrast ratios (WCAG AA)
- ✅ Loading states with spinners and text
- ✅ Clear error/success messages
- ✅ Tooltip helpers for icons
- ✅ Focus indicators on interactive elements

## User Flow

1. **Load Component**
   - Fetch current booking settings
   - Fetch business hours
   - Display current recurring blocks
   - Show suggestions if closed days not blocked

2. **Toggle Day**
   - Click toggle to enable/disable
   - If enabling: Check for conflicts
   - If conflicts: Show warning modal
   - If confirmed: Update local state
   - Preview affected dates update

3. **Quick Actions**
   - "Block All Closed Days": Auto-toggle closed days
   - "Reset": Revert to saved state
   - Toast notification on action

4. **Save Changes**
   - Click "Save Changes" button
   - Loading state with spinner
   - API call to save settings
   - Success/error toast
   - Update parent state

5. **View Affected Dates**
   - Automatically shows next 4 occurrences
   - Updates in real-time with toggles
   - Organized by day of week
