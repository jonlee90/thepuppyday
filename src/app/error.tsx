'use client';

/**
 * Global Error Boundary
 * Task 0246: Create global error boundary component
 *
 * Catches unhandled errors and displays a user-friendly error page
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error boundary caught:', error);
    }

    // TODO: Log to error tracking service (Sentry) in production
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-[#434E54] mb-3">
            Oops! Something went wrong
          </h1>

          <p className="text-[#434E54]/70 mb-6">
            We're sorry, but something unexpected happened. Our team has been notified and we're working to fix the issue.
          </p>

          {/* Error Digest for Support Reference */}
          {error.digest && (
            <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6">
              <p className="text-xs text-[#434E54]/60 mb-1">Error Reference:</p>
              <code className="text-sm font-mono text-[#434E54] break-all">
                {error.digest}
              </code>
              <p className="text-xs text-[#434E54]/60 mt-2">
                Please include this reference if you contact support
              </p>
            </div>
          )}

          {/* Development Mode Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-red-50 rounded-lg p-4 mb-6 text-left">
              <summary className="cursor-pointer text-sm font-semibold text-red-800 mb-2">
                Error Details (Development Only)
              </summary>
              <div className="text-xs font-mono text-red-900 overflow-auto max-h-40">
                <p className="font-bold mb-1">{error.name}: {error.message}</p>
                {error.stack && (
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
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

            <Link href="/">
              <Button
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go to Homepage
              </Button>
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#434E54]/60">
              Need help?{' '}
              <a
                href="mailto:puppyday14936@gmail.com"
                className="text-[#434E54] hover:text-[#434E54]/80 underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
