# Booking Flow - Architecture Documentation

> **Module**: Booking Widget Components
> **Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\components\booking\`
> **Status**: ✅ Completed (Phase 3)
> **Flow**: 6-step multi-step wizard

## Overview

The booking widget is a multi-step form that guides customers through the appointment scheduling process. It supports both authenticated users and guest bookings with real-time availability checking and waitlist functionality.

---

## Components

### BookingWizard (`BookingWizard.tsx`)

**Purpose**: Main orchestrator component managing wizard state and step transitions.

**State Management** (Zustand):
```typescript
interface BookingState {
  currentStep: number;
  selectedService: Service | null;
  selectedPet: Pet | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedAddons: Addon[];
  customerInfo: CustomerInfo | null;
  guestMode: boolean;
}
```

**Steps**:
1. **ServiceStep** - Select grooming service
2. **PetStep** - Select existing pet or create new (guest: create)
3. **DateTimeStep** - Select date and time slot
4. **AddonsStep** - Select optional add-ons
5. **ReviewStep** - Review and confirm booking
6. **ConfirmationStep** - Success message and next steps

**Navigation**:
```tsx
const handleNext = () => {
  if (validateCurrentStep()) {
    setCurrentStep(currentStep + 1);
  }
};

const handleBack = () => {
  setCurrentStep(currentStep - 1);
};
```

---

### ServiceStep (`ServiceStep.tsx`)

**Purpose**: Display service cards with size-based pricing.

**Data Fetching**:
```typescript
const { data: services } = await fetch('/api/services');
```

**Service Card Display**:
```tsx
{services.map(service => (
  <ServiceCard
    key={service.id}
    service={service}
    selected={selectedService?.id === service.id}
    onClick={() => selectService(service)}
  >
    <h3>{service.name}</h3>
    <p>{service.description}</p>
    <div className="pricing">
      {service.prices.map(p => (
        <div key={p.size}>
          {p.size}: ${p.price}
        </div>
      ))}
    </div>
  </ServiceCard>
))}
```

**Validation**: Service must be selected before proceeding.

---

### PetStep (`PetStep.tsx`)

**Purpose**: Select existing pet or create new pet profile.

**Authenticated User Flow**:
```tsx
const { data: pets } = await fetch('/api/customer/pets');

// Display existing pets
{pets.map(pet => (
  <PetCard
    pet={pet}
    selected={selectedPet?.id === pet.id}
    onClick={() => selectPet(pet)}
  />
))}

// Option to add new pet
<Button onClick={() => setShowAddPetForm(true)}>
  + Add New Pet
</Button>
```

**Guest User Flow**:
```tsx
// Show pet creation form directly
<PetForm onSubmit={handleGuestPetCreate} />
```

**Pet Form Fields**:
- Name (required)
- Breed (select from list or custom)
- Size (small, medium, large, xlarge) - determines pricing
- Weight (optional)
- Birth date (optional)
- Medical info (optional)

**Size-Based Pricing Update**:
```typescript
// When pet size selected, update service price
useEffect(() => {
  if (selectedPet && selectedService) {
    const price = getServicePriceForSize(selectedService, selectedPet.size);
    updateTotalPrice(price);
  }
}, [selectedPet, selectedService]);
```

---

### DateTimeStep (`DateTimeStep.tsx`)

**Purpose**: Select appointment date and time with real-time availability.

**Calendar Component**:
```tsx
<Calendar
  minDate={new Date()}
  maxDate={addMonths(new Date(), 3)}
  disabledDates={blockedDates}
  selectedDate={selectedDate}
  onSelectDate={handleDateSelect}
/>
```

**Availability Checking**:
```typescript
useEffect(() => {
  async function checkAvailability() {
    const response = await fetch(
      `/api/availability?date=${selectedDate}&service_id=${selectedService.id}`
    );
    const { available_slots, booked_slots } = await response.json();
    setAvailableSlots(available_slots);
  }

  if (selectedDate && selectedService) {
    checkAvailability();
  }
}, [selectedDate, selectedService]);
```

**Time Slot Selection**:
```tsx
<div className="grid grid-cols-3 gap-2">
  {availableSlots.map(slot => (
    <button
      key={slot}
      onClick={() => selectTimeSlot(slot)}
      className={cn(
        'p-3 rounded-lg border',
        selectedTime === slot && 'bg-primary text-white'
      )}
    >
      {slot}
    </button>
  ))}
</div>
```

**Waitlist Option**:
```tsx
{availableSlots.length === 0 && (
  <Alert variant="warning">
    <span>No slots available for this date.</span>
    <Button variant="outline" onClick={() => setShowWaitlistModal(true)}>
      Join Waitlist
    </Button>
  </Alert>
)}
```

---

### AddonsStep (`AddonsStep.tsx`)

**Purpose**: Select optional add-on services.

**Addon Display**:
```tsx
{addons.map(addon => (
  <Checkbox
    key={addon.id}
    label={`${addon.name} (+$${addon.price})`}
    description={addon.description}
    checked={selectedAddons.includes(addon.id)}
    onChange={() => toggleAddon(addon)}
  />
))}
```

**Price Update**:
```typescript
const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
const totalPrice = servicePrice + addonTotal;
```

---

### ReviewStep (`ReviewStep.tsx`)

**Purpose**: Review booking details before confirmation.

**Display Summary**:
```tsx
<div className="space-y-4">
  {/* Service */}
  <div>
    <h4 className="font-semibold">Service</h4>
    <p>{selectedService.name}</p>
  </div>

  {/* Pet */}
  <div>
    <h4 className="font-semibold">Pet</h4>
    <p>{selectedPet.name} ({selectedPet.size})</p>
  </div>

  {/* Date & Time */}
  <div>
    <h4 className="font-semibold">Date & Time</h4>
    <p>{format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}</p>
  </div>

  {/* Add-ons */}
  {selectedAddons.length > 0 && (
    <div>
      <h4 className="font-semibold">Add-ons</h4>
      <ul>
        {selectedAddons.map(addon => (
          <li key={addon.id}>{addon.name} - ${addon.price}</li>
        ))}
      </ul>
    </div>
  )}

  {/* Price Breakdown */}
  <div className="border-t pt-4">
    <div className="flex justify-between">
      <span>Service</span>
      <span>${servicePrice}</span>
    </div>
    <div className="flex justify-between">
      <span>Add-ons</span>
      <span>${addonTotal}</span>
    </div>
    <div className="flex justify-between font-bold text-lg">
      <span>Total</span>
      <span>${totalPrice}</span>
    </div>
  </div>

  {/* Special Instructions */}
  <Textarea
    label="Special Instructions (Optional)"
    placeholder="Any special requests or medical notes"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
  />
</div>
```

**Submission**:
```typescript
const handleConfirm = async () => {
  setIsSubmitting(true);

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: user.id,
        pet_id: selectedPet.id,
        service_id: selectedService.id,
        scheduled_at: `${selectedDate}T${selectedTime}`,
        addon_ids: selectedAddons.map(a => a.id),
        notes,
      }),
    });

    if (!response.ok) throw new Error('Booking failed');

    const { data } = await response.json();
    setAppointmentId(data.id);
    goToNextStep();
  } catch (error) {
    setError('Unable to book appointment. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### ConfirmationStep (`ConfirmationStep.tsx`)

**Purpose**: Display success message and next steps.

**Content**:
```tsx
<div className="text-center py-8">
  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
  <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
  <p className="text-gray-600 mb-6">
    We've sent a confirmation email to {user.email}
  </p>

  <div className="bg-gray-50 rounded-lg p-6 mb-6">
    <p className="text-sm text-gray-500 mb-2">Appointment Details</p>
    <p className="font-semibold">{selectedService.name}</p>
    <p>{format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}</p>
    <p className="text-sm text-gray-600 mt-2">
      Confirmation #: {appointmentId}
    </p>
  </div>

  <div className="space-y-3">
    <Button
      variant="primary"
      onClick={() => router.push('/dashboard')}
      fullWidth
    >
      View My Appointments
    </Button>
    <Button
      variant="outline"
      onClick={handleBookAnother}
      fullWidth
    >
      Book Another Appointment
    </Button>
    <Button
      variant="ghost"
      onClick={() => router.push('/')}
      fullWidth
    >
      Return Home
    </Button>
  </div>
</div>
```

---

### WaitlistModal (`WaitlistModal.tsx`)

**Purpose**: Collect waitlist information when no slots available.

**Form Fields**:
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Join Waitlist">
  <form onSubmit={handleSubmit}>
    <Input
      label="Preferred Date"
      type="date"
      value={preferredDate}
      onChange={(e) => setPreferredDate(e.target.value)}
      required
    />

    <RadioGroup label="Time Preference">
      <Radio name="time" value="morning" label="Morning (9 AM - 12 PM)" />
      <Radio name="time" value="afternoon" label="Afternoon (12 PM - 5 PM)" />
      <Radio name="time" value="any" label="Any Time" />
    </RadioGroup>

    <Textarea
      label="Notes (Optional)"
      placeholder="Any additional information"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
    />

    <div className="flex gap-2 mt-4">
      <Button type="button" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Join Waitlist
      </Button>
    </div>
  </form>
</Modal>
```

**Submission**:
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();

  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: user.id,
      pet_id: selectedPet.id,
      service_id: selectedService.id,
      preferred_date: preferredDate,
      time_preference: timePreference,
      notes,
    }),
  });

  if (response.ok) {
    onSuccess();
    onClose();
  }
};
```

---

## State Management

**Zustand Store** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\stores\bookingStore.ts`):

```typescript
interface BookingStore {
  // Current state
  currentStep: number;
  selectedService: Service | null;
  selectedPet: Pet | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedAddons: Addon[];
  notes: string;
  guestMode: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  selectService: (service: Service) => void;
  selectPet: (pet: Pet) => void;
  selectDate: (date: Date) => void;
  selectTime: (time: string) => void;
  toggleAddon: (addon: Addon) => void;
  setNotes: (notes: string) => void;
  resetBooking: () => void;

  // Computed
  totalPrice: number;
  canProceed: boolean;
}
```

---

## Validation

**Step-by-step validation**:
```typescript
function validateStep(step: number): boolean {
  switch (step) {
    case 0: // Service
      return selectedService !== null;
    case 1: // Pet
      return selectedPet !== null;
    case 2: // DateTime
      return selectedDate !== null && selectedTime !== null;
    case 3: // Addons
      return true; // Optional step
    case 4: // Review
      return validateAllFields();
    default:
      return false;
  }
}
```

---

## Guest Booking Flow

**Differences from Authenticated Flow**:
1. User must provide contact information (email, phone, name)
2. Temporary guest account created
3. Email sent with account activation link
4. Can view appointment status via UUID link

**Guest Info Collection**:
```tsx
<div className="bg-blue-50 p-4 rounded-lg mb-4">
  <p className="text-sm font-semibold mb-2">Guest Booking</p>
  <p className="text-xs text-gray-600 mb-4">
    Create an account to manage your appointment
  </p>

  <Input label="First Name" required />
  <Input label="Last Name" required />
  <Input label="Email" type="email" required />
  <Input label="Phone" type="tel" required />

  <Checkbox
    label="Create an account"
    description="Save your info for easier future bookings"
  />
</div>
```

---

## Related Documentation

- [Booking API](../routes/api.md#appointments)
- [Booking Store](../state/booking-store.md)
- [Pricing Logic](../services/pricing.md)

---

**Last Updated**: 2025-12-20
