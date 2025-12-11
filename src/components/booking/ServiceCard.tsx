/**
 * Service card component for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-white rounded-xl overflow-hidden transition-all duration-200',
        'hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:ring-offset-2',
        isSelected ? 'shadow-xl ring-2 ring-[#434E54]' : 'shadow-md'
      )}
    >
      {/* Image */}
      <div className="relative h-48 bg-[#EAE0D5]">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#434E54]/30">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-10 h-10 bg-[#434E54] rounded-full flex items-center justify-center shadow-lg"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-[#434E54] text-xl mb-2">{service.name}</h3>

        {service.description && (
          <p className="text-sm text-[#6B7280] line-clamp-2 mb-4 leading-relaxed">{service.description}</p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-[#434E54]">{priceRange.formatted}</span>
            {priceRange.min !== priceRange.max && (
              <span className="text-xs text-[#6B7280] block mt-0.5">Based on pet size</span>
            )}
          </div>

          <div className="text-right">
            <span className="text-sm text-[#6B7280] flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDuration(service.duration_minutes)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
