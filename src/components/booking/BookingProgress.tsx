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
      <div className="hidden md:flex items-center justify-between max-w-4xl mx-auto px-4">
        {visibleSteps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = canNavigateToStep?.(index) ?? false;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Enhanced step circle - larger touch target */}
              <button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-3 group transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2 rounded-xl p-2',
                  isClickable && 'cursor-pointer hover:scale-105',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${label}${isCompleted ? ' - Completed' : ''}${isCurrent ? ' - Current' : ''}`}
              >
                {/* Larger circle with better animation */}
                <motion.div
                  className={cn(
                    'relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-lg',
                    isCompleted && 'bg-[#434E54] text-white shadow-[#434E54]/30',
                    isCurrent && 'bg-[#434E54] text-white ring-4 ring-[#434E54]/30 shadow-[#434E54]/40',
                    !isCompleted && !isCurrent && 'bg-[#EAE0D5] text-[#434E54]/40 shadow-sm',
                    isClickable && !isCurrent && 'group-hover:bg-[#EAE0D5]/80 group-hover:shadow-md'
                  )}
                  animate={isCurrent ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 4px 16px rgba(67, 78, 84, 0.25)',
                      '0 8px 24px rgba(67, 78, 84, 0.35)',
                      '0 4px 16px rgba(67, 78, 84, 0.25)'
                    ]
                  } : {}}
                  transition={{
                    repeat: isCurrent ? Infinity : 0,
                    duration: 2.5,
                    ease: "easeInOut"
                  }}
                >
                  {/* Background glow effect for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#434E54]/30 blur-xl"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    />
                  )}

                  {isCompleted ? (
                    <motion.svg
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-6 h-6 relative z-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <span className="relative z-10">{index + 1}</span>
                  )}
                </motion.div>

                {/* Step label */}
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors text-center max-w-[80px]',
                    isCurrent && 'text-[#434E54]',
                    isCompleted && 'text-[#434E54]/80',
                    !isCompleted && !isCurrent && 'text-[#434E54]/50',
                    isClickable && 'group-hover:text-[#434E54]/70'
                  )}
                >
                  {label}
                </span>
              </button>

              {/* Enhanced connector line */}
              {index < visibleSteps.length - 1 && (
                <div className="flex-1 h-1 mx-3 bg-[#EAE0D5] rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-[#434E54] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view - enhanced */}
      <div className="md:hidden px-4 py-4">
        {/* Step counter with better visual hierarchy */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-medium text-[#434E54]/60 uppercase tracking-wide">
              Step {currentStep + 1} of {visibleSteps.length}
            </span>
            <h2 className="text-base font-bold text-[#434E54] mt-0.5">
              {visibleSteps[currentStep] || 'Complete'}
            </h2>
          </div>

          {/* Completion percentage */}
          <div className="text-right">
            <span className="text-2xl font-bold text-[#434E54]">
              {Math.round(((currentStep + 1) / visibleSteps.length) * 100)}%
            </span>
            <span className="text-xs text-[#434E54]/60 block">Done</span>
          </div>
        </div>

        {/* Enhanced progress bar */}
        <div className="w-full bg-[#EAE0D5] rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            className="bg-[#434E54] h-3 rounded-full shadow-md relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </div>

        {/* Mini step indicators below bar */}
        <div className="flex justify-between mt-2 px-1">
          {visibleSteps.map((label, index) => (
            <div
              key={label}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                index <= currentStep ? 'bg-[#434E54]' : 'bg-[#EAE0D5]'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
