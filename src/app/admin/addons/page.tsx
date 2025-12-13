import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AddOnsClient } from './AddOnsClient';
import type { Addon } from '@/types/database';

export default async function AddOnsPage() {
  const supabase = await createServerSupabaseClient();
  // Note: Admin access is already verified by the layout

  // Fetch addons directly from database
  const { data: addons } = (await (supabase as any)
    .from('addons')
    .select('*')
    .order('display_order')) as { data: Addon[] | null; error: Error | null };

  return <AddOnsClient initialAddons={addons || []} />;
}
