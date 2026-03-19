'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface MobileSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function MobileSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: MobileSegmentedControlProps<T>) {
  const activeIndex = options.findIndex((o) => o.value === value);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (index + 1) % options.length;
        onChange(options[next].value);
        tabRefs.current[next]?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (index - 1 + options.length) % options.length;
        onChange(options[prev].value);
        tabRefs.current[prev]?.focus();
      }
    },
    [options, onChange]
  );

  return (
    <div
      role="tablist"
      aria-label="View options"
      className={`relative flex bg-[#EAE0D5]/50 rounded-xl p-1 ${className}`}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => { tabRefs.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="relative flex-1 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer text-sm font-medium transition-colors z-10 rounded-lg select-none"
          >
            {isActive && (
              <motion.div
                layoutId="segment-highlight"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-[#434E54]' : 'text-[#434E54]/50'}`}>
              {option.icon && <span className="w-4 h-4 flex-shrink-0">{option.icon}</span>}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
