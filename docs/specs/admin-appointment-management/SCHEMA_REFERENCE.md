# Admin Appointment Management - Schema Reference

## Overview

This document provides a quick reference for the database schema modifications introduced in Task 0001 for the Admin Appointment Management feature set.

## New Database Fields

### Appointments Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `creation_method` | TEXT | NO | 'customer_booking' | How the appointment was created |
| `created_by_admin_id` | UUID | YES | NULL | Admin user ID if manually created |

**creation_method Values**:
- `customer_booking` - Created through customer self-service booking widget
- `manual_admin` - Manually created by admin in admin panel
- `csv_import` - Bulk imported from CSV file

**Indexes**:
- `idx_appointments_creation_method` - Filter by creation method
- `idx_appointments_created_by_admin` - Find appointments created by specific admin

**Joined Data**:
```typescript
appointment.created_by_admin?: User  // Admin who created it (if applicable)
```

### Users Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `is_active` | BOOLEAN | NO | true | Whether account is activated |
| `created_by_admin` | BOOLEAN | NO | false | Whether profile was created by admin |
| `activated_at` | TIMESTAMP WITH TIME ZONE | YES | NULL | When account was activated |

**Indexes**:
- `idx_users_inactive_customers` - Find inactive customer profiles (WHERE is_active = false AND role = 'customer')
- `idx_users_created_by_admin` - Find admin-created profiles (WHERE created_by_admin = true)

**Constraint**:
- `chk_active_has_password` - Active accounts must have password_hash set

## TypeScript Types

### AppointmentCreationMethod

```typescript
export type AppointmentCreationMethod = 'customer_booking' | 'manual_admin' | 'csv_import';
```

### Updated Appointment Interface

```typescript
export interface Appointment extends BaseEntity {
  // ... existing fields ...
  creation_method: AppointmentCreationMethod;
  created_by_admin_id: string | null;
  // ... other fields ...

  // Joined data
  created_by_admin?: User;  // Admin who created it
}
```

### Updated User Interface

```typescript
export interface User extends BaseEntity {
  // ... existing fields ...
  is_active: boolean;
  created_by_admin: boolean;
  activated_at: string | null;
  // ... other fields ...
}
```

### Updated CreateAppointmentInput

```typescript
export interface CreateAppointmentInput {
  // ... existing fields ...
  creation_method?: AppointmentCreationMethod;  // Optional, defaults to 'customer_booking'
  created_by_admin_id?: string;  // Set if manual/CSV creation
}
```

## Usage Examples

### Creating an Appointment (Customer Booking)

```typescript
// Customer booking - creation_method defaults to 'customer_booking'
const { data, error } = await supabase
  .from('appointments')
  .insert({
    customer_id: userId,
    pet_id: petId,
    service_id: serviceId,
    scheduled_at: appointmentTime,
    duration_minutes: 60,
    total_price: 100,
    status: 'pending',
    payment_status: 'pending',
    // creation_method defaults to 'customer_booking'
    // created_by_admin_id is NULL
  })
  .select()
  .single();
```

### Creating an Appointment (Admin Manual)

```typescript
// Admin manually creates appointment
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('appointments')
  .insert({
    customer_id: customerId,
    pet_id: petId,
    service_id: serviceId,
    scheduled_at: appointmentTime,
    duration_minutes: 60,
    total_price: 100,
    status: 'confirmed',
    payment_status: 'pending',
    creation_method: 'manual_admin',
    created_by_admin_id: user.id,  // Track which admin created it
  })
  .select()
  .single();
```

### Creating an Inactive Customer Profile

```typescript
// Admin creates customer profile (awaiting activation)
const { data, error } = await supabase
  .from('users')
  .insert({
    email: 'customer@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    phone: '+15551234567',
    role: 'customer',
    is_active: false,  // Not yet activated
    created_by_admin: true,  // Created by admin
    // No password_hash yet - will be set during activation
    // activated_at is NULL until customer activates
  })
  .select()
  .single();
```

### Activating a Customer Account

```typescript
// Customer sets password and activates account
const { data, error } = await supabase
  .from('users')
  .update({
    is_active: true,
    activated_at: new Date().toISOString(),
    password_hash: hashedPassword,  // Set during activation
  })
  .eq('id', userId)
  .select()
  .single();
```

### Querying Inactive Customer Profiles

```typescript
// Find customers awaiting activation (for admin panel)
const { data: inactiveCustomers } = await supabase
  .from('users')
  .select('id, email, first_name, last_name, phone, created_at')
  .eq('role', 'customer')
  .eq('is_active', false)
  .eq('created_by_admin', true)
  .order('created_at', { ascending: false });

// Or use the view
const { data: inactiveCustomers } = await supabase
  .from('inactive_customer_profiles')
  .select('*');
```

### Filtering Appointments by Creation Method

```typescript
// Get all manually created appointments
const { data: manualAppointments } = await supabase
  .from('appointments')
  .select('*, created_by_admin:users!created_by_admin_id(*)')
  .eq('creation_method', 'manual_admin')
  .order('created_at', { ascending: false });

// Get all CSV imported appointments
const { data: importedAppointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('creation_method', 'csv_import')
  .order('created_at', { ascending: false });
```

### Audit Log Query

```typescript
// Get appointment creation audit log
const { data: auditLog } = await supabase
  .from('appointments')
  .select(`
    id,
    created_at,
    creation_method,
    created_by_admin:users!created_by_admin_id(
      id,
      email,
      first_name,
      last_name
    ),
    customer:users!customer_id(
      email,
      first_name,
      last_name
    )
  `)
  .not('creation_method', 'eq', 'customer_booking')  // Exclude customer bookings
  .order('created_at', { ascending: false });
```

## Views

### inactive_customer_profiles

Convenience view for finding customer profiles awaiting activation.

```sql
CREATE OR REPLACE VIEW public.inactive_customer_profiles AS
SELECT
  id,
  email,
  first_name,
  last_name,
  phone,
  created_at,
  created_by_admin
FROM public.users
WHERE
  role = 'customer'
  AND is_active = false
  AND created_by_admin = true
ORDER BY created_at DESC;
```

**Usage**:
```typescript
const { data } = await supabase
  .from('inactive_customer_profiles')
  .select('*');
```

## Business Logic

### Account Activation Flow

1. **Admin Creates Profile**:
   ```typescript
   // is_active = false
   // created_by_admin = true
   // password_hash = NULL (allowed by constraint)
   // activated_at = NULL
   ```

2. **System Sends Activation Email**:
   - Generate secure token
   - Send email with activation link
   - Link includes token for verification

3. **Customer Activates Account**:
   ```typescript
   // is_active = true
   // activated_at = NOW()
   // password_hash = SET (required by constraint)
   ```

### Appointment Creation Tracking

Always set `creation_method` and `created_by_admin_id` appropriately:

| Scenario | creation_method | created_by_admin_id |
|----------|-----------------|---------------------|
| Customer books online | 'customer_booking' | NULL |
| Admin creates manually | 'manual_admin' | Admin user ID |
| Bulk CSV import | 'csv_import' | Admin user ID |

## Mock Data

All mock seed data has been updated to include the new fields:

**Users**:
```typescript
{
  is_active: true,
  created_by_admin: false,
  activated_at: new Date().toISOString(),
}
```

**Appointments**:
```typescript
{
  creation_method: 'customer_booking',
  created_by_admin_id: null,
}
```

## Migration File

Location: `supabase/migrations/20250120_admin_appointment_management_schema.sql`

To apply:
```bash
# Local development
npx supabase migration apply

# Production
npx supabase db push
```

## Related Documents

- **Task File**: `docs/specs/admin-appointment-management/tasks/0001-database-schema-modifications.md`
- **Implementation Summary**: `docs/specs/admin-appointment-management/implementation-summary-0001.md`
- **Requirements**: `docs/specs/admin-appointment-management/requirements.md`
- **Design**: `docs/specs/admin-appointment-management/design.md`
