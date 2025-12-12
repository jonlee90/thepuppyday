/**
 * Add-on card component for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/booking/pricing';
import type { Addon } from '@/types/database';

interface AddonCardProps {
  addon: Addon;
  isSelected: boolean;
  isUpsell?: boolean;
  onToggle: () => void;
}

export function AddonCard({ addon, isSelected, isUpsell = false, onToggle }: AddonCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'w-full text-left bg-white rounded-xl overflow-hidden transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:ring-offset-2',
        isSelected ? 'shadow-lg ring-2 ring-[#434E54]' : 'shadow-md hover:shadow-lg',
        isUpsell && !isSelected && 'ring-2 ring-[#434E54]/40'
      )}
    >
      <div className="p-5 flex items-start gap-4">
        {/* Checkbox */}
        <div
          className={cn(
            'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors shadow-sm',
            isSelected
              ? 'bg-[#434E54] border-[#434E54]'
              : 'border-[#EAE0D5] bg-white'
          )}
        >
          {isSelected && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#434E54]">{addon.name}</h3>
              {isUpsell && !isSelected && (
                <span className="inline-block bg-[#434E54]/20 text-[#434E54] text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5">
                  Recommended
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-[#434E54] flex-shrink-0">
              +{formatCurrency(addon.price)}
            </span>
          </div>

          {addon.description && (
            <p className="text-sm text-[#434E54]/60 mt-2 leading-relaxed">{addon.description}</p>
          )}

          {isUpsell && addon.upsell_prompt && !isSelected && (
            <p className="text-sm text-[#434E54] mt-3 flex items-center gap-1.5 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {addon.upsell_prompt}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
