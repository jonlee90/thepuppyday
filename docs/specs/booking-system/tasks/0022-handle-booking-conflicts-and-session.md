# Task 22: Handle Booking Conflicts and Session Expiry

## Description
Implement conflict resolution when a time slot becomes unavailable during booking, and handle session expiry gracefully.

## Files to modify
- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/steps/ReviewStep.tsx`
- `src/hooks/useBookingSubmit.ts`

## Requirements References
- Req 12.4: Alert user and redirect to date/time selection if slot becomes unavailable
- Req 1.5: Clear session data after 30 minutes of inactivity

## Implementation Details

### Conflict Resolution in useBookingSubmit
```typescript
// In useBookingSubmit.ts
const submit = async () => {
  try {
    // ... appointment creation
    const response = await fetch('/api/appointments', { ... });

    if (!response.ok) {
      const data = await response.json();

      if (data.code === 'SLOT_CONFLICT') {
        // Clear the selected time and redirect to date/time step
        clearDateTime();
        setStep(2);

        // Show toast notification
        showError('Sorry, that time slot was just booked. Please select another time.');

        throw { type: 'SLOT_CONFLICT', message: data.error };
      }
      // ... other error handling
    }
  } catch (error) {
    // ... error handling
  }
};
```

### Session Expiry Handling in BookingWizard
```typescript
// In BookingWizard.tsx
export function BookingWizard({ preSelectedServiceId }: BookingWizardProps) {
  const { isSessionExpired, reset, updateActivity } = useBookingStore();
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  // Check session on mount and periodically
  useEffect(() => {
    const checkSession = () => {
      if (isSessionExpired()) {
        // Session fully expired - reset
        reset();
        showWarning('Your booking session has expired. Please start again.');
      }
    };

    // Check immediately
    checkSession();

    // Check on window focus (user returns to tab)
    const handleFocus = () => {
      checkSession();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [isSessionExpired, reset]);

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Update on any user interaction
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [updateActivity]);

  // Show warning 5 minutes before expiry
  useEffect(() => {
    const checkWarning = () => {
      const { lastActivityTimestamp } = useBookingStore.getState();
      const timeRemaining = 30 * 60 * 1000 - (Date.now() - lastActivityTimestamp);

      if (timeRemaining <= 5 * 60 * 1000 && timeRemaining > 0) {
        setShowExpiryWarning(true);
      } else {
        setShowExpiryWarning(false);
      }
    };

    const interval = setInterval(checkWarning, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ... rest of component

  return (
    <div>
      {/* Session expiry warning */}
      {showExpiryWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="alert alert-warning shadow-lg">
            <svg className="w-6 h-6">...</svg>
            <span>Your session will expire in 5 minutes. Please complete your booking.</span>
            <button
              onClick={() => {
                updateActivity();
                setShowExpiryWarning(false);
              }}
              className="btn btn-sm"
            >
              Keep Booking
            </button>
          </div>
        </div>
      )}

      {/* ... rest of wizard */}
    </div>
  );
}
```

### Conflict Recovery in ReviewStep
```typescript
// In ReviewStep.tsx
const handleConfirm = async () => {
  try {
    await submit();
  } catch (error) {
    if (error.type === 'SLOT_CONFLICT') {
      // User is automatically redirected to date/time step
      // Error message shown via toast
      return;
    }
    // Handle other errors
  }
};
```

### Conflict Alert Component
```typescript
// Can be shown on DateTimeStep after redirect
export function SlotConflictAlert() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="alert alert-warning mb-4">
      <svg className="w-6 h-6">...</svg>
      <div>
        <h3 className="font-medium">Time Slot No Longer Available</h3>
        <p className="text-sm">
          The time you selected was just booked. Please choose another available time below.
        </p>
      </div>
      <button onClick={() => setVisible(false)} className="btn btn-sm btn-ghost">
        ✕
      </button>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] SLOT_CONFLICT error triggers redirect to date/time step
- [ ] Selected date/time is cleared on conflict
- [ ] Toast notification explains what happened
- [ ] User can select new time and continue booking
- [ ] Session expiry check runs on mount
- [ ] Session expiry check runs on window focus
- [ ] Session expiry check runs periodically (every 5 minutes)
- [ ] Warning shown 5 minutes before expiry
- [ ] "Keep Booking" button extends session
- [ ] Expired session resets store and shows message
- [ ] User activity updates last activity timestamp

## Estimated Complexity
Medium

## Phase
Phase 6: Form Validation & Error Handling

## Dependencies
- Task 13 (useBookingSubmit hook)
- Task 8 (appointments API with conflict detection)
