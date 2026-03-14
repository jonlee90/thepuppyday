'use client';

import { Percent, Clock } from 'lucide-react';

interface DiscountInputProps {
  discountPercentage: number;
  responseWindowHours: number;
  onDiscountChange: (value: number) => void;
  onResponseWindowChange: (value: number) => void;
}

/**
 * DiscountInput - Input controls for discount and response window
 * Allows admin to customize offer terms
 */
export function DiscountInput({
  discountPercentage,
  responseWindowHours,
  onDiscountChange,
  onResponseWindowChange,
}: DiscountInputProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Discount Percentage */}
      <div>
        <label className="block text-sm font-medium text-[#434E54] mb-1.5">
          <span className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Discount Percentage
          </span>
        </label>
        <div className="flex">
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={discountPercentage}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            className="flex-1 px-3 py-2.5 rounded-l-lg border border-r-0 border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors text-sm"
            aria-label="Discount percentage"
          />
          <span className="px-3 py-2.5 bg-[#EAE0D5] text-[#434E54]/70 text-sm font-medium rounded-r-lg border border-l-0 border-[#434E54]/20">
            %
          </span>
        </div>
        <p className="text-xs text-[#434E54]/40 mt-1">
          Default: 10%. Range: 0-100%
        </p>
      </div>

      {/* Response Window */}
      <div>
        <label className="block text-sm font-medium text-[#434E54] mb-1.5">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Response Window
          </span>
        </label>
        <div className="flex">
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            value={responseWindowHours}
            onChange={(e) => onResponseWindowChange(Number(e.target.value))}
            className="flex-1 px-3 py-2.5 rounded-l-lg border border-r-0 border-[#434E54]/20 bg-white text-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/30 focus:border-[#434E54]/40 transition-colors text-sm"
            aria-label="Response window in hours"
          />
          <span className="px-3 py-2.5 bg-[#EAE0D5] text-[#434E54]/70 text-sm font-medium rounded-r-lg border border-l-0 border-[#434E54]/20">
            hours
          </span>
        </div>
        <p className="text-xs text-[#434E54]/40 mt-1">
          Default: 2 hours. Range: 1-24 hours
        </p>
      </div>
    </div>
  );
}
