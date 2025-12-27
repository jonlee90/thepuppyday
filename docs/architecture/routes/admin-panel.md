# Admin Panel Routes - Architecture Documentation

> **Module**: Admin Panel
> **Status**: ✅ Phases 5, 6, 8, 9 Complete | ⏸️ Phase 7 Pending (Payments)
> **Base Path**: `admin/`
> **Authentication**: Required (admin or groomer role)

## Overview

Comprehensive business management interface for administrators and staff to manage appointments, customers, services, analytics, and system settings.

---

## Route Structure

```
src/app/admin/
├── layout.tsx                    # Admin layout with sidebar
├── page.tsx                      # Redirects to /admin/dashboard
├── dashboard/
│   └── page.tsx                  # Admin dashboard overview
├── appointments/
│   ├── page.tsx                  # Appointment management (calendar + list + walk-in)
│   └── [id]/
│       └── report-card/page.tsx  # Create/edit report card
├── customers/
│   ├── page.tsx                  # Customer list
│   └── [id]/page.tsx             # Customer profile
├── services/page.tsx             # Service management
├── addons/page.tsx               # Add-on management
├── gallery/page.tsx              # Gallery management
├── analytics/page.tsx            # Business analytics ✅
├── waitlist/page.tsx             # Waitlist management
├── marketing/
│   └── campaigns/page.tsx        # Marketing campaigns ✅
├── notifications/
│   ├── page.tsx                  # Notification overview
│   ├── dashboard/page.tsx        # Notification metrics
│   ├── templates/page.tsx        # Template management
│   ├── log/page.tsx              # Notification log
│   └── settings/page.tsx         # Notification settings
└── settings/
    ├── page.tsx                  # Settings dashboard ✅
    ├── banners/page.tsx          # Promo banner management ✅
    ├── booking/
    │   ├── page.tsx              # Booking configuration ✅
    │   └── blocked-dates/page.tsx # Blocked dates manager ✅
    ├── business-hours/page.tsx   # Operating hours ✅
    ├── loyalty/
    │   ├── page.tsx              # Loyalty program settings ✅
    │   └── punch-card-demo/page.tsx # Punch card preview
    ├── site-content/page.tsx     # Homepage & SEO content ✅
    └── staff/page.tsx            # Staff & commission management ✅
```

---

## Core Routes

### 1. Dashboard (`/admin/dashboard`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\dashboard\page.tsx`

**Components**:
- **Stats Cards**: Today's appointments, revenue, pending tasks
- **Today's Schedule**: Calendar view of today's appointments
- **Recent Activity**: Latest customer registrations, bookings, cancellations
- **Quick Actions**: Create appointment, add customer, view waitlist

**Real-Time Updates**:
```typescript
// Supabase real-time subscription
useEffect(() => {
  const channel = supabase
    .channel('dashboard')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      handleAppointmentChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

---

### 2. Appointments (`/admin/appointments`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\appointments\page.tsx`

**Views**:
1. **Calendar View** (FullCalendar)
   - Drag-and-drop appointment scheduling
   - Color-coded by status
   - Day/week/month views

2. **List View**
   - Filterable table (status, service, date range, customer search)
   - Sortable columns
   - Pagination
   - Bulk actions (confirm, cancel)

**Manual Appointment Creation** (via BookingModal):
- Uses reusable `BookingModal` component with `mode="admin"`
- **7-step wizard**: Service → Date & Time → Customer → Pet → Add-ons → Review → Confirmation
- Can search/select existing customers or create new
- Admin can bypass availability constraints
- Add internal notes and payment status
- Set `creation_method = 'manual_admin'`
- Optional notification toggle (not auto-sent)

**CSV Bulk Import**:
```typescript
// POST /api/admin/appointments/import
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/api/admin/appointments/import', {
  method: 'POST',
  body: formData,
});

const { imported, errors } = await response.json();
```

**CSV Format**:
```csv
customer_email,pet_name,service_name,scheduled_at,notes
john@example.com,Buddy,Basic Grooming,2025-01-15T10:00:00Z,Special instructions
```

**Import Features**:
- Duplicate detection (same customer, pet, date)
- Customer account creation with email activation
- Batch processing (10 rows per batch)
- Formula injection prevention
- Detailed error reporting

**Walk-In Appointments** (via BookingModal):
- Uses reusable `BookingModal` component with `mode="walkin"`
- **5-step wizard**: Service → Customer → Pet → Add-ons → Confirmation
- Date/time auto-set to current moment (no DateTime step)
- Email optional (phone required for SMS contact)
- Search existing customer OR create new
- Quick inline pet creation
- Appointment marked with `source: 'walk_in'` flag
- Streamlined flow for speed (no Review step)

**Walk-In Step Order**:
| Step | Component | Description |
|------|-----------|-------------|
| 0 | ServiceStep | Select grooming service |
| 1 | CustomerStep | Search/select existing or create new customer |
| 2 | PetStep | Select existing pet or create new |
| 3 | AddonsStep | Optional add-on services |
| 4 | ConfirmationStep | Walk-in confirmed |

**Walk-In Flow**:
```typescript
// Admin clicks "Walk In" button on dashboard
// BookingModal opens with mode="walkin"
// DateTime auto-set to NOW, bypasses availability
{
  service: { select first },
  customer: { search OR create },
  pet: { select OR quick create },
  addons: { optional },
  source: 'walk_in',
  scheduled_at: new Date() // Auto-set to current time
}
```

---

### 3. Customers (`/admin/customers`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\customers\page.tsx`

**Features**:
- Customer table with search and filters
- Customer flags (VIP, Flagged)
- Account activation status
- Created by admin indicator
- Export to CSV

**Customer Profile** (`/admin/customers/[id]`):
- Personal information
- All pets
- Appointment history
- Payment history (Phase 7)
- Loyalty points (Phase 7)
- Customer flags/notes
- Account activation controls

**Customer Flags**:
```typescript
interface CustomerFlag {
  is_vip: boolean;            // VIP customer
  is_flagged: boolean;        // Problem customer
  flag_reason: string | null; // Why flagged
  notes: string | null;       // Internal notes
}
```

---

### 4. Services & Addons

**Services** (`/admin/services`):
- CRUD operations for services
- Size-based pricing editor
- Duration configuration
- Active/inactive toggle
- Display order management

**Addons** (`/admin/addons`):
- CRUD operations for add-ons
- Fixed pricing
- Active/inactive toggle
- Display order management

---

### 5. Gallery (`/admin/gallery`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\gallery\page.tsx`

**Features**:
- Upload images (drag-and-drop)
- Image compression before upload
- Add titles, descriptions, categories
- Mark as featured
- Manage display order
- Publish/unpublish
- Delete images

**Image Upload Flow**:
```typescript
// 1. Client-side compression
const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
});

// 2. Upload to Supabase Storage
const { data } = await supabase.storage
  .from('gallery')
  .upload(`public/${fileName}`, compressedFile);

// 3. Save metadata to database
await supabase.from('gallery_images').insert({
  image_url: data.path,
  title, description, category
});
```

---

### 6. Waitlist (`/admin/waitlist`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\waitlist\page.tsx`

**Features**:
- View all waitlist entries
- Filter by status (active, notified, booked)
- Notify customer of availability
- Convert waitlist entry to appointment
- Cancel/expire entries

---

### 7. Notifications (`/admin/notifications`)

**Dashboard** (`/admin/notifications/dashboard`):
- Metrics: Total sent, delivery rate, failure rate
- Channel breakdown (email vs SMS)
- Type breakdown (reminders, confirmations, etc.)
- Timeline chart
- Recent failures

**Templates** (`/admin/notifications/templates`):
- Template list (email and SMS)
- Create/edit templates
- Template variables documentation
- Preview with sample data
- Test send functionality

**Log** (`/admin/notifications/log`):
- Searchable log table
- Filters: channel, status, date range, customer
- Export to CSV
- Retry failed notifications

**Settings** (`/admin/notifications/settings`):
- Enable/disable notification types
- Configure retry settings
- Set default sender info
- Test email/SMS configuration

---

### 8. Analytics (`/admin/analytics`) ✅

**Dashboards**:
- Revenue analytics
- Appointment trends
- Customer acquisition
- Service popularity
- Retention metrics
- Groomer performance

**Charts** (Recharts/Chart.js):
- Line charts: Revenue over time
- Bar charts: Services by popularity
- Pie charts: Customer retention
- Area charts: Appointment trends

**API Routes**:
- `/api/admin/analytics/kpis` - Key performance indicators
- `/api/admin/analytics/charts/revenue` - Revenue charts
- `/api/admin/analytics/charts/appointments-trend` - Appointment trends
- `/api/admin/analytics/charts/services` - Service popularity
- `/api/admin/analytics/charts/customers` - Customer acquisition
- `/api/admin/analytics/charts/operations` - Operational metrics
- `/api/admin/analytics/groomers` - Groomer performance
- `/api/admin/analytics/marketing` - Marketing campaign performance
- `/api/admin/analytics/report-cards` - Report card metrics
- `/api/admin/analytics/waitlist` - Waitlist analytics

---

### 9. Settings (`/admin/settings`) ✅

**Settings Dashboard** (`/admin/settings`):
- Navigation cards to all settings sections
- Quick access to frequently modified settings
- Recent changes log

---

#### 9.1. Site Content (`/admin/settings/site-content`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\site-content\page.tsx`

**Features**:
- **Hero Section Editor**: Main homepage headline, subheadline, CTA text
- **Hero Image Upload**: Upload and manage hero background image
- **SEO Settings**: Meta title, description, keywords
- **SEO Preview**: Live preview of how page appears in search results
- **Business Information**: Name, address, phone, email, social media links

**API**: `/api/admin/settings/site-content`

---

#### 9.2. Promo Banners (`/admin/settings/banners`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\banners\page.tsx`

**Features**:
- Create/edit promotional banners
- Upload banner images (with compression)
- Set banner text, CTA, and link
- Schedule banner display (start/end dates)
- Drag-and-drop reorder banners
- Enable/disable individual banners
- Click tracking and analytics per banner

**API Routes**:
- `/api/admin/settings/banners` - List, create banners
- `/api/admin/settings/banners/[id]` - Get, update, delete banner
- `/api/admin/settings/banners/reorder` - Update display order
- `/api/admin/settings/banners/upload` - Upload banner images
- `/api/admin/settings/banners/[id]/analytics` - Banner click analytics

**Banner Display Logic**:
- Active banners within scheduled date range
- Ordered by `display_order` (drag-drop)
- Displayed in carousel on homepage

---

#### 9.3. Booking Settings (`/admin/settings/booking`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\booking\page.tsx`

**Configuration Options**:
- **Advance Booking Window**: How far in advance customers can book (e.g., 30 days)
- **Cancellation Policy**: Minimum notice required for cancellation (hours)
- **Buffer Time**: Time between appointments for cleanup/prep
- **Max Concurrent Appointments**: How many appointments can overlap
- **Default Service Duration**: Fallback duration if not specified

**Blocked Dates** (`/admin/settings/booking/blocked-dates`):
- Add specific dates when bookings are not allowed (holidays, closures)
- Set recurring blocked days (e.g., every Sunday)
- Override blocked dates for special events
- Calendar view of blocked dates

**API Routes**:
- `/api/admin/settings/booking` - Get/update booking settings
- `/api/admin/settings/booking/blocked-dates` - Manage blocked dates

**Integration**:
- Booking settings are checked by `/api/availability` endpoint
- Blocked dates prevent slot availability

---

#### 9.4. Business Hours (`/admin/settings/business-hours`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\business-hours\page.tsx`

**Features**:
- Set operating hours for each day of the week
- Mark days as closed
- Support for split shifts (e.g., 9am-12pm, 1pm-5pm)
- Holiday hours override

**API**: `/api/admin/settings/business-hours`

**Data Structure**:
```typescript
{
  monday: { open: '09:00', close: '17:00', is_closed: false },
  tuesday: { open: '09:00', close: '17:00', is_closed: false },
  // ... etc
}
```

---

#### 9.5. Loyalty Program (`/admin/settings/loyalty`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\loyalty\page.tsx`

**Sections**:

**Punch Card Configuration**:
- Number of services required for free service
- Eligible services for punch card
- Expiration rules

**Earning Rules**:
- Points per dollar spent
- Bonus points for specific services
- Birthday bonuses
- Referral bonuses

**Redemption Rules**:
- Points required for rewards
- Reward types (discount, free service, etc.)
- Minimum purchase requirements
- Expiration of points

**Referral Program**:
- Referral reward amount (for referrer)
- New customer discount (for referred)
- Referral code generation

**API Routes**:
- `/api/admin/settings/loyalty` - Get/update loyalty settings
- `/api/admin/settings/loyalty/earning-rules` - Manage earning rules
- `/api/admin/settings/loyalty/redemption-rules` - Manage redemption rules
- `/api/admin/settings/loyalty/referral` - Referral program settings

**Punch Card Demo** (`/admin/settings/loyalty/punch-card-demo`):
- Visual preview of how punch card appears to customers
- Test different configurations

---

#### 9.6. Staff Management (`/admin/settings/staff`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\staff\page.tsx`

**Features**:
- **Staff Directory**: List all groomers and staff
- **Add/Edit Staff**: Name, email, phone, role, hire date
- **Staff Status**: Active/inactive toggle
- **Commission Settings**: Configure commission rates per staff member
- **Earnings Reports**: View earnings and commission calculations per period
- **Appointment Assignment**: Assign specific groomers to appointments

**API Routes**:
- `/api/admin/settings/staff` - List, create staff
- `/api/admin/settings/staff/[id]` - Get, update, delete staff
- `/api/admin/settings/staff/[id]/commission` - Commission settings
- `/api/admin/settings/staff/earnings` - Earnings reports

**Staff Commission Structure**:
```typescript
{
  staff_id: string;
  commission_type: 'percentage' | 'fixed_per_service';
  commission_rate: number; // e.g., 40 (for 40% or $40)
  applies_to_services: string[]; // service IDs
}
```

**Integration**:
- Groomers can be assigned to appointments
- Commission calculated automatically on appointment completion
- Earnings tracked for payroll

---

#### 9.7. Calendar Settings (`/admin/settings/calendar`) ✅

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\settings\calendar\page.tsx`

**Features (Phase 11)**:

**Connection Management**:
- View active calendar connections
- Enable/disable auto-sync
- Connection health status
- Last sync timestamp

**Error Recovery UI** (`SyncErrorRecovery` Component):
- **Filter Errors**: By error type (auth_error, quota_exceeded, network_error, etc.)
- **Retry Failed Syncs**: Individual or batch retry
- **Resync Appointments**: Force delete + recreate in Google Calendar
- **Error Details**: View full error messages and retry history
- **Pagination**: Handle large error lists

**Quota Tracking** (`QuotaWarning` Component):
- **Daily Usage**: Current API request count vs limit
- **Progress Bar**: Visual quota usage indicator
- **Warning Banner**: Alert at 80% usage (800,000/1,000,000 requests)
- **Critical Alert**: Auto-pause warning at 90%

**Auto-Pause System** (`PausedSyncBanner` Component):
- **Pause Notification**: Banner when sync auto-paused after 10 consecutive failures
- **Resume Button**: Manual resume with CSRF-protected Server Action
- **Pause Reason**: Display reason (e.g., "Token expired", "Quota exceeded")
- **Consecutive Failures**: Show failure count before pause

**Server Actions** (CSRF Protection):
```typescript
// src/app/admin/settings/calendar/actions.ts
export async function getQuotaStatus(): Promise<QuotaStatus> {
  // CSRF-protected quota fetch
}

export async function resumeAutoSync(connectionId: string): Promise<Result> {
  // CSRF-protected resume action
}
```

**API Routes**:
- `/api/admin/calendar/quota` - Get quota status
- `/api/admin/calendar/sync/errors` - List failed syncs
- `/api/admin/calendar/sync/retry` - Retry failed syncs
- `/api/admin/calendar/sync/resync` - Force resync
- `/api/admin/calendar/connection/resume` - Resume auto-sync
- `/api/admin/calendar/sync/queue-stats` - Retry queue statistics

**Security Fixes (Phase 11)**:
1. **CSRF Protection**: All mutations use Server Actions
2. **Auth Verification**: Quota tracker validates admin session
3. **SQL Injection Prevention**: Input validation on error type filter
4. **N+1 Query Optimization**: Batch fetch appointments in retry queue
5. **XSS Prevention**: Safe DOM manipulation in toast notifications
6. **Memory Leak Prevention**: AbortController for fetch requests

**Next.js 16 Compatibility**:
- Async `searchParams` handling
- Server Actions return typed promises
- Proper error boundary integration

---

## Layout (`layout.tsx`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\admin\layout.tsx`

**Structure**:
```tsx
<div className="min-h-screen bg-gray-50">
  <AdminSidebar />  {/* Desktop sidebar */}
  <div className="lg:pl-64">
    <AdminHeader />
    <main className="p-6">
      {children}
    </main>
  </div>
  <MobileNav />  {/* Mobile bottom nav */}
</div>
```

**Sidebar Navigation**:
- Dashboard
- Appointments
- Customers
- Services
- Addons
- Gallery
- Analytics
- Waitlist
- Marketing
- Notifications
- Settings

---

## Data Flow

### Appointment Status Transition Flow
```
pending → confirmed → checked_in → in_progress → ready → completed

Alternative paths:
pending → cancelled
confirmed → no_show
```

**Status Update**:
```typescript
// PUT /api/admin/appointments/[id]/status
const { data } = await supabase
  .from('appointments')
  .update({ status: newStatus })
  .eq('id', appointmentId);

// Trigger notification based on new status
if (newStatus === 'ready') {
  await notificationService.send({
    type: 'appointment_ready',
    channel: 'sms',
    userId: appointment.customer_id,
    recipient: appointment.customer.phone,
    data: { appointmentId, petName: appointment.pet.name }
  });
}
```

---

## Security

### Role-Based Access

**Middleware Protection**:
```typescript
// /api/admin/* routes protected
if (pathname.startsWith('/api/admin')) {
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin' && userData?.role !== 'groomer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

**requireAdmin Helper**:
```typescript
export async function requireAdmin(supabase: AppSupabaseClient) {
  const { user, role } = await getAuthenticatedAdmin(supabase);
  if (!user || (role !== 'admin' && role !== 'groomer')) {
    throw new Error('Unauthorized: Admin or staff access required');
  }
  return { user, role };
}
```

**Owner-Only Operations**:
Some sensitive operations require `admin` role (not `groomer`):
- Deleting customers
- Managing staff accounts
- Viewing payment details
- Changing system settings

---

## BookingModal Integration

The admin panel uses the reusable `BookingModal` component for appointment creation with mode-specific behavior.

### Mode Comparison

| Feature | `admin` Mode | `walkin` Mode |
|---------|-------------|---------------|
| **Steps** | 7 steps | 5 steps |
| **Step Order** | Service → DateTime → Customer → Pet → Addons → Review → Confirm | Service → Customer → Pet → Addons → Confirm |
| **DateTime** | Manual selection (any date) | Auto-set to NOW |
| **Customer** | Search existing OR create new | Search existing OR quick create |
| **Email** | Required | Optional |
| **Review Step** | Yes | No |
| **Bypass Availability** | Yes | Yes |
| **Notifications** | Optional toggle | Optional toggle |
| **Payment Status** | Selectable | Selectable |

### Key Files

| File | Purpose |
|------|---------|
| `src/components/booking/BookingModal.tsx` | Modal wrapper (supports all modes) |
| `src/components/booking/BookingWizard.tsx` | Step orchestrator with mode-aware rendering |
| `src/hooks/useBookingModal.ts` | Modal state + MODE_CONFIG definitions |
| `src/lib/booking/step-validation.ts` | Mode-aware step validation |

### Usage in Admin

```typescript
// Admin Appointments Page - "Create Appointment" button
const { open: openBookingModal } = useBookingModal();

openBookingModal({
  mode: 'admin',
  onSuccess: (appointmentId) => {
    // Refresh appointments list
    router.refresh();
  }
});

// Admin Dashboard - "Walk In" button
openBookingModal({
  mode: 'walkin',
  onSuccess: (appointmentId) => {
    // Navigate to appointment or show success
  }
});
```

---

## State Management

**Admin Store** (Zustand):
```typescript
interface AdminState {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: 'calendar' | 'list';
  setView: (view: 'calendar' | 'list') => void;
  filters: AppointmentFilters;
  setFilters: (filters: AppointmentFilters) => void;
}
```

---

## API Endpoints

### Appointments
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/appointments` | GET, POST | List or create appointments (includes walk-in) |
| `/api/admin/appointments/[id]` | GET, PUT, DELETE | CRUD single appointment |
| `/api/admin/appointments/[id]/status` | PUT | Update appointment status |
| `/api/admin/appointments/import` | POST | CSV bulk import |
| `/api/admin/appointments/availability` | GET | Check availability for manual booking |
| `/api/admin/appointments/complete-past` | POST | Bulk complete past appointments |

### Customers & Users
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/customers` | GET, POST | Customer management |
| `/api/admin/users` | GET | List all users with roles |

### Services & Addons
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/services` | GET, POST, PUT, DELETE | Service CRUD |
| `/api/admin/addons` | GET, POST, PUT, DELETE | Addon CRUD |
| `/api/admin/breeds` | GET, POST | Breed management |

### Gallery & Marketing
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/gallery` | GET, POST, PUT, DELETE | Gallery management |
| `/api/admin/campaigns` | GET, POST, PUT, DELETE | Marketing campaigns |
| `/api/admin/campaigns/segment-preview` | POST | Preview campaign audience |

### Analytics
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/analytics/kpis` | GET | Key performance indicators |
| `/api/admin/analytics/charts/*` | GET | Various analytics charts |
| `/api/admin/analytics/groomers` | GET | Groomer performance |
| `/api/admin/analytics/marketing` | GET | Marketing analytics |
| `/api/admin/analytics/report-cards` | GET | Report card metrics |
| `/api/admin/analytics/waitlist` | GET | Waitlist analytics |

### Notifications
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/notifications/templates` | GET, POST, PUT, DELETE | Template CRUD |
| `/api/admin/notifications/log` | GET | Notification log |
| `/api/admin/settings/templates/reset` | POST | Reset templates to defaults |

### Settings
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/settings/site-content` | GET, PUT | Homepage & SEO content |
| `/api/admin/settings/site-content/upload` | POST | Upload hero images |
| `/api/admin/settings/banners` | GET, POST | Banner management |
| `/api/admin/settings/banners/[id]` | GET, PUT, DELETE | Single banner CRUD |
| `/api/admin/settings/banners/reorder` | PUT | Reorder banners |
| `/api/admin/settings/banners/upload` | POST | Upload banner images |
| `/api/admin/settings/banners/[id]/analytics` | GET | Banner analytics |
| `/api/admin/settings/booking` | GET, PUT | Booking configuration |
| `/api/admin/settings/booking/blocked-dates` | GET, POST, DELETE | Blocked dates |
| `/api/admin/settings/business-hours` | GET, PUT | Operating hours |
| `/api/admin/settings/loyalty` | GET, PUT | Loyalty program settings |
| `/api/admin/settings/loyalty/earning-rules` | GET, PUT | Points earning rules |
| `/api/admin/settings/loyalty/redemption-rules` | GET, PUT | Redemption rules |
| `/api/admin/settings/loyalty/referral` | GET, PUT | Referral program |
| `/api/admin/settings/staff` | GET, POST | Staff management |
| `/api/admin/settings/staff/[id]` | GET, PUT, DELETE | Single staff CRUD |
| `/api/admin/settings/staff/[id]/commission` | GET, PUT | Commission settings |
| `/api/admin/settings/staff/earnings` | GET | Earnings reports |

---

## Testing

### Integration Tests
```typescript
describe('Admin Appointment Creation', () => {
  it('creates appointment with admin permissions', async () => {
    const response = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'xxx',
        pet_id: 'yyy',
        service_id: 'zzz',
        scheduled_at: '2025-01-15T10:00:00Z',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.creation_method).toBe('manual_admin');
  });

  it('rejects non-admin users', async () => {
    // Mock customer user session
    const response = await fetch('/api/admin/appointments');
    expect(response.status).toBe(403);
  });
});
```

---

## Related Documentation

- [Booking Flow Architecture](../components/booking-flow.md) - Complete booking wizard documentation
- [CSV Import Processing](../services/csv-processor.md)
- [Notification System](../services/notifications.md)
- [Real-Time Updates](../services/supabase.md#realtime)

---

**Last Updated**: 2025-12-26
