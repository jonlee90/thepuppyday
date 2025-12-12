'use client';

/**
 * Hours announcement bar - Clean & Elegant Professional design
 * Displays business hours below the header
 */

import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function HoursBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-[124px] left-0 right-0 z-30 bg-[#F8EEE5] border-b border-[#EAE0D5]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#434E54]">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">Store Hours:</span>
            <span className="font-medium">Monday - Saturday 9:00AM - 5:00PM</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
