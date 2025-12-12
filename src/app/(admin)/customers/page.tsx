/**
 * Admin Customers Page
 * Lists all customers with search and filtering
 * Task 0017: Create /admin/customers page
 */

import { CustomerTable } from '@/components/admin/customers/CustomerTable';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Customers | The Puppy Day Admin',
  description: 'Manage customer accounts and information',
};

export default function CustomersPage() {
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
      <CustomerTable />
    </div>
  );
}
