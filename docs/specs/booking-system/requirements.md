# Requirements Document - Phase 3: Booking System

## Introduction

Phase 3 implements the core booking system for The Puppy Day. This includes a multi-step booking widget that allows customers to select services, choose their pet (or add a new one), pick available time slots, select optional add-ons, and complete their booking. The system supports both authenticated and guest booking flows, integrates with the waitlist for fully-booked slots, and calculates size-based pricing dynamically.

## Requirements

### Requirement 1: Multi-Step Booking Widget

**User Story:** As a customer, I want to book a grooming appointment through an intuitive multi-step process, so that I can easily schedule services for my pet without confusion.

#### Acceptance Criteria

1. WHEN a user initiates the booking flow THEN the system SHALL display a multi-step wizard with progress indicator showing steps: Service > Pet > Date/Time > Add-ons > Review > Confirmation
2. WHEN a user completes a step THEN the system SHALL enable navigation to the next step and update the progress indicator
3. WHEN a user is on any step THEN the system SHALL allow navigation back to previous completed steps without losing entered data
4. WHEN a user refreshes the page during booking THEN the system SHALL preserve the current step and entered data using session storage
5. WHEN a user abandons the booking flow THEN the system SHALL clear session data after 30 minutes of inactivity
6. WHEN the booking widget loads THEN the system SHALL display smooth entrance animations using Framer Motion

### Requirement 2: Service Selection

**User Story:** As a customer, I want to browse and select from available grooming services with clear pricing information, so that I can choose the right service for my pet's needs.

#### Acceptance Criteria

1. WHEN a user views the service selection step THEN the system SHALL display all active services with name, description, image, and price range
2. WHEN a service has size-based pricing THEN the system SHALL display the price range (e.g., "Starting at $45") with a note about size-based pricing
3. WHEN a user selects a service THEN the system SHALL highlight the selected service and enable the "Next" button
4. WHEN a user hovers over a service card THEN the system SHALL display additional details including estimated duration
5. IF no services are active THEN the system SHALL display a message indicating no services are currently available

### Requirement 3: Pet Selection and Creation

**User Story:** As a customer, I want to select an existing pet or add a new one during booking, so that the grooming service is associated with the correct pet profile.

#### Acceptance Criteria

1. WHEN an authenticated user reaches the pet selection step THEN the system SHALL display a list of their existing active pets
2. WHEN a user selects an existing pet THEN the system SHALL load the pet's size and update the service price accordingly
3. WHEN a user has no existing pets OR chooses to add a new pet THEN the system SHALL display a pet creation form
4. WHEN a user creates a new pet THEN the system SHALL require: name, size (small/medium/large/xlarge), and optionally breed and weight
5. WHEN a pet is created during booking THEN the system SHALL associate it with the authenticated user or the booking record for guests
6. WHEN a pet's size is selected or changed THEN the system SHALL immediately recalculate and display the updated service price
7. IF a guest user is booking THEN the system SHALL collect pet information without requiring account creation

### Requirement 4: Date and Time Selection

**User Story:** As a customer, I want to see available appointment slots and select a convenient time, so that I can book when it works best for my schedule.

#### Acceptance Criteria

1. WHEN a user reaches the date/time step THEN the system SHALL display a calendar showing the current and next month
2. WHEN a user selects a date THEN the system SHALL display available time slots for that date
3. WHEN displaying time slots THEN the system SHALL show slots in 30-minute increments during business hours
4. WHEN a time slot is available THEN the system SHALL display it as selectable with the start time
5. WHEN a time slot is fully booked THEN the system SHALL display it as unavailable with a "Join Waitlist" option
6. WHEN business hours vary by day THEN the system SHALL only display slots within that day's operating hours
7. IF a date is in the past OR the business is closed THEN the system SHALL disable that date on the calendar
8. WHEN a user selects a time slot THEN the system SHALL display the selected date and time prominently and enable the "Next" button
9. WHEN the selected service has a duration THEN the system SHALL ensure slots don't overlap with existing appointments

### Requirement 5: Add-on Selection

**User Story:** As a customer, I want to add optional services like nail trimming or teeth cleaning to my appointment, so that my pet receives comprehensive care.

#### Acceptance Criteria

1. WHEN a user reaches the add-ons step THEN the system SHALL display all active add-ons with name, description, and price
2. WHEN an add-on matches the pet's breed for upsell THEN the system SHALL highlight it with the upsell_prompt message
3. WHEN a user selects an add-on THEN the system SHALL add it to the running total displayed on screen
4. WHEN a user deselects an add-on THEN the system SHALL remove it from the running total
5. WHEN multiple add-ons are selected THEN the system SHALL display a clear itemized list with individual prices
6. WHEN no add-ons are desired THEN the system SHALL allow the user to skip this step with a "Skip" or "No Thanks" option

### Requirement 6: Booking Review and Confirmation

**User Story:** As a customer, I want to review all booking details before confirming, so that I can verify everything is correct and understand the total cost.

#### Acceptance Criteria

1. WHEN a user reaches the review step THEN the system SHALL display: selected service, pet name, appointment date/time, selected add-ons, and itemized pricing
2. WHEN displaying pricing THEN the system SHALL show service price, each add-on price, subtotal, and any applicable taxes or fees
3. WHEN a user reviews the booking THEN the system SHALL display the estimated duration of the appointment
4. WHEN a guest user is booking THEN the system SHALL require contact information (email, phone) before confirmation
5. WHEN a user confirms the booking THEN the system SHALL create the appointment record with "pending" status
6. WHEN the booking is confirmed THEN the system SHALL display a confirmation page with booking reference number and details
7. WHEN the booking is confirmed THEN the system SHALL trigger a confirmation email to the customer

### Requirement 7: Guest Booking Flow

**User Story:** As a first-time visitor, I want to book an appointment without creating an account first, so that I can try the service without commitment.

#### Acceptance Criteria

1. WHEN a guest initiates booking THEN the system SHALL allow progression through all booking steps without authentication
2. WHEN a guest reaches the review step THEN the system SHALL require: first name, last name, email, and phone number
3. WHEN a guest completes a booking THEN the system SHALL create a user record with the provided information
4. WHEN a guest booking is confirmed THEN the system SHALL send an email with login instructions to claim their account
5. IF a user's email already exists in the system THEN the system SHALL prompt them to log in instead of creating a duplicate
6. WHEN a guest provides contact information THEN the system SHALL validate email format and phone number format

### Requirement 8: Authenticated Booking Flow

**User Story:** As a returning customer, I want my information pre-filled during booking, so that I can complete appointments quickly without re-entering details.

#### Acceptance Criteria

1. WHEN an authenticated user starts booking THEN the system SHALL pre-load their profile information
2. WHEN an authenticated user reaches pet selection THEN the system SHALL display only their active pets
3. WHEN an authenticated user completes booking THEN the system SHALL use their existing contact information without re-entry
4. WHEN viewing the review step THEN the system SHALL display the user's profile information with an option to update phone/email for this booking

### Requirement 9: Waitlist Integration

**User Story:** As a customer, I want to join a waitlist when my preferred time is fully booked, so that I can be notified if a slot becomes available.

#### Acceptance Criteria

1. WHEN a time slot is fully booked THEN the system SHALL display a "Join Waitlist" button instead of "Select"
2. WHEN a user clicks "Join Waitlist" THEN the system SHALL create a waitlist entry with the selected date and time preference
3. WHEN a user joins the waitlist THEN the system SHALL display confirmation and explain the waitlist process
4. WHEN a slot becomes available THEN the system SHALL be able to notify waitlisted customers (notification handled in Phase 8)
5. WHEN a user already has a waitlist entry for the same date THEN the system SHALL inform them instead of creating a duplicate
6. WHEN creating a waitlist entry THEN the system SHALL allow the user to specify time preference: morning, afternoon, or any

### Requirement 10: Price Calculation

**User Story:** As a customer, I want to see accurate real-time pricing based on my pet's size and selected add-ons, so that I know exactly what I'll pay.

#### Acceptance Criteria

1. WHEN a user selects a service and pet size THEN the system SHALL calculate the correct size-based price
2. WHEN a user selects add-ons THEN the system SHALL add each add-on's price to the running total
3. WHEN price changes occur during booking THEN the system SHALL update the displayed total immediately with a subtle animation
4. WHEN the booking summary is displayed THEN the system SHALL show an itemized breakdown: base service, each add-on, and total
5. IF tax or deposit is applicable THEN the system SHALL display it as a separate line item (configured via settings)

### Requirement 11: Mobile Booking Experience

**User Story:** As a mobile user, I want to complete the entire booking process on my phone, so that I can book appointments on the go.

#### Acceptance Criteria

1. WHEN booking on mobile (viewport < 768px) THEN the system SHALL display a single-column layout optimized for touch
2. WHEN selecting dates on mobile THEN the system SHALL display a mobile-friendly calendar with large touch targets
3. WHEN selecting time slots on mobile THEN the system SHALL display scrollable time slot cards with adequate spacing
4. WHEN navigating between steps on mobile THEN the system SHALL use full-width buttons with clear labels
5. WHEN forms are displayed on mobile THEN the system SHALL use appropriate input types (tel, email) for mobile keyboards

### Requirement 12: Booking Validation and Error Handling

**User Story:** As a customer, I want clear feedback when something goes wrong during booking, so that I can correct issues and complete my appointment.

#### Acceptance Criteria

1. IF a required field is empty THEN the system SHALL highlight the field and display a descriptive error message
2. IF an email format is invalid THEN the system SHALL display "Please enter a valid email address"
3. IF a phone number format is invalid THEN the system SHALL display "Please enter a valid phone number"
4. IF the selected time slot becomes unavailable during booking THEN the system SHALL alert the user and redirect to date/time selection
5. IF server communication fails THEN the system SHALL display a friendly error message with retry option
6. WHEN an error occurs THEN the system SHALL preserve all entered data when returning to the form

### Requirement 13: Booking Widget Embedding

**User Story:** As a business owner, I want the booking widget accessible from the marketing site, so that visitors can easily book appointments.

#### Acceptance Criteria

1. WHEN a user clicks "Book Appointment" from the marketing site THEN the system SHALL navigate to the booking page with the widget
2. WHEN the booking page loads THEN the system SHALL display the booking widget as the primary content
3. WHEN a user is on the booking page THEN the system SHALL show a "Back to Home" link for navigation
4. IF a service is pre-selected via URL parameter THEN the system SHALL start the booking flow with that service selected

### Requirement 14: Appointment Slot Availability

**User Story:** As a business owner, I want the system to prevent double-booking and respect groomer schedules, so that appointments don't conflict.

#### Acceptance Criteria

1. WHEN calculating available slots THEN the system SHALL exclude times with existing confirmed appointments
2. WHEN a service has a duration THEN the system SHALL block the appropriate number of slots for each appointment
3. WHEN displaying available slots THEN the system SHALL only show times within business hours for that day
4. WHEN a groomer has capacity limits THEN the system SHALL respect those limits in availability calculations
5. WHEN multiple customers book simultaneously THEN the system SHALL handle race conditions and prevent double-booking
