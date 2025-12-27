/**
 * Admin Panel Tablet Sidebar
 * Icon-only sidebar (72px width) for tablet devices (768px-1023px)
 */

'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/database';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Plus,
  Images,
  Settings,
  LogOut,
  BarChart3,
  Megaphone,
  Clock,
  Bell,
} from 'lucide-react';
import { NavPopover } from './NavPopover';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  children?: Array<{
    label: string;
    href: string;
    icon: React.ElementType;
  }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Appointments',
    href: '/admin/appointments',
    icon: Calendar,
  },
  {
    label: 'Waitlist',
    href: '/admin/waitlist',
    icon: Clock,
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Campaigns',
    href: '/admin/marketing/campaigns',
    icon: Megaphone,
    ownerOnly: true,
  },
  {
    label: 'Notifications',
    icon: Bell,
    ownerOnly: true,
    children: [
      {
        label: 'Dashboard',
        href: '/admin/notifications/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Templates',
        href: '/admin/notifications/templates',
        icon: Settings,
      },
      {
        label: 'Settings',
        href: '/admin/notifications/settings',
        icon: Settings,
      },
      {
        label: 'Log',
        href: '/admin/notifications/log',
        icon: Settings,
      },
    ],
  },
  {
    label: 'Services',
    href: '/admin/services',
    icon: Scissors,
    ownerOnly: true,
  },
  {
    label: 'Add-ons',
    href: '/admin/addons',
    icon: Plus,
    ownerOnly: true,
  },
  {
    label: 'Gallery',
    href: '/admin/gallery',
    icon: Images,
    ownerOnly: true,
  },
  {
    label: 'Settings',
    icon: Settings,
    ownerOnly: true,
    children: [
      {
        label: 'Overview',
        href: '/admin/settings',
        icon: LayoutDashboard,
      },
      {
        label: 'Site Content',
        href: '/admin/settings/site-content',
        icon: Settings,
      },
      {
        label: 'Banners',
        href: '/admin/settings/banners',
        icon: Settings,
      },
      {
        label: 'Booking',
        href: '/admin/settings/booking',
        icon: Settings,
      },
      {
        label: 'Business Hours',
        href: '/admin/settings/business-hours',
        icon: Settings,
      },
      {
        label: 'Loyalty Program',
        href: '/admin/settings/loyalty',
        icon: Settings,
      },
      {
        label: 'Staff',
        href: '/admin/settings/staff',
        icon: Settings,
      },
    ],
  },
];

interface TabletSidebarProps {
  user: User;
}

export function TabletSidebar({ user }: TabletSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const popoverRefs = useRef<Record<string, React.RefObject<HTMLButtonElement>>>({});

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  const isOwner = user?.role === 'admin';

  // Filter out owner-only items if user is not owner
  const visibleItems = navItems.filter((item) => !item.ownerOnly || isOwner);

  const handleItemClick = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      // Toggle popover
      setOpenPopover(openPopover === item.label ? null : item.label);
    }
  };

  const getOrCreateRef = (label: string) => {
    if (!popoverRefs.current[label]) {
      popoverRefs.current[label] = { current: null };
    }
    return popoverRefs.current[label];
  };

  return (
    <>
      <aside className="hidden md:flex lg:hidden md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-[72px] bg-white border-r border-[#434E54]/10">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-[#434E54]/10">
          <Link href="/admin/dashboard" className="flex items-center justify-center">
            <div className="w-12 h-12 bg-[#434E54] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const active = item.href ? isActive(item.href) : isParentActive(item);
              const ref = getOrCreateRef(item.label);

              if (hasChildren) {
                // Parent item with children - opens popover
                return (
                  <li key={item.label}>
                    <button
                      ref={ref as React.RefObject<HTMLButtonElement>}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full h-14 flex items-center justify-center rounded-lg transition-all duration-200
                        relative group
                        ${
                          active
                            ? 'bg-[#434E54] text-white shadow-md'
                            : 'text-[#434E54] hover:bg-[#EAE0D5]'
                        }
                      `}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <Icon className="w-6 h-6" />

                      {/* Tooltip on hover */}
                      <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#434E54] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>

                      {/* Submenu indicator */}
                      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-current rounded-full opacity-60" />
                    </button>
                  </li>
                );
              }

              // Regular item without children
              return (
                <li key={item.href}>
                  <Link
                    href={item.href || '#'}
                    className={`
                      w-full h-14 flex items-center justify-center rounded-lg transition-all duration-200
                      relative group
                      ${
                        active
                          ? 'bg-[#434E54] text-white shadow-md'
                          : 'text-[#434E54] hover:bg-[#EAE0D5]'
                      }
                    `}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="w-6 h-6" />

                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#434E54] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider before logout */}
          <div className="my-4 border-t border-[#434E54]/10" />
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-[#434E54]/10">
          <button
            onClick={() => signOut()}
            className="w-full h-14 flex items-center justify-center rounded-lg
                     text-[#434E54]/70 hover:bg-[#EAE0D5] hover:text-[#434E54]
                     transition-colors relative group"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-6 h-6" />

            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 px-3 py-1.5 bg-[#434E54] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Sign Out
            </div>
          </button>
        </div>
      </aside>

      {/* Popovers */}
      {visibleItems.map((item) => {
        if (item.children && openPopover === item.label) {
          const ref = getOrCreateRef(item.label);
          return (
            <NavPopover
              key={item.label}
              items={item.children}
              onClose={() => setOpenPopover(null)}
              anchorRef={ref as React.RefObject<HTMLButtonElement>}
            />
          );
        }
        return null;
      })}
    </>
  );
}
