# Appointment System Audit Report

**Audit Date:** 2026-02-21
**Scope:** Complete appointment booking, management, calendar sync, and import systems

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Booking Flow (All 3 Modes)](#2-booking-flow-all-3-modes)
3. [API Route Reference](#3-api-route-reference)
4. [Admin Management UI](#4-admin-management-ui)
5. [Status State Machine](#5-status-state-machine)
6. [Waitlist System](#6-waitlist-system)
7. [Report Cards](#7-report-cards)
8. [Customer Portal](#8-customer-portal)
9. [Google Calendar Integration](#9-google-calendar-integration)
10. [CSV Import](#10-csv-import)
11. [Dashboard](#11-dashboard)
12. [Known Issues & Technical Debt](#12-known-issues--technical-debt)

---

## 1. System Architecture Overview

### Entry Points

The appointment system has three distinct entry points, each using the same `BookingModal` component with different mode configurations:

| Mode | Entry Point | Location | Trigger |
|------|-------------|----------|---------|
| `customer` | `StickyBookingButton` | Marketing page (after 600px scroll) | Customer click |
| `admin` | "Create Appointment" button | `/admin/appointments` | Admin click |
| `walkin` | Walk-in FAB/button | `/admin/dashboard` | Admin click |

### State Management

**Booking Store** (`src/stores/bookingStore.ts`) - Zustand + sessionStorage persistence:

```typescript
interface BookingState {
  currentStep: number;           // 0-5
  selectedServiceId: string | null;
  selectedService: ServiceWithPrices | null;
  selectedPetId: string | null;
  selectedPet: Pet | null;
  newPetData: CreatePetInput | null;
  petSize: PetSize | null;
  selectedDate: string | null;    // YYYY-MM-DD
  selectedTimeSlot: string | null; // HH:MM
  selectedAddonIds: string[];
  selectedAddons: Addon[];
  guestInfo: GuestInfo | null;
  selectedCustomerId: string | null;
  selectedGroomerId: string | null;
  servicePrice: number;
  addonsTotal: number;
  totalPrice: number;
  lastActivityTimestamp: number;
  bookingId: string | null;
  bookingReference: string | null;
}
```

- **Session timeout:** 30 minutes
- **Persistence:** sessionStorage only (cleared on tab close)
- **Hydration:** Auto-clears if expired on rehydrate
- **Price recalculation:** Triggered on every price-affecting state change

**Modal Store** (`src/hooks/useBookingModal.ts`) - Zustand:

```typescript
interface ModalState {
  isOpen: boolean;
  mode: 'customer' | 'admin' | 'walkin';
  preSelectedServiceId: string | null;
  preSelectedCustomerId: string | null;
  onSuccessCallback: ((id: string) => void) | null;
  canClose: boolean;
}
```

### Component Hierarchy

```
BookingModal (portal + responsive layout)
  BookingModalHeader (step title, close button, walk-in badge)
  BookingModalProgress (progress dots)
  BookingWizard (step router + AnimatePresence)
    ServiceStep
    DateTimeStep
      CalendarPicker
      TimeSlotGrid
      WaitlistModal
    CustomerStep (mode-aware: login/register vs search/create)
    PetStep
      PetCard / AddPetCard
      PetForm
    ReviewStep (or WalkinReviewStep for walk-in)
      AddonCard (multiple)
      GroomerSelect (admin only)
      GuestInfoForm
    ConfirmationStep
  PriceSummary (sidebar on tablet+, fixed bottom on mobile)
  BookingModalFooter (continue/back buttons)
```

### Key Libraries

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/booking/availability.ts` | Time slot generation, conflict checking, business hours | ~300 |
| `src/lib/booking/pricing.ts` | Price calculation, tax (9.75%), size-weight mapping | ~225 |
| `src/lib/booking/validation.ts` | Zod schemas for guest info, pet form, appointment | ~156 |
| `src/lib/booking/step-validation.ts` | Per-step, per-mode validation logic | ~197 |
| `src/lib/booking/submit.ts` | Submission routing by mode | ~200 |

---

## 2. Booking Flow (All 3 Modes)

### Step Order by Mode

| Step | Customer | Admin | Walk-in |
|------|----------|-------|---------|
| 0 | Service | Service | Service |
| 1 | Date & Time | Date & Time | Customer (search/create) |
| 2 | Customer (login/register) | Customer (search/create) | Pet |
| 3 | Pet | Pet | Review + Add-ons |
| 4 | Review + Add-ons | Review + Add-ons | Confirmation |
| 5 | Confirmation | Confirmation | -- |

### Mode Behavior Matrix

| Feature | Customer | Admin | Walk-in |
|---------|----------|-------|---------|
| DateTime selection | Required, future only | Required, allows past | Auto-set to NOW |
| Customer entry | Login/Register form | Search + inline create | Search + inline create |
| Email required | Yes | Yes | No (phone only) |
| Pet selection | From user's pets | From selected customer | From selected customer |
| Availability check | Enforced | Bypassed | Bypassed |
| Groomer selection | Not shown | Optional in Review | Not shown |
| Notifications | Auto-send | Optional | None |
| API endpoint | `POST /api/appointments` | `POST /api/admin/appointments` | `POST /api/admin/appointments` |
| Source tag | (none) | `admin` | `walk_in` |
| Post-book action | Show confirmation step | Show confirmation step | Close modal + toast |

### ServiceStep (`src/components/booking/steps/ServiceStep.tsx`)

- Fetches services via `useServices()` hook
- Filters out "Add-Ons" category (handled in ReviewStep)
- 2-column grid display with skeleton loading
- Shows price range for all sizes per service
- Pre-selects service if `preSelectedServiceId` provided

### DateTimeStep (`src/components/booking/steps/DateTimeStep.tsx`)

- Calendar picker (left) + time slot grid (right), responsive
- Uses `useAvailability()` hook per selected date
- 60-minute interval time slots
- Disabled dates: past, closed days, blocked dates from settings
- Booking window restrictions via settings (min/max days ahead)
- Waitlist modal integration for unavailable slots
- Clears time selection when date changes

### CustomerStep (`src/components/booking/steps/CustomerStep.tsx`, ~710 lines)

**Customer mode:**
- Login/register toggle form
- Auto-authenticates if already logged in
- Shows confirmation when authenticated

**Admin/Walk-in mode:**
- Search box (debounced, min 2 chars) for existing customers
- Radio selection of search results
- Inline "Create New Customer" form always visible
- Walk-in: email optional, only phone required
- Phone masking via `usePhoneMask()` hook
- Email duplicate check
- Auto-advance after customer creation

### PetStep (`src/components/booking/steps/PetStep.tsx`)

- Shows existing pets for logged-in/selected customers
- Shows pet form for: guests, new customers, or "add new pet"
- `effectiveOwnerId` logic determines whose pets to fetch
- Pet selection updates store with size calculation for pricing
- New pet: "will be created on booking confirmation" banner

### ReviewStep (`src/components/booking/steps/ReviewStep.tsx`, ~482 lines)

- Single-card summary: Service, DateTime, Pet, Pricing
- Edit buttons jump back to earlier steps
- **Add-ons selection** integrated here (not separate step):
  - Upsell add-ons matched by pet breed
  - Regular add-ons
  - Toggle selection with instant price updates
- Groomer selection (admin mode only)
- Guest info form (unauthenticated only)
- Tax: 9.75% California sales tax
- Submit triggers `createAdminBooking()` or `createBooking()`

### WalkinReviewStep (`src/components/booking/steps/WalkinReviewStep.tsx`, ~369 lines)

- Combined add-ons + review in one step
- Auto-sets appointment time to NOW (local time, NOT UTC)
- Calls `POST /api/admin/appointments` with `source: 'walk_in'`
- No notifications sent

### ConfirmationStep (`src/components/booking/steps/ConfirmationStep.tsx`)

- Success animation (spring scaling)
- Confirmation number display
- Google Calendar "Add" link
- Action buttons: Add to Calendar, View Appointments / Create Account, Back to Home

### Submission Logic (`src/lib/booking/submit.ts`)

Routes by mode:

**Customer** -> `POST /api/appointments`:
```json
{
  "service_id": "uuid",
  "scheduled_at": "ISO datetime",
  "duration_minutes": 60,
  "total_price": 50.00,
  "addon_ids": [],
  "customer_id": "uuid (if existing)",
  "pet_id": "uuid (if existing)",
  "guest_info": { "firstName", "lastName", "email", "phone" },
  "new_pet": { "name", "breed_id", "size", "weight" }
}
```

**Admin** -> `POST /api/admin/appointments`:
```json
{
  "customer": { "isNew": true, "first_name", "last_name", "email", "phone" },
  "pet": { "isNew": true, "name", "breed_id", "size", "weight" },
  "service_id": "uuid",
  "groomer_id": "uuid",
  "addon_ids": [],
  "appointment_date": "YYYY-MM-DD",
  "appointment_time": "HH:MM",
  "notes": "",
  "payment_status": "pending",
  "send_notification": true,
  "source": "admin"
}
```

**Walk-in** -> `POST /api/admin/appointments` (same endpoint, different payload):
- `send_notification: false`
- `source: 'walk_in'`
- Appointment time = NOW (local time)
- Email optional

### Date/Time Handling (CRITICAL)

- **Always uses LOCAL time**, never UTC via `toISOString()`
- Walk-in: Date formatted as `YYYY-MM-DD` from local date components
- Time formatted as `HH:MM` from local hours/minutes
- Business operates in America/Los_Angeles timezone
- See `BookingModal.tsx` lines 97-111 for walk-in NOW calculation

---

## 3. API Route Reference

### Customer-Facing Endpoints

#### `POST /api/appointments`
- **Auth:** None required (guest bookings allowed); uses `createServiceRoleClient()`
- **Purpose:** Create customer/guest booking
- **Key logic:**
  1. Guest user creation (if `guest_info` provided; email case-insensitive check)
  2. New pet creation (if `new_pet` provided)
  3. Slot conflict check
  4. Booking reference generation (`APT-YYYY-NNNNNN` with crypto random)
  5. Addon insertion to `appointment_addons`
  6. `triggerBookingConfirmation()` (non-blocking)
- **Response (201):** `{ success, appointment_id, reference, scheduled_at }`
- **Errors:** 400 (validation), 409 (SLOT_CONFLICT), 500

#### `DELETE /api/customer/appointments/[id]`
- **Auth:** Authenticated user; ownership verified (`customer_id == user.id`)
- **Purpose:** Customer cancellation
- **Key logic:**
  1. Ownership verification
  2. Cancellation policy check (`booking_settings.cancellation_cutoff_hours`)
  3. Status check: only `pending` or `confirmed` cancellable
  4. Sets status to `cancelled`, records `cancelled_at`
- **TODO:** Cancellation confirmation email not implemented (line 97)

#### `POST /api/waitlist`
- **Auth:** Authenticated user
- **Purpose:** Join waitlist for a date
- **Body:** `{ customer_id, pet_id, service_id, requested_date, time_preference }`
- **Response:** `{ success, waitlist_id, position }`
- **Errors:** 409 (DUPLICATE_ENTRY)

#### `GET /api/report-cards/[uuid]`
- **Auth:** None (public shareable link)
- **Purpose:** View report card
- **Key logic:** Checks `is_draft=false`, expiration, increments view count
- **Errors:** 404, 410 (expired)

### Admin Appointment Endpoints

#### `GET /api/admin/appointments`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Query params:** `status`, `service_id`, `groomer_id`, `dateFrom`, `dateTo`, `search`, `sort_by`, `sort_order`, `page`, `limit`
- **Response:** `{ data: [...], pagination: { total, page, limit, totalPages } }`
- **Note:** Full-text search via SQL string interpolation (injection risk noted)

#### `POST /api/admin/appointments`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Purpose:** Create appointment (admin or walk-in)
- **Key logic:**
  1. Customer creation (if `isNew`) with `inactive` status
  2. Pet creation (if `isNew`)
  3. Slot conflict check (excludes cancelled/no_show)
  4. Booking reference generation
  5. Addon insertion
  6. Calendar sync trigger (background)
  7. Notification trigger (if `send_notification`)
- **Response (201):** `{ success, appointment_id, booking_reference, customer_created, pet_created }`

#### `GET /api/admin/appointments/[id]`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Response:** Enriched appointment with customer, pet, service, groomer, addons, customer_flags, report_card

#### `PUT /api/admin/appointments/[id]`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Purpose:** Update appointment details (reschedule, reassign groomer, update notes, change service/addons)
- **Key logic:**
  1. Validates appointment exists
  2. Conflict check if datetime changed
  3. Addon sync (delete old, insert new)
  4. Calendar sync trigger if datetime/status changed
- **Response:** `{ data, message }`

#### `POST /api/admin/appointments/[id]/status`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Body:** `{ status, sendNotification, sendEmail, sendSms, cancellationReason? }`
- **Key logic:**
  1. Validates transition allowed via state machine
  2. Updates status + related fields (`cancelled_at`, `completed_at`)
  3. Calendar sync trigger (background)
  4. Notification trigger (if requested)
- **Response:** `{ data, message }`

#### `GET /api/admin/appointments/availability`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Query:** `date` (YYYY-MM-DD), `duration`, `service_id`
- **Response:** `{ date, is_closed, business_hours, time_slots: [{ time, available, booked_count, max_concurrent }] }`
- **Issues:** max_concurrent hardcoded to 3; buffer time calculation doesn't match other conflict logic

#### `POST /api/admin/appointments/complete-past`
- **Auth:** Direct role check (NOT using `requireAdmin()` - inconsistent)
- **Purpose:** Bulk-mark past appointments as completed
- **Issues:** No calendar sync trigger; no notifications

#### `GET /api/admin/appointments/sync-status`
- **Auth:** `requireAdmin()`
- **Query:** `ids` (comma-separated UUIDs)
- **Response:** `{ syncStatus: { [id]: { status, lastSyncedAt?, error?, googleEventId? } } }`

### CSV Import Endpoints

#### `POST /api/admin/appointments/import`
- **Auth:** `requireAdmin()` + `createServiceRoleClient()`
- **Body:** multipart/form-data with `file` (CSV), `duplicate_strategy`, `send_notifications`
- **Config:** `maxDuration = 300` (5 minutes)
- **Response:** `{ success, result: { total_processed, successful, failed, duplicates } }`

#### `POST /api/admin/appointments/import/validate`
- **Auth:** `requireAdmin()`
- **Body:** multipart/form-data with `file`
- **Response:** `{ valid, total_rows, valid_rows, invalid_rows, duplicates_found, preview, errors, duplicates }`

#### `GET /api/admin/appointments/import/template`
- **Auth:** `requireAdmin()`
- **Response:** CSV file download with headers + 3 example rows

### Waitlist Endpoints

#### `GET /api/admin/waitlist`
- **Auth:** `requireAdmin()`
- **Query:** `status`, `service_id`, `start_date`, `end_date`, `search`, `sort_by`, `sort_order`, `page`, `limit`
- **Issues:** Search is client-side (inefficient); priority sorting maps to created_at

#### `POST /api/admin/waitlist/[id]/book`
- **Auth:** `createServerSupabaseClient()` (no explicit admin check)
- **Body:** `{ scheduled_at, discount_percentage, notes? }`
- **Key logic:** Price calculation with discount, slot conflict check, creates appointment with `scheduled` status
- **Issues:** Uses `.single()` for service pricing (fails if multiple size prices)

#### `POST /api/admin/waitlist/fill-slot`
- **Auth:** `requireAdmin()`
- **Body:** `{ service_id, appointment_date, appointment_time, waitlist_entry_ids, discount_percentage, response_window_hours }`
- **Purpose:** Notify waitlisted customers of available slot
- **Response:** `{ success, offer_id, notifications_sent, notifications_failed, expires_at }`

#### `POST /api/admin/waitlist/match`
- **Auth:** `requireAdmin()`
- **Body:** `{ service_id, appointment_date, appointment_time, limit? }`
- **Response:** `{ matches, total }`

### Report Card Endpoints

#### `GET/POST /api/admin/report-cards`
- **Auth:** Checks auth only (no admin role check - security concern)
- **GET:** Fetch by `appointment_id` query param
- **POST:** Create/update with `formState` + `isDraft` flag
- **Uses:** `createServiceRoleClient()` for data operations

#### `POST /api/admin/report-cards/[id]/send`
- **Auth:** `requireAdmin()`
- **Body:** `{ action: 'send' | 'resend' }`
- **Validates:** Not draft, not dont_send, correct send state

#### `POST /api/admin/report-cards/upload`
- **Auth:** Checks auth only (no admin role check)
- **Body:** multipart/form-data with `file` (JPEG, PNG, WebP)
- **Response:** `{ success, url, path }`
- **Issues:** No file size limit; no admin role check

### Dashboard Endpoints

#### `GET /api/admin/dashboard/appointments`
- **Auth:** `requireAdmin()`
- **Response:** Today's appointments (excludes cancelled/no_show), sorted by time

#### `GET /api/admin/dashboard/pending-appointments`
- **Auth:** `requireAdmin()`
- **Response:** All pending appointments (no date filter)

#### `GET /api/admin/dashboard/stats`
- **Auth:** `requireAdmin()`
- **Response:** `{ completedRevenue, pendingRevenue }` for today

#### `GET /api/admin/dashboard/activity`
- **Auth:** `requireAdmin()`
- **Response:** 10 most recent notifications from `notifications_log`

### Calendar Integration Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/calendar/auth/start` | POST | Generate OAuth URL |
| `/api/admin/calendar/auth/callback` | GET | OAuth callback handler |
| `/api/admin/calendar/connection` | GET | Connection status + sync stats |
| `/api/admin/calendar/sync/status` | GET | Detailed sync health + stats |
| `/api/admin/calendar/sync/manual` | POST | Sync single appointment |
| `/api/admin/calendar/sync/bulk` | POST | Bulk sync date range |
| `/api/admin/calendar/sync/retry` | POST | Retry failed syncs |
| `/api/admin/calendar/import/preview` | POST | Preview calendar import |
| `/api/admin/calendar/import/confirm` | POST | Execute calendar import |
| `/api/admin/calendar/webhook` | POST | Google webhook receiver |
| `/api/admin/calendar/calendars` | GET | List available calendars |
| `/api/admin/calendar/settings` | GET/PUT | Sync settings |

---

## 4. Admin Management UI

### Appointments Page (`src/app/(admin)/admin/appointments/page.tsx`)

Two view modes toggled via admin store:

**Calendar View** (`src/components/admin/appointments/AppointmentCalendar.tsx`):
- FullCalendar library with Day/Week/Month views
- Color-coded by status and groomer
- Groomer filter (dropdown/chips)
- Status legend with 6 colors
- Event click opens detail modal
- Empty slot click (Day/Week only) shows "Fill from Waitlist" option
- Limited to 200 appointments per fetch to avoid UI slowdown

**List View** (`src/components/admin/appointments/AppointmentList.tsx`):
- Table with columns: Customer, Pet, Service, Date/Time, Status, (Calendar Sync), Actions
- Filters: status, service, date range
- Pagination (25 per page)
- Search (name, email, pet name)
- Sort by date, status, customer name
- Row click opens detail modal

### Appointment Detail Modal (`src/components/admin/appointments/AppointmentDetailModal.tsx`)

Layout:
```
Header: Paw icon, "Appointment Details", Status badge, Edit/Close buttons
Quick Info Grid (3 cols): Date/Time | Service | Groomer
Customer & Pet Grid (2 cols): Pet Parent info | Furry Friend info
Groomer Assignment: Dropdown select (if not terminal)
View/Edit Mode:
  - View: Notes, Add-ons badges, Admin Notes (inline edit)
  - Edit: Date, Time, Service dropdown, Add-ons grid, Notes, Admin Notes
Pricing Section: Base + Extras + Tax (9.75%) = Total
Report Card Section: (if completed) Sent/Draft badge, View/Edit buttons
Cancellation Info: (if cancelled) Reason display
Footer: Status transition buttons
```

API calls made:
- `GET /api/admin/appointments/{id}` - fetch details
- `GET /api/admin/report-cards?appointment_id={id}` - fetch report card
- `GET /api/admin/groomers` - fetch groomers for dropdown
- `PUT /api/admin/appointments/{id}` - save edits, assign groomer, update notes
- `POST /api/admin/appointments/{id}/status` - status transitions

### Status Transition Buttons (`src/components/admin/appointments/StatusTransitionButton.tsx`)

Each button can show a confirmation modal with:
- Cancellation reason dropdown (if cancelling)
- Notification toggles (email/SMS)
- Error display

Button styling: Red for destructive (cancel), charcoal theme primary for others.

---

## 5. Status State Machine

**File:** `src/lib/admin/appointment-status.ts`

### Statuses

```
pending | confirmed | in_progress | completed | cancelled | no_show
```

### Transition Matrix

| From | To | Label | Confirm? | Destructive? |
|------|----|-------|----------|-------------|
| pending | confirmed | Confirm | No | No |
| pending | cancelled | Cancel | Yes | Yes |
| confirmed | in_progress | Start Service | No | No |
| confirmed | cancelled | Cancel | Yes | Yes |
| in_progress | completed | Complete | No | No |
| in_progress | cancelled | Cancel | Yes | Yes |
| cancelled | pending | Restore to Pending | Yes | No |
| completed | in_progress | Reopen | Yes | No |

**Terminal statuses:** `completed`, `cancelled`, `no_show`

**Note:** `no_show` has NO outbound transitions (fully terminal).

### Color Mappings

| Status | Badge HEX | Calendar HEX |
|--------|-----------|-------------|
| pending | #FCD34D (yellow) | #FCD34D |
| confirmed | #10B981 (green) | #10B981 |
| in_progress | #6B7280 (gray) | #6B7280 |
| completed | #434E54 (charcoal) | #434E54 |
| cancelled | #EF4444 (red) | #EF4444 |
| no_show | #DC2626 (dark red) | #DC2626 |

### Cancellation Reasons

```typescript
['Customer request', 'Customer no-show', 'Emergency',
 'Double booking', 'Pet health issue', 'Staff unavailable', 'Other']
```

### Side Effects on Transition

- **Any transition:** Calendar sync triggered (background)
- **To confirmed:** Confirmation notification (if requested)
- **To cancelled:** Cancellation notification (if requested), `cancelled_at` recorded
- **To completed:** `completed_at` recorded, report card section unlocked
- **To no_show:** (set via API, not UI button)

---

## 6. Waitlist System

### Architecture

**Tables:** `waitlist` (entries), `waitlist_slot_offers` (fill-slot offers)

**Components:**
- `src/components/admin/waitlist/WaitlistTable.tsx` - Table with pagination, filters
- `src/components/admin/waitlist/BookFromWaitlistModal.tsx` - Book from waitlist entry

### Customer Flow

1. Customer selects unavailable time slot in booking
2. `WaitlistModal` appears offering to join waitlist
3. `POST /api/waitlist` creates entry with `time_preference` (morning/afternoon/any)
4. Position calculated as count of active entries for that date

### Admin Flow

1. **View waitlist:** Filterable table at `/admin/waitlist` (or within appointments page)
2. **Match:** When slot opens, `POST /api/admin/waitlist/match` finds matching entries by service + time
3. **Fill slot:** `POST /api/admin/waitlist/fill-slot` sends SMS to up to 10 customers with discount offer + response window
4. **Book directly:** `POST /api/admin/waitlist/[id]/book` creates appointment from waitlist entry with optional discount
5. On booking: waitlist entry status updated to `booked`, appointment created with `scheduled` status

### Waitlist Entry Statuses

```
pending | matched | booked | cancelled | expired
```

### Known Issues

- Search is client-side (inefficient for large datasets)
- Priority sorting not actually implemented (maps to `created_at`)
- Fill-slot doesn't check if entries are in bookable status
- Position is count of ALL active entries for date (not per-service)
- Waitlist entry update on booking is non-fatal (no rollback if update fails)

---

## 7. Report Cards

### Architecture

**Tables:** `report_cards` (main), `report_card_images` (photos)

**Components:**
- `src/components/admin/report-cards/ReportCardForm.tsx` - Creation/editing form
- Public view: `GET /api/report-cards/[uuid]` (no auth required)

### Form Sections

1. **Photo Upload:** Before/After photos (JPEG, PNG, WebP via `/api/admin/report-cards/upload`)
2. **Assessment:** Mood, Coat Condition, Behavior selectors
3. **Health Observations:** Free text with critical issue detection
4. **Groomer Notes:** Notes text + "Don't Send" toggle
5. **Actions:** Save Draft, Submit

### Report Card Flow

1. Appointment reaches `completed` status
2. Groomer creates report card via form (can save drafts)
3. Admin reviews and clicks Send (`POST /api/admin/report-cards/[id]/send`)
4. `triggerReportCardCompletion()` sends notification with shareable link
5. Customer views via public URL (`GET /api/report-cards/[uuid]`)
6. View count incremented asynchronously

### States

- **Draft:** `is_draft=true` - in progress, not sendable
- **Ready:** `is_draft=false, sent_at=null` - ready to send
- **Sent:** `sent_at` populated - customer notified
- **Don't Send:** `dont_send=true` - held back, needs customer contact first

### Security Concerns

- `POST /api/admin/report-cards` only checks auth, not admin/groomer role
- `POST /api/admin/report-cards/upload` only checks auth, not admin role
- No file size limit on photo upload
- Photo URLs not validated

---

## 8. Customer Portal

### Appointment List (`src/app/(customer)/appointments/page.tsx`)

- Fetches all customer appointments via Supabase query
- Groups into **Upcoming** and **Past**:
  - Upcoming: `pending`, `confirmed`, `scheduled`
  - Past: `completed`, `cancelled`, `no_show`, `in_progress`, `checked_in`
- **Issue:** `in_progress` classified as "past" but should be "upcoming"

### Appointment Detail (`src/app/(customer)/appointments/[id]/page.tsx`)

**Client component:** `AppointmentDetailClient.tsx`

Features:
- Status badge with color
- Appointment details: date, time, service, pet, groomer
- Add-ons list
- Pricing breakdown
- **Actions (conditional):**
  - Cancel: Available for `pending`/`confirmed`, checks cancellation policy (24h cutoff)
  - Reschedule: Link to booking flow (no pre-fill of preferences)
  - View Report Card: Link to public report card URL (if `completed`)

### Customer Dashboard Widget (`src/components/customer/dashboard/UpcomingAppointments.tsx`)

- Shows next 3 upcoming appointments
- Quick card display with date, service, pet
- "View All" link to full appointments list

### Cancellation Policy

- Free cancellation up to `cancellation_cutoff_hours` (from `booking_settings`, default 24h)
- After cutoff: cancellation blocked with message
- **Missing:** No documentation of fees after cutoff; no cancellation confirmation email

---

## 9. Google Calendar Integration

### Architecture

**Location:** `src/lib/calendar/`

**Tables:**
- `calendar_connections` - OAuth tokens (encrypted), calendar metadata, webhook info
- `calendar_event_mappings` - Appointment-to-event links
- `calendar_sync_log` - Operation audit trail

### OAuth Flow

1. Admin clicks "Connect Calendar" -> `POST /api/admin/calendar/auth/start`
2. Redirect to Google consent screen with `state=adminUserId`
3. Google redirects to `/api/admin/calendar/auth/callback` with `code`
4. Server exchanges code for tokens, fetches calendar metadata
5. Stores encrypted tokens in `calendar_connections`
6. Redirects to `/admin/settings?tab=calendar&status=connected`

**Token Management:**
- Auto-refresh with 5-minute expiry buffer
- Refresh token rotation on refresh
- Revocation calls Google's revoke endpoint on disconnect

### Event Mapping

**Appointment -> Google Calendar Event:**

```
Title: "{Service Name} - {Pet Name} ({Size})"
Description:
  Customer: {Name}
  Phone: {Phone}
  Email: {Email}
  Pet: {Name} ({Size})
  Service: {Service Name}
  Add-ons: {Addon1}, {Addon2}
  Notes: {Notes}
```

**Status Mapping:**

| Appointment Status | Calendar Status |
|-------------------|----------------|
| pending | tentative |
| confirmed | confirmed |
| checked_in | confirmed |
| in_progress | confirmed |
| completed | confirmed |
| cancelled | cancelled |
| no_show | cancelled |

**Duration:** Base service duration + sum of addon durations

### Sync Flows

**Push (Appointment -> Calendar):**
1. Fetch appointment with related data
2. Check if already mapped in `calendar_event_mappings`
3. If mapped + changed: UPDATE event
4. If not mapped: CREATE event
5. Store/update mapping
6. Log to `calendar_sync_log`

**Pull (Calendar -> Appointments) / Import:**
1. Preview: Fetch events for date range, parse for appointment data, validate, detect duplicates
2. Confirm: Import selected events, create customers/pets if needed, create mappings

**Webhook (Real-time):**
1. Google sends notification to `POST /api/admin/calendar/webhook`
2. Validate headers (channel ID, resource ID)
3. `sync` state: Full sync
4. `exists` state: Fetch changes and sync
5. Response within 5 seconds, process in background

### Known Issues

- `checked_in` status missing from calendar sync enum (`src/types/calendar.ts` lines 60-67)
- Webhook renewal not automated (expires ~24 hours)
- No idempotency keys on push/pull operations
- Customer phone/email sent in plaintext in event descriptions
- Import has no fuzzy matching for service names
- Service account implementation exists but not primary flow

---

## 10. CSV Import

### Architecture

**Files:**
- `src/lib/admin/appointments/csv-processor.ts` - `CSVProcessor`, `RowValidator`, `DuplicateDetector`, `BatchProcessor`
- `src/lib/admin/appointments/csv-validation.ts` - Zod schemas, parsing helpers
- `src/components/admin/appointments/CSVImportModal.tsx` - Multi-step UI
- `src/components/admin/appointments/csv/` - Step subcomponents

### CSV Template Columns

**Required:** `customer_name`, `customer_email`, `customer_phone`, `pet_name`, `pet_size`, `service_name`, `date`, `time`

**Optional:** `pet_breed`, `pet_weight`, `addons` (comma-separated), `notes`, `payment_status`, `amount_paid`, `payment_method`

### File Constraints

- Max size: 5 MB
- Max rows: 1,000
- Accepted: `.csv` files only
- MIME: `text/csv`, `text/plain`, `application/csv`

### Import Flow (UI)

```
upload -> validating -> [duplicates?] -> review -> importing -> summary
```

**Step 1: Upload** - Drag-and-drop or browse, download template button
**Step 2: Validate** - `POST /api/admin/appointments/import/validate`
**Step 3: Duplicates** (conditional) - Side-by-side comparison, skip/overwrite choice
**Step 4: Review** - Summary cards (total/valid/invalid), preview table, error table
**Step 5: Import** - `POST /api/admin/appointments/import` with progress animation
**Step 6: Summary** - Results with customers/pets created counts, error download

### Validation Per Row

1. Schema validation (Zod)
2. Customer name parsing (first/last split)
3. Pet size normalization and validation
4. Weight-to-size consistency check (warning only)
5. Service lookup (case-insensitive database query)
6. Service price validation for pet size
7. Date/time parsing (supports: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY + 12/24h time)
8. Business hours check (9am-5pm, closed Sunday)
9. Addon lookup (case-insensitive)
10. Payment validation (paid -> requires amount + method)
11. CSV injection prevention (strips leading `=`, `@`, `+`, `-`)

**Error vs Warning:** Errors block import; warnings allow but flag for review.

### Duplicate Detection

Matches on: customer email (case-insensitive) + pet name (case-insensitive) + same day + time within same hour. Only checks against non-terminal appointments.

### Known Issues

- No progress streaming (5-min timeout may be insufficient for large files)
- N+1 queries during validation (~3 queries per row = 3000 for 1000 rows)
- No duplicate detection within the CSV itself
- Business hours hardcoded (9am-5pm) in validation
- Limited date format support (no DD/MM/YYYY)
- Phone validation too lenient (length only)

---

## 11. Dashboard

### Page: `src/app/(admin)/admin/dashboard/page.tsx`

### Components

**TodayAppointments** (`src/components/admin/dashboard/TodayAppointments.tsx`):
- Grid of appointment cards for today
- Custom sort: Active (earliest first) -> Completed -> Cancelled
- Quick action button per card:
  - `pending` -> "Confirm" button
  - `confirmed` -> "Start" button
  - `in_progress` -> "Complete" button
- Customer flags visual indicator
- Notes preview (line-clamped)
- Click opens detail modal

**PendingAppointments** (`src/components/admin/dashboard/PendingAppointments.tsx`):
- All pending appointments (no date filter, not just today)
- Shows first 10, "view all" link if more
- Full-width "Confirm" button per card (optimistic update)

**DashboardWalkInButton** (`src/components/admin/dashboard/DashboardWalkInButton.tsx`):
- Desktop: Inline button with Footprints icon
- Mobile: Floating Action Button (FAB) at bottom-right
- Opens booking modal in `walkin` mode

### Dashboard API Data

| Endpoint | Data |
|----------|------|
| `GET /api/admin/dashboard/appointments` | Today's appointments (excl. cancelled/no_show) |
| `GET /api/admin/dashboard/pending-appointments` | All pending appointments |
| `GET /api/admin/dashboard/stats` | `{ completedRevenue, pendingRevenue }` for today |
| `GET /api/admin/dashboard/activity` | 10 most recent notifications |

### Known Issues

- Dashboard appointments endpoint doesn't fetch groomer info
- Pending appointments has no date filter (includes all past pending)
- No real-time updates (requires manual refresh)
- Activity feed limited to 10 items, no pagination

---

## 12. Known Issues & Technical Debt

### Critical (P0)

| Issue | Location | Impact |
|-------|----------|--------|
| `checked_in` status missing from calendar sync enum | `src/types/calendar.ts:60-67` | Walk-in appointments won't sync to Google Calendar |
| SQL string interpolation in search | `GET /api/admin/appointments` (full-text search) | Potential SQL injection vulnerability |
| Report card routes missing admin role check | `POST /api/admin/report-cards`, `POST /api/admin/report-cards/upload` | Any authenticated user can create/upload report cards |

### High Priority (P1)

| Issue | Location | Impact |
|-------|----------|--------|
| `in_progress` classified as "past" in customer portal | `src/app/(customer)/appointments/page.tsx:51` | Active appointments appear in past section |
| `complete-past` route inconsistent auth | `POST /api/admin/appointments/complete-past` | Uses manual role check instead of `requireAdmin()` |
| No cancellation confirmation email | `DELETE /api/customer/appointments/[id]:97` | Customers don't get cancellation receipt |
| Webhook renewal not automated | Calendar webhook system | Real-time sync stops after ~24 hours |
| No file size limit on report card upload | `POST /api/admin/report-cards/upload` | Could accept arbitrarily large files |
| Waitlist book uses `.single()` for pricing | `POST /api/admin/waitlist/[id]/book` | Fails if multiple size prices exist for service |

### Medium Priority (P2)

| Issue | Location | Impact |
|-------|----------|--------|
| Client-side waitlist search | `GET /api/admin/waitlist` | Inefficient for large datasets |
| Priority sorting not implemented | `GET /api/admin/waitlist` | "priority" maps to `created_at` |
| max_concurrent hardcoded to 3 | `GET /api/admin/appointments/availability` | Not configurable per business needs |
| Buffer time mismatch | Availability calculation | Buffer logic doesn't match conflict check logic |
| No calendar sync on complete-past | `POST /api/admin/appointments/complete-past` | Bulk-completed appointments not synced |
| CSV validation N+1 queries | `csv-processor.ts` | ~3000 queries for 1000-row file |
| Business hours hardcoded in CSV validation | `csv-validation.ts:293-300` | Can't import outside 9am-5pm |
| No duplicate detection within CSV | CSV import system | Same row twice in file creates duplicates |
| Notification to new customers | `POST /api/admin/appointments:655` | Newly created inactive customers don't receive confirmation |

### Low Priority (P3)

| Issue | Location | Impact |
|-------|----------|--------|
| View count race condition | `GET /api/report-cards/[uuid]:101` | Fire-and-forget increment could lose data |
| Waitlist position is per-date, not per-service | `POST /api/waitlist` | Position number can be misleading |
| No drag-and-drop in calendar | `AppointmentCalendar.tsx` | Can't reschedule by dragging events |
| Calendar import no fuzzy matching | Calendar import parser | Slight service name differences cause import failure |
| Phone validation too lenient in CSV | `csv-validation.ts` | Invalid formats accepted |
| Cancellation reason stored as string | `StatusTransitionButton.tsx` | Not an enum, inconsistent with DB schema |
| Calendar month view click does nothing | `AppointmentCalendar.tsx` | Only Day/Week views support slot clicks |
| No real-time dashboard updates | Dashboard components | Manual refresh required |
| Customer phone/email in calendar description | Calendar event mapping | PII in plaintext in Google Calendar |

### Security Audit Summary

**Strengths:**
- Two-client pattern (auth + service role) consistently used in most admin routes
- Ownership verification on customer endpoints
- OAuth state parameter prevents CSRF
- Token encryption at rest
- CSV injection prevention

**Weaknesses:**
- Report card routes missing admin role check
- SQL interpolation in search (injection risk)
- No file size limits on some uploads
- No rate limiting on several endpoints
- No virus scanning on file uploads
- PII in plaintext in calendar events

### Authentication Pattern Inconsistencies

| Route | Pattern | Expected |
|-------|---------|----------|
| `GET/POST /api/admin/report-cards` | Auth only | `requireAdmin()` |
| `POST /api/admin/report-cards/upload` | Auth only | `requireAdmin()` |
| `POST /api/admin/appointments/complete-past` | Manual role check | `requireAdmin()` |
| `GET /api/admin/calendar/sync/status` | `createClient()` | `createServerSupabaseClient()` |
| `POST /api/admin/waitlist/[id]/book` | Auth only | `requireAdmin()` |

### Missing Features / Gaps

- No appointment rescheduling from customer portal (only link to new booking)
- No cancellation fee policy documentation or implementation
- No customer notification preferences for calendar sync
- No appointment export (CSV/PDF)
- No recurring appointments
- No groomer schedule/availability management
- No conflict detection for calendar import
- No multi-timezone support (assumes America/Los_Angeles)
- No audit log for admin actions on appointments

---

*End of Audit Report*
