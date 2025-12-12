/**
 * Embedded Booking Widget for Marketing Page
 * Full booking experience embedded on homepage with progress tracking
 */

'use client';

import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { useBookingStore } from '@/stores/bookingStore';

export function EmbeddedBookingWidget() {
  const { currentStep, setStep, canNavigateToStep } = useBookingStore();

  // Don't show progress on confirmation step
  const showProgress = currentStep < 5;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Widget Header with Dog Theme */}
      <div className="relative bg-gradient-to-r from-[#EAE0D5] to-[#DCD2C7] px-4 sm:px-6 md:px-8 py-5 sm:py-6 overflow-hidden">
        {/* Subtle paw print pattern background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute top-2 right-10 w-8 h-8 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
          <svg className="absolute bottom-3 left-16 w-6 h-6 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
          <svg className="absolute top-1/2 right-1/3 w-7 h-7 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Dog icon with professional styling */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#434E54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#434E54]">Book Your Pup's Spa Day</h3>
              <p className="text-xs sm:text-sm text-[#6B7280]">Professional grooming in just a few steps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {showProgress && (
        <div className="bg-white border-b border-gray-200">
          <BookingProgress
            currentStep={currentStep}
            onStepClick={setStep}
            canNavigateToStep={canNavigateToStep}
          />
        </div>
      )}

      {/* Full Booking Widget */}
      <div className="min-h-[600px] bg-gradient-to-b from-white to-[#FFFBF7]">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              {/* Professional loading animation with dog theme */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-[#EAE0D5] border-t-[#434E54] rounded-full animate-spin"></div>
                <svg className="absolute inset-0 m-auto w-8 h-8 text-[#434E54] opacity-40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
                </svg>
              </div>
              <p className="text-[#6B7280] font-medium">Preparing your booking experience...</p>
            </div>
          </div>
        }>
          <BookingWizard embedded={true} />
        </Suspense>
      </div>

      {/* Widget Footer with Trust Signals */}
      <div className="bg-[#FFFBF7] px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6B7280]">
              <div className="w-5 h-5 rounded-full bg-[#6BCB77]/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#6BCB77]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">No payment now</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6B7280]">
              <div className="w-5 h-5 rounded-full bg-[#434E54]/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Mon-Sat: 9AM - 5PM</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6B7280]">
              <div className="w-5 h-5 rounded-full bg-[#FFB347]/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#FFB347]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span>Professional care</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
