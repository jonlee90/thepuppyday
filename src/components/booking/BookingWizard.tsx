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

export function BookingWizard({ preSelectedServiceId }: BookingWizardProps) {
  const {
    currentStep,
    setStep,
    canNavigateToStep,
    isSessionExpired,
    reset,
    selectedService,
    petSize,
    selectedAddons,
    servicePrice,
    addonsTotal,
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
  const showPriceSummary = currentStep > 0 && currentStep < 5;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-base-content hover:text-primary transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            <h1 className="text-lg font-semibold text-base-content">Book Appointment</h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div className="bg-base-100 border-b border-base-300">
          <div className="container mx-auto">
            <BookingProgress
              currentStep={currentStep}
              onStepClick={handleStepClick}
              canNavigateToStep={canNavigateToStep}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className={showPriceSummary ? 'lg:grid lg:grid-cols-3 lg:gap-8' : ''}>
          {/* Step content */}
          <div className={showPriceSummary ? 'lg:col-span-2' : ''}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Price summary sidebar - desktop */}
          {showPriceSummary && (
            <div className="hidden lg:block">
              <div className="sticky top-8">
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

      {/* Mobile price summary - fixed bottom */}
      {showPriceSummary && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Total</p>
              <p className="text-xl font-bold text-base-content">
                ${totalPrice.toFixed(2)}
              </p>
            </div>
            {selectedService && (
              <div className="text-right">
                <p className="text-sm text-base-content/70">{selectedService.name}</p>
                {selectedAddons.length > 0 && (
                  <p className="text-xs text-base-content/50">
                    +{selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom padding for mobile price bar */}
      {showPriceSummary && <div className="lg:hidden h-24" />}
    </div>
  );
}
