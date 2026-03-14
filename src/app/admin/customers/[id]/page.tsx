/**
 * Admin Customer Detail Page
 * Task 0065: Remove heading/description, keep only back link + CustomerProfile
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
    <div className="space-y-4">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-[#434E54]/60 hover:text-[#434E54] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      <CustomerProfile customerId={id} />
    </div>
  );
}
