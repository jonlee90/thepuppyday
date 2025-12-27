# Supabase Service - Architecture Documentation

> **Module**: Supabase Integration
> **Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\supabase\`
> **Status**: ✅ Completed
> **Provider**: Supabase (PostgreSQL + Auth + Storage + Realtime)

## Overview

Supabase provides the backend infrastructure for The Puppy Day application, including PostgreSQL database, authentication, file storage, and real-time subscriptions.

---

## Client Configuration

### Browser Client (`client.ts`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\supabase\client.ts`

**Purpose**: Client-side Supabase client for browser usage.

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { config } from '@/lib/config';

let browserClient: AppSupabaseClient | null = null;

export function createClient(): AppSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  if (config.useMocks) {
    browserClient = createMockClient();
  } else {
    browserClient = createBrowserClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }

  return browserClient;
}
```

**Usage in Components**:
```typescript
'use client';
import { createClient } from '@/lib/supabase/client';

export function MyComponent() {
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('services').select('*');
    }
    fetchData();
  }, []);
}
```

---

### Server Client (`server.ts`)

**File**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\supabase\server.ts`

**Purpose**: Server-side Supabase client for API routes and Server Components.

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

**Usage in Server Components**:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('services').select('*');

  return <div>{/* Render data */}</div>;
}
```

**Usage in API Routes**:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with authenticated request
}
```

---

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Create user profile in users table
await supabase.from('users').insert({
  id: data.user.id,
  email: data.user.email,
  first_name: firstName,
  last_name: lastName,
  role: 'customer',
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Password Reset
```typescript
// Request reset
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  }
);

// Update password (after redirect)
const { data, error } = await supabase.auth.updateUser({
  password: 'newSecurePassword123',
});
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

## Database Queries

### Select
```typescript
// Simple select
const { data, error } = await supabase
  .from('appointments')
  .select('*');

// Select with joins
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    customer:users!customer_id(first_name, last_name, email),
    pet:pets!pet_id(name, size, breed_id),
    service:services!service_id(name, duration_minutes)
  `);

// Select with filters
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('customer_id', userId)
  .gte('scheduled_at', new Date().toISOString())
  .order('scheduled_at', { ascending: true });

// Select with pagination
const page = 1;
const limit = 25;
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .range((page - 1) * limit, page * limit - 1);
```

### Insert
```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    customer_id: userId,
    pet_id: petId,
    service_id: serviceId,
    scheduled_at: '2025-01-15T10:00:00Z',
    status: 'pending',
    total_price: 65.00,
  })
  .select()
  .single();
```

### Update
```typescript
const { data, error } = await supabase
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId)
  .select()
  .single();
```

### Delete
```typescript
const { error } = await supabase
  .from('appointments')
  .delete()
  .eq('id', appointmentId);
```

---

## Row-Level Security (RLS)

### Policy Examples

**Users can view their own appointments**:
```sql
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (customer_id = auth.uid());
```

**Admins can view all appointments**:
```sql
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (is_admin());
```

**Users can insert their own appointments**:
```sql
CREATE POLICY "Users can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (customer_id = auth.uid());
```

### Helper Functions

**is_admin()**:
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;
```

**is_staff()**:
```sql
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'groomer')
  );
$$;
```

**Note**: `SECURITY DEFINER` prevents infinite recursion in RLS policies.

---

## Storage

### Upload File
```typescript
const file = event.target.files[0];

// Compress image before upload
const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
});

// Upload to storage
const fileName = `${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('gallery')
  .upload(`public/${fileName}`, compressedFile);

if (data) {
  const publicUrl = supabase.storage
    .from('gallery')
    .getPublicUrl(data.path).data.publicUrl;
}
```

### Delete File
```typescript
const { error } = await supabase.storage
  .from('gallery')
  .remove(['public/image.jpg']);
```

### Storage Policies
```sql
-- Authenticated users can upload
CREATE POLICY "Authenticated can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery' AND
    auth.role() = 'authenticated'
  );

-- Public can view
CREATE POLICY "Public can view"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');
```

---

## Real-Time Subscriptions

### Subscribe to Table Changes
```typescript
useEffect(() => {
  const channel = supabase
    .channel('appointments')
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'appointments',
      },
      (payload) => {
        console.log('Change received!', payload);
        // Update local state
        fetchAppointments();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Filter by Specific Rows
```typescript
const channel = supabase
  .channel('user-appointments')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'appointments',
      filter: `customer_id=eq.${userId}`,
    },
    handleUpdate
  )
  .subscribe();
```

---

## Type Safety

**Generated Types** (from Supabase CLI):
```bash
npx supabase gen types typescript --project-id your-project > src/types/supabase.ts
```

**Usage**:
```typescript
import { Database } from '@/types/supabase';

const supabase = createClient<Database>();

// Fully typed queries
const { data } = await supabase
  .from('appointments')
  .select('*, customer:users(*)');
// TypeScript knows exact shape of returned data
```

**Custom Types** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\types\database.ts`):
```typescript
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  // ... more fields
}

export interface Appointment {
  id: string;
  customer_id: string;
  pet_id: string;
  service_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  // ... more fields

  // Joined data (optional)
  customer?: User;
  pet?: Pet;
  service?: Service;
}
```

---

## Mock Mode

**Development with Mock Data**:

When `NEXT_PUBLIC_USE_MOCKS=true`, the app uses an in-memory mock database instead of real Supabase.

**Mock Client** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\mocks\supabase\client.ts`):
```typescript
export function createMockClient(): MockSupabaseClient {
  return {
    from: (table: string) => createMockQueryBuilder(table),
    auth: createMockAuth(),
    storage: createMockStorage(),
    // ... mock implementations
  };
}
```

**Benefits**:
- Fast development without external dependencies
- Seeded test data
- No API rate limits
- Deterministic behavior for testing

---

## Error Handling

**Pattern**:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*');

if (error) {
  console.error('Database error:', error);
  // Handle error appropriately
  throw new Error('Failed to fetch appointments');
}

// Use data safely
return data;
```

**Common Errors**:
- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation
- `42501`: Insufficient privilege (RLS policy)

---

---

## Phase 11: Calendar Error Recovery

### New Tables

#### `calendar_sync_retry_queue`
Stores failed calendar sync operations for retry with exponential backoff.

```typescript
const { data, error } = await supabase
  .from('calendar_sync_retry_queue')
  .insert({
    calendar_connection_id: connectionId,
    operation_type: 'create',
    appointment_id: appointmentId,
    event_data: eventPayload,
    error_type: 'auth_error',
    error_message: 'Token expired',
    retry_count: 0,
    max_retries: 3,
    next_retry_at: new Date(Date.now() + 60000).toISOString() // 1 minute
  });
```

**Retry Logic**:
- First retry: 1 minute
- Second retry: 5 minutes
- Third retry: 15 minutes
- Max 3 attempts, then manual intervention required

#### `calendar_api_quota`
Tracks daily Google Calendar API usage.

```typescript
// Increment quota (via stored procedure)
const { error } = await supabase.rpc('increment_quota', {
  target_date: new Date().toISOString().split('T')[0]
});

// Check quota status
const { data } = await supabase
  .from('calendar_api_quota')
  .select('*')
  .eq('date', new Date().toISOString().split('T')[0])
  .single();

const percentageUsed = (data.request_count / data.daily_limit) * 100;
const isWarning = percentageUsed >= data.warning_threshold;
```

### Updated Tables

#### `calendar_connections` (Phase 11 Fields)
Added error tracking fields for auto-pause functionality.

```typescript
const { data, error } = await supabase
  .from('calendar_connections')
  .update({
    consecutive_failures: 0,      // Reset on success
    auto_sync_paused: false,      // Resume sync
    paused_at: null,
    pause_reason: null
  })
  .eq('id', connectionId);

// Auto-pause after 10 consecutive failures
if (consecutiveFailures >= 10) {
  await supabase
    .from('calendar_connections')
    .update({
      auto_sync_paused: true,
      paused_at: new Date().toISOString(),
      pause_reason: 'Automatic pause after 10 consecutive failures'
    })
    .eq('id', connectionId);
}
```

### New Stored Procedures

#### `increment_quota(target_date DATE)`
```typescript
// Called automatically by calendar sync service
const { error } = await supabase.rpc('increment_quota', {
  target_date: '2025-12-26'
});
```

#### `cleanup_retry_queue()`
```typescript
// Run daily via cron job
const { data } = await supabase.rpc('cleanup_retry_queue');
console.log(`Cleaned up ${data} old retry entries`);
```

#### `cleanup_quota_records()`
```typescript
// Run weekly via cron job
const { data } = await supabase.rpc('cleanup_quota_records');
console.log(`Cleaned up ${data} old quota records`);
```

### New Views

#### `retry_queue_summary`
```typescript
const { data } = await supabase
  .from('retry_queue_summary')
  .select('*');

// Returns aggregated retry queue stats
// {
//   operation_type: 'create',
//   error_type: 'auth_error',
//   pending_count: 5,
//   avg_retries: 1.8,
//   max_retries: 3
// }
```

#### `calendar_health_summary`
```typescript
const { data } = await supabase
  .from('calendar_health_summary')
  .select('*');

// Returns connection health for all active connections
// {
//   id: 'uuid',
//   user_id: 'uuid',
//   provider: 'google',
//   auto_sync_enabled: true,
//   auto_sync_paused: false,
//   consecutive_failures: 2,
//   last_sync_at: '2025-12-26T10:00:00Z',
//   pending_retries: 3
// }
```

### Security Patterns (Phase 11)

#### RLS Policies for New Tables

**calendar_sync_retry_queue**:
```sql
-- Admins can view all retry entries
CREATE POLICY "Admins can view retry queue"
  ON calendar_sync_retry_queue FOR SELECT
  USING (is_admin());

-- System can insert/update retry entries
CREATE POLICY "System can manage retry queue"
  ON calendar_sync_retry_queue FOR ALL
  USING (auth.role() = 'service_role');
```

**calendar_api_quota**:
```sql
-- Admins can view quota
CREATE POLICY "Admins can view quota"
  ON calendar_api_quota FOR SELECT
  USING (is_admin());

-- System can update quota
CREATE POLICY "System can manage quota"
  ON calendar_api_quota FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Related Documentation

- [Database Schema](../ARCHITECTURE.md#database-schema)
- [RLS Policies](../security/rls.md)
- [Mock Services](../testing/mocks.md)
- [Calendar Settings UI](../routes/admin-panel.md#97-calendar-settings-adminsettingscalendar-)

---

**Last Updated**: 2025-12-26
