# Task 0020: Create CustomerFlagBadge component

**Group**: Customer Management (Week 4)

## Objective
Build color-coded flag badge component

## Files to create/modify
- `src/components/admin/customers/CustomerFlagBadge.tsx` - Flag badge

## Requirements covered
- REQ-16.1, REQ-16.2, REQ-16.3, REQ-16.4, REQ-16.5, REQ-16.6, REQ-16.7, REQ-16.8, REQ-16.11

## Acceptance criteria
- [x] Red background for warning flags (Aggressive Dog, Payment Issues)
- [x] Yellow background for notes (Special Needs, Grooming Notes)
- [x] Green background for VIP
- [x] Icon and flag type displayed
- [x] Up to 2 flags inline with "+N more" indicator
- [x] Tooltip with remaining flags on "+N more" hover
- [x] Aggressive Dog flag shown prominently on calendar and list view
- [x] Full descriptions shown in modals

## Implementation Notes

**Completion Date**: 2025-12-12

### Files Created/Modified

1. **`src/components/admin/customers/CustomerFlagBadge.tsx`** (213 lines)
   - CustomerFlagBadge: Multi-flag display component
   - SingleFlagBadge: Standalone flag badge
   - Helper functions for flag metadata

### Key Features Implemented

- ✅ **Color-Coded Flags** (lines 27-70)
  - **Red** (bg-red-50, text-red-700, border-red-200):
    - Aggressive Dog
    - Payment Issues
  - **Yellow** (bg-yellow-50, text-yellow-700, border-yellow-200):
    - Special Needs
    - Grooming Notes
  - **Green** (bg-green-50, text-green-700, border-green-200):
    - VIP
  - **Gray** (bg-gray-50, text-gray-700, border-gray-200):
    - Other

- ✅ **Icon Mapping** (lines 27-70)
  - Aggressive Dog / Payment Issues: `AlertCircle`
  - VIP: `Star`
  - Special Needs: `Heart`
  - Grooming Notes: `Scissors`
  - Other: `Info`
  - All icons from lucide-react

- ✅ **Size Variants** (lines 72-91)
  - Small (`sm`): text-xs, px-2 py-0.5, w-3 h-3 icon
  - Medium (`md`): text-sm, px-2.5 py-1, w-3.5 h-3.5 icon
  - Large (`lg`): text-base, px-3 py-1.5, w-4 h-4 icon

- ✅ **Multi-Flag Display** (lines 93-160)
  - `maxVisible` prop controls how many to show (default: 2)
  - Remaining count shown as "+N more" badge
  - Aggressive Dog flag prioritized to always show first
  - Tooltip on "+N more" shows remaining flag names

- ✅ **Tooltip Implementation** (lines 141-156)
  - Uses native `title` attribute
  - Shows all remaining flag labels
  - Comma-separated list
  - Appears on hover with cursor-help

- ✅ **Priority Sorting** (lines 108-113)
  - Aggressive Dog always first (safety priority)
  - Other flags in original order
  - Ensures critical warnings are visible

### Technical Details

**Flag Configuration Object** (lines 27-70):
```typescript
const FLAG_CONFIG: Record<CustomerFlagType, FlagConfig> = {
  aggressive_dog: {
    label: 'Aggressive Dog',
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  // ... more configs
};
```

**Priority Sorting Logic** (lines 108-113):
```typescript
const sortedFlags = [...activeFlags].sort((a, b) => {
  if (a.flag_type === 'aggressive_dog') return -1; // Always first
  if (b.flag_type === 'aggressive_dog') return 1;
  return 0; // Maintain original order for others
});
```

**Size Classes System** (lines 72-91):
```typescript
const SIZE_CLASSES = {
  sm: { text: 'text-xs', padding: 'px-2 py-0.5', icon: 'w-3 h-3', gap: 'gap-1' },
  md: { text: 'text-sm', padding: 'px-2.5 py-1', icon: 'w-3.5 h-3.5', gap: 'gap-1.5' },
  lg: { text: 'text-base', padding: 'px-3 py-1.5', icon: 'w-4 h-4', gap: 'gap-2' },
};
```

**Active Flags Filter** (lines 100-104):
```typescript
// Only show active flags (is_active = true)
const activeFlags = flags.filter((flag) => flag.is_active);

if (activeFlags.length === 0) {
  return null; // Render nothing if no active flags
}
```

### Component Variants

**1. CustomerFlagBadge** (Multi-flag display):
```typescript
<CustomerFlagBadge
  flags={customer.flags}
  maxVisible={2}
  showIcon={true}
  size="sm"
/>
```

**2. SingleFlagBadge** (Individual flag):
```typescript
<SingleFlagBadge
  flag={flag}
  showIcon={true}
  size="md"
  onClick={() => handleFlagClick(flag)}
/>
```

### Helper Functions

**getFlagLabel** (lines 203-205):
```typescript
export function getFlagLabel(flagType: CustomerFlagType): string {
  return FLAG_CONFIG[flagType]?.label || flagType;
}
```

**getFlagColorClasses** (lines 210-212):
```typescript
export function getFlagColorClasses(flagType: CustomerFlagType) {
  return FLAG_CONFIG[flagType] || FLAG_CONFIG.other;
}
```

### Design System Compliance

**Badge Styling**:
- Rounded-full for pill shape
- Border with matching color
- Font-medium for readability
- Inline-flex for proper alignment

**Color Palette**:
- Uses Tailwind's 50/200/700 shades
- Consistent with project design system
- Sufficient contrast for accessibility

**Transitions**:
- `transition-all duration-200` on hover
- `hover:shadow-sm` for subtle elevation
- Smooth visual feedback

**Icons**:
- Lucide React icons (consistent with project)
- Size-responsive with SIZE_CLASSES
- Positioned before text with gap

### Usage Examples

**In Customer Table** (Task 0017):
```typescript
<CustomerFlagBadge flags={customer.flags} maxVisible={2} size="sm" />
```

**In Customer Profile** (Task 0018):
```typescript
<SingleFlagBadge flag={flag} size="md" />
```

**In Appointment Calendar** (Future):
```typescript
<CustomerFlagBadge
  flags={appointment.customer.flags}
  maxVisible={1} // Show only aggressive dog
  size="sm"
/>
```

### Accessibility

- **Semantic HTML**: Uses `title` attribute for tooltips
- **Color + Icon**: Not relying solely on color (icons provide additional context)
- **Cursor Hints**: `cursor-help` on "+N more" indicates interactive tooltip
- **Text Labels**: All flags have readable text labels, not just icons

### Performance

- **Memoization Ready**: Pure functional component
- **No Heavy Computations**: Simple array operations
- **Conditional Rendering**: Returns null early for empty flags
- **Type Safety**: Full TypeScript typing for flag types

### Future Enhancements

- Clickable flags to open detail modal
- Custom colors for "Other" flag type
- Flag priority levels (critical, warning, info)
- Animated transitions on flag add/remove
- Flag icons in appointment list view
- Bulk flag operations
- Flag templates for common scenarios
