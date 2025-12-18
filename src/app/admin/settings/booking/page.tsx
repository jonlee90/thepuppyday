/**
 * Booking Settings Page
 * TODO: Implement booking rules and policies management
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export default async function BookingSettingsPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Booking Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure appointment booking rules and policies
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-[#6B7280]">
          This page is under construction. Booking settings management will be available soon.
        </p>
      </div>
    </div>
  );
}
