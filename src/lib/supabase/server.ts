/**
 * Supabase server client for Server Components and API routes
 */

import { cache } from 'react';
import { config } from '@/lib/config';
import { createMockClient, type MockSupabaseClient } from '@/mocks/supabase/client';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AppSupabaseClient = MockSupabaseClient | SupabaseClient;

/**
 * Create a Supabase client for server-side use (Server Components, Route Handlers)
 */
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
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role key for admin operations
 * WARNING: This bypasses RLS. Only use for trusted server-side operations.
 */
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

/**
 * Alias for createServerSupabaseClient for backward compatibility
 */
export const createClient = createServerSupabaseClient;

/**
 * Get the currently authenticated user + their public profile.
 * Wrapped in React.cache() so the getUser() network call and DB query
 * are deduplicated within a single server request (server-cache-react).
 * Uses getUser() (not getSession()) so the JWT is verified server-side.
 */
export const getCurrentUser = cache(async (): Promise<Record<string, any> | null> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData ?? null;
});
