# Booking Flow - Architecture Documentation

> **Module**: Booking Widget Components
> **Location**: `src/components/booking/`
> **Status**: ✅ Completed (Phase 3, Updated Phase 10, Refactored Dec 2025)
> **Last Updated**: 2025-12-26

## Overview

The booking widget is a unified multi-step modal that guides users through the appointment scheduling process. It supports three different modes with mode-specific step orders and behaviors:

- **Customer Mode**: Public-facing booking for customers (6 steps total)
- **Admin Mode**: Admin creating scheduled appointments (6 steps total)
- **Walk-in Mode**: Quick registration for walk-in customers (5 steps total)

**Key Features**:
- ✅ Single unified modal component for all booking types
- ✅ Mode-aware step flows and UI
- ✅ Integrated add-ons in review step (no separate add-ons step)
- ✅ Tablet-optimized sizing (1000px-1200px)
- ✅ Hourly time slot intervals
- ✅ Always-visible customer creation form for admin/walkin modes
- ✅ Login/register functionality for customer mode

---

## Booking Modes & Step Orders

### Customer Mode (6 steps)
Used on the marketing page for public bookings via sticky "Book Reservation" button.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | ServiceStep | Select grooming service |
| 1 | DateTimeStep | Choose appointment date/time (hourly slots) |
| 2 | CustomerStep | Login or register account |
| 3 | PetStep | Select or create pet profile |
| 4 | ReviewStep | Review booking **with integrated add-ons selection** |
| 5 | ConfirmationStep | Success message |

**Trigger**: `StickyBookingButton` appears after scrolling 600px on marketing page

### Admin Mode (6 steps)
Used in `/admin/appointments` for creating appointments.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | ServiceStep | Select grooming service |
| 1 | DateTimeStep | Choose appointment date/time (hourly slots) |
| 2 | CustomerStep | Search/create customer (form always visible) |
| 3 | PetStep | Select customer's pet or create new |
| 4 | ReviewStep | Review appointment **with integrated add-ons selection** |
| 5 | ConfirmationStep | Appointment created |

### Walk-in Mode (5 steps)
Used in `/admin/dashboard` for immediate walk-in appointments.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | ServiceStep | Select grooming service |
| 1 | CustomerStep | Search/create customer (form always visible) |
| 2 | PetStep | Select customer's pet or create new |
| 3 | WalkinReviewStep | Review **with integrated add-ons** |
| 4 | ConfirmationStep | Walk-in confirmed |

> **Note**: Walk-in mode skips Date/Time step (auto-set to NOW) and uses WalkinReviewStep for faster processing. Status automatically set to `'checked_in'` with `source: 'walk_in'`.

---

## Components

### BookingModal (`BookingModal.tsx`)

**Purpose**: Reusable modal wrapper that presents the booking flow.

**Props**:
```typescript
interface BookingModalProps {
  mode?: BookingModalMode; // 'customer' | 'admin' | 'walkin'
  isOpen?: boolean;
  onClose?: () => void;
  preSelectedServiceId?: string;
  preSelectedCustomerId?: string;
  onSuccess?: (appointmentId: string) => void;
}
```

**Responsive Sizing** (Updated Dec 2025):
- **Desktop/Tablet**: Centered modal `max-w-[1000px] xl:max-w-[1200px]` - optimized for larger screens
- **Mobile**: Bottom sheet (95vh, slides up from bottom)
- **Features**: Focus trap, escape key handling, body scroll lock

**Design**: Clean modal with rounded corners, backdrop blur, and smooth animations.

### BookingWizard (`BookingWizard.tsx`)

**Purpose**: Main orchestrator component managing wizard state and step transitions.

**Props**:
```typescript
interface BookingWizardProps {
  preSelectedServiceId?: string;
  embedded?: boolean; // Hide header/progress when in modal
  mode?: BookingModalMode; // Affects step order
}
```

**State Management** (Zustand - `bookingStore.ts`):
```typescript
interface BookingState {
  currentStep: number;
  selectedCustomerId: string | null; // For admin/walkin modes
  selectedService: ServiceWithPrices | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  selectedAddons: Addon[]; // Selected in ReviewStep
  selectedAddonIds: string[]; // IDs only
  guestInfo: GuestInfo | null;
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;
}
```

**Mode-Aware Step Rendering**:
```typescript
const renderStep = () => {
  // Walk-in mode: 5 steps
  if (mode === 'walkin') {
    switch (currentStep) {
      case 0: return <ServiceStep />;
      case 1: return <CustomerStep mode="walkin" />;
      case 2: return <PetStep customerId={selectedCustomerId} mode="walkin" />;
      case 3: return <WalkinReviewStep customerId={selectedCustomerId} />;
      case 4: return <ConfirmationStep />;
    }
  }

  // Admin mode: 6 steps (same as customer but with admin customer step)
  if (mode === 'admin') {
    switch (currentStep) {
      case 0: return <ServiceStep />;
      case 1: return <DateTimeStep />;
      case 2: return <CustomerStep mode="admin" />;
      case 3: return <PetStep customerId={selectedCustomerId} mode="admin" />;
      case 4: return <ReviewStep adminMode={true} customerId={selectedCustomerId} />;
      case 5: return <ConfirmationStep />;
    }
  }

  // Customer mode: 6 steps (default)
  switch (currentStep) {
    case 0: return <ServiceStep />;
    case 1: return <DateTimeStep />;
    case 2: return <CustomerStep mode="customer" />;
    case 3: return <PetStep customerId={selectedCustomerId} mode="customer" />;
    case 4: return <ReviewStep />; // Includes add-ons
    case 5: return <ConfirmationStep />;
  }
};
```

### StickyBookingButton (`StickyBookingButton.tsx`) **[NEW]**

**Purpose**: Sticky booking trigger for marketing page that appears after scroll.

**Features**:
- Appears after user scrolls 600px (past hero section)
- Fixed at bottom of viewport with backdrop blur
- Opens BookingModal in 'customer' mode
- Smooth slide-up animation on appearance
- Responsive: Full-width on mobile, centered button on desktop

**Implementation**:
```tsx
export function StickyBookingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { open } = useBookingModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible && (
    <motion.div className="fixed bottom-0 ...">
      <button onClick={() => open({ mode: 'customer' })}>
        Book Your Appointment
      </button>
    </motion.div>
  );
}
```

**Location**: Added to `src/app/(marketing)/layout.tsx`

---

### ServiceStep (`ServiceStep.tsx`)

**Purpose**: Display service cards with size-based pricing.

**Data Fetching**:
```typescript
const { services } = useServices(); // Fetches from /api/services
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
      {/* Shows price range: $40.00 - $85.00 based on pet sizes */}
    </div>
  </ServiceCard>
))}
```

**Validation**: Service must be selected before proceeding.

---

### CustomerStep (`CustomerStep.tsx`) **[REFACTORED]**

**Purpose**: Mode-aware customer selection/creation with different UX for each mode.

**Props**:
```typescript
interface CustomerStepProps {
  mode?: 'customer' | 'admin' | 'walkin';
}
```

**Mode-Specific Behavior**:

#### Customer Mode
- **Login View**: Email + password fields
- **Register View**: First name, last name, email, phone
- **Toggle**: Button to switch between login/register
- **Authenticated**: Shows user confirmation, auto-populates booking info

#### Admin/Walk-in Mode
- **Search Bar**: Search existing customers by name, email, or phone (debounced 300ms)
- **Search Results**: Radio list of matching customers
- **Create Form**: **Always visible** below search (no collapse/expand)
- **Submit Button**: "Use This Customer" - **disabled until all fields complete**

**Features**:
- ✅ Duplicate email detection
- ✅ Form validation using Zod schema
- ✅ Real-time field validation with error messages
- ✅ Button disabled state based on form completion

**New Customer Form Fields**:
- First Name (required)
- Last Name (required)
- Email (required for customer/admin, optional for walk-in)
- Phone (required)

**Validation Rules**:
```typescript
// Button enabled when:
const isFormComplete =
  firstName.trim() !== '' &&
  lastName.trim() !== '' &&
  email.trim() !== '' &&
  phone.trim() !== '' &&
  Object.keys(formErrors).length === 0 &&
  !duplicateEmailError;
```

**Integration with Store**:
```typescript
// When customer selected
setSelectedCustomerId(customer.id);
setGuestInfo({
  firstName: customer.first_name,
  lastName: customer.last_name,
  email: customer.email,
  phone: customer.phone,
});
```

---

### PetStep (`PetStep.tsx`)

**Purpose**: Select existing pet or create new pet profile.

**Props**:
```typescript
interface PetStepProps {
  customerId?: string | null; // For admin/walk-in mode
  mode?: 'customer' | 'admin' | 'walkin';
}
```

**Mode-Aware Behavior**:
- **Customer mode**: Loads current authenticated user's pets
- **Admin/Walk-in mode**: Loads pets for `selectedCustomerId` from store

**Pet Form Fields**:
- Name (required)
- Breed (select from list or custom)
- Size (small, medium, large, xlarge) - **determines pricing**
- Weight (optional)
- Special Notes (optional)

**Size-Based Pricing Update**:
```typescript
// When pet size selected, update service price
useEffect(() => {
  if (petSize && selectedService) {
    const price = calculatePrice(selectedService, petSize);
    updateServicePrice(price);
  }
}, [petSize, selectedService]);
```

---

### DateTimeStep (`DateTimeStep.tsx`)

**Purpose**: Select appointment date and time with real-time availability.

**Time Slot Configuration** (Updated Dec 2025):
- **Interval**: 60 minutes (hourly slots) - changed from 30 minutes
- **Display**: 9:00 AM, 10:00 AM, 11:00 AM, etc.
- **Configuration**: `SLOT_INTERVAL_MINUTES = 60` in `src/lib/booking/availability.ts`

**Availability Checking**:
```typescript
const { slots, isLoading, error } = useAvailability({
  date: selectedDate,
  serviceId: selectedService?.id,
});

// Slots fetched from /api/availability
// Returns array of TimeSlot objects with available/booked status
```

**Calendar Component**:
```tsx
<CalendarPicker
  selectedDate={selectedDate}
  onDateSelect={handleDateSelect}
  disabledDates={disabledDates}
  minDate={minDate}
  maxDate={maxDate}
/>
```

**Time Slot Grid**:
```tsx
<TimeSlotGrid
  slots={slots}
  selectedTime={selectedTimeSlot}
  onTimeSelect={handleTimeSelect}
  onJoinWaitlist={handleJoinWaitlist}
  loading={isLoading}
/>
```

**Waitlist Option**:
Available when no time slots are available for the selected date.

---

### ReviewStep (`ReviewStep.tsx`) **[UPDATED - Includes Add-ons]**

**Purpose**: Review booking details and select add-ons before confirmation.

**Key Change**: Add-ons are now integrated into this step instead of a separate AddonsStep.

**Layout**:
```tsx
<div className="space-y-6">
  {/* Booking Summary */}
  <div>
    <h3>Booking Summary</h3>
    {/* Service, Pet, Date/Time, Customer info */}
  </div>

  {/* Price Breakdown */}
  <div>
    <div>Service: ${servicePrice}</div>
    {selectedAddons.map(addon => (
      <div key={addon.id}>{addon.name}: ${addon.price}</div>
    ))}
    <div className="font-bold">Total: ${totalPrice}</div>
  </div>

  {/* Add-ons Selection - INTEGRATED HERE */}
  {availableAddons.length > 0 && (
    <div>
      <h3>Add Extra Services</h3>

      {/* Upsell add-ons (breed-specific) shown first */}
      {upsellAddons.length > 0 && (
        <div>
          <h4>Recommended for your pet</h4>
          {upsellAddons.map(addon => (
            <AddonCard
              key={addon.id}
              addon={addon}
              selected={selectedAddonIds.includes(addon.id)}
              onToggle={() => toggleAddon(addon)}
            />
          ))}
        </div>
      )}

      {/* Regular add-ons */}
      {regularAddons.map(addon => (
        <AddonCard
          key={addon.id}
          addon={addon}
          selected={selectedAddonIds.includes(addon.id)}
          onToggle={() => toggleAddon(addon)}
        />
      ))}
    </div>
  )}

  {/* Edit buttons for previous steps */}
  <div className="flex gap-2">
    <button onClick={() => setStep(1)}>Edit Date & Time</button>
    <button onClick={() => setStep(3)}>Edit Pet</button>
  </div>
</div>
```

**Add-on Selection**:
- Checkboxes to toggle add-ons
- Price updates in real-time
- Upsell add-ons (breed-specific) shown first with badge
- Regular add-ons shown below

**Navigation**:
- Back button to return to Pet step
- Continue button to proceed to confirmation
- Edit buttons to jump to specific steps

---

### WalkinReviewStep (`WalkinReviewStep.tsx`)

**Purpose**: Combined review and add-ons step for walk-in appointments.

**Key Features**:
- Shows walk-in summary (service, pet, customer)
- Displays "Now (Walk-In)" for appointment time with current timestamp
- Integrated add-ons selection (same as ReviewStep)
- "Confirm Walk-In" button

**Walk-in Specific Logic**:
```typescript
// Set appointment to NOW
const now = new Date();
const appointmentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const appointmentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; // HH:MM

const payload = {
  // ... other fields
  appointment_date: appointmentDate,
  appointment_time: appointmentTime,
  source: 'walk_in', // Important: marks as walk-in
  send_notification: false, // Don't send for walk-ins
};
```

**Status**: Walk-in appointments automatically set to `'checked_in'` status (not 'pending').

---

### ConfirmationStep (`ConfirmationStep.tsx`)

**Purpose**: Display success message and next steps.

**Content**:
```tsx
<div className="text-center py-8">
  <CheckCircle className="w-16 h-16 text-success" />
  <h2>Booking Confirmed!</h2>
  <p>Confirmation email sent to {email}</p>

  <div className="appointment-details">
    <p>{service.name}</p>
    <p>{formattedDate} at {time}</p>
    <p>Confirmation #: {appointmentId}</p>
  </div>

  <div className="actions">
    <Button onClick={goToDashboard}>View My Appointments</Button>
    <Button onClick={bookAnother}>Book Another</Button>
    <Button onClick={goHome}>Return Home</Button>
  </div>
</div>
```

---

## State Management

**Zustand Store** (`src/stores/bookingStore.ts`):

```typescript
interface BookingStore {
  // Current state
  currentStep: number;
  selectedCustomerId: string | null;
  selectedService: ServiceWithPrices | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  selectedAddons: Addon[];
  selectedAddonIds: string[];
  guestInfo: GuestInfo | null;

  // Pricing
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectService: (service: ServiceWithPrices) => void;
  selectPet: (pet: Pet) => void;
  selectDateTime: (date: string, time: string) => void;
  toggleAddon: (addon: Addon) => void;
  setGuestInfo: (info: GuestInfo) => void;
  reset: () => void;

  // Validation
  canNavigateToStep: (step: number) => boolean;
}
```

**Key Methods**:
- `toggleAddon(addon)`: Add/remove add-on and recalculate total
- `canNavigateToStep(step)`: Validates if user can navigate to a specific step
- `reset()`: Clears all booking data and returns to step 0

---

## Validation

Step validation is mode-aware and handled by `src/lib/booking/step-validation.ts`.

**Customer/Admin Mode Validation** (6 steps):
| Step | Validation |
|------|------------|
| 0 | Service selected |
| 1 | Date and time selected |
| 2 | Customer authenticated OR guest info complete |
| 3 | Pet selected or new pet data complete (name + size) |
| 4 | All previous steps valid (add-ons optional) |
| 5 | N/A (confirmation) |

**Walk-in Mode Validation** (5 steps):
| Step | Validation |
|------|------------|
| 0 | Service selected |
| 1 | Customer info valid (name, phone, email/optional) |
| 2 | Pet selected or new pet data complete |
| 3 | All previous steps valid (add-ons optional) |
| 4 | N/A (confirmation) |

---

## API Integration

### Appointment Creation

**Customer/Admin Mode**:
```typescript
POST /api/admin/appointments
{
  customer: {
    id?: string, // UUID or undefined for new
    first_name: string,
    last_name: string,
    email: string,
    phone: string
  },
  pet: {
    id?: string, // UUID or undefined for new
    name: string,
    breed_id?: string,
    size: 'small' | 'medium' | 'large' | 'xlarge',
    weight?: number
  },
  service_id: string,
  addon_ids: string[],
  appointment_date: string, // YYYY-MM-DD
  appointment_time: string, // HH:MM (not HH:MM:SS)
  payment_status: 'pending' | 'paid',
  send_notification: boolean,
  source?: 'walk_in' | 'phone' | 'online' | 'admin'
}
```

**Walk-in Specific**:
- `source: 'walk_in'` - Marks appointment as walk-in (status set to 'checked_in')
- `send_notification: false` - Don't send notifications for walk-ins
- `appointment_date` and `appointment_time` - Set to NOW

**Response**:
```typescript
{
  success: true,
  appointment_id: string,
  booking_reference: string,
  customer_created: boolean,
  customer_status: 'active' | 'inactive',
  pet_created: boolean
}
```

---

## Deleted Components

The following components were removed during the Dec 2025 refactor:

- ❌ `src/components/admin/appointments/WalkInModal.tsx` (replaced by unified BookingModal)
- ❌ `src/components/admin/appointments/ManualAppointmentModal.tsx` (replaced by unified BookingModal)
- ❌ `src/components/admin/appointments/steps/*.tsx` (all duplicate step components)
- ❌ `src/components/booking/steps/AddonsStep.tsx` (integrated into ReviewStep)
- ❌ `src/app/(marketing)/page.tsx` embedded booking widget (replaced by StickyBookingButton)

---

## Related Documentation

- [Admin Panel Routes](../routes/admin-panel.md) - Admin appointment management
- [API Routes](../routes/api.md#appointments) - Appointment API endpoints
- [Marketing Routes](../routes/marketing.md) - Public booking flow
- [Supabase Integration](../services/supabase.md) - Database operations

---

**Last Updated**: 2025-12-26 by Claude Code
**Changes**: Refactored to unified modal, integrated add-ons into review, added login/register, updated time slots to hourly, added sticky button
