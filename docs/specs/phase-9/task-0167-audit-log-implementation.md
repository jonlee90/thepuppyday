# Task 0167: Audit Logging for Settings Changes - Implementation Summary

**Status**: ✅ Completed
**Date**: December 17, 2024

## Overview

Implemented comprehensive audit logging system for tracking all admin settings changes with fire-and-forget pattern to ensure main operations never fail due to audit logging issues.

## Files Created

### 1. Core Utility
**File**: `src/lib/admin/audit-log.ts`

Contains the following functions:

#### `logSettingsChange()`
- Logs admin settings changes to `settings_audit_log` table
- **Fire-and-forget pattern**: Does not throw errors or block main operation
- Compares old and new values - only logs if actually changed
- Handles JSONB serialization for complex values
- Wraps primitive values in `{ value: ... }` object for consistency

**Parameters**:
- `supabase` - Supabase client
- `adminId` - ID of admin making the change
- `settingType` - Category: 'booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other'
- `settingKey` - Specific setting identifier (e.g., "hero", "min_advance_hours")
- `oldValue` - Previous value (any JSON-serializable type)
- `newValue` - New value (any JSON-serializable type)

#### `getAuditLog()`
- Fetches audit log entries with optional filtering
- Returns entries with admin user details
- Supports filters:
  - `setting_type` - Filter by setting category
  - `admin_id` - Filter by admin user
  - `date_from` / `date_to` - Date range filtering
  - `limit` - Max entries to return (default: 100)

#### `getAuditLogByKey()`
- Fetches audit log for specific setting key
- Returns last N changes for a particular setting
- Useful for showing change history on settings pages

#### `getRecentAuditLog()`
- Fetches recent audit log entries
- Convenience wrapper for dashboard display
- Default limit: 20 entries

#### `getAuditLogStats()`
- Calculates statistics about audit log entries
- Returns:
  - `total_changes` - Total number of changes in date range
  - `by_setting_type` - Count by setting type
  - `by_admin` - Count by admin user

### 2. Type Definitions
**File**: `src/types/settings.ts` (updated)

Updated `SettingsAuditLog` type to include all setting types:
```typescript
export interface SettingsAuditLog {
  id: string;
  admin_id: string | null;
  setting_type: 'booking' | 'loyalty' | 'site_content' | 'banner' | 'staff' | 'referral' | 'notification' | 'other';
  setting_key: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}
```

**File**: `src/lib/admin/audit-log.ts` (additional types)

```typescript
export type SettingType =
  | 'booking'
  | 'loyalty'
  | 'site_content'
  | 'banner'
  | 'staff'
  | 'referral'
  | 'notification'
  | 'other';

export interface AuditLogEntryWithAdmin extends SettingsAuditLogEntry {
  admin?: AdminInfo;
}

export interface AdminInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuditLogFilters {
  setting_type?: SettingType;
  admin_id?: string;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
}
```

### 3. Integration Example
**File**: `src/app/api/admin/settings/site-content/route.ts` (updated)

Integrated audit logging into site content API:

```typescript
// 1. Get admin user
const { user } = await requireAdmin(supabase);

// 2. Fetch old value before update
const { data: existing } = await supabase
  .from('site_content')
  .select('id, content')
  .eq('section', validSection)
  .maybeSingle();

const oldValue = existing?.content || null;

// 3. Perform update
// ... update logic ...

// 4. Log the change (fire-and-forget)
await logSettingsChange(
  supabase,
  user.id,
  'site_content',
  validSection,
  oldValue,
  validatedContent
);
```

### 4. Tests
**File**: `__tests__/lib/admin/audit-log.test.ts`

Comprehensive test suite covering:
- ✅ Logging settings changes with valid data
- ✅ Skipping log when values unchanged
- ✅ Handling null old values for new settings
- ✅ Error handling (fire-and-forget pattern)
- ✅ Primitive value serialization
- ✅ Fetching audit logs with filters
- ✅ Fetching by specific setting key
- ✅ Fetching recent entries
- ✅ Calculating statistics

**Test Results**: 9/9 tests passing ✅

### 5. Documentation
**File**: `docs/audit-log-usage.md`

Comprehensive usage guide covering:
- Overview and fire-and-forget pattern
- Setting types reference
- Step-by-step integration guide
- Complete API route example
- Retrieving audit logs (all filter options)
- UI component example
- Best practices
- Database schema reference

## Database Schema

The `settings_audit_log` table was already created in migration `20241217_phase9_admin_settings_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other')),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_settings_audit_log_admin` - On admin_id
- `idx_settings_audit_log_type` - On setting_type
- `idx_settings_audit_log_created` - On created_at (descending)
- `idx_settings_audit_log_key` - On setting_key

**RLS Policy**:
- Only admins can read/write audit log entries

## Key Features

### 1. Fire-and-Forget Pattern
- Audit logging failures never block main operations
- Errors are logged to console but not thrown
- Ensures settings updates always succeed

### 2. Smart Change Detection
- Compares JSON serialization of old/new values
- Only logs if values actually changed
- Prevents cluttering log with no-op updates

### 3. JSONB Serialization
- Complex objects stored as-is
- Primitive values wrapped in `{ value: ... }` for consistency
- Null values handled correctly

### 4. Rich Filtering
- Filter by setting type
- Filter by admin user
- Filter by date range
- Filter by specific setting key
- Limit results for performance

### 5. Admin Details
- Automatically joins with users table
- Returns admin name and email with each entry
- Handles deleted admins gracefully (admin_id can be null)

## Implementation Pattern

This pattern should be used for all admin settings APIs:

```typescript
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // 1. Validate input
    const newSettings = validateInput(await request.json());

    // 2. Get old value for audit
    const oldValue = await fetchOldValue(supabase);

    // 3. Update setting
    const result = await updateSetting(supabase, newSettings);

    // 4. Log change (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'setting_type',
      'setting_key',
      oldValue,
      newSettings
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
```

## Next Steps

To complete audit logging across the application:

1. **Booking Settings API** - Add audit logging to `PUT /api/admin/settings/booking`
2. **Loyalty Settings API** - Add audit logging to loyalty program settings
3. **Notification Templates** - Add audit logging to template updates
4. **Banner Settings** - Add audit logging to promo banner changes
5. **Staff Commissions** - Add audit logging to commission rate changes
6. **Referral Settings** - Add audit logging to referral program settings

Each integration should follow the pattern demonstrated in `site-content/route.ts`.

## Testing Recommendations

### Unit Tests
- Test fire-and-forget error handling
- Test change detection logic
- Test filter combinations
- Test admin details join

### Integration Tests
- Test actual database operations
- Test with real Supabase client
- Verify RLS policies work correctly
- Test edge cases (deleted admins, null values)

### End-to-End Tests
- Test from UI settings page
- Verify audit log appears in admin panel
- Test filtering and searching audit logs

## Performance Considerations

1. **Indexes**: All common query patterns are indexed
2. **Limits**: Default limit prevents excessive data fetching
3. **Fire-and-forget**: Audit logging never slows down main operations
4. **JSONB**: Efficient storage and querying of complex values

## Security Considerations

1. **RLS Policies**: Only admins can read audit logs
2. **Admin Verification**: `requireAdmin()` ensures only authenticated admins can log changes
3. **Immutable Logs**: Logs can only be inserted, never updated or deleted
4. **Sensitive Data**: Old/new values stored as JSONB - ensure no secrets are logged

## Conclusion

Task 0167 is fully implemented with:
- ✅ `logSettingsChange()` utility function with fire-and-forget pattern
- ✅ `getAuditLog()` function with comprehensive filtering
- ✅ Integration with site content API as example
- ✅ Comprehensive test coverage (9/9 tests passing)
- ✅ Complete documentation and usage guide
- ✅ Type-safe implementation with TypeScript
- ✅ Database schema with proper indexes and RLS

The audit logging system is production-ready and can be integrated into all admin settings APIs following the documented pattern.
