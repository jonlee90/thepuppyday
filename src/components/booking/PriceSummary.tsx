/**
 * Price summary component for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/booking/pricing';

interface PriceSummaryProps {
  serviceName: string | null;
  servicePrice: number;
  addons: { name: string; price: number }[];
  total: number;
}

export function PriceSummary({ serviceName, servicePrice, addons, total }: PriceSummaryProps) {
  const hasItems = serviceName !== null;

  return (
    <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 px-6 py-4">
        <h3 className="font-semibold text-base-content flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Order Summary
        </h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {!hasItems ? (
          <p className="text-base-content/50 text-sm text-center py-4">
            Select a service to see pricing
          </p>
        ) : (
          <>
            {/* Service */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-base-content">{serviceName}</p>
                <p className="text-sm text-base-content/60">Base service</p>
              </div>
              <motion.span
                key={servicePrice}
                initial={{ scale: 1.1, color: 'hsl(var(--p))' }}
                animate={{ scale: 1, color: 'hsl(var(--bc))' }}
                className="font-medium"
              >
                {formatCurrency(servicePrice)}
              </motion.span>
            </div>

            {/* Add-ons */}
            {addons.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-base-300">
                <p className="text-sm text-base-content/60">Add-ons</p>
                {addons.map((addon, index) => (
                  <motion.div
                    key={addon.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-base-content/80">{addon.name}</span>
                    <span className="text-base-content/80">{formatCurrency(addon.price)}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-base-300 pt-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-base-content">Total</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-xl font-bold text-primary"
                >
                  {formatCurrency(total)}
                </motion.span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 bg-base-200 border-t border-base-300">
        <p className="text-xs text-base-content/50 text-center">
          Payment collected at checkout
        </p>
      </div>
    </div>
  );
}
