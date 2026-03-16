# Requirements Document

## Introduction

The admin booking flow currently shares the same date/time restrictions, conflict validation, and pricing logic as the customer-facing flow. This creates friction for admins who need flexibility to backdate appointments, override pricing, book outside business hours, or double-book slots. This spec enhances the admin booking mode to give staff full control over scheduling and pricing while keeping the customer flow unchanged.

## Requirements

### Requirement 1: Unrestricted Date and Time Selection

**User Story:** As an admin, I want to select any date and any time when creating a booking, so that I can schedule appointments outside of normal business hours or on closed days.

#### Acceptance Criteria

1. WHEN the booking modal is in admin mode THEN the DateTimeStep SHALL allow selection of any calendar date without enforcing business hours, blocked dates, max advance days, or min advance hours restrictions.
2. WHEN the booking modal is in admin mode THEN the DateTimeStep SHALL present a free-form time input (hours and minutes) instead of the slot-based time grid, allowing any time to be entered.
3. WHEN the booking modal is in admin mode AND the admin selects a date that falls on a closed business day THEN the system SHALL accept the selection without warning or blocking.
4. WHEN the booking modal is in customer mode THEN the DateTimeStep SHALL continue to enforce all existing business hours, blocked dates, and advance booking restrictions.

### Requirement 2: Double-Booking Support

**User Story:** As an admin, I want to book a time slot even if it is already occupied, so that I can handle scheduling exceptions without being blocked by conflict validation.

#### Acceptance Criteria

1. WHEN the booking modal is in admin mode AND the admin selects a date/time that conflicts with an existing appointment THEN the system SHALL allow the booking to proceed without blocking.
2. WHEN the booking modal is in admin mode AND a conflicting time is selected THEN the system SHOULD display a non-blocking indicator showing the number of existing appointments at that time.
3. WHEN the booking is submitted via the admin appointments API with a conflicting time THEN the server SHALL skip conflict validation and create the appointment.
4. WHEN the booking modal is in customer mode AND a conflicting time is selected THEN the system SHALL continue to block the booking and offer the waitlist.

### Requirement 3: Past Date Booking (Backdating)

**User Story:** As an admin, I want to create appointments for past dates, so that I can enter historical records or correct missed entries.

#### Acceptance Criteria

1. WHEN the booking modal is in admin mode THEN the calendar picker SHALL allow selection of past dates without restriction.
2. WHEN the booking modal is in admin mode AND a past date is selected THEN the system SHALL display a visual indicator (e.g., a subtle label) showing the appointment is being backdated.
3. WHEN a backdated appointment is submitted THEN the API SHALL accept the past date and create the appointment with a status appropriate for a past booking (e.g., "completed").
4. WHEN the booking modal is in customer mode THEN the calendar picker SHALL continue to prevent selection of past dates.

### Requirement 4: Notification Control

**User Story:** As an admin, I want to choose whether to send a notification to the customer when creating a booking, so that I can avoid notifying customers for backdated or internal entries.

#### Acceptance Criteria

1. WHEN the booking modal is in admin mode THEN the ReviewStep SHALL display a "Send confirmation email" toggle that is checked by default.
2. WHEN the admin unchecks the notification toggle AND confirms the booking THEN the system SHALL suppress all customer-facing notifications (email and any future SMS) for that appointment.
3. WHEN the admin creates a backdated appointment THEN the notification toggle SHALL default to unchecked.
4. WHEN the booking is submitted with `send_notification` set to false THEN the admin appointments API SHALL skip triggering notification workflows for that appointment.
5. IF the notification toggle is checked THEN the system SHALL send the standard booking confirmation notification to the customer.

### Requirement 5: Price Adjustments During Booking

**User Story:** As an admin, I want to add price adjustments (discounts or surcharges) before confirming a booking, so that I can apply custom pricing at the time of scheduling.

#### Acceptance Criteria

1. WHEN the booking modal is in admin mode THEN the ReviewStep SHALL display a "Price Adjustments" section reusing the same pattern as in `AppointmentDetailModal` (label, amount, surcharge/discount toggle, optional note).
2. WHEN the admin adds one or more adjustments THEN the ReviewStep SHALL show the base price, add-ons total, each adjustment line item, and the recalculated grand total.
3. WHEN the admin removes an adjustment THEN the total SHALL revert to reflect the remaining adjustments.
4. WHEN the booking is submitted with adjustments THEN the admin appointments API SHALL create corresponding records in the `appointment_price_adjustments` table and store the adjusted `total_price`.
5. WHEN the booking modal is in customer mode THEN the price adjustments section SHALL NOT be displayed.
6. The adjustment UI in the booking flow SHALL follow the same interaction patterns (surcharge/discount toggle, animated entry/exit, color-coded amounts) as the existing `AppointmentDetailModal` implementation.
