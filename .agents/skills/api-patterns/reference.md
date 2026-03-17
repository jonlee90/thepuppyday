# API Patterns — Detailed Reference

## Common Anti-Patterns Found in Codebase

### Anti-Pattern 1: Named resource responses
```typescript
// WRONG — inconsistent naming
return NextResponse.json({ services: data });
return NextResponse.json({ customers: data });
return NextResponse.json({ addons: data });

// CORRECT — always use { data }
return NextResponse.json({ data });
```

### Anti-Pattern 2: Inconsistent auth variable names
```typescript
// WRONG — mixed naming (Pattern B)
const supabase = await createServerSupabaseClient();
await requireAdmin(supabase);
const serviceClient = createServiceRoleClient();

// CORRECT — standardized naming (Pattern A)
const authSupabase = await createServerSupabaseClient();
await requireAdmin(authSupabase);
const supabase = createServiceRoleClient();
```

### Anti-Pattern 3: Missing Zod validation
```typescript
// WRONG — manual validation
const body = await request.json();
if (!body.name || typeof body.name !== 'string') {
  return NextResponse.json({ error: 'Name required' }, { status: 400 });
}

// CORRECT — Zod schema with flatten() for structured errors
const parsed = CreateSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Validation error', details: parsed.error.flatten() },
    { status: 400 }
  );
}
```

### Anti-Pattern 4: Inconsistent error catching
```typescript
// WRONG — no instanceof check
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// WRONG — generic message without context
catch (error) {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// CORRECT — safe access with context
catch (error) {
  console.error('[Admin API] Error fetching appointments:', error);
  const message = error instanceof Error ? error.message : 'Failed to fetch appointments';
  return NextResponse.json({ error: message }, { status: 500 });
}
```

## Existing Validation Utilities

Located in `src/lib/utils/validation.ts`:

| Function | Purpose | Use When |
|----------|---------|----------|
| `isValidUUID(id)` | Validates UUID format | Always for `[id]` path params |
| `sanitizeText(text)` | Strips HTML, trims whitespace | Any user-provided text before DB insert |
| `escapeLikePattern(input)` | Escapes SQL LIKE wildcards | Before `.ilike()` queries with user input |
| `validateServiceName(name)` | Name validation + sanitization | Service/addon names |
| `validateDescription(desc)` | Description validation | Descriptions up to 500 chars |
| `validatePrice(price)` | Price validation (positive, 2dp) | Any monetary values |
| `isValidImageUrl(url)` | URL format check (prevents XSS) | Image URLs |

## Routes Currently Using Zod

These routes already follow the Zod pattern (use as reference):
- `src/app/api/admin/appointments/route.ts` — `CreateAppointmentSchema`
- `src/app/api/admin/waitlist/[id]/book/route.ts`
- `src/app/api/admin/waitlist/[id]/route.ts`
- `src/app/api/admin/waitlist/fill-slot/route.ts`
- `src/app/api/admin/settings/staff/route.ts`
- `src/app/api/admin/settings/loyalty/route.ts`
- `src/app/api/admin/settings/booking/blocked-dates/route.ts`
- `src/app/api/customer/profile/route.ts`
- `src/app/api/customer/preferences/notifications/route.ts`

## Routes Needing Migration to Zod

These routes use custom validators or inline validation:
- `src/app/api/admin/services/route.ts` — uses `validateServiceName`, `validateDescription`
- `src/app/api/admin/addons/[id]/route.ts` — uses custom validators
- Other routes with `request.json()` but no Zod parse
