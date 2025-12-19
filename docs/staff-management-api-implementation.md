# Staff Management API Implementation

## Overview

All staff management API routes have been successfully implemented for The Puppy Day grooming SaaS application. These routes enable comprehensive staff member management, commission tracking, and earnings reporting.

## Implementation Date

December 19, 2025

## Files Created

### 1. Type Definitions
- **File**: `src/types/database.ts`
- **Changes**:
  - Added `CommissionRateType` enum
  - Added `ServiceOverride` interface
  - Added `StaffCommission` interface
  - Updated `Database` interface to include `staff_commissions` table
  - Updated mock store to include `staff_commissions` and `settings_audit_log` tables

### 2. API Routes

#### Route 1: Staff List & Create (Task 0203)
**File**: `src/app/api/admin/settings/staff/route.ts`

**GET /api/admin/settings/staff**
- Lists all staff members (admin and groomer roles)
- Query Parameters:
  - `role`: Filter by role (groomer|admin|all) - default: all
  - `status`: Filter by status (active|inactive|all) - default: active
- Returns:
  ```typescript
  {
    data: Array<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      role: string;
      avatar_url: string | null;
      created_at: string;
      appointment_count: number;
      upcoming_appointments: number;
      avg_rating: number | null;
      commission_settings: StaffCommission | null;
    }>
  }
  ```
- Features:
  - Counts completed appointments for each staff member
  - Counts upcoming appointments in next 7 days
  - Calculates average rating from report cards
  - Retrieves commission settings
  - Sorts by role DESC (admin first), then last_name ASC
  - Requires admin authentication

**POST /api/admin/settings/staff**
- Creates new staff member
- Request Body:
  ```typescript
  {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: 'groomer' | 'admin';
  }
  ```
- Validates email uniqueness
- Creates audit log entry
- Returns created user with 201 status
- Requires admin authentication

#### Route 2: Staff Detail (Task 0206)
**File**: `src/app/api/admin/settings/staff/[id]/route.ts`

**GET /api/admin/settings/staff/[id]**
- Retrieves detailed information for a single staff member
- Returns:
  ```typescript
  {
    data: {
      profile: User;
      stats: {
        completed_appointments: number;
        upcoming_appointments: number;
        avg_rating: number | null;
      };
      recent_appointments: Array<Appointment & {
        customer: User;
        pet: Pet;
        service: Service;
      }>;
      commission_settings: StaffCommission | null;
    }
  }
  ```
- Features:
  - Verifies user is staff (admin or groomer role)
  - Returns last 10 appointments with related data
  - Calculates stats for upcoming appointments (next 7 days)
  - Returns 404 if staff not found
  - Requires admin authentication

#### Route 3: Commission Settings (Task 0207)
**File**: `src/app/api/admin/settings/staff/[id]/commission/route.ts`

**GET /api/admin/settings/staff/[id]/commission**
- Retrieves commission settings for a groomer
- Returns:
  ```typescript
  {
    data: {
      rate_type: 'percentage' | 'flat_rate';
      rate: number;
      include_addons: boolean;
      service_overrides: Array<{
        service_id: string;
        rate: number;
      }> | null;
    }
  }
  ```
- Returns default settings if none configured:
  - `rate_type: 'percentage'`
  - `rate: 0`
  - `include_addons: false`
  - `service_overrides: null`
- Requires admin authentication

**PUT /api/admin/settings/staff/[id]/commission**
- Updates commission settings for a groomer
- Request Body:
  ```typescript
  {
    rate_type: 'percentage' | 'flat_rate';
    rate: number;
    include_addons: boolean;
    service_overrides?: Array<{
      service_id: string;
      rate: number;
    }>;
  }
  ```
- Validation:
  - `rate_type` required
  - `rate` must be >= 0
  - If `rate_type` is 'percentage', `rate` must be <= 100
  - All `service_id` values in `service_overrides` must exist
- Uses upsert operation (groomer_id is unique)
- Creates audit log entry
- Requires admin authentication

#### Route 4: Earnings Report (Task 0209)
**File**: `src/app/api/admin/settings/staff/earnings/route.ts`

**GET /api/admin/settings/staff/earnings**
- Generates comprehensive earnings report
- Query Parameters (all required):
  - `start_date`: Start date (YYYY-MM-DD)
  - `end_date`: End date (YYYY-MM-DD)
  - `group_by`: Timeline grouping (day|week|month) - default: day
  - `groomer_id`: Optional - filter to specific groomer
- Returns:
  ```typescript
  {
    data: {
      summary: {
        total_services: number;
        total_revenue: number;
        total_commission: number;
        total_tips: number;
      };
      by_groomer: Array<{
        groomer_id: string;
        groomer_name: string;
        services_count: number;
        revenue: number;
        commission: number;
        tips: number;
      }>;
      timeline: Array<{
        period: string;
        services_count: number;
        revenue: number;
        commission: number;
      }>;
    }
  }
  ```
- Features:
  - Calculates commission based on staff_commissions settings:
    - If `rate_type` is 'percentage': `(total_price * rate / 100)`
    - If `rate_type` is 'flat_rate': `rate` per service
    - Applies `service_overrides` if present
    - Includes/excludes addons based on `include_addons` flag
  - Groups timeline by day, week, or month
  - Retrieves tips from payments table
  - Only includes completed appointments
  - Optimized for performance (< 3 seconds for 1 year of data)
  - Requires admin authentication

## Database Schema

### staff_commissions Table
```sql
CREATE TABLE staff_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groomer_id UUID UNIQUE REFERENCES users(id) NOT NULL,
  rate_type TEXT CHECK (rate_type IN ('percentage', 'flat_rate')) NOT NULL,
  rate NUMERIC CHECK (rate >= 0) NOT NULL,
  include_addons BOOLEAN DEFAULT false NOT NULL,
  service_overrides JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Key Features

### 1. Admin Authentication
- All routes use `requireAdmin()` from `@/lib/admin/auth`
- Throws 401 error if not authenticated
- Throws 401 error if user doesn't have admin or groomer role

### 2. Audit Logging
- POST /staff creates audit log for new staff member
- PUT /commission creates audit log for commission changes
- Uses `logSettingsChange()` from `@/lib/admin/audit-log`
- Setting type: 'staff'
- Setting keys:
  - `staff.{id}` for new staff
  - `staff.{id}.commission` for commission updates

### 3. Mock Mode Support
- All routes work in mock mode (`NEXT_PUBLIC_USE_MOCKS=true`)
- Uses mock store for data operations
- Generates IDs using `generateId()` utility
- Persists data in localStorage

### 4. Input Validation
- Uses Zod schemas for request validation
- Returns 400 with detailed error messages on validation failure
- Validates:
  - Email format and uniqueness
  - Required fields (first_name, last_name, role)
  - Rate type and value constraints
  - Service ID existence for overrides

### 5. Error Handling
- Try/catch blocks in all routes
- Specific error messages for different scenarios
- Proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad request / validation error
  - 401: Unauthorized
  - 404: Not found
  - 500: Internal server error
- Console logging for debugging

### 6. Commission Calculation Logic
The earnings report implements sophisticated commission calculation:
1. Check for service-specific override first
2. If override exists, use override rate
3. Otherwise, use default rate from commission settings
4. Apply percentage or flat rate calculation
5. Optionally include/exclude addon revenue

## Performance Considerations

### Earnings Report Optimization
- Fetches all data in single queries
- Uses in-memory calculations for commission
- Groups timeline data efficiently
- Rounds monetary values to 2 decimal places
- Target: < 3 seconds for 1 year of data

### Staff List Optimization
- Single query for staff members
- Parallel queries for stats
- Efficient filtering in database
- Minimal data transfer

## Testing Recommendations

### Unit Tests
1. Test commission calculation logic
2. Test timeline grouping (day/week/month)
3. Test validation schemas
4. Test error handling

### Integration Tests
1. Test complete staff creation flow
2. Test commission settings update
3. Test earnings report generation
4. Test authentication requirements

### Mock Data
- Add seed data for staff_commissions in `src/mocks/supabase/seed.ts`
- Add test appointments with various dates
- Add test payments with tips

## Next Steps

1. **Create Frontend Components**
   - Staff list page with filters
   - Staff detail page with stats
   - Commission settings form
   - Earnings report dashboard with charts

2. **Add Database Migrations**
   - Create staff_commissions table
   - Add indexes for performance
   - Set up RLS policies

3. **Add Tests**
   - Unit tests for commission calculation
   - Integration tests for API routes
   - E2E tests for staff management flow

4. **Documentation**
   - API documentation
   - User guide for staff management
   - Admin guide for commission setup

## Related Files

- **Types**: `src/types/database.ts`
- **Auth Helper**: `src/lib/admin/auth.ts`
- **Audit Logger**: `src/lib/admin/audit-log.ts`
- **Mock Store**: `src/mocks/supabase/store.ts`
- **Server Client**: `src/lib/supabase/server.ts`

## Security Considerations

1. **Authentication**: All routes require admin authentication
2. **Validation**: All inputs validated with Zod schemas
3. **SQL Injection**: Uses parameterized queries via Supabase client
4. **Authorization**: RLS policies should be set up for staff_commissions table
5. **Audit Trail**: All changes logged to settings_audit_log table

## Notes

- All routes support both mock and production modes
- Commission settings use upsert for idempotent updates
- Earnings report filters by completed appointments only
- Average ratings rounded to 1 decimal place
- Monetary values rounded to 2 decimal places
- Next.js 15+ async params pattern used for dynamic routes
