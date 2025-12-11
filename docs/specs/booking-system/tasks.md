# Implementation Tasks - Phase 3: Booking System

## Overview

This document outlines the implementation tasks for the booking system. Tasks are organized into logical phases and reference specific requirements from the requirements document.

**Prerequisites**:
- Marketing site (Phase 2) completed
- Existing database types and mock store structure
- Booking UI components (partially implemented)

**Estimated Timeline**: 4-5 weeks

---

## Phase 1: Foundation & Data Layer

- [ ] **1.1** Create booking utility functions (pricing, availability, validation)
  - File: `src/lib/booking/pricing.ts`, `src/lib/booking/availability.ts`, `src/lib/booking/validation.ts`
  - Implements size-based price calculation, time slot generation, business hours logic
  - References: Req 10.1, 10.2, 10.4, 14.1, 14.2, 14.3

- [ ] **1.2** Seed mock data for services, add-ons, and business hours
  - File: `src/mocks/supabase/seed-booking.ts`
  - Add services (Basic/Premium Grooming), service prices, add-ons, business hours settings
  - References: Req 2.1, 5.1

- [ ] **1.3** Create data fetching hooks (useServices, useAddons, useAvailability, usePets)
  - Files: `src/hooks/useServices.ts`, `src/hooks/useAddons.ts`, `src/hooks/useAvailability.ts`, `src/hooks/usePets.ts`
  - Implement with mock store support, loading states, error handling
  - References: Req 2.1, 3.1, 4.2, 5.1

---

## Phase 2: API Routes

- [ ] **2.1** Create GET /api/services endpoint
  - File: `src/app/api/services/route.ts`
  - Return active services with size-based prices
  - References: Req 2.1, 2.2

- [ ] **2.2** Create GET /api/addons endpoint
  - File: `src/app/api/addons/route.ts`
  - Return active add-ons with upsell information
  - References: Req 5.1, 5.2

- [ ] **2.3** Create GET /api/availability endpoint
  - File: `src/app/api/availability/route.ts`
  - Calculate available time slots for date/service, respecting business hours and existing appointments
  - References: Req 4.2, 4.3, 4.6, 4.9, 14.1, 14.2, 14.3

- [ ] **2.4** Create GET/POST /api/pets endpoints
  - File: `src/app/api/pets/route.ts`
  - GET: Return authenticated user's pets
  - POST: Create new pet profile
  - References: Req 3.1, 3.3, 3.4, 3.5

- [ ] **2.5** Create POST /api/appointments endpoint
  - File: `src/app/api/appointments/route.ts`
  - Create appointment with pessimistic locking to prevent double-booking
  - Handle guest info, add-ons, price validation
  - References: Req 6.5, 6.7, 14.5

- [ ] **2.6** Create POST /api/waitlist endpoint
  - File: `src/app/api/waitlist/route.ts`
  - Create waitlist entry with time preference
  - Prevent duplicate entries for same date
  - References: Req 9.2, 9.5, 9.6

- [ ] **2.7** Create POST /api/users/guest endpoint
  - File: `src/app/api/users/guest/route.ts`
  - Create guest user account during booking
  - Check for existing email, return conflict if exists
  - References: Req 7.3, 7.5

---

## Phase 3: Booking Page & Integration

- [ ] **3.1** Create /book page route with BookingWizard
  - File: `src/app/(marketing)/book/page.tsx`
  - Server component wrapping BookingWizard
  - Support pre-selected service via query parameter
  - References: Req 13.1, 13.2, 13.4

- [ ] **3.2** Update step components to use API hooks instead of direct mock store access
  - Files: `src/components/booking/steps/*.tsx`
  - Replace getMockStore() calls with useServices, useAddons, useAvailability hooks
  - References: Req 2.1, 3.1, 4.2, 5.1

- [ ] **3.3** Implement useBookingSubmit hook for appointment creation
  - File: `src/hooks/useBookingSubmit.ts`
  - Handle API call, error states, conflict recovery
  - References: Req 6.5, 12.4, 12.5

---

## Phase 4: Step Components Enhancement

- [ ] **4.1** Complete PetStep with pet creation form and validation
  - File: `src/components/booking/steps/PetStep.tsx`, `src/components/booking/PetForm.tsx`
  - Display existing pets for authenticated users, pet creation form for new pets
  - Size selection updates pricing in real-time
  - References: Req 3.1, 3.2, 3.3, 3.4, 3.6, 3.7

- [ ] **4.2** Complete DateTimeStep with calendar and time slot grid
  - File: `src/components/booking/steps/DateTimeStep.tsx`, `src/components/booking/CalendarPicker.tsx`, `src/components/booking/TimeSlotGrid.tsx`
  - Calendar with disabled dates, time slots with availability
  - Waitlist button for fully booked slots
  - References: Req 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8

- [ ] **4.3** Complete AddonsStep with addon cards and upsell highlighting
  - File: `src/components/booking/steps/AddonsStep.tsx`, `src/components/booking/AddonCard.tsx`
  - Display add-ons with breed-specific upsells, running total animation
  - References: Req 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

- [ ] **4.4** Complete ReviewStep with booking summary and guest info form
  - File: `src/components/booking/steps/ReviewStep.tsx`, `src/components/booking/GuestInfoForm.tsx`
  - Itemized pricing, guest info collection for unauthenticated users
  - Handle submission and conflict errors
  - References: Req 6.1, 6.2, 6.3, 6.4, 7.2, 7.6

- [ ] **4.5** Complete ConfirmationStep with booking details and next steps
  - File: `src/components/booking/steps/ConfirmationStep.tsx`
  - Display confirmation with reference number, add to calendar link
  - Book another appointment option
  - References: Req 6.6

---

## Phase 5: Waitlist Integration

- [ ] **5.1** Implement WaitlistModal component
  - File: `src/components/booking/WaitlistModal.tsx`
  - Time preference selection (morning/afternoon/any)
  - API integration for waitlist creation
  - References: Req 9.2, 9.3, 9.6

- [ ] **5.2** Integrate waitlist with TimeSlotGrid
  - File: `src/components/booking/TimeSlotGrid.tsx`
  - Show waitlist button for fully booked slots
  - Display waitlist count
  - References: Req 9.1, 4.5

---

## Phase 6: Form Validation & Error Handling

- [ ] **6.1** Create Zod validation schemas for all forms
  - File: `src/lib/booking/schemas.ts`
  - Pet form, guest info, appointment creation schemas
  - References: Req 12.1, 12.2, 12.3

- [ ] **6.2** Implement error handling UI patterns
  - Update step components with error display, field validation
  - Toast notifications for API errors
  - References: Req 12.1, 12.2, 12.3, 12.4, 12.5, 12.6

- [ ] **6.3** Handle booking conflicts and session expiry
  - Redirect to date/time step on conflict
  - Session expiry warning with data preservation
  - References: Req 12.4, 1.5

---

## Phase 7: Mobile Responsiveness & Accessibility

- [ ] **7.1** Optimize booking wizard for mobile
  - Single-column layouts, large touch targets
  - Mobile-friendly calendar and time slots
  - Full-width buttons with clear labels
  - References: Req 11.1, 11.2, 11.3, 11.4, 11.5

- [ ] **7.2** Add ARIA labels and keyboard navigation
  - Progress indicator accessibility
  - Form field ARIA attributes
  - Live regions for price updates
  - References: Req 1.1 (implicit accessibility requirements)

---

## Phase 8: Testing

- [ ] **8.1** Write unit tests for booking utility functions
  - File: `src/lib/booking/__tests__/*.test.ts`
  - Test pricing calculations, availability logic, validation
  - References: Req 10.1, 10.2, 14.1, 14.2

- [ ] **8.2** Write unit tests for booking store
  - File: `src/stores/__tests__/bookingStore.test.ts`
  - Test state transitions, navigation guards, price calculations
  - References: Req 1.2, 1.3, 10.3

- [ ] **8.3** Write integration tests for API routes
  - File: `src/app/api/__tests__/*.test.ts`
  - Test appointment creation, conflict handling, validation
  - References: Req 6.5, 14.5

- [ ] **8.4** Write component tests for booking steps
  - File: `src/components/booking/__tests__/*.test.tsx`
  - Test user interactions, form submissions, error states
  - References: Req 2.3, 3.2, 4.8, 5.3

---

## Phase 9: Polish & Integration

- [ ] **9.1** Update marketing site CTAs to link to booking page
  - Update hero, service cards, header to link to /book
  - Pass service ID as query parameter from service cards
  - References: Req 13.1, 13.4

- [ ] **9.2** Add loading states and animations
  - Skeleton screens for data loading
  - Smooth step transitions
  - Price update animations
  - References: Req 1.6, 10.3

- [ ] **9.3** Final accessibility audit
  - Run jest-axe tests
  - Manual keyboard navigation testing
  - Screen reader testing
  - References: Req 11.1-11.5 (implicit)

---

## Dependency Graph

```
Phase 1 (Foundation)
    |
    v
Phase 2 (APIs) -----> Phase 3 (Integration)
    |                     |
    v                     v
Phase 4 (Steps) <-----> Phase 5 (Waitlist)
    |                     |
    v                     v
Phase 6 (Validation) --> Phase 7 (Mobile/A11y)
    |
    v
Phase 8 (Testing)
    |
    v
Phase 9 (Polish)
```

---

## Requirements Traceability

| Requirement | Tasks |
|-------------|-------|
| Req 1: Multi-Step Wizard | 3.1, 3.2, 6.3, 9.2 |
| Req 2: Service Selection | 1.2, 1.3, 2.1, 3.2 |
| Req 3: Pet Selection | 1.3, 2.4, 4.1 |
| Req 4: Date/Time Selection | 1.1, 1.3, 2.3, 4.2 |
| Req 5: Add-on Selection | 1.2, 1.3, 2.2, 4.3 |
| Req 6: Booking Review | 2.5, 4.4, 4.5 |
| Req 7: Guest Booking | 2.7, 4.4 |
| Req 8: Authenticated Booking | 1.3, 4.1, 4.4 |
| Req 9: Waitlist | 2.6, 5.1, 5.2 |
| Req 10: Price Calculation | 1.1, 4.3, 4.4, 8.1 |
| Req 11: Mobile Experience | 7.1 |
| Req 12: Validation/Errors | 6.1, 6.2, 6.3 |
| Req 13: Widget Embedding | 3.1, 9.1 |
| Req 14: Slot Availability | 1.1, 2.3, 2.5, 8.1 |
