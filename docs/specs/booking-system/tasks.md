# Implementation Tasks - Phase 3: Booking System

## Overview

This document contains the implementation checklist for the booking system. Tasks are ordered by dependency - complete earlier tasks before later ones.

---

## Tasks

### Task 1: Create Booking Store (Zustand)

**Priority:** High | **Estimate:** 2 hours

Create the Zustand store for managing booking wizard state with session persistence.

**Files to create/modify:**
- `src/stores/bookingStore.ts`

**Acceptance Criteria:**
- [ ] Store manages all booking state (service, pet, date/time, add-ons, guest info)
- [ ] Step navigation actions (next, prev, setStep)
- [ ] Price calculation computed values
- [ ] Session storage persistence with 30-min expiry
- [ ] Reset action to clear all state

---

### Task 2: Create Booking Utilities

**Priority:** High | **Estimate:** 2 hours

Create utility functions for availability calculation, pricing, and validation.

**Files to create/modify:**
- `src/lib/booking/availability.ts`
- `src/lib/booking/pricing.ts`
- `src/lib/booking/validation.ts`

**Acceptance Criteria:**
- [ ] `getAvailableSlots()` calculates available time slots for a date
- [ ] `hasConflict()` checks for appointment overlaps
- [ ] `calculatePrice()` computes total with size-based pricing and add-ons
- [ ] Zod schemas for guest info and pet form validation
- [ ] Unit tests for pricing and availability functions

---

### Task 3: Create BookingWizard Container

**Priority:** High | **Estimate:** 2 hours

Create the main wizard orchestrator component with step management and animations.

**Files to create/modify:**
- `src/components/booking/BookingWizard.tsx`
- `src/components/booking/BookingProgress.tsx`
- `src/components/booking/BookingContext.tsx`

**Acceptance Criteria:**
- [ ] Renders current step based on store state
- [ ] Progress indicator shows completed, current, and upcoming steps
- [ ] Navigation between completed steps via progress clicks
- [ ] Framer Motion step transition animations
- [ ] Responsive layout (sidebar on desktop, bottom bar on mobile)

---

### Task 4: Create ServiceStep Component

**Priority:** High | **Estimate:** 2 hours

Build the service selection step with service cards grid.

**Files to create/modify:**
- `src/components/booking/steps/ServiceStep.tsx`
- `src/components/booking/ServiceCard.tsx`

**Acceptance Criteria:**
- [ ] Fetches and displays active services from serviceStore
- [ ] Service cards show image, name, description, price range, duration
- [ ] Selected state with visual highlight
- [ ] Next button enabled only when service selected
- [ ] Responsive grid (3 cols desktop, 2 tablet, 1 mobile)

---

### Task 5: Create PetStep Component

**Priority:** High | **Estimate:** 3 hours

Build the pet selection and creation step.

**Files to create/modify:**
- `src/components/booking/steps/PetStep.tsx`
- `src/components/booking/PetCard.tsx`
- `src/components/booking/PetForm.tsx`

**Acceptance Criteria:**
- [ ] Authenticated users see their pets list
- [ ] Pet cards show photo, name, breed, size
- [ ] "Add New Pet" option available
- [ ] Pet form with name (required), size (required), breed, weight
- [ ] Size selection shows weight ranges
- [ ] Price updates when size is selected/changed
- [ ] Guest flow shows pet form directly

---

### Task 6: Create CalendarPicker Component

**Priority:** High | **Estimate:** 3 hours

Build the date selection calendar.

**Files to create/modify:**
- `src/components/booking/CalendarPicker.tsx`

**Acceptance Criteria:**
- [ ] Displays current and next month
- [ ] Past dates disabled
- [ ] Closed days (from business hours) disabled
- [ ] Selected date highlighted
- [ ] Mobile-friendly touch targets
- [ ] Keyboard navigation support

---

### Task 7: Create TimeSlotGrid Component

**Priority:** High | **Estimate:** 3 hours

Build the time slot selection grid with availability.

**Files to create/modify:**
- `src/components/booking/TimeSlotGrid.tsx`

**Acceptance Criteria:**
- [ ] Displays 30-minute slots within business hours
- [ ] Available slots are selectable
- [ ] Unavailable slots show "Join Waitlist" button
- [ ] Selected slot highlighted
- [ ] Accounts for service duration when calculating availability
- [ ] Loading state while fetching availability

---

### Task 8: Create DateTimeStep Component

**Priority:** High | **Estimate:** 2 hours

Combine calendar and time slots into the date/time step.

**Files to create/modify:**
- `src/components/booking/steps/DateTimeStep.tsx`

**Acceptance Criteria:**
- [ ] Integrates CalendarPicker and TimeSlotGrid
- [ ] Time slots update when date changes
- [ ] Selected date/time displayed prominently
- [ ] Next button enabled when both date and time selected
- [ ] Handles waitlist joining flow

---

### Task 9: Create AddonsStep Component

**Priority:** Medium | **Estimate:** 2 hours

Build the add-on selection step.

**Files to create/modify:**
- `src/components/booking/steps/AddonsStep.tsx`
- `src/components/booking/AddonCard.tsx`

**Acceptance Criteria:**
- [ ] Fetches and displays active add-ons
- [ ] Add-on cards show name, description, price
- [ ] Breed-matched upsells highlighted at top
- [ ] Toggle selection with running total update
- [ ] "Skip" option to proceed without add-ons
- [ ] Multiple add-ons can be selected

---

### Task 10: Create PriceSummary Component

**Priority:** Medium | **Estimate:** 1.5 hours

Build the running price total display.

**Files to create/modify:**
- `src/components/booking/PriceSummary.tsx`

**Acceptance Criteria:**
- [ ] Displays service name and price
- [ ] Lists selected add-ons with prices
- [ ] Shows subtotal and total
- [ ] Price changes animate smoothly
- [ ] Sticky sidebar on desktop
- [ ] Collapsible bottom bar on mobile

---

### Task 11: Create GuestInfoForm Component

**Priority:** Medium | **Estimate:** 2 hours

Build the guest contact information form.

**Files to create/modify:**
- `src/components/booking/GuestInfoForm.tsx`

**Acceptance Criteria:**
- [ ] Fields: first name, last name, email, phone
- [ ] Zod validation with react-hook-form
- [ ] Error messages display below fields
- [ ] Phone input with formatting
- [ ] Check for existing email and prompt login

---

### Task 12: Create ReviewStep Component

**Priority:** High | **Estimate:** 2.5 hours

Build the final review step before confirmation.

**Files to create/modify:**
- `src/components/booking/steps/ReviewStep.tsx`

**Acceptance Criteria:**
- [ ] Displays complete booking summary
- [ ] Shows service, pet, date/time, add-ons
- [ ] Itemized pricing breakdown
- [ ] GuestInfoForm for unauthenticated users
- [ ] Edit links to go back to specific steps
- [ ] "Confirm Booking" button with loading state

---

### Task 13: Create ConfirmationStep Component

**Priority:** Medium | **Estimate:** 1.5 hours

Build the booking success confirmation page.

**Files to create/modify:**
- `src/components/booking/steps/ConfirmationStep.tsx`

**Acceptance Criteria:**
- [ ] Success icon and message
- [ ] Booking reference number displayed
- [ ] Appointment details summary
- [ ] "View My Appointments" button (authenticated)
- [ ] "Create Account" prompt (guests)
- [ ] "Book Another" button to restart

---

### Task 14: Implement Booking Creation Logic

**Priority:** High | **Estimate:** 3 hours

Wire up the booking confirmation to create appointments.

**Files to create/modify:**
- `src/hooks/useBooking.ts`
- Update `src/mocks/stores/appointmentStore.ts` if needed
- Update `src/mocks/stores/waitlistStore.ts` if needed

**Acceptance Criteria:**
- [ ] Creates appointment record on confirmation
- [ ] Creates appointment_addons records
- [ ] Creates pet if new pet was added
- [ ] Creates user if guest booking
- [ ] Handles slot conflict (race condition) gracefully
- [ ] Triggers confirmation (logged in mock mode)

---

### Task 15: Create Booking Page

**Priority:** High | **Estimate:** 1.5 hours

Create the booking page route and integrate the wizard.

**Files to create/modify:**
- `src/app/(marketing)/book/page.tsx`
- `src/app/(marketing)/book/loading.tsx`

**Acceptance Criteria:**
- [ ] Page renders BookingWizard
- [ ] Supports `?service=<id>` URL parameter for pre-selection
- [ ] Loading skeleton matches wizard layout
- [ ] Page title and meta tags for SEO
- [ ] "Back to Home" navigation link

---

### Task 16: Update Marketing Header/CTA

**Priority:** Medium | **Estimate:** 1 hour

Update marketing site "Book Now" buttons to link to booking page.

**Files to create/modify:**
- Update `src/components/marketing/Header.tsx`
- Update `src/components/marketing/HeroSection.tsx`
- Update any other CTA buttons

**Acceptance Criteria:**
- [ ] "Book Now" buttons navigate to /book
- [ ] Service cards can link to /book?service=<id>
- [ ] Smooth transition to booking flow

---

### Task 17: Add Waitlist Creation

**Priority:** Medium | **Estimate:** 2 hours

Implement joining waitlist for unavailable slots.

**Files to create/modify:**
- Extend TimeSlotGrid component
- Create waitlist modal/form if needed

**Acceptance Criteria:**
- [ ] "Join Waitlist" button on unavailable slots
- [ ] Captures time preference (morning/afternoon/any)
- [ ] Creates waitlist entry in store
- [ ] Confirmation message after joining
- [ ] Prevents duplicate waitlist entries

---

### Task 18: Mobile Optimization Pass

**Priority:** Medium | **Estimate:** 2 hours

Ensure all booking components work well on mobile.

**Files to modify:**
- All booking components

**Acceptance Criteria:**
- [ ] Touch-friendly tap targets (44px minimum)
- [ ] Proper input types for mobile keyboards
- [ ] Calendar scrollable/swipeable
- [ ] Bottom price bar doesn't cover content
- [ ] Step navigation buttons full-width
- [ ] Forms don't break viewport

---

### Task 19: Add Booking Animations

**Priority:** Low | **Estimate:** 1.5 hours

Polish animations throughout the booking flow.

**Files to modify:**
- All booking step components

**Acceptance Criteria:**
- [ ] Step transitions slide smoothly
- [ ] Cards scale on hover/select
- [ ] Price updates with number animation
- [ ] Success confirmation has celebratory animation
- [ ] Loading states have appropriate animations

---

### Task 20: Unit Tests for Booking System

**Priority:** Medium | **Estimate:** 3 hours

Create tests for booking utilities and core logic.

**Files to create:**
- `src/lib/booking/availability.test.ts`
- `src/lib/booking/pricing.test.ts`
- `src/stores/bookingStore.test.ts`

**Acceptance Criteria:**
- [ ] Availability calculation tests (conflicts, business hours)
- [ ] Price calculation tests (sizes, add-ons)
- [ ] Store action tests (step navigation, selection)
- [ ] Validation schema tests
- [ ] All tests pass

---

## Dependency Graph

```
Task 1 (Store) ─────────────────────────────────────────────┐
                                                            │
Task 2 (Utilities) ─────────────────────────────────────────┤
                                                            │
                ┌───────────────────────────────────────────┴─────┐
                │                                                 │
Task 3 (Wizard Container) ◄───────────────────────────────────────┤
        │                                                         │
        ├──▶ Task 4 (ServiceStep) ────────────────────────────────┤
        │                                                         │
        ├──▶ Task 5 (PetStep) ────────────────────────────────────┤
        │                                                         │
        ├──▶ Task 6 (Calendar) ──┬──▶ Task 8 (DateTimeStep) ──────┤
        │                        │                                │
        ├──▶ Task 7 (TimeSlots) ─┘                                │
        │                                                         │
        ├──▶ Task 9 (AddonsStep) ─────────────────────────────────┤
        │                                                         │
        ├──▶ Task 10 (PriceSummary) ──────────────────────────────┤
        │                                                         │
        ├──▶ Task 11 (GuestInfoForm) ─┬──▶ Task 12 (ReviewStep) ──┤
        │                             │                           │
        └──▶ Task 13 (Confirmation) ──┴───────────────────────────┤
                                                                  │
Task 14 (Booking Logic) ◄─────────────────────────────────────────┤
                                                                  │
Task 15 (Booking Page) ◄──────────────────────────────────────────┘
        │
        ├──▶ Task 16 (Update CTAs)
        │
        ├──▶ Task 17 (Waitlist)
        │
        ├──▶ Task 18 (Mobile Pass)
        │
        └──▶ Task 19 (Animations)

Task 20 (Tests) ─ Can run in parallel after Tasks 1-2
```

---

## Summary

| Priority | Tasks | Estimated Time |
|----------|-------|----------------|
| High | 1, 2, 3, 4, 5, 6, 7, 8, 12, 14, 15 | 25 hours |
| Medium | 9, 10, 11, 16, 17, 18, 20 | 13.5 hours |
| Low | 19 | 1.5 hours |
| **Total** | **20 tasks** | **40 hours** |
