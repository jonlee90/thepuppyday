/**
 * Mobile Bottom Tab Navigation
 * Fixed bottom navigation bar for mobile devices (<768px)
 * 5 tabs: Home, Appointments, Walk-in (center elevated), Customers, More
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, UserPlus, Users, MoreHorizontal } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { useBookingModal } from '@/hooks/useBookingModal';

export function MobileBottomTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBottomTab, setActiveBottomTab, toggleMobileDrawer } = useAdminStore();
  const { open: openModal } = useBookingModal();

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      id: 'appointments' as const,
      label: 'Appts',
      icon: Calendar,
      href: '/admin/appointments',
    },
    {
      id: 'walkin' as const,
      label: 'Walk-in',
      icon: UserPlus,
      action: 'walkin',
    },
    {
      id: 'customers' as const,
      label: 'Customers',
      icon: Users,
      href: '/admin/customers',
    },
    {
      id: 'more' as const,
      label: 'More',
      icon: MoreHorizontal,
      action: 'drawer',
    },
  ];

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.action === 'walkin') {
      // Open walk-in booking modal
      openModal({ mode: 'walkin' });
    } else if (tab.action === 'drawer') {
      // Open mobile drawer for "More" menu
      toggleMobileDrawer();
    } else if (tab.href) {
      // Navigate to route
      setActiveBottomTab(tab.id as any);
      router.push(tab.href);
    }
  };

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.href) {
      if (tab.href === '/admin/dashboard') {
        return pathname === '/admin/dashboard' || pathname === '/admin';
      }
      return pathname.startsWith(tab.href);
    }
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#434E54]/10 shadow-lg">
      <div className="h-18 flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);

          // Walk-in button (center, elevated)
          if (tab.id === 'walkin') {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className="flex flex-col items-center justify-center relative"
                style={{ flex: '0 0 20%' }}
                aria-label={tab.label}
              >
                {/* Elevated circle button */}
                <div className="absolute -top-6 w-14 h-14 bg-[#434E54] rounded-full flex items-center justify-center shadow-lg hover:bg-[#363F44] transition-colors">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                {/* Label below */}
                <span className="text-xs font-medium text-[#434E54] mt-9">
                  {tab.label}
                </span>
              </button>
            );
          }

          // Regular tabs
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                flex flex-col items-center justify-center py-2 relative transition-colors
                ${
                  active
                    ? 'text-[#434E54]'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }
              `}
              style={{ flex: '0 0 20%' }}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Top indicator line for active tab */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#434E54] rounded-b-full" />
              )}

              {/* Icon */}
              <Icon className="w-6 h-6 mb-1" />

              {/* Label */}
              <span className={`text-xs font-medium ${active ? 'text-[#434E54]' : 'text-[#6B7280]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
