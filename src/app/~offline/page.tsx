'use client';

// Client component because:
// 1. Uses window.location.reload() for the retry button
// 2. Served from service worker cache, not SSR'd

import Link from 'next/link';
import { WifiOff, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Icon Illustration */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[#EAE0D5] flex items-center justify-center mx-auto">
              <WifiOff className="w-14 h-14 md:w-20 md:h-20 text-[#434E54]/60" />
            </div>
            <PawPrint className="absolute top-0 right-0 w-8 h-8 md:w-10 md:h-10 text-[#434E54]/20" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-[#434E54] mb-3">
            You&apos;re Offline
          </h1>

          <p className="text-[#434E54]/70 mb-8 max-w-md mx-auto">
            It looks like you&apos;ve lost your internet connection. Check your network settings and try again.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>

            <Link href="/">
              <Button variant="secondary" size="lg">
                Back to Homepage
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#434E54]/60">
              Need help?{' '}
              <a
                href="mailto:puppyday14936@gmail.com"
                className="text-[#434E54] hover:text-[#434E54]/80 underline"
              >
                puppyday14936@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
