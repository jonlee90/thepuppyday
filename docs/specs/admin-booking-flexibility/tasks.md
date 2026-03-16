# Admin Booking Flexibility - Implementation Tasks

## Overview

Enhances the admin booking modal to give staff full control over scheduling and pricing: unrestricted date/time selection, double-booking support, past date booking with auto-completion, notification control with smart defaults, and price adjustments during booking creation.

**Progress**: 10/10 tasks complete (100%) — Tasks 0117-0124 complete (2026-03-16). Tasks 0125-0126 complete (2026-03-16).

**Document References**:
- Requirements: `docs/specs/admin-booking-flexibility/requirements.md`
- Design: `docs/specs/admin-booking-flexibility/design.md`

---

## Section 1: Store and API Backend

### Task 0117: Add Price Adjustment State and Actions to bookingStore
- [x] Add `PriceAdjustment` interface and `priceAdjustments: PriceAdjustment[]` to `BookingState`
- [x] Add `addPriceAdjustment`, `removePriceAdjustment`, `clearPriceAdjustments` actions
- [x] Update `calculatePrices` to include `adjustmentsTotal` from `priceAdjustments`
- [x] Update `initialState` and `reset` to clear `priceAdjustments`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Store correctly tracks price adjustments; `calculatePrices` returns total inclusive of adjustments; reset clears them
- **References**: Requirement 5, Design "Booking Store Changes"
- **Files**: `src/stores/bookingStore.ts`

### Task 0118: Create Conflict Check API Endpoint
- [x] Create `GET /api/admin/appointments/conflicts` route accepting `date` and `time` query params
- [x] Authenticate with `requireAdmin()` and query with service role client
- [x] Return `{ count, appointments: [{ id, customer_name, service_name, status }] }`
- [x] Handle missing/invalid params with 400 response
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Returns correct count of existing appointments at given date/time; rejects unauthenticated requests
- **References**: Requirement 2.2, Design "Conflict Check Endpoint"
- **Files**: `src/app/api/admin/appointments/conflicts/route.ts`

### Task 0119: Update Admin Appointments POST Route for Backdating and Price Adjustments
- [x] Add `price_adjustments` array to `CreateAppointmentSchema` with Zod validation (label min 1, amount non-zero, note max 500)
- [x] Determine status based on date: set `status = 'completed'` if `appointment_date` is before today (and source is not `walk_in`)
- [x] After appointment + addons insert, insert price adjustment records via `Promise.all()` into `appointment_price_adjustments`
- [x] Recalculate and update `total_price` on the appointment after adjustments
- [x] Move notification sending to `after()` from `next/server` for non-blocking execution
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Backdated appointments get `status = 'completed'`; price adjustments are persisted and total_price updated; notifications are non-blocking
- **References**: Requirements 3.3, 5.4, Design "API Route Changes"
- **Files**: `src/app/api/admin/appointments/route.ts`

---

## Section 2: UI Components

### Task 0120: Create AdminFreeTimeInput Component
- [x] Create component with `<input type="time">` using standard input styling (no `input-sm`)
- [x] Show amber backdated indicator badge when `isBackdated` is true: "Backdating -- this appointment will be marked as completed"
- [x] Add conflict indicator that fetches `GET /api/admin/appointments/conflicts` (debounced 300ms) and shows non-blocking info badge with count
- [x] Silently catch conflict fetch errors (non-blocking)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Free-form time input renders without clipping; backdated badge appears for past dates; conflict count shown as non-blocking indicator
- **References**: Requirements 1.2, 2.2, 3.2, Design "AdminFreeTimeInput"
- **Files**: `src/components/booking/AdminFreeTimeInput.tsx`

### Task 0121: Create PriceAdjustmentForm Component for Booking Flow
- [x] Create `React.memo` wrapped component with surcharge/discount toggle, label + amount + note inputs
- [x] Add animated list with `AnimatePresence` for existing adjustments (color-coded amounts, hover-reveal delete)
- [x] Match UI pattern from `AppointmentDetailModal` price adjustment section
- [x] Export for dynamic import (`next/dynamic`, `ssr: false`)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Form allows adding/removing adjustments; surcharges and discounts display with correct colors; animation matches existing pattern
- **References**: Requirement 5.1, 5.6, Design "PriceAdjustmentForm"
- **Files**: `src/components/booking/PriceAdjustmentForm.tsx`

---

## Section 3: Integration into Booking Steps

### Task 0122: Update DateTimeStep for Admin Mode (Unrestricted Selection)
- [x] Pass `null` date/serviceId to `useAvailability` in admin mode to skip availability fetch
- [x] Pass `disabledDates={[]}`, `minDate={undefined}`, `maxDate={undefined}` to `CalendarPicker` in admin mode
- [x] Replace `TimeSlotGrid` with dynamically imported `AdminFreeTimeInput` when `mode === 'admin'`
- [x] Derive `isBackdated` during render (not via useEffect): `selectedDate < todayString`
- [x] When admin selects past date, call `setSendNotification(false)`; on future date, call `setSendNotification(true)`
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Admin mode shows all dates selectable, free-form time input; customer mode unchanged; notification toggle auto-defaults based on backdating
- **References**: Requirements 1.1-1.4, 3.1, 4.3, Design "DateTimeStep"
- **Files**: `src/components/booking/steps/DateTimeStep.tsx`

### Task 0123: Update ReviewStep with Price Adjustments and Enhanced Price Breakdown
- [x] Dynamically import and render `PriceAdjustmentForm` in admin mode only (ternary, not `&&`)
- [x] Add adjustment line items to the price breakdown section (color-coded: green for discounts)
- [x] Include `price_adjustments` in the admin booking submission payload (map out `id` field)
- [x] Ensure the existing notification toggle defaults correctly (already handled by DateTimeStep setting store)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Admin sees price adjustment form and line items in breakdown; total reflects adjustments; customer mode shows no adjustment UI; payload includes adjustments
- **References**: Requirements 5.1-5.5, Design "ReviewStep"
- **Files**: `src/components/booking/steps/ReviewStep.tsx`

---

## Section 4: Polish and Testing

### Task 0124: Add Backdated Indicator to ReviewStep Summary
- [x] Show a subtle amber indicator in the review summary when booking is backdated: "This appointment will be created with 'completed' status"
- [x] Verify notification toggle shows unchecked state for backdated bookings in the review
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Backdated indicator visible in review step; notification toggle reflects correct default
- **References**: Requirement 3.2, 4.3, Design "ReviewStep"
- **Files**: `src/components/booking/steps/ReviewStep.tsx`

### Task 0125: Write Unit Tests for Store and API Changes
- [x] Test `addPriceAdjustment`, `removePriceAdjustment`, `clearPriceAdjustments` store actions
- [x] Test `calculatePrices` includes adjustment totals correctly
- [x] Test `CreateAppointmentSchema` accepts valid `price_adjustments` and rejects invalid entries (zero amount, empty label, note > 500)
- [x] Test backdated status determination logic (past date -> completed, walk_in -> in_progress, future -> pending)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All unit tests pass; edge cases covered (negative totals, empty arrays, timezone boundaries)
- **References**: Design "Testing Strategy" items 1-3
- **Files**: `src/stores/__tests__/bookingStore.test.ts`, `src/app/api/admin/appointments/__tests__/route.test.ts`

### Task 0126: Write Integration Tests for Admin Booking Flow
- [x] Test POST to `/api/admin/appointments` with `price_adjustments` creates records and updates total
- [x] Test POST with past date creates appointment with `status = 'completed'`
- [x] Test GET `/api/admin/appointments/conflicts` returns correct count
- [x] Test customer booking flow is unaffected (still enforces restrictions)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: Integration tests verify end-to-end data flow for all new behaviors
- **References**: Design "Testing Strategy" items 4-7
- **Files**: `src/app/api/admin/appointments/__tests__/integration.test.ts`
