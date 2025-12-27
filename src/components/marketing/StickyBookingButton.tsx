/**
 * Sticky Booking Button
 * Appears after user scrolls past hero section
 * Opens BookingModal in customer mode
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useBookingModal } from '@/hooks/useBookingModal';

const SCROLL_THRESHOLD = 600; // Show button after scrolling 600px (past hero)

export function StickyBookingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { open } = useBookingModal();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > SCROLL_THRESHOLD);
    };

    // Check initial scroll position
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    open({ mode: 'customer' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Container with backdrop blur */}
          <div className="bg-white/80 backdrop-blur-md border-t border-[#434E54]/10 shadow-lg pointer-events-auto">
            <div className="container mx-auto px-4 py-3 md:py-4">
              {/* Desktop: Centered button */}
              <div className="hidden md:flex items-center justify-center">
                <button
                  onClick={handleClick}
                  className="bg-[#434E54] text-white font-semibold py-3.5 px-8 rounded-xl
                           shadow-md hover:shadow-xl hover:bg-[#434E54]/90
                           transform hover:-translate-y-0.5 transition-all duration-200
                           flex items-center gap-2.5"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Your Appointment</span>
                </button>
              </div>

              {/* Mobile: Full-width button */}
              <div className="md:hidden">
                <button
                  onClick={handleClick}
                  className="w-full bg-[#434E54] text-white font-semibold py-3.5 rounded-xl
                           shadow-md active:scale-[0.98] transition-transform duration-150
                           flex items-center justify-center gap-2.5"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Your Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
