# Task 19: Implement WaitlistModal Component

## Description
Create the WaitlistModal component for customers to join the waitlist when their preferred time slot is fully booked.

## Files to modify/create
- `src/components/booking/WaitlistModal.tsx`

## Requirements References
- Req 9.2: Create waitlist entry with selected date and time preference
- Req 9.3: Display confirmation and explain the waitlist process
- Req 9.6: Allow user to specify time preference (morning, afternoon, any)

## Implementation Details

### WaitlistModal Component
```typescript
interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  time: string | null;
  onSuccess?: () => void;
}

export function WaitlistModal({
  isOpen,
  onClose,
  date,
  time,
  onSuccess,
}: WaitlistModalProps) {
  const [timePreference, setTimePreference] = useState<TimePreference>('any');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  const { selectedServiceId, selectedPetId, guestInfo } = useBookingStore();
  const { user } = useAuth();

  const handleJoinWaitlist = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const customerId = user?.id || guestInfo?.email; // Need to create guest first if not authenticated

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          pet_id: selectedPetId,
          service_id: selectedServiceId,
          requested_date: date,
          time_preference: timePreference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'DUPLICATE_ENTRY') {
          setError('You\'re already on the waitlist for this date.');
        } else {
          setError(data.error || 'Failed to join waitlist');
        }
        return;
      }

      setSuccess(true);
      setPosition(data.position);
      onSuccess?.();
    } catch (err) {
      setError('Unable to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    setPosition(null);
    setTimePreference('any');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        {success ? (
          // Success state
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success">...</svg>
              </div>
              <h3 className="text-lg font-bold mb-2">You're on the Waitlist!</h3>
              <p className="text-base-content/70 mb-4">
                You're #{position} in line for {formatDate(date)}
              </p>
              <div className="bg-base-200 rounded-lg p-4 text-left text-sm">
                <p className="font-medium mb-2">What happens next?</p>
                <ul className="space-y-2 text-base-content/70">
                  <li>• We'll notify you by email if a slot opens up</li>
                  <li>• You'll have 2 hours to confirm the appointment</li>
                  <li>• If you don't respond, the slot goes to the next person</li>
                </ul>
              </div>
            </div>
            <div className="modal-action">
              <button onClick={handleClose} className="btn btn-primary btn-block">
                Got It
              </button>
            </div>
          </>
        ) : (
          // Join form
          <>
            <button
              onClick={handleClose}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold">Join Waitlist</h3>
            <p className="text-base-content/70 mt-1">
              Get notified if a slot opens on {formatDate(date)}
            </p>

            {error && (
              <div className="alert alert-error mt-4">
                <span>{error}</span>
              </div>
            )}

            <div className="py-6">
              <label className="label">
                <span className="label-text font-medium">Time Preference</span>
              </label>
              <p className="text-sm text-base-content/70 mb-3">
                Let us know when works best for you
              </p>

              <div className="space-y-2">
                {[
                  { value: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM' },
                  { value: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM' },
                  { value: 'any', label: 'Any Time', time: 'First available slot' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all',
                      timePreference === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-base-300 hover:border-base-content/30'
                    )}
                  >
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-base-content/70 ml-2">{option.time}</span>
                    </div>
                    <input
                      type="radio"
                      name="timePreference"
                      value={option.value}
                      checked={timePreference === option.value}
                      onChange={(e) => setTimePreference(e.target.value as TimePreference)}
                      className="radio radio-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-action">
              <button onClick={handleClose} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleJoinWaitlist}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Joining...
                  </>
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
```

## Acceptance Criteria
- [ ] Modal opens when triggered from TimeSlotGrid
- [ ] Shows selected date clearly
- [ ] Time preference options (morning, afternoon, any)
- [ ] Radio buttons for preference selection with clear labels
- [ ] Loading state during API call
- [ ] Error handling for duplicate entries
- [ ] Error handling for network failures
- [ ] Success state shows position in queue
- [ ] Success state explains waitlist process
- [ ] Modal closes on backdrop click or X button
- [ ] Mobile-friendly layout

## Estimated Complexity
Medium

## Phase
Phase 5: Waitlist Integration

## Dependencies
- Task 9 (waitlist API)
- Task 15 (DateTimeStep integration)
