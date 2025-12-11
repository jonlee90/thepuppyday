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
    <div className="w-full py-5">
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
                  'flex flex-col items-center gap-2.5 group',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
              >
                <motion.div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 shadow-md',
                    isCompleted && 'bg-[#434E54] text-white',
                    isCurrent && 'bg-[#434E54] text-white ring-4 ring-[#434E54]/20',
                    !isCompleted && !isCurrent && 'bg-[#EAE0D5] text-[#6B7280]'
                  )}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                  {isCompleted ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    isCurrent && 'text-[#434E54]',
                    isCompleted && 'text-[#434E54]',
                    !isCompleted && !isCurrent && 'text-[#6B7280]'
                  )}
                >
                  {label}
                </span>
              </button>

              {/* Connector line */}
              {index < visibleSteps.length - 1 && (
                <div className="flex-1 h-1 mx-4 bg-[#EAE0D5] rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-[#434E54] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - compact */}
      <div className="md:hidden px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#434E54]">
            Step {currentStep + 1} of {visibleSteps.length}
          </span>
          <span className="text-sm font-semibold text-[#434E54]">
            {visibleSteps[currentStep] || 'Complete'}
          </span>
        </div>
        <div className="w-full bg-[#EAE0D5] rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="bg-[#434E54] h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
