# Design Document - Phase 3: Booking System

## Overview

This document outlines the technical design for The Puppy Day booking system. The system is built as a multi-step wizard component that guides customers through service selection, pet selection, scheduling, add-on selection, and confirmation. It supports both authenticated and guest booking flows while integrating with existing mock services.

## Architecture

### Component Structure

```
src/
├── app/
│   └── (marketing)/
│       └── book/
│           ├── page.tsx              # Booking page wrapper
│           └── loading.tsx           # Loading skeleton
├── components/
│   └── booking/
│       ├── BookingWizard.tsx         # Main wizard orchestrator
│       ├── BookingProgress.tsx       # Step progress indicator
│       ├── BookingContext.tsx        # Booking state provider
│       ├── steps/
│       │   ├── ServiceStep.tsx       # Step 1: Service selection
│       │   ├── PetStep.tsx           # Step 2: Pet selection/creation
│       │   ├── DateTimeStep.tsx      # Step 3: Date & time picker
│       │   ├── AddonsStep.tsx        # Step 4: Add-on selection
│       │   ├── ReviewStep.tsx        # Step 5: Review & contact info
│       │   └── ConfirmationStep.tsx  # Step 6: Booking confirmed
│       ├── ServiceCard.tsx           # Service display card
│       ├── PetCard.tsx               # Pet selection card
│       ├── PetForm.tsx               # New pet creation form
│       ├── CalendarPicker.tsx        # Date selection calendar
│       ├── TimeSlotGrid.tsx          # Available time slots
│       ├── AddonCard.tsx             # Add-on selection card
│       ├── PriceSummary.tsx          # Running price total
│       └── GuestInfoForm.tsx         # Guest contact form
├── hooks/
│   └── useBooking.ts                 # Booking logic hook
├── stores/
│   └── bookingStore.ts               # Zustand booking state
└── lib/
    └── booking/
        ├── availability.ts           # Slot availability calculations
        ├── pricing.ts                # Price calculation utilities
        └── validation.ts             # Booking form validation
```

### State Management

The booking wizard uses Zustand for state management with session storage persistence.

```typescript
// stores/bookingStore.ts
interface BookingState {
  // Current step (0-5)
  currentStep: number;

  // Step 1: Service
  selectedServiceId: string | null;
  selectedService: ServiceWithPrices | null;

  // Step 2: Pet
  selectedPetId: string | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;

  // Step 3: Date/Time
  selectedDate: string | null;  // ISO date string
  selectedTimeSlot: string | null;  // HH:mm format

  // Step 4: Add-ons
  selectedAddonIds: string[];
  selectedAddons: Addon[];

  // Step 5: Guest info (for unauthenticated users)
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;

  // Calculated values
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectService: (service: ServiceWithPrices) => void;
  selectPet: (pet: Pet) => void;
  setNewPetData: (data: CreatePetInput) => void;
  setPetSize: (size: PetSize) => void;
  selectDateTime: (date: string, time: string) => void;
  toggleAddon: (addon: Addon) => void;
  setGuestInfo: (info: BookingState['guestInfo']) => void;
  calculatePrices: () => void;
  reset: () => void;
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      BookingWizard                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  BookingContext                          │    │
│  │  (Provides: bookingStore, services, pets, addons, etc.) │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│    ┌─────────────────────────┼─────────────────────────┐        │
│    ▼                         ▼                         ▼        │
│ ┌──────────┐         ┌──────────────┐          ┌──────────┐    │
│ │ServiceStep│ ──────▶│  PetStep     │ ───────▶│DateTimeStep│   │
│ └──────────┘         └──────────────┘          └──────────┘    │
│                                                      │          │
│    ┌─────────────────────────────────────────────────┘          │
│    ▼                                                            │
│ ┌──────────┐         ┌──────────────┐          ┌────────────┐  │
│ │AddonsStep│ ──────▶│  ReviewStep  │ ───────▶│Confirmation │  │
│ └──────────┘         └──────────────┘          └────────────┘  │
│                              │                                  │
│                              ▼                                  │
│                    ┌──────────────────┐                        │
│                    │ Create Appointment│                        │
│                    │ (appointmentStore)│                        │
│                    └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### BookingWizard

Main orchestrator component that renders the current step and manages navigation.

```typescript
interface BookingWizardProps {
  preSelectedServiceId?: string;  // From URL parameter
}

// Features:
// - Renders BookingProgress at top
// - Renders current step component based on currentStep
// - Renders PriceSummary sidebar on desktop (bottom on mobile)
// - Handles step transitions with Framer Motion animations
```

### BookingProgress

Visual step indicator showing progress through the wizard.

```typescript
interface BookingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;  // Navigate to completed steps
}

// Visual Design:
// - Horizontal on desktop, compact on mobile
// - Numbered circles connected by lines
// - Completed: filled primary color
// - Current: primary color with pulse animation
// - Upcoming: gray outline
```

### ServiceStep

Displays available services for selection.

```typescript
// Layout:
// - Grid of ServiceCards (3 columns desktop, 2 tablet, 1 mobile)
// - Each card shows: image, name, description preview, price range, duration
// - Selected card has primary border and checkmark

interface ServiceCardProps {
  service: ServiceWithPrices;
  isSelected: boolean;
  onSelect: () => void;
}
```

### PetStep

Pet selection for authenticated users or pet creation form.

```typescript
// For authenticated users:
// - Grid of existing PetCards
// - "Add New Pet" card at the end

// For guests or new pet:
// - PetForm with fields: name, size (required), breed (optional), weight (optional)
// - Size selector with weight ranges displayed

interface PetCardProps {
  pet: Pet;
  isSelected: boolean;
  onSelect: () => void;
}

interface PetFormProps {
  onSubmit: (data: CreatePetInput) => void;
  initialData?: Partial<CreatePetInput>;
}
```

### DateTimeStep

Calendar and time slot selection.

```typescript
interface CalendarPickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  disabledDates: string[];  // Past dates, closed days
  minDate: string;  // Today
  maxDate: string;  // 2 months ahead
}

interface TimeSlotGridProps {
  date: string;
  serviceId: string;
  serviceDuration: number;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  onJoinWaitlist: (time: string) => void;
}

// Time slot states:
// - Available: selectable, shows time
// - Selected: primary background
// - Unavailable: grayed out, "Join Waitlist" button
```

### AddonsStep

Optional add-on selection with upsell prompts.

```typescript
interface AddonCardProps {
  addon: Addon;
  isSelected: boolean;
  isUpsell: boolean;  // Matches pet breed
  onToggle: () => void;
}

// Layout:
// - List of AddonCards
// - Upsell addons highlighted at top with special styling
// - "Skip" button to proceed without add-ons
```

### ReviewStep

Final review before confirmation.

```typescript
// Displays:
// - Service name and price
// - Pet name and size
// - Date and time
// - Selected add-ons (if any)
// - Itemized total
// - GuestInfoForm (for unauthenticated users)
// - "Confirm Booking" button

interface GuestInfoFormProps {
  onSubmit: (info: GuestInfo) => void;
  initialData?: Partial<GuestInfo>;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
```

### ConfirmationStep

Booking success display.

```typescript
// Displays:
// - Success icon and message
// - Booking reference number
// - Appointment details summary
// - "View My Appointments" button (authenticated)
// - "Create Account" prompt (guests)
// - "Book Another" button
```

### PriceSummary

Running total displayed throughout booking.

```typescript
interface PriceSummaryProps {
  serviceName: string | null;
  servicePrice: number;
  addons: { name: string; price: number }[];
  total: number;
}

// Features:
// - Sticky sidebar on desktop
// - Collapsible bottom bar on mobile
// - Price updates animate with number transition
```

## Availability Calculation

### Business Hours

```typescript
// lib/booking/availability.ts

interface BusinessHours {
  [day: string]: {
    open: string;   // "09:00"
    close: string;  // "17:00"
    is_open: boolean;
  };
}

function getAvailableSlots(
  date: string,
  serviceId: string,
  serviceDuration: number,
  existingAppointments: Appointment[],
  businessHours: BusinessHours
): TimeSlot[] {
  // 1. Get business hours for the day
  // 2. Generate 30-minute slots within hours
  // 3. Filter out slots that conflict with existing appointments
  // 4. Filter out slots where service duration would exceed closing
  // 5. Return available and unavailable slots
}

interface TimeSlot {
  time: string;        // "09:00"
  available: boolean;
  waitlistCount?: number;  // If unavailable, show waitlist depth
}
```

### Conflict Detection

```typescript
function hasConflict(
  slotStart: string,
  slotDuration: number,
  existingAppointments: Appointment[]
): boolean {
  // Check if the proposed slot overlaps with any existing appointment
  // Consider: appointment start, duration, buffer time
}
```

## Price Calculation

```typescript
// lib/booking/pricing.ts

interface PriceBreakdown {
  servicePrice: number;
  addonsTotal: number;
  subtotal: number;
  tax: number;        // If applicable
  deposit: number;    // If applicable
  total: number;
}

function calculatePrice(
  service: ServiceWithPrices,
  petSize: PetSize,
  addons: Addon[],
  settings: { taxRate?: number; depositPercentage?: number }
): PriceBreakdown {
  // 1. Get service price for pet size
  // 2. Sum add-on prices
  // 3. Calculate tax if enabled
  // 4. Calculate deposit if required
  // 5. Return breakdown
}
```

## Form Validation

```typescript
// lib/booking/validation.ts
import { z } from 'zod';

const guestInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
});

const petFormSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  breed_id: z.string().optional(),
  breed_custom: z.string().optional(),
  weight: z.number().positive().optional(),
});
```

## API Integration

### Mock Store Extensions

The booking system uses existing mock stores with additional methods:

```typescript
// Appointment creation
appointmentStore.create({
  customer_id: string;
  pet_id: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  total_price: number;
  notes?: string;
  addon_ids?: string[];
});

// Waitlist entry
waitlistStore.create({
  customer_id: string;
  pet_id: string;
  service_id: string;
  requested_date: string;
  time_preference: 'morning' | 'afternoon' | 'any';
});

// Check slot availability
appointmentStore.getByDateRange(startDate, endDate);
```

## UI/UX Design

### Color Scheme

- Primary actions: `btn-primary` (DaisyUI)
- Selected states: `border-primary`, `bg-primary/10`
- Unavailable: `opacity-50`, `cursor-not-allowed`
- Success: `text-success`, `bg-success/10`
- Error: `text-error`, `input-error`

### Animations

```typescript
// Step transitions
const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Price update
const priceVariants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.1, 1] },
};

// Card selection
const cardVariants = {
  idle: { scale: 1 },
  selected: { scale: 1.02 },
  hover: { scale: 1.01 },
};
```

### Responsive Breakpoints

```
Mobile (<640px):
- Single column layout
- Bottom sticky price bar (collapsible)
- Full-width step navigation buttons
- Calendar in compact mode

Tablet (640px-1024px):
- 2-column service/pet grids
- Side-by-side date and time selection
- Floating price summary

Desktop (>1024px):
- 3-column service grid
- Sidebar price summary (sticky)
- Horizontal step progress indicator
```

## Session Persistence

```typescript
// bookingStore.ts with persist middleware
import { persist } from 'zustand/middleware';

const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'booking-session',
      storage: {
        getItem: (name) => {
          const item = sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      // Clear after 30 minutes of inactivity
      onRehydrateStorage: () => (state) => {
        const lastActivity = state?.lastActivityTimestamp;
        if (lastActivity && Date.now() - lastActivity > 30 * 60 * 1000) {
          state?.reset();
        }
      },
    }
  )
);
```

## Error Handling

### Slot Conflict Resolution

```typescript
async function confirmBooking(bookingData: BookingData) {
  try {
    // 1. Re-check slot availability before creating
    const isAvailable = await checkSlotAvailable(
      bookingData.date,
      bookingData.time,
      bookingData.serviceDuration
    );

    if (!isAvailable) {
      throw new SlotUnavailableError('This slot is no longer available');
    }

    // 2. Create appointment
    const appointment = await appointmentStore.create(bookingData);

    return appointment;
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      // Navigate back to date/time step
      bookingStore.setStep(2);
      toast.error('This slot was just booked. Please select another time.');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
    throw error;
  }
}
```

## Testing Considerations

### Key Test Scenarios

1. **Complete booking flow** - Guest and authenticated paths
2. **Price calculation** - Different sizes, multiple add-ons
3. **Availability logic** - Slot conflicts, business hours
4. **Session persistence** - Data survives refresh
5. **Validation** - Form errors display correctly
6. **Waitlist** - Join when slot unavailable
7. **Mobile UX** - Touch interactions work correctly

## Security Considerations

1. **Input validation** - All user input validated with Zod
2. **Rate limiting** - Prevent booking spam (handled at API level)
3. **Double-booking prevention** - Atomic slot reservation
4. **Email verification** - For guest bookings (future enhancement)
5. **CSRF protection** - Next.js built-in handling
