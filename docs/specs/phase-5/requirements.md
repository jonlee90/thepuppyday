# Phase 5 - Admin Panel Core Requirements

## Introduction

Phase 5 establishes the foundational admin panel for The Puppy Day, enabling staff and owners to manage the day-to-day operations of the grooming business. This phase builds upon the completed Customer Portal (Phase 4) and the Booking System (Phase 3) to provide a comprehensive management interface for business operations.

The admin panel provides role-based access control distinguishing between staff and owner roles, with owners having full access to all features and staff having access to operational features. The core functionality includes appointment management, customer relationship management, service configuration, and gallery management.

This phase focuses on the essential administrative features required to run the business efficiently:
- Real-time appointment calendar and status management
- Customer profile management with flagging system
- Service and add-on CRUD operations with pricing configuration
- Gallery management for marketing and report cards
- Dashboard with key metrics and alerts

The admin panel integrates seamlessly with existing systems including Supabase Auth for authentication, Supabase Realtime for live updates, and Supabase Storage for image management. All features follow the Clean & Elegant Professional design system established in previous phases.

## Requirements

### Requirement 1: Role-Based Authentication

**User Story:** As a staff member or owner, I want to log in with my credentials and access only the features appropriate to my role, so that the business maintains proper access control and security.

#### Acceptance Criteria

1. WHEN a user with role 'staff' or 'owner' successfully authenticates THEN the system SHALL redirect them to the admin dashboard at `/admin/dashboard`
2. WHEN a user with role 'customer' attempts to access any `/admin/*` route THEN the system SHALL redirect them to `/dashboard` with an error message
3. WHEN an unauthenticated user attempts to access any `/admin/*` route THEN the system SHALL redirect them to `/login` with a return URL parameter
4. IF a user's session expires while on an admin page THEN the system SHALL redirect them to login and preserve their intended destination
5. WHEN a staff member attempts to access owner-only features THEN the system SHALL display an "Insufficient Permissions" message
6. WHERE role data is stored in `users.role` column THEN the system SHALL verify role on both client and server side
7. WHEN role verification fails on the server THEN the system SHALL return a 403 Forbidden response

### Requirement 2: Admin Route Protection

**User Story:** As a business owner, I want all admin routes protected by authentication and role checks, so that unauthorized users cannot access sensitive business data.

#### Acceptance Criteria

1. WHERE admin routes use Next.js middleware THEN the system SHALL verify authentication before rendering any admin page
2. WHEN middleware detects missing or invalid session THEN the system SHALL redirect to login before executing page logic
3. IF a direct API call to `/api/admin/*` is made without valid session THEN the system SHALL return 401 Unauthorized
4. WHEN an API route requires owner role and user has staff role THEN the system SHALL return 403 Forbidden
5. WHERE RLS policies exist on database tables THEN the system SHALL enforce role-based access at the database level
6. WHEN a user manually changes their role in browser storage THEN the server SHALL reject requests based on database role value
7. IF session validation fails THEN the system SHALL clear client-side session data and redirect to login

### Requirement 3: Admin Dashboard Layout

**User Story:** As an admin, I want a central dashboard showing today's critical information at a glance, so that I can quickly understand the day's operations.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/dashboard` THEN the system SHALL display a grid layout with stats cards, appointment list, and activity feed
2. WHERE the viewport is desktop size THEN the system SHALL display stats in a 4-column grid
3. WHERE the viewport is mobile size THEN the system SHALL stack stats vertically in a single column
4. WHEN the dashboard loads THEN the system SHALL fetch data for today's date in the business timezone (America/Los_Angeles)
5. IF data fetching fails THEN the system SHALL display error states with retry buttons for each failed section
6. WHEN the user clicks retry on a failed section THEN the system SHALL re-attempt to fetch only that section's data
7. WHERE real-time updates are enabled THEN the system SHALL subscribe to relevant Supabase channels for live data updates

### Requirement 4: Dashboard Quick Stats

**User Story:** As an admin, I want to see key metrics for today at the top of the dashboard, so that I can quickly assess business performance.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display four stat cards: Today's Revenue, Pending Confirmations, Total Appointments, and Completed Appointments
2. WHERE Today's Revenue is calculated THEN the system SHALL sum all payments with status 'completed' and date matching today
3. WHERE Pending Confirmations is calculated THEN the system SHALL count appointments with status 'pending' and date matching today
4. WHERE Total Appointments is calculated THEN the system SHALL count all appointments with date matching today excluding status 'cancelled' and 'no_show'
5. WHERE Completed Appointments is calculated THEN the system SHALL count appointments with status 'completed' and date matching today
6. WHEN a stat value changes due to real-time update THEN the system SHALL animate the number transition
7. IF any stat calculation fails THEN the system SHALL display '--' with an error icon and tooltip
8. WHEN the user hovers over a stat card THEN the system SHALL display a subtle scale animation
9. WHERE currency is displayed THEN the system SHALL format as USD with two decimal places (e.g., $1,234.56)

### Requirement 5: Today's Appointments List

**User Story:** As an admin, I want to see a chronological list of today's appointments on the dashboard, so that I can track what's happening throughout the day.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display appointments for today sorted by appointment time ascending
2. WHERE each appointment card is displayed THEN the system SHALL show time, customer name, pet name, service type, and current status
3. WHEN an appointment has a customer flag THEN the system SHALL display a flag icon with color coding (red for warning flags, yellow for notes, green for VIP)
4. WHERE an appointment status is 'pending' THEN the system SHALL display a "Confirm" button on the card
5. WHERE an appointment status is 'confirmed' THEN the system SHALL display a "Check In" button on the card
6. WHERE an appointment status is 'checked_in' THEN the system SHALL display a "Start Service" button on the card
7. WHERE an appointment status is 'in_progress' THEN the system SHALL display a "Complete" button on the card
8. WHEN the user clicks any status transition button THEN the system SHALL update the appointment status and trigger customer notification
9. IF there are no appointments for today THEN the system SHALL display an empty state with illustration and message "No appointments scheduled for today"
10. WHEN a new appointment is created via real-time THEN the system SHALL insert it in chronological order with a fade-in animation
11. WHERE the appointment list exceeds 10 items THEN the system SHALL display a "View All" button linking to `/admin/appointments`

### Requirement 6: Activity Feed

**User Story:** As an admin, I want to see recent activity across the system, so that I can stay informed of important events and changes.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display the 10 most recent activities from the `notifications_log` table
2. WHERE activities are displayed THEN the system SHALL show icon, message, timestamp, and related entity (customer/appointment)
3. WHEN an activity is less than 5 minutes old THEN the system SHALL display relative time (e.g., "2 minutes ago")
4. WHEN an activity is more than 5 minutes old THEN the system SHALL display formatted time (e.g., "10:30 AM")
5. WHERE activity types include THEN the system SHALL use appropriate icons: appointment created (calendar), cancellation (x-circle), no-show (alert-triangle), customer registered (user-plus), payment received (dollar-sign)
6. WHEN the user clicks an activity item THEN the system SHALL navigate to the relevant detail page (appointment detail or customer profile)
7. IF there are no recent activities THEN the system SHALL display "No recent activity" message
8. WHEN new activity occurs via real-time THEN the system SHALL prepend it to the list with a slide-down animation and limit list to 10 items

### Requirement 7: Appointments Calendar View

**User Story:** As an admin, I want to view appointments in a calendar format with day/week/month views, so that I can visualize scheduling and availability.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/appointments` THEN the system SHALL default to calendar view with day view selected
2. WHERE view toggle buttons exist THEN the system SHALL provide three options: Day, Week, Month
3. WHEN the user selects Day view THEN the system SHALL display a time-slotted grid from 9:00 AM to 5:00 PM with 30-minute intervals
4. WHEN the user selects Week view THEN the system SHALL display a 7-day grid starting from Monday with appointments as blocks
5. WHEN the user selects Month view THEN the system SHALL display a traditional calendar grid with appointment counts per day
6. WHERE appointments are displayed as blocks THEN the system SHALL show customer name, pet name, and service type
7. WHEN an appointment block is clicked THEN the system SHALL open the appointment detail modal
8. WHERE appointment status colors are used THEN the system SHALL apply: gray (pending), blue (confirmed), yellow (checked_in), green (in_progress), dark-green (completed), red (cancelled/no_show)
9. WHEN the user navigates between dates THEN the system SHALL provide previous/next buttons and a date picker
10. IF no appointments exist for the selected date range THEN the system SHALL display "No appointments scheduled" message
11. WHERE business hours are configured THEN the system SHALL gray out times outside business hours
12. WHEN multiple appointments overlap in time THEN the system SHALL stack them horizontally with reduced width

### Requirement 8: Appointments List View

**User Story:** As an admin, I want to view appointments in a searchable, filterable list, so that I can quickly find specific appointments and analyze booking patterns.

#### Acceptance Criteria

1. WHEN the user toggles to List view THEN the system SHALL display appointments in a table format with columns: Date/Time, Customer, Pet, Service, Status, Actions
2. WHERE the search input exists THEN the user SHALL be able to search by customer name, pet name, email, or phone number
3. WHEN the user types in the search input THEN the system SHALL debounce input for 300ms before filtering results
4. WHERE filter dropdowns exist THEN the system SHALL provide filters for: Status, Date Range, Service Type
5. WHEN multiple filters are applied THEN the system SHALL combine filters with AND logic
6. WHERE the date range filter is used THEN the system SHALL default to "Today" with options: Today, Tomorrow, This Week, This Month, Custom Range
7. WHEN Custom Range is selected THEN the system SHALL display a date range picker
8. WHERE appointments are paginated THEN the system SHALL display 25 appointments per page with pagination controls
9. WHEN the user clicks a table row THEN the system SHALL open the appointment detail modal
10. WHERE the Actions column exists THEN the system SHALL display quick action buttons based on appointment status
11. WHEN no appointments match the current filters THEN the system SHALL display "No appointments found" with a clear filters button
12. WHERE table columns are sortable THEN the user SHALL be able to sort by Date/Time, Customer Name, or Status

### Requirement 9: Appointment Detail Modal

**User Story:** As an admin, I want to view complete appointment details in a modal, so that I can see all relevant information and take actions without leaving the current page.

#### Acceptance Criteria

1. WHEN an appointment is selected THEN the system SHALL open a modal displaying all appointment details
2. WHERE appointment details are shown THEN the system SHALL display: customer info, pet info, service details, add-ons, pricing breakdown, special requests, status, timestamps
3. WHERE customer info is displayed THEN the system SHALL show name, email, phone with click-to-call functionality
4. WHERE pet info is displayed THEN the system SHALL show pet name, breed, age, weight, photo if available
5. WHEN customer flags exist THEN the system SHALL display them prominently at the top of the modal with descriptions
6. WHERE pricing breakdown is shown THEN the system SHALL itemize base service, add-ons, subtotal, tax, total
7. WHEN the modal has action buttons THEN the system SHALL display buttons appropriate to current status (Confirm, Cancel, Check In, Start, Complete, Mark No-Show)
8. WHERE the appointment is cancellable THEN the system SHALL require a cancellation reason via dropdown (Customer Request, Business Closure, Emergency, Other)
9. WHEN the user marks appointment as no-show THEN the system SHALL display a confirmation dialog explaining implications
10. WHERE appointment history exists THEN the system SHALL display a timeline of status changes with timestamps and admin user who made the change
11. WHEN the user clicks Edit THEN the system SHALL enable inline editing of date/time and special requests
12. IF the appointment is in the past THEN the system SHALL disable status transition buttons except Complete and No-Show

### Requirement 10: Appointment Status Transitions

**User Story:** As an admin, I want to change appointment statuses through a workflow, so that I can track appointments from booking to completion.

#### Acceptance Criteria

1. WHERE appointment status is 'pending' THEN the system SHALL allow transition to: confirmed, cancelled, no_show
2. WHERE appointment status is 'confirmed' THEN the system SHALL allow transition to: checked_in, cancelled, no_show
3. WHERE appointment status is 'checked_in' THEN the system SHALL allow transition to: in_progress, cancelled, no_show
4. WHERE appointment status is 'in_progress' THEN the system SHALL allow transition to: completed, cancelled (with warning)
5. WHERE appointment status is 'completed' THEN the system SHALL NOT allow any status transitions
6. WHEN a status transition is initiated THEN the system SHALL validate the transition is allowed before making database update
7. IF an invalid transition is attempted THEN the system SHALL display an error message explaining the valid transitions
8. WHEN a status is successfully updated THEN the system SHALL update the `updated_at` timestamp
9. WHERE the transition requires user confirmation THEN the system SHALL display a confirmation modal before executing
10. WHEN the transition is cancelled to no_show THEN the system SHALL increment the customer's no_show count in their profile

### Requirement 11: Appointment Notification Triggers

**User Story:** As an admin, I want customers to automatically receive notifications when appointment status changes, so that they stay informed without manual communication.

#### Acceptance Criteria

1. WHEN appointment status changes to 'confirmed' THEN the system SHALL send a confirmation email with appointment details and add-to-calendar link
2. WHEN appointment status changes to 'cancelled' THEN the system SHALL send a cancellation email with reason if provided
3. WHEN appointment status changes to 'completed' THEN the system SHALL send a thank you email with link to review routing page
4. WHERE SMS notifications are enabled for customer THEN the system SHALL send SMS in addition to email for status changes
5. WHEN notification sending fails THEN the system SHALL log the failure to `notifications_log` table without blocking the status update
6. WHERE notification templates are used THEN the system SHALL populate placeholders with appointment data (customer name, pet name, date, time, service)
7. WHEN the user toggles "Send Notification" checkbox to off THEN the system SHALL update status without sending notification
8. IF customer email is invalid or missing THEN the system SHALL log a warning but complete the status update

### Requirement 12: Customer List View

**User Story:** As an admin, I want to view and search all customers, so that I can quickly find customer profiles and contact information.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/customers` THEN the system SHALL display a searchable table of all customers with role 'customer'
2. WHERE the search input exists THEN the system SHALL search across customer name, email, phone number, and pet names
3. WHEN search is executed THEN the system SHALL highlight matching text in results
4. WHERE table columns exist THEN the system SHALL display: Name, Email, Phone, Pets (count), Appointments (count), Flags, Member Status
5. WHEN the user clicks a customer row THEN the system SHALL navigate to `/admin/customers/[id]`
6. WHERE customer has active flags THEN the system SHALL display flag icons in the Flags column
7. WHERE customer has active membership THEN the system SHALL display a badge in Member Status column
8. WHEN customers are paginated THEN the system SHALL display 50 customers per page
9. IF no customers match search THEN the system SHALL display "No customers found" with a clear search button
10. WHERE table is sortable THEN the user SHALL be able to sort by Name, Email, Appointments (count), or Join Date

### Requirement 13: Customer Profile View

**User Story:** As an admin, I want to view a complete customer profile with all related data, so that I have full context when managing customer relationships.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/customers/[id]` THEN the system SHALL display customer profile with sections: Contact Info, Pets, Appointment History, Flags, Loyalty Points, Membership
2. WHERE Contact Info is displayed THEN the system SHALL show name, email, phone, address (if provided), registration date
3. WHERE Pets section is displayed THEN the system SHALL show cards for each pet with name, breed, age, weight, photo
4. WHEN the user clicks a pet card THEN the system SHALL expand to show grooming notes and appointment history specific to that pet
5. WHERE Appointment History is displayed THEN the system SHALL show a chronological list with date, service, status, total
6. WHEN the user clicks an appointment in history THEN the system SHALL open the appointment detail modal
7. WHERE Flags section exists THEN the system SHALL display active flags with descriptions and date added
8. WHERE Loyalty Points section exists THEN the system SHALL display current points balance and recent transactions
9. WHERE Membership section exists THEN the system SHALL display membership tier, status, renewal date, benefits
10. WHEN the user clicks Edit on Contact Info THEN the system SHALL enable inline editing of name, email, phone, address
11. IF customer has no appointment history THEN the system SHALL display "No appointments yet" with a "Book Appointment" button

### Requirement 14: Customer Appointment History

**User Story:** As an admin, I want to see a customer's complete appointment history, so that I can understand their booking patterns and service preferences.

#### Acceptance Criteria

1. WHERE appointment history is displayed THEN the system SHALL show all appointments sorted by date descending (most recent first)
2. WHEN appointment cards are rendered THEN the system SHALL show date, time, pet name, service, add-ons, status, total cost
3. WHERE appointment status is displayed THEN the system SHALL use color-coded badges matching the status color scheme
4. WHEN the user filters history by status THEN the system SHALL provide filter options: All, Completed, Cancelled, No-Show
5. WHERE the user filters by date range THEN the system SHALL provide preset ranges: Last 30 Days, Last 3 Months, Last Year, All Time
6. WHEN no appointments match filters THEN the system SHALL display "No appointments found" message
7. WHERE appointment includes report card THEN the system SHALL display a thumbnail preview with click to expand
8. WHEN the user clicks appointment card THEN the system SHALL open appointment detail modal
9. IF customer is a repeat customer THEN the system SHALL calculate and display metrics: Total Appointments, Total Spent, Favorite Service, Average Visit Frequency

### Requirement 15: Customer Flag System

**User Story:** As an admin, I want to add, edit, and remove flags on customer profiles, so that staff are aware of important information when interacting with customers.

#### Acceptance Criteria

1. WHERE flag management UI exists THEN the system SHALL provide buttons to Add Flag, Edit Flag, Remove Flag
2. WHEN the user clicks Add Flag THEN the system SHALL open a modal with flag type dropdown and description textarea
3. WHERE flag types are defined THEN the system SHALL provide options: Aggressive Dog, Payment Issues, VIP, Special Needs, Grooming Notes, Other
4. WHEN Aggressive Dog flag is selected THEN the system SHALL default the color to red (warning)
5. WHEN VIP flag is selected THEN the system SHALL default the color to green (positive)
6. WHEN Other flag is selected THEN the system SHALL require a custom description
7. WHERE flag description exists THEN the system SHALL limit to 500 characters with counter
8. WHEN flag is saved THEN the system SHALL insert row to `customer_flags` table with customer_id, flag_type, description, color, created_at, created_by (admin user id)
9. WHERE flags are displayed THEN the system SHALL show flag icon with color, flag type, and description
10. WHEN the user clicks Remove Flag THEN the system SHALL display confirmation dialog before soft-deleting flag (set active=false)
11. IF customer has Aggressive Dog flag THEN the system SHALL display prominent warning on all appointment cards and modals

### Requirement 16: Customer Flag Warnings

**User Story:** As an admin, I want to see customer flags prominently displayed on appointment cards, so that I am immediately aware of important customer information.

#### Acceptance Criteria

1. WHERE appointment cards display customer flags THEN the system SHALL show flags at the top of the card with icon and flag type
2. WHEN flag is red (warning) THEN the system SHALL display with red background and white text
3. WHEN flag is yellow (note) THEN the system SHALL display with yellow background and dark text
4. WHEN flag is green (VIP) THEN the system SHALL display with green background and white text
5. WHERE multiple flags exist THEN the system SHALL display up to 2 flags inline with "+N more" indicator
6. WHEN the user hovers over "+N more" THEN the system SHALL display tooltip with all remaining flags
7. IF customer has Aggressive Dog flag THEN the system SHALL display flag on both calendar blocks and list view rows
8. WHERE appointment detail modal is open THEN the system SHALL display all flags expanded with full descriptions at the top
9. WHEN staff views dashboard appointments list THEN the system SHALL ensure flags are visible without clicking

### Requirement 17: Service Management List

**User Story:** As an owner, I want to view and manage all services offered, so that I can keep the service catalog up to date.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/services` THEN the system SHALL display a list of all services from the `services` table
2. WHERE services are displayed THEN the system SHALL show service name, description (truncated), duration, active status, and action buttons
3. WHEN the user clicks Add Service THEN the system SHALL open a form modal for creating a new service
4. WHERE service cards are rendered THEN the system SHALL display the service image thumbnail if available
5. WHEN the user toggles Active/Inactive switch THEN the system SHALL update the `is_active` field without page reload
6. WHERE inactive services exist THEN the system SHALL display them with reduced opacity and "Inactive" badge
7. WHEN the user clicks Edit on a service THEN the system SHALL open the service form modal pre-filled with current values
8. WHERE services are sortable THEN the user SHALL be able to drag and drop to reorder services (updates `display_order` field)
9. IF no services exist THEN the system SHALL display empty state with "Add Your First Service" button
10. WHEN size-based pricing is displayed THEN the system SHALL show prices for all four sizes in a grid format

### Requirement 18: Service Form (Create/Edit)

**User Story:** As an owner, I want to create and edit services with size-based pricing, so that customers see accurate pricing in the booking widget.

#### Acceptance Criteria

1. WHERE service form modal exists THEN the system SHALL provide fields: Name, Description, Duration (minutes), Image Upload, Size-Based Pricing, Active Status
2. WHEN the user uploads an image THEN the system SHALL validate file type (JPEG, PNG, WebP) and size (max 5MB)
3. WHERE image upload succeeds THEN the system SHALL upload to Supabase Storage bucket `service-images` with UUID filename
4. WHEN the user enters duration THEN the system SHALL validate it is a positive integer between 15 and 480 minutes
5. WHERE size-based pricing inputs exist THEN the system SHALL provide four price inputs: Small (0-18 lbs), Medium (19-35 lbs), Large (36-65 lbs), X-Large (66+ lbs)
6. WHEN any price is entered THEN the system SHALL validate it is a positive number with max 2 decimal places
7. WHERE form validation fails THEN the system SHALL display inline error messages under invalid fields
8. WHEN the user saves a new service THEN the system SHALL insert to `services` table and insert four rows to `service_prices` table (one per size)
9. WHEN the user updates existing service THEN the system SHALL update `services` row and update corresponding `service_prices` rows
10. IF image upload fails THEN the system SHALL display error message and allow user to retry without losing form data
11. WHERE form has unsaved changes and user closes modal THEN the system SHALL display "Unsaved changes" confirmation dialog
12. WHEN form is successfully saved THEN the system SHALL close modal, refresh service list, and display success toast

### Requirement 19: Add-on Management List

**User Story:** As an owner, I want to view and manage all service add-ons, so that I can offer additional services to customers.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/addons` THEN the system SHALL display a list of all add-ons from the `addons` table
2. WHERE add-ons are displayed THEN the system SHALL show name, description, price, active status, and action buttons
3. WHEN the user clicks Add Add-on THEN the system SHALL open a form modal for creating a new add-on
4. WHERE add-on cards are rendered THEN the system SHALL display price formatted as USD
5. WHEN the user toggles Active/Inactive switch THEN the system SHALL update the `is_active` field without page reload
6. WHERE inactive add-ons exist THEN the system SHALL display them with reduced opacity and "Inactive" badge
7. WHEN the user clicks Edit on an add-on THEN the system SHALL open the add-on form modal pre-filled with current values
8. WHERE add-ons are sortable THEN the user SHALL be able to drag and drop to reorder (updates `display_order` field)
9. IF no add-ons exist THEN the system SHALL display empty state with "Add Your First Add-on" button
10. WHERE breed-based upsell is configured THEN the system SHALL display an indicator icon on the add-on card

### Requirement 20: Add-on Form (Create/Edit)

**User Story:** As an owner, I want to create and edit add-ons with breed-based upsell configuration, so that the booking widget suggests relevant add-ons.

#### Acceptance Criteria

1. WHERE add-on form modal exists THEN the system SHALL provide fields: Name, Description, Price, Breed-Based Upsell (multi-select), Active Status
2. WHEN the user enters price THEN the system SHALL validate it is a positive number with max 2 decimal places
3. WHERE description field exists THEN the system SHALL limit to 500 characters with counter
4. WHEN Breed-Based Upsell is configured THEN the system SHALL display a searchable multi-select dropdown of breeds from `breeds` table
5. WHERE breeds are selected THEN the system SHALL store as array in `breed_upsell` JSONB column
6. WHEN the user searches breeds THEN the system SHALL filter breeds by name with case-insensitive matching
7. WHERE form validation fails THEN the system SHALL display inline error messages under invalid fields
8. WHEN the user saves a new add-on THEN the system SHALL insert to `addons` table
9. WHEN the user updates existing add-on THEN the system SHALL update `addons` row
10. WHERE form has unsaved changes and user closes modal THEN the system SHALL display "Unsaved changes" confirmation dialog
11. WHEN form is successfully saved THEN the system SHALL close modal, refresh add-on list, and display success toast
12. IF required fields are missing THEN the system SHALL prevent form submission and highlight missing fields

### Requirement 21: Gallery Management View

**User Story:** As an admin, I want to manage the public gallery of grooming photos, so that we showcase our work on the marketing site.

#### Acceptance Criteria

1. WHEN the user navigates to `/admin/gallery` THEN the system SHALL display a grid of gallery images from the `gallery_images` table
2. WHERE images are displayed THEN the system SHALL show thumbnail, pet name, breed, caption (truncated), publish status
3. WHEN the user clicks Add Photos THEN the system SHALL open an upload modal with drag-drop zone
4. WHERE upload zone exists THEN the system SHALL accept multiple files (JPEG, PNG, WebP) up to 10MB each
5. WHEN the user drags files over drop zone THEN the system SHALL display visual feedback (border highlight)
6. WHERE images are uploaded THEN the system SHALL upload to Supabase Storage bucket `gallery-images` with UUID filenames
7. WHEN upload completes THEN the system SHALL insert rows to `gallery_images` table and display success message
8. IF upload fails for any image THEN the system SHALL display error for that specific file and continue with successful uploads
9. WHERE gallery images are sortable THEN the user SHALL be able to drag and drop to reorder (updates `display_order` field)
10. WHEN the user clicks an image THEN the system SHALL open the image detail/edit modal
11. WHERE images are filtered THEN the system SHALL provide filter options: All, Published, Unpublished
12. IF no images exist THEN the system SHALL display empty state with "Upload Your First Photo" button

### Requirement 22: Gallery Image Editing

**User Story:** As an admin, I want to edit gallery image metadata and control visibility, so that I can curate the public gallery effectively.

#### Acceptance Criteria

1. WHEN the user opens an image detail modal THEN the system SHALL display the full image with edit form
2. WHERE edit form exists THEN the system SHALL provide fields: Pet Name, Breed (dropdown), Caption, Tags (comma-separated), Published Status
3. WHEN the user enters caption THEN the system SHALL limit to 200 characters with counter
4. WHERE breed dropdown is rendered THEN the system SHALL populate with breeds from `breeds` table
5. WHEN tags are entered THEN the system SHALL parse comma-separated values and trim whitespace
6. WHERE published toggle exists THEN the system SHALL update `is_published` field on change
7. WHEN the user clicks Save THEN the system SHALL update the `gallery_images` row
8. WHERE form validation fails THEN the system SHALL display inline error messages
9. WHEN the user clicks Delete THEN the system SHALL display confirmation dialog with warning
10. IF user confirms deletion THEN the system SHALL soft-delete the image (set `deleted_at`) and remove from Supabase Storage
11. WHERE image is unpublished THEN the system SHALL display "Unpublished" badge on thumbnail
12. WHEN save succeeds THEN the system SHALL close modal, refresh gallery grid, and display success toast

### Requirement 23: Gallery Report Card Integration

**User Story:** As an admin, I want to easily add report card before/after photos to the gallery, so that I can showcase our transformations without duplicate uploads.

#### Acceptance Criteria

1. WHERE report card photos exist THEN the system SHALL display an "Add to Gallery" button on report card view
2. WHEN the user clicks "Add to Gallery" on a report card photo THEN the system SHALL copy the image reference to `gallery_images` table
3. WHERE report card photos are added THEN the system SHALL pre-fill pet name and breed from the appointment data
4. WHEN report card before/after photos are added THEN the system SHALL add tag "before-after" automatically
5. WHERE gallery image originated from report card THEN the system SHALL display a "Report Card" badge on the thumbnail
6. WHEN the user deletes a gallery image sourced from report card THEN the system SHALL NOT delete the original report card image
7. IF the user views a report card-sourced gallery image THEN the system SHALL provide a link back to the original appointment

### Requirement 24: Admin Navigation Sidebar

**User Story:** As an admin, I want a persistent navigation sidebar with clear sections, so that I can easily navigate between admin features.

#### Acceptance Criteria

1. WHERE admin layout is rendered THEN the system SHALL display a sidebar with navigation links
2. WHEN sidebar is rendered on desktop THEN the system SHALL be expanded by default showing icons and labels
3. WHEN sidebar is rendered on mobile THEN the system SHALL be collapsed by default showing only icons
4. WHERE navigation items exist THEN the system SHALL group into sections: Overview (Dashboard), Operations (Appointments, Customers), Configuration (Services, Add-ons, Gallery)
5. WHEN the current route matches a nav item THEN the system SHALL highlight that item with accent background color
6. WHERE the user is on mobile THEN the system SHALL provide a hamburger menu button to toggle sidebar
7. WHEN sidebar is toggled THEN the system SHALL animate the transition smoothly
8. WHERE owner-only sections exist THEN the system SHALL hide those nav items from staff users
9. WHEN the user hovers over a collapsed nav item THEN the system SHALL display a tooltip with the label
10. WHERE logout link exists THEN the system SHALL be positioned at bottom of sidebar

### Requirement 25: Loading States with Skeletons

**User Story:** As an admin, I want to see loading skeletons while data fetches, so that the interface feels responsive and I understand the page structure.

#### Acceptance Criteria

1. WHERE any data is being fetched THEN the system SHALL display skeleton loaders matching the layout of the content
2. WHEN dashboard stats are loading THEN the system SHALL display four stat card skeletons with pulsing animation
3. WHERE appointment lists are loading THEN the system SHALL display appointment card skeletons matching card dimensions
4. WHEN customer table is loading THEN the system SHALL display table row skeletons matching column structure
5. WHERE images are loading THEN the system SHALL display image skeleton with aspect ratio matching expected image
6. WHEN modal content is loading THEN the system SHALL display skeleton matching modal layout
7. WHERE skeleton animation is used THEN the system SHALL use subtle pulse effect following DaisyUI skeleton utilities
8. WHEN data loads successfully THEN the system SHALL smoothly transition from skeleton to content with fade effect

### Requirement 26: Empty States

**User Story:** As an admin, I want to see helpful empty states when no data exists, so that I understand what to do next.

#### Acceptance Criteria

1. WHERE a list or table has no data THEN the system SHALL display an empty state with icon, message, and action button
2. WHEN appointments list is empty THEN the system SHALL display calendar icon, "No appointments scheduled", and "View Calendar" button
3. WHERE customers list is empty THEN the system SHALL display users icon and "No customers yet" message
4. WHEN gallery is empty THEN the system SHALL display image icon, "No photos in gallery", and "Upload Photos" button
5. WHERE search/filter returns no results THEN the system SHALL display "No results found" with "Clear Filters" button
6. WHEN activity feed is empty THEN the system SHALL display "No recent activity" message without action button
7. WHERE empty state has action button THEN the system SHALL navigate or open modal for primary action
8. WHEN appointment detail shows no history THEN the system SHALL display "No status changes yet" message

### Requirement 27: Error Handling and Retry

**User Story:** As an admin, I want clear error messages and retry options when operations fail, so that I can recover from errors without refreshing the page.

#### Acceptance Criteria

1. WHEN a data fetch fails THEN the system SHALL display an error state with message and "Retry" button
2. WHERE mutation fails (create/update/delete) THEN the system SHALL display a toast notification with error message
3. WHEN network error occurs THEN the system SHALL display "Network error. Please check your connection." message
4. WHERE authentication error occurs THEN the system SHALL redirect to login with error message
5. IF validation error occurs THEN the system SHALL display inline error messages on form fields
6. WHEN 403 Forbidden is returned THEN the system SHALL display "Insufficient permissions" message
7. WHERE 500 server error occurs THEN the system SHALL display "Something went wrong. Please try again." message
8. WHEN the user clicks Retry THEN the system SHALL re-attempt the failed operation
9. IF retry succeeds THEN the system SHALL clear error state and display success feedback
10. WHERE error is critical THEN the system SHALL log error details to console for debugging
11. WHEN image upload fails THEN the system SHALL display specific error (file too large, invalid format, network error)

### Requirement 28: Confirmation Modals

**User Story:** As an admin, I want confirmation dialogs before destructive actions, so that I don't accidentally delete or cancel important data.

#### Acceptance Criteria

1. WHEN the user attempts to cancel an appointment THEN the system SHALL display confirmation modal with "Are you sure?" message
2. WHERE cancellation is confirmed THEN the system SHALL require selection of cancellation reason
3. WHEN the user attempts to mark appointment as no-show THEN the system SHALL display warning about implications (affects customer record)
4. WHERE the user attempts to delete a service THEN the system SHALL display confirmation explaining it will be soft-deleted
5. WHEN the user attempts to delete gallery image THEN the system SHALL display confirmation with image thumbnail
6. WHERE confirmation modal exists THEN the system SHALL provide two buttons: Cancel (secondary) and Confirm (primary, red for destructive)
7. WHEN the user clicks Cancel THEN the system SHALL close modal without action
8. WHERE the user clicks Confirm THEN the system SHALL execute the action and display feedback
9. IF the user has unsaved form changes and closes modal THEN the system SHALL display "You have unsaved changes. Discard?" confirmation

### Requirement 29: Toast Notifications

**User Story:** As an admin, I want toast notifications for action feedback, so that I know when operations succeed or fail.

#### Acceptance Criteria

1. WHEN an appointment status is updated successfully THEN the system SHALL display a success toast with message "Appointment updated"
2. WHERE a customer profile is saved THEN the system SHALL display "Customer profile saved" toast
3. WHEN a service is created THEN the system SHALL display "Service created successfully" toast
4. WHERE an add-on is updated THEN the system SHALL display "Add-on updated" toast
5. WHEN an image is uploaded to gallery THEN the system SHALL display "Photo uploaded" toast
6. IF an operation fails THEN the system SHALL display an error toast with specific error message
7. WHERE toast notifications appear THEN the system SHALL position at top-right on desktop, bottom-center on mobile
8. WHEN multiple toasts are triggered THEN the system SHALL stack them vertically with spacing
9. WHERE toast is displayed THEN the system SHALL auto-dismiss after 5 seconds for success, 8 seconds for error
10. WHEN the user clicks the X button on toast THEN the system SHALL immediately dismiss it
11. WHERE toast has action THEN the system SHALL optionally include an action button (e.g., "Undo", "View")

### Requirement 30: Real-Time Updates via Supabase Realtime

**User Story:** As an admin, I want the dashboard and appointment lists to update automatically when changes occur, so that I see the most current information without refreshing.

#### Acceptance Criteria

1. WHEN the admin dashboard is mounted THEN the system SHALL subscribe to the `appointments` table for INSERT, UPDATE, DELETE events for today's date
2. WHERE a new appointment is created THEN the system SHALL insert it into the dashboard appointments list and increment stats
3. WHEN an appointment status is updated by another admin THEN the system SHALL update the appointment card and stats in real-time
4. WHERE an appointment is deleted/cancelled THEN the system SHALL remove it from the list and decrement stats
5. WHEN the calendar view is active THEN the system SHALL subscribe to appointments for the visible date range
6. IF appointment is updated outside visible range THEN the system SHALL NOT trigger UI update
7. WHERE real-time subscription fails THEN the system SHALL fall back to polling every 30 seconds
8. WHEN the component unmounts THEN the system SHALL unsubscribe from all Realtime channels
9. WHERE multiple admins are viewing same appointment THEN both SHALL see updates simultaneously
10. WHEN network connection is lost THEN the system SHALL display "Connection lost" banner and attempt to reconnect

### Requirement 31: Advanced Search and Filtering

**User Story:** As an admin, I want powerful search and filtering across appointments and customers, so that I can quickly find relevant information.

#### Acceptance Criteria

1. WHERE search functionality exists THEN the system SHALL support fuzzy matching with typo tolerance
2. WHEN the user searches appointments THEN the system SHALL search across customer name, pet name, email, phone, and service name
3. WHERE the user applies multiple filters THEN the system SHALL update URL query parameters to allow bookmarking filtered views
4. WHEN the user shares a filtered URL THEN the system SHALL preserve and apply filters on page load
5. WHERE saved filter presets exist THEN the system SHALL allow admin to save common filter combinations
6. WHEN date range filter is applied THEN the system SHALL display appointment count for that range
7. WHERE filter chips are displayed THEN the system SHALL show active filters as removable chips above results
8. WHEN the user clicks "Clear All Filters" THEN the system SHALL reset all filters to default state
9. IF search returns no results THEN the system SHALL suggest similar terms or relaxing filters

### Requirement 32: Accessibility (WCAG 2.1 AA)

**User Story:** As an admin with accessibility needs, I want the admin panel to be fully keyboard navigable and screen-reader friendly, so that I can perform my job effectively.

#### Acceptance Criteria

1. WHERE interactive elements exist THEN the system SHALL be fully navigable using Tab, Shift+Tab, Enter, Space, and Arrow keys
2. WHEN focus moves between elements THEN the system SHALL display clear focus indicators with sufficient contrast ratio (3:1 minimum)
3. WHERE modals open THEN the system SHALL trap focus within the modal and return focus to trigger element on close
4. WHEN skip links are provided THEN the user SHALL be able to skip to main content, navigation, or search
5. WHERE images are displayed THEN the system SHALL provide descriptive alt text
6. WHEN status is conveyed by color THEN the system SHALL also use icons or text labels
7. WHERE form errors exist THEN the system SHALL associate error messages with inputs using aria-describedby
8. WHEN loading states occur THEN the system SHALL announce loading status to screen readers using aria-live
9. WHERE data tables exist THEN the system SHALL use semantic table markup with proper headers
10. WHEN interactive elements have labels THEN the system SHALL use aria-label or aria-labelledby where visual labels aren't present
11. WHERE color contrast is used THEN text SHALL meet 4.5:1 ratio for normal text, 3:1 for large text
12. WHEN the user increases text size to 200% THEN the system SHALL remain functional without horizontal scrolling

### Requirement 33: Performance Optimization

**User Story:** As an admin, I want the admin panel to load quickly and respond smoothly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN the dashboard initially loads THEN the system SHALL achieve First Contentful Paint (FCP) under 1.5 seconds
2. WHERE large data sets are rendered THEN the system SHALL implement virtualization for lists exceeding 50 items
3. WHEN images are displayed THEN the system SHALL use Next.js Image component with automatic optimization
4. WHERE data is fetched from Supabase THEN the system SHALL use appropriate indexes on frequently queried columns
5. WHEN the user navigates between admin pages THEN the system SHALL prefetch linked pages on hover
6. WHERE expensive computations occur THEN the system SHALL memoize results using React.useMemo
7. WHEN components re-render THEN the system SHALL use React.memo for pure components to prevent unnecessary renders
8. WHERE form inputs update frequently THEN the system SHALL debounce search inputs and autosave operations
9. WHEN the bundle size is analyzed THEN the system SHALL keep admin bundle under 500KB compressed
10. WHERE third-party libraries are used THEN the system SHALL prefer tree-shakeable imports

### Requirement 34: Image Optimization

**User Story:** As an admin, I want images to load quickly throughout the admin panel, so that the interface feels fast and responsive.

#### Acceptance Criteria

1. WHERE images are uploaded THEN the system SHALL generate multiple sizes (thumbnail, medium, full) using Supabase Image Transformation
2. WHEN thumbnails are displayed in lists THEN the system SHALL use the smallest appropriate size (e.g., 150x150 for thumbnails)
3. WHERE images are displayed THEN the system SHALL use Next.js Image component with lazy loading enabled
4. WHEN images are above the fold THEN the system SHALL set priority loading to prevent layout shift
5. WHERE image format is flexible THEN the system SHALL serve WebP format with JPEG fallback
6. WHEN large images are uploaded THEN the system SHALL compress to target quality 85% to balance quality and file size
7. WHERE image dimensions are unknown THEN the system SHALL specify aspect ratio to prevent layout shift during load
8. WHEN images fail to load THEN the system SHALL display a placeholder with icon
9. WHERE blur placeholder is used THEN the system SHALL generate low-quality image placeholder (LQIP) for smooth loading effect

---

## Summary

This requirements document defines 34 core requirements for the Phase 5 Admin Panel, organized into the following categories:

- **Authentication & Access Control** (Requirements 1-2): Role-based authentication for staff and owner users
- **Dashboard** (Requirements 3-6): Real-time overview with stats, appointments, and activity feed
- **Appointments Management** (Requirements 7-11): Calendar, list, detail views with status workflow and notifications
- **Customer Management** (Requirements 12-16): Customer profiles, appointment history, and flagging system
- **Services & Add-ons CRUD** (Requirements 17-20): Full management of service catalog with pricing
- **Gallery Management** (Requirements 21-23): Photo upload, editing, and report card integration
- **UX & Technical** (Requirements 24-34): Navigation, loading states, error handling, accessibility, performance

All requirements follow the EARS (Easy Approach to Requirements Syntax) format with clear acceptance criteria. The implementation of these requirements will be detailed in the Phase 5 Design Document.
