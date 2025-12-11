# Task 18: Complete ConfirmationStep Component

## Description
Enhance the ConfirmationStep component to display booking confirmation with reference number, appointment details, and next steps.

## Files to modify
- `src/components/booking/steps/ConfirmationStep.tsx`

## Requirements References
- Req 6.6: Display confirmation page with booking reference number and details

## Implementation Details

### ConfirmationStep Component
```typescript
export function ConfirmationStep() {
  const {
    bookingId,
    bookingReference,
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    totalPrice,
    guestInfo,
    reset,
  } = useBookingStore();
  const { user } = useAuth();

  const petName = selectedPet?.name || newPetData?.name;
  const contactEmail = guestInfo?.email || user?.email;

  const handleAddToCalendar = () => {
    // Generate ICS file or Google Calendar link
    const event = {
      title: `Puppy Day - ${selectedService?.name}`,
      description: `Grooming appointment for ${petName}`,
      start: `${selectedDate}T${selectedTimeSlot}:00`,
      end: `${selectedDate}T${addMinutes(selectedTimeSlot, selectedService?.duration_minutes || 60)}:00`,
      location: '14936 Leffingwell Rd, La Mirada, CA 90638',
    };
    // Open Google Calendar link
    const googleCalendarUrl = generateGoogleCalendarUrl(event);
    window.open(googleCalendarUrl, '_blank');
  };

  const handleBookAnother = () => {
    reset();
    // Navigate to first step
  };

  return (
    <div className="max-w-lg mx-auto text-center py-8">
      {/* Success icon */}
      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Confirmation message */}
      <h1 className="text-3xl font-bold text-base-content mb-2">Booking Confirmed!</h1>
      <p className="text-base-content/70 mb-6">
        We've sent a confirmation email to {contactEmail}
      </p>

      {/* Reference number */}
      <div className="bg-base-200 rounded-xl p-6 mb-6">
        <p className="text-sm text-base-content/70 mb-1">Confirmation Number</p>
        <p className="text-2xl font-bold font-mono tracking-wider">{bookingReference}</p>
      </div>

      {/* Appointment details card */}
      <div className="card bg-base-100 shadow text-left mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">Appointment Details</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/70">Service</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Pet</span>
              <span className="font-medium">{petName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Date</span>
              <span className="font-medium">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/70">Time</span>
              <span className="font-medium">{formatTime(selectedTimeSlot)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="flex justify-between">
                <span className="text-base-content/70">Add-ons</span>
                <span className="font-medium">{selectedAddons.map(a => a.name).join(', ')}</span>
              </div>
            )}
            <div className="divider my-2"></div>
            <div className="flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="card bg-base-100 shadow text-left mb-8">
        <div className="card-body">
          <h3 className="font-semibold mb-2">Location</h3>
          <p className="text-sm">Puppy Day</p>
          <p className="text-sm text-base-content/70">14936 Leffingwell Rd</p>
          <p className="text-sm text-base-content/70">La Mirada, CA 90638</p>
          <a
            href="https://maps.google.com/?q=14936+Leffingwell+Rd,+La+Mirada,+CA+90638"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm mt-2"
          >
            <svg className="w-4 h-4 mr-1">...</svg>
            Get Directions
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button onClick={handleAddToCalendar} className="btn btn-outline btn-block">
          <svg className="w-5 h-5 mr-2">...</svg>
          Add to Calendar
        </button>

        <button onClick={handleBookAnother} className="btn btn-ghost btn-block">
          Book Another Appointment
        </button>

        <Link href="/" className="btn btn-primary btn-block">
          Return to Home
        </Link>
      </div>

      {/* What's next section */}
      <div className="mt-8 text-left">
        <h3 className="font-semibold mb-3">What's Next?</h3>
        <ul className="text-sm text-base-content/70 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Check your email for appointment confirmation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Arrive 5-10 minutes before your appointment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Bring your pet's vaccination records if first visit</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base-content/50">→</span>
            <span>Payment is collected at the time of service</span>
          </li>
        </ul>
      </div>

      {/* Guest account prompt */}
      {guestInfo && (
        <div className="mt-8 bg-primary/10 rounded-lg p-4 text-left">
          <h3 className="font-semibold mb-2">Create an Account</h3>
          <p className="text-sm text-base-content/70 mb-3">
            Check your email to set up your password and manage your appointments online.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to generate Google Calendar URL
function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${formatISOForCalendar(event.start)}/${formatISOForCalendar(event.end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
```

## Acceptance Criteria
- [ ] Displays success icon and confirmation message
- [ ] Shows booking reference number prominently
- [ ] Shows complete appointment details (service, pet, date, time, add-ons, total)
- [ ] Shows business location with "Get Directions" link
- [ ] "Add to Calendar" button generates Google Calendar link
- [ ] "Book Another Appointment" resets store and starts over
- [ ] "Return to Home" links back to marketing site
- [ ] "What's Next" section provides helpful information
- [ ] Guest users see prompt to claim their account
- [ ] Confirmation email mentioned (sent by API)

## Estimated Complexity
Medium

## Phase
Phase 4: Step Components Enhancement

## Dependencies
- Task 8 (appointments API - provides reference number)
- Task 17 (booking submission)
