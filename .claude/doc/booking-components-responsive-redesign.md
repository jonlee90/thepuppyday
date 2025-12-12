# Booking Components Responsive Redesign Plan

## Executive Summary

This document outlines a comprehensive redesign of all booking system components to optimize user experience across mobile, tablet, and desktop devices. The redesign focuses on creating a simple, intuitive, and fast booking flow while maintaining The Puppy Day's Clean & Elegant Professional design aesthetic.

**Scope:** 15 component files across main booking components and step components
**Design System:** DaisyUI 5.5.8 + Tailwind CSS 4 + Framer Motion 12
**Target:** Mobile-first responsive design with enhanced tablet and desktop experiences

---

## Current State Analysis

### Existing Components Structure
```
src/components/booking/
├── Main Components (9 files)
│   ├── BookingWizard.tsx          - Container orchestrator
│   ├── BookingProgress.tsx        - Progress indicator
│   ├── PriceSummary.tsx          - Price breakdown
│   ├── CalendarPicker.tsx        - Date selection
│   ├── TimeSlotGrid.tsx          - Time slot selection
│   ├── ServiceCard.tsx           - Service cards
│   ├── PetCard.tsx               - Pet cards + AddPetCard
│   ├── PetForm.tsx               - Pet form
│   └── AddonCard.tsx             - Add-on cards
└── steps/ (6 files)
    ├── ServiceStep.tsx           - Step 1: Services
    ├── PetStep.tsx               - Step 2: Pet info
    ├── DateTimeStep.tsx          - Step 3: Date/time
    ├── AddonsStep.tsx            - Step 4: Add-ons
    ├── ReviewStep.tsx            - Step 5: Review
    └── ConfirmationStep.tsx      - Step 6: Confirmation
```

### Current Issues Identified

**Mobile Experience (< 640px):**
1. Touch targets sometimes < 44px (accessibility concern)
2. Calendar grid cells can be small on small phones
3. Time slots grid may require horizontal scrolling
4. Form inputs lack optimal mobile keyboard types
5. Price summary footer sometimes overlaps content
6. Navigation buttons can be hard to reach with one hand

**Tablet Experience (640px - 1024px):**
1. Underutilized horizontal space
2. Grid layouts don't adapt smoothly between breakpoints
3. Some components stack unnecessarily when side-by-side would work

**Desktop Experience (> 1024px):**
1. Service cards in 3-column grid can be too wide
2. Calendar and time slots could be more compact
3. Form layouts don't leverage available space
4. Missing enhanced hover states and interactions

**Universal Issues:**
1. Inconsistent spacing scale (mix of custom values and Tailwind scale)
2. Some hardcoded colors instead of DaisyUI semantic classes
3. Loading states could be more polished
4. Error states lack visual consistency
5. Success states could be more celebratory

---

## Design System Foundation

### DaisyUI Configuration (Current)

**Theme:** Custom "light" theme with Clean & Elegant Professional palette
**Colors:**
- Primary: `#434E54` (Charcoal) - Buttons, CTAs
- Secondary: `#EAE0D5` (Cream) - Backgrounds, accents
- Base-100: `#F8EEE5` (Warm cream) - Main background
- Base-200: `#EAE0D5` - Secondary background
- Base-300: `#DCD2C7` - Tertiary background
- Success: `#6BCB77` - Green
- Warning: `#FFB347` - Orange
- Error: `#FF6B6B` - Red
- Info: `#74B9FF` - Blue

**DaisyUI Components Available:**
- `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-sm`, `btn-md`, `btn-lg`
- `card`, `card-body`, `card-title`, `card-actions`
- `badge`, `badge-primary`, `badge-secondary`
- `alert`, `alert-success`, `alert-warning`, `alert-error`, `alert-info`
- `input`, `input-bordered`, `input-error`, `select`, `textarea`
- `form-control`, `label`, `label-text`
- `skeleton` (for loading states)
- `loading`, `loading-spinner`
- `progress`

### Responsive Breakpoints (Tailwind)
```css
sm: 640px   /* Small tablets and large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops and small desktops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Touch Target Requirements
- **Mobile:** Minimum 44x44px (Apple HIG, Material Design)
- **Desktop:** Minimum 24x24px acceptable with hover states

### Spacing Scale (Tailwind)
```
4px  = 1    → gap-1, p-1, m-1
8px  = 2    → gap-2, p-2, m-2
12px = 3    → gap-3, p-3, m-3
16px = 4    → gap-4, p-4, m-4
20px = 5    → gap-5, p-5, m-5
24px = 6    → gap-6, p-6, m-6
32px = 8    → gap-8, p-8, m-8
40px = 10   → gap-10, p-10, m-10
48px = 12   → gap-12, p-12, m-12
```

**Standardization Rule:** Use only Tailwind spacing scale (no arbitrary values like `py-2.5` → use `py-2` or `py-3`)

---

## Component-by-Component Redesign Plan

## 1. BookingWizard.tsx (Main Container)

### Current Issues:
- Fixed bottom price summary can overlap content on short mobile screens
- Header "Back to Home" link hard to tap on mobile (small target)
- Embedded mode prop but inconsistent spacing

### Redesign Changes:

**Mobile (< 640px):**
```tsx
// 1. Larger touch-friendly header
<div className="bg-base-100/80 backdrop-blur-sm border-b border-base-300">
  <div className="container mx-auto px-4 py-3">
    <div className="flex items-center justify-between">
      {/* Back button - larger touch target */}
      <Link
        href="/"
        className="btn btn-ghost btn-sm gap-2 -ml-2"
        aria-label="Back to home"
      >
        <svg className="w-5 h-5" {...} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      <h1 className="text-base font-bold text-base-content">Book Appointment</h1>

      {/* Close button option */}
      <button className="btn btn-ghost btn-sm btn-circle" aria-label="Close">
        <svg className="w-5 h-5" {...} />
      </button>
    </div>
  </div>
</div>

// 2. Improved mobile price summary with safe area
<div className="lg:hidden fixed bottom-0 left-0 right-0 z-50
                bg-base-100/95 backdrop-blur-lg border-t border-base-300
                shadow-[0_-4px_16px_rgba(0,0,0,0.1)]
                pb-safe"> {/* iOS safe area */}
  <div className="px-4 py-3">
    {/* Swipe indicator for collapsible version */}
    <div className="w-12 h-1 bg-base-300 rounded-full mx-auto mb-3" />

    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-base-content/60">Total</p>
        <p className="text-2xl font-bold text-primary">
          ${totalPrice.toFixed(2)}
        </p>
      </div>

      {selectedService && (
        <div className="text-right">
          <p className="text-sm font-semibold text-base-content">
            {selectedService.name}
          </p>
          {selectedAddons.length > 0 && (
            <p className="text-xs text-base-content/60">
              +{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>

    {/* Optional: Tap to expand full breakdown */}
    <button className="text-xs text-primary mt-2 w-full text-center">
      Tap for details
    </button>
  </div>
</div>

// 3. Dynamic bottom padding based on fixed elements
{showPriceSummary && (
  <div className="lg:hidden h-28" /> {/* Prevent content overlap */}
)}
```

**Tablet (640px - 1024px):**
```tsx
// Side-by-side layout starts at md, not lg
<div className={showPriceSummary ? 'md:grid md:grid-cols-3 md:gap-6 lg:gap-8' : ''}>
  <div className={showPriceSummary ? 'md:col-span-2' : ''}>
    {/* Step content */}
  </div>

  {showPriceSummary && (
    <div className="hidden md:block">
      <div className="sticky top-6"> {/* Closer to top on tablet */}
        <PriceSummary {...} />
      </div>
    </div>
  )}
</div>
```

**Desktop (> 1024px):**
```tsx
// Optimized max-width for content
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl">
  {/* Content with better max-width constraints */}
</div>
```

**Key Improvements:**
1. Larger touch targets for mobile navigation (44x44px minimum)
2. Fixed bottom summary with swipe indicator and safe area support
3. Progressive enhancement: mobile → tablet → desktop layouts
4. Better spacing hierarchy using Tailwind scale only
5. Improved z-index management for overlays

---

## 2. BookingProgress.tsx (Progress Indicator)

### Current Issues:
- Mobile compact view lacks visual engagement
- Desktop stepper circles could be larger for better click targets
- Animation on current step is subtle

### Redesign Changes:

**Mobile (< 640px):**
```tsx
<div className="md:hidden px-4 py-4">
  {/* Step counter with better visual hierarchy */}
  <div className="flex items-center justify-between mb-3">
    <div>
      <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">
        Step {currentStep + 1} of {visibleSteps.length}
      </span>
      <h2 className="text-base font-bold text-primary mt-0.5">
        {visibleSteps[currentStep] || 'Complete'}
      </h2>
    </div>

    {/* Optional: Show completion percentage */}
    <div className="text-right">
      <span className="text-2xl font-bold text-primary">
        {Math.round(((currentStep + 1) / visibleSteps.length) * 100)}%
      </span>
      <span className="text-xs text-base-content/60 block">Done</span>
    </div>
  </div>

  {/* Enhanced progress bar */}
  <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden shadow-inner">
    <motion.div
      className="bg-gradient-to-r from-primary to-primary-focus h-3 rounded-full
                 shadow-md relative overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Animated shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent
                   via-base-100/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  </div>

  {/* Mini step indicators below bar */}
  <div className="flex justify-between mt-2 px-1">
    {visibleSteps.map((label, index) => (
      <div
        key={label}
        className={cn(
          'w-1.5 h-1.5 rounded-full transition-colors',
          index <= currentStep ? 'bg-primary' : 'bg-base-300'
        )}
      />
    ))}
  </div>
</div>
```

**Desktop (> 768px):**
```tsx
<div className="hidden md:flex items-center justify-between max-w-4xl mx-auto px-4 py-6">
  {visibleSteps.map((label, index) => {
    const isCompleted = index < currentStep;
    const isCurrent = index === currentStep;
    const isClickable = canNavigateToStep?.(index) ?? false;

    return (
      <div key={label} className="flex items-center flex-1 last:flex-none">
        {/* Enhanced step circle - larger touch target */}
        <button
          onClick={() => isClickable && onStepClick?.(index)}
          disabled={!isClickable}
          className={cn(
            'flex flex-col items-center gap-3 group transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-xl p-2',
            isClickable && 'cursor-pointer hover:scale-105',
            !isClickable && 'cursor-default'
          )}
          aria-current={isCurrent ? 'step' : undefined}
          aria-label={`${label}${isCompleted ? ' - Completed' : ''}${isCurrent ? ' - Current' : ''}`}
        >
          {/* Larger circle with better animation */}
          <motion.div
            className={cn(
              'relative w-12 h-12 rounded-full flex items-center justify-center
               text-sm font-semibold transition-all duration-300 shadow-lg',
              isCompleted && 'bg-primary text-primary-content shadow-primary/30',
              isCurrent && 'bg-primary text-primary-content ring-4 ring-primary/30 shadow-primary/40',
              !isCompleted && !isCurrent && 'bg-base-200 text-base-content/40 shadow-sm',
              isClickable && !isCurrent && 'group-hover:bg-base-300 group-hover:shadow-md'
            )}
            animate={isCurrent ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                '0 4px 16px rgba(67, 78, 84, 0.25)',
                '0 8px 24px rgba(67, 78, 84, 0.35)',
                '0 4px 16px rgba(67, 78, 84, 0.25)'
              ]
            } : {}}
            transition={{
              repeat: isCurrent ? Infinity : 0,
              duration: 2.5,
              ease: "easeInOut"
            }}
          >
            {/* Background glow effect for current step */}
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            )}

            {isCompleted ? (
              <motion.svg
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-6 h-6 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            ) : (
              <span className="relative z-10">{index + 1}</span>
            )}
          </motion.div>

          {/* Step label */}
          <span
            className={cn(
              'text-xs font-semibold transition-colors text-center max-w-[80px]',
              isCurrent && 'text-primary',
              isCompleted && 'text-primary/80',
              !isCompleted && !isCurrent && 'text-base-content/50',
              isClickable && 'group-hover:text-primary/70'
            )}
          >
            {label}
          </span>
        </button>

        {/* Enhanced connector line */}
        {index < visibleSteps.length - 1 && (
          <div className="flex-1 h-1 mx-3 bg-base-200 rounded-full relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-focus rounded-full"
              initial={{ width: 0 }}
              animate={{ width: isCompleted ? '100%' : '0%' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
      </div>
    );
  })}
</div>
```

**Key Improvements:**
1. Mobile: Larger percentage display, shimmer animation on progress bar
2. Desktop: Larger step circles (48px), better hover/focus states
3. Animated checkmarks on completed steps
4. Improved accessibility with ARIA labels and focus-visible states
5. Gradient progress fills for visual polish

---

## 3. PriceSummary.tsx (Desktop Sidebar)

### Current Issues:
- Good foundation but could use enhanced visual hierarchy
- Static appearance, lacks micro-interactions

### Redesign Changes:

```tsx
export function PriceSummary({ serviceName, servicePrice, addons, total }: PriceSummaryProps) {
  const hasItems = serviceName !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-base-300"
    >
      {/* Enhanced header with gradient */}
      <div className="bg-gradient-to-br from-secondary via-secondary to-base-200 px-6 py-4 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          {/* SVG pattern or decorative element */}
        </div>

        <h3 className="font-bold text-primary flex items-center gap-2.5 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          Order Summary
        </h3>
      </div>

      {/* Enhanced content */}
      <div className="p-6 space-y-5">
        {!hasItems ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            {/* Empty state illustration */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
              <svg className="w-10 h-10 text-base-content/30" {...} />
            </div>
            <p className="text-base-content/60 text-sm">
              Select a service to see pricing
            </p>
          </motion.div>
        ) : (
          <>
            {/* Service with enhanced styling */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-base-content">{serviceName}</p>
                <p className="text-xs text-base-content/60 mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" {...} />
                  Base service
                </p>
              </div>
              <motion.span
                key={servicePrice}
                initial={{ scale: 1.15, color: '#4ECDC4' }}
                animate={{ scale: 1, color: '#434E54' }}
                transition={{ duration: 0.3 }}
                className="font-bold text-base-content text-lg"
              >
                {formatCurrency(servicePrice)}
              </motion.span>
            </motion.div>

            {/* Add-ons with stagger animation */}
            <AnimatePresence mode="popLayout">
              {addons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4 border-t border-base-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-warning" {...} />
                    </div>
                    <p className="text-sm font-semibold text-base-content/70">
                      Add-ons ({addons.length})
                    </p>
                  </div>

                  {addons.map((addon, index) => (
                    <motion.div
                      key={addon.name}
                      initial={{ opacity: 0, y: -10, x: -10 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: -10, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center text-sm pl-8 group"
                    >
                      <span className="text-base-content/70 group-hover:text-base-content transition-colors">
                        {addon.name}
                      </span>
                      <span className="font-semibold text-base-content">
                        {formatCurrency(addon.price)}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced total section */}
            <div className="border-t-2 border-base-300 pt-5 mt-5">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-base-content">Total</span>
                <div className="text-right">
                  <motion.span
                    key={total}
                    initial={{ scale: 1.2, y: -5 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-3xl font-bold text-primary block"
                  >
                    {formatCurrency(total)}
                  </motion.span>
                  <span className="text-xs text-base-content/60 mt-1 block">
                    USD
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced footer */}
      <div className="px-6 py-4 bg-base-200/50 border-t border-base-300">
        <div className="flex items-center gap-2 justify-center">
          <svg className="w-4 h-4 text-success" {...} />
          <p className="text-xs text-base-content/70 text-center">
            Payment collected at checkout
          </p>
        </div>
      </div>
    </motion.div>
  );
}
```

**Key Improvements:**
1. Stagger animations for add-ons appearing/disappearing
2. Scale + color pulse on price changes
3. Enhanced empty state with illustration
4. Better visual hierarchy with icons and sections
5. Gradient header with subtle pattern overlay

---

## 4. CalendarPicker.tsx (Date Selection)

### Current Issues:
- Calendar cells can be small on mobile (< 40px)
- Touch targets for month navigation could be larger
- Legend takes up space on small screens

### Redesign Changes:

**Mobile (< 640px):**
```tsx
<div className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-3 sm:p-4">
  {/* Compact month navigation */}
  <div className="flex items-center justify-between mb-4">
    <button
      onClick={handlePrevMonth}
      disabled={!canGoPrev}
      className={cn(
        'btn btn-sm btn-circle btn-ghost',
        !canGoPrev && 'btn-disabled opacity-30'
      )}
      aria-label="Previous month"
    >
      <svg className="w-5 h-5" {...} />
    </button>

    <h3 className="text-base sm:text-lg font-bold text-primary">
      {MONTHS[currentMonth.month]} {currentMonth.year}
    </h3>

    <button
      onClick={handleNextMonth}
      disabled={!canGoNext}
      className={cn(
        'btn btn-sm btn-circle btn-ghost',
        !canGoNext && 'btn-disabled opacity-30'
      )}
      aria-label="Next month"
    >
      <svg className="w-5 h-5" {...} />
    </button>
  </div>

  {/* Compact day headers */}
  <div className="grid grid-cols-7 gap-1 mb-2">
    {DAYS_OF_WEEK.map((day) => (
      <div
        key={day}
        className="text-center text-[10px] sm:text-xs font-medium text-base-content/60 py-1"
      >
        {/* Show only first letter on very small screens */}
        <span className="sm:hidden">{day.charAt(0)}</span>
        <span className="hidden sm:inline">{day}</span>
      </div>
    ))}
  </div>

  {/* Enhanced calendar grid with larger touch targets */}
  <div className="grid grid-cols-7 gap-1 sm:gap-2">
    {calendarDays.map(({ date, dateString }, index) => {
      const disabled = isDateDisabled(dateString, date);
      const selected = dateString === selectedDate;
      const todayDate = isToday(date);

      if (!date) {
        return <div key={`empty-${index}`} className="aspect-square" />;
      }

      return (
        <motion.button
          key={dateString}
          onClick={() => !disabled && onDateSelect(dateString!)}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.92 } : {}}
          className={cn(
            // Larger minimum size for touch
            'aspect-square min-h-[44px] flex items-center justify-center',
            'rounded-lg text-sm font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
            disabled && 'opacity-30 cursor-not-allowed text-base-content/40',
            !disabled && !selected && 'hover:bg-secondary text-base-content active:bg-base-300',
            selected && 'bg-primary text-primary-content shadow-lg shadow-primary/30 font-bold',
            todayDate && !selected && 'ring-2 ring-primary/40 font-semibold bg-primary/5'
          )}
          aria-label={date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
          aria-pressed={selected}
          aria-disabled={disabled}
        >
          <span className="relative z-10">{date.getDate()}</span>

          {/* Dot indicator for special dates (e.g., peak hours, promotions) */}
          {!disabled && !selected && someSpecialCondition && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-warning" />
          )}
        </motion.button>
      );
    })}
  </div>

  {/* Responsive legend */}
  <div className="mt-4 pt-4 border-t border-base-300">
    {/* Mobile: Compact horizontal layout */}
    <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-primary shadow-sm" />
        <span className="text-base-content/70">Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded ring-2 ring-primary/40 bg-primary/5" />
        <span className="text-base-content/70">Today</span>
      </div>
      {/* Hide unavailable on very small screens */}
      <div className="hidden xs:flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-base-300 opacity-50" />
        <span className="text-base-content/70">Unavailable</span>
      </div>
    </div>
  </div>
</div>
```

**Desktop (> 768px):**
```tsx
// Wider spacing, better hover states
<div className="grid grid-cols-7 gap-2">
  {calendarDays.map(({ date, dateString }, index) => {
    // ... existing logic ...

    return (
      <motion.button
        key={dateString}
        onClick={() => !disabled && onDateSelect(dateString!)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.15, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={cn(
          'aspect-square min-h-[48px] flex items-center justify-center',
          'rounded-xl text-base font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          disabled && 'opacity-30 cursor-not-allowed text-base-content/40',
          !disabled && !selected && 'hover:bg-secondary hover:shadow-md text-base-content',
          selected && 'bg-primary text-primary-content shadow-xl shadow-primary/40 font-bold scale-105',
          todayDate && !selected && 'ring-2 ring-primary/50 font-semibold bg-primary/10'
        )}
        aria-label={date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}
      >
        {date.getDate()}
      </motion.button>
    );
  })}
</div>
```

**Key Improvements:**
1. Minimum 44x44px touch targets on mobile (accessibility)
2. Day headers show only first letter on very small screens
3. Better animations with scale + y-axis movement on hover
4. Selected dates have shadow and scale for emphasis
5. Today indicator uses ring + background tint
6. Responsive legend that adapts to screen size

---

## 5. TimeSlotGrid.tsx (Time Selection)

### Current Issues:
- 4-column grid on desktop can be too wide
- Touch targets could be larger on mobile
- Waitlist slots visually similar to unavailable slots
- Loading skeleton doesn't match final layout

### Redesign Changes:

**Responsive Grid:**
```tsx
<div className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-4">
  <div className="flex items-center justify-between mb-4">
    <h4 className="font-semibold text-base-content flex items-center gap-2">
      <svg className="w-5 h-5 text-primary" {...} />
      Available Times
    </h4>
    <span className="badge badge-primary badge-outline">
      {availableSlots.length} slots
    </span>
  </div>

  {/* Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
  {availableSlots.length > 0 && (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
      {availableSlots.map((slot) => (
        <motion.button
          key={slot.time}
          onClick={() => onTimeSelect(slot.time)}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            // Enhanced touch targets
            'py-3 px-4 rounded-lg font-medium transition-all duration-200',
            'min-h-[52px] flex items-center justify-center', // Larger minimum height
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
            selectedTime === slot.time
              ? 'bg-primary text-primary-content shadow-lg shadow-primary/30 font-bold'
              : 'bg-secondary hover:bg-base-300 text-base-content active:bg-base-300/80'
          )}
          aria-pressed={selectedTime === slot.time}
          aria-label={`Book appointment at ${formatTimeDisplay(slot.time)}`}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base font-bold">
              {formatTimeDisplay(slot.time)}
            </span>
            {/* Optional: Show slot capacity indicator */}
            {slot.spotsRemaining && slot.spotsRemaining <= 2 && (
              <span className="text-[10px] text-warning font-medium">
                {slot.spotsRemaining} left
              </span>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  )}

  {/* Enhanced waitlist section */}
  {unavailableSlots.length > 0 && onJoinWaitlist && (
    <div className="mt-6 pt-6 border-t border-base-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-warning" {...} />
        </div>
        <h5 className="text-sm font-semibold text-base-content">
          Join Waitlist
        </h5>
      </div>

      <p className="text-xs text-base-content/60 mb-3">
        Get notified if a spot opens up at these fully booked times
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {unavailableSlots.slice(0, 6).map((slot) => (
          <motion.button
            key={slot.time}
            onClick={() => onJoinWaitlist(slot.time)}
            whileHover={{ scale: 1.02, borderColor: 'rgb(255, 179, 71)' }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'py-3 px-3 rounded-lg transition-all duration-200 min-h-[56px]',
              'bg-base-100 border-2 border-dashed border-warning/40',
              'hover:border-warning hover:bg-warning/5 active:bg-warning/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:ring-offset-2',
              'flex flex-col items-center justify-center gap-1'
            )}
            aria-label={`Join waitlist for ${formatTimeDisplay(slot.time)}`}
          >
            <span className="text-sm text-base-content/50 line-through font-medium">
              {formatTimeDisplay(slot.time)}
            </span>
            <span className="text-xs text-warning font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" {...} />
              Waitlist
            </span>
          </motion.button>
        ))}
      </div>

      {unavailableSlots.length > 6 && (
        <p className="text-xs text-base-content/60 mt-3 text-center">
          +{unavailableSlots.length - 6} more fully booked slots
        </p>
      )}
    </div>
  )}
</div>
```

**Enhanced Loading State:**
```tsx
if (loading) {
  return (
    <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>

      {/* Match actual grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="skeleton h-[52px] rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
```

**Key Improvements:**
1. Responsive grid: 2→3→4 columns as screen grows
2. Larger minimum heights (52px) for better touch targets
3. Waitlist slots clearly differentiated with dashed border + icon
4. "Spots remaining" indicator for urgency
5. Loading skeleton matches actual layout
6. Better visual hierarchy with icons and badges

---

## 6. ServiceCard.tsx (Service Selection Cards)

### Current Issues:
- Cards in 3-column grid can be too wide on large screens
- Image aspect ratio fixed at h-48 may not work for all images
- Price range display could be clearer

### Redesign Changes:

```tsx
export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  const priceRange = getServicePriceRange(service);

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-base-100 rounded-2xl overflow-hidden',
        'transition-all duration-300 group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        isSelected
          ? 'shadow-2xl ring-2 ring-primary scale-[1.02]'
          : 'shadow-lg hover:shadow-2xl'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${service.name} service`}
    >
      {/* Enhanced image container */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary to-base-200 overflow-hidden">
        {service.image_url ? (
          <>
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                "group-hover:scale-110"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-base-content/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/20">
            <svg className="w-20 h-20" {...placeholderIcon} />
          </div>
        )}

        {/* Enhanced selected indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-3 right-3 w-12 h-12 bg-primary rounded-full
                         flex items-center justify-center shadow-lg shadow-primary/50
                         ring-4 ring-base-100"
            >
              <svg
                className="w-7 h-7 text-primary-content"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular badge (example) */}
        {service.is_popular && (
          <div className="absolute top-3 left-3 badge badge-warning badge-sm gap-1">
            <svg className="w-3 h-3" {...starIcon} />
            Popular
          </div>
        )}
      </div>

      {/* Enhanced content */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-base-content text-lg sm:text-xl leading-tight">
            {service.name}
          </h3>

          {/* Duration badge */}
          <div className="badge badge-ghost badge-sm gap-1 flex-shrink-0">
            <svg className="w-3.5 h-3.5" {...clockIcon} />
            {formatDuration(service.duration_minutes)}
          </div>
        </div>

        {service.description && (
          <p className="text-sm text-base-content/70 line-clamp-2 mb-4 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Enhanced pricing section */}
        <div className="flex items-end justify-between pt-4 border-t border-base-200">
          <div>
            <p className="text-xs text-base-content/60 mb-1">
              {priceRange.min !== priceRange.max ? 'Starting at' : 'Price'}
            </p>
            <span className="text-2xl font-bold text-primary">
              {priceRange.formatted}
            </span>
            {priceRange.min !== priceRange.max && (
              <p className="text-xs text-base-content/60 mt-1">
                Based on pet size
              </p>
            )}
          </div>

          {/* CTA indicator */}
          <motion.div
            animate={isSelected ? { x: [0, 4, 0] } : {}}
            transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5 }}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'transition-colors duration-300',
              isSelected
                ? 'bg-primary text-primary-content'
                : 'bg-secondary group-hover:bg-base-300'
            )}
          >
            <svg className="w-5 h-5" {...arrowRightIcon} />
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}
```

**Key Improvements:**
1. 4:3 aspect ratio for images (more flexible than fixed height)
2. Image zoom on hover for interactivity
3. Larger selected checkmark with ring
4. Popular badge for featured services
5. Animated arrow CTA indicator
6. Better price display with "Starting at" label
7. Duration badge in corner
8. Gradient overlay on hover for depth

---

## 7. PetCard.tsx & AddPetCard (Pet Selection)

### Current Issues:
- Horizontal layout can be cramped on small screens
- Avatar could be larger for visual impact
- AddPetCard could be more inviting

### Redesign Changes:

```tsx
export function PetCard({ pet, isSelected, onSelect }: PetCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-base-100 rounded-xl overflow-hidden',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        isSelected
          ? 'shadow-xl ring-2 ring-primary'
          : 'shadow-md hover:shadow-lg'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${pet.name}`}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {/* Larger avatar with better states */}
        <div className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0',
          'ring-2 transition-all duration-300',
          'w-16 h-16 sm:w-20 sm:h-20', // Larger on bigger screens
          isSelected
            ? 'ring-primary shadow-lg shadow-primary/30'
            : 'ring-base-200'
        )}>
          {pet.photo_url ? (
            <>
              <Image
                src={pet.photo_url}
                alt={pet.name}
                fill
                className="object-cover"
                sizes="80px"
              />
              {/* Overlay on selection */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20" />
              )}
            </>
          ) : (
            <div className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-gradient-to-br',
              isSelected
                ? 'from-primary/20 to-primary/10'
                : 'from-secondary to-base-200'
            )}>
              <svg
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10',
                  isSelected ? 'text-primary' : 'text-base-content/30'
                )}
                {...pawIcon}
              />
            </div>
          )}
        </div>

        {/* Pet info with better typography */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base-content text-base sm:text-lg truncate mb-1">
            {pet.name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Enhanced size badge */}
            <span className={cn(
              'badge badge-sm font-medium',
              isSelected ? 'badge-primary' : 'badge-secondary'
            )}>
              {getSizeShortLabel(pet.size)}
            </span>

            {/* Breed with better overflow handling */}
            {(pet.breed_custom || pet.breed?.name) && (
              <span className="text-xs text-base-content/60 truncate">
                {pet.breed_custom || pet.breed?.name}
              </span>
            )}
          </div>

          {/* Optional: Show last grooming date */}
          {pet.last_grooming_date && (
            <p className="text-xs text-base-content/50 mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" {...calendarIcon} />
              Last groomed {formatDate(pet.last_grooming_date)}
            </p>
          )}
        </div>

        {/* Enhanced selected indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-10 h-10 bg-primary rounded-full flex items-center
                         justify-center flex-shrink-0 shadow-md shadow-primary/30"
            >
              <svg
                className="w-5 h-5 text-primary-content"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export function AddPetCard({ onClick }: AddPetCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-gradient-to-br from-secondary/50 to-base-100',
        'rounded-xl overflow-hidden border-2 border-dashed border-primary/30',
        'hover:border-primary hover:shadow-lg hover:from-secondary/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        'transition-all duration-300 shadow-md'
      )}
    >
      <div className="p-4 sm:p-5 flex items-center gap-4">
        {/* Animated plus icon */}
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full
                     bg-primary/10 flex items-center justify-center
                     flex-shrink-0 shadow-sm border-2 border-primary/20"
        >
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>

        {/* Enhanced text */}
        <div className="flex-1">
          <h3 className="font-bold text-primary text-base sm:text-lg mb-1">
            Add New Pet
          </h3>
          <p className="text-xs sm:text-sm text-base-content/60">
            Register a new furry friend
          </p>
        </div>

        {/* Arrow indicator */}
        <svg
          className="w-5 h-5 text-primary flex-shrink-0"
          {...arrowRightIcon}
        />
      </div>
    </motion.button>
  );
}
```

**Key Improvements:**
1. Larger avatars (80px on sm+) for better visual impact
2. Last grooming date display (if available)
3. Animated checkmark with spring physics
4. AddPetCard with gradient background and rotating plus icon
5. Better badge styling that changes on selection
6. Improved overflow handling for long names/breeds

---

## 8. PetForm.tsx (Pet Information Form)

### Current Issues:
- Uses DaisyUI form classes but mixes custom styling
- Size selection grid could be more visual
- Mobile keyboard types not optimized
- No real-time weight validation feedback

### Redesign Changes:

```tsx
export function PetForm({ onSubmit, onCancel, initialData }: PetFormProps) {
  // ... existing state and logic ...

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="pet-form">
      {/* Pet name - optimized for mobile */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold text-base-content">
            Pet Name <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          placeholder="Enter your pet's name"
          autoComplete="given-name"
          className={cn(
            'input input-bordered w-full text-base',
            errors.name && 'input-error'
          )}
          {...register('name')}
        />
        <AnimatePresence>
          {errors.name && (
            <motion.label
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="label"
            >
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg className="w-3.5 h-3.5" {...errorIcon} />
                {errors.name.message}
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced pet size selection with visual cards */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold text-base-content">
            Pet Size <span className="text-error">*</span>
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {PET_SIZES.map((size) => {
            const sizeInfo = PET_SIZE_INFO[size]; // New constant with icons
            const isSelected = selectedSize === size;

            return (
              <label
                key={size}
                className={cn(
                  'relative cursor-pointer transition-all duration-200',
                  'rounded-xl border-2 overflow-hidden',
                  'focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-base-300 hover:border-primary/50 hover:shadow-md'
                )}
              >
                <input
                  type="radio"
                  value={size}
                  className="sr-only"
                  {...register('size')}
                />

                <div className="p-4 text-center">
                  {/* Animated icon */}
                  <motion.div
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/50'
                    )}
                  >
                    <svg className="w-6 h-6" {...sizeInfo.icon} />
                  </motion.div>

                  <span className={cn(
                    'block font-semibold mb-1 transition-colors',
                    isSelected ? 'text-primary' : 'text-base-content'
                  )}>
                    {getSizeLabel(size)}
                  </span>

                  <span className="block text-xs text-base-content/60">
                    {sizeInfo.weightRange}
                  </span>
                </div>

                {/* Checkmark indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full
                                 flex items-center justify-center shadow-md"
                    >
                      <svg className="w-4 h-4 text-primary-content" {...checkIcon} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            );
          })}
        </div>

        <AnimatePresence>
          {errors.size && (
            <motion.label
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="label"
            >
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg className="w-3.5 h-3.5" {...errorIcon} />
                {errors.size.message}
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {/* Breed selection with improved UX */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold text-base-content">
            Breed
          </span>
          <span className="label-text-alt text-base-content/50">Optional</span>
        </label>

        <select
          className="select select-bordered w-full text-base"
          {...register('breed_id')}
        >
          <option value="">Select a breed or enter custom</option>
          <optgroup label="Popular Breeds">
            {breeds.filter(b => b.is_popular).map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="All Breeds">
            {breeds.filter(b => !b.is_popular).map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Animated custom breed input */}
        <AnimatePresence>
          {!selectedBreedId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="text"
                placeholder="Or enter breed name (e.g., Labradoodle)"
                autoComplete="off"
                className="input input-bordered w-full mt-3 text-base"
                {...register('breed_custom')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weight with live validation and unit display */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold text-base-content">
            Weight
          </span>
          <span className="label-text-alt text-base-content/50">Optional</span>
        </label>

        <div className="relative">
          <input
            type="number"
            inputMode="decimal" // Better mobile keyboard
            step="0.1"
            min="0"
            max="300"
            placeholder="0.0"
            className={cn(
              'input input-bordered w-full text-base pr-12',
              errors.weight && 'input-error'
            )}
            {...register('weight', { valueAsNumber: true })}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50 text-sm font-medium">
            lbs
          </span>
        </div>

        {/* Live weight feedback */}
        {watchedWeight > 0 && !errors.weight && (
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="label"
          >
            <span className="label-text-alt text-info flex items-center gap-1">
              <svg className="w-3.5 h-3.5" {...infoIcon} />
              {getSizeFromWeight(watchedWeight)} size range
            </span>
          </motion.label>
        )}

        <AnimatePresence>
          {errors.weight && (
            <motion.label
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="label"
            >
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg className="w-3.5 h-3.5" {...errorIcon} />
                {errors.weight.message}
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {/* Notes with character counter */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold text-base-content">
            Special Notes
          </span>
          <span className="label-text-alt text-base-content/50">
            {watchedNotes?.length || 0}/500
          </span>
        </label>

        <textarea
          placeholder="Any special instructions or notes about your pet (e.g., temperament, health concerns)"
          className={cn(
            'textarea textarea-bordered w-full text-base resize-none',
            errors.notes && 'textarea-error'
          )}
          rows={4}
          maxLength={500}
          {...register('notes')}
        />

        <AnimatePresence>
          {errors.notes && (
            <motion.label
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="label"
            >
              <span className="label-text-alt text-error flex items-center gap-1">
                <svg className="w-3.5 h-3.5" {...errorIcon} />
                {errors.notes.message}
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced action buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost flex-1 sm:flex-initial"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'btn btn-primary flex-1',
            isSubmitting && 'loading'
          )}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Saving Pet...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" {...saveIcon} />
              Save Pet
            </>
          )}
        </button>
      </div>
    </form>
  );
}
```

**Additional Constants Needed:**
```tsx
const PET_SIZE_INFO = {
  small: {
    icon: smallDogIcon,
    weightRange: '0-18 lbs',
  },
  medium: {
    icon: mediumDogIcon,
    weightRange: '19-35 lbs',
  },
  large: {
    icon: largeDogIcon,
    weightRange: '36-65 lbs',
  },
  xlarge: {
    icon: xlargeDogIcon,
    weightRange: '66+ lbs',
  },
} as const;
```

**Key Improvements:**
1. Visual size selection with icons and weight ranges
2. inputMode="decimal" for better mobile number keyboard
3. Live weight feedback showing size category
4. Character counter for notes field
5. Breed dropdown with optgroups (popular vs all)
6. Animated error messages with icons
7. Better form control sizing (text-base for mobile readability)
8. DaisyUI loading state on submit button

---

## 9. AddonCard.tsx (Add-on Selection)

### Current Issues:
- Good foundation but checkbox could be larger on mobile
- Upsell styling could be more prominent

### Redesign Changes:

```tsx
export function AddonCard({ addon, isSelected, isUpsell = false, onToggle }: AddonCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      layout
      className={cn(
        'w-full text-left bg-base-100 rounded-xl overflow-hidden',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isSelected
          ? 'shadow-lg ring-2 ring-primary focus-visible:ring-primary/50'
          : 'shadow-md hover:shadow-lg',
        isUpsell && !isSelected && 'ring-2 ring-warning/40 bg-warning/5 focus-visible:ring-warning/50'
      )}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Add'} ${addon.name} add-on`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-4">
        {/* Enhanced checkbox - larger touch target */}
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={cn(
              'w-7 h-7 rounded-lg border-2 flex items-center justify-center',
              'transition-all duration-200 shadow-sm',
              isSelected
                ? 'bg-primary border-primary shadow-primary/30'
                : isUpsell
                ? 'border-warning/50 bg-warning/5'
                : 'border-base-300 bg-base-100'
            )}
          >
            <AnimatePresence mode="wait">
              {isSelected && (
                <motion.svg
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-5 h-5 text-primary-content"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-base-content text-base sm:text-lg leading-tight">
                {addon.name}
              </h3>

              {/* Enhanced upsell badge */}
              {isUpsell && !isSelected && (
                <motion.div
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-1 mt-2"
                >
                  <span className="badge badge-warning badge-sm gap-1">
                    <svg className="w-3 h-3" {...starIcon} />
                    Recommended
                  </span>
                </motion.div>
              )}
            </div>

            {/* Animated price */}
            <motion.span
              animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
              className={cn(
                'text-lg sm:text-xl font-bold flex-shrink-0',
                isSelected ? 'text-primary' : 'text-base-content'
              )}
            >
              +{formatCurrency(addon.price)}
            </motion.span>
          </div>

          {/* Description */}
          {addon.description && (
            <p className="text-sm text-base-content/70 leading-relaxed mb-3">
              {addon.description}
            </p>
          )}

          {/* Enhanced upsell prompt */}
          {isUpsell && addon.upsell_prompt && !isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-warning/10 rounded-lg border border-warning/20"
            >
              <p className="text-sm text-warning font-medium flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" {...lightbulbIcon} />
                <span>{addon.upsell_prompt}</span>
              </p>
            </motion.div>
          )}

          {/* Duration or other metadata */}
          {addon.duration_minutes && (
            <p className="text-xs text-base-content/50 mt-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" {...clockIcon} />
              Adds {formatDuration(addon.duration_minutes)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
```

**Key Improvements:**
1. Larger checkbox (28x28px) for better mobile usability
2. Animated checkmark with spring physics
3. Enhanced upsell prompt in highlighted box
4. Price pulses when selected
5. Duration metadata display
6. Better upsell visual treatment with ring + background tint
7. Layout animation for smooth reordering

---

## 10-15. Step Components (ServiceStep, PetStep, DateTimeStep, AddonsStep, ReviewStep, ConfirmationStep)

### Universal Step Improvements:

**All Steps Should Have:**

1. **Consistent Header Pattern:**
```tsx
<div className="space-y-6">
  {/* Enhanced header with icon */}
  <div className="relative">
    <div className="flex items-start gap-4 mb-2">
      <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
        <svg className="w-6 h-6 text-primary" {...stepIcon} />
      </div>

      <div className="flex-1">
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
          {stepTitle}
        </h2>
        <p className="text-base-content/70 leading-relaxed text-sm sm:text-base">
          {stepDescription}
        </p>
      </div>
    </div>

    {/* Optional: Step number indicator */}
    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full
                    flex items-center justify-center text-primary text-sm font-bold">
      {stepNumber}
    </div>
  </div>

  {/* Step content */}
  {/* ... */}
</div>
```

2. **Consistent Navigation Pattern:**
```tsx
<div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-base-300 mt-8">
  {/* Back button */}
  {!isFirstStep && (
    <button
      onClick={prevStep}
      className="btn btn-ghost gap-2"
    >
      <svg className="w-5 h-5" {...arrowLeftIcon} />
      <span className="hidden sm:inline">Back</span>
      <span className="sm:hidden">Back</span>
    </button>
  )}

  {/* Primary action */}
  <button
    onClick={handleContinue}
    disabled={!canContinue}
    className={cn(
      'btn btn-primary gap-2 flex-1 sm:flex-initial sm:min-w-[200px]',
      canContinue && 'btn-animated' // Custom class for pulse effect
    )}
  >
    {isLastStep ? (
      <>
        <svg className="w-5 h-5" {...checkIcon} />
        Confirm Booking
      </>
    ) : (
      <>
        Continue
        <svg className="w-5 h-5" {...arrowRightIcon} />
      </>
    )}
  </button>
</div>
```

3. **Loading States:**
```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-7 w-2/3" />
          <div className="skeleton h-4 w-full" />
        </div>
      </div>

      {/* Content skeleton matching actual layout */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

4. **Error States:**
```tsx
if (error) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* ... */}

      <div className="alert alert-error">
        <svg className="w-6 h-6" {...errorIcon} />
        <div>
          <h3 className="font-bold">Failed to Load {resourceName}</h3>
          <p className="text-sm">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-sm btn-ghost"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

5. **Empty States:**
```tsx
<div className="py-12 text-center">
  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
    <svg className="w-10 h-10 text-base-content/30" {...emptyIcon} />
  </div>
  <h3 className="text-lg font-semibold text-base-content mb-2">
    {emptyTitle}
  </h3>
  <p className="text-base-content/60 mb-6 max-w-md mx-auto">
    {emptyDescription}
  </p>
  {emptyAction && (
    <button className="btn btn-primary" onClick={emptyAction.onClick}>
      {emptyAction.label}
    </button>
  )}
</div>
```

### Step-Specific Enhancements:

**ServiceStep.tsx:**
```tsx
// Grid optimization
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {bookableServices.map((service) => (
    <ServiceCard key={service.id} {...} />
  ))}
</div>

// Add filter/sort if > 6 services
{bookableServices.length > 6 && (
  <div className="flex flex-wrap gap-2 mb-6">
    <button className="btn btn-sm btn-outline">All Services</button>
    <button className="btn btn-sm btn-ghost">Grooming</button>
    <button className="btn btn-sm btn-ghost">Day Care</button>
  </div>
)}
```

**PetStep.tsx:**
```tsx
// Stacked list for better mobile UX
<div className="space-y-3">
  {pets.map((pet) => (
    <PetCard key={pet.id} {...} />
  ))}
  <AddPetCard {...} />
</div>

// Enhanced new pet success banner
{newPetData && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="alert alert-success"
  >
    <svg className="w-6 h-6" {...checkIcon} />
    <div>
      <h4 className="font-bold">New pet: {newPetData.name}</h4>
      <p className="text-sm">Will be created when you confirm booking</p>
    </div>
    <button className="btn btn-sm btn-ghost" onClick={() => setShowForm(true)}>
      Edit
    </button>
  </motion.div>
)}
```

**DateTimeStep.tsx:**
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
  <div>
    <CalendarPicker {...} />
  </div>

  <div>
    {selectedDate ? (
      <TimeSlotGrid {...} />
    ) : (
      <div className="bg-base-100 rounded-xl border-2 border-dashed border-base-300
                      p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-base-content/30" {...calendarIcon} />
        </div>
        <p className="text-base-content/60">
          Select a date to see available times
        </p>
      </div>
    )}
  </div>
</div>
```

**AddonsStep.tsx:**
```tsx
// Enhanced summary with total savings indicator
<AnimatePresence>
  {selectedAddons.length > 0 && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="alert alert-info"
    >
      <svg className="w-6 h-6" {...infoIcon} />
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="font-semibold">
            {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
          </span>
          <span className="text-lg font-bold">
            +{formatCurrency(addonsTotal)}
          </span>
        </div>
        {/* Optional: Show savings if bundle pricing exists */}
        {bundleSavings > 0 && (
          <p className="text-sm text-success mt-1">
            Save ${bundleSavings.toFixed(2)} with this combo!
          </p>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>

// Skip button when no add-ons selected
{selectedAddons.length === 0 && (
  <button
    onClick={handleSkip}
    className="btn btn-ghost w-full sm:w-auto"
  >
    Skip Add-ons
  </button>
)}
```

**ReviewStep.tsx:**
```tsx
// Enhanced summary card
<div className="card bg-base-100 shadow-xl border border-base-300">
  <div className="card-body p-0">
    {/* Each section as editable rows */}
    <div className="p-4 sm:p-5 border-b border-base-300 hover:bg-base-200/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" {...serviceIcon} />
          </div>
          <div>
            <p className="text-xs text-base-content/60 mb-1">Service</p>
            <p className="font-semibold text-base-content">{selectedService?.name}</p>
            <p className="text-sm text-base-content/60">
              {formatDuration(selectedService?.duration_minutes || 0)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep(0)}
          className="btn btn-ghost btn-sm gap-1"
        >
          <svg className="w-4 h-4" {...editIcon} />
          Edit
        </button>
      </div>
    </div>

    {/* Similar sections for pet, date/time, addons */}

    {/* Total section with emphasis */}
    <div className="p-4 sm:p-5 bg-gradient-to-br from-secondary/30 to-base-200/50">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-bold text-base-content">Total</span>
        <span className="text-3xl font-bold text-primary">
          {formatCurrency(totalPrice)}
        </span>
      </div>

      {/* Payment info */}
      <div className="flex items-center gap-2 text-sm text-base-content/70">
        <svg className="w-4 h-4 text-success" {...lockIcon} />
        <span>Secure payment at checkout</span>
      </div>
    </div>
  </div>
</div>

// Guest form in separate card
{!isAuthenticated && (
  <div className="card bg-base-100 shadow-xl border border-base-300">
    <div className="card-body">
      <h3 className="card-title text-base">Your Information</h3>
      {guestInfo ? (
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{guestInfo.firstName} {guestInfo.lastName}</p>
            <p className="text-sm text-base-content/60">{guestInfo.email}</p>
            <p className="text-sm text-base-content/60">{guestInfo.phone}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleEditGuestInfo}>
            Edit
          </button>
        </div>
      ) : (
        <GuestInfoForm onSubmit={handleGuestInfoSubmit} />
      )}
    </div>
  </div>
)}
```

**ConfirmationStep.tsx:**

*Note: This file wasn't in the read files, but here's the recommended redesign:*

```tsx
export function ConfirmationStep() {
  const { appointment } = useBookingStore();

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full
                     flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 bg-success rounded-full flex items-center justify-center"
          >
            <svg className="w-12 h-12 text-success-content" {...checkIcon} />
          </motion.div>
        </motion.div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
            Booking Confirmed!
          </h2>
          <p className="text-base-content/70 mb-8 max-w-md mx-auto">
            We can't wait to pamper your pup! You'll receive a confirmation email shortly.
          </p>
        </motion.div>

        {/* Booking summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-base-100 shadow-xl border border-base-300 text-left mb-8"
        >
          <div className="card-body">
            <h3 className="card-title text-base mb-4">Appointment Details</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" {...calendarIcon} />
                <div>
                  <p className="font-medium text-base-content">
                    {formatDate(appointment.date)}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {formatTimeDisplay(appointment.time)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" {...serviceIcon} />
                <div>
                  <p className="font-medium text-base-content">
                    {appointment.serviceName}
                  </p>
                  <p className="text-sm text-base-content/60">
                    for {appointment.petName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5" {...locationIcon} />
                <div>
                  <p className="font-medium text-base-content">
                    Puppy Day
                  </p>
                  <p className="text-sm text-base-content/60">
                    14936 Leffingwell Rd, La Mirada, CA 90638
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/customer/appointments" className="btn btn-primary gap-2">
            <svg className="w-5 h-5" {...dashboardIcon} />
            View My Appointments
          </Link>

          <Link href="/" className="btn btn-ghost gap-2">
            <svg className="w-5 h-5" {...homeIcon} />
            Back to Home
          </Link>
        </motion.div>

        {/* Add to calendar option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 pt-8 border-t border-base-300"
        >
          <p className="text-sm text-base-content/60 mb-3">
            Add to your calendar
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button className="btn btn-sm btn-outline gap-2">
              <svg className="w-4 h-4" {...googleCalendarIcon} />
              Google
            </button>
            <button className="btn btn-sm btn-outline gap-2">
              <svg className="w-4 h-4" {...appleCalendarIcon} />
              Apple
            </button>
            <button className="btn btn-sm btn-outline gap-2">
              <svg className="w-4 h-4" {...outlookIcon} />
              Outlook
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

**Key Improvements for Confirmation:**
1. Animated success checkmark with spring physics
2. Staggered content reveal for delight
3. Clear appointment summary card
4. Multiple CTAs: dashboard, home, add to calendar
5. Address included for easy navigation

---

## Additional Enhancements

### 1. Focus Management & Accessibility

**Auto-focus on step load:**
```tsx
// In each step component
useEffect(() => {
  // Focus first interactive element when step loads
  const firstInput = document.querySelector<HTMLElement>(
    'input:not([disabled]), button:not([disabled]), select:not([disabled])'
  );
  firstInput?.focus();
}, []);
```

**Keyboard navigation:**
```tsx
// In BookingWizard
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Allow Escape to close/go back
    if (e.key === 'Escape' && currentStep > 0) {
      prevStep();
    }

    // Arrow key navigation in progress
    if (e.key === 'ArrowLeft' && canNavigateToStep(currentStep - 1)) {
      setStep(currentStep - 1);
    }
    if (e.key === 'ArrowRight' && canNavigateToStep(currentStep + 1)) {
      setStep(currentStep + 1);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentStep, canNavigateToStep, prevStep, setStep]);
```

**Screen reader announcements:**
```tsx
// Add live region for step changes
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {`Step ${currentStep + 1} of ${BOOKING_STEP_LABELS.length}: ${BOOKING_STEP_LABELS[currentStep]}`}
</div>
```

### 2. Performance Optimizations

**Image optimization:**
```tsx
// ServiceCard, PetCard - ensure proper Image config
<Image
  src={imageUrl}
  alt={altText}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  quality={85}
  loading="lazy"
  placeholder="blur" // If blurDataURL available
/>
```

**Component lazy loading:**
```tsx
// In BookingWizard
const ServiceStep = lazy(() => import('./steps/ServiceStep'));
const PetStep = lazy(() => import('./steps/PetStep'));
// ... etc

// Wrap in Suspense
<Suspense fallback={<LoadingSkeleton />}>
  {renderStep()}
</Suspense>
```

**Memoization:**
```tsx
// Memoize expensive computations
const priceRange = useMemo(
  () => getServicePriceRange(service),
  [service]
);

// Memoize callbacks
const handleSelect = useCallback(() => {
  onSelect(item.id);
}, [onSelect, item.id]);
```

### 3. Animation Performance

**Use GPU acceleration:**
```tsx
// For transforms and opacity only (avoid animating layout properties)
<motion.div
  animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
  // ❌ Avoid: width, height, margin, padding
/>

// Use transform instead of positional properties
className="transform will-change-transform"
```

**Reduce motion for accessibility:**
```tsx
// Respect user preference
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

### 4. Mobile-Specific Enhancements

**Pull-to-refresh on mobile:**
```tsx
// Optional: Native-feeling pull to refresh
useEffect(() => {
  let startY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startY > 0) {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 80) {
        // Trigger refresh
        refetch();
        startY = 0;
      }
    }
  };

  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchmove', handleTouchMove);

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
}, [refetch]);
```

**Haptic feedback (iOS Safari):**
```tsx
// Provide tactile feedback on interactions
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
};

// On button press
<button
  onClick={() => {
    triggerHaptic('medium');
    handleAction();
  }}
>
  Continue
</button>
```

**Safe area insets:**
```tsx
// In global CSS
@supports (padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 1rem);
  }

  .pt-safe {
    padding-top: max(env(safe-area-inset-top), 1rem);
  }
}
```

---

## Implementation Priorities

### Phase 1: Foundation (High Priority)
1. **BookingWizard.tsx** - Fix mobile price summary overlap
2. **BookingProgress.tsx** - Enhance mobile progress bar
3. **CalendarPicker.tsx** - Larger touch targets
4. **TimeSlotGrid.tsx** - Responsive grid layout
5. Update all components to use Tailwind spacing scale (no arbitrary values)

### Phase 2: Visual Enhancements (Medium Priority)
6. **ServiceCard.tsx** - Image zoom, enhanced selected state
7. **PetCard.tsx & AddPetCard** - Larger avatars, better animations
8. **AddonCard.tsx** - Enhanced checkbox, upsell styling
9. **PriceSummary.tsx** - Stagger animations, better hierarchy
10. **PetForm.tsx** - Visual size selection, live validation

### Phase 3: Step Components (Medium Priority)
11. **ServiceStep.tsx** - Add filter/sort if needed
12. **PetStep.tsx** - Enhanced new pet banner
13. **DateTimeStep.tsx** - Better empty states
14. **AddonsStep.tsx** - Bundle savings indicator
15. **ReviewStep.tsx** - Editable summary cards
16. **ConfirmationStep.tsx** - Animated success, calendar export

### Phase 4: Accessibility & Performance (Low Priority)
17. Focus management and keyboard navigation
18. Screen reader announcements
19. Image optimization and lazy loading
20. Reduce motion support
21. Haptic feedback (nice-to-have)

---

## Testing Checklist

### Mobile Testing (< 640px)
- [ ] All touch targets ≥ 44x44px
- [ ] No horizontal scrolling
- [ ] Fixed price summary doesn't overlap content
- [ ] Keyboard displays correct type (numeric for weight, email for email)
- [ ] Forms submit properly on Enter key
- [ ] Animations perform smoothly (60fps)
- [ ] Safe area insets respected on iOS

### Tablet Testing (640px - 1024px)
- [ ] Grid layouts adapt properly (2-3 columns)
- [ ] Side-by-side layouts work at md breakpoint
- [ ] Touch targets still comfortable
- [ ] No awkward spacing or gaps

### Desktop Testing (> 1024px)
- [ ] Max-width constraints prevent overly wide content
- [ ] Hover states work properly
- [ ] Keyboard navigation with Tab/Arrow keys
- [ ] Focus states visible (accessibility)
- [ ] Multi-column grids don't exceed 3-4 columns

### Cross-Browser Testing
- [ ] Chrome/Edge (Blink)
- [ ] Safari (WebKit) - especially iOS Safari
- [ ] Firefox (Gecko)
- [ ] Test on actual devices (not just DevTools)

### Accessibility Testing
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces step changes
- [ ] Form errors read by screen readers
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible
- [ ] Reduced motion preference respected

### Performance Testing
- [ ] Lighthouse Mobile score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth animations (no jank)

---

## File Changes Summary

### Files to Modify (15 total):

**Main Components (9 files):**
1. `src/components/booking/BookingWizard.tsx` - Container, mobile price summary
2. `src/components/booking/BookingProgress.tsx` - Enhanced progress indicator
3. `src/components/booking/PriceSummary.tsx` - Stagger animations, better hierarchy
4. `src/components/booking/CalendarPicker.tsx` - Larger touch targets, better mobile UX
5. `src/components/booking/TimeSlotGrid.tsx` - Responsive grid, enhanced waitlist
6. `src/components/booking/ServiceCard.tsx` - Image zoom, enhanced states
7. `src/components/booking/PetCard.tsx` - Larger avatars, better animations (includes AddPetCard)
8. `src/components/booking/PetForm.tsx` - Visual size selection, live validation
9. `src/components/booking/AddonCard.tsx` - Enhanced checkbox, upsell styling

**Step Components (6 files):**
10. `src/components/booking/steps/ServiceStep.tsx` - Consistent header, grid optimization
11. `src/components/booking/steps/PetStep.tsx` - Enhanced new pet banner, consistent navigation
12. `src/components/booking/steps/DateTimeStep.tsx` - Better empty states, responsive grid
13. `src/components/booking/steps/AddonsStep.tsx` - Bundle savings, enhanced summary
14. `src/components/booking/steps/ReviewStep.tsx` - Editable summary cards
15. `src/components/booking/steps/ConfirmationStep.tsx` - Animated success, calendar export

### Files to Create (Optional):

**Utility Files:**
1. `src/lib/animations.ts` - Reusable animation variants
```tsx
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideIn = (direction: 'left' | 'right' = 'right') => ({
  initial: { x: direction === 'right' ? 50 : -50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: direction === 'right' ? -50 : 50, opacity: 0 },
});

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

2. `src/lib/accessibility.ts` - Accessibility helpers
```tsx
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
```

3. `src/constants/petSizes.ts` - Pet size metadata
```tsx
import type { PetSize } from '@/types/database';

export const PET_SIZE_INFO: Record<PetSize, {
  label: string;
  weightRange: string;
  icon: string; // SVG path or component
  description: string;
}> = {
  small: {
    label: 'Small',
    weightRange: '0-18 lbs',
    icon: 'M12 2c...',
    description: 'Toy breeds like Chihuahuas, Yorkshire Terriers',
  },
  medium: {
    label: 'Medium',
    weightRange: '19-35 lbs',
    icon: 'M12 2c...',
    description: 'Breeds like Beagles, Cocker Spaniels',
  },
  large: {
    label: 'Large',
    weightRange: '36-65 lbs',
    icon: 'M12 2c...',
    description: 'Breeds like Labrador Retrievers, Boxers',
  },
  xlarge: {
    label: 'X-Large',
    weightRange: '66+ lbs',
    icon: 'M12 2c...',
    description: 'Large breeds like Great Danes, Mastiffs',
  },
};

export const getSizeFromWeight = (weight: number): PetSize => {
  if (weight <= 18) return 'small';
  if (weight <= 35) return 'medium';
  if (weight <= 65) return 'large';
  return 'xlarge';
};
```

### Global CSS Updates:

**Add to `src/app/globals.css`:**
```css
/* Mobile-specific optimizations */
@layer utilities {
  /* Safe area insets for iOS */
  @supports (padding: max(0px)) {
    .pb-safe {
      padding-bottom: max(env(safe-area-inset-bottom), 1rem);
    }

    .pt-safe {
      padding-top: max(env(safe-area-inset-top), 1rem);
    }

    .px-safe {
      padding-left: max(env(safe-area-inset-left), 1rem);
      padding-right: max(env(safe-area-inset-right), 1rem);
    }
  }

  /* Touch-friendly sizing */
  .touch-target {
    min-width: 44px;
    min-height: 44px;
  }

  /* GPU acceleration hint */
  .will-change-transform {
    will-change: transform;
  }

  /* Prevent text selection on buttons */
  .no-select {
    -webkit-user-select: none;
    user-select: none;
  }

  /* Tap highlight removal */
  .no-tap-highlight {
    -webkit-tap-highlight-color: transparent;
  }
}

/* Custom button animation */
@layer components {
  .btn-animated {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
      box-shadow: 0 0 0 4px rgb(var(--p) / 0.1);
    }
  }
}

/* Improved focus indicators */
@layer base {
  *:focus-visible {
    @apply outline-none ring-2 ring-primary/50 ring-offset-2 ring-offset-base-100;
  }

  /* Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

---

## Migration Strategy

### Step 1: Prepare
1. Create a new branch: `git checkout -b feature/booking-responsive-redesign`
2. Run existing tests to ensure baseline: `pnpm test`
3. Take screenshots of current state for comparison

### Step 2: Foundation First
1. Update `BookingWizard.tsx` (most impactful)
2. Update `BookingProgress.tsx`
3. Create utility files (`animations.ts`, `accessibility.ts`, `petSizes.ts`)
4. Update global CSS
5. Test on mobile, tablet, desktop

### Step 3: Component Updates
1. Update atomic components first (cards, pickers)
2. Then update composite components (step components)
3. Test after each component update
4. Commit frequently with descriptive messages

### Step 4: Testing & Refinement
1. Test on real devices (iOS Safari, Android Chrome)
2. Run Lighthouse audits
3. Test with screen reader (VoiceOver on Mac, NVDA on Windows)
4. Test keyboard navigation
5. Fix any issues found

### Step 5: Polish & Deploy
1. Add stagger animations
2. Fine-tune spacing and typography
3. Final cross-browser testing
4. Create PR with before/after screenshots
5. Request code review
6. Merge and deploy

---

## Important Notes for Implementation

### DaisyUI Usage
1. **Always use DaisyUI semantic classes when available:**
   - ✅ `btn btn-primary` instead of custom button styles
   - ✅ `card` instead of `bg-white rounded-lg shadow-md`
   - ✅ `badge` instead of custom badge styles
   - ✅ `input input-bordered` instead of custom input styles

2. **DaisyUI theme variables in Tailwind classes:**
   - ✅ `bg-primary` instead of `bg-[#434E54]`
   - ✅ `text-base-content` instead of `text-[#434E54]`
   - ✅ `bg-base-100` instead of `bg-[#F8EEE5]`

3. **Extending DaisyUI components:**
   ```tsx
   // Good: Extend DaisyUI with Tailwind utilities
   <button className="btn btn-primary shadow-lg hover:shadow-xl">

   // Avoid: Overriding DaisyUI base styles
   <button className="btn btn-primary bg-blue-500"> ❌
   ```

### Framer Motion Best Practices
1. **Animate only transform and opacity** for 60fps animations
2. **Use `layout` prop** for smooth reordering (e.g., add-ons list)
3. **Wrap in `AnimatePresence`** for exit animations
4. **Use `whileHover` and `whileTap`** for interactive feedback
5. **Respect `prefers-reduced-motion`** for accessibility

### Responsive Design Rules
1. **Mobile-first approach:** Start with mobile, enhance for larger screens
2. **Use Tailwind breakpoints consistently:** `sm:`, `md:`, `lg:`, `xl:`
3. **Test at breakpoints:** 375px, 640px, 768px, 1024px, 1280px
4. **Avoid fixed heights:** Use `min-h-` and `max-h-` instead
5. **Stack on mobile, side-by-side on desktop:** `flex-col md:flex-row`

### Touch Target Guidelines
1. **Minimum 44x44px** on mobile (Apple HIG, Material Design)
2. **Add padding to increase touch area** without changing visual size
3. **Use `min-h-[44px]` and `min-w-[44px]`** in Tailwind classes
4. **Test with actual fingers,** not mouse cursor

### Performance Considerations
1. **Lazy load step components** to reduce initial bundle size
2. **Optimize images** with next/image (quality: 85, sizes prop)
3. **Memoize expensive computations** with useMemo
4. **Memoize callbacks** with useCallback
5. **Use DaisyUI skeleton** for loading states (matches final layout)

### Accessibility Must-Haves
1. **Semantic HTML:** Use `<button>`, not `<div onClick>`
2. **ARIA labels** on icon-only buttons
3. **Focus management:** Auto-focus first element on step load
4. **Keyboard navigation:** Tab, Arrow keys, Enter, Escape
5. **Screen reader announcements:** Live regions for step changes
6. **Color contrast:** WCAG AA minimum (4.5:1 for text)

### Code Quality
1. **Use `cn()` utility** for conditional classes (not template literals)
2. **No arbitrary values** in Tailwind classes (use scale)
3. **Extract magic numbers** to constants
4. **Type everything** (no `any` types)
5. **Consistent naming:** `handleClick`, not `onClick` for handlers

---

## Success Metrics

### Quantitative Metrics:
- **Mobile Lighthouse Score:** > 90 (currently unknown)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Cumulative Layout Shift:** < 0.1
- **Touch target compliance:** 100% ≥ 44px on mobile

### Qualitative Metrics:
- **User testing:** 5 users complete booking flow without assistance
- **Accessibility audit:** 0 critical issues, < 3 warnings
- **Cross-browser testing:** Works on Chrome, Safari, Firefox, Edge
- **Device testing:** Works on iPhone, Android, iPad, laptop

### Business Metrics:
- **Booking completion rate:** Increase from baseline (track after deploy)
- **Mobile vs desktop bookings:** Expect increase in mobile %
- **Time to complete booking:** Decrease from baseline
- **Support tickets:** Decrease in "can't book" complaints

---

## Conclusion

This redesign transforms the booking system from functional to delightful across all devices. By following mobile-first principles, leveraging DaisyUI's semantic classes, and implementing thoughtful animations with Framer Motion, we create a booking experience that is:

1. **Fast** - Optimized performance with lazy loading and memoization
2. **Simple** - Clear visual hierarchy and obvious next steps
3. **Intuitive** - Familiar patterns and helpful feedback
4. **Accessible** - Works for everyone, including keyboard and screen reader users
5. **Delightful** - Smooth animations and polished interactions

The implementation follows a phased approach, starting with foundation fixes (mobile price summary, touch targets) and progressively enhancing visual polish and animations. All changes maintain The Puppy Day's Clean & Elegant Professional design aesthetic while modernizing the user experience for 2025.

**Remember:** This is a research and planning document. Do not implement these changes yourself. The parent agent will handle the actual implementation and testing. Your job is to provide this comprehensive plan so they have all the context needed to execute successfully.
