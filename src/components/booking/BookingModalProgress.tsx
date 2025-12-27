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
      <div className="px-4 py-2 bg-white/60 border-b border-[#434E54]/5">
        {/* Progress bar */}
        <div className="h-2 bg-[#EAE0D5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#434E54] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Current step label */}
        <div className="flex items-center justify-end mt-1.5">
          <span className="text-xs font-medium text-[#434E54]">
            {stepLabels[currentStep]}
          </span>
        </div>
      </div>
    );
  }

  // Desktop/Tablet: Compact single-line stepper
  return (
    <div className="px-6 py-2.5 bg-white border-b border-[#434E54]/5">
      <div className="flex items-center max-w-3xl mx-auto">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              {/* Step indicator with inline label */}
              <div className="flex items-center gap-2">
                <motion.div
                  className={`
                    relative flex items-center justify-center w-6 h-6 rounded-full transition-colors
                    ${isCompleted ? 'bg-[#434E54] text-white' : ''}
                    ${isCurrent ? 'bg-[#434E54] text-white ring-4 ring-[#434E54]/20' : ''}
                    ${isFuture ? 'border-2 border-[#434E54]/30 text-[#434E54]/30' : ''}
                  `}
                  initial={false}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : (
                    <div className="w-2 h-2 bg-[#434E54]/30 rounded-full" />
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

                {/* Inline label - visible on desktop */}
                <span
                  className={`
                    hidden md:block text-xs font-medium whitespace-nowrap
                    ${isCurrent ? 'text-[#434E54]' : 'text-[#434E54]/50'}
                  `}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {index < stepLabels.length - 1 && (
                <div className="flex-1 mx-2">
                  <div className="h-px bg-[#EAE0D5] overflow-hidden">
                    <motion.div
                      className={`h-full ${isCompleted ? 'bg-[#434E54]' : 'bg-[#434E54]/20'}`}
                      style={{ width: isCompleted ? '100%' : '0%' }}
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
