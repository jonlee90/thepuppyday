# Gallery Image Upload Fix

## Problem

Gallery image uploads were failing with "All uploads failed" error despite storage buckets and RLS policies being properly configured.

## Root Cause

The upload API route (`src/app/api/admin/gallery/upload/route.ts`) was using `createServerSupabaseClient()` which creates a client with the **anon key**. This client is subject to Row Level Security (RLS) policies.

Even though RLS policies were configured to allow authenticated admins to insert into storage buckets, the storage operations were failing because:

1. The anon key client has limited permissions
2. Storage operations require elevated permissions to bypass RLS
3. Admin operations on storage should use the service role key

## Solution

Updated the upload route to use **two separate Supabase clients**:

1. **Regular client** (anon key) - For authentication checks
   ```typescript
   const supabase = await createServerSupabaseClient();
   await requireAdmin(supabase);
   ```

2. **Service role client** - For all storage and database operations
   ```typescript
   const serviceSupabase = createServiceRoleClient();
   ```

## Changes Made

### File: `src/app/api/admin/gallery/upload/route.ts`

1. **Import service role client creator**
   ```typescript
   import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
   ```

2. **Create service role client after auth check**
   ```typescript
   // Use regular client for auth check
   const supabase = await createServerSupabaseClient();
   await requireAdmin(supabase);

   // Use service role client for storage operations (bypasses RLS)
   const serviceSupabase = createServiceRoleClient();
   ```

3. **Replace all database/storage operations to use service role client**
   - Display order query: `serviceSupabase.from('gallery_images')`
   - File upload: `serviceSupabase.storage.from('gallery-images').upload()`
   - Public URL: `serviceSupabase.storage.from('gallery-images').getPublicUrl()`
   - Database insert: `serviceSupabase.from('gallery_images').insert()`
   - File cleanup: `serviceSupabase.storage.from('gallery-images').remove()`

4. **Added comprehensive logging**
   - Log each stage of upload process
   - Log file details (name, size, type)
   - Log success/failure for each operation
   - Log final summary of uploads

## Environment Variables

Verified that `.env.local` has the correct service role key:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

This is correctly mapped in `src/lib/config.ts`:

```typescript
supabase: {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
}
```

## How Service Role Client Works

The `createServiceRoleClient()` function in `src/lib/supabase/server.ts`:

```typescript
export function createServiceRoleClient(): SupabaseClient | MockSupabaseClient {
  if (config.useMocks) {
    return createMockClient();
  }

  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

This client:
- Uses the service role key (not anon key)
- Bypasses all RLS policies
- Has full admin access to database and storage
- Should only be used in trusted server-side code
- Never exposed to the client

## Security Considerations

1. **Authentication still required** - The route still validates admin access using the regular client before any operations
2. **Service role only in API routes** - Never expose service role client to client-side code
3. **Minimal privilege** - Only use service role for specific operations that require it
4. **Logging** - All operations are logged for audit trail

## Testing

To test the fix:

1. Start the dev server: `npm run dev`
2. Login as admin user
3. Navigate to Admin Gallery page
4. Upload one or more images
5. Check browser console for any errors
6. Check server terminal for detailed logs:
   - `[Upload] Starting image upload process`
   - `[Upload] Admin authentication successful`
   - `[Upload] Service role client created`
   - `[Upload] Received X files`
   - `[Upload] Processing file: ...`
   - `[Upload] Upload successful for ...`
   - `[Upload] Got public URL: ...`
   - `[Upload] Successfully created gallery entry with ID: ...`

## Expected Behavior

After this fix:

1. Admin can upload images to gallery
2. Images are stored in `gallery-images` bucket
3. Database entries created in `gallery_images` table
4. Images initially unpublished (`is_published: false`)
5. Success/error details returned in API response
6. Detailed server logs for debugging

## Related Files

- `src/app/api/admin/gallery/upload/route.ts` - Upload API route (modified)
- `src/lib/supabase/server.ts` - Server client creators
- `src/lib/config.ts` - Environment variable configuration
- `.env.local` - Environment variables (service role key)

## Related Issues

This same pattern should be applied to:

- Report card photo uploads
- Any other admin storage operations
- Batch operations that need to bypass RLS

## References

- Supabase Storage RLS: https://supabase.com/docs/guides/storage/security/access-control
- Service Role Key: https://supabase.com/docs/guides/api/api-keys#the-service_role-key
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
