/**
 * Booking Modal Header Component
 * Shows current step title and adapts to mode/device
 */

'use client';

import { X, UserPlus } from 'lucide-react';
import { MODE_CONFIG, type BookingModalMode } from '@/hooks/useBookingModal';
import { useBookingStore } from '@/stores/bookingStore';

interface BookingModalHeaderProps {
  mode: BookingModalMode;
  onClose: () => void;
  canClose: boolean;
  isMobile?: boolean;
}

export function BookingModalHeader({
  mode,
  onClose,
  canClose,
  isMobile = false,
}: BookingModalHeaderProps) {
  const config = MODE_CONFIG[mode];
  const { currentStep } = useBookingStore();

  // Get current step title
  const stepTitle = config.stepTitles[currentStep] || config.title;
  const isConfirmationStep = currentStep === config.steps.length - 1;

  // Mobile header
  if (isMobile) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#434E54]/10">
        {/* Walk-in badge or spacer */}
        <div className="w-10">
          {mode === 'walkin' && !isConfirmationStep && (
            <span className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-amber-100 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 text-center">
          <h2
            id="booking-modal-title-mobile"
            className="text-base font-semibold text-[#434E54]"
          >
            {stepTitle}
          </h2>
        </div>

        {/* Close button */}
        <div className="w-10">
          <button
            onClick={onClose}
            disabled={!canClose}
            className="flex items-center justify-center w-10 h-10 -mr-2 rounded-xl text-[#434E54]/60 hover:text-[#434E54] hover:bg-[#434E54]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop/Tablet header
  return (
    <div className="flex items-center justify-between px-6 lg:px-8 py-4 bg-white border-b border-[#434E54]/10">
      {/* Step title with optional badge */}
      <div className="flex items-center gap-3">
        <h2
          id="booking-modal-title"
          className="text-xl font-bold text-[#434E54]"
        >
          {stepTitle}
        </h2>
        {mode === 'walkin' && !isConfirmationStep && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
            <UserPlus className="w-3 h-3" />
            Walk-In
          </span>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        disabled={!canClose}
        className="flex items-center justify-center w-10 h-10 rounded-xl text-[#434E54]/60 hover:text-[#434E54] hover:bg-[#EAE0D5] transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default BookingModalHeader;
