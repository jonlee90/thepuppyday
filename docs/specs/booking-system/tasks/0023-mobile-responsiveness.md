# Task 23: Optimize Booking Wizard for Mobile

## Description
Ensure all booking wizard components are fully optimized for mobile devices with touch-friendly interfaces and appropriate layouts.

## Files to modify
- All booking step components
- `src/components/booking/CalendarPicker.tsx`
- `src/components/booking/TimeSlotGrid.tsx`
- `src/components/booking/BookingWizard.tsx`

## Requirements References
- Req 11.1: Single-column layout optimized for touch on mobile (< 768px)
- Req 11.2: Mobile-friendly calendar with large touch targets
- Req 11.3: Scrollable time slot cards with adequate spacing
- Req 11.4: Full-width buttons with clear labels
- Req 11.5: Appropriate input types (tel, email) for mobile keyboards

## Implementation Details

### Mobile Layout Patterns

#### Responsive Grid
```tsx
// Service/Addon cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

#### Mobile-First Buttons
```tsx
// Navigation buttons
<div className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-6">
  <button className="btn btn-ghost order-2 sm:order-1">
    Back
  </button>
  <button className="btn btn-primary order-1 sm:order-2 w-full sm:w-auto">
    Continue
  </button>
</div>
```

#### Touch Target Sizing
```tsx
// Minimum 44x44px touch targets
<button className="btn h-12 min-h-[44px] text-base">
  Continue
</button>

// Time slot buttons
<button className="btn h-16 w-full text-lg">
  10:00 AM
</button>
```

### CalendarPicker Mobile Optimization
```tsx
export function CalendarPicker({ ... }) {
  // Mobile: swipeable single month
  // Desktop: side-by-side months

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="btn btn-circle btn-ghost btn-sm"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={handleNextMonth}
          className="btn btn-circle btn-ghost btn-sm"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid - larger cells on mobile */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-sm text-base-content/70 py-2">
            {day}
          </div>
        ))}

        {/* Date cells */}
        {dates.map((date, i) => (
          <button
            key={i}
            onClick={() => onSelectDate(date)}
            disabled={isDisabled(date)}
            className={cn(
              'aspect-square flex items-center justify-center rounded-full text-sm',
              'hover:bg-primary/10 transition-colors',
              'min-h-[44px] min-w-[44px]', // Touch target
              isSelected(date) && 'bg-primary text-primary-content',
              isDisabled(date) && 'text-base-content/30 cursor-not-allowed',
              isToday(date) && 'ring-1 ring-primary'
            )}
          >
            {getDate(date)}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### TimeSlotGrid Mobile Optimization
```tsx
export function TimeSlotGrid({ slots, ... }) {
  return (
    <div className="space-y-4">
      {/* Time period groups */}
      <div>
        <h4 className="text-sm font-medium text-base-content/70 mb-2">Morning</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {morningSlots.map(slot => (
            <TimeSlotButton key={slot.time} slot={slot} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-base-content/70 mb-2">Afternoon</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {afternoonSlots.map(slot => (
            <TimeSlotButton key={slot.time} slot={slot} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeSlotButton({ slot, ... }) {
  return (
    <button
      className={cn(
        'btn h-14 sm:h-12 text-base sm:text-sm',
        slot.available ? 'btn-outline' : 'btn-ghost',
        isSelected && 'btn-primary'
      )}
    >
      {formatTime(slot.time)}
    </button>
  );
}
```

### Form Input Optimization
```tsx
// Email input with mobile keyboard
<input
  type="email"
  inputMode="email"
  autoComplete="email"
  className="input input-bordered w-full h-12"
/>

// Phone input with numeric keyboard
<input
  type="tel"
  inputMode="tel"
  autoComplete="tel"
  className="input input-bordered w-full h-12"
  placeholder="(555) 123-4567"
/>
```

### Mobile Price Bar (Fixed Bottom)
```tsx
// Already implemented in BookingWizard - ensure it's prominent
<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 p-4 shadow-lg z-40">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-base-content/70">Total</p>
      <p className="text-xl font-bold">${totalPrice.toFixed(2)}</p>
    </div>
    {selectedService && (
      <div className="text-right text-sm">
        <p className="text-base-content/70">{selectedService.name}</p>
        {selectedAddons.length > 0 && (
          <p className="text-xs text-base-content/50">
            +{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    )}
  </div>
</div>

{/* Spacer for fixed bar */}
<div className="lg:hidden h-20" />
```

### Viewport Meta (verify in layout)
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

## Acceptance Criteria
- [ ] Single-column layout on viewports < 768px
- [ ] Calendar cells minimum 44x44px touch targets
- [ ] Time slot buttons minimum 44x44px touch targets
- [ ] Navigation buttons full-width on mobile
- [ ] 8px minimum spacing between interactive elements
- [ ] Email input shows email keyboard on mobile
- [ ] Phone input shows numeric keyboard on mobile
- [ ] Price bar fixed at bottom on mobile
- [ ] Content doesn't overlap price bar (spacer added)
- [ ] No horizontal scroll on mobile
- [ ] Viewport allows zoom up to 5x (accessibility)

## Estimated Complexity
Medium

## Phase
Phase 7: Mobile Responsiveness & Accessibility

## Dependencies
- All step component tasks (14-18)
