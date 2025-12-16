/**
 * Phase 8: Unsubscribe Error Page
 * Shown when unsubscribe action fails
 */

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UnsubscribeErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';

  const errorMessages: Record<string, { title: string; description: string }> = {
    missing_token: {
      title: 'Missing Token',
      description: 'The unsubscribe link is missing required information. Please use the link from your email.',
    },
    invalid_token: {
      title: 'Invalid or Expired Link',
      description: 'This unsubscribe link is invalid or has expired. Links expire after 30 days.',
    },
    update_failed: {
      title: 'Update Failed',
      description: 'We were unable to update your preferences. Please try again or contact support.',
    },
    server_error: {
      title: 'Server Error',
      description: 'An unexpected error occurred. Please try again later or contact support.',
    },
    unknown: {
      title: 'Error',
      description: 'An error occurred while processing your request.',
    },
  };

  const error = errorMessages[reason] || errorMessages.unknown;

  return (
    <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#434E54] mb-2">
            {error.title}
          </h1>
          <p className="text-[#6B7280]">
            {error.description}
          </p>
        </div>

        <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#434E54] font-medium mb-2">
            Need help?
          </p>
          <p className="text-sm text-[#6B7280]">
            You can manage your notification preferences directly from your account settings,
            or contact us for assistance.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/customer/settings"
            className="block w-full bg-[#434E54] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#363F44] transition-colors"
          >
            Go to Settings
          </Link>
          <Link
            href="/"
            className="block w-full bg-[#EAE0D5] text-[#434E54] px-6 py-3 rounded-lg font-medium hover:bg-[#DDD3C8] transition-colors"
          >
            Return Home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-[#6B7280]">
            Contact us:{' '}
            <a href="mailto:puppyday14936@gmail.com" className="text-[#434E54] font-medium hover:underline">
              puppyday14936@gmail.com
            </a>
            <br />
            <a href="tel:6572522903" className="text-[#434E54] font-medium hover:underline">
              (657) 252-2903
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-[#434E54]">Loading...</div>
      </div>
    }>
      <UnsubscribeErrorContent />
    </Suspense>
  );
}
