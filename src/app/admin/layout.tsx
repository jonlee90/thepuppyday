/**
 * Admin Panel Layout
 * Server Component that verifies authentication and role (admin/staff)
 * Redirects unauthorized users appropriately
 */

import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { Toaster } from '@/components/ui/toaster';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedAdmin } from '@/lib/admin/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const supabase = await createServerSupabaseClient();
  const result = await getAuthenticatedAdmin(supabase);

  // Redirect if not authenticated or not admin/staff
  if (!result) {
    redirect('/login?returnTo=/admin/dashboard');
  }

  const { user } = result;

  // Middleware ensures user is authenticated and has admin/staff role
  // So we can safely render the layout
  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      {/* Desktop Sidebar - Pass user as prop */}
      <AdminSidebar user={user} />

      {/* Mobile Navigation - Pass user as prop */}
      <AdminMobileNav user={user} />

      {/* Main content area - adjusts for sidebar width */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
