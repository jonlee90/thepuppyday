'use client';

/**
 * Authentication Error Boundary
 * Task 0247: Create route-specific error boundaries
 *
 * Catches errors during authentication flows with retry focus
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', error);
    }
    // TODO: Log to error tracking service
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] flex items-center justify-center px-4">
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
            Authentication Error
          </h2>

          <p className="text-[#434E54]/70 mb-6">
            We encountered an error during the authentication process. This could be due to a temporary issue.
          </p>

          {/* Common Causes */}
          <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-[#434E54] mb-2">
              Common causes:
            </p>
            <ul className="text-sm text-[#434E54]/70 space-y-1 list-disc list-inside">
              <li>Network connection issue</li>
              <li>Session expired</li>
              <li>Browser cache or cookies disabled</li>
              <li>Temporary service disruption</li>
            </ul>
          </div>

          {/* Error Reference */}
          {error.digest && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-[#434E54]/60 mb-1">Error ID:</p>
              <code className="text-xs font-mono text-[#434E54]">
                {error.digest}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={reset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              Try Again
            </Button>

            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                leftIcon={<LogIn className="w-4 h-4" />}
                className="w-full"
              >
                Back to Login
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#434E54]/60">
              Still having trouble?{' '}
              <a
                href="mailto:puppyday14936@gmail.com"
                className="text-[#434E54] hover:text-[#434E54]/80 underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
