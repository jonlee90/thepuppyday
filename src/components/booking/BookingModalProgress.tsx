/**
 * Booking Modal Progress Component
 * Desktop: Full stepper with numbered circles and labels
 * Mobile: Compact progress bar with step count
 */

'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { type BookingModalMode } from '@/hooks/useBookingModal';

interface BookingModalProgressProps {
  mode: BookingModalMode;
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  isMobile?: boolean;
}

export function BookingModalProgress({
  mode,
  currentStep,
  totalSteps,
  stepLabels,
  isMobile = false,
}: BookingModalProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Mobile: Compact progress bar
  if (isMobile) {
    return (
      <div className="px-4 py-3 bg-white/60 border-b border-[#434E54]/5">
        {/* Progress bar */}
        <div className="h-1.5 bg-[#EAE0D5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#434E54] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step counter */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-medium text-[#434E54]/70">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-[#434E54]">
            {stepLabels[currentStep]}
          </span>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: Full stepper
  return (
    <div className="px-6 lg:px-8 py-4 bg-gradient-to-b from-white to-[#FFFBF7] border-b border-[#434E54]/5">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                    ${isCompleted ? 'bg-[#434E54] text-white' : ''}
                    ${isCurrent ? 'bg-[#434E54] text-white ring-4 ring-[#434E54]/20' : ''}
                    ${isFuture ? 'bg-[#EAE0D5] text-[#434E54]/50' : ''}
                  `}
                  initial={false}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#434E54]/20"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  )}
                </motion.div>

                {/* Label - visible on larger screens */}
                <span
                  className={`
                    hidden lg:block mt-2 text-xs font-medium text-center max-w-[80px] truncate
                    ${isCurrent ? 'text-[#434E54]' : 'text-[#434E54]/50'}
                  `}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {index < stepLabels.length - 1 && (
                <div className="flex-1 mx-2 lg:mx-3">
                  <div className="h-0.5 bg-[#EAE0D5] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#434E54]"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BookingModalProgress;
