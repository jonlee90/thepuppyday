/**
 * Auth layout - Clean & elegant professional layout for login/register pages
 * Uses marketing footer for consistency
 *
 * NOTE: AuthLayout is intentionally synchronous (no async/await at the layout level).
 * Moving data fetching into AuthFooter prevents Next.js from wrapping the entire
 * layout content in an internal streaming Suspense boundary, which caused a
 * hydration mismatch between the server's <Suspense> placeholder and the client's
 * <div className="w-full max-w-md"> wrapper.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/marketing/Footer';
import { getBusinessInfo } from '@/lib/site-content';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header matching marketing style */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo matching marketing header */}
            <Link
              href="/"
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="/images/puppy_day_logo_dog_only_transparent.png"
                  alt="Puppy Day Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl sm:text-2xl font-semibold text-[#434E54] tracking-tight">
                PUPPY DAY
              </span>
            </Link>

            {/* Simple navigation for auth pages */}
            <Link
              href="/"
              className="text-sm font-medium text-[#6B7280] hover:text-[#434E54] transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content with gradient background */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#F8EEE5] via-[#FFFBF7] to-[#EAE0D5]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer fetches its own data in a sub-component to keep layout synchronous */}
      <Suspense fallback={<div className="bg-[#EAE0D5] h-16" />}>
        <AuthFooter />
      </Suspense>
    </div>
  );
}

async function AuthFooter() {
  const businessInfo = await getBusinessInfo();
  return <Footer businessInfo={businessInfo} />;
}
