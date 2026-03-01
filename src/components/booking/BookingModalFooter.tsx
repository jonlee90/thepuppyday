/**
 * Booking Modal Footer Component
 * Sticky footer with continue button and back navigation
 */

'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MODE_CONFIG, type BookingModalMode } from '@/hooks/useBookingModal';

interface BookingModalFooterProps {
  mode: BookingModalMode;
  currentStep: number;
  totalSteps: number;
  isMobile?: boolean;

  // Navigation handlers
  onContinue: () => void | Promise<void>;
  onBack?: () => void;

  // Button state
  canContinue: boolean;
  isLoading?: boolean;

  // Optional customization
  continueText?: string;
  loadingText?: string;
}

// Step-specific button text configuration
const getButtonText = (
  currentStep: number,
  mode: BookingModalMode,
  canContinue: boolean,
  isLoading: boolean
): string => {
  if (isLoading) {
    return 'Processing...';
  }

  // Walk-in mode: Service → Customer → Pet → Review → Confirmation
  if (mode === 'walkin') {
    switch (currentStep) {
      case 3: // Review
        return 'Confirm Walk-In';
      default:
        return 'Continue';
    }
  }

  // Admin and Customer modes: Service → DateTime → Customer → Pet → Review → Confirmation
  switch (currentStep) {
    case 4: // Review
      if (mode === 'admin') return 'Create Appointment';
      return 'Confirm Booking';
    default:
      return 'Continue';
  }
};

// Previous step names for back button
const getPreviousStepName = (currentStep: number, mode: BookingModalMode): string => {
  if (mode === 'walkin') {
    const stepNames = ['Service', 'Customer', 'Pet', 'Review'];
    return stepNames[currentStep - 1] || 'previous';
  }
  // Admin and Customer modes
  const stepNames = ['Service', 'Date & Time', 'Customer', 'Pet', 'Review'];
  return stepNames[currentStep - 1] || 'previous';
};

export function BookingModalFooter({
  mode,
  currentStep,
  totalSteps,
  isMobile = false,
  onContinue,
  onBack,
  canContinue,
  isLoading = false,
  continueText,
  loadingText,
}: BookingModalFooterProps) {
  const config = MODE_CONFIG[mode];
  const isConfirmationStep = currentStep === totalSteps - 1;

  // Don't show footer on confirmation step
  if (isConfirmationStep) {
    return null;
  }

  // Determine if back button should be shown
  const showBackButton = currentStep > 0 && onBack;

  // Get button text
  const buttonText = continueText || getButtonText(currentStep, mode, canContinue, isLoading);
  const previousStepName = getPreviousStepName(currentStep, mode);

  // Handle continue click
  const handleContinue = async () => {
    if (canContinue && !isLoading) {
      await onContinue();
    }
  };

  // Handle back click
  const handleBack = () => {
    if (onBack && !isLoading) {
      onBack();
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-transparent px-4 py-4 pb-safe">
        <div className="flex items-center justify-between gap-3">
          {/* Back Button - Left Side */}
          {showBackButton ? (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="
                flex items-center gap-1.5 h-12 px-4 rounded-xl
                text-[#434E54] font-semibold text-[15px]
                bg-[#EAE0D5] hover:bg-[#DCD2C7] active:bg-[#D0C6BB]
                transition-all duration-150
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2
              "
              aria-label="Go back to previous step"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Continue Button - Right Side */}
          <button
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            className={`
              h-12 px-6 rounded-xl font-semibold text-[15px] tracking-[0.01em]
              flex items-center justify-center gap-2
              transition-all duration-200 ease-out
              ${
                canContinue && !isLoading
                  ? 'bg-[#434E54] text-white shadow-md hover:bg-[#363F44] hover:shadow-lg active:scale-[0.98] active:bg-[#2D363A] active:shadow-sm'
                  : 'bg-[#434E54]/30 text-white/60 cursor-not-allowed opacity-60'
              }
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2
            `}
            aria-label={`Continue to ${config.steps[currentStep + 1] || 'next step'}`}
            aria-disabled={!canContinue || isLoading}
            aria-busy={isLoading}
          >
            <span>{buttonText}</span>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Desktop Layout - absolute positioned buttons at bottom corners
  return (
    <>
      {/* Back Button - Bottom Left */}
      {showBackButton && (
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="
            absolute bottom-4 left-6
            flex items-center gap-2 h-11 px-4 rounded-xl
            text-[#434E54] font-semibold text-[15px]
            bg-[#EAE0D5] hover:bg-[#DCD2C7] active:bg-[#D0C6BB]
            transition-all duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2
          "
          aria-label="Go back to previous step"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      {/* Continue Button - Bottom Right */}
      <button
        onClick={handleContinue}
        disabled={!canContinue || isLoading}
        className={`
          absolute bottom-4 right-6
          h-11 px-6 rounded-xl font-semibold text-base tracking-[0.01em]
          flex items-center justify-center gap-2
          min-w-[160px]
          transition-all duration-150 ease-out
          ${
            canContinue && !isLoading
              ? 'bg-[#434E54] text-white shadow-md hover:bg-[#363F44] hover:shadow-lg active:scale-[0.98] active:bg-[#2D363A] active:shadow-sm'
              : 'bg-[#434E54]/30 text-white/60 cursor-not-allowed opacity-60'
          }
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2
        `}
        aria-label={`Continue to ${config.steps[currentStep + 1] || 'next step'}`}
        aria-disabled={!canContinue || isLoading}
        aria-busy={isLoading}
      >
        <span>{buttonText}</span>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </>
  );
}

export default BookingModalFooter;
