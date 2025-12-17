/**
 * Admin Panel Desktop Sidebar
 * Fixed sidebar with navigation, role-based access, and collapsible state
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/stores/admin-store';
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
  ChevronLeft,
  ChevronRight,
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
import { useState } from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
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
    ],
  },
  {
    title: 'Operations',
    items: [
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
    ],
  },
  {
    title: 'Marketing',
    items: [
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
    ],
  },
  {
    title: 'Configuration',
    items: [
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
    ],
  },
];

interface AdminSidebarProps {
  user: User;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useAdminStore();
  const { signOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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

  return (
    <aside
      className={`
        hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40
        bg-white border-r border-[#434E54]/10 transition-all duration-300
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}
    >
      {/* Logo & Collapse Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#434E54]/10">
        {!isSidebarCollapsed && (
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
        )}
        {isSidebarCollapsed && (
          <Link href="/admin/dashboard" className="w-full flex justify-center">
            <div className="w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className={`
            p-2 rounded-lg text-[#434E54]/60 hover:bg-[#EAE0D5] hover:text-[#434E54]
            transition-colors ${isSidebarCollapsed ? 'ml-0' : 'ml-2'}
          `}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isSidebarCollapsed && user && (
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
              <p className="text-xs text-[#434E54]/60">
                {user.role === 'admin' ? 'Owner' : 'Staff'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navSections.map((section, sectionIndex) => {
          // Filter out owner-only items if user is not owner
          const visibleItems = section.items.filter(
            (item) => !item.ownerOnly || isOwner
          );

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {!isSidebarCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-[#434E54]/60 uppercase tracking-wide">
                  {section.title}
                </h3>
              )}
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
                            ${isSidebarCollapsed ? 'justify-center' : ''}
                          `}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isSidebarCollapsed && (
                            <>
                              <span className="font-medium flex-1 text-left">{item.label}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                              )}
                            </>
                          )}
                        </button>
                        {/* Child items */}
                        {!isSidebarCollapsed && isExpanded && (
                          <ul className="mt-1 space-y-1">
                            {item.children?.map((child) => {
                              const childActive = child.href ? isActive(child.href) : false;
                              const ChildIcon = child.icon;

                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href || '#'}
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
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                          ${
                            active
                              ? 'bg-[#434E54] text-white shadow-md'
                              : 'text-[#434E54] hover:bg-[#EAE0D5]'
                          }
                          ${isSidebarCollapsed ? 'justify-center' : ''}
                        `}
                        title={isSidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isSidebarCollapsed && (
                          <span className="font-medium">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#434E54]/10">
        <button
          onClick={() => signOut()}
          className={`
            flex items-center gap-3 w-full px-4 py-2 rounded-lg
            text-[#434E54]/70 hover:bg-[#EAE0D5] hover:text-[#434E54]
            transition-colors
            ${isSidebarCollapsed ? 'justify-center' : ''}
          `}
          title={isSidebarCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
