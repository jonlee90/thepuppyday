'use client';

/**
 * Announcement bars for marketing site
 * - Top bar: Store address with Google Maps link
 * - Bottom bar: Store hours
 */

import { MapPin, Clock } from 'lucide-react';

export function AnnouncementBars() {
  const address = '14936 Leffingwell Rd, La Mirada, CA 90638';
  const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const hours = 'Monday - Saturday 9:00AM - 5:00PM';

  return (
    <>
      {/* Address Bar - Above Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#434E54] border-b border-gray-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-11 sm:h-12">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-[#F8EEE5] hover:text-[#F5E7DC] transition-colors duration-200 group"
            >
              <MapPin className="w-4 h-4 text-[#F8EEE5] group-hover:text-[#F5E7DC] transition-colors duration-200" />
              <span className="underline decoration-1 underline-offset-2 decoration-[#F8EEE5]/30 group-hover:decoration-[#F8EEE5]/60 transition-all duration-200">
                {address}
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Hours Bar - Below Header */}
      <div className="fixed top-[124px] left-0 right-0 z-40 bg-[#FFFBF7] border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-9 sm:h-10">
            <div className="flex items-center gap-2 text-sm font-medium text-[#6B7280]">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              <span>{hours}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
