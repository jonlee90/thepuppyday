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

  // Walk-in mode has different step order: Service → Customer → Pet → Review
  if (mode === 'walkin') {
    switch (currentStep) {
      case 0: // Service
        return canContinue ? 'Continue to Customer' : 'Select a Service';
      case 1: // Customer
        return canContinue ? 'Continue to Pet' : 'Add Customer Information';
      case 2: // Pet
        return canContinue ? 'Continue to Review' : 'Add Pet Information';
      case 3: // Review (combined addons + review)
        return 'Confirm Walk-In';
      default:
        return 'Continue';
    }
  }

  // Admin and Customer modes: Service → DateTime → Customer → Pet → Addons → Review
  switch (currentStep) {
    case 0: // Service
      return canContinue ? 'Continue to Date & Time' : 'Select a Service';
    case 1: // Date & Time
      return canContinue ? 'Continue to Customer' : 'Select Date & Time';
    case 2: // Customer
      return canContinue ? 'Continue to Pet' : 'Add Customer Information';
    case 3: // Pet
      return canContinue ? 'Continue to Add-ons' : 'Add Pet Information';
    case 4: // Add-ons
      return 'Review Your Booking';
    case 5: // Review
      if (mode === 'admin') return 'Create Appointment';
      return canContinue ? 'Confirm Booking' : 'Complete Your Information';
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
  const stepNames = ['Service', 'Date & Time', 'Customer', 'Pet', 'Add-ons', 'Review'];
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
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#434E54]/10 px-4 py-4 pb-safe shadow-[0_-4px_20px_rgba(67,78,84,0.12)]">
        {/* Continue Button - Full Width */}
        <button
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          className={`
            w-full h-[52px] rounded-xl font-semibold text-[17px] tracking-[0.01em]
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

        {/* Back Link - Below Button */}
        {showBackButton && (
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="w-full mt-3 text-center text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors duration-200"
            aria-label={`Go back to ${previousStepName}`}
          >
            Back to {previousStepName}
          </button>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="bg-white border-t border-[#434E54]/10 px-6 py-4 shadow-[0_-4px_16px_rgba(67,78,84,0.08)]">
      <div className="flex items-center justify-between gap-4">
        {/* Back Button - Left Side */}
        {showBackButton ? (
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="
              flex items-center gap-2 h-12 px-5 rounded-xl
              text-[#434E54] font-medium text-[15px]
              bg-transparent hover:bg-[#EAE0D5] active:bg-[#DCD2C7]
              transition-all duration-200
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#434E54] focus-visible:outline-offset-2
            "
            aria-label={`Go back to ${previousStepName}`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        ) : (
          <div /> // Spacer
        )}

        {/* Continue Button - Right Side */}
        <button
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          className={`
            h-12 px-8 rounded-xl font-semibold text-base tracking-[0.01em]
            flex items-center justify-center gap-2
            min-w-[200px]
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

export default BookingModalFooter;
