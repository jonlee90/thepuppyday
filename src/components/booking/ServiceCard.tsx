/**
 * Service card component for booking wizard
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white rounded-2xl overflow-hidden',
        'transition-all duration-300 group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
        isSelected
          ? 'shadow-2xl ring-2 ring-[#434E54] scale-[1.02]'
          : 'shadow-lg hover:shadow-2xl'
      )}
      aria-pressed={isSelected}
      aria-label={`Select ${service.name} service`}
    >
      {/* Enhanced image container */}
      <div className="relative aspect-video sm:aspect-[2/1] md:aspect-[5/3] bg-[#EAE0D5] overflow-hidden">
        {service.image_url ? (
          <>
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              className={cn(
                "object-contain scale-[1.2] transition-transform duration-500"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#434E54]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#434E54]/20">
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Enhanced selected indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-3 right-3 w-12 h-12 bg-[#434E54] rounded-full
                         flex items-center justify-center shadow-lg shadow-[#434E54]/50
                         ring-4 ring-white"
            >
              <svg
                className="w-7 h-7 text-white"
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

      {/* Enhanced content */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-[#434E54] text-lg sm:text-xl leading-tight">
            {service.name}
          </h3>

          {/* Duration badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#EAE0D5] text-xs font-medium text-[#434E54] flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(service.duration_minutes)}
          </div>
        </div>

        {service.description && (
          <p className="text-sm text-[#434E54]/70 line-clamp-2 mb-4 leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Enhanced pricing section */}
        <div className="flex items-end justify-between pt-4 border-t border-[#434E54]/20">
          <div>
            <p className="text-xs text-[#434E54]/60 mb-1">
              {priceRange.min !== priceRange.max ? 'Starting at' : 'Price'}
            </p>
            <span className="text-2xl font-bold text-[#434E54]">
              {priceRange.formatted}
            </span>
            {priceRange.min !== priceRange.max && (
              <p className="text-xs text-[#434E54]/60 mt-1">
                Based on pet size
              </p>
            )}
          </div>

          {/* CTA indicator */}
          <motion.div
            animate={isSelected ? { x: [0, 4, 0] } : {}}
            transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5 }}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'transition-colors duration-300',
              isSelected
                ? 'bg-[#434E54] text-white'
                : 'bg-[#EAE0D5] group-hover:bg-[#EAE0D5]/80'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}
