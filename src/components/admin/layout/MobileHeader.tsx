/**
 * Mobile Header Component
 * Fixed top header for mobile devices (<768px)
 * Includes hamburger menu toggle and user avatar
 */

'use client';

import Link from 'next/link';
import { Menu, User as UserIcon } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import type { User } from '@/types/database';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface MobileHeaderProps {
  user: User;
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const { toggleMobileDrawer } = useAdminStore();
  const { signOut } = useAuth();
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
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#434E54]/10 shadow-sm">
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left: Hamburger Menu */}
        <button
          onClick={toggleMobileDrawer}
          className="w-11 h-11 flex items-center justify-center rounded-lg
                   text-[#434E54] hover:bg-[#EAE0D5] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <div className="w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-[#434E54] leading-tight">
              Puppy Day
            </span>
            <span className="text-xs text-[#434E54]/60 leading-none">Admin</span>
          </div>
        </Link>

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
