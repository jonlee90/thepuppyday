/**
 * Admin Panel Mobile Navigation
 * Hamburger menu that opens a slide-in drawer with navigation
 */

'use client';

import { useState } from 'react';
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
  Menu,
  X,
  LogOut,
  BarChart3,
  Megaphone,
  Clock,
  Bell,
  FileText,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  children?: NavItem[];
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
        icon: FileText,
      },
      {
        label: 'Settings',
        href: '/admin/notifications/settings',
        icon: Settings,
      },
      {
        label: 'Log',
        href: '/admin/notifications/log',
        icon: List,
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
    href: '/admin/settings',
    icon: Settings,
    ownerOnly: true,
  },
];

interface AdminMobileNavProps {
  user: User;
}

export function AdminMobileNav({ user }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((child) => child.href && isActive(child.href));
    }
    return false;
  };

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isOwner = user?.role === 'admin';

  // Filter out owner-only items if user is not owner
  const visibleItems = navItems.filter((item) => !item.ownerOnly || isOwner);

  // Close drawer when route changes
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#434E54]/10 shadow-sm">
        <div className="h-16 flex items-center justify-between px-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-[#434E54] leading-tight">
                Puppy Day
              </span>
              <span className="text-xs text-[#434E54]/60">Admin Panel</span>
            </div>
          </Link>

          {/* Hamburger Button - 44x44px tap target */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-lg
                     text-[#434E54] hover:bg-[#EAE0D5] transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Drawer */}
      <aside
        className={`
          lg:hidden fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw]
          bg-white shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#434E54]/10">
            <span className="font-semibold text-[#434E54]">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-11 h-11 flex items-center justify-center rounded-lg
                       text-[#434E54]/60 hover:bg-[#EAE0D5] hover:text-[#434E54]
                       transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 py-4 border-b border-[#434E54]/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EAE0D5] flex items-center justify-center">
                  <span className="text-[#434E54] font-semibold text-lg">
                    {user.first_name[0]}{user.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#434E54] truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-[#434E54]/60">
                    {user.role === 'admin' ? 'Owner' : 'Staff'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems[item.label] || isParentActive(item);
                const parentActive = isParentActive(item);

                if (hasChildren) {
                  // Parent item with children
                  return (
                    <li key={item.label}>
                      <button
                        onClick={() => toggleItem(item.label)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full
                          ${
                            parentActive
                              ? 'bg-[#434E54] text-white shadow-md'
                              : 'text-[#434E54] hover:bg-[#EAE0D5]'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                      {/* Child items */}
                      {isExpanded && (
                        <ul className="mt-1 space-y-1">
                          {item.children?.map((child) => {
                            const childActive = child.href ? isActive(child.href) : false;
                            const ChildIcon = child.icon;

                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href || '#'}
                                  onClick={handleLinkClick}
                                  className={`
                                    flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg transition-all duration-200
                                    ${
                                      childActive
                                        ? 'bg-[#434E54]/90 text-white shadow-sm'
                                        : 'text-[#434E54] hover:bg-[#EAE0D5]'
                                    }
                                  `}
                                >
                                  <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium">{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                // Regular item without children
                const active = item.href ? isActive(item.href) : false;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href || '#'}
                      onClick={handleLinkClick}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          active
                            ? 'bg-[#434E54] text-white shadow-md'
                            : 'text-[#434E54] hover:bg-[#EAE0D5]'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-[#434E54]/10">
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg
                       text-[#434E54]/70 hover:bg-[#EAE0D5] hover:text-[#434E54]
                       transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
