/**
 * Phase 8: Unsubscribe Success Page
 * Shown after successful unsubscribe action
 */

import Link from 'next/link';
import { Suspense } from 'react';

function UnsubscribeSuccessContent() {
  return (
    <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#434E54] mb-2">
            Successfully Unsubscribed
          </h1>
          <p className="text-[#6B7280]">
            Your notification preferences have been updated.
          </p>
        </div>

        <div className="bg-[#F8EEE5] rounded-lg p-4 mb-6">
          <p className="text-sm text-[#434E54]">
            You will no longer receive these notifications. You can update your preferences
            at any time from your account settings.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/customer/settings"
            className="block w-full bg-[#434E54] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#363F44] transition-colors"
          >
            Manage Preferences
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
            Changed your mind?{' '}
            <Link href="/customer/settings" className="text-[#434E54] font-medium hover:underline">
              Update your settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-[#434E54]">Loading...</div>
      </div>
    }>
      <UnsubscribeSuccessContent />
    </Suspense>
  );
}
