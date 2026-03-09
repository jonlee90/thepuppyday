/**
 * Mobile Header Component
 * Fixed top header for mobile/tablet devices (<1024px)
 * Includes hamburger menu toggle and user avatar
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { User as UserIcon } from 'lucide-react';
import type { User } from '@/types/database';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/appointments': 'Appointments',
  '/admin/customers': 'Customers',
  '/admin/waitlist': 'Waitlist',
  '/admin/analytics': 'Analytics',
  '/admin/staff': 'Staff',
  '/admin/settings/services': 'Services',
  '/admin/settings/addons': 'Add-ons',
  '/admin/settings/gallery': 'Gallery',
  '/admin/marketing/campaigns': 'Campaigns',
  '/admin/notifications': 'Notifications',
  '/admin/notifications/dashboard': 'Notifications',
  '/admin/notifications/templates': 'Templates',
  '/admin/notifications/settings': 'Notification Settings',
  '/admin/notifications/log': 'Notification Log',
  '/admin/settings': 'Settings',
  '/admin/settings/site-content': 'Site Content',
  '/admin/settings/banners': 'Banners',
  '/admin/settings/booking': 'Booking Settings',
  '/admin/settings/business-hours': 'Business Hours',
  '/admin/settings/loyalty': 'Loyalty Program',
  '/admin/settings/calendar': 'Calendar',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Try matching parent paths for dynamic routes (e.g. /admin/customers/[id])
  const segments = pathname.split('/');
  while (segments.length > 2) {
    segments.pop();
    const parent = segments.join('/');
    if (PAGE_TITLES[parent]) return PAGE_TITLES[parent];
  }
  return 'Admin';
}

interface MobileHeaderProps {
  user: User;
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#434E54]/10 shadow-sm">
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Logo */}
        <Link href="/admin/dashboard">
          <Image
            src="/images/logo.png"
            alt="Puppy Day"
            width={90}
            height={30}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center: Page Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 font-semibold text-[#434E54] text-base truncate max-w-[40%] text-center">
          {pageTitle}
        </h1>

        {/* Right: User Avatar */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center
                     hover:bg-[#DCD2C7] transition-colors"
            aria-label="User menu"
          >
            {user ? (
              <span className="text-[#434E54] font-semibold text-sm">
                {user.first_name[0]}{user.last_name[0]}
              </span>
            ) : (
              <UserIcon className="w-5 h-5 text-[#434E54]" />
            )}
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#434E54]/10 py-2 z-50">
              {user && (
                <>
                  <div className="px-4 py-3 border-b border-[#434E54]/10">
                    <p className="font-semibold text-[#434E54] text-sm truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-[#434E54]/60">
                      {user.role === 'admin' ? 'Owner' : 'Staff'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#434E54] hover:bg-[#EAE0D5] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
