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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-base-100 rounded-xl overflow-hidden border-2 transition-colors',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected ? 'border-primary shadow-lg' : 'border-base-300'
      )}
    >
      {/* Image */}
      <div className="relative h-40 bg-base-300">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/30">
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
            className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-primary-content"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base-content text-lg mb-1">{service.name}</h3>

        {service.description && (
          <p className="text-sm text-base-content/70 line-clamp-2 mb-3">{service.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">{priceRange.formatted}</span>
            {priceRange.min !== priceRange.max && (
              <span className="text-xs text-base-content/50 block">Based on pet size</span>
            )}
          </div>

          <div className="text-right">
            <span className="text-sm text-base-content/60 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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
