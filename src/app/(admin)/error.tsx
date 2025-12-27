'use client';

/**
 * Admin Panel Error Boundary
 * Task 0247: Create route-specific error boundaries
 *
 * Catches errors in admin panel with admin-specific messaging
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin panel error:', error);
    // TODO: Log to error tracking service with admin context
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-[#434E54] mb-2">
            Admin Panel Error
          </h2>

          <p className="text-[#434E54]/70 mb-6">
            An error occurred in the admin panel. This has been logged for investigation.
          </p>

          {/* Error Details for Admins */}
          <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6 text-left">
            {error.digest && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#434E54]/60 mb-1">
                  Error Reference:
                </p>
                <code className="text-sm font-mono text-[#434E54] break-all">
                  {error.digest}
                </code>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[#434E54]/60 mb-1">
                Error Message:
              </p>
              <p className="text-sm text-red-700 font-mono break-words">
                {error.message || 'Unknown error'}
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error.stack && (
              <details className="mt-3">
                <summary className="text-xs font-semibold text-[#434E54]/60 cursor-pointer">
                  Stack Trace (Dev Only)
                </summary>
                <pre className="text-xs font-mono text-[#434E54]/80 mt-2 overflow-auto max-h-32 bg-white p-2 rounded">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button
              variant="primary"
              onClick={reset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>

            <Link href="/admin">
              <Button
                variant="outline"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
              >
                Admin Dashboard
              </Button>
            </Link>
          </div>

          {/* Admin Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Bug className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-900 text-left">
                <strong>Admin Note:</strong> This error has been logged with full context.
                If the issue persists, check the error tracking dashboard or contact the development team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
