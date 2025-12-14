'use client';

/**
 * BehaviorSelector Component
 * Touch-friendly selector for behavior assessment during grooming
 */

import { ThumbsUp, Minus, AlertCircle } from 'lucide-react';
import type { BehaviorRating } from '@/types/report-card';

interface BehaviorSelectorProps {
  value: BehaviorRating | null;
  onChange: (behavior: BehaviorRating) => void;
}

const BEHAVIOR_OPTIONS: Array<{
  value: BehaviorRating;
  label: string;
  icon: typeof ThumbsUp;
  color: string;
}> = [
  { value: 'great', label: 'Great', icon: ThumbsUp, color: 'text-green-600' },
  { value: 'some_difficulty', label: 'Some Difficulty', icon: Minus, color: 'text-yellow-600' },
  { value: 'required_extra_care', label: 'Required Extra Care', icon: AlertCircle, color: 'text-orange-600' },
];

export function BehaviorSelector({ value, onChange }: BehaviorSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#434E54] mb-3">
        Behavior
      </label>
      <div className="grid grid-cols-1 gap-3">
        {BEHAVIOR_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                min-h-[60px] min-w-[44px]
                ${
                  isSelected
                    ? 'border-[#434E54] bg-[#F8EEE5] shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-6 h-6 ${isSelected ? option.color : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-[#434E54]' : 'text-gray-600'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
