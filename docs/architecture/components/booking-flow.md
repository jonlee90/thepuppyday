# Booking Flow - Architecture Documentation

> **Module**: Booking Widget Components
> **Location**: `src/components/booking/`
> **Status**: Completed (Phase 3, Updated Phase 10, Refactored)
> **Last Updated**: 2026-03-07

## Overview

The booking widget is a unified multi-step modal that guides users through the appointment scheduling process. It supports three different modes with mode-specific step orders and behaviors:

- **Customer Mode**: Public-facing booking for customers (6 steps total)
- **Admin Mode**: Admin creating scheduled appointments (6 steps total)
- **Walk-in Mode**: Quick registration for walk-in customers (5 steps total)

**Key Features**:
- Single unified modal component for all booking types
- Mode-aware step flows and UI
- `CustomerStep` and `PetStep` are separate components (previously a single `DetailsStep`)
- Integrated add-ons in review step (no separate add-ons step)
- PriceSummary sidebar on review step (desktop only — no mobile bottom bar)
- Session persistence via Zustand with sessionStorage
- 30-minute session timeout with auto-reset

---

## Booking Modes & Step Orders

### Customer Mode (6 steps)
Used on the marketing page for public bookings via sticky "Book Reservation" button.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | `ServiceStep` | Select grooming service |
| 1 | `CustomerStep` (mode="customer") | Guest info, login, or create account |
| 2 | `PetStep` (mode="customer") | Select or create pet profile |
| 3 | `DateTimeStep` | Choose appointment date/time (hourly slots) |
| 4 | `ReviewStep` | Review booking **with integrated add-ons selection** |
| 5 | `ConfirmationStep` | Success message |

**Trigger**: `StickyBookingButton` appears after scrolling 600px on marketing page

### Admin Mode (6 steps)
Used in `/admin/appointments` for creating appointments.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | `ServiceStep` | Select grooming service |
| 1 | `CustomerStep` (mode="admin") | Search/create customer |
| 2 | `PetStep` (mode="admin") | Select customer's pet or create new |
| 3 | `DateTimeStep` | Choose appointment date/time (hourly slots) |
| 4 | `ReviewStep` (adminMode) | Review appointment **with integrated add-ons selection** |
| 5 | `ConfirmationStep` | Appointment created |

### Walk-in Mode (5 steps)
Used in `/admin/dashboard` for immediate walk-in appointments.

| Step | Component | Description |
|------|-----------|-------------|
| 0 | `ServiceStep` | Select grooming service |
| 1 | `CustomerStep` (mode="walkin") | Search/create customer (form always visible) |
| 2 | `PetStep` (mode="walkin") | Select customer's pet or create new |
| 3 | `WalkinReviewStep` | Review **with integrated add-ons** |
| 4 | `ConfirmationStep` | Walk-in confirmed |

> **Note**: Walk-in mode skips Date/Time step (auto-set to NOW) and uses `WalkinReviewStep` for faster processing. Status automatically set to `'checked_in'` with `source: 'walk_in'`.

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

**Responsive Sizing**:
- **Desktop/Tablet**: Centered modal `max-w-[960px] xl:max-w-[1100px]` - optimized for larger screens
- **Mobile**: Bottom sheet (92vh, slides up from bottom with drag-to-dismiss)
- **Features**: Focus trap, escape key handling, body scroll lock

**Related files**:
- `BookingModalHeader.tsx` - Modal header with step title and close button (mobile: no step counter)
- `BookingModalFooter.tsx` - Modal footer with Back and Continue buttons (mobile: `fixed` positioned at bottom)
- `BookingModalProgress.tsx` - Step progress indicator (mobile: progress bar + step counter centered + step label right; desktop: numbered circles with labels)
- `BookingModalProvider.tsx` - Context provider for modal state
- `BookingModalTrigger.tsx` - Trigger component to open modal

### BookingWizard (`BookingWizard.tsx`)

**Purpose**: Main orchestrator component managing wizard state and step transitions.

**Props**:
```typescript
interface BookingWizardProps {
  preSelectedServiceId?: string;
  embedded?: boolean; // Hide header/progress when in modal
  mode?: BookingModalMode; // Affects step order
  stepContinueRef?: MutableRefObject<(() => Promise<boolean>) | null>;
  onStepCanContinueChange?: (override: boolean | null) => void;
}
```

**Mode-Aware Step Rendering** (actual `renderStep()` from source):
```typescript
const renderStep = () => {
  // Walk-in mode: Service -> Customer -> Pet -> Review -> Confirmation
  if (mode === 'walkin') {
    switch (currentStep) {
      case 0: return <ServiceStep preSelectedServiceId={preSelectedServiceId} />;
      case 1: return <CustomerStep ref={customerStepRef} mode="walkin" onCanContinueChange={onStepCanContinueChange} />;
      case 2: return <PetStep ref={petStepRef} mode="walkin" onCanContinueChange={onStepCanContinueChange} />;
      case 3: return <WalkinReviewStep customerId={selectedCustomerId} />;
      case 4: return <ConfirmationStep />;
    }
  }

  // Admin mode: Service -> Customer -> Pet -> DateTime -> Review -> Confirmation
  if (mode === 'admin') {
    switch (currentStep) {
      case 0: return <ServiceStep preSelectedServiceId={preSelectedServiceId} />;
      case 1: return <CustomerStep ref={customerStepRef} mode="admin" onCanContinueChange={onStepCanContinueChange} />;
      case 2: return <PetStep ref={petStepRef} mode="admin" onCanContinueChange={onStepCanContinueChange} />;
      case 3: return <DateTimeStep />;
      case 4: return <ReviewStep adminMode={true} customerId={selectedCustomerId} />;
      case 5: return <ConfirmationStep />;
    }
  }

  // Customer mode: Service -> Customer -> Pet -> DateTime -> Review -> Confirmation
  switch (currentStep) {
    case 0: return <ServiceStep preSelectedServiceId={preSelectedServiceId} />;
    case 1: return <CustomerStep ref={customerStepRef} mode="customer" onCanContinueChange={onStepCanContinueChange} />;
    case 2: return <PetStep ref={petStepRef} mode="customer" onCanContinueChange={onStepCanContinueChange} />;
    case 3: return <DateTimeStep />;
    case 4: return <ReviewStep />;
    case 5: return <ConfirmationStep />;
  }
};
```

**PriceSummary Sidebar**: The wizard conditionally renders a `PriceSummary` component in a sidebar layout on the Review step:
- **Desktop/Tablet** (`md:` and up): Sticky sidebar in a 3-column grid (2 cols step content + 1 col sidebar)
- **Mobile**: Not shown — no mobile price summary bar
- Only visible on the Review step (step 4 for customer/admin, step 3 for walkin)

**Session Expiry**: On mount, checks `isSessionExpired()` and calls `reset()` if the 30-minute timeout has elapsed.

**Animations**: Uses Framer Motion `AnimatePresence` for step transitions with slide left/right and fade.

### PriceSummary (`PriceSummary.tsx`)

**Purpose**: Order summary card showing service price, add-ons, and total.

**Props**:
```typescript
interface PriceSummaryProps {
  serviceName: string | null;
  servicePrice: number;
  addons: { name: string; price: number }[];
  total: number;
}
```

**Design**: White card with cream header/footer, displays "Order Summary" with service breakdown, add-on list, and bold total. Footer shows "Payment collected at checkout".

### StickyBookingButton (`StickyBookingButton.tsx`)

**Purpose**: Sticky booking trigger for marketing page that appears after scroll.

**Features**:
- Appears after user scrolls 600px (past hero section)
- Fixed at bottom of viewport with backdrop blur
- Opens BookingModal in 'customer' mode
- Smooth slide-up animation on appearance
- Responsive: Full-width on mobile, centered button on desktop

**Location**: Added to `src/app/(marketing)/layout.tsx`

---

### ServiceStep (`steps/ServiceStep.tsx`)

**Purpose**: Display service cards with size-based pricing.

**Performance**: The `bookableServices` filter (excludes "Add-Ons" service) is wrapped in `useMemo` keyed on `services` to prevent unnecessary re-renders and stabilize downstream dependencies.

**Service Card Props** (`ServiceCard.tsx`):
```typescript
interface ServiceCardProps {
  service: ServiceWithPrices;
  isSelected: boolean;
  onSelect: () => void;
}
```

**ServiceCard Design**: Editorial magazine-inspired card with:
- 3:2 aspect ratio image container with gradient background
- Duration badge (top-left) showing formatted time
- Selected checkmark (top-right) with spring animation
- Price display showing minimum price with "Based on pet size" note
- Selected state: orange glow overlay, accent line at bottom, ring border
- Hover: lift effect (`y: -4`), enhanced shadow
- Accessibility: `aria-pressed` and `aria-label` attributes

**Validation**: Service must be selected before proceeding.

---

### CustomerStep (`steps/CustomerStep.tsx`)

**Purpose**: Handles customer identification for the booking wizard. Extracted from the former `DetailsStep` component.

**Props**:
```typescript
interface CustomerStepProps {
  mode?: BookingModalMode; // 'customer' | 'admin' | 'walkin'
  onCanContinueChange?: (override: boolean | null) => void;
}
```

Uses `forwardRef` with `CustomerStepHandle` (`{ onContinue: () => Promise<boolean> }`) for the footer's continue logic.

**Customer Mode — 3 View States**:
- **`guest`** (default): First name, last name, email, phone, address, city, ZIP fields (no password)
- **`createAccount`**: Same fields as guest, plus password + confirm password fields
- **`login`**: Email + password fields only
- Toggle buttons at top switch between `createAccount` and `login`; a "continue as guest" link returns to `guest`
- **Authenticated**: Shows green confirmation card with user info (UserCheck icon)

**Admin/Walk-in Mode**:
- **Search Bar**: Search existing customers by name, email, or phone (debounced 300ms)
- **Search Results**: Radio list of matching customers with selection
- **OR Divider**: Visual separator between search and create
- **Create Form**: Always visible below search
- **Selected Display**: Green confirmation card showing selected customer

**Features**:
- Duplicate email detection via API check (admin/walkin only)
- Form validation using Zod schema (`guestInfoSchema`)
- Phone number masking via `usePhoneMask` hook
- `onContinue` imperative handle validates and saves state; returns `false` to block navigation on error

---

### PetStep (`steps/PetStep.tsx`)

**Purpose**: Handles pet selection or creation for the booking wizard. Extracted from the former `DetailsStep` component.

**Props**:
```typescript
interface PetStepProps {
  mode?: BookingModalMode; // 'customer' | 'admin' | 'walkin'
  onCanContinueChange?: (override: boolean | null) => void;
}
```

Uses `forwardRef` with `PetStepHandle` (`{ onContinue: () => Promise<boolean> }`) for the footer's continue logic.

**Features**:
- Loads pets for the effective owner (authenticated user or selected customer)
- Shows existing pets as `PetCard` components with selection
- `AddPetCard` to open `PetForm` for creating new pet
- Loading skeleton and error states with retry

---

### DateTimeStep (`steps/DateTimeStep.tsx`)

**Purpose**: Select appointment date and time with real-time availability.

**Time Slot Configuration**:
- **Interval**: 60 minutes (hourly slots)
- **Display**: 9:00 AM, 10:00 AM, 11:00 AM, etc.

**Sub-components**:
- `CalendarPicker` (`CalendarPicker.tsx`) - Date selection calendar
- `TimeSlotGrid` (`TimeSlotGrid.tsx`) - Grid of available time slots

**Waitlist Option**: Available when no time slots are available for the selected date, opens `WaitlistModal`.

---

### ReviewStep (`steps/ReviewStep.tsx`)

**Purpose**: Review booking details and select add-ons before confirmation.

**Key Change**: Add-ons are integrated into this step instead of a separate AddonsStep.

**Props**:
```typescript
interface ReviewStepProps {
  adminMode?: boolean;
  customerId?: string | null;
}
```

**Features**:
- Booking summary (service, pet, date/time, customer info)
- Integrated add-ons selection with upsell add-ons (breed-specific) shown first
- Price breakdown with real-time updates
- Edit buttons to jump to specific previous steps

> **Note**: `AddonsStep.tsx` still exists as a file in `steps/` but is no longer used in the booking flow. It was superseded by the add-ons integration in ReviewStep.

---

### WalkinReviewStep (`steps/WalkinReviewStep.tsx`)

**Purpose**: Combined review and add-ons step for walk-in appointments.

**Props**:
```typescript
interface WalkinReviewStepProps {
  customerId?: string | null;
}
```

**Walk-in Specific Logic**:
- Displays "Now (Walk-In)" for appointment time with current timestamp
- Sets `source: 'walk_in'` and `send_notification: false`
- Status automatically set to `'checked_in'` (not 'pending')

---

### ConfirmationStep (`steps/ConfirmationStep.tsx`)

**Purpose**: Display success message and next steps after booking is confirmed.

---

## Supporting Components

| File | Purpose |
|------|---------|
| `BookingProgress.tsx` | Step progress bar with clickable steps |
| `AddonCard.tsx` | Individual add-on card with toggle |
| `PetCard.tsx` | Pet selection card + AddPetCard |
| `PetForm.tsx` | Pet creation/edit form |
| `GuestInfoForm.tsx` | Guest info form (unauthenticated booking) |
| `GroomerSelect.tsx` | Groomer selection dropdown |
| `WaitlistModal.tsx` | Waitlist join modal |
| `index.ts` | Module exports |

---

## State Management

**Zustand Store** (`src/stores/bookingStore.ts`) with `sessionStorage` persistence:

```typescript
interface BookingState {
  // Current step and mode
  currentStep: number;
  mode: BookingModalMode;

  // Admin/Walk-in: Selected customer and groomer
  selectedCustomerId: string | null;
  selectedGroomerId: string | null;

  // Service
  selectedServiceId: string | null;
  selectedService: ServiceWithPrices | null;

  // Pet
  selectedPetId: string | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;

  // Date/Time
  selectedDate: string | null;
  selectedTimeSlot: string | null;

  // Add-ons
  selectedAddonIds: string[];
  selectedAddons: Addon[];

  // Guest info (for unauthenticated users)
  guestInfo: GuestInfo | null;

  // Calculated values
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;

  // Session tracking
  lastActivityTimestamp: number;

  // Booking result
  bookingId: string | null;
  bookingReference: string | null;
}
```

**Actions**:
```typescript
interface BookingActions {
  setMode: (mode: BookingModalMode) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canNavigateToStep: (step: number) => boolean;
  selectService: (service: ServiceWithPrices) => void;
  selectPet: (pet: Pet) => void;
  setNewPetData: (data: CreatePetInput | null) => void;
  setPetSize: (size: PetSize) => void;
  clearPetSelection: () => void;
  selectDateTime: (date: string, time: string) => void;
  clearDateTime: () => void;
  toggleAddon: (addon: Addon) => void;
  clearAddons: () => void;
  setGuestInfo: (info: GuestInfo) => void;
  setSelectedCustomerId: (customerId: string | null) => void;
  setSelectedGroomerId: (groomerId: string | null) => void;
  setBookingResult: (id: string, reference: string) => void;
  calculatePrices: () => void;
  updateActivity: () => void;
  reset: () => void;
  isSessionExpired: () => boolean;
}
```

**Max Steps per Mode**:
```typescript
const MAX_STEP: Record<BookingModalMode, number> = {
  customer: 5, // 6 steps: 0-5
  admin: 5,    // 6 steps: 0-5
  walkin: 4,   // 5 steps: 0-4
};
```

**Session Timeout**: 30 minutes (`SESSION_TIMEOUT_MS = 30 * 60 * 1000`). Session persisted to `sessionStorage` under key `'booking-session'`. On rehydration, expired sessions are automatically reset.

**Selector Hooks**: Exported convenience selectors for common patterns:
- `useCurrentStep()`, `useSelectedService()`, `useSelectedPet()`, `usePetSize()`
- `useSelectedDateTime()`, `useSelectedAddons()`, `usePriceSummary()`, `useBookingResult()`

---

## API Integration

### Appointment Creation

**Endpoint**: `POST /api/admin/appointments`

**Request**:
```typescript
{
  customer: {
    id?: string,
    first_name: string,
    last_name: string,
    email: string,
    phone: string
  },
  pet: {
    id?: string,
    name: string,
    breed_id?: string,
    size: 'small' | 'medium' | 'large' | 'xlarge',
    gender: 'male' | 'female',
    color?: string
  },
  service_id: string,
  addon_ids: string[],
  appointment_date: string, // YYYY-MM-DD
  appointment_time: string, // HH:MM
  payment_status: 'pending' | 'paid',
  send_notification: boolean,
  source?: 'walk_in' | 'phone' | 'online' | 'admin'
}
```

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

The following components were removed during prior refactors:

- `src/components/booking/steps/DetailsStep.tsx` (replaced by separate `CustomerStep.tsx` and `PetStep.tsx`)
- `src/components/admin/appointments/WalkInModal.tsx` (replaced by unified BookingModal)
- `src/components/admin/appointments/ManualAppointmentModal.tsx` (replaced by unified BookingModal)
- `src/components/admin/appointments/steps/*.tsx` (all duplicate step components)
- `src/app/(marketing)/page.tsx` embedded booking widget (replaced by StickyBookingButton)

> **Note**: `AddonsStep.tsx` still exists as a file but is no longer referenced in the booking flow.

---

## Related Documentation

- [Admin Panel Routes](../routes/admin-panel.md) - Admin appointment management
- [API Routes](../routes/api.md#appointments) - Appointment API endpoints
- [Marketing Routes](../routes/marketing.md) - Public booking flow
- [Supabase Integration](../services/supabase.md) - Database operations

---

**Last Updated**: 2026-03-14 by Claude Code
**Changes**: Replaced DetailsStep references with separate CustomerStep and PetStep; updated step order tables (Customer now before DateTime in all modes); updated BookingModal sizing; updated PriceSummary mobile note; added users table is_active/created_by_admin/activated_at columns; corrected Deleted Components list.
