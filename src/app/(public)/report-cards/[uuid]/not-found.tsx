import Link from 'next/link';

/**
 * Not Found Page for Report Cards
 * Shown when a report card UUID doesn't exist
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 lg:p-12 rounded-xl shadow-lg">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-[#434E54] mb-3">
            Report Card Not Found
          </h1>

          {/* Description */}
          <p className="text-[#6B7280] mb-8 leading-relaxed">
            We couldn't find the grooming report card you're looking for. The
            link may be incorrect or the report card may have been removed.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-[#434E54] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#363F44] transition-colors duration-200"
            >
              Go to Homepage
            </Link>
            <a
              href="tel:6572522903"
              className="block w-full bg-[#F8EEE5] text-[#434E54] font-medium py-3 px-6 rounded-lg hover:bg-[#EAE0D5] transition-colors duration-200"
            >
              Call Us
            </a>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#6B7280]">Need help?</p>
            <p className="text-sm font-medium text-[#434E54] mt-1">
              (657) 252-2903
            </p>
            <p className="text-sm text-[#6B7280] mt-1">
              puppyday14936@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
