# Supabase Service - Architecture Documentation

> **Module**: Supabase Integration
> **Location**: `src/lib/supabase/`
> **Status**: Completed
> **Provider**: Supabase (PostgreSQL + Auth + Storage + Realtime)
> **Last Updated**: 2026-05-03 (verified — no drift)

## Overview

Supabase provides the backend infrastructure for The Puppy Day application, including PostgreSQL database, authentication, file storage, and real-time subscriptions. The client layer supports mock mode for development without external dependencies.

---

## Client Configuration

### Browser Client (`client.ts`)

**File**: `src/lib/supabase/client.ts`

**Purpose**: Client-side Supabase client for browser usage. Singleton pattern with mock support.

**Exports**:
```typescript
// Primary client creation function
export function createClient(): AppSupabaseClient

// Alias - get existing client or create new one
export function getClient(): AppSupabaseClient
```

**Implementation**:
```typescript
import { config } from '@/lib/config';
import { createMockClient } from '@/mocks/supabase/client';
import { createBrowserClient } from '@supabase/ssr';

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

export function getClient(): AppSupabaseClient {
  if (!browserClient) {
    return createClient();
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

**Type**: `AppSupabaseClient = MockSupabaseClient | SupabaseClient`

---

### Server Client (`server.ts`)

**File**: `src/lib/supabase/server.ts`

**Purpose**: Server-side Supabase client for API routes and Server Components. Three functions exported.

**Exports**:
```typescript
// Primary server client with cookie-based auth
export async function createServerSupabaseClient(): Promise<AppSupabaseClient>

// Service role client that bypasses RLS
export function createServiceRoleClient(): SupabaseClient | MockSupabaseClient

// Alias for createServerSupabaseClient (backward compatibility)
export const createClient = createServerSupabaseClient;
```

#### createServerSupabaseClient()

Creates a Supabase client with cookie-based authentication for Server Components and Route Handlers.

```typescript
import { config } from '@/lib/config';
import { createMockClient } from '@/mocks/supabase/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient(): Promise<AppSupabaseClient> {
  const cookieStore = await cookies();

  if (config.useMocks) {
    // Pass cookies to mock client for server-side auth
    return createMockClient({
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });
  }

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components (middleware handles session refresh)
          }
        },
      },
    }
  );
}
```

**Mock-Aware Cookie Forwarding**: When `config.useMocks` is true, the mock client receives a `cookies` option so the `MockAuth` class can read the Zustand auth cookie (`auth-storage`) from the server-side cookie store. This enables the mock auth system to reconstruct the user session in API routes.

#### createServiceRoleClient()

**CRITICAL**: Creates a Supabase client with the service role key, which **bypasses all RLS policies**. Only use for trusted server-side operations where the authenticated user's permissions are insufficient (e.g., admin API routes that query customer data).

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceRoleClient(): SupabaseClient | MockSupabaseClient {
  if (config.useMocks) {
    return createMockClient();
  }

  return createSupabaseClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

**Admin API + RLS Pattern**: When creating admin API routes that query customer data:
1. Authenticate with `createServerSupabaseClient()` + `requireAdmin()`
2. Query data with `createServiceRoleClient()` to bypass RLS

Two variable naming patterns exist in the codebase (both are valid):
- **Pattern A**: `authSupabase` (session) / `supabase` (service role)
- **Pattern B**: `supabase` (session) / `serviceClient` (service role)

```typescript
// Example: Admin API route (Pattern A — preferred for new routes)
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  // Step 1: Authenticate the admin
  const authSupabase = await createServerSupabaseClient();
  await requireAdmin(authSupabase);

  // Step 2: Query with service role to bypass RLS
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('appointments')
    .select('*, customer:users(*)');

  return NextResponse.json(data);
}
```

#### createClient (alias)

```typescript
export const createClient = createServerSupabaseClient;
```

Backward compatibility alias. Same function, different name.

---

## Mock Client

**File**: `src/mocks/supabase/client.ts`

**Purpose**: In-memory Supabase client that mimics the real API for development and testing.

**Options**:
```typescript
interface MockClientOptions {
  cookies?: {
    getAll: () => { name: string; value: string }[];
  };
}

export function createMockClient(options?: MockClientOptions): MockSupabaseClient
```

**Supported APIs**:

| API | Mock Implementation |
|-----|---------------------|
| `from(table).select()` | In-memory query builder with filters, ordering, pagination |
| `from(table).insert()` | Adds to in-memory store with auto-generated IDs |
| `from(table).update()` | Updates matching records in store |
| `from(table).delete()` | Removes matching records from store |
| `from(table).upsert()` | Acts like insert in mock mode |
| `auth.signUp()` | Creates user in mock store |
| `auth.signInWithPassword()` | Finds user by email (accepts any password) |
| `auth.signOut()` | Clears session |
| `auth.getUser()` | Returns current mock user |
| `auth.getSession()` | Returns current mock session |
| `auth.resetPasswordForEmail()` | Logs to console |
| `auth.updateUser()` | Updates user metadata |
| `auth.onAuthStateChange()` | Fires initial callback |
| `storage.from(bucket).upload()` | Logs to console, returns mock path |
| `storage.from(bucket).getPublicUrl()` | Returns `/mock-storage/...` URL |
| `storage.from(bucket).remove()` | Logs to console |
| `rpc(functionName, params)` | Supports `increment_banner_clicks` |

**Query Builder Features**:
- Filters: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `ilike`, `like`, `not`
- Ordering: `order(column, { ascending })`
- Pagination: `limit(count)`, `range(from, to)`
- Single result: `single()`, `maybeSingle()`
- Foreign key joins: `select('*, prices:service_prices(*)')` - parses join syntax and enriches records
- Inner joins: `select('*, table!inner(column)')` - filters by related table

**Mock Auth Session Persistence**:
- Client-side: Uses `localStorage` with key `thepuppyday_mock_auth`
- Server-side: Reads Zustand auth cookie (`auth-storage`) from cookie store

---

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: { first_name: 'John', last_name: 'Doe', phone: '5551234567' },
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
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

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Password Reset
```typescript
await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});

// After redirect
await supabase.auth.updateUser({ password: 'newPassword123' });
```

---

## Database Queries

### Select
```typescript
// Simple select
const { data, error } = await supabase.from('appointments').select('*');

// Select with joins
const { data } = await supabase
  .from('appointments')
  .select(`
    *,
    customer:users!customer_id(first_name, last_name, email),
    pet:pets!pet_id(name, size, breed_id),
    service:services!service_id(name, duration_minutes)
  `);

// Select with filters and ordering
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('customer_id', userId)
  .gte('scheduled_at', new Date().toISOString())
  .order('scheduled_at', { ascending: true });

// Pagination
const { data } = await supabase
  .from('appointments')
  .select('*')
  .range(0, 24); // First 25 rows
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

### Helper Functions

```sql
-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Check if current user is staff (admin or groomer)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'groomer')
  );
$$;
```

**Note**: `SECURITY DEFINER` prevents infinite recursion in RLS policies that query the `users` table.

---

## Storage

### Upload File
```typescript
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

---

## Real-Time Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel('appointments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
      },
      (payload) => {
        fetchAppointments(); // Refresh local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Type Safety

**Custom Types** (`src/types/database.ts`):
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
  customer?: User;
  pet?: Pet;
  service?: Service;
}
```

---

## Error Handling

**Pattern**:
```typescript
const { data, error } = await supabase
  .from('appointments')
  .select('*');

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch appointments');
}

return data;
```

**Common PostgreSQL Error Codes**:
- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation
- `42501`: Insufficient privilege (RLS policy)

---

## Environment Variables

| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (for RLS-protected queries) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS, server-only) |
| `NEXT_PUBLIC_USE_MOCKS` | Set to `true` for mock mode |

---

## Related Documentation

- [Database Schema](../ARCHITECTURE.md#database-schema)
- [Admin API + RLS Pattern](../ARCHITECTURE.md#admin-api--rls-pattern-critical)
- [Notification Service](./notifications.md) - Uses Supabase for template and log storage

---

**Last Updated**: 2026-05-03 by Claude Code
**Changes**: Doc verified against current code during 2026-05-03 architecture refresh — no drift detected (RLS migrations `20251228_*`, `20260313/14/15_*` all consistent with documented patterns). Prior change (2026-03-07): documented two-client pattern variable naming (Pattern A/B), fixed `requireAdmin` import path, marked Pattern A as preferred for new routes.
