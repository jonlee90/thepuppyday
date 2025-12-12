/**
 * CustomerFlagBadge Component
 * Displays customer flags with color-coded badges
 * Task 0020: Create CustomerFlagBadge component
 */

'use client';

import { AlertCircle, Star, FileWarning, Heart, Scissors, Info } from 'lucide-react';
import type { CustomerFlag, CustomerFlagType } from '@/types/database';

interface CustomerFlagBadgeProps {
  flags: CustomerFlag[];
  maxVisible?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface FlagConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const FLAG_CONFIG: Record<CustomerFlagType, FlagConfig> = {
  aggressive_dog: {
    label: 'Aggressive Dog',
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  payment_issues: {
    label: 'Payment Issues',
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  vip: {
    label: 'VIP',
    icon: Star,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  special_needs: {
    label: 'Special Needs',
    icon: Heart,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  grooming_notes: {
    label: 'Grooming Notes',
    icon: Scissors,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  other: {
    label: 'Other',
    icon: Info,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

const SIZE_CLASSES = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    icon: 'w-3 h-3',
    gap: 'gap-1',
  },
  md: {
    text: 'text-sm',
    padding: 'px-2.5 py-1',
    icon: 'w-3.5 h-3.5',
    gap: 'gap-1.5',
  },
  lg: {
    text: 'text-base',
    padding: 'px-3 py-1.5',
    icon: 'w-4 h-4',
    gap: 'gap-2',
  },
};

export function CustomerFlagBadge({
  flags,
  maxVisible = 2,
  showIcon = true,
  size = 'sm',
}: CustomerFlagBadgeProps) {
  // Filter active flags only
  const activeFlags = flags.filter((flag) => flag.is_active);

  if (activeFlags.length === 0) {
    return null;
  }

  const sizeClasses = SIZE_CLASSES[size];

  // Prioritize aggressive_dog flag to always show first
  const sortedFlags = [...activeFlags].sort((a, b) => {
    if (a.flag_type === 'aggressive_dog') return -1;
    if (b.flag_type === 'aggressive_dog') return 1;
    return 0;
  });

  const visibleFlags = sortedFlags.slice(0, maxVisible);
  const remainingCount = sortedFlags.length - maxVisible;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibleFlags.map((flag) => {
        const config = FLAG_CONFIG[flag.flag_type];
        const Icon = config.icon;

        return (
          <div
            key={flag.id}
            className={`
              inline-flex items-center ${sizeClasses.gap} ${sizeClasses.padding}
              ${config.bgColor} ${config.textColor} ${config.borderColor}
              border rounded-full font-medium ${sizeClasses.text}
              transition-all duration-200 hover:shadow-sm
            `}
            title={flag.description}
          >
            {showIcon && <Icon className={sizeClasses.icon} />}
            <span>{config.label}</span>
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div
          className={`
            inline-flex items-center ${sizeClasses.gap} ${sizeClasses.padding}
            bg-gray-50 text-gray-700 border border-gray-200
            rounded-full font-medium ${sizeClasses.text}
            cursor-help transition-all duration-200 hover:shadow-sm
          `}
          title={sortedFlags
            .slice(maxVisible)
            .map((f) => FLAG_CONFIG[f.flag_type].label)
            .join(', ')}
        >
          <Info className={sizeClasses.icon} />
          <span>+{remainingCount} more</span>
        </div>
      )}
    </div>
  );
}

/**
 * Single Flag Badge - for standalone use
 */
interface SingleFlagBadgeProps {
  flag: CustomerFlag;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function SingleFlagBadge({
  flag,
  showIcon = true,
  size = 'sm',
  onClick,
}: SingleFlagBadgeProps) {
  const config = FLAG_CONFIG[flag.flag_type];
  const Icon = config.icon;
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={`
        inline-flex items-center ${sizeClasses.gap} ${sizeClasses.padding}
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border rounded-full font-medium ${sizeClasses.text}
        transition-all duration-200 hover:shadow-sm
        ${onClick ? 'cursor-pointer' : ''}
      `}
      title={flag.description}
      onClick={onClick}
    >
      {showIcon && <Icon className={sizeClasses.icon} />}
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Helper function to get flag type label
 */
export function getFlagLabel(flagType: CustomerFlagType): string {
  return FLAG_CONFIG[flagType]?.label || flagType;
}

/**
 * Helper function to get flag color classes
 */
export function getFlagColorClasses(flagType: CustomerFlagType) {
  return FLAG_CONFIG[flagType] || FLAG_CONFIG.other;
}
