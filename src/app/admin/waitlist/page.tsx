import { Metadata } from 'next';
import { WaitlistDashboard } from '@/components/admin/waitlist/WaitlistDashboard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Waitlist Management | Admin - The Puppy Day',
  description: 'Manage customer waitlist entries and fill open appointment slots.',
};

/**
 * Waitlist Management Page
 * /admin/waitlist
 *
 * Admin dashboard for managing waitlist entries, viewing stats,
 * and filling open appointment slots from the waitlist.
 */
export default async function WaitlistPage() {
  const supabase = await createServerSupabaseClient();

  // Check admin authorization
  const admin = await requireAdmin(supabase);
  if (!admin) {
    redirect('/login');
  }

  // Fetch services for filter dropdown
  const { data: services } = await (supabase as any)
    .from('services')
    .select('id, name')
    .order('name');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Waitlist Management</h1>
        <p className="text-gray-600 mt-2">
          Manage customer waitlist entries and fill open appointment slots.
        </p>
      </div>

      {/* Dashboard */}
      <WaitlistDashboard services={services || []} />
    </div>
  );
}
