'use client';

import React from 'react';
import type { PetSize } from '@/types/database';

interface SizeBasedPricingInputsProps {
  prices: Record<PetSize, number>;
  onChange: (prices: Record<PetSize, number>) => void;
  errors?: Partial<Record<PetSize, string>>;
}

const SIZE_LABELS: Record<PetSize, { label: string; range: string }> = {
  small: { label: 'Small', range: '0-18 lbs' },
  medium: { label: 'Medium', range: '19-35 lbs' },
  large: { label: 'Large', range: '36-65 lbs' },
  xlarge: { label: 'X-Large', range: '66+ lbs' },
};

export function SizeBasedPricingInputs({
  prices,
  onChange,
  errors = {},
}: SizeBasedPricingInputsProps) {
  const handlePriceChange = (size: PetSize, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    onChange({
      ...prices,
      [size]: isNaN(numericValue) ? 0 : numericValue,
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-[#434E54] mb-3">
        Size-Based Pricing
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(SIZE_LABELS).map(([size, { label, range }]) => (
          <div key={size}>
            <label className="block text-sm font-medium text-[#434E54] mb-1.5">
              {label}
              <span className="text-xs text-[#6B7280] ml-1.5">({range})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prices[size as PetSize]}
                onChange={(e) => handlePriceChange(size as PetSize, e.target.value)}
                className={`w-full pl-8 pr-4 py-2.5 rounded-lg border bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
                  transition-colors duration-200
                  ${
                    errors[size as PetSize]
                      ? 'border-red-500'
                      : 'border-gray-200'
                  }
                `}
                placeholder="0.00"
              />
            </div>
            {errors[size as PetSize] && (
              <p className="text-sm text-red-600 mt-1">{errors[size as PetSize]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
