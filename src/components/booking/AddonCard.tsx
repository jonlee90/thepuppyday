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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'w-full text-left bg-base-100 rounded-xl overflow-hidden border-2 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected ? 'border-primary shadow-md' : 'border-base-300 hover:border-primary/50',
        isUpsell && !isSelected && 'ring-2 ring-warning/30'
      )}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Checkbox */}
        <div
          className={cn(
            'w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            isSelected
              ? 'bg-primary border-primary'
              : 'border-base-300 bg-base-100'
          )}
        >
          {isSelected && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 text-primary-content"
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
              <h3 className="font-semibold text-base-content">{addon.name}</h3>
              {isUpsell && !isSelected && (
                <span className="inline-block bg-warning/20 text-warning text-xs font-medium px-2 py-0.5 rounded mt-1">
                  Recommended
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-primary flex-shrink-0">
              +{formatCurrency(addon.price)}
            </span>
          </div>

          {addon.description && (
            <p className="text-sm text-base-content/70 mt-1">{addon.description}</p>
          )}

          {isUpsell && addon.upsell_prompt && !isSelected && (
            <p className="text-sm text-warning mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
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
