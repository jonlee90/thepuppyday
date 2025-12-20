# Admin Panel Routes - Architecture Documentation

> **Module**: Admin Panel
> **Status**: ✅ Core Complete (Phase 5), 🚧 Advanced Pending (Phase 6)
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
│   ├── page.tsx                  # Appointment management (calendar + list)
│   └── [id]/
│       └── report-card/page.tsx  # Create/edit report card
├── customers/
│   ├── page.tsx                  # Customer list
│   └── [id]/page.tsx             # Customer profile
├── services/page.tsx             # Service management
├── addons/page.tsx               # Add-on management
├── gallery/page.tsx              # Gallery management
├── analytics/page.tsx            # Business analytics (Phase 6)
├── waitlist/page.tsx             # Waitlist management
├── marketing/
│   └── campaigns/page.tsx        # Marketing campaigns (Phase 6)
├── notifications/
│   ├── page.tsx                  # Notification overview
│   ├── dashboard/page.tsx        # Notification metrics
│   ├── templates/page.tsx        # Template management
│   ├── log/page.tsx              # Notification log
│   └── settings/page.tsx         # Notification settings
└── settings/page.tsx             # System settings (Phase 9)
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

**Manual Appointment Creation**:
- 5-step wizard (similar to customer booking)
- Admin can bypass availability constraints
- Add internal notes
- Set creation_method = 'manual_admin'

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

### 8. Analytics (`/admin/analytics`) (Phase 6)

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

---

### 9. Settings (`/admin/settings`) (Phase 9)

**Sections**:
- Business information
- Operating hours
- Booking settings (min notice, max advance booking)
- Payment settings (Stripe configuration)
- Email/SMS provider settings
- Staff management
- Role permissions

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

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/appointments` | GET, POST | List or create appointments |
| `/api/admin/appointments/[id]` | GET, PUT, DELETE | CRUD single appointment |
| `/api/admin/appointments/import` | POST | CSV bulk import |
| `/api/admin/customers` | GET, POST | Customer management |
| `/api/admin/services` | GET, POST, PUT, DELETE | Service CRUD |
| `/api/admin/addons` | GET, POST, PUT, DELETE | Addon CRUD |
| `/api/admin/gallery` | GET, POST, PUT, DELETE | Gallery management |
| `/api/admin/notifications/templates` | GET, POST, PUT, DELETE | Template CRUD |
| `/api/admin/notifications/log` | GET | Notification log |

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

- [CSV Import Processing](../services/csv-processor.md)
- [Notification System](../services/notifications.md)
- [Real-Time Updates](../services/supabase.md#realtime)

---

**Last Updated**: 2025-12-20
