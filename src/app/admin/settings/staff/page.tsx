/**
 * Staff Management Settings Page
 * TODO: Implement staff accounts and permissions management
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export default async function StaffManagementPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Staff Management</h1>
        <p className="mt-2 text-[#434E54]/60">
          Manage staff accounts and permissions
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-[#6B7280]">
          This page is under construction. Staff management will be available soon.
        </p>
      </div>
    </div>
  );
}
