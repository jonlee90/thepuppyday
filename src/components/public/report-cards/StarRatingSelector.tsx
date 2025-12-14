'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface StarRatingSelectorProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * StarRatingSelector - Interactive 5-star rating selector
 * Features: Hover effects, touch-friendly sizing (44x44px), accessible
 */
export function StarRatingSelector({
  value,
  onChange,
  disabled = false,
}: StarRatingSelectorProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div
      role="radiogroup"
      aria-label="Rate your experience"
      className="flex items-center justify-center gap-2"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hoverValue || value) >= star;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            className="btn btn-ghost w-11 h-11 p-0 min-h-0"
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => !disabled && onChange(star)}
            whileHover={!disabled ? { scale: 1.1 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            aria-label={`Rate ${star} stars`}
            role="radio"
            aria-checked={value === star}
          >
            <Star
              className="w-8 h-8 transition-all duration-200"
              fill={isActive ? '#FFB347' : 'none'}
              stroke={isActive ? '#FFB347' : '#D1D5DB'}
              strokeWidth={2}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
