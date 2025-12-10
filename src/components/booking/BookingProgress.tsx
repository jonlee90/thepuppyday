/**
 * Booking wizard progress indicator
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BOOKING_STEP_LABELS } from '@/stores/bookingStore';

interface BookingProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigateToStep?: (step: number) => boolean;
}

export function BookingProgress({
  currentStep,
  onStepClick,
  canNavigateToStep,
}: BookingProgressProps) {
  // Don't show confirmation step in progress
  const visibleSteps = BOOKING_STEP_LABELS.slice(0, -1);

  return (
    <div className="w-full py-4">
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between max-w-3xl mx-auto px-4">
        {visibleSteps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = canNavigateToStep?.(index) ?? false;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Step circle and label */}
              <button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-2 group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-content',
                    isCurrent && 'bg-primary text-primary-content ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-base-300 text-base-content/50'
                  )}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-base-content',
                    !isCompleted && !isCurrent && 'text-base-content/50'
                  )}
                >
                  {label}
                </span>
              </button>

              {/* Connector line */}
              {index < visibleSteps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-base-300 relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - compact */}
      <div className="md:hidden px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-base-content">
            Step {currentStep + 1} of {visibleSteps.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {visibleSteps[currentStep] || 'Complete'}
          </span>
        </div>
        <div className="w-full bg-base-300 rounded-full h-2">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
