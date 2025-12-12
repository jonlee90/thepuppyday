'use client';

/**
 * Top announcement bar - Clean & Elegant Professional design
 * Displays location and social media links
 */

import { MapPin, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnnouncementBar() {
  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=14936+Leffingwell+Rd,+La+Mirada+CA';
  const instagramUrl = 'https://www.instagram.com/thepuppyday/';
  const yelpUrl = 'https://www.yelp.com/biz/the-puppy-day-la-mirada';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#434E54] text-white border-b border-[#363F44]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 gap-4">
          {/* Center: Location - More clickable appearance */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 text-xs sm:text-sm group px-4 py-1.5 rounded-lg hover:bg-[#5A6670] transition-all duration-200"
          >
            <MapPin className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium underline decoration-dotted decoration-white/40 underline-offset-2 group-hover:decoration-white/80 group-hover:text-[#F8EEE5]">
              14936 Leffingwell Rd, La Mirada CA
            </span>
            <svg
              className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Right: Social Media */}
          <div className="flex items-center gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our Instagram"
              className="p-1.5 rounded-lg hover:bg-[#5A6670] transition-all duration-200 hover:scale-110"
            >
              <Instagram className="w-4 h-4" strokeWidth={2} />
            </a>
            <a
              href={yelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our Yelp page"
              className="p-1.5 rounded-lg hover:bg-[#5A6670] transition-all duration-200 hover:scale-110"
            >
              {/* Yelp Icon SVG */}
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.271 17.654c-.07.417.09.833.418 1.062.328.229.77.229 1.098 0l3.294-2.292c.328-.229.488-.645.418-1.062l-.418-2.5c-.07-.417-.418-.729-.84-.729h-3.294c-.418 0-.77.312-.84.729l-.418 2.5-.418 2.292zM8.854 13.021c-.328.229-.418.645-.348 1.062l.418 2.5c.07.417.418.729.84.729h3.294c.418 0 .77-.312.84-.729l.418-2.5c.07-.417-.02-.833-.348-1.062l-2.556-1.771c-.328-.229-.77-.229-1.098 0l-2.46 1.771zM15.021 9.604c.328-.229.418-.645.348-1.062l-.418-2.5c-.07-.417-.418-.729-.84-.729h-3.294c-.418 0-.77.312-.84.729l-.418 2.5c-.07.417.02.833.348 1.062l2.556 1.771c.328.229.77.229 1.098 0l2.46-1.771zM7.312 8.542c.07-.417-.09-.833-.418-1.062-.328-.229-.77-.229-1.098 0L2.5 9.771c-.328.229-.488.645-.418 1.062l.418 2.5c.07.417.418.729.84.729h3.294c.418 0 .77-.312.84-.729l.418-2.5.42-2.291z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
