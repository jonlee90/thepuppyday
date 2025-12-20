# Task 0001: Database Schema Modifications

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: Phase 5 (Admin Panel Core) completed
**Estimated Effort**: 3 hours

## Objective

Update database schema to support appointment creation tracking and customer account activation flow.

## Requirements

- REQ-21.1, REQ-21.2, REQ-21.3, REQ-21.4: Audit logging and tracking
- REQ-15.1-15.3: Customer/pet matching and account activation

## Implementation Details

### Schema Changes

**Appointments Table:**
```sql
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS creation_method TEXT CHECK (creation_method IN ('customer_booking', 'manual_admin', 'csv_import')),
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES public.users(id);

-- Default existing appointments to customer_booking
UPDATE public.appointments SET creation_method = 'customer_booking' WHERE creation_method IS NULL;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_appointments_creation_method ON public.appointments(creation_method);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by_admin ON public.appointments(created_by_admin_id);
```

**Users Table (Account Activation Flow):**
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to active status
UPDATE public.users SET is_active = true, created_by_admin = false WHERE is_active IS NULL;

-- Create index for finding inactive profiles
CREATE INDEX IF NOT EXISTS idx_users_inactive_customers
  ON public.users(email, role)
  WHERE is_active = false AND role = 'customer';

-- Constraint: Active accounts must have password
ALTER TABLE public.users
  ADD CONSTRAINT chk_active_has_password
  CHECK (is_active = false OR password_hash IS NOT NULL);
```

### Mock Data Service Updates

Update `src/mocks/services/*.ts` to support new fields:
- Add `creation_method` and `created_by_admin_id` to mock appointments
- Add `is_active`, `created_by_admin`, `activated_at` to mock users
- Ensure existing mock data defaults properly

## Acceptance Criteria

- [x] Appointments table has creation tracking columns
- [x] Existing appointments default to 'customer_booking'
- [x] Users table has account activation columns
- [x] Existing users have is_active=true, created_by_admin=false
- [x] Indexes created for query performance
- [x] Constraint enforces password requirement for active accounts
- [x] Mock services support new fields
- [x] Migration runs successfully

## Implementation Status

**Status**: ✅ COMPLETED (2025-01-20)

**Files Created/Modified**:
1. `supabase/migrations/20250120_admin_appointment_management_schema.sql` - Main migration file
2. `src/types/database.ts` - Updated TypeScript types for User and Appointment interfaces
3. `src/mocks/supabase/seed.ts` - Updated mock data with new schema fields
4. `docs/specs/admin-appointment-management/implementation-summary-0001.md` - Implementation documentation

**See**: `docs/specs/admin-appointment-management/implementation-summary-0001.md` for complete details.

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-15, 21)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 1.1, 1.4)
