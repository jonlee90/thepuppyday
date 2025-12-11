# Task 30: Add Loading States and Animations

## Description
Add polished loading states, skeleton screens, and animations throughout the booking wizard for a smooth user experience.

## Files to modify
- All booking step components
- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/PriceSummary.tsx`
- Create skeleton components as needed

## Requirements References
- Req 1.6: Display smooth entrance animations using Framer Motion
- Req 10.3: Update displayed total immediately with subtle animation

## Implementation Details

### Skeleton Components
```tsx
// src/components/booking/skeletons/ServiceStepSkeleton.tsx
export function ServiceStepSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-base-300 rounded animate-pulse" />
        <div className="h-4 w-72 bg-base-300 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="card bg-base-100 animate-pulse">
            <div className="h-40 bg-base-300 rounded-t-xl" />
            <div className="card-body space-y-3">
              <div className="h-6 w-3/4 bg-base-300 rounded" />
              <div className="h-4 w-full bg-base-300 rounded" />
              <div className="h-4 w-2/3 bg-base-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/components/booking/skeletons/TimeSlotSkeleton.tsx
export function TimeSlotSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-14 bg-base-300 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
```

### Step Transition Animations
```tsx
// BookingWizard.tsx - Enhanced transitions
import { motion, AnimatePresence } from 'framer-motion';

const stepVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1], // Custom easing
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  }),
};

// Track direction for animations
const [direction, setDirection] = useState(0);
const prevStep = useRef(currentStep);

useEffect(() => {
  setDirection(currentStep > prevStep.current ? 1 : -1);
  prevStep.current = currentStep;
}, [currentStep]);

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    variants={stepVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {renderStep()}
  </motion.div>
</AnimatePresence>
```

### Price Update Animation
```tsx
// PriceSummary.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function PriceSummary({ total, serviceName, addons }) {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        {/* ... other content ... */}

        {/* Animated total */}
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="font-semibold">Total</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={total}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold text-primary"
            >
              ${total.toFixed(2)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

### Selection Animations
```tsx
// ServiceCard with selection animation
import { motion } from 'framer-motion';

export function ServiceCard({ service, isSelected, onSelect }) {
  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'card bg-base-100 cursor-pointer transition-shadow',
        isSelected && 'ring-2 ring-primary shadow-lg'
      )}
    >
      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ... card content ... */}
    </motion.div>
  );
}
```

### Loading Button State
```tsx
// Loading button for submission
<button
  onClick={handleSubmit}
  disabled={isSubmitting}
  className="btn btn-primary btn-lg"
>
  {isSubmitting ? (
    <>
      <span className="loading loading-spinner loading-sm" />
      Processing...
    </>
  ) : (
    'Confirm Booking'
  )}
</button>
```

### Add-on Toggle Animation
```tsx
// AddonCard selection animation
export function AddonCard({ addon, isSelected, onToggle }) {
  return (
    <motion.div
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn('card bg-base-100 cursor-pointer', isSelected && 'ring-2 ring-primary')}
    >
      <div className="card-body flex-row items-center">
        <div className="flex-1">
          <h3 className="font-medium">{addon.name}</h3>
          <p className="text-sm text-base-content/70">{addon.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold">${addon.price.toFixed(2)}</span>
          <motion.div
            animate={{ scale: isSelected ? 1 : 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="checkbox checkbox-primary"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
```

### Progress Indicator Animation
```tsx
// BookingProgress with animated step indicators
export function BookingProgress({ currentStep, ... }) {
  return (
    <nav className="py-4">
      <ol className="flex justify-between">
        {STEPS.map((step, index) => (
          <li key={step} className="flex-1">
            <div className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: index <= currentStep ? 'var(--p)' : 'var(--b3)',
                  scale: index === currentStep ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {index < currentStep ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 text-primary-content"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <span className={index <= currentStep ? 'text-primary-content' : ''}>
                    {index + 1}
                  </span>
                )}
              </motion.div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <motion.div
                    animate={{ scaleX: index < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary origin-left"
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

## Acceptance Criteria
- [ ] Service step shows skeleton while loading
- [ ] Time slots show skeleton while loading
- [ ] Step transitions use smooth slide animations
- [ ] Price total animates when value changes
- [ ] Service/addon cards have hover and tap feedback
- [ ] Selection indicators animate in/out
- [ ] Submit button shows loading spinner
- [ ] Progress indicator steps animate on change
- [ ] Completed steps show animated checkmark
- [ ] No janky or stuttering animations
- [ ] Animations respect reduced-motion preference

## Estimated Complexity
Medium

## Phase
Phase 9: Polish & Integration

## Dependencies
- All step component tasks (14-18)
- Framer Motion already installed
