/**
 * Admin Customer Detail Page
 * Displays comprehensive customer profile
 * Task 0018: Create /admin/customers/[id] page
 */

import { CustomerProfile } from '@/components/admin/customers/CustomerProfile';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Customer Profile | The Puppy Day Admin',
  description: 'View and manage customer information',
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#434E54]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#434E54]">Customer Profile</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            View and manage customer information
          </p>
        </div>
      </div>

      {/* Customer Profile */}
      <CustomerProfile customerId={id} />
    </div>
  );
}
