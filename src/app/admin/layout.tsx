/**
 * Admin Panel Layout
 * Server Component that fetches user data for admin/staff users
 * Authentication is enforced by middleware.ts
 */

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
import { Toaster } from '@/components/ui/toaster';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedAdmin } from '@/lib/admin/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch authenticated admin user
  // Middleware guarantees user is authenticated and has admin/staff role
  const supabase = await createServerSupabaseClient();
  const result = await getAuthenticatedAdmin(supabase);

  // This should never happen because middleware blocks unauthorized access
  // But we need to handle it gracefully to avoid runtime errors
  if (!result) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#434E54] mb-2">Unauthorized</h1>
          <p className="text-[#6B7280]">You do not have permission to access this page.</p>
          <a href="/login" className="text-[#434E54] hover:underline mt-4 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const { user } = result;

  return (
    <AdminLayoutClient>
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
    </AdminLayoutClient>
  );
}
