/**
 * Sticky Booking Button
 * Circular FAB at bottom-right that appears when
 * the hero "Book Your Appointment" button scrolls out of view
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useBookingModal } from '@/hooks/useBookingModal';

export function StickyBookingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { open } = useBookingModal();

  useEffect(() => {
    const heroBtn = document.getElementById('hero-book-btn');
    if (!heroBtn) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky button when hero CTA is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(heroBtn);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    open({ mode: 'customer' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 sm:w-16 sm:h-16
                     rounded-full bg-[#434E54] text-white
                     shadow-[0_4px_20px_rgba(67,78,84,0.35)]
                     hover:shadow-[0_6px_28px_rgba(67,78,84,0.45)]
                     hover:bg-[#363F44] active:scale-95
                     flex items-center justify-center
                     transition-[background-color,box-shadow] duration-200
                     cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#434E54]/40 focus:ring-offset-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          aria-label="Book your appointment"
        >
          <Calendar className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
