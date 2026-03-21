/**
 * Compact service card for quick/minor services (e.g., Nail Trim)
 * Horizontal layout with icon instead of image
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getServicePriceRange, formatDuration } from '@/lib/booking/pricing';
import type { ServiceWithPrices } from '@/types/database';

interface QuickServiceCardProps {
  service: ServiceWithPrices;
  isSelected: boolean;
  onSelect: () => void;
}

export function QuickServiceCard({ service, isSelected, onSelect }: QuickServiceCardProps) {
  const priceRange = getServicePriceRange(service);

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'group relative w-full text-left bg-white rounded-xl overflow-hidden',
        'transition-shadow duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54] focus-visible:ring-offset-4',
        isSelected
          ? 'shadow-[0_12px_40px_-10px_rgba(67,78,84,0.35)] ring-1 ring-[#434E54]/30'
          : 'shadow-[0_6px_20px_-5px_rgba(67,78,84,0.12)] hover:shadow-[0_12px_40px_-10px_rgba(67,78,84,0.2)]'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${service.name} service`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icon Circle */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#EAE0D5] flex items-center justify-center">
          <Scissors className="w-5 h-5 text-[#434E54]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[#434E54] leading-tight">
            {service.name}
          </h3>
          <p className="text-xs text-[#434E54]/50 mt-0.5">
            ~{formatDuration(service.duration_minutes)}
          </p>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <span className="text-lg font-bold text-[#434E54]">
            ${priceRange.min}
          </span>
        </div>

        {/* Selected Checkmark */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute top-2 right-2 w-7 h-7 bg-[#434E54] rounded-full flex items-center justify-center shadow-md"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected accent line */}
      {isSelected && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#EAE0D5] to-[#434E54]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          style={{ transformOrigin: 'left', width: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  );
}
