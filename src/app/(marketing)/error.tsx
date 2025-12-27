'use client';

/**
 * Marketing Pages Error Boundary
 * Task 0247: Create route-specific error boundaries
 *
 * Catches errors on public marketing pages
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Marketing page error:', error);
    }
    // TODO: Log to error tracking service
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#434E54] mb-3">
            Oops! Something went wrong
          </h2>

          <p className="text-[#434E54]/70 mb-6">
            We're experiencing a temporary issue loading this page. Please try refreshing or come back shortly.
          </p>

          {/* Error Reference */}
          {error.digest && (
            <div className="bg-[#F8EEE5] rounded-lg p-3 mb-6">
              <p className="text-xs text-[#434E54]/60 mb-1">
                Error Reference:
              </p>
              <code className="text-xs font-mono text-[#434E54]">
                {error.digest}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              variant="primary"
              onClick={reset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>

            <Link href="/">
              <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="bg-[#F8EEE5] rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-[#434E54]" />
              <p className="text-sm font-semibold text-[#434E54]">
                Need immediate assistance?
              </p>
            </div>
            <p className="text-sm text-[#434E54]/70 mb-1">
              Call us at{' '}
              <a
                href="tel:+16572522903"
                className="text-[#434E54] font-semibold hover:underline"
              >
                (657) 252-2903
              </a>
            </p>
            <p className="text-xs text-[#434E54]/60">
              Monday - Saturday, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
