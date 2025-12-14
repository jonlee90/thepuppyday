'use client';

/**
 * MoodSelector Component
 * Touch-friendly selector for pet mood during grooming
 */

import { Smile, Frown, Meh, Zap } from 'lucide-react';
import type { ReportCardMood } from '@/types/report-card';

interface MoodSelectorProps {
  value: ReportCardMood | null;
  onChange: (mood: ReportCardMood) => void;
}

const MOOD_OPTIONS: Array<{
  value: ReportCardMood;
  label: string;
  icon: typeof Smile;
  color: string;
}> = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-600' },
  { value: 'nervous', label: 'Nervous', icon: Frown, color: 'text-yellow-600' },
  { value: 'calm', label: 'Calm', icon: Meh, color: 'text-blue-600' },
  { value: 'energetic', label: 'Energetic', icon: Zap, color: 'text-orange-600' },
];

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#434E54] mb-3">
        Mood
      </label>
      <div className="grid grid-cols-2 gap-3">
        {MOOD_OPTIONS.map((option) => {
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
