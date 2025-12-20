# Customer Portal Routes - Architecture Documentation

> **Module**: Customer Portal
> **Status**: ✅ Completed (Phase 4)
> **Base Path**: `(customer)/`
> **Authentication**: Required (customer, admin, or groomer role)

## Overview

The customer portal provides authenticated users with self-service tools to manage appointments, pets, profiles, loyalty points, and view report cards.

---

## Routes

### 1. Dashboard (`/dashboard`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\dashboard\page.tsx`

**Sections**:
- Welcome message with user name
- Upcoming appointments (next 3)
- Recent report cards
- Loyalty points balance
- Quick action buttons (Book, Manage Pets)

**Data Fetching**:
```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select('*, pet:pets(*), service:services(*)')
  .eq('customer_id', user.id)
  .gte('scheduled_at', new Date().toISOString())
  .order('scheduled_at')
  .limit(3);
```

---

### 2. Appointments (`/appointments`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\appointments\page.tsx`

**Features**:
- List view of all appointments (upcoming and past)
- Filter by status (upcoming, completed, cancelled)
- Sort by date
- Appointment cards with:
  - Pet photo and name
  - Service type
  - Date/time
  - Status badge
  - Actions (View Details, Cancel)

**Appointment Detail Page** (`/appointments/[id]`):
- Full appointment information
- Pet details
- Service and addons
- Total cost
- Special instructions
- Cancel appointment button
- Rebook button

---

### 3. Pets (`/pets`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\pets\page.tsx`

**Features**:
- Grid view of customer's pets
- Add New Pet button
- Pet cards with:
  - Photo
  - Name, breed, size
  - Age
  - Edit/View buttons

**Pet Profile Page** (`/pets/[id]`):
- Pet information (name, breed, size, weight, birth date)
- Medical information
- Notes
- Appointment history for this pet
- Edit pet details
- Upload photo
- Deactivate pet (soft delete)

**Add/Edit Pet Form**:
```typescript
const petSchema = z.object({
  name: z.string().min(1, 'Pet name required'),
  breed_id: z.string().uuid().optional(),
  breed_custom: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().optional(),
  birth_date: z.string().optional(),
  medical_info: z.string().optional(),
  notes: z.string().optional(),
});
```

---

### 4. Profile (`/profile`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\profile\page.tsx`

**Sections**:
1. **Personal Information**
   - First name, last name
   - Email (read-only, linked to auth)
   - Phone number
   - Profile photo

2. **Notification Preferences** (Phase 8)
   - Email appointment reminders
   - SMS appointment reminders
   - Marketing communications
   - Retention reminders

3. **Account Settings**
   - Change password
   - Email preferences
   - Delete account (requires confirmation)

**Update Profile API**:
```typescript
// PUT /api/customer/profile
const { data } = await supabase
  .from('users')
  .update({
    first_name: firstName,
    last_name: lastName,
    phone: phone,
  })
  .eq('id', user.id);
```

---

### 5. Loyalty Program (`/loyalty`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\loyalty\page.tsx`

**Features** (Phase 7):
- Points balance display
- Points history/transactions
- Rewards catalog
- Redeem points interface
- Earning rules explanation

---

### 6. Membership (`/membership`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\membership\page.tsx`

**Features** (Phase 7):
- Current membership status
- Membership benefits
- Billing information
- Upgrade/downgrade options
- Cancel membership

---

### 7. Report Cards (`/report-cards`)
**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\report-cards\page.tsx`

**Features**:
- Grid of all report cards for customer's pets
- Filter by pet
- Sort by date
- Report card preview cards:
  - Before/after photos
  - Date
  - Pet name
  - Mood, coat condition, behavior
- Click to view full report card

**Report Card Detail**:
- Full before/after comparison slider
- Groomer notes
- Health observations
- Services performed
- Share button (generates public UUID link)
- Download PDF button

---

## Layout (`layout.tsx`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\(customer)\layout.tsx`

**Structure**:
```tsx
<div className="min-h-screen bg-[#F8EEE5]">
  <CustomerHeader user={user} />
  <div className="flex">
    <CustomerSidebar />  {/* Desktop only */}
    <main className="flex-1 p-6">
      {children}
    </main>
  </div>
  <MobileBottomNav />  {/* Mobile only */}
</div>
```

**Sidebar Navigation**:
- Dashboard
- Appointments
- Pets
- Profile
- Loyalty
- Membership
- Report Cards
- Logout

---

## Data Flow

### Appointment Cancellation Flow
```
Client                    API Route                  Database
  |                          |                           |
  |-- Cancel request -------->|                           |
  |  (appointment_id)         |-- Verify ownership ------>|
  |                           |<-- User data --------------|
  |                           |                           |
  |                           |-- Check cancellation ----->|
  |                           |   policy (24hr notice)    |
  |                           |                           |
  |                           |-- Update status ---------->|
  |                           |   to 'cancelled'          |
  |                           |<-- Updated ----------------|
  |                           |                           |
  |                           |-- Send cancellation ------>|
  |                           |   notification (Phase 8)  |
  |<-- Success response ------|                           |
```

---

## Security

### Route Protection
**Middleware** checks authentication and role:
```typescript
const protectedRoutes = ['/dashboard', '/appointments', '/pets', '/profile'];

if (!isAuthenticated && protectedRoutes.some(r => pathname.startsWith(r))) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

### RLS Policies
```sql
-- Users can only view their own appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (customer_id = auth.uid());

-- Users can only view their own pets
CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  USING (owner_id = auth.uid());
```

### Data Validation
All mutations validate ownership:
```typescript
// Before updating pet
const { data: pet } = await supabase
  .from('pets')
  .select('owner_id')
  .eq('id', petId)
  .single();

if (pet.owner_id !== user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## State Management

**Customer Store** (Zustand):
```typescript
interface CustomerState {
  selectedPet: Pet | null;
  setSelectedPet: (pet: Pet | null) => void;
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
}
```

**Local State**:
- Modal open/close states
- Form input values
- Filter/sort preferences (persisted to localStorage)

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/customer/appointments` | GET | Fetch user's appointments |
| `/api/customer/appointments/[id]` | PUT | Update appointment |
| `/api/customer/appointments/[id]` | DELETE | Cancel appointment |
| `/api/customer/pets` | GET, POST | Fetch or create pets |
| `/api/customer/pets/[id]` | GET, PUT, DELETE | Pet CRUD operations |
| `/api/customer/profile` | GET, PUT | Profile management |
| `/api/customer/preferences/notifications` | GET, PUT | Notification preferences |

---

## Testing

### Unit Tests
```typescript
describe('Appointment Cancellation', () => {
  it('allows cancellation with 24hr notice', () => {
    const appointment = { scheduled_at: addDays(new Date(), 2) };
    expect(canCancelAppointment(appointment)).toBe(true);
  });

  it('prevents cancellation within 24 hours', () => {
    const appointment = { scheduled_at: addHours(new Date(), 12) };
    expect(canCancelAppointment(appointment)).toBe(false);
  });
});
```

---

## Related Documentation

- [Booking Flow](../components/booking-flow.md)
- [Auth Store](../state/auth-store.md)
- [API Routes](./api.md#customer-endpoints)

---

**Last Updated**: 2025-12-20
