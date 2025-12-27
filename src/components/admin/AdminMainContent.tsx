/**
 * Admin Main Content Wrapper
 * Client component that applies dynamic padding based on sidebar collapse state
 * Ensures content expands to use available space when sidebar is collapsed
 */

'use client';

import { useAdminStore } from '@/stores/admin-store';

interface AdminMainContentProps {
  children: React.ReactNode;
}

export function AdminMainContent({ children }: AdminMainContentProps) {
  const { isSidebarCollapsed } = useAdminStore();

  return (
    <main
      className={`
        min-h-screen
        pt-14 md:pt-0
        pb-20 md:pb-0
        md:pl-[72px]
        transition-all duration-300
        ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
      `}
    >
      <div
        className={`
          mx-auto
          px-4 md:px-6 lg:px-8
          py-4 md:py-6 lg:py-8
          transition-all duration-300
          ${isSidebarCollapsed ? 'max-w-[1600px]' : 'max-w-7xl'}
        `}
      >
        {children}
      </div>
    </main>
  );
}
