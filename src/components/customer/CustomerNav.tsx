/**
 * Customer Portal Navigation
 * - Desktop (>=1024px): Fixed sidebar with logo, user info, and vertical nav
 * - Mobile (<1024px): Fixed bottom navigation dock
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Pets',
    href: '/pets',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
      </svg>
    ),
  },
  {
    label: 'Report Cards',
    href: '/report-cards',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Loyalty',
    href: '/loyalty',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// Mobile navigation only shows 5 items max
const mobileNavItems = navItems.slice(0, 5);

interface CustomerNavProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function CustomerNav({ user }: CustomerNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 bg-white border-r border-[#434E54]/10">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#434E54]/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg text-[#434E54]">Puppy Day</span>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-[#434E54]/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.firstName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#434E54] font-semibold text-lg">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#434E54] truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-[#434E54]/60 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${active
                        ? 'bg-[#434E54] text-white shadow-md'
                        : 'text-[#434E54] hover:bg-[#EAE0D5]'
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Book Appointment CTA */}
        <div className="p-4 border-t border-[#434E54]/10">
          <Link
            href="/book"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg
                     bg-[#434E54] text-white font-semibold
                     hover:bg-[#434E54]/90 transition-all duration-200
                     shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Book Appointment
          </Link>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-[#434E54]/10">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-[#434E54]/70
                     hover:bg-[#EAE0D5] hover:text-[#434E54] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-medium">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#434E54]/10 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center min-w-[64px] py-1 px-2
                  transition-all duration-200
                  ${active
                    ? 'text-[#434E54]'
                    : 'text-[#434E54]/50 hover:text-[#434E54]/70'
                  }
                `}
              >
                <div className={`
                  p-1 rounded-lg transition-all duration-200
                  ${active ? 'bg-[#EAE0D5]' : ''}
                `}>
                  {item.icon}
                </div>
                <span className={`
                  text-xs mt-0.5 transition-all duration-200
                  ${active ? 'font-semibold' : 'font-medium'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
