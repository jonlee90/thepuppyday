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
        <label className="label">
          <span className="label-text font-medium flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Discount Percentage
          </span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={discountPercentage}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            className="input input-bordered join-item flex-1"
            aria-label="Discount percentage"
          />
          <span className="btn btn-outline join-item">%</span>
        </div>
        <label className="label">
          <span className="label-text-alt text-gray-500">
            Default: 10%. Range: 0-100%
          </span>
        </label>
      </div>

      {/* Response Window */}
      <div>
        <label className="label">
          <span className="label-text font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Response Window
          </span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            min="1"
            max="24"
            step="1"
            value={responseWindowHours}
            onChange={(e) => onResponseWindowChange(Number(e.target.value))}
            className="input input-bordered join-item flex-1"
            aria-label="Response window in hours"
          />
          <span className="btn btn-outline join-item">hours</span>
        </div>
        <label className="label">
          <span className="label-text-alt text-gray-500">
            Default: 2 hours. Range: 1-24 hours
          </span>
        </label>
      </div>
    </div>
  );
}
