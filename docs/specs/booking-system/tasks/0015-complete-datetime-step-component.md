# Task 15: Complete DateTimeStep Component

## Description
Enhance the DateTimeStep component with a full calendar picker and time slot grid showing availability and waitlist options.

## Files to modify/create
- `src/components/booking/steps/DateTimeStep.tsx`
- `src/components/booking/CalendarPicker.tsx`
- `src/components/booking/TimeSlotGrid.tsx`

## Requirements References
- Req 4.1: Display calendar showing current and next month
- Req 4.2: Display available time slots for selected date
- Req 4.3: Show slots in 30-minute increments during business hours
- Req 4.4: Display available slots as selectable with start time
- Req 4.5: Display fully booked slots as unavailable with "Join Waitlist" option
- Req 4.7: Disable past dates and closed business days
- Req 4.8: Display selected date and time prominently

## Implementation Details

### DateTimeStep Component
```typescript
export function DateTimeStep() {
  const { selectedDate, selectedTimeSlot, selectDateTime, nextStep, prevStep } = useBookingStore();
  const { selectedServiceId } = useBookingStore();
  const { slots, isLoading, error, refetch } = useAvailability({
    date: selectedDate,
    serviceId: selectedServiceId,
  });

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistTime, setWaitlistTime] = useState<string | null>(null);

  const handleDateSelect = (date: string) => {
    // Clear time when date changes, then update date
    selectDateTime(date, '');
  };

  const handleTimeSelect = (time: string) => {
    selectDateTime(selectedDate!, time);
  };

  const handleJoinWaitlist = (time: string) => {
    setWaitlistTime(time);
    setShowWaitlistModal(true);
  };

  const canContinue = selectedDate && selectedTimeSlot;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Select Date & Time</h2>
        <p className="text-base-content/70">Choose when you'd like to bring your pet</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <CalendarPicker
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          minDate={new Date()}
          maxDate={addMonths(new Date(), 2)}
        />

        {/* Time slots */}
        {selectedDate && (
          <div>
            <h3 className="font-semibold mb-4">
              Available Times for {formatDate(selectedDate)}
            </h3>
            {isLoading ? (
              <TimeSlotSkeleton />
            ) : error ? (
              <ErrorDisplay onRetry={refetch} />
            ) : (
              <TimeSlotGrid
                date={selectedDate}
                slots={slots}
                selectedTime={selectedTimeSlot}
                onSelectTime={handleTimeSelect}
                onJoinWaitlist={handleJoinWaitlist}
              />
            )}
          </div>
        )}
      </div>

      {/* Selected summary */}
      {canContinue && (
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="font-medium">
            {formatDate(selectedDate)} at {formatTime(selectedTimeSlot)}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={prevStep} className="btn btn-ghost">Back</button>
        <button onClick={nextStep} disabled={!canContinue} className="btn btn-primary">
          Continue
        </button>
      </div>

      {/* Waitlist modal */}
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        date={selectedDate}
        time={waitlistTime}
      />
    </div>
  );
}
```

### CalendarPicker Component
```typescript
interface CalendarPickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: string[];
}

export function CalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  disabledDates = [],
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isDateDisabled = (date: Date) => {
    // Check if before minDate
    if (minDate && date < startOfDay(minDate)) return true;
    // Check if after maxDate
    if (maxDate && date > maxDate) return true;
    // Check if in disabledDates
    const dateStr = format(date, 'yyyy-MM-dd');
    if (disabledDates.includes(dateStr)) return true;
    // Check if Sunday (business closed)
    if (date.getDay() === 0) return true;
    return false;
  };

  // Render calendar grid with date buttons
  // Keyboard navigation (arrow keys)
  // Month navigation
}
```

### TimeSlotGrid Component
```typescript
interface TimeSlotGridProps {
  date: string;
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  onJoinWaitlist: (time: string) => void;
}

export function TimeSlotGrid({
  date,
  slots,
  selectedTime,
  onSelectTime,
  onJoinWaitlist,
}: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/70">
        No available times for this date.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {slots.map(slot => (
        <TimeSlotButton
          key={slot.time}
          time={slot.time}
          available={slot.available}
          waitlistCount={slot.waitlistCount}
          isSelected={selectedTime === slot.time}
          onSelect={() => onSelectTime(slot.time)}
          onJoinWaitlist={() => onJoinWaitlist(slot.time)}
        />
      ))}
    </div>
  );
}

function TimeSlotButton({ time, available, waitlistCount, isSelected, onSelect, onJoinWaitlist }) {
  if (available) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          'btn h-16 text-lg',
          isSelected ? 'btn-primary' : 'btn-outline'
        )}
      >
        {formatTime(time)}
      </button>
    );
  }

  return (
    <button
      onClick={onJoinWaitlist}
      className="btn btn-ghost h-16 flex-col"
    >
      <span className="text-sm line-through text-base-content/50">{formatTime(time)}</span>
      <span className="text-xs text-warning">Join Waitlist</span>
      {waitlistCount > 0 && (
        <span className="text-xs text-base-content/50">{waitlistCount} waiting</span>
      )}
    </button>
  );
}
```

## Acceptance Criteria
- [ ] Calendar displays current and next month
- [ ] Past dates are disabled (not clickable)
- [ ] Sundays are disabled (business closed)
- [ ] Selecting a date fetches and displays time slots
- [ ] Time slots show in 30-minute increments
- [ ] Available slots are clickable and highlight when selected
- [ ] Unavailable slots show "Join Waitlist" with waitlist count
- [ ] Selected date/time displayed prominently
- [ ] Continue button enabled only when date AND time selected
- [ ] Loading skeleton shown while fetching slots
- [ ] Error state with retry option
- [ ] Mobile-friendly touch targets (44px minimum)

## Estimated Complexity
High

## Phase
Phase 4: Step Components Enhancement

## Dependencies
- Task 3 (useAvailability hook)
- Task 6 (availability API)
- Task 12 (hook integration pattern)
