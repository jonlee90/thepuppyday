/**
 * Promo Banners Settings Page
 * Tasks 0173-0176: Banner management UI
 */

export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { BannersClient } from './BannersClient';

export default async function BannersPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return <BannersClient />;
}
