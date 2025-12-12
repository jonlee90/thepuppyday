/**
 * Embedded Booking Widget for Marketing Page
 * Elegant, minimal booking experience with seamless progress integration
 */

'use client';

import { Suspense } from 'react';
import { BookingWizard } from '@/components/booking';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { useBookingStore } from '@/stores/bookingStore';
import { motion } from 'framer-motion';

export function EmbeddedBookingWidget() {
  const { currentStep, setStep, canNavigateToStep } = useBookingStore();

  // Don't show progress on confirmation step
  const showProgress = currentStep < 5;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Progress Indicator - Seamlessly integrated at top */}
      {showProgress && (
        <div className="bg-gradient-to-b from-[#FFFBF7] to-white">
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
          <div className="flex items-center justify-center p-16">
            <div className="text-center">
              {/* Elegant loading animation */}
              <motion.div
                className="relative w-16 h-16 mx-auto mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 border-3 border-[#EAE0D5] border-t-[#434E54] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-[#EAE0D5] border-b-[#434E54] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </motion.div>
              <motion.p
                className="text-[#434E54]/70 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Loading booking experience...
              </motion.p>
            </div>
          </div>
        }>
          <BookingWizard embedded={true} />
        </Suspense>
      </div>

      {/* Refined Trust Signals Footer */}
      <div className="bg-white px-5 sm:px-8 py-5 border-t border-[#434E54]/10">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 max-w-2xl mx-auto">
          {/* No payment badge */}
          <motion.div
            className="flex items-center gap-2.5 text-sm text-[#434E54]"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 rounded-full bg-[#434E54]/10 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-[#434E54]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-[#434E54]">No payment required</span>
          </motion.div>

          {/* Hours badge */}
          <motion.div
            className="flex items-center gap-2.5 text-sm text-[#434E54]/70"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 rounded-full bg-[#434E54]/8 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-medium">Mon-Sat: 9AM - 5PM</span>
          </motion.div>

          {/* Professional care badge */}
          <motion.div
            className="flex items-center gap-2.5 text-sm text-[#434E54]/70"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 rounded-full bg-[#434E54]/10 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-medium text-[#434E54]/70">Expert grooming care</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
