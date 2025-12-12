# Implementation Tasks - Phase 4: Customer Portal

This document contains the implementation tasks for the Customer Portal feature. Each task is designed to be executed incrementally in a test-driven manner, building upon previous tasks.

**References:**
- Requirements: `docs/specs/phase-4/requirements.md`
- Design: `docs/specs/phase-4/design.md`

---

## Group 1: Database & Types Foundation

### 1. [ ] Set up loyalty system database schema and types
- **Objective**: Create the database schema for the punch card loyalty system and TypeScript types
- **Files to create/modify**:
  - `src/types/loyalty.ts` - Loyalty-related TypeScript interfaces
  - `src/types/api.ts` - API response types for customer portal
  - `src/mocks/supabase/seed.ts` - Add loyalty mock data
  - `src/mocks/supabase/store.ts` - Add loyalty tables to mock store
- **Requirements covered**: REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6
- **Acceptance criteria**:
  - TypeScript interfaces defined for `CustomerLoyalty`, `LoyaltyPunch`, `LoyaltyRedemption`, `LoyaltySettings`
  - Mock store includes `customer_loyalty`, `loyalty_punches`, `loyalty_redemptions`, `loyalty_settings` tables
  - Seed data includes sample loyalty records for test customers
  - Unit tests pass for loyalty data operations

### 1.1. [ ] Add notification preferences to user types
- **Objective**: Extend user preferences type to include notification settings
- **Files to create/modify**:
  - `src/types/database.ts` - Add `UserPreferences` interface with notification settings
- **Requirements covered**: REQ-16.1, REQ-16.2
- **Acceptance criteria**:
  - `UserPreferences` interface includes email and SMS notification toggles
  - Interface supports appointment reminders, promotional offers, and report card notifications

---

## Group 2: Shared UI Components

### 2. [ ] Create Toast notification system
- **Objective**: Implement a reusable toast notification system for success/error messages
- **Files to create/modify**:
  - `src/hooks/use-toast.ts` - Toast hook with state management
  - `src/components/ui/toast.tsx` - Toast component with animations
  - `src/components/ui/toaster.tsx` - Toast container component
- **Requirements covered**: REQ-25.1, REQ-25.2, REQ-25.3, REQ-25.4, REQ-25.5, REQ-25.6, REQ-25.7
- **Acceptance criteria**:
  - Success toasts display for 3 seconds with fade-out
  - Error toasts display for 5 seconds
  - Toasts positioned top-right (desktop) or top-center (mobile)
  - Multiple toasts stack vertically
  - Manual dismissal via close button
  - Critical toasts require manual dismissal
  - Write unit tests for toast behavior

### 2.1. [ ] Create EmptyState component
- **Objective**: Build reusable empty state component for sections with no data
- **Files to create/modify**:
  - `src/components/ui/EmptyState.tsx` - Empty state with icon, title, description, and CTA
- **Requirements covered**: REQ-23.1, REQ-23.2, REQ-23.3, REQ-23.4, REQ-23.5, REQ-23.6
- **Acceptance criteria**:
  - Supports multiple icon types (calendar, dog, file, gift)
  - Displays title, description, and optional action button
  - Uses friendly, encouraging messaging
  - Follows Clean & Elegant Professional design

### 2.2. [ ] Create StatusBadge component
- **Objective**: Build status badge component for appointment statuses
- **Files to create/modify**:
  - `src/components/ui/StatusBadge.tsx` - Status badge with color variants
- **Requirements covered**: REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8
- **Acceptance criteria**:
  - Confirmed = green badge
  - Pending = yellow badge
  - Cancelled = gray badge
  - Completed = blue badge
  - Additional statuses: checked_in, in_progress, ready, no_show

### 2.3. [ ] Create ConfirmationModal component
- **Objective**: Build reusable confirmation modal for destructive actions
- **Files to create/modify**:
  - `src/components/ui/ConfirmationModal.tsx` - Modal with DaisyUI styling
- **Requirements covered**: REQ-26.1, REQ-26.2, REQ-26.3, REQ-26.4, REQ-26.5, REQ-26.6, REQ-26.7
- **Acceptance criteria**:
  - Displays title, description, confirm/cancel buttons
  - Confirm button shows loading state during action
  - Click outside or cancel button closes without action
  - Supports custom confirm button styling (e.g., error for destructive)
  - Includes cancellation policy details when relevant

### 2.4. [ ] Create loading skeleton components
- **Objective**: Build skeleton loading components matching portal layout
- **Files to create/modify**:
  - `src/components/ui/skeletons/AppointmentCardSkeleton.tsx`
  - `src/components/ui/skeletons/PetCardSkeleton.tsx`
  - `src/components/ui/skeletons/DashboardSkeleton.tsx`
- **Requirements covered**: REQ-22.1, REQ-22.2, REQ-22.3, REQ-22.5
- **Acceptance criteria**:
  - Skeletons match expected content layout
  - Use pulse animation for loading effect
  - Reusable across different portal pages

---

## Group 3: Layout & Navigation

### 3. [ ] Implement CustomerNav component with responsive navigation
- **Objective**: Create responsive navigation with desktop sidebar and mobile bottom dock
- **Files to create/modify**:
  - `src/components/customer/CustomerNav.tsx` - Navigation component with sidebar (desktop) and bottom dock (mobile)
- **Requirements covered**: REQ-21.1, REQ-21.2, REQ-21.3, REQ-21.4, REQ-21.5, REQ-21.6, REQ-21.7, REQ-21.8
- **Acceptance criteria**:
  - Desktop (>=1024px): Fixed sidebar with logo, user info, and vertical nav links
  - Mobile (<1024px): Fixed bottom navigation with icons and labels
  - Active page highlighted with charcoal background (desktop) or bold stroke (mobile)
  - Navigation items: Dashboard, Appointments, Pets, Report Cards, Loyalty, Profile
  - Client-side navigation without full page reload
  - Browser history updated on navigation

### 3.1. [ ] Update CustomerLayout with authentication and navigation
- **Objective**: Enhance customer layout with auth verification and responsive navigation
- **Files to create/modify**:
  - `src/app/(customer)/layout.tsx` - Server component with auth check and CustomerNav
- **Requirements covered**: REQ-1.1, REQ-1.2, REQ-1.4, REQ-21.1, REQ-21.2
- **Acceptance criteria**:
  - Server-side session verification before rendering
  - Non-authenticated users redirected to login with return URL
  - Users with non-customer role redirected to 403 page
  - CustomerNav included in layout
  - Main content area with proper padding and max-width
  - Background color #F8EEE5 applied

---

## Group 4: Dashboard

### 4. [ ] Create Dashboard page structure with widgets
- **Objective**: Build the dashboard page with widget layout and server-side data fetching
- **Files to create/modify**:
  - `src/app/(customer)/dashboard/page.tsx` - Dashboard page with parallel data fetching
- **Requirements covered**: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6
- **Acceptance criteria**:
  - Server Component fetching appointments, loyalty, and membership data in parallel
  - Displays greeting with user name
  - Responsive grid layout (2 cols on desktop, 1 col on mobile)
  - Shows skeleton loading state until data fetched
  - Conditional membership widget display

### 4.1. [ ] Create UpcomingAppointments widget
- **Objective**: Build widget showing next 3 upcoming appointments
- **Files to create/modify**:
  - `src/components/customer/dashboard/UpcomingAppointments.tsx` - Upcoming appointments list widget
- **Requirements covered**: REQ-2.1, REQ-2.4
- **Acceptance criteria**:
  - Shows up to 3 upcoming appointments sorted chronologically
  - Displays pet name, service type, date, time for each
  - Empty state with "Book Appointment" CTA when no appointments
  - Links to appointment detail page
  - "View All" link to appointments page

### 4.2. [ ] Create QuickActions widget
- **Objective**: Build quick action buttons for common tasks
- **Files to create/modify**:
  - `src/components/customer/dashboard/QuickActions.tsx` - Quick action buttons widget
- **Requirements covered**: REQ-2.5, REQ-2.7
- **Acceptance criteria**:
  - "Book Appointment" button linking to booking page
  - "Add Pet" button linking to new pet page
  - "View Report Cards" button linking to report cards page
  - "Redeem Free Wash" button (highlighted when free wash earned)
  - Buttons follow Clean & Elegant Professional design

### 4.3. [ ] Create MembershipStatus widget
- **Objective**: Build widget displaying membership status and usage
- **Files to create/modify**:
  - `src/components/customer/dashboard/MembershipStatus.tsx` - Membership status widget
- **Requirements covered**: REQ-2.3, REQ-19.1, REQ-19.6, REQ-19.7
- **Acceptance criteria**:
  - Only shown when customer has active membership
  - Displays plan name and status
  - Shows renewal date if approaching
  - Shows expired status with renewal option if applicable
  - Links to full membership page

---

## Group 5: Loyalty Punch Card System

### 5. [ ] Create LoyaltyPunchCard widget component
- **Objective**: Build animated punch card widget with paw stamps
- **Files to create/modify**:
  - `src/components/customer/loyalty/LoyaltyPunchCard.tsx` - Animated punch card widget
- **Requirements covered**: REQ-17.7, REQ-17.8, REQ-17.9, REQ-17.10, REQ-17.12, REQ-17.15
- **Dependencies**: Task 1 (loyalty types)
- **Acceptance criteria**:
  - Displays grid of paw stamps (filled for completed, outline for remaining)
  - Filled paws show charcoal color, empty paws show gray outline
  - Progress text shows "X of Y paws collected"
  - Close-to-goal message when within 2 visits
  - Paw stamps animate with spring/bounce effect on load (staggered)
  - Progress bar below stamps animates width
  - Link to full loyalty page

### 5.1. [ ] Add hover tooltips and interactions to punch card
- **Objective**: Add interactive elements to punch card widget
- **Files to create/modify**:
  - `src/components/customer/loyalty/LoyaltyPunchCard.tsx` - Add tooltip and click interactions
- **Requirements covered**: REQ-17.13, REQ-17.14
- **Acceptance criteria**:
  - Hovering filled paw shows appointment date in tooltip
  - Scale up and slight rotation on hover
  - Click on widget expands or navigates to loyalty detail page

### 5.2. [ ] Add celebration state with confetti to punch card
- **Objective**: Implement celebration animation when free wash is earned
- **Files to create/modify**:
  - `src/components/customer/loyalty/LoyaltyPunchCard.tsx` - Add confetti celebration
  - Install `react-confetti-explosion` package
- **Requirements covered**: REQ-17.11, REQ-2.7
- **Acceptance criteria**:
  - Confetti animation triggers when free wash earned
  - "FREE WASH EARNED!" message displayed prominently
  - "Redeem Free Wash" button appears
  - Confetti uses brand colors (#434E54, #EAE0D5, #F8EEE5, gold)

### 5.3. [ ] Create Loyalty page with visit history
- **Objective**: Build full loyalty page with punch card and visit history
- **Files to create/modify**:
  - `src/app/(customer)/loyalty/page.tsx` - Loyalty detail page
  - `src/components/customer/loyalty/VisitHistory.tsx` - Visit history component
- **Requirements covered**: REQ-18.1, REQ-18.2, REQ-18.3, REQ-18.4, REQ-18.5, REQ-18.11, REQ-18.12, REQ-18.13, REQ-18.14
- **Acceptance criteria**:
  - Displays LoyaltyPunchCard widget prominently
  - Shows all qualifying visits sorted by date (most recent first)
  - Each visit shows date, service type, pet name, and punch earned indicator
  - Free wash redemptions show special "FREE" badge with star icon
  - Separates current cycle from previous cycles
  - Shows total lifetime visits and free washes earned/redeemed
  - VIP badge if customer has custom threshold

### 5.4. [ ] Create loyalty API routes
- **Objective**: Build API routes for loyalty status and history
- **Files to create/modify**:
  - `src/app/api/customer/loyalty/route.ts` - GET loyalty status
  - `src/app/api/customer/loyalty/history/route.ts` - GET visit history by cycle
  - `src/app/api/customer/loyalty/redeem/route.ts` - POST mark redemption intent
- **Requirements covered**: REQ-17.1, REQ-17.5, REQ-18.6, REQ-18.7, REQ-18.8, REQ-18.9, REQ-18.10, REQ-18.15, REQ-18.16
- **Acceptance criteria**:
  - GET /loyalty returns current punches, threshold, unredeemed free washes
  - GET /loyalty/history returns punches and redemptions grouped by cycle
  - POST /loyalty/redeem marks intent to use free wash for booking
  - All routes verify customer authentication
  - Error handling for unauthorized access

---

## Group 6: Appointments

### 6. [ ] Create Appointments list page with tabs
- **Objective**: Build appointments page with Upcoming/History tabs
- **Files to create/modify**:
  - `src/app/(customer)/appointments/page.tsx` - Server component fetching all appointments
  - `src/components/customer/appointments/AppointmentTabs.tsx` - Client component with tab switching
- **Requirements covered**: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.9
- **Acceptance criteria**:
  - Server component fetches all customer appointments
  - Splits into upcoming (future, non-cancelled) and history (past or cancelled)
  - Upcoming sorted earliest first, history sorted most recent first
  - DaisyUI tabs for switching between Upcoming and History
  - Tab shows count of appointments
  - Empty state when no appointments in selected tab

### 6.1. [ ] Create AppointmentCard component
- **Objective**: Build appointment card for list display
- **Files to create/modify**:
  - `src/components/customer/appointments/AppointmentCard.tsx` - Appointment card component
- **Requirements covered**: REQ-3.4, REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8
- **Acceptance criteria**:
  - Shows pet photo (or placeholder), pet name, service type
  - Displays date, time, and total price
  - StatusBadge shows appointment status with correct color
  - Entire card is clickable, links to detail page
  - Hover shadow effect for interactivity

### 6.2. [ ] Create Appointment detail page
- **Objective**: Build appointment detail page with full information
- **Files to create/modify**:
  - `src/app/(customer)/appointments/[id]/page.tsx` - Server component fetching appointment
  - `src/components/customer/appointments/AppointmentDetailClient.tsx` - Client component with actions
- **Requirements covered**: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6, REQ-4.7, REQ-4.8, REQ-4.9, REQ-4.10
- **Acceptance criteria**:
  - Displays pet name, breed, and photo
  - Shows service type with base price
  - Lists all add-ons with individual prices
  - Shows calculated total cost
  - Displays date, time, duration, and status
  - Shows special notes if present
  - "Cancel Appointment" button for upcoming appointments >24hrs away
  - "View Report Card" button for completed appointments with report card

### 6.3. [ ] Implement appointment cancellation flow
- **Objective**: Add cancellation confirmation modal and API integration
- **Files to create/modify**:
  - `src/components/customer/appointments/AppointmentDetailClient.tsx` - Add cancellation modal
  - `src/app/api/customer/appointments/[id]/route.ts` - DELETE endpoint for cancellation
- **Requirements covered**: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5, REQ-5.6, REQ-5.7
- **Acceptance criteria**:
  - Cancel button opens ConfirmationModal with policy details
  - 24-hour policy enforced: button disabled if appointment <24hrs away
  - Message to call business shown when cancellation not allowed
  - API updates appointment status to "cancelled"
  - Success toast displayed on cancellation
  - Email confirmation sent (mock service)
  - Error handling with toast notification

### 6.4. [ ] Implement appointment rebooking flow
- **Objective**: Add "Book Again" functionality for completed appointments
- **Files to create/modify**:
  - `src/components/customer/appointments/AppointmentDetailClient.tsx` - Add rebook button
  - `src/app/api/customer/appointments/[id]/rebook/route.ts` - GET rebook data endpoint
- **Requirements covered**: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5
- **Acceptance criteria**:
  - "Book Again" button shown for completed appointments
  - Click navigates to booking widget with query params for pre-fill
  - Pre-fills same pet, service, and add-ons
  - Uses current pricing (not historical)
  - Allows selecting new date/time

---

## Group 7: Pet Management

### 7. [ ] Create Pets list page
- **Objective**: Build pets page with pet cards
- **Files to create/modify**:
  - `src/app/(customer)/pets/page.tsx` - Server component fetching all pets
  - `src/components/customer/pets/PetCard.tsx` - Pet card component
- **Requirements covered**: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.6
- **Acceptance criteria**:
  - Server component fetches all customer's pets with appointment counts
  - Pet cards show name, breed, age, photo (or placeholder)
  - Shows number of appointments for each pet
  - Empty state with "Add Pet" CTA when no pets
  - "Add New Pet" button prominently displayed
  - Cards link to pet detail page

### 7.1. [ ] Create Pet detail page
- **Objective**: Build pet detail page with profile and appointment history
- **Files to create/modify**:
  - `src/app/(customer)/pets/[id]/page.tsx` - Server component fetching pet data
  - `src/components/customer/pets/PetProfile.tsx` - Pet profile display component
- **Requirements covered**: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6, REQ-8.7
- **Acceptance criteria**:
  - Displays complete pet profile: name, breed, weight, age, color, special notes
  - Shows pet photo or placeholder
  - Lists upcoming appointments for this pet
  - Lists past appointments (most recent first)
  - "Edit Pet" button
  - "Book Appointment" button that pre-selects this pet

### 7.2. [ ] Add grooming reminder banner to Pet detail
- **Objective**: Show grooming reminder based on breed frequency
- **Files to create/modify**:
  - `src/components/customer/pets/GroomingReminder.tsx` - Reminder banner component
- **Requirements covered**: REQ-8.8, REQ-11.1, REQ-11.2, REQ-11.3, REQ-11.4, REQ-11.5, REQ-11.6
- **Acceptance criteria**:
  - Calculates days since last completed appointment
  - Shows reminder banner if pet is due or overdue based on breed frequency
  - Displays how many days overdue
  - "Book Now" button pre-selects the pet
  - Shows "Book your first grooming" for pets with no appointments
  - Shows next recommended date if not yet due

### 7.3. [ ] Create Add Pet form with validation
- **Objective**: Build form for adding new pets with photo upload
- **Files to create/modify**:
  - `src/app/(customer)/pets/new/page.tsx` - New pet page
  - `src/components/customer/pets/PetForm.tsx` - Reusable pet form component
- **Requirements covered**: REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6, REQ-9.7, REQ-9.8
- **Acceptance criteria**:
  - Form requires name (text), breed (dropdown), and size
  - Optional fields: age, weight, color, photo, special notes, medical info
  - React Hook Form with Zod validation
  - Inline error messages for validation errors
  - Success toast and redirect to pet detail on creation
  - Error handling with form data retention

### 7.4. [ ] Implement pet photo upload
- **Objective**: Add photo upload functionality to pet form
- **Files to create/modify**:
  - `src/components/customer/pets/PetForm.tsx` - Add photo upload UI
  - `src/app/api/customer/pets/upload-photo/route.ts` - Photo upload endpoint
- **Requirements covered**: REQ-9.9, REQ-9.10, REQ-28.7
- **Acceptance criteria**:
  - File input accepts JPEG and PNG images
  - Client-side validation: max 5MB file size
  - Preview shown immediately after selection
  - Upload to Supabase Storage (mock in dev)
  - Public URL saved to pet record
  - Client-side compression for images >1MB

### 7.5. [ ] Create Edit Pet form
- **Objective**: Build form for editing existing pets
- **Files to create/modify**:
  - `src/app/(customer)/pets/[id]/edit/page.tsx` - Edit pet page
- **Requirements covered**: REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4, REQ-10.5, REQ-10.6, REQ-10.7, REQ-10.8, REQ-10.9
- **Acceptance criteria**:
  - Pre-fills form with current pet data
  - Allows modification of all fields
  - Update pet record on submit
  - Success toast and show updated details
  - Photo replacement updates storage
  - Cancel button discards changes and returns to detail

### 7.6. [ ] Create pet API routes
- **Objective**: Build API routes for pet CRUD operations
- **Files to create/modify**:
  - `src/app/api/customer/pets/route.ts` - GET list, POST create
  - `src/app/api/customer/pets/[id]/route.ts` - GET, PUT, DELETE single pet
- **Requirements covered**: REQ-7.1, REQ-9.4, REQ-10.3
- **Acceptance criteria**:
  - GET /pets returns all customer's pets with appointment counts
  - POST /pets creates new pet linked to customer
  - GET /pets/[id] returns single pet with details
  - PUT /pets/[id] updates pet record
  - DELETE /pets/[id] soft deletes pet (if no appointments)
  - All routes verify customer ownership

---

## Group 8: Report Cards

### 8. [ ] Create Report Cards list page
- **Objective**: Build report cards page with thumbnail grid
- **Files to create/modify**:
  - `src/app/(customer)/report-cards/page.tsx` - Server component fetching report cards
  - `src/components/customer/report-cards/ReportCardCard.tsx` - Report card thumbnail component
- **Requirements covered**: REQ-12.1, REQ-12.2, REQ-12.3, REQ-12.4, REQ-12.5, REQ-12.6
- **Acceptance criteria**:
  - Server component fetches all customer's report cards
  - Sorted by appointment date (most recent first)
  - Each card shows pet name, date, service type
  - Thumbnail of "after" photo displayed
  - Empty state explaining report cards appear after appointments
  - Cards link to detail page

### 8.1. [ ] Create Report Card detail page
- **Objective**: Build report card detail page with before/after photos
- **Files to create/modify**:
  - `src/app/(customer)/report-cards/[id]/page.tsx` - Server component fetching report card
  - `src/components/customer/report-cards/GroomingNotes.tsx` - Grooming notes display
- **Requirements covered**: REQ-13.1, REQ-13.2, REQ-13.6, REQ-13.7, REQ-13.8, REQ-13.9, REQ-13.10
- **Acceptance criteria**:
  - Displays pet name, appointment date, service type, groomer name
  - Shows mood, coat condition, behavior indicators
  - Grooming notes in dedicated section
  - Health observations in prominent callout if present
  - Lists all services and add-ons performed
  - "Book Again" button to rebook same service
  - "Leave Review" button if not yet reviewed

### 8.2. [ ] Create BeforeAfterPhotos component with lightbox
- **Objective**: Build before/after photo display with full-screen lightbox
- **Files to create/modify**:
  - `src/components/customer/report-cards/BeforeAfterPhotos.tsx` - Photo grid with lightbox
  - Install `yet-another-react-lightbox` package
- **Requirements covered**: REQ-13.3, REQ-13.4, REQ-13.5, REQ-28.1, REQ-28.2, REQ-28.4, REQ-28.5
- **Acceptance criteria**:
  - Side-by-side on desktop, stacked on mobile
  - Next.js Image component for optimization
  - WebP format with fallbacks
  - Click opens full-screen lightbox
  - Zoom plugin for close inspection
  - Blurred placeholder while loading

### 8.3. [ ] Create report cards API routes
- **Objective**: Build API routes for report card retrieval
- **Files to create/modify**:
  - `src/app/api/customer/report-cards/route.ts` - GET list of report cards
  - `src/app/api/customer/report-cards/[id]/route.ts` - GET single report card
- **Requirements covered**: REQ-12.1, REQ-13.1
- **Acceptance criteria**:
  - GET /report-cards returns all customer's report cards with pet and service info
  - GET /report-cards/[id] returns full report card with appointment details
  - Verifies customer ownership via appointment relationship
  - Optimized image URLs for thumbnails vs full-size

---

## Group 9: Profile & Settings

### 9. [ ] Create Profile page with edit form
- **Objective**: Build profile page for viewing and editing personal information
- **Files to create/modify**:
  - `src/app/(customer)/profile/page.tsx` - Profile page
  - `src/components/customer/profile/ProfileForm.tsx` - Profile edit form
- **Requirements covered**: REQ-14.1, REQ-14.2, REQ-14.3, REQ-14.4, REQ-14.5, REQ-14.6, REQ-14.9
- **Acceptance criteria**:
  - Displays current account info: name, email, phone, address
  - Edit form with validation (required: first name, last name, email, phone)
  - Success toast on update
  - Error handling with form data retention
  - Inline validation error messages

### 9.1. [ ] Implement email change with verification
- **Objective**: Add secure email change flow requiring verification
- **Files to create/modify**:
  - `src/components/customer/profile/ProfileForm.tsx` - Email change handling
  - `src/app/api/customer/profile/route.ts` - PUT profile endpoint with email verification
- **Requirements covered**: REQ-14.7, REQ-14.8
- **Acceptance criteria**:
  - Email change sends verification email to new address
  - Requires re-authentication for security
  - Clear messaging about verification requirement

### 9.2. [ ] Create Password change section
- **Objective**: Build password change form with validation
- **Files to create/modify**:
  - `src/components/customer/profile/PasswordForm.tsx` - Password change form
  - `src/app/api/customer/profile/password/route.ts` - POST password change endpoint
- **Requirements covered**: REQ-15.1, REQ-15.2, REQ-15.3, REQ-15.4, REQ-15.5, REQ-15.6, REQ-15.7, REQ-15.8, REQ-15.9
- **Acceptance criteria**:
  - Requires current password, new password, confirm password
  - Validates current password is correct
  - New password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
  - Confirm password must match
  - Success message on change
  - Sends confirmation email
  - Error handling for incorrect current password

### 9.3. [ ] Create Notification preferences section
- **Objective**: Build notification preference toggles
- **Files to create/modify**:
  - `src/components/customer/profile/NotificationPreferences.tsx` - Preference toggles
  - `src/app/api/customer/profile/preferences/route.ts` - PUT preferences endpoint
- **Requirements covered**: REQ-16.1, REQ-16.2, REQ-16.3, REQ-16.4, REQ-16.5, REQ-16.6, REQ-16.7
- **Acceptance criteria**:
  - Toggles for email and SMS notifications
  - Categories: appointment reminders, promotional offers, report card notifications
  - Immediate save on toggle change
  - Subtle confirmation on save
  - Critical notifications always sent (cancellation, password reset)
  - Prompt to add phone if SMS enabled without phone number
  - Revert toggle on save failure with error

---

## Group 10: Membership

### 10. [ ] Create Membership page
- **Objective**: Build membership page with status and usage tracking
- **Files to create/modify**:
  - `src/app/(customer)/membership/page.tsx` - Membership page
  - `src/components/customer/membership/MembershipDetails.tsx` - Membership details component
  - `src/components/customer/membership/UsageTracker.tsx` - Usage tracking component
- **Requirements covered**: REQ-19.2, REQ-19.3, REQ-19.4, REQ-19.5, REQ-19.8, REQ-20.1, REQ-20.2, REQ-20.3, REQ-20.4, REQ-20.5, REQ-20.6
- **Acceptance criteria**:
  - Shows membership plan name and tier
  - Displays start date, renewal date, status
  - Lists included benefits and usage limits
  - Shows remaining credits vs total (if applicable)
  - Prominent renewal date when approaching
  - Warning when usage near limit (90%+)
  - Clear indication when benefits exhausted
  - Non-members see info about available plans

### 10.1. [ ] Create membership API route
- **Objective**: Build API route for membership status
- **Files to create/modify**:
  - `src/app/api/customer/membership/route.ts` - GET membership status and usage
- **Requirements covered**: REQ-19.2, REQ-20.1
- **Acceptance criteria**:
  - Returns membership details with usage statistics
  - Includes remaining/total credits calculation
  - Returns null with available plans for non-members

---

## Group 11: Real-time & Polish

### 11. [ ] Set up Supabase Realtime subscriptions for appointments
- **Objective**: Implement real-time updates for appointment status changes
- **Files to create/modify**:
  - `src/components/customer/appointments/AppointmentDetailClient.tsx` - Add realtime subscription
  - `src/lib/supabase/realtime.ts` - Realtime utility functions
- **Requirements covered**: REQ-27.1, REQ-27.5, REQ-27.6, REQ-27.7
- **Acceptance criteria**:
  - Subscribe to appointment status changes for viewed appointment
  - UI updates automatically when status changes
  - Toast notification on status change
  - Graceful handling of connection drops
  - Auto-reconnect on connection loss
  - Sync missed updates on reconnection

### 11.1. [ ] Add real-time report card notifications
- **Objective**: Show notifications when new report cards are created
- **Files to create/modify**:
  - `src/components/customer/dashboard/ReportCardListener.tsx` - Realtime listener component
  - `src/app/(customer)/layout.tsx` - Add listener to layout
- **Requirements covered**: REQ-27.2
- **Acceptance criteria**:
  - Subscribe to new report card inserts
  - Verify report card is for current customer
  - Toast notification with pet name and "View Now" action
  - 10-second duration for notification

### 11.2. [ ] Add real-time loyalty punch animations
- **Objective**: Animate new punches appearing on loyalty widget in real-time
- **Files to create/modify**:
  - `src/components/customer/loyalty/LoyaltyPunchCard.tsx` - Add realtime subscription
- **Requirements covered**: REQ-27.3, REQ-27.4
- **Acceptance criteria**:
  - Subscribe to new loyalty punch inserts
  - Animate new paw stamp appearing with bounce effect
  - Trigger confetti celebration if free wash earned
  - Update punch count and progress bar

### 11.3. [ ] Implement error boundaries
- **Objective**: Add error boundaries for graceful error handling
- **Files to create/modify**:
  - `src/components/ErrorBoundary.tsx` - Error boundary component
  - `src/app/(customer)/error.tsx` - Customer portal error page
- **Requirements covered**: REQ-24.1, REQ-24.2, REQ-24.4, REQ-24.5, REQ-24.6
- **Acceptance criteria**:
  - Catches rendering errors in customer portal
  - Displays user-friendly error message (no technical details)
  - Provides "Contact Support" with phone and email
  - Fallback UI for support
  - API requests retry once before showing error

### 11.4. [ ] Accessibility improvements
- **Objective**: Ensure portal meets accessibility requirements
- **Files to create/modify**:
  - All customer portal components - Add accessibility attributes
- **Requirements covered**: REQ-29.1, REQ-29.2, REQ-29.3, REQ-29.4, REQ-29.5, REQ-29.6, REQ-29.7, REQ-29.8
- **Acceptance criteria**:
  - Full keyboard navigation support for all interactive elements
  - Visible focus indicators
  - Descriptive alt text for all images
  - Labels associated with form fields
  - Error messages announced to screen readers
  - Modal focus trapping with focus return on close
  - Color information also conveyed via text/icons
  - Logical heading hierarchy (h1 -> h2 -> h3)

### 11.5. [ ] Performance optimization
- **Objective**: Optimize portal for fast loading and smooth interactions
- **Files to create/modify**:
  - Various components - Add performance optimizations
- **Requirements covered**: REQ-30.1, REQ-30.2, REQ-30.3, REQ-30.4, REQ-30.5, REQ-30.6, REQ-30.7
- **Acceptance criteria**:
  - FCP within 1.5 seconds
  - Next.js Link prefetching for instant navigation
  - Virtualization for lists >50 items
  - Server Components for initial data fetching
  - Client Components only where necessary
  - React Suspense boundaries with loading fallbacks
  - Code splitting for large dependencies if bundle >200KB

---

## Summary

| Group | Tasks | Description |
|-------|-------|-------------|
| 1 | 2 | Database & Types Foundation |
| 2 | 5 | Shared UI Components |
| 3 | 2 | Layout & Navigation |
| 4 | 4 | Dashboard |
| 5 | 5 | Loyalty Punch Card System |
| 6 | 5 | Appointments |
| 7 | 7 | Pet Management |
| 8 | 4 | Report Cards |
| 9 | 4 | Profile & Settings |
| 10 | 2 | Membership |
| 11 | 6 | Real-time & Polish |

**Total Tasks**: 46

**Estimated Duration**: 6 weeks (per design timeline)

**Critical Path**: Group 1 -> Group 2 -> Group 3 -> Groups 4-10 (parallel) -> Group 11
