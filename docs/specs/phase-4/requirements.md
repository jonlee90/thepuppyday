# Requirements Document: Phase 4 - Customer Portal

## Introduction

The Customer Portal provides authenticated customers with a comprehensive interface to manage their pets, appointments, and account information. This phase builds upon the completed Booking System (Phase 3) and enables customers to view upcoming appointments, manage their pets, access post-grooming report cards, track their loyalty punch card progress, and manage their profile settings.

The portal follows a mobile-first responsive design approach consistent with the existing booking system, utilizing the Clean & Elegant Professional design aesthetic with the charcoal (#434E54) and cream (#EAE0D5) color palette. The system integrates with Supabase Auth for authentication and leverages Next.js 14+ App Router with Server Components for optimal performance.

Key capabilities include appointment management (view, cancel, rebook), pet profile management with breed-based grooming reminders, report card viewing with before/after photos, a playful "Buy X, Get 1 Free" loyalty punch card system with animated paw stamps, and membership management for enrolled customers.

### Loyalty Program Overview

The loyalty program uses a "Buy X, Get 1 Free Wash" model:
- **Default threshold**: Buy 9 grooming sessions, get the 10th free
- **Admin-configurable**: Admins can set a global default or customize thresholds per customer
- **Visual representation**: Fun punch card with paw print stamps that animate as visits are completed
- **Celebration states**: Confetti and special messaging when a free wash is earned

## Requirements

### Requirement 1: Authentication & Authorization

**User Story:** As a customer, I want secure access to my personal portal, so that only I can view and manage my pet and appointment information.

#### Acceptance Criteria

1. WHEN a non-authenticated user attempts to access any customer portal route THEN the system SHALL redirect to the login page with a return URL
2. WHEN a user successfully authenticates THEN the system SHALL establish a Supabase Auth session and redirect to the customer dashboard
3. WHEN a session expires THEN the system SHALL prompt the user to re-authenticate before allowing further actions
4. IF a user has a role other than 'customer' THEN the system SHALL deny access to customer portal routes
5. WHEN a user logs out THEN the system SHALL terminate the session and redirect to the marketing homepage

### Requirement 2: Dashboard Overview

**User Story:** As a customer, I want to see an overview of my account status and upcoming appointments at a glance, so that I can quickly understand what's next for my pets.

#### Acceptance Criteria

1. WHEN a customer accesses the dashboard THEN the system SHALL display upcoming appointments (next 30 days) sorted chronologically
2. WHEN a customer accesses the dashboard THEN the system SHALL display the loyalty punch card widget prominently showing progress toward a free wash
3. WHEN a customer has an active membership THEN the system SHALL display membership status and remaining sessions
4. WHEN a customer has no upcoming appointments THEN the system SHALL display an empty state with a "Book Appointment" call-to-action
5. WHEN a customer accesses the dashboard THEN the system SHALL display quick action buttons for "Book Appointment", "Add Pet", and "View Report Cards"
6. WHEN the dashboard loads THEN the system SHALL show skeleton loading states until data is fetched
7. WHEN a customer has earned a free wash THEN the dashboard SHALL highlight the "Redeem Free Wash" action prominently with a celebration visual

### Requirement 3: Appointments List View

**User Story:** As a customer, I want to view all my appointments (upcoming and past), so that I can track my grooming history and upcoming visits.

#### Acceptance Criteria

1. WHEN a customer navigates to the appointments page THEN the system SHALL display two tabs: "Upcoming" and "History"
2. WHEN viewing upcoming appointments THEN the system SHALL display appointments sorted by date (earliest first)
3. WHEN viewing appointment history THEN the system SHALL display past appointments sorted by date (most recent first)
4. WHEN displaying each appointment THEN the system SHALL show date, time, pet name, service type, and status
5. WHEN an appointment status is "confirmed" THEN the system SHALL display it with a green status indicator
6. WHEN an appointment status is "pending" THEN the system SHALL display it with a yellow status indicator
7. WHEN an appointment status is "cancelled" THEN the system SHALL display it with a gray status indicator
8. WHEN an appointment status is "completed" THEN the system SHALL display it with a blue status indicator
9. WHEN a customer has no appointments in a tab THEN the system SHALL display an appropriate empty state with helpful messaging

### Requirement 4: Appointment Detail View

**User Story:** As a customer, I want to view detailed information about a specific appointment, so that I can see all services, add-ons, and costs associated with my visit.

#### Acceptance Criteria

1. WHEN a customer clicks on an appointment THEN the system SHALL display the full appointment details
2. WHEN displaying appointment details THEN the system SHALL show pet name, breed, and photo (if available)
3. WHEN displaying appointment details THEN the system SHALL show service type and base price
4. WHEN displaying appointment details THEN the system SHALL show all selected add-ons with individual prices
5. WHEN displaying appointment details THEN the system SHALL show the total cost calculated from service and add-ons
6. WHEN displaying appointment details THEN the system SHALL show appointment date, time, and duration
7. WHEN displaying appointment details THEN the system SHALL show current appointment status
8. IF the appointment has special notes THEN the system SHALL display the notes in a dedicated section
9. WHEN the appointment is upcoming and more than 24 hours away THEN the system SHALL display a "Cancel Appointment" button
10. WHEN the appointment is completed and has a report card THEN the system SHALL display a "View Report Card" button

### Requirement 5: Appointment Cancellation

**User Story:** As a customer, I want to cancel an upcoming appointment when my plans change, so that I can free up the time slot for other customers.

#### Acceptance Criteria

1. WHEN a customer clicks "Cancel Appointment" THEN the system SHALL display a confirmation modal with cancellation policy
2. WHEN the appointment is less than 24 hours away THEN the system SHALL disable the cancel button and display a message to call the business
3. WHEN a customer confirms cancellation THEN the system SHALL update the appointment status to "cancelled"
4. WHEN a cancellation is successful THEN the system SHALL display a success toast notification
5. WHEN a cancellation is successful THEN the system SHALL send a cancellation confirmation email
6. IF the cancellation fails THEN the system SHALL display an error message and retain the original appointment status
7. WHEN an appointment is cancelled THEN the system SHALL make the time slot available for other customers to book

### Requirement 6: Appointment Rebooking

**User Story:** As a customer, I want to rebook a past appointment with the same service and pet, so that I can quickly schedule recurring grooming visits.

#### Acceptance Criteria

1. WHEN viewing a completed appointment THEN the system SHALL display a "Book Again" button
2. WHEN a customer clicks "Book Again" THEN the system SHALL pre-fill the booking widget with the same pet, service, and add-ons
3. WHEN the booking widget is pre-filled THEN the system SHALL allow the customer to select a new date and time
4. WHEN rebooking THEN the system SHALL use current pricing (not historical pricing from the original appointment)
5. WHEN rebooking is successful THEN the system SHALL create a new appointment record and redirect to appointment confirmation

### Requirement 7: Pet List View

**User Story:** As a customer, I want to view all my registered pets in one place, so that I can easily access and manage their information.

#### Acceptance Criteria

1. WHEN a customer navigates to the pets page THEN the system SHALL display all pets associated with their account
2. WHEN displaying pets THEN the system SHALL show pet name, breed, age, and photo (if available)
3. WHEN displaying pets THEN the system SHALL show the number of appointments for each pet
4. WHEN a customer has no pets THEN the system SHALL display an empty state with an "Add Pet" call-to-action
5. WHEN displaying the pet list THEN the system SHALL provide an "Add New Pet" button prominently
6. WHEN a customer clicks on a pet card THEN the system SHALL navigate to the pet detail page

### Requirement 8: Pet Detail View

**User Story:** As a customer, I want to view detailed information about a specific pet, so that I can see their grooming history and upcoming appointments.

#### Acceptance Criteria

1. WHEN a customer accesses a pet detail page THEN the system SHALL display the pet's complete profile information
2. WHEN displaying pet details THEN the system SHALL show name, breed, weight, age, color, and special notes
3. WHEN displaying pet details THEN the system SHALL show the pet's photo if available, or a placeholder if not
4. WHEN displaying pet details THEN the system SHALL show upcoming appointments for that pet
5. WHEN displaying pet details THEN the system SHALL show past appointments for that pet (most recent first)
6. WHEN displaying pet details THEN the system SHALL provide an "Edit Pet" button
7. WHEN displaying pet details THEN the system SHALL provide a "Book Appointment" button that pre-selects this pet
8. IF the pet's breed has grooming frequency recommendations THEN the system SHALL display a grooming reminder based on last appointment date

### Requirement 9: Add New Pet

**User Story:** As a customer, I want to add a new pet to my account, so that I can book grooming appointments for all my dogs.

#### Acceptance Criteria

1. WHEN a customer clicks "Add Pet" THEN the system SHALL display a pet creation form
2. WHEN the form loads THEN the system SHALL require pet name (text), breed (dropdown), and weight (number)
3. WHEN the form loads THEN the system SHALL make age, color, photo, and special notes optional fields
4. WHEN a customer submits the form with valid data THEN the system SHALL create a new pet record linked to their user account
5. WHEN pet creation is successful THEN the system SHALL display a success toast notification
6. WHEN pet creation is successful THEN the system SHALL redirect to the pet detail page
7. IF the form has validation errors THEN the system SHALL display inline error messages for invalid fields
8. IF pet creation fails THEN the system SHALL display an error message and retain form data for correction
9. WHEN uploading a pet photo THEN the system SHALL validate file type (JPEG, PNG) and size (max 5MB)
10. WHEN a pet photo is uploaded THEN the system SHALL store it in Supabase Storage and link the URL to the pet record

### Requirement 10: Edit Pet Information

**User Story:** As a customer, I want to update my pet's information when it changes, so that the grooming staff has accurate details.

#### Acceptance Criteria

1. WHEN a customer clicks "Edit Pet" THEN the system SHALL display a pre-filled edit form with current pet data
2. WHEN the edit form loads THEN the system SHALL allow modification of name, breed, weight, age, color, photo, and special notes
3. WHEN a customer submits the edit form with valid changes THEN the system SHALL update the pet record
4. WHEN the update is successful THEN the system SHALL display a success toast notification
5. WHEN the update is successful THEN the system SHALL show the updated pet details
6. IF the form has validation errors THEN the system SHALL display inline error messages for invalid fields
7. IF the update fails THEN the system SHALL display an error message and retain form data for correction
8. WHEN updating a pet photo THEN the system SHALL replace the old photo in Supabase Storage
9. WHEN a customer cancels editing THEN the system SHALL discard changes and return to the pet detail view

### Requirement 11: Pet Grooming Reminders

**User Story:** As a customer, I want to receive reminders when my pet is due for grooming based on their breed, so that I maintain a consistent grooming schedule.

#### Acceptance Criteria

1. WHEN displaying a pet detail page THEN the system SHALL calculate days since last completed appointment
2. IF the breed has a recommended grooming frequency AND the pet is due or overdue THEN the system SHALL display a reminder banner
3. WHEN a grooming reminder is shown THEN the system SHALL indicate how many days overdue the pet is
4. WHEN a grooming reminder is shown THEN the system SHALL provide a "Book Now" button that pre-selects the pet
5. IF the pet has never had an appointment THEN the system SHALL display a general reminder to book the first grooming
6. IF the pet is not due for grooming THEN the system SHALL display the next recommended grooming date

### Requirement 12: Report Cards List View

**User Story:** As a customer, I want to view all report cards for my pets, so that I can see the grooming results and staff notes from each visit.

#### Acceptance Criteria

1. WHEN a customer navigates to the report cards page THEN the system SHALL display all report cards for their pets
2. WHEN displaying report cards THEN the system SHALL sort them by appointment date (most recent first)
3. WHEN displaying each report card THEN the system SHALL show pet name, appointment date, and service type
4. WHEN displaying each report card THEN the system SHALL show a thumbnail of the "after" photo
5. WHEN a customer has no report cards THEN the system SHALL display an empty state explaining that report cards appear after completed appointments
6. WHEN a customer clicks on a report card THEN the system SHALL navigate to the detailed report card view

### Requirement 13: Report Card Detail View

**User Story:** As a customer, I want to view a detailed report card with before/after photos and grooming notes, so that I can see the care my pet received.

#### Acceptance Criteria

1. WHEN a customer accesses a report card detail page THEN the system SHALL display the complete report card information
2. WHEN displaying the report card THEN the system SHALL show pet name, appointment date, service type, and groomer name
3. WHEN displaying the report card THEN the system SHALL show before and after photos side by side (desktop) or stacked (mobile)
4. WHEN photos are displayed THEN the system SHALL optimize images for web viewing
5. WHEN a customer clicks on a photo THEN the system SHALL open a full-screen lightbox view
6. WHEN displaying the report card THEN the system SHALL show grooming notes from staff in a dedicated section
7. IF the report card includes health observations THEN the system SHALL display them in a prominent callout
8. WHEN displaying the report card THEN the system SHALL show all services and add-ons performed
9. WHEN viewing the report card THEN the system SHALL provide a "Book Again" button to rebook the same service
10. WHEN viewing the report card THEN the system SHALL provide a "Leave Review" button if the customer hasn't reviewed yet

### Requirement 14: Profile Management

**User Story:** As a customer, I want to update my contact information and preferences, so that the business can reach me and provide personalized service.

#### Acceptance Criteria

1. WHEN a customer navigates to the profile page THEN the system SHALL display their current account information
2. WHEN the profile page loads THEN the system SHALL show first name, last name, email, phone number, and address
3. WHEN a customer updates profile information THEN the system SHALL validate required fields (first name, last name, email, phone)
4. WHEN a customer submits valid profile changes THEN the system SHALL update the user record in the database
5. WHEN the profile update is successful THEN the system SHALL display a success toast notification
6. IF the profile update fails THEN the system SHALL display an error message and retain form data for correction
7. WHEN updating the email address THEN the system SHALL send a verification email to the new address
8. WHEN the email is changed THEN the system SHALL require re-authentication for security
9. IF form validation fails THEN the system SHALL display inline error messages for invalid fields

### Requirement 15: Password Management

**User Story:** As a customer, I want to change my password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN a customer navigates to the security settings THEN the system SHALL provide a "Change Password" option
2. WHEN changing password THEN the system SHALL require current password, new password, and confirm new password
3. WHEN a customer submits a password change THEN the system SHALL validate that the current password is correct
4. WHEN validating the new password THEN the system SHALL require minimum 8 characters with at least one uppercase, one lowercase, and one number
5. WHEN the new password and confirmation don't match THEN the system SHALL display a validation error
6. WHEN password change is successful THEN the system SHALL display a success message
7. WHEN password change is successful THEN the system SHALL send a confirmation email
8. IF the current password is incorrect THEN the system SHALL display an error and prevent the change
9. IF the password change fails THEN the system SHALL display an error message

### Requirement 16: Notification Preferences

**User Story:** As a customer, I want to manage my notification preferences, so that I receive communications in my preferred way.

#### Acceptance Criteria

1. WHEN a customer accesses notification settings THEN the system SHALL display toggles for email and SMS notifications
2. WHEN displaying notification preferences THEN the system SHALL show options for appointment reminders, promotional offers, and report card notifications
3. WHEN a customer toggles a notification preference THEN the system SHALL immediately save the change
4. WHEN a preference is saved THEN the system SHALL display a subtle confirmation
5. WHEN email notifications are disabled THEN the system SHALL still send critical notifications (cancellation confirmations, password resets)
6. WHEN SMS notifications are enabled BUT no phone number is on file THEN the system SHALL prompt the customer to add a phone number
7. IF saving preferences fails THEN the system SHALL display an error and revert the toggle state

### Requirement 17: Loyalty Punch Card System

**User Story:** As a customer, I want to track my progress toward earning a free grooming session through a "Buy X, Get 1 Free" program, so that I feel rewarded for my loyalty and motivated to return.

#### Acceptance Criteria

**Core Functionality:**
1. WHEN a customer completes a paid grooming appointment THEN the system SHALL increment their punch count by 1
2. WHEN a customer reaches the required number of punches (X) THEN the system SHALL mark them eligible for a free grooming session
3. WHEN the default loyalty threshold is not overridden THEN the system SHALL use "Buy 9, Get 10th Free" (X=9)
4. WHERE an admin has set a custom threshold for a specific customer THEN the system SHALL use that customer's custom threshold
5. WHEN a customer redeems their free wash THEN the system SHALL reset their punch count to 0 and start a new cycle
6. IF a customer cancels an appointment THEN the system SHALL NOT count it toward their punch total

**Dashboard Widget Display:**
7. WHEN displaying the loyalty widget on the dashboard THEN the system SHALL show a fun, playful "punch card" visual with paw print stamps
8. WHEN displaying the punch card THEN the system SHALL show filled paw prints for completed visits and empty outlines for remaining visits
9. WHEN displaying punch progress THEN the system SHALL show encouraging text (e.g., "7 of 10 paws collected! 🐾")
10. WHEN a customer is close to earning a free wash (within 2 punches) THEN the system SHALL display an excited message (e.g., "Almost there! Just 2 more visits!")
11. WHEN a customer has earned a free wash THEN the system SHALL display a celebration state with confetti animation and "FREE WASH EARNED! 🎉" message
12. WHEN the widget loads THEN the system SHALL animate the paw stamps appearing with a playful bounce effect

**Widget Interactions:**
13. WHEN a customer hovers over a filled paw stamp THEN the system SHALL show the appointment date in a tooltip
14. WHEN a customer clicks on the loyalty widget THEN the system SHALL expand to show visit history or navigate to loyalty detail page
15. WHEN displaying the widget THEN the system SHALL show a progress bar or arc visualization below the paw stamps

### Requirement 18: Loyalty Visit History & Redemption

**User Story:** As a customer, I want to view my loyalty visit history and see when I've earned and redeemed free washes, so that I can track my rewards over time.

#### Acceptance Criteria

**Visit History:**
1. WHEN a customer accesses the loyalty detail page THEN the system SHALL display all qualifying visits sorted by date (most recent first)
2. WHEN displaying each visit THEN the system SHALL show date, service type, pet name, and punch earned indicator
3. WHEN a visit earned a punch THEN the system SHALL display it with a filled paw print icon
4. WHEN a free wash was redeemed THEN the system SHALL display it with a special "FREE" badge and star icon
5. WHEN displaying the history THEN the system SHALL clearly separate current cycle visits from previous cycles

**Redemption Flow:**
6. WHEN a customer has earned a free wash THEN the system SHALL display a prominent "Redeem Free Wash" button on dashboard and loyalty page
7. WHEN a customer clicks "Redeem Free Wash" THEN the system SHALL navigate to the booking widget with the free wash reward pre-applied
8. WHEN booking with a free wash reward THEN the system SHALL show $0 for the base grooming service price
9. WHEN a free wash is applied THEN the system SHALL still allow adding paid add-ons at regular prices
10. WHEN the free wash appointment is completed THEN the system SHALL mark the reward as redeemed and start a new cycle

**Statistics Display:**
11. WHEN displaying the loyalty page THEN the system SHALL show total lifetime visits
12. WHEN displaying the loyalty page THEN the system SHALL show total free washes earned and redeemed
13. WHEN displaying the loyalty page THEN the system SHALL show the customer's current threshold (default or custom)
14. IF a customer has a custom threshold THEN the system SHALL indicate this with "VIP" or special status badge

**Edge Cases:**
15. IF a customer has multiple unredeemed free washes THEN the system SHALL display the count and allow redeeming one at a time
16. IF the admin changes a customer's threshold mid-cycle THEN the system SHALL apply the new threshold to the current cycle

### Requirement 19: Membership Status Display

**User Story:** As a customer with an active membership, I want to view my membership details and benefits, so that I understand what I have access to.

#### Acceptance Criteria

1. WHERE a customer has an active membership THEN the system SHALL display membership status on the dashboard
2. WHEN a customer navigates to the membership page THEN the system SHALL show the membership plan name and tier
3. WHEN displaying membership details THEN the system SHALL show start date, renewal date, and membership status
4. WHEN displaying membership details THEN the system SHALL show included benefits and any usage limits
5. IF the membership includes appointment credits THEN the system SHALL display remaining credits vs. total credits
6. WHEN the membership is approaching renewal THEN the system SHALL display the renewal date prominently
7. IF the membership is expired THEN the system SHALL display an expired status and offer renewal options
8. WHERE a customer does not have a membership THEN the system SHALL display information about available membership plans

### Requirement 20: Membership Usage Tracking

**User Story:** As a customer with a membership, I want to see how I've used my membership benefits, so that I can maximize my value.

#### Acceptance Criteria

1. WHERE a customer has a membership with usage limits THEN the system SHALL track and display usage
2. WHEN displaying membership usage THEN the system SHALL show appointments used vs. appointments included
3. WHEN a membership benefit is used THEN the system SHALL update the usage count immediately
4. WHEN the membership usage is near the limit (90%+) THEN the system SHALL display a warning notification
5. WHEN all membership benefits are exhausted THEN the system SHALL clearly indicate that standard pricing will apply
6. IF the membership includes rollover benefits THEN the system SHALL display carried-over credits separately

### Requirement 21: Responsive Navigation

**User Story:** As a customer, I want intuitive navigation that works well on both desktop and mobile, so that I can easily access all portal features on any device.

#### Acceptance Criteria

1. WHEN accessing the portal on desktop (≥1024px) THEN the system SHALL display a sidebar navigation
2. WHEN accessing the portal on mobile (<1024px) THEN the system SHALL display a bottom navigation bar
3. WHEN the navigation loads THEN the system SHALL highlight the current active page
4. WHEN on desktop THEN the navigation SHALL include Dashboard, Appointments, Pets, Report Cards, Loyalty, and Profile sections
5. WHEN on mobile THEN the navigation SHALL show icons with labels for the most important sections
6. WHEN a customer clicks a navigation item THEN the system SHALL navigate to the corresponding page without full page reload
7. WHEN navigating THEN the system SHALL update the browser URL and history
8. WHEN using the browser back button THEN the system SHALL navigate to the previous portal page

### Requirement 22: Loading States

**User Story:** As a customer, I want to see clear loading indicators when data is being fetched, so that I understand the system is working.

#### Acceptance Criteria

1. WHEN a page is initially loading THEN the system SHALL display skeleton screens matching the expected content layout
2. WHEN data is being fetched THEN the system SHALL show loading spinners or progress indicators
3. WHEN images are loading THEN the system SHALL display placeholder images with loading animations
4. WHEN an action is processing (e.g., saving profile) THEN the system SHALL disable the submit button and show a loading state
5. WHEN data loading takes longer than 3 seconds THEN the system SHALL display a message that data is still loading
6. IF data loading fails THEN the system SHALL display an error state with a retry option

### Requirement 23: Empty States

**User Story:** As a customer, I want helpful guidance when I have no data in a section, so that I know what actions to take.

#### Acceptance Criteria

1. WHEN a section has no data THEN the system SHALL display an empty state illustration and message
2. WHEN displaying an empty state THEN the system SHALL provide a clear call-to-action button
3. WHEN the empty state is for appointments THEN the system SHALL show a "Book Your First Appointment" button
4. WHEN the empty state is for pets THEN the system SHALL show an "Add Your First Pet" button
5. WHEN the empty state is for report cards THEN the system SHALL explain that report cards appear after grooming appointments
6. WHEN displaying empty states THEN the system SHALL use friendly, encouraging messaging consistent with the brand voice

### Requirement 24: Error Handling

**User Story:** As a customer, I want clear error messages when something goes wrong, so that I understand what happened and how to resolve it.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display a user-friendly error message
2. WHEN an error occurs THEN the system SHALL avoid exposing technical details or stack traces
3. WHEN a form submission fails THEN the system SHALL preserve form data and highlight errors
4. WHEN a critical error occurs THEN the system SHALL provide a "Contact Support" option with phone and email
5. IF an error boundary catches an error THEN the system SHALL display a fallback UI with error details for support
6. WHEN an API request fails THEN the system SHALL retry once before showing an error
7. IF authentication fails THEN the system SHALL redirect to login with an appropriate error message

### Requirement 25: Toast Notifications

**User Story:** As a customer, I want brief confirmation messages for my actions, so that I know when operations succeed or fail.

#### Acceptance Criteria

1. WHEN an action succeeds THEN the system SHALL display a success toast notification for 3 seconds
2. WHEN an action fails THEN the system SHALL display an error toast notification for 5 seconds
3. WHEN displaying a toast THEN the system SHALL position it in the top-right corner (desktop) or top-center (mobile)
4. WHEN multiple toasts are triggered THEN the system SHALL stack them vertically
5. WHEN a toast is displayed THEN the system SHALL allow manual dismissal via a close button
6. WHEN a toast auto-dismisses THEN the system SHALL use a fade-out animation
7. WHEN a toast message is critical THEN the system SHALL require manual dismissal

### Requirement 26: Confirmation Modals

**User Story:** As a customer, I want confirmation prompts before destructive actions, so that I don't accidentally delete or cancel important information.

#### Acceptance Criteria

1. WHEN a customer attempts to cancel an appointment THEN the system SHALL display a confirmation modal
2. WHEN a confirmation modal is shown THEN the system SHALL clearly explain the action and its consequences
3. WHEN displaying a confirmation modal THEN the system SHALL provide "Confirm" and "Cancel" buttons
4. WHEN a customer clicks "Confirm" THEN the system SHALL proceed with the action
5. WHEN a customer clicks "Cancel" or clicks outside the modal THEN the system SHALL close the modal without action
6. WHEN a destructive action is confirmed THEN the system SHALL disable the confirm button and show loading state
7. WHEN displaying a cancellation modal THEN the system SHALL include the cancellation policy details

### Requirement 27: Real-time Updates

**User Story:** As a customer, I want my appointment information to update automatically when changes occur, so that I always see the current status.

#### Acceptance Criteria

1. WHEN an appointment status changes THEN the system SHALL update the UI in real-time via Supabase Realtime
2. WHEN a new report card is created THEN the system SHALL notify the customer and update the report cards list
3. WHEN a loyalty punch is earned (appointment completed) THEN the system SHALL animate a new paw stamp appearing on the punch card widget
4. WHEN a free wash is earned THEN the system SHALL trigger the celebration animation with confetti effect in real-time
5. WHEN subscribed to real-time updates THEN the system SHALL handle connection drops gracefully
6. IF the real-time connection is lost THEN the system SHALL attempt to reconnect automatically
7. WHEN the real-time connection is restored THEN the system SHALL sync any missed updates

### Requirement 28: Image Optimization

**User Story:** As a customer, I want report card and pet photos to load quickly, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. WHEN displaying pet photos THEN the system SHALL use Next.js Image component for automatic optimization
2. WHEN displaying report card photos THEN the system SHALL serve images in modern formats (WebP) with fallbacks
3. WHEN images are loading THEN the system SHALL display blurred placeholders
4. WHEN displaying thumbnails THEN the system SHALL use appropriately sized images (not full resolution)
5. WHEN a customer clicks a thumbnail THEN the system SHALL load the full-resolution image in a lightbox
6. WHEN images fail to load THEN the system SHALL display a fallback placeholder image
7. WHEN uploading pet photos THEN the system SHALL compress images client-side before upload (if >1MB)

### Requirement 29: Accessibility

**User Story:** As a customer using assistive technology, I want the portal to be accessible, so that I can independently manage my appointments and pets.

#### Acceptance Criteria

1. WHEN navigating the portal THEN the system SHALL support keyboard navigation for all interactive elements
2. WHEN focusing on interactive elements THEN the system SHALL display visible focus indicators
3. WHEN displaying images THEN the system SHALL provide descriptive alt text
4. WHEN using form inputs THEN the system SHALL associate labels with form fields
5. WHEN displaying error messages THEN the system SHALL announce them to screen readers
6. WHEN opening modals THEN the system SHALL trap focus within the modal and return focus on close
7. WHEN using color to convey information THEN the system SHALL also provide text or icon indicators
8. WHEN the page loads THEN the system SHALL have a logical heading hierarchy (h1 → h2 → h3)

### Requirement 30: Performance

**User Story:** As a customer, I want the portal to load quickly and respond immediately to my actions, so that I can efficiently manage my account.

#### Acceptance Criteria

1. WHEN a page loads THEN the system SHALL achieve First Contentful Paint (FCP) within 1.5 seconds
2. WHEN navigating between pages THEN the system SHALL use Next.js prefetching for instant navigation
3. WHEN rendering lists THEN the system SHALL implement virtualization for lists exceeding 50 items
4. WHEN fetching data THEN the system SHALL use Server Components for initial page loads
5. WHEN implementing interactive features THEN the system SHALL only use Client Components where necessary
6. WHEN loading heavy components THEN the system SHALL use React Suspense boundaries with loading fallbacks
7. WHEN bundle size exceeds 200KB THEN the system SHALL implement code splitting for large dependencies
