---
name: api-patterns
description: Enforces consistent API route patterns for The Puppy Day. Auto-invoke when creating, modifying, or reviewing any Next.js API route (src/app/api/). Covers authentication, error handling, response format, validation, and Supabase client usage.
metadata:
  author: thepuppyday
  version: "1.0.0"
---

# API Route Patterns

Canonical patterns for all Next.js API routes in The Puppy Day. Ensures consistent auth, error handling, response format, and validation across admin, customer, and public endpoints.

## When to Apply

Reference these patterns when:
- Creating new API routes in `src/app/api/`
- Modifying existing API route handlers
- Reviewing API routes for consistency
- Debugging auth or response format issues

## Critical Rules

### Rule 1: Route Structure

Every API route file MUST follow this structure:

```typescript
/**
 * [Area] API - [Resource] Management
 * [METHOD] /api/[path] - [Description]
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';
// ... other imports

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    // 2. Parse & validate input
    // 3. Query data
    // 4. Return standardized response
  } catch (error) {
    // 5. Standardized error handling
  }
}
```

### Rule 2: Authentication Pattern (Admin Routes)

Admin routes MUST use the two-client pattern. Variable naming: `authSupabase` for auth client, `supabase` for service role.

```typescript
// CORRECT - Two-client pattern
const authSupabase = await createServerSupabaseClient();
await requireAdmin(authSupabase);
const supabase = createServiceRoleClient();

// WRONG - Single client (will hit RLS issues)
const supabase = await createServerSupabaseClient();
await requireAdmin(supabase);
// queries with `supabase` will be blocked by RLS
```

### Rule 3: Authentication Pattern (Customer Routes)

Customer routes use a single client that respects RLS:

```typescript
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Rule 4: Authentication Pattern (Public Routes)

Public read-only routes use service role client:

```typescript
const supabase = createServiceRoleClient();
```

### Rule 5: Error Response Format

ALL error responses MUST use this structure:

```typescript
// Always: { error: string } with appropriate HTTP status
return NextResponse.json({ error: 'Human-readable message' }, { status: 4xx|5xx });
```

Status code rules:
- `400` — Invalid input, validation failure
- `401` — Not authenticated
- `403` — Authenticated but not authorized
- `404` — Resource not found
- `409` — Conflict (duplicate, already exists)
- `500` — Server error (catch block default)

Catch block pattern:
```typescript
catch (error) {
  console.error('[Admin API] Error [action] [resource]:', error);
  const message = error instanceof Error ? error.message : 'Failed to [action] [resource]';
  return NextResponse.json({ error: message }, { status: 500 });
}
```

### Rule 6: Success Response Format

**Single resource:**
```typescript
return NextResponse.json({ data: resource });
// Example: { data: { id: '...', name: '...' } }
```

**List with pagination:**
```typescript
return NextResponse.json({
  data: items,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
});
```

**List without pagination (small collections):**
```typescript
return NextResponse.json({ data: items });
```

**Mutation success:**
```typescript
// Create
return NextResponse.json({ data: created }, { status: 201 });
// Update
return NextResponse.json({ data: updated });
// Delete
return NextResponse.json({ success: true });
```

NEVER return `{ services: [] }` or `{ customers: [] }` — always use `{ data: [] }`.

### Rule 7: Request Validation with Zod

ALL POST/PUT/PATCH request bodies MUST be validated with Zod:

```typescript
const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

    const body = await request.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, description, price } = parsed.data;
    // ... proceed with validated data
  } catch (error) {
    // ...
  }
}
```

Use existing validators from `src/lib/utils/validation.ts` for:
- `isValidUUID(id)` — UUID format validation for path params
- `sanitizeText(text)` — XSS prevention for user text
- `escapeLikePattern(input)` — SQL LIKE injection prevention

### Rule 8: UUID Path Parameter Validation

Routes with `[id]` params MUST validate UUID format:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    // ...
  }
}
```

### Rule 9: Query Parameter Parsing

Parse with defaults and type coercion:

```typescript
const searchParams = request.nextUrl.searchParams;
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100); // Cap at 100
const search = searchParams.get('search') || '';
const status = searchParams.get('status') || '';
const sortBy = searchParams.get('sortBy') || 'created_at';
const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
```

### Rule 10: File Header Comment

Every route file starts with a JSDoc comment listing all methods and paths:

```typescript
/**
 * Admin API - [Resource] Management
 * GET /api/admin/[resource] - List [resources]
 * POST /api/admin/[resource] - Create [resource]
 */
```

## Audit Checklist

When auditing an API route, check for:
- [ ] Two-client auth pattern for admin routes
- [ ] Variable naming: `authSupabase` / `supabase` (not `serviceClient`)
- [ ] Error responses use `{ error: string }` format
- [ ] Correct HTTP status codes (not generic 500 for everything)
- [ ] List responses use `{ data: [] }` (not `{ resources: [] }`)
- [ ] POST/PUT/PATCH bodies validated with Zod
- [ ] UUID params validated with `isValidUUID()`
- [ ] `console.error` with context tag in catch blocks
- [ ] `export const dynamic = 'force-dynamic'` at top
- [ ] File header comment with methods and paths

## Reference Files

- `docs/architecture/ARCHITECTURE.md` (lines 1350-1375) — Admin API + RLS pattern
- `docs/architecture/routes/api.md` — API route documentation
- `src/lib/utils/validation.ts` — Shared validation utilities
- `src/lib/admin/auth.ts` — Admin auth helper
- `src/lib/supabase/server.ts` — Supabase client factories

## Gold-Standard Examples

See `examples/` directory for complete templates:
- `examples/admin-route.ts` — Admin CRUD route with pagination
- `examples/customer-route.ts` — Customer route respecting RLS
- `examples/public-route.ts` — Public read-only route
