/**
 * Admin Customers Page
 * Lists all customers with search and filtering
 * Task 0017: Create /admin/customers page
 *
 * Thin server component — auth check only, all data fetching
 * is handled by CustomerTable via /api/admin/customers.
 */

import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { CustomerTable } from '@/components/admin/customers/CustomerTable';
import { Users } from 'lucide-react';

function CustomersTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-4">
        <div className="h-10 bg-base-200 rounded-lg flex-1" />
        <div className="h-10 bg-base-200 rounded-lg w-32" />
      </div>
      <div className="bg-base-200 rounded-xl h-96" />
    </div>
  );
}

export const metadata = {
  title: 'Customers | The Puppy Day Admin',
  description: 'Manage customer accounts and information',
};

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <Users className="w-6 h-6 text-[#434E54]" />
          </div>
          <div>
            <h1 className="hidden lg:block text-2xl font-bold text-[#434E54]">Customers</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              View and manage customer accounts
            </p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomerTable />
      </Suspense>
    </div>
  );
}
