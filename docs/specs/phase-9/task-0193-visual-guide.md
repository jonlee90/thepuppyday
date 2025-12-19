# Task 0193: Punch Card Configuration - Visual Guide

## Component Layout

### Desktop View (1200px+)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PUNCH CARD CONFIGURATION                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🎁  Punch Card Configuration          Enabled 🟢 [Toggle]   │  │
│  │     Master loyalty program settings                          │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Program Statistics                                          │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐│  │
│  │  │ 👥 Active        │ │ 🏆 Rewards       │ │ ⏰ Pending   ││  │
│  │  │    Customers     │ │    Redeemed      │ │    Rewards   ││  │
│  │  │                  │ │                  │ │              ││  │
│  │  │      125         │ │      342         │ │      18      ││  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────┘│  │
│  │                                                              │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  ┌────────────────────────────┬────────────────────────────┐│  │
│  │  │ Punch Threshold            │ Preview                    ││  │
│  │  │                            │                            ││  │
│  │  │ Number of visits required  │ ┌────────────────────────┐││  │
│  │  │ before earning free wash   │ │ Punch Card Preview     │││  │
│  │  │                            │ │ Buy 9, get next free!  │││  │
│  │  │ [5────────●────────20] [9] │ │                        │││  │
│  │  │                            │ │  ✓ ✓ ✓ ✓ ✓            │││  │
│  │  │ [5] [7] [9] [10] [12] ...  │ │  ✓ ○ ○ ○              │││  │
│  │  │                            │ │                        │││  │
│  │  │ ⚠️  Unsaved changes        │ │  🏆 6 / 9 punches      │││  │
│  │  │                            │ └────────────────────────┘││  │
│  │  └────────────────────────────┴────────────────────────────┘│  │
│  │                                                              │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  [💾 Save Changes]  ✅ Settings saved successfully!         │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component States

### 1. Loading State

```
┌─────────────────────────────────────────────┐
│                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       │
│                                             │
│  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓         │
│  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓▓▓         │
│                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                             │
└─────────────────────────────────────────────┘

  Pulsing gray skeleton animation
  Shows while fetching settings from API
```

### 2. Disabled State

```
┌─────────────────────────────────────────────────────────┐
│ 🎁  Punch Card Configuration    Disabled ⚫ [Toggle]   │
│     Master loyalty program settings                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⚠️  Loyalty Program Disabled                            │
│    Existing customer punch cards and rewards are       │
│    preserved. Enable the program to start awarding     │
│    punches again.                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Rest of component shown but appears inactive]          │
└─────────────────────────────────────────────────────────┘

  Yellow warning banner displayed
  Toggle switch shows as off/gray
```

### 3. Error State

```
┌─────────────────────────────────────────────┐
│                                             │
│              ⚠️                             │
│         Failed to load settings             │
│                                             │
│         [ Retry ]                           │
│                                             │
└─────────────────────────────────────────────┘

  Centered error message
  Red alert icon
  Retry button to attempt reload
```

## Interactive Elements

### Enable/Disable Toggle

**Enabled (Green):**
```
Enabled 🟢 [●──]
```

**Disabled (Gray):**
```
Disabled ⚫ [──○]
```

### Threshold Slider

```
Range: 5 ────────●──────── 20    [9]
       min                 max   value

Quick Select:
[5] [7] [●9●] [10] [12] [15] [20]
         ↑
      selected
```

### Punch Card Preview Grid

**Threshold = 9, Current Progress = 6**

```
┌────────────────────────────────┐
│   Punch Card Preview           │
│   Buy 9, get next wash free!   │
│                                │
│   ✓   ✓   ✓   ✓   ✓           │
│   1   2   3   4   5            │
│                                │
│   ✓   ○   ○   ○                │
│   6   7   8   9                │
│                                │
│   🏆 6 / 9 punches             │
└────────────────────────────────┘

✓ = Filled punch (green checkmark)
○ = Empty punch (gray circle)
```

**Threshold = 15, Current Progress = 9**

```
┌────────────────────────────────┐
│   Punch Card Preview           │
│   Buy 15, get next wash free!  │
│                                │
│   ✓   ✓   ✓   ✓   ✓           │
│   ✓   ✓   ✓   ✓   ○           │
│   ○   ○   ○   ○   ○           │
│                                │
│   🏆 9 / 15 punches            │
└────────────────────────────────┘
```

## Confirmation Dialog

### Disable Confirmation

```
┌─────────────────────────────────────────────┐
│                                             │
│  ⚠️   Disable Loyalty Program?              │
│                                             │
│       Existing customer punch cards and     │
│       rewards will be preserved but new     │
│       punches won't be awarded. You can     │
│       re-enable this anytime.               │
│                                             │
│                  [ Cancel ]  [ Disable ]    │
│                               (red)         │
└─────────────────────────────────────────────┘

Modal overlay with dark backdrop
Framer Motion slide-in animation
Red warning icon
```

## Statistics Cards

### Active Customers Card (Blue)
```
┌──────────────────┐
│ 👥 Active        │
│    Customers     │
│                  │
│      125         │
└──────────────────┘
```

### Total Rewards Redeemed Card (Green)
```
┌──────────────────┐
│ 🏆 Total         │
│    Rewards       │
│    Redeemed      │
│      342         │
└──────────────────┘
```

### Pending Rewards Card (Orange)
```
┌──────────────────┐
│ ⏰ Pending       │
│    Rewards       │
│                  │
│      18          │
└──────────────────┘
```

## Feedback Messages

### Success Toast
```
✅ Settings saved successfully!
   (Auto-dismisses after 3 seconds)
   Green text
```

### Error Toast
```
❌ Failed to save settings
   (Persists until next action)
   Red text
```

### Unsaved Changes Indicator
```
⚠️  Unsaved changes
   (Orange text, shown below threshold slider)
```

## Color Reference

```css
/* Backgrounds */
Page Background:     #F8EEE5  (warm cream)
Card Background:     #FFFFFF  (white)
Input Background:    #FFFBF7  (lighter cream)
Icon Background:     #EAE0D5  (secondary cream)

/* Primary Colors */
Primary:             #434E54  (charcoal)
Primary Hover:       #363F44  (darker charcoal)
Primary Light:       #5A6670  (lighter charcoal)

/* Text */
Heading:             #434E54  (charcoal)
Body:                #6B7280  (gray)
Muted:               #9CA3AF  (light gray)

/* Status Colors */
Success:             #16A34A  (green)
Warning:             #F59E0B  (orange)
Error:               #DC2626  (red)
Info:                #3B82F6  (blue)

/* Stat Card Backgrounds */
Blue Stats:          #DBEAFE  (light blue)
Green Stats:         #DCFCE7  (light green)
Orange Stats:        #FED7AA  (light orange)
```

## Responsive Behavior

### Desktop (1024px+)
- Two-column layout (threshold selector | preview)
- Full statistics cards in row
- All elements visible

### Tablet (768px - 1023px)
- Two-column layout maintained
- Statistics cards in row
- Slightly reduced padding

### Mobile (< 768px)
- Single column layout
- Threshold selector stacked above preview
- Statistics cards in vertical stack
- Smaller quick-select buttons
- Full-width save button

## Animation Details

### Component Mount
- Fade in with slide up
- Duration: 300ms
- Easing: ease-out

### Punch Preview
- Each punch animates in sequentially
- Delay: 20ms per punch
- Scale from 0 to 1

### Confirmation Dialog
- Backdrop fades in
- Modal slides up with scale
- Duration: 200ms

### Success Message
- Slides in from left
- Auto-dismisses with fade out
- Duration: 300ms

## Accessibility

- All interactive elements keyboard accessible
- ARIA labels on toggle switch
- Focus indicators on all controls
- Screen reader friendly stat cards
- Semantic HTML structure
- Color contrast ratios meet WCAG AA

## Usage Example

```typescript
import { PunchCardConfig } from '@/components/admin/settings/loyalty/PunchCardConfig';

export default function LoyaltySettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <PunchCardConfig />
    </div>
  );
}
```
