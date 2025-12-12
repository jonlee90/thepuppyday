/**
 * Customer portal layout with responsive navigation
 * Auth is now handled by middleware, so this can be simplified
 */

'use client';

import { CustomerNav } from '@/components/customer/CustomerNav';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  // Show loading skeleton while auth initializes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#434E54]/20 border-t-[#434E54] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#434E54]/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Middleware ensures user is authenticated and has customer role
  // So we can safely render the layout
  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      {/* Navigation */}
      <CustomerNav
        user={{
          firstName: user?.first_name || 'Guest',
          lastName: user?.last_name || 'User',
          email: user?.email || '',
          avatarUrl: user?.avatar_url,
        }}
      />

      {/* Main content area */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
