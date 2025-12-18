# Audit Log Usage Guide

This document explains how to use the settings audit log utility (`src/lib/admin/audit-log.ts`) in your API routes.

## Overview

The audit log system tracks all admin settings changes with:
- **Who** made the change (admin_id)
- **What** was changed (setting_type, setting_key)
- **When** it was changed (created_at)
- **Before/After** values (old_value, new_value)

## Fire-and-Forget Pattern

The audit logging uses a **fire-and-forget pattern**, meaning:
- Logging failures will NOT break the main operation
- Errors are logged to console but not thrown
- This ensures settings updates always succeed even if audit logging fails

## Setting Types

Available setting types:
- `booking` - Booking window, cancellation policies, blocked dates
- `loyalty` - Loyalty program earning/redemption rules
- `site_content` - Hero section, SEO, business info
- `banner` - Promo banner settings
- `staff` - Staff commission rates
- `referral` - Referral program settings
- `notification` - Notification templates and preferences
- `other` - Any other settings

## Usage in API Routes

### 1. Import the utility

```typescript
import { logSettingsChange } from '@/lib/admin/audit-log';
import { requireAdmin } from '@/lib/admin/auth';
```

### 2. Get admin user from auth

```typescript
const supabase = await createServerSupabaseClient();
const { user } = await requireAdmin(supabase); // Note: destructure user
```

### 3. Fetch old value before update

```typescript
// Get current value before updating
const { data: existing } = await supabase
  .from('settings')
  .select('value')
  .eq('key', 'booking_settings')
  .maybeSingle();

const oldValue = existing?.value || null;
```

### 4. Perform the update

```typescript
// Update the setting
const { data: updated, error } = await supabase
  .from('settings')
  .update({ value: newSettings })
  .eq('key', 'booking_settings')
  .select()
  .single();

if (error) {
  throw error;
}
```

### 5. Log the change

```typescript
// Log the change (fire-and-forget)
await logSettingsChange(
  supabase,
  user.id,
  'booking', // setting_type
  'booking_settings', // setting_key
  oldValue,
  newSettings
);
```

## Complete Example: Booking Settings API

```typescript
// src/app/api/admin/settings/booking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { BookingSettingsSchema } from '@/types/settings';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const body = await request.json();

    // Validate input
    const validation = BookingSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid booking settings', details: validation.error },
        { status: 400 }
      );
    }

    const newSettings = validation.data;

    // Get old value for audit log
    const { data: existing } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .maybeSingle();

    const oldValue = existing?.value || null;

    // Update settings
    const { data: updated, error } = await supabase
      .from('settings')
      .upsert({
        key: 'booking_settings',
        value: newSettings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the change (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'booking',
      'booking_settings',
      oldValue,
      newSettings
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Admin API] Error updating booking settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Retrieving Audit Logs

### Get recent changes

```typescript
import { getRecentAuditLog } from '@/lib/admin/audit-log';

const recentChanges = await getRecentAuditLog(supabase, 50);
// Returns last 50 changes with admin details
```

### Filter by setting type

```typescript
import { getAuditLog } from '@/lib/admin/audit-log';

const siteContentChanges = await getAuditLog(supabase, {
  setting_type: 'site_content',
  limit: 100,
});
```

### Filter by admin

```typescript
const adminChanges = await getAuditLog(supabase, {
  admin_id: 'admin-user-id',
  limit: 100,
});
```

### Filter by date range

```typescript
const dateFrom = new Date('2024-01-01');
const dateTo = new Date('2024-01-31');

const januaryChanges = await getAuditLog(supabase, {
  date_from: dateFrom,
  date_to: dateTo,
  limit: 100,
});
```

### Get changes for specific setting

```typescript
import { getAuditLogByKey } from '@/lib/admin/audit-log';

const heroChanges = await getAuditLogByKey(supabase, 'hero', 50);
```

### Get statistics

```typescript
import { getAuditLogStats } from '@/lib/admin/audit-log';

const dateFrom = new Date('2024-01-01');
const dateTo = new Date('2024-01-31');

const stats = await getAuditLogStats(supabase, dateFrom, dateTo);
// Returns:
// {
//   total_changes: 42,
//   by_setting_type: { site_content: 15, booking: 12, loyalty: 10, ... },
//   by_admin: { 'admin-id-1': 30, 'admin-id-2': 12 }
// }
```

## Displaying Audit Logs in UI

### Example component

```typescript
// components/admin/AuditLogTable.tsx

import { AuditLogEntryWithAdmin } from '@/lib/admin/audit-log';

interface AuditLogTableProps {
  entries: AuditLogEntryWithAdmin[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Admin</th>
            <th>Setting</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>
                {new Date(entry.created_at).toLocaleString()}
              </td>
              <td>
                {entry.admin
                  ? `${entry.admin.first_name} ${entry.admin.last_name}`
                  : 'Unknown'}
              </td>
              <td>
                <div className="badge badge-primary">
                  {entry.setting_type}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {entry.setting_key}
                </div>
              </td>
              <td>
                <details>
                  <summary className="cursor-pointer">
                    View changes
                  </summary>
                  <div className="mt-2 p-2 bg-base-200 rounded">
                    <div className="mb-2">
                      <strong>Old:</strong>
                      <pre className="text-xs mt-1">
                        {JSON.stringify(entry.old_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong>New:</strong>
                      <pre className="text-xs mt-1">
                        {JSON.stringify(entry.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Best Practices

### 1. Always use fire-and-forget pattern

```typescript
// ✅ Good - fire-and-forget
await logSettingsChange(supabase, user.id, 'booking', 'settings', old, new);

// ❌ Bad - don't wrap in try-catch in the route
try {
  await logSettingsChange(supabase, user.id, 'booking', 'settings', old, new);
} catch (error) {
  // Don't do this - the function already handles errors
}
```

### 2. Use descriptive setting keys

```typescript
// ✅ Good - specific keys
await logSettingsChange(supabase, user.id, 'site_content', 'hero', old, new);
await logSettingsChange(supabase, user.id, 'booking', 'min_advance_hours', old, new);

// ❌ Bad - vague keys
await logSettingsChange(supabase, user.id, 'other', 'setting', old, new);
```

### 3. Always fetch old value

```typescript
// ✅ Good - fetch old value
const { data: existing } = await supabase
  .from('settings')
  .select('value')
  .eq('key', 'booking_settings')
  .maybeSingle();

const oldValue = existing?.value || null;

// ... update ...

await logSettingsChange(supabase, user.id, 'booking', 'booking_settings', oldValue, newValue);

// ❌ Bad - don't use undefined or skip old value
await logSettingsChange(supabase, user.id, 'booking', 'booking_settings', undefined, newValue);
```

### 4. Log after successful update

```typescript
// ✅ Good - log after update succeeds
const { data, error } = await supabase
  .from('settings')
  .update({ value: newSettings })
  .eq('key', 'booking_settings')
  .single();

if (error) {
  throw error;
}

await logSettingsChange(supabase, user.id, 'booking', 'booking_settings', oldValue, newSettings);

// ❌ Bad - log before update
await logSettingsChange(supabase, user.id, 'booking', 'booking_settings', oldValue, newSettings);

const { data, error } = await supabase
  .from('settings')
  .update({ value: newSettings });
// What if this fails? Log entry is already created
```

## Database Schema

```sql
CREATE TABLE public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other')),
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settings_audit_log_admin ON settings_audit_log(admin_id);
CREATE INDEX idx_settings_audit_log_type ON settings_audit_log(setting_type);
CREATE INDEX idx_settings_audit_log_created ON settings_audit_log(created_at DESC);
CREATE INDEX idx_settings_audit_log_key ON settings_audit_log(setting_key);
```

## RLS Policies

Only admins can read audit logs:

```sql
CREATE POLICY "admins_all_access_settings_audit_log"
  ON public.settings_audit_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

## Related Files

- **Utility**: `src/lib/admin/audit-log.ts`
- **Types**: `src/types/settings.ts` (SettingsAuditLog interface)
- **Example**: `src/app/api/admin/settings/site-content/route.ts`
- **Tests**: `__tests__/lib/admin/audit-log.test.ts`
- **Migration**: `supabase/migrations/20241217_phase9_admin_settings_schema.sql`
