# Earning Rules Editor - Component Guide

## Quick Reference

### Component Location
```
src/components/admin/settings/loyalty/EarningRulesForm.tsx
```

### Usage
```tsx
import { EarningRulesForm } from '@/components/admin/settings/loyalty/EarningRulesForm';

export default function LoyaltySettingsPage() {
  return (
    <div>
      <EarningRulesForm />
    </div>
  );
}
```

### Access URL
```
/admin/settings/loyalty
```

## Component Structure

```
EarningRulesForm
├── Header
│   ├── Icon Badge (Gift icon)
│   ├── Title: "Earning Rules"
│   └── Description
│
├── Important Note Banner
│   └── "Changes Apply to Future Appointments Only"
│
├── Section 1: Qualifying Services
│   ├── Header with icon (ListChecks)
│   ├── Service Selection Panel
│   │   ├── Selection Count Display
│   │   ├── Quick Actions (Select All / Clear All)
│   │   └── Service Checkboxes (scrollable)
│   └── InfoCard Explanation
│
├── Section 2: Minimum Spend Threshold
│   ├── Header with icon (DollarSign)
│   ├── Amount Input Panel
│   │   ├── Dollar Input Field
│   │   ├── Status Display
│   │   └── Quick Select Buttons ($0, $25, $50, $75, $100)
│   └── InfoCard Explanation
│
├── Section 3: First Visit Bonus
│   ├── Header with icon (Sparkles)
│   ├── Enable/Disable Toggle
│   ├── Bonus Amount Panel (conditional)
│   │   ├── Punch Count Input
│   │   └── Quick Select Buttons (1, 2, 3, 5)
│   └── InfoCard Explanation
│
├── Affected Customers Banner (conditional)
│   └── Customer Count Display
│
└── Footer Actions
    ├── Save Button (with loading state)
    ├── Unsaved Changes Indicator
    └── Success/Error Messages
```

## Visual States

### 1. Initial Loading State
```
┌─────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓ (animated skeleton)            │
│                                         │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       │
│ ▓▓▓▓▓▓▓▓▓▓▓                             │
│ ▓▓▓▓▓▓▓▓▓▓▓                             │
└─────────────────────────────────────────┘
```

### 2. Loaded - No Changes
```
┌─────────────────────────────────────────┐
│ [🎁] Earning Rules                      │
│      Configure how customers earn...    │
│                                         │
│ [ℹ️] Changes Apply to Future...         │
│                                         │
│ [✓] Qualifying Services                 │
│     ┌─────────────────────────┐        │
│     │ 3 of 5 services selected │        │
│     │ [Select All] [Clear All] │        │
│     │                          │        │
│     │ ☑ Basic Grooming         │        │
│     │ ☑ Premium Grooming       │        │
│     │ ☑ Day Care               │        │
│     │ ☐ Bath Only              │        │
│     │ ☐ Nail Trim              │        │
│     └─────────────────────────┘        │
│                                         │
│ [💲] Minimum Spend Threshold            │
│     ┌─────────────────────────┐        │
│     │ $ [50]                   │        │
│     │ Customers must spend     │        │
│     │ $50.00 or more...        │        │
│     │ [$0] [$25] [$50]...      │        │
│     └─────────────────────────┘        │
│                                         │
│ [✨] First Visit Bonus                  │
│     ┌─────────────────────────┐        │
│     │ Enable ............[ON]  │        │
│     │ Bonus Punches: [2]       │        │
│     │ [1] [2] [3] [5]          │        │
│     └─────────────────────────┘        │
│                                         │
│ [💾 Save Earning Rules] (disabled)     │
└─────────────────────────────────────────┘
```

### 3. Modified - Unsaved Changes
```
┌─────────────────────────────────────────┐
│ ... (same structure as above)           │
│                                         │
│ [💾 Save Earning Rules]                │
│ [⚠️] Unsaved changes                    │
└─────────────────────────────────────────┘
```

### 4. Saving State
```
┌─────────────────────────────────────────┐
│ ... (same structure)                    │
│                                         │
│ [⏳ Saving...]                          │
└─────────────────────────────────────────┘
```

### 5. Success State
```
┌─────────────────────────────────────────┐
│ ... (updated values)                    │
│                                         │
│ [👥] 12 customer(s) with upcoming       │
│      appointments may be affected       │
│                                         │
│ [💾 Save Earning Rules] (disabled)     │
│ [✓] Loyalty earning rules updated...   │
└─────────────────────────────────────────┘
```

### 6. Error State (Load Failed)
```
┌─────────────────────────────────────────┐
│          [⚠️]                           │
│     Failed to load settings             │
│         [Retry]                         │
└─────────────────────────────────────────┘
```

## Color Coding

### Status Colors
- **Blue** (`#74B9FF`) - Informational banners
- **Green** (`#6BCB77`) - Success messages, enabled states
- **Orange** (`#FFB347`) - Unsaved changes warning
- **Red** (`#EF4444`) - Error messages
- **Gray** (`#6B7280`) - Secondary text, disabled states

### Background Colors
- **Cream** (`#F8EEE5`) - Page background
- **Light Cream** (`#FFFBF7`) - Input panels
- **White** (`#FFFFFF`) - Cards, checkboxes
- **Charcoal** (`#434E54`) - Primary buttons, text

## Interactive Elements

### Buttons

#### Primary Save Button
```tsx
// Enabled state
className="bg-[#434E54] hover:bg-[#363F44] text-white"

// Disabled state
className="bg-gray-300 text-gray-500 cursor-not-allowed"

// Loading state
<span className="loading loading-spinner loading-sm"></span>
```

#### Quick Select Buttons
```tsx
// Selected
className="bg-[#434E54] text-white border-[#434E54]"

// Unselected
className="bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]"
```

### Inputs

#### Dollar Amount Input
```tsx
<input
  type="number"
  min="0"
  max="1000"
  step="5"
  className="w-24 px-3 py-2 rounded-lg border border-[#434E54]/20
             focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
/>
```

#### Bonus Punches Input
```tsx
<input
  type="number"
  min="1"
  max="10"
  className="w-24 px-3 py-2 rounded-lg..."
/>
```

### Toggles

#### Enable/Disable Toggle
```tsx
<input
  type="checkbox"
  className="toggle toggle-success"
/>
```

### Checkboxes

#### Service Selection
```tsx
<input
  type="checkbox"
  className="checkbox checkbox-sm border-[#434E54]/30
             checked:border-[#434E54] [--chkbg:#434E54]"
/>
```

## Responsive Behavior

### Desktop (≥1024px)
- Full width sections
- Side-by-side quick select buttons
- Scrollable service list (max-height: 16rem)

### Tablet (768px - 1023px)
- Stacked sections
- Wrapped quick select buttons
- Maintained scrollable service list

### Mobile (<768px)
- Full-width inputs
- Stacked buttons
- Touch-friendly tap targets
- Reduced padding for space efficiency

## Animation Details

### Framer Motion Animations

#### First Visit Bonus Panel
```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
>
  {/* Bonus input fields */}
</motion.div>
```

#### Success Message
```tsx
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
>
  {/* Success text */}
</motion.div>
```

### CSS Transitions
- Button hover: `transition-colors duration-200`
- Card hover: `transition-shadow duration-200`
- All interactive elements: `transition-all duration-200`

## InfoCard Components

### Purpose
Provide clear explanations for each rule type

### Structure
```tsx
<InfoCard
  icon={IconComponent}
  title="How It Works"
  description="Detailed explanation..."
  color="bg-[#F8EEE5]"
/>
```

### Styling
- Soft background (`bg-[#F8EEE5]`)
- Subtle border (`border-[#434E54]/10`)
- Icon badge with white background
- Clear typography hierarchy

## Form Validation

### Minimum Spend
- Must be >= 0
- No upper limit enforced
- Step: 5 (for cleaner values)

### First Visit Bonus
- Range: 1-10 punches
- Auto-constrains on input
- Disabled when toggle is off

### Service Selection
- No validation required
- Empty selection is valid (means "all")
- Invalid service IDs rejected by API

## API Error Handling

### Network Errors
- Display error message in toast
- Preserve user input
- Enable retry without data loss

### Validation Errors
- Show field-specific errors
- Highlight problematic inputs
- Provide correction guidance

### Server Errors
- Generic error message
- Log to console for debugging
- Offer retry option

## Accessibility Features

- Semantic HTML structure
- Clear labels for inputs
- Focus indicators on all interactive elements
- Keyboard navigation support
- ARIA labels on icons
- Color contrast meets WCAG AA standards
- Screen reader friendly messages

## Performance Notes

- Parallel data fetching on mount
- Controlled re-renders with state batching
- Efficient change detection algorithm
- Minimal DOM updates
- Lazy loading of service list
- Debounced input handlers

## Best Practices Applied

1. **Single Responsibility** - Each sub-component has one job
2. **Composition** - InfoCard, ServiceCheckbox reusable
3. **Declarative** - React patterns, not imperative DOM
4. **Type Safety** - Full TypeScript coverage
5. **Error Boundaries** - Graceful error handling
6. **Loading States** - Never leave user guessing
7. **Optimistic UI** - Fast perceived performance
8. **Accessibility First** - WCAG compliant
9. **Design Consistency** - Matches existing components
10. **User Feedback** - Clear messages at every step

## Integration Checklist

When integrating this component:

- [ ] Ensure API routes are deployed
- [ ] Verify admin authentication works
- [ ] Test with real service data
- [ ] Validate affected customers calculation
- [ ] Check audit logging is enabled
- [ ] Test error states (network offline, etc.)
- [ ] Verify responsive behavior on all devices
- [ ] Test keyboard navigation
- [ ] Validate screen reader compatibility
- [ ] Confirm with stakeholders on UX flow

## Troubleshooting

### Component Won't Load
- Check if API routes are accessible
- Verify authentication is working
- Check browser console for errors
- Ensure database has services table

### Save Button Disabled
- Verify you've made changes
- Check if form is in loading state
- Ensure no validation errors

### Services Not Showing
- Check API response in network tab
- Verify services table has data
- Check is_active filter logic

### Affected Customers Not Showing
- Normal on first save (no history)
- Will show after successful save
- Check appointments table has data

## Related Components

- **PunchCardConfig** - Configure punch thresholds
- **RedemptionRulesForm** - Configure redemption rules (Task 0196)
- **ReferralProgramForm** - Configure referrals (Task 0197)

## Version History

- **v1.0.0** (Task 0194) - Initial implementation
  - Services multi-select with quick actions
  - Minimum spend threshold with quick select
  - First visit bonus with toggle
  - Affected customers preview
  - Full design system compliance
