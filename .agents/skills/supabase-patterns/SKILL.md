---
name: supabase-patterns
description: Enforces consistent Supabase client usage, RLS-aware query patterns, and type handling for The Puppy Day. Auto-invoke when writing database queries, creating API routes with Supabase, modifying auth flows, or working with RLS policies.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# Supabase Patterns

Consistent Supabase client usage, query patterns, and type handling for The Puppy Day.

## When to Apply

Reference these patterns when:
- Writing Supabase queries in API routes
- Creating or modifying API routes that access the database
- Working with authentication or RLS policies
- Importing or defining database types
- Deciding between relationship joins and parallel queries

## CRITICAL SECURITY: getUser() vs getSession()

**ALWAYS use `auth.getUser()` on the server. NEVER use `auth.getSession()` for auth verification.**

- `auth.getUser()` — Sends request to Supabase Auth server to validate the JWT. **SAFE for server-side.**
- `auth.getSession()` — Reads from cookies/local storage WITHOUT server verification. **Can be spoofed. UNSAFE for auth decisions.**

```typescript
// CORRECT — server-verified auth
const { data: { user } } = await supabase.auth.getUser();

// WRONG — unverified, can be spoofed by manipulating cookies
const { data: { session } } = await supabase.auth.getSession();
```

`getSession()` is only acceptable for non-critical client-side UI rendering (e.g., showing a user's name).

## Rule 1: Client Selection by Route Type

| Route Type | Auth Client | Data Client | Pattern |
|------------|-------------|-------------|---------|
| Admin | `createServerSupabaseClient()` | `createServiceRoleClient()` | Two-client |
| Customer | `createServerSupabaseClient()` | Same client | Single-client |
| Public | None | `createServiceRoleClient()` | Service-only |
| Server Action | `createServerSupabaseClient()` | `createServiceRoleClient()` (admin) | Same as route |

### Admin Routes (Two-Client Pattern)
```typescript
// Auth client — validates admin role (respects RLS)
const authSupabase = await createServerSupabaseClient();
await requireAdmin(authSupabase); // Uses getUser() internally

// Data client — bypasses RLS for cross-customer queries
const supabase = createServiceRoleClient();
const { data } = await supabase.from('users').select('*');
```

### Customer Routes (Single-Client)
```typescript
// RLS automatically scopes queries to the authenticated user
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser(); // MUST use getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const { data } = await supabase.from('pets').select('*'); // RLS: owner_id = auth.uid()
```

### Public Routes (Service-Only)
```typescript
const supabase = createServiceRoleClient();
const { data } = await supabase.from('services').select('*').eq('is_active', true);
```

### Server Actions
```typescript
'use server';
// Same pattern as the equivalent route type
const authSupabase = await createServerSupabaseClient();
await requireAdmin(authSupabase);
const supabase = createServiceRoleClient();
```

## Rule 2: Variable Naming

ALWAYS use Pattern A:

| Variable | Client Factory | Purpose |
|----------|----------------|---------|
| `authSupabase` | `createServerSupabaseClient()` | Auth verification only |
| `supabase` | `createServiceRoleClient()` | Data queries (admin) |
| `supabase` | `createServerSupabaseClient()` | Auth + data (customer) |

NEVER use `serviceClient`, `dbClient`, `adminClient`, or other custom names.

## Rule 3: Query Strategy

### Simple Joins — Use Supabase Relationship Syntax
For straightforward related data:
```typescript
const { data } = await supabase
  .from('appointments')
  .select(`
    *,
    customer:users!customer_id(id, first_name, last_name, email, phone),
    pet:pets!pet_id(id, name, breed:breeds(name)),
    service:services!service_id(id, name),
    addons:appointment_addons(*, addon:addons(*))
  `)
  .order('scheduled_at', { ascending: false });
```

### Complex Queries — Use Parallel Fetch + Merge
When queries are independent or relationships are complex:
```typescript
const [customersResult, petsResult, appointmentsResult] = await Promise.all([
  supabase.from('users').select('*', { count: 'exact' }).eq('role', 'customer'),
  supabase.from('pets').select('*').in('owner_id', customerIds),
  supabase.from('appointments').select('*').in('customer_id', customerIds),
]);
```

### Decision Matrix
| Scenario | Strategy |
|----------|----------|
| 1-2 levels of nesting | Relationship joins |
| 3+ levels deep | Parallel fetch |
| Aggregations (count, sum) | Separate count query |
| Cross-table with RLS complexity | Parallel fetch with service role |
| Performance-critical lists | Parallel fetch (more control) |

## Rule 4: Type Handling

### Prefer Shared Types
```typescript
// CORRECT — import from types
import type { Appointment, User, Pet, Service } from '@/types/database';

// WRONG — inline type definition
interface User {
  id: string;
  email: string;
  // ...
}
```

### When Types Are Missing from database.ts
If a type isn't exported from `src/types/database.ts`:
1. **First choice**: Add the type to `src/types/database.ts`
2. **Second choice**: Create in `src/types/api.ts` for API-specific types
3. **Last resort**: Inline with a comment explaining why

```typescript
// Inline only when generated types don't match query shape
// TODO: Add to src/types/database.ts when Supabase types are regenerated
interface CustomerWithStats extends User {
  pets_count: number;
  appointments_count: number;
}
```

## Rule 5: Error Handling for Supabase Queries

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .single();

// For .single() queries — check both error and null data
if (error || !data) {
  return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
}

// For list queries — default to empty array
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;
return NextResponse.json({ data: data || [] });
```

## Rule 6: Supabase Query Best Practices

### Always select specific columns for large tables
```typescript
// CORRECT — select only what you need
const { data } = await supabase
  .from('users')
  .select('id, first_name, last_name, email, phone');

// WRONG — select all columns unnecessarily
const { data } = await supabase.from('users').select('*');
```

### Use .eq() for exact matches, .ilike() for search
```typescript
// Exact filter
query = query.eq('status', 'confirmed');

// Search with escaped LIKE pattern
import { escapeLikePattern } from '@/lib/utils/validation';
query = query.ilike('first_name', `%${escapeLikePattern(search)}%`);
```

### Pagination
```typescript
const offset = (page - 1) * limit;
const { data, count, error } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('created_at', { ascending: false });
```

## Audit Checklist

- [ ] Admin routes use two-client pattern
- [ ] Variable naming follows Pattern A (`authSupabase` / `supabase`)
- [ ] Types imported from `src/types/database.ts` (not inline)
- [ ] `.single()` queries check both error and null data
- [ ] List queries default to empty array
- [ ] User input in `.ilike()` is escaped with `escapeLikePattern()`
- [ ] Large tables select specific columns

## Reference Files

- `src/lib/supabase/server.ts` — Client factories
- `src/lib/admin/auth.ts` — `requireAdmin()` helper
- `src/types/database.ts` — Database type definitions
- `docs/architecture/ARCHITECTURE.md` (lines 1350-1375) — Admin API + RLS pattern
- `docs/architecture/services/supabase.md` — Supabase integration guide
