/**
 * Service card component for booking wizard
 * Editorial magazine-inspired design with refined interactions
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getServicePriceRange, formatDuration } from '@/lib/booking/pricing';
import type { ServiceWithPrices } from '@/types/database';

interface ServiceCardProps {
  service: ServiceWithPrices;
  isSelected: boolean;
  onSelect: () => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  const priceRange = getServicePriceRange(service);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onSelect}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'group relative w-full text-left bg-white rounded-xl overflow-hidden',
        'transition-shadow duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261] focus-visible:ring-offset-4',
        isSelected
          ? 'shadow-[0_20px_60px_-15px_rgba(244,162,97,0.4)] ring-1 ring-[#F4A261]/30'
          : 'shadow-[0_8px_30px_-5px_rgba(67,78,84,0.15)] hover:shadow-[0_20px_60px_-15px_rgba(67,78,84,0.25)]'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${service.name} service`}
    >
      {/* Editorial Image Container - 3:2 aspect ratio */}
      <div className="relative aspect-[3/2] bg-gradient-to-br from-[#EAE0D5] to-[#F8EEE5] overflow-hidden">
        {service.image_url ? (
          <>
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              className="object-contain scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />

            {/* Selected glow overlay */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/20 to-transparent pointer-events-none"
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-[#434E54]/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Duration Badge - Top Left */}
        <div className="absolute top-4 left-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg"
          >
            <svg
              className="w-3.5 h-3.5 text-[#434E54]/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-[#434E54]">
              {formatDuration(service.duration_minutes)}
            </span>
          </motion.div>
        </div>

        {/* Selected Check - Top Right */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute top-4 right-4 w-10 h-10 bg-[#F4A261] rounded-full
                         flex items-center justify-center shadow-lg"
            >
              <svg
                className="w-6 h-6 text-white"
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

      {/* Editorial Content Section */}
      <div className="relative p-6">
        {/* Service Name - Editorial headline style */}
        <h3 className="text-2xl font-bold text-[#434E54] tracking-tight leading-tight mb-3">
          {service.name}
        </h3>

        {/* Description - Editorial body text */}
        {service.description && (
          <p className="text-[15px] text-[#434E54]/65 leading-[1.6] mb-5 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Pricing Section - Magazine price tag aesthetic */}
        <div className="relative pt-4 mt-4 border-t border-[#434E54]/10">
          <div className="flex items-end justify-between">
            {/* Price Display */}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide font-medium text-[#434E54]/50">
                {priceRange.min !== priceRange.max ? 'From' : 'Price'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-bold text-[#434E54] leading-none tracking-tight">
                  {priceRange.formatted}
                </span>
              </div>
              {priceRange.min !== priceRange.max && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-[#434E54]/50 mt-1"
                >
                  Based on pet size
                </motion.p>
              )}
            </div>

            {/* Refined CTA Arrow */}
            <motion.div
              animate={
                isSelected
                  ? { x: [0, 4, 0] }
                  : { x: 0 }
              }
              transition={
                isSelected
                  ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'transition-colors duration-200',
                isSelected
                  ? 'bg-[#F4A261] text-white shadow-lg shadow-[#F4A261]/30'
                  : 'bg-[#EAE0D5] text-[#434E54] group-hover:bg-[#434E54] group-hover:text-white'
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Selected state accent line */}
        {isSelected && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#F4A261] to-[#434E54]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        )}
      </div>
    </motion.button>
  );
}
