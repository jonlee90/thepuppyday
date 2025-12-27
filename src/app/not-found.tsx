/**
 * Custom 404 Not Found Page
 * Task 0248: Create custom not-found page
 *
 * Displayed when a page/route doesn't exist
 */

import Link from 'next/link';
import { Home, Search, Calendar, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-[#F8EEE5] to-[#FFFBF7] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* 404 Illustration */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <h1 className="text-[120px] md:text-[180px] font-bold text-[#434E54]/10 leading-none">
              404
            </h1>
            <PawPrint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 text-[#434E54]/20" />
          </div>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-[#434E54] mb-3">
            Page Not Found
          </h2>

          <p className="text-[#434E54]/70 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          {/* Quick Navigation */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#434E54]/60 uppercase tracking-wide mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#434E54] hover:bg-[#F8EEE5] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center group-hover:bg-[#434E54] transition-colors">
                  <Home className="w-5 h-5 text-[#434E54] group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#434E54]">Homepage</p>
                  <p className="text-xs text-[#434E54]/60">Learn about our services</p>
                </div>
              </Link>

              <Link
                href="/book"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#434E54] hover:bg-[#F8EEE5] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center group-hover:bg-[#434E54] transition-colors">
                  <Calendar className="w-5 h-5 text-[#434E54] group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#434E54]">Book Appointment</p>
                  <p className="text-xs text-[#434E54]/60">Schedule grooming</p>
                </div>
              </Link>

              <Link
                href="/services"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#434E54] hover:bg-[#F8EEE5] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center group-hover:bg-[#434E54] transition-colors">
                  <PawPrint className="w-5 h-5 text-[#434E54] group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#434E54]">Our Services</p>
                  <p className="text-xs text-[#434E54]/60">View pricing & packages</p>
                </div>
              </Link>

              <Link
                href="/contact"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#434E54] hover:bg-[#F8EEE5] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center group-hover:bg-[#434E54] transition-colors">
                  <Search className="w-5 h-5 text-[#434E54] group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#434E54]">Contact Us</p>
                  <p className="text-xs text-[#434E54]/60">Get in touch</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Back to Home Button */}
          <Link href="/">
            <Button variant="primary" size="lg" leftIcon={<Home className="w-5 h-5" />}>
              Back to Homepage
            </Button>
          </Link>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-[#434E54]/60">
              Still can't find what you're looking for?{' '}
              <a
                href="mailto:puppyday14936@gmail.com"
                className="text-[#434E54] hover:text-[#434E54]/80 underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
