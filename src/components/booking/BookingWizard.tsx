/**
 * Main booking wizard orchestrator
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/stores/bookingStore';
import { BookingProgress } from './BookingProgress';
import { PriceSummary } from './PriceSummary';
import { ServiceStep } from './steps/ServiceStep';
import { PetStep } from './steps/PetStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { AddonsStep } from './steps/AddonsStep';
import { ReviewStep } from './steps/ReviewStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import Link from 'next/link';

interface BookingWizardProps {
  preSelectedServiceId?: string;
  embedded?: boolean; // Hide header/progress when embedded
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export function BookingWizard({ preSelectedServiceId, embedded = false }: BookingWizardProps) {
  const {
    currentStep,
    setStep,
    canNavigateToStep,
    isSessionExpired,
    reset,
    selectedService,
    selectedAddons,
    servicePrice,
    totalPrice,
  } = useBookingStore();

  // Check session expiry on mount
  useEffect(() => {
    if (isSessionExpired()) {
      reset();
    }
  }, [isSessionExpired, reset]);

  // Track step direction for animations
  const direction = 1; // Always forward for now, could track previous step

  const handleStepClick = (step: number) => {
    if (canNavigateToStep(step)) {
      setStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ServiceStep preSelectedServiceId={preSelectedServiceId} />;
      case 1:
        return <PetStep />;
      case 2:
        return <DateTimeStep />;
      case 3:
        return <AddonsStep />;
      case 4:
        return <ReviewStep />;
      case 5:
        return <ConfirmationStep />;
      default:
        return <ServiceStep />;
    }
  };

  // Don't show header/progress on confirmation step
  const showProgress = currentStep < 5;
  // Only show price summary on Addons (step 3) and Review (step 4)
  const showPriceSummary = currentStep === 3 || currentStep === 4;

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#EAE0D5]"}>
      {/* Header - Only show when not embedded */}
      {!embedded && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-[#434E54]/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-[#434E54] hover:text-[#434E54]/80 transition-colors -ml-2 px-2 py-1" aria-label="Back to home">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline font-medium">Home</span>
              </Link>
              <h1 className="text-base font-bold text-[#434E54]">Book Appointment</h1>
              <div className="w-16 sm:w-24" /> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator - Only show when not embedded */}
      {!embedded && showProgress && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-[#434E54]/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <BookingProgress
              currentStep={currentStep}
              onStepClick={handleStepClick}
              canNavigateToStep={canNavigateToStep}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={embedded ? "px-4 sm:px-6 py-6" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-7xl"}>
        <div className={showPriceSummary ? 'md:grid md:grid-cols-3 md:gap-6 lg:gap-8' : ''}>
          {/* Step content */}
          <div className={showPriceSummary ? 'md:col-span-2' : ''}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Price summary sidebar - tablet/desktop */}
          {showPriceSummary && (
            <div className="hidden md:block">
              <div className="sticky top-6">
                <PriceSummary
                  serviceName={selectedService?.name || null}
                  servicePrice={servicePrice}
                  addons={selectedAddons.map((a) => ({ name: a.name, price: a.price }))}
                  total={totalPrice}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile price summary - fixed bottom with safe area */}
      {showPriceSummary && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-[#434E54]/20 shadow-[0_-4px_16px_rgba(67,78,84,0.1)] pb-safe">
          <div className="px-4 py-3">
            {/* Swipe indicator */}
            <div className="w-12 h-1 bg-[#EAE0D5] rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#434E54]/60">Total</p>
                <p className="text-2xl font-bold text-[#434E54]">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
              {selectedService && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#434E54]">{selectedService.name}</p>
                  {selectedAddons.length > 0 && (
                    <p className="text-xs text-[#434E54]/60">
                      +{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for mobile price bar */}
      {showPriceSummary && <div className="md:hidden h-28" />}
    </div>
  );
}
