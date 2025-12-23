# CSV Import Fixes - Summary

## Issues Fixed

### 1. API Response Structure Mismatch (NaN Display Issue)
**Problem**: The import API returned `{ success: true, result: {...} }` but the frontend expected the result at the top level, causing all values to display as `NaN`.

**Fix**: Updated `src/components/admin/appointments/csv/ImportProgress.tsx` to extract the nested `result` object:
```typescript
const responseData = await response.json();
// API returns { success: true, result: {...} }, extract the result
const results: CSVImportResult = responseData.result || responseData;
```

### 2. User Profile Creation for CSV Import
**Problem**: Batch processor tried to insert users directly into the `users` table without creating auth accounts, which would fail due to foreign key constraints or missing UUID generation.

**Solution**: Created a database function `create_inactive_user_profile()` that:
- Generates a UUID for the user profile
- Creates an inactive customer profile WITHOUT an auth account
- Allows the customer to claim their account later by registering with the same email
- Handles duplicate emails gracefully (returns existing user ID)

**Files Modified**:
- `src/lib/admin/appointments/batch-processor.ts` - Now uses RPC function
- `supabase/migrations/20250122_create_inactive_user_function.sql` - New migration

### 3. Pet Creation Logic
**Status**: Already working correctly - the batch processor creates pets if they don't exist for the customer.

## Database Migration Required

You need to apply the database migration to create the `create_inactive_user_profile()` function.

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20250122_create_inactive_user_function.sql`
5. Click **Run**

### Option 2: Via Supabase CLI (If Linked)

```bash
# Link your project first (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

## How It Works Now

### CSV Import Flow

1. **Upload CSV** → File is parsed and validated
2. **Validation** → Checks services, sizes, dates, business hours
3. **Duplicate Detection** → Finds existing appointments
4. **Import Process**:
   - For each row:
     - **Check customer exists** (by email, case-insensitive)
       - If exists → Use existing customer
       - If not → Call `create_inactive_user_profile()` function
     - **Check pet exists** (by owner + name)
       - If exists → Use existing pet
       - If not → Create new pet
     - **Create appointment** with all data
     - **Create payment record** (if paid/deposit_paid)
5. **Summary** → Show results with counts

### Inactive Customer Profile Activation

**When admin imports CSV with new customer email:**
1. Function creates inactive profile in `public.users` with:
   - `is_active = false`
   - `created_by_admin = true`
   - `password_hash = NULL`
   - Generated UUID (not linked to auth.users)

**When customer registers later:**
1. Customer goes to registration page
2. Enters same email used in CSV import
3. System checks if profile exists:
   - If inactive profile found → Update to active, link to auth.users
   - If not found → Create new profile
4. Customer can now access their appointments, pets, loyalty points

### Security & Data Integrity

- **RLS Policies**: Only admins can create appointments via CSV
- **Email Uniqueness**: Case-insensitive unique constraint prevents duplicates
- **Password Requirement**: Active accounts MUST have passwords, inactive can be NULL
- **Foreign Keys**: All relationships maintained (customer → pets → appointments)

## Testing Checklist

- [ ] Apply database migration
- [ ] Upload CSV with 91 rows
- [ ] Verify validation shows correct counts
- [ ] Import appointments
- [ ] Check summary shows:
  - `created_count` matches expected
  - `customers_created` shows new profiles
  - `pets_created` shows new pets
  - `inactive_profiles_created` shows customers without accounts
- [ ] Verify appointments appear in `/admin/appointments`
- [ ] Check database:
  ```sql
  -- Count inactive profiles
  SELECT COUNT(*) FROM users WHERE is_active = false AND created_by_admin = true;

  -- View newly created appointments
  SELECT * FROM appointments WHERE creation_method = 'csv_import' ORDER BY created_at DESC LIMIT 10;

  -- Check pets were created
  SELECT p.*, u.email FROM pets p JOIN users u ON p.owner_id = u.id WHERE u.created_by_admin = true;
  ```

## Troubleshooting

### Error: "function create_inactive_user_profile does not exist"
**Solution**: Apply the database migration (see instructions above)

### Error: "Row Level Security policy violation"
**Solution**: Ensure you're logged in as an admin user

### Appointments not showing in dashboard
**Solution**: Check the appointment date range filter - imported appointments may be in the past

### Duplicate email error
**Solution**: The function handles duplicates automatically by returning existing user ID

## Files Changed

1. **Frontend**:
   - `src/components/admin/appointments/csv/ImportProgress.tsx` - Fixed API response parsing

2. **Backend**:
   - `src/lib/admin/appointments/batch-processor.ts` - Uses RPC function for user creation

3. **Database**:
   - `supabase/migrations/20250122_create_inactive_user_function.sql` - New migration (must be applied)

## Next Steps

1. Apply the database migration
2. Test the CSV import with your 91-row file
3. Verify the results in the admin dashboard
4. Check that inactive customer profiles were created correctly
5. (Optional) Test customer activation flow by registering with an imported email

---

**Status**: Ready for testing after migration is applied
**Priority**: High - Required for CSV import to work
**Estimated Time**: 5 minutes to apply migration, 10 minutes to test
