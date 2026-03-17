/**
 * Admin Customers Page
 * Lists all customers with search and filtering
 * Task 0017: Create /admin/customers page
 *
 * Thin server component — auth check only, all data fetching
 * is handled by CustomerTable via /api/admin/customers.
 */

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { CustomerTable } from '@/components/admin/customers/CustomerTable';
import { AdminSkeleton } from '@/components/admin/shared';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Customers | The Puppy Day Admin',
  description: 'Manage customer accounts and information',
};

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <Users className="w-6 h-6 text-[#434E54]" />
          </div>
          <div>
            <h1 className="hidden lg:block text-3xl font-bold text-[#434E54]">Customers</h1>
            <p className="text-sm text-[#434E54]/60 mt-0.5">
              View and manage customer accounts
            </p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <Suspense fallback={<AdminSkeleton variant="table" />}>
        <CustomerTable />
      </Suspense>
    </div>
  );
}
