# Task 1: Create Booking Utility Functions

## Description
Create utility functions for pricing calculations, availability logic, and form validation schemas that will be used throughout the booking system.

## Files to create
- `src/lib/booking/pricing.ts`
- `src/lib/booking/availability.ts`
- `src/lib/booking/validation.ts`
- `src/lib/booking/index.ts`

## Requirements References
- Req 10.1: Calculate correct size-based price when service and pet size selected
- Req 10.2: Add each add-on's price to the running total
- Req 10.4: Show itemized breakdown in booking summary
- Req 14.1: Exclude times with existing confirmed appointments
- Req 14.2: Block appropriate number of slots for appointment duration
- Req 14.3: Only show times within business hours

## Implementation Details

### pricing.ts
```typescript
// Size weight ranges
const SIZE_WEIGHT_RANGES = {
  small: { min: 0, max: 18 },
  medium: { min: 19, max: 35 },
  large: { min: 36, max: 65 },
  xlarge: { min: 66, max: Infinity }
};

// Functions to implement:
// - getServicePriceForSize(service, size)
// - determineSizeFromWeight(weight)
// - calculateTotal(servicePrice, addons)
// - formatCurrency(amount)
```

### availability.ts
```typescript
// Business hours configuration
const DEFAULT_BUSINESS_HOURS = {
  monday: { open: "09:00", close: "17:00", is_open: true },
  // ... etc
};

// Functions to implement:
// - generateTimeSlots(date, businessHours, slotInterval)
// - hasConflict(time, duration, existingAppointments, date)
// - getAvailableSlots(date, serviceId, existingAppointments)
// - isBusinessDay(date, businessHours)
// - filterPastSlots(slots, date)
```

### validation.ts
```typescript
// Zod schemas for:
// - Pet form validation
// - Guest info validation
// - Appointment creation validation
```

## Acceptance Criteria
- [ ] getServicePriceForSize returns correct price for given size
- [ ] determineSizeFromWeight correctly categorizes weights into sizes
- [ ] generateTimeSlots creates 30-minute interval slots within business hours
- [ ] hasConflict correctly identifies overlapping appointments
- [ ] filterPastSlots removes past times when date is today
- [ ] All functions have TypeScript types
- [ ] Export all functions from index.ts

## Estimated Complexity
Medium

## Phase
Phase 1: Foundation & Data Layer

## Dependencies
None - this is a foundational task
