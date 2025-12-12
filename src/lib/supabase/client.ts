/**
 * Supabase client factory - switches between mock and real client
 */

import { config } from '@/lib/config';
import { createMockClient, type MockSupabaseClient } from '@/mocks/supabase/client';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AppSupabaseClient = MockSupabaseClient | SupabaseClient;

let browserClient: AppSupabaseClient | null = null;

/**
 * Create a Supabase client for browser use
 */
export function createClient(): AppSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  if (config.useMocks) {
    console.log('[Supabase] Using mock client');
    browserClient = createMockClient();
  } else {
    console.log('[Supabase] Creating real client with URL:', config.supabase.url);
    console.log('[Supabase] Anon key present:', !!config.supabase.anonKey);
    browserClient = createBrowserClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }

  return browserClient;
}

/**
 * Get the current Supabase client instance
 */
export function getClient(): AppSupabaseClient {
  if (!browserClient) {
    return createClient();
  }
  return browserClient;
}
