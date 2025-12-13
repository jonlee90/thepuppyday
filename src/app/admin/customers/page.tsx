/**
 * Admin Customers Page
 * Lists all customers with search and filtering
 * Task 0017: Create /admin/customers page
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CustomerTable } from '@/components/admin/customers/CustomerTable';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Customers | The Puppy Day Admin',
  description: 'Manage customer accounts and information',
};

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  // Note: Admin access is already verified by the layout

  // Fetch customers data - separate queries to support mock client
  const { data: customers } = (await (supabase as any)
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(50)) as { data: any[] | null };

  // Fetch related data in parallel
  const { data: allPets } = (await (supabase as any)
    .from('pets')
    .select('*')) as { data: any[] | null };

  const { data: allAppointments } = (await (supabase as any)
    .from('appointments')
    .select('*')) as { data: any[] | null };

  const { data: allFlags } = (await (supabase as any)
    .from('customer_flags')
    .select('*')) as { data: any[] | null };

  const { data: allMemberships } = (await (supabase as any)
    .from('customer_memberships')
    .select('*')) as { data: any[] | null };

  // Transform data to match expected structure
  const customersWithStats = (customers || []).map(customer => ({
    ...customer,
    pets_count: (allPets || []).filter(p => p.owner_id === customer.id).length,
    appointments_count: (allAppointments || []).filter(a => a.customer_id === customer.id).length,
    flags: (allFlags || []).filter(f => f.customer_id === customer.id),
    active_membership: (allMemberships || []).find(m => m.customer_id === customer.id && m.status === 'active') || null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <Users className="w-6 h-6 text-[#434E54]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#434E54]">Customers</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              View and manage customer accounts
            </p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <CustomerTable initialCustomers={customersWithStats} />
    </div>
  );
}
