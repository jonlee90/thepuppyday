'use client';

/**
 * Marketing site header with sticky navigation
 * Uses Next.js Link for page navigation with pathname-based active state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { AddressBar, HoursBar } from '@/components/marketing/AnnouncementBars';
import { useAuthStore } from '@/stores/auth-store';

interface HeaderProps {
  hoursText?: string;
}

const navLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Header({ hoursText }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  const SCROLL_THRESHOLD = 10;

  const updateHeader = useCallback(() => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY.current;

    if (Math.abs(delta) >= SCROLL_THRESHOLD) {
      if (delta > 0 && currentScrollY > 160) {
        setIsHeaderVisible(false);
        setMobileMenuOpen(false);
      } else if (delta < 0) {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }

    if (currentScrollY <= 0) {
      setIsHeaderVisible(true);
      lastScrollY.current = 0;
    }

    ticking.current = false;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateHeader);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateHeader]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out will-change-transform"
      style={{
        transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <AddressBar />
      <div className="transition-all duration-300 bg-white shadow-md backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-200 group-hover:scale-105">
                <OptimizedImage
                  src="/images/puppy_day_logo_dog_only_transparent.png"
                  alt="Puppy Day Logo"
                  fill
                  className="object-contain"
                  priority={true}
                  enableBlur={false}
                  sizes="(max-width: 640px) 40px, 48px"
                />
              </div>
              <span className="text-xl sm:text-2xl font-semibold text-[#434E54] tracking-tight">
                PUPPY DAY
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                      isActive
                        ? 'text-[#434E54]'
                        : 'text-[#6B7280] hover:text-[#434E54]'
                    }`}
                  >
                    {link.label}
                    {isActive ? (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-[#F8EEE5] rounded-lg -z-10"
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA Button */}
            <div className="hidden lg:block">
              {isAuthenticated ? (
                <Link
                  href={(user as any)?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#434E54] rounded-lg hover:bg-[#363F44] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  My Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#434E54] rounded-lg hover:bg-[#363F44] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg text-[#434E54] hover:bg-[#F8EEE5] transition-colors duration-200 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden border-t border-gray-200"
              >
                <nav className="py-4 space-y-1">
                  {navLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-lg ${
                          isActive
                            ? 'text-[#434E54] bg-[#F8EEE5]'
                            : 'text-[#6B7280] hover:text-[#434E54] hover:bg-[#F8EEE5]/50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="pt-4 px-4 space-y-2">
                    {isAuthenticated ? (
                      <Link
                        href={(user as any)?.role === 'admin' ? '/admin' : '/dashboard'}
                        className="block w-full px-6 py-3 text-sm font-semibold text-white bg-[#434E54] rounded-lg hover:bg-[#363F44] transition-all duration-200 shadow-sm text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Account
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        className="block w-full px-6 py-3 text-sm font-semibold text-white bg-[#434E54] rounded-lg hover:bg-[#363F44] transition-all duration-200 shadow-sm text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    )}
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <HoursBar hoursText={hoursText} />
    </header>
  );
}
