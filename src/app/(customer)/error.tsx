'use client';

/**
 * Customer Portal Error Boundary
 * Task 0247: Create route-specific error boundaries
 *
 * Catches errors in customer portal while preserving layout
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Customer portal error:', error);
    }
    // TODO: Log to error tracking service
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-[#434E54] mb-2">
            Something went wrong
          </h2>

          <p className="text-[#434E54]/70 mb-6">
            We encountered an error while loading this page. Please try again.
          </p>

          {/* Error Digest */}
          {error.digest && (
            <div className="bg-[#F8EEE5] rounded-lg p-3 mb-6">
              <p className="text-xs text-[#434E54]/60 mb-1">Error ID:</p>
              <code className="text-xs font-mono text-[#434E54]">
                {error.digest}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={reset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>

            <Link href="/dashboard">
              <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Support */}
          <p className="text-xs text-[#434E54]/60 mt-6">
            If this problem persists,{' '}
            <a
              href="mailto:puppyday14936@gmail.com"
              className="text-[#434E54] underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
