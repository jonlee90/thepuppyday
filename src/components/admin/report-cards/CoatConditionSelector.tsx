'use client';

/**
 * CoatConditionSelector Component
 * Touch-friendly selector for coat condition assessment
 */

import { Star, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import type { CoatCondition } from '@/types/report-card';

interface CoatConditionSelectorProps {
  value: CoatCondition | null;
  onChange: (condition: CoatCondition) => void;
}

const COAT_OPTIONS: Array<{
  value: CoatCondition;
  label: string;
  icon: typeof Star;
  color: string;
}> = [
  { value: 'excellent', label: 'Excellent', icon: Star, color: 'text-green-600' },
  { value: 'good', label: 'Good', icon: CheckCircle, color: 'text-blue-600' },
  { value: 'matted', label: 'Matted', icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'needs_attention', label: 'Needs Attention', icon: AlertCircle, color: 'text-red-600' },
];

export function CoatConditionSelector({ value, onChange }: CoatConditionSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#434E54] mb-3">
        Coat Condition
      </label>
      <div className="grid grid-cols-2 gap-3">
        {COAT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                min-h-[100px] min-w-[44px]
                ${
                  isSelected
                    ? 'border-[#434E54] bg-[#F8EEE5] shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-8 h-8 mb-2 ${isSelected ? option.color : 'text-gray-400'}`} />
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
