# Implementation Tasks - Phase 5: Admin Panel Core

This document contains the implementation tasks for the Admin Panel Core. Each task is designed to be executed incrementally in a test-driven manner, building upon previous tasks.

**References:**
- Requirements: `docs/specs/phase-5/requirements.md`
- Design: `docs/specs/phase-5/design.md`

---

## Group 1: Foundation & Auth (Week 1)

### 1. [ ] Create admin route group and base layout
- **Objective**: Set up the `/admin` route group with server-side layout
- **Files to create/modify**:
  - `src/app/(admin)/layout.tsx` - Root admin layout with auth verification
  - `src/app/(admin)/loading.tsx` - Admin loading skeleton
- **Requirements covered**: REQ-3.1, REQ-3.2, REQ-3.3
- **Acceptance criteria**:
  - Server component verifies session exists before rendering
  - Verifies user role is 'staff' or 'owner' from database
  - Redirects non-authenticated users to `/login` with return URL
  - Redirects non-admin users to `/dashboard` with error message
  - Background color #F8EEE5 applied to layout

### 1.1. [ ] Implement admin middleware for route protection
- **Objective**: Create Next.js middleware for auth and role verification on `/admin/*` routes
- **Files to create/modify**:
  - `src/middleware.ts` - Update middleware for admin route protection
  - `src/lib/admin/auth.ts` - Admin auth helper functions
- **Requirements covered**: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4, REQ-1.5, REQ-1.6, REQ-1.7, REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7
- **Acceptance criteria**:
  - Middleware verifies session before rendering admin pages
  - Missing/invalid session redirects to `/login` with return URL
  - Staff role granted access to operational features
  - Owner role granted access to all features including configuration
  - Customer role redirects to `/dashboard` with error
  - Role verified from database, not client storage
  - 403 returned for unauthorized API requests

### 1.2. [ ] Create AdminSidebar component for desktop navigation
- **Objective**: Build collapsible sidebar navigation for desktop
- **Files to create/modify**:
  - `src/components/admin/AdminSidebar.tsx` - Desktop sidebar with nav links
- **Requirements covered**: REQ-24.1, REQ-24.2, REQ-24.4, REQ-24.5, REQ-24.8, REQ-24.9, REQ-24.10
- **Acceptance criteria**:
  - Displays navigation links grouped by section: Overview (Dashboard), Operations (Appointments, Customers), Configuration (Services, Add-ons, Gallery)
  - Expanded by default showing icons and labels
  - Active route highlighted with accent background
  - Owner-only sections (Services, Add-ons) hidden from staff
  - Hover tooltip on collapsed nav items
  - Logout link at bottom of sidebar
  - Smooth collapse/expand animation

### 1.3. [ ] Create AdminMobileNav component for mobile navigation
- **Objective**: Build hamburger menu navigation for mobile
- **Files to create/modify**:
  - `src/components/admin/AdminMobileNav.tsx` - Mobile hamburger menu
- **Requirements covered**: REQ-24.3, REQ-24.6, REQ-24.7
- **Acceptance criteria**:
  - Collapsed by default showing hamburger icon
  - Toggle button opens drawer overlay
  - Same navigation structure as desktop sidebar
  - Smooth slide-in animation
  - Touch-friendly tap targets (min 44x44px)

### 1.4. [ ] Create admin Zustand store for state management
- **Objective**: Set up admin-specific state store
- **Files to create/modify**:
  - `src/stores/admin-store.ts` - Admin panel state store
- **Requirements covered**: REQ-3.1
- **Acceptance criteria**:
  - Sidebar collapse state persisted
  - Selected date range for appointments stored
  - Active filters stored
  - Toast notification queue managed

---

## Group 2: Dashboard (Week 2)

### 2. [ ] Create Dashboard page structure
- **Objective**: Build the dashboard page with widget layout
- **Files to create/modify**:
  - `src/app/(admin)/dashboard/page.tsx` - Dashboard page with grid layout
- **Requirements covered**: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5, REQ-3.6, REQ-3.7
- **Acceptance criteria**:
  - Server Component with parallel data fetching
  - 4-column grid on desktop, single column on mobile
  - Fetches data for today's date in America/Los_Angeles timezone
  - Error states with retry buttons for failed sections
  - Skeleton loading during data fetch

### 2.1. [ ] Create DashboardStats component with real-time updates
- **Objective**: Build four stat cards with animated counters
- **Files to create/modify**:
  - `src/components/admin/dashboard/DashboardStats.tsx` - Stat cards grid
  - `src/app/api/admin/dashboard/stats/route.ts` - Stats API endpoint
- **Requirements covered**: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6, REQ-4.7, REQ-4.8, REQ-4.9
- **Acceptance criteria**:
  - Today's Revenue: sum of completed payments for today
  - Pending Confirmations: count of pending appointments for today
  - Total Appointments: count excluding cancelled/no_show
  - Completed Appointments: count of completed for today
  - Number transition animation on real-time updates
  - '--' with error icon for failed calculations
  - Hover scale animation on cards
  - Currency formatted as USD with 2 decimals

### 2.2. [ ] Create TodayAppointments component
- **Objective**: Build chronological appointment list with status buttons
- **Files to create/modify**:
  - `src/components/admin/dashboard/TodayAppointments.tsx` - Appointments list widget
  - `src/app/api/admin/dashboard/appointments/route.ts` - Today's appointments endpoint
- **Requirements covered**: REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5, REQ-5.6, REQ-5.7, REQ-5.8, REQ-5.9, REQ-5.10, REQ-5.11
- **Acceptance criteria**:
  - Displays appointments sorted by time ascending
  - Shows time, customer name, pet name, service, status
  - Customer flag icons with color coding (red/yellow/green)
  - Context-aware action buttons (Confirm, Check In, Start, Complete)
  - Status update triggers customer notification
  - Empty state with illustration when no appointments
  - Fade-in animation for new real-time appointments
  - "View All" button when exceeding 10 items

### 2.3. [ ] Create ActivityFeed component
- **Objective**: Build recent activity feed from notifications_log
- **Files to create/modify**:
  - `src/components/admin/dashboard/ActivityFeed.tsx` - Activity feed widget
  - `src/app/api/admin/dashboard/activity/route.ts` - Activity feed endpoint
- **Requirements covered**: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5, REQ-6.6, REQ-6.7, REQ-6.8
- **Acceptance criteria**:
  - Displays 10 most recent activities
  - Shows icon, message, timestamp, related entity
  - Relative time for <5 min ("2 minutes ago"), formatted time otherwise
  - Type-specific icons: calendar, x-circle, alert-triangle, user-plus, dollar-sign
  - Click navigates to related detail page
  - "No recent activity" when empty
  - Slide-down animation for new real-time activities

### 2.4. [ ] Set up Supabase Realtime subscriptions for dashboard
- **Objective**: Implement real-time updates for dashboard widgets
- **Files to create/modify**:
  - `src/hooks/admin/use-dashboard-realtime.ts` - Dashboard realtime hook
- **Requirements covered**: REQ-30.1, REQ-30.2, REQ-30.3, REQ-30.4, REQ-30.7, REQ-30.8, REQ-30.9, REQ-30.10
- **Acceptance criteria**:
  - Subscribe to appointments table for today's date range
  - INSERT events add appointment to list and increment stats
  - UPDATE events update card and recalculate stats
  - DELETE/cancel events remove from list and decrement stats
  - Fallback to 30-second polling on subscription failure
  - Unsubscribe on component unmount
  - "Connection lost" banner on network disconnect

---

## Group 3: Appointments Management (Week 3)

### 3. [ ] Install and configure FullCalendar
- **Objective**: Set up FullCalendar React library with required plugins
- **Files to create/modify**:
  - `package.json` - Add FullCalendar dependencies
  - `src/components/admin/appointments/AppointmentCalendar.tsx` - Calendar component
- **Requirements covered**: REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.6, REQ-7.7, REQ-7.8, REQ-7.9, REQ-7.10, REQ-7.11, REQ-7.12
- **Acceptance criteria**:
  - Day view with 30-min slots from 9 AM - 5 PM
  - Week view with 7-day grid starting Monday
  - Month view with appointment counts per day
  - Appointment blocks show customer name, pet name, service
  - Click event opens detail modal
  - Status-based colors: gray/blue/yellow/green/dark-green/red
  - Previous/next navigation and date picker
  - Gray out times outside business hours
  - Horizontally stack overlapping appointments

### 3.1. [ ] Create AppointmentListView component
- **Objective**: Build searchable, filterable appointment table
- **Files to create/modify**:
  - `src/components/admin/appointments/AppointmentListView.tsx` - Table view
  - `src/app/api/admin/appointments/route.ts` - List appointments endpoint
- **Requirements covered**: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9, REQ-8.10, REQ-8.11, REQ-8.12
- **Acceptance criteria**:
  - Table columns: Date/Time, Customer, Pet, Service, Status, Actions
  - Search by customer name, pet name, email, phone
  - Debounce search input for 300ms
  - Filter by: Status, Date Range, Service Type (AND logic)
  - Date range presets: Today, Tomorrow, This Week, This Month, Custom
  - Custom range shows date picker
  - Pagination: 25 per page with controls
  - Row click opens detail modal
  - Sortable by Date/Time, Customer Name, Status
  - "No appointments found" with clear filters button

### 3.2. [ ] Create appointments page with view toggle
- **Objective**: Build appointments page with calendar/list toggle
- **Files to create/modify**:
  - `src/app/(admin)/appointments/page.tsx` - Appointments page
- **Requirements covered**: REQ-7.1, REQ-8.1
- **Acceptance criteria**:
  - Default to calendar view (day)
  - Toggle button to switch between calendar and list
  - Persist view preference in admin store
  - Real-time subscriptions for visible date range

### 3.3. [ ] Create AppointmentDetailModal component
- **Objective**: Build comprehensive appointment detail modal
- **Files to create/modify**:
  - `src/components/admin/appointments/AppointmentDetailModal.tsx` - Detail modal
  - `src/app/api/admin/appointments/[id]/route.ts` - Single appointment endpoint
- **Requirements covered**: REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5, REQ-9.6, REQ-9.7, REQ-9.8, REQ-9.9, REQ-9.10, REQ-9.11, REQ-9.12
- **Acceptance criteria**:
  - Displays customer info, pet info, service, add-ons, pricing, notes, status
  - Customer info with click-to-call phone
  - Pet photo, breed, age, weight if available
  - Customer flags prominently at top with descriptions
  - Itemized pricing: base service, add-ons, subtotal, tax, total
  - Context-aware action buttons (Confirm, Cancel, Check In, Start, Complete, No-Show)
  - Cancellation requires reason dropdown
  - No-show confirmation dialog with implications
  - Status change timeline with timestamps and admin user
  - Inline edit for date/time and special requests
  - Past appointments disable buttons except Complete/No-Show

### 3.4. [ ] Implement appointment status transitions
- **Objective**: Build status workflow with validation and notifications
- **Files to create/modify**:
  - `src/components/admin/appointments/StatusTransitionButton.tsx` - Status action buttons
  - `src/app/api/admin/appointments/[id]/status/route.ts` - Status update endpoint
  - `src/lib/admin/appointment-status.ts` - Transition validation logic
- **Requirements covered**: REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4, REQ-10.5, REQ-10.6, REQ-10.7, REQ-10.8, REQ-10.9, REQ-10.10
- **Acceptance criteria**:
  - Allowed transitions: pending→confirmed/cancelled/no_show, confirmed→checked_in/cancelled/no_show, checked_in→in_progress/cancelled/no_show, in_progress→completed/cancelled
  - completed, cancelled, no_show are terminal states
  - Server-side validation before database update
  - Error message for invalid transitions
  - Updated_at timestamp set on transition
  - Confirmation modal for transitions requiring user confirmation
  - No-show increments customer's no_show count

### 3.5. [ ] Implement appointment notification triggers
- **Objective**: Send notifications on status changes
- **Files to create/modify**:
  - `src/lib/admin/notifications.ts` - Notification trigger logic
- **Requirements covered**: REQ-11.1, REQ-11.2, REQ-11.3, REQ-11.4, REQ-11.5, REQ-11.6, REQ-11.7, REQ-11.8
- **Acceptance criteria**:
  - confirmed: Email confirmation with add-to-calendar link
  - cancelled: Email with cancellation reason
  - completed: Thank you email with review routing link
  - SMS sent if customer has SMS enabled
  - Failures logged to notifications_log without blocking status update
  - Templates populated with appointment data
  - "Send Notification" toggle to skip notification
  - Log warning if customer email invalid/missing

---

## Group 4: Customer Management (Week 4)

### 4. [ ] Create CustomerTable component
- **Objective**: Build searchable customer list with table
- **Files to create/modify**:
  - `src/app/(admin)/customers/page.tsx` - Customers page
  - `src/components/admin/customers/CustomerTable.tsx` - Customer table
  - `src/app/api/admin/customers/route.ts` - List customers endpoint
- **Requirements covered**: REQ-12.1, REQ-12.2, REQ-12.3, REQ-12.4, REQ-12.5, REQ-12.6, REQ-12.7, REQ-12.8, REQ-12.9, REQ-12.10
- **Acceptance criteria**:
  - Displays table with Name, Email, Phone, Pets (count), Appointments (count), Flags, Member Status
  - Search across name, email, phone, pet names
  - Highlight matching text in results
  - Row click navigates to `/admin/customers/[id]`
  - Flag icons in Flags column
  - Membership badge for active members
  - Pagination: 50 per page
  - "No customers found" with clear search button
  - Sortable by Name, Email, Appointments, Join Date

### 4.1. [ ] Create CustomerProfile page
- **Objective**: Build customer profile with all related data
- **Files to create/modify**:
  - `src/app/(admin)/customers/[id]/page.tsx` - Customer profile page
  - `src/components/admin/customers/CustomerProfile.tsx` - Profile display
  - `src/app/api/admin/customers/[id]/route.ts` - Customer detail endpoint
- **Requirements covered**: REQ-13.1, REQ-13.2, REQ-13.3, REQ-13.4, REQ-13.5, REQ-13.6, REQ-13.7, REQ-13.8, REQ-13.9, REQ-13.10, REQ-13.11
- **Acceptance criteria**:
  - Sections: Contact Info, Pets, Appointment History, Flags, Loyalty Points, Membership
  - Contact: name, email, phone, address, registration date
  - Pet cards with name, breed, age, weight, photo
  - Pet card click expands grooming notes and pet-specific history
  - Appointment history: date, service, status, total (chronological)
  - Appointment click opens detail modal
  - Flags with descriptions and date added
  - Loyalty: current points and recent transactions
  - Membership: tier, status, renewal date, benefits
  - Edit button enables inline editing of contact info
  - "No appointments yet" with "Book Appointment" button when empty

### 4.2. [ ] Create AppointmentHistoryList component
- **Objective**: Build filterable appointment history for customer profile
- **Files to create/modify**:
  - `src/components/admin/customers/AppointmentHistoryList.tsx` - History list component
- **Requirements covered**: REQ-14.1, REQ-14.2, REQ-14.3, REQ-14.4, REQ-14.5, REQ-14.6, REQ-14.7, REQ-14.8, REQ-14.9
- **Acceptance criteria**:
  - All appointments sorted by date descending (most recent first)
  - Cards show date, time, pet name, service, add-ons, status, total
  - Color-coded status badges
  - Filter by status: All, Completed, Cancelled, No-Show
  - Date range filter: Last 30 Days, Last 3 Months, Last Year, All Time
  - "No appointments found" when filters return empty
  - Report card thumbnail with click to expand
  - Click card opens appointment detail modal
  - Repeat customer metrics: Total Appointments, Total Spent, Favorite Service, Avg Visit Frequency

### 4.3. [ ] Create CustomerFlagBadge component
- **Objective**: Build color-coded flag badge component
- **Files to create/modify**:
  - `src/components/admin/customers/CustomerFlagBadge.tsx` - Flag badge
- **Requirements covered**: REQ-16.1, REQ-16.2, REQ-16.3, REQ-16.4, REQ-16.5, REQ-16.6, REQ-16.7, REQ-16.8, REQ-16.11
- **Acceptance criteria**:
  - Red background for warning flags (Aggressive Dog, Payment Issues)
  - Yellow background for notes (Special Needs, Grooming Notes)
  - Green background for VIP
  - Icon and flag type displayed
  - Up to 2 flags inline with "+N more" indicator
  - Tooltip with remaining flags on "+N more" hover
  - Aggressive Dog flag shown prominently on calendar and list view
  - Full descriptions shown in modals

### 4.4. [ ] Create CustomerFlagForm modal
- **Objective**: Build form for adding/editing customer flags
- **Files to create/modify**:
  - `src/components/admin/customers/CustomerFlagForm.tsx` - Flag form modal
  - `src/app/api/admin/customers/[id]/flags/route.ts` - POST flag endpoint
  - `src/app/api/admin/customers/[id]/flags/[flagId]/route.ts` - PATCH/DELETE flag endpoint
- **Requirements covered**: REQ-15.1, REQ-15.2, REQ-15.3, REQ-15.4, REQ-15.5, REQ-15.6, REQ-15.7, REQ-15.8, REQ-15.9, REQ-15.10
- **Acceptance criteria**:
  - Add Flag opens modal with type dropdown and description textarea
  - Flag types: Aggressive Dog, Payment Issues, VIP, Special Needs, Grooming Notes, Other
  - Aggressive Dog defaults to red color
  - VIP defaults to green color
  - Other requires custom description
  - Description limited to 500 characters with counter
  - Save inserts to customer_flags with customer_id, flag_type, description, color, created_at, created_by
  - Remove flag shows confirmation then soft-deletes (is_active=false)

---

## Group 5: Services & Add-ons (Week 5)

### 5. [ ] Create ServicesList component
- **Objective**: Build services list with active/inactive toggle and drag-drop reorder
- **Files to create/modify**:
  - `src/app/(admin)/services/page.tsx` - Services page
  - `src/components/admin/services/ServicesList.tsx` - Services list
  - `src/app/api/admin/services/route.ts` - GET/POST services endpoint
- **Requirements covered**: REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6, REQ-17.7, REQ-17.8, REQ-17.9, REQ-17.10
- **Acceptance criteria**:
  - Lists all services from services table
  - Shows name, description (truncated), duration, active status, actions
  - Service image thumbnail if available
  - Active/Inactive toggle updates is_active without reload
  - Inactive services show reduced opacity and "Inactive" badge
  - Edit button opens service form modal
  - Drag-drop reorder updates display_order
  - Empty state with "Add Your First Service" button
  - Size-based pricing displayed in 4-size grid

### 5.1. [ ] Create ServiceForm modal
- **Objective**: Build service create/edit form with size-based pricing
- **Files to create/modify**:
  - `src/components/admin/services/ServiceForm.tsx` - Service form modal
  - `src/components/admin/services/SizeBasedPricingInputs.tsx` - Price inputs component
  - `src/app/api/admin/services/[id]/route.ts` - GET/PATCH single service endpoint
- **Requirements covered**: REQ-18.1, REQ-18.2, REQ-18.3, REQ-18.4, REQ-18.5, REQ-18.6, REQ-18.7, REQ-18.8, REQ-18.9, REQ-18.10, REQ-18.11, REQ-18.12
- **Acceptance criteria**:
  - Fields: Name, Description, Duration (minutes), Image Upload, Size-Based Pricing, Active Status
  - Image upload validates type (JPEG, PNG, WebP) and size (max 5MB)
  - Image uploads to Supabase Storage `service-images` with UUID filename
  - Duration validates positive integer between 15-480 minutes
  - Four price inputs: Small (0-18 lbs), Medium (19-35 lbs), Large (36-65 lbs), X-Large (66+ lbs)
  - Price validates positive number with max 2 decimals
  - Inline error messages for validation failures
  - Create inserts to services + 4 service_prices rows
  - Update modifies services and service_prices rows
  - Image upload failure shows error, allows retry without losing form data
  - "Unsaved changes" dialog on close with changes
  - Success toast and list refresh on save

### 5.2. [ ] Create AddOnsList component
- **Objective**: Build add-ons list with active/inactive toggle
- **Files to create/modify**:
  - `src/app/(admin)/addons/page.tsx` - Add-ons page
  - `src/components/admin/addons/AddOnsList.tsx` - Add-ons list
  - `src/app/api/admin/addons/route.ts` - GET/POST add-ons endpoint
- **Requirements covered**: REQ-19.1, REQ-19.2, REQ-19.3, REQ-19.4, REQ-19.5, REQ-19.6, REQ-19.7, REQ-19.8, REQ-19.9, REQ-19.10
- **Acceptance criteria**:
  - Lists all add-ons from addons table
  - Shows name, description, price (USD formatted), active status, actions
  - Active/Inactive toggle updates is_active without reload
  - Inactive add-ons show reduced opacity and "Inactive" badge
  - Edit button opens add-on form modal
  - Drag-drop reorder updates display_order
  - Empty state with "Add Your First Add-on" button
  - Breed-based upsell indicator icon on applicable cards

### 5.3. [ ] Create AddOnForm modal
- **Objective**: Build add-on create/edit form with breed multi-select
- **Files to create/modify**:
  - `src/components/admin/addons/AddOnForm.tsx` - Add-on form modal
  - `src/app/api/admin/addons/[id]/route.ts` - GET/PATCH single add-on endpoint
- **Requirements covered**: REQ-20.1, REQ-20.2, REQ-20.3, REQ-20.4, REQ-20.5, REQ-20.6, REQ-20.7, REQ-20.8, REQ-20.9, REQ-20.10, REQ-20.11, REQ-20.12
- **Acceptance criteria**:
  - Fields: Name, Description, Price, Breed-Based Upsell (multi-select), Active Status
  - Price validates positive number with max 2 decimals
  - Description limited to 500 characters with counter
  - Searchable multi-select dropdown for breeds from breeds table
  - Selected breeds stored as array in breed_upsell JSONB column
  - Case-insensitive breed search
  - Inline error messages for validation failures
  - Create inserts to addons table
  - Update modifies addons row
  - "Unsaved changes" dialog on close with changes
  - Success toast and list refresh on save
  - Required field validation prevents submission

---

## Group 6: Gallery Management (Week 6)

### 6. [ ] Create GalleryGrid component
- **Objective**: Build gallery page with image grid and filters
- **Files to create/modify**:
  - `src/app/(admin)/gallery/page.tsx` - Gallery page
  - `src/components/admin/gallery/GalleryGrid.tsx` - Image grid
  - `src/app/api/admin/gallery/route.ts` - GET gallery images endpoint
- **Requirements covered**: REQ-21.1, REQ-21.2, REQ-21.9, REQ-21.10, REQ-21.11, REQ-21.12
- **Acceptance criteria**:
  - Displays grid of gallery images
  - Shows thumbnail, pet name, breed, caption (truncated), publish status
  - "Add Photos" button opens upload modal
  - Drag-drop reorder updates display_order
  - Image click opens edit modal
  - Filter options: All, Published, Unpublished
  - Empty state with "Upload Your First Photo" button

### 6.1. [ ] Create GalleryUploadModal component
- **Objective**: Build multi-file drag-drop upload modal
- **Files to create/modify**:
  - `src/components/admin/gallery/GalleryUploadModal.tsx` - Upload modal
  - `src/app/api/admin/gallery/upload/route.ts` - POST upload endpoint
- **Requirements covered**: REQ-21.3, REQ-21.4, REQ-21.5, REQ-21.6, REQ-21.7, REQ-21.8
- **Acceptance criteria**:
  - Drag-drop zone accepting multiple files
  - File type validation: JPEG, PNG, WebP
  - File size validation: max 10MB each
  - Visual border highlight on drag over
  - Upload to Supabase Storage `gallery-images` with UUID filenames
  - Insert rows to gallery_images table on completion
  - Success message on upload complete
  - Per-file error display for failed uploads, continue with successful

### 6.2. [ ] Create GalleryImageEditModal component
- **Objective**: Build image metadata edit form
- **Files to create/modify**:
  - `src/components/admin/gallery/GalleryImageEditModal.tsx` - Edit modal
  - `src/app/api/admin/gallery/[id]/route.ts` - GET/PATCH/DELETE image endpoint
- **Requirements covered**: REQ-22.1, REQ-22.2, REQ-22.3, REQ-22.4, REQ-22.5, REQ-22.6, REQ-22.7, REQ-22.8, REQ-22.9, REQ-22.10, REQ-22.11, REQ-22.12
- **Acceptance criteria**:
  - Displays full image with edit form
  - Fields: Pet Name, Breed (dropdown from breeds table), Caption, Tags (comma-separated), Published Status
  - Caption limited to 200 characters with counter
  - Tags parsed from comma-separated values, trimmed
  - Published toggle updates is_published
  - Save updates gallery_images row
  - Inline error messages for validation
  - Delete shows confirmation dialog with warning
  - Delete soft-deletes (sets deleted_at) and removes from Supabase Storage
  - "Unpublished" badge on thumbnail for unpublished images
  - Success toast on save

### 6.3. [ ] Create ReportCardAddToGallery button
- **Objective**: Enable adding report card photos to gallery
- **Files to create/modify**:
  - `src/components/admin/gallery/ReportCardAddToGallery.tsx` - Add to gallery button
- **Requirements covered**: REQ-23.1, REQ-23.2, REQ-23.3, REQ-23.4, REQ-23.5, REQ-23.6, REQ-23.7
- **Acceptance criteria**:
  - "Add to Gallery" button on report card photos
  - Copies image reference to gallery_images table
  - Pre-fills pet name and breed from appointment data
  - Auto-adds "before-after" tag for before/after photos
  - "Report Card" badge on gallery thumbnails sourced from report cards
  - Deleting gallery image does NOT delete original report card image
  - Link back to original appointment from report card-sourced images

---

## Group 7: Polish & Testing (Week 7)

### 7. [ ] Add loading skeletons for all admin pages
- **Objective**: Create skeleton loaders matching content layouts
- **Files to create/modify**:
  - `src/components/admin/skeletons/DashboardSkeleton.tsx`
  - `src/components/admin/skeletons/AppointmentSkeleton.tsx`
  - `src/components/admin/skeletons/CustomerTableSkeleton.tsx`
  - `src/components/admin/skeletons/GallerySkeleton.tsx`
- **Requirements covered**: REQ-25.1, REQ-25.2, REQ-25.3, REQ-25.4, REQ-25.5, REQ-25.6, REQ-25.7, REQ-25.8
- **Acceptance criteria**:
  - Skeleton layouts match expected content structure
  - Four stat card skeletons with pulse animation
  - Appointment card skeletons matching card dimensions
  - Table row skeletons matching column structure
  - Image skeletons with correct aspect ratios
  - Modal content skeletons matching modal layout
  - DaisyUI skeleton utilities for pulse effect
  - Smooth fade transition from skeleton to content

### 7.1. [ ] Add empty states for all lists
- **Objective**: Create helpful empty states with action buttons
- **Files to create/modify**:
  - Update all list/table components with EmptyState
- **Requirements covered**: REQ-26.1, REQ-26.2, REQ-26.3, REQ-26.4, REQ-26.5, REQ-26.6, REQ-26.7, REQ-26.8
- **Acceptance criteria**:
  - Empty lists show icon, message, action button
  - Appointments: calendar icon, "No appointments scheduled", "View Calendar"
  - Customers: users icon, "No customers yet"
  - Gallery: image icon, "No photos in gallery", "Upload Photos"
  - Search/filter empty: "No results found", "Clear Filters"
  - Activity feed: "No recent activity" (no action button)
  - Action buttons navigate or open modal for primary action
  - Appointment detail empty history: "No status changes yet"

### 7.2. [ ] Implement error handling and retry logic
- **Objective**: Add error states with retry functionality
- **Files to create/modify**:
  - `src/components/admin/ErrorState.tsx` - Error state component
  - Update all data-fetching components with error handling
- **Requirements covered**: REQ-27.1, REQ-27.2, REQ-27.3, REQ-27.4, REQ-27.5, REQ-27.6, REQ-27.7, REQ-27.8, REQ-27.9, REQ-27.10, REQ-27.11
- **Acceptance criteria**:
  - Data fetch failure shows error state with "Retry" button
  - Mutation failure shows toast with error message
  - Network error: "Network error. Please check your connection."
  - Auth error redirects to login with message
  - Validation error shows inline field messages
  - 403: "Insufficient permissions" message
  - 500: "Something went wrong. Please try again."
  - Retry button re-attempts failed operation
  - Successful retry clears error state
  - Critical errors logged to console
  - Image upload shows specific error (file too large, invalid format, network)

### 7.3. [ ] Implement confirmation modals for destructive actions
- **Objective**: Add confirmation dialogs before destructive operations
- **Files to create/modify**:
  - Update components with ConfirmationModal for destructive actions
- **Requirements covered**: REQ-28.1, REQ-28.2, REQ-28.3, REQ-28.4, REQ-28.5, REQ-28.6, REQ-28.7, REQ-28.8, REQ-28.9
- **Acceptance criteria**:
  - Cancel appointment: "Are you sure?" with reason selection required
  - Mark no-show: Warning about customer record impact
  - Delete service: Confirmation explaining soft-delete
  - Delete gallery image: Confirmation with image thumbnail
  - Two buttons: Cancel (secondary) and Confirm (primary, red for destructive)
  - Cancel closes modal without action
  - Confirm executes action and shows feedback
  - "Unsaved changes" dialog when closing forms with edits

### 7.4. [ ] Implement toast notifications system
- **Objective**: Add toast notifications for action feedback
- **Files to create/modify**:
  - Integrate toast system across admin components
- **Requirements covered**: REQ-29.1, REQ-29.2, REQ-29.3, REQ-29.4, REQ-29.5, REQ-29.6, REQ-29.7, REQ-29.8, REQ-29.9, REQ-29.10, REQ-29.11
- **Acceptance criteria**:
  - Appointment updated: "Appointment updated" success toast
  - Customer saved: "Customer profile saved" toast
  - Service created: "Service created successfully" toast
  - Add-on updated: "Add-on updated" toast
  - Image uploaded: "Photo uploaded" toast
  - Failure: Error toast with specific message
  - Position: top-right (desktop), bottom-center (mobile)
  - Multiple toasts stack vertically
  - Auto-dismiss: 5 seconds success, 8 seconds error
  - X button for immediate dismiss
  - Optional action button (Undo, View)

### 7.5. [ ] Accessibility audit and improvements
- **Objective**: Ensure WCAG 2.1 AA compliance
- **Files to create/modify**:
  - All admin components - Add accessibility attributes
- **Requirements covered**: REQ-32.1, REQ-32.2, REQ-32.3, REQ-32.4, REQ-32.5, REQ-32.6, REQ-32.7, REQ-32.8, REQ-32.9, REQ-32.10, REQ-32.11, REQ-32.12
- **Acceptance criteria**:
  - Full keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys)
  - Clear focus indicators with 3:1 minimum contrast
  - Modal focus trap with return to trigger on close
  - Skip links to main content, navigation, search
  - Descriptive alt text for all images
  - Status conveyed by color + icons/text
  - Form errors associated with inputs via aria-describedby
  - Loading states announced via aria-live
  - Semantic table markup with proper headers
  - aria-label for icon-only buttons
  - Text contrast: 4.5:1 normal, 3:1 large
  - 200% text zoom remains functional

### 7.6. [ ] Performance optimization
- **Objective**: Optimize for fast loading and smooth interactions
- **Files to create/modify**:
  - Various admin components - Add performance optimizations
- **Requirements covered**: REQ-33.1, REQ-33.2, REQ-33.3, REQ-33.4, REQ-33.5, REQ-33.6, REQ-33.7, REQ-33.8, REQ-33.9, REQ-33.10, REQ-34.1, REQ-34.2, REQ-34.3, REQ-34.4, REQ-34.5, REQ-34.6, REQ-34.7, REQ-34.8, REQ-34.9
- **Acceptance criteria**:
  - Dashboard FCP under 1.5 seconds
  - Lists >50 items use virtualization
  - Next.js Image component for all images
  - Database indexes on frequently queried columns
  - Prefetch linked pages on hover
  - useMemo for expensive computations
  - React.memo for pure components
  - Debounce search inputs and autosave
  - Admin bundle under 500KB compressed
  - Tree-shakeable imports for third-party libraries
  - Multiple image sizes generated (thumbnail, medium, full)
  - Lazy loading for images below fold
  - Priority loading for above-fold images
  - WebP format with JPEG fallback
  - Image compression to 85% quality
  - Placeholder with icon for failed image loads
  - Blur placeholder (LQIP) for smooth loading

### 7.7. [ ] Write unit tests for critical logic
- **Objective**: Test status transitions, flag colors, and utility functions
- **Files to create/modify**:
  - `src/lib/admin/__tests__/appointment-status.test.ts`
  - `src/lib/admin/__tests__/notifications.test.ts`
  - `src/components/admin/__tests__/CustomerFlagBadge.test.tsx`
- **Requirements covered**: REQ-10.6, REQ-10.7
- **Acceptance criteria**:
  - Status transition validation tests (valid and invalid transitions)
  - Flag color calculation tests
  - Activity feed icon mapping tests
  - Pricing calculation tests
  - Date/time formatting utility tests

### 7.8. [ ] Write E2E tests for key admin flows
- **Objective**: Test critical admin workflows end-to-end
- **Files to create/modify**:
  - `e2e/admin/dashboard.spec.ts`
  - `e2e/admin/appointments.spec.ts`
  - `e2e/admin/customers.spec.ts`
  - `e2e/admin/services.spec.ts`
- **Requirements covered**: REQ-1.1, REQ-10.1, REQ-15.1, REQ-17.1
- **Acceptance criteria**:
  - Login as staff → access dashboard → see today's appointments
  - Login as owner → create service → verify pricing displayed
  - Update appointment status → verify notification sent
  - Add customer flag → verify displayed on appointment card
  - Upload gallery image → verify in gallery grid

---

## Summary

| Group | Tasks | Description |
|-------|-------|-------------|
| 1 | 5 | Foundation & Auth |
| 2 | 5 | Dashboard |
| 3 | 6 | Appointments Management |
| 4 | 5 | Customer Management |
| 5 | 4 | Services & Add-ons |
| 6 | 4 | Gallery Management |
| 7 | 9 | Polish & Testing |

**Total Tasks**: 38

**Estimated Duration**: 7 weeks (per design timeline)

**Critical Path**: Group 1 → Group 2 → Groups 3-6 (parallel) → Group 7
