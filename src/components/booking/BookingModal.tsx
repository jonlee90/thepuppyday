/**
 * Reusable Booking Modal Component
 * Supports three modes: customer, admin, walkin
 * Responsive: Desktop (centered), Tablet (centered), Mobile (bottom sheet)
 */

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { useBookingModal, MODE_CONFIG, type BookingModalMode } from '@/hooks/useBookingModal';
import { BookingModalHeader } from './BookingModalHeader';
import { BookingModalProgress } from './BookingModalProgress';
import { BookingModalFooter } from './BookingModalFooter';
import { BookingWizard } from './BookingWizard';
import { useBookingStore } from '@/stores/bookingStore';
import { canContinueFromStep } from '@/lib/booking/step-validation';
import { submitBooking } from '@/lib/booking/submit';
import { toast } from '@/hooks/use-toast';

interface BookingModalProps {
  mode?: BookingModalMode;
  isOpen?: boolean;
  onClose?: () => void;
  preSelectedServiceId?: string;
  preSelectedCustomerId?: string;
  onSuccess?: (appointmentId: string) => void;
}

// Animation variants for desktop (centered modal)
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const desktopModalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  },
};

// Animation variants for mobile (bottom sheet)
const mobileModalVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
  },
  exit: {
    y: '100%',
    transition: { duration: 0.3, ease: 'easeIn' }
  },
};

export function BookingModal({
  mode: propMode,
  isOpen: propIsOpen,
  onClose: propOnClose,
  preSelectedServiceId: propServiceId,
  preSelectedCustomerId: propCustomerId,
  onSuccess: propOnSuccess,
}: BookingModalProps) {
  const modalStore = useBookingModal();
  const bookingStore = useBookingStore();
  const dragControls = useDragControls();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use props if provided, otherwise use store
  const isOpen = propIsOpen !== undefined ? propIsOpen : modalStore.isOpen;
  const mode = propMode || modalStore.mode;
  const onClose = propOnClose || modalStore.close;
  const preSelectedServiceId = propServiceId || modalStore.preSelectedServiceId;
  const preSelectedCustomerId = propCustomerId || modalStore.preSelectedCustomerId;

  const config = MODE_CONFIG[mode];
  const { currentStep, reset, nextStep, prevStep, selectDateTime } = bookingStore;

  // Auto-set date/time to NOW for walk-in mode when modal opens
  useEffect(() => {
    if (isOpen && mode === 'walkin') {
      const now = new Date();
      // Format date as YYYY-MM-DD
      const dateStr = now.toISOString().split('T')[0];
      // Format time as HH:MM (round to nearest 15 minutes for cleaner slots)
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      const hours = minutes === 60 ? now.getHours() + 1 : now.getHours();
      const adjustedMinutes = minutes === 60 ? 0 : minutes;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;

      selectDateTime(dateStr, timeStr);
    }
  }, [isOpen, mode, selectDateTime]);

  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && modalStore.canClose) {
      onClose();
    }
  }, [onClose, modalStore.canClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift

      // Add escape key listener
      document.addEventListener('keydown', handleEscapeKey);

      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // Remove escape key listener
      document.removeEventListener('keydown', handleEscapeKey);

      // Return focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleEscapeKey]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalStore.canClose) {
      onClose();
    }
  };

  // Handle drag to dismiss (mobile)
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 && modalStore.canClose) {
      onClose();
    }
  };

  // Handle close with reset
  const handleClose = () => {
    onClose();
    // Reset booking state after close animation
    setTimeout(() => {
      reset();
    }, 300);
  };

  // Handle success
  const handleSuccess = (appointmentId: string) => {
    if (propOnSuccess) {
      propOnSuccess(appointmentId);
    }
    modalStore.triggerSuccess(appointmentId);
  };

  // Handle continue from footer
  const handleContinue = useCallback(async () => {
    const config = MODE_CONFIG[mode];
    const isReviewStep =
      (mode === 'walkin' && currentStep === 3) || // Walk-in: Step 3 is last before confirmation
      (mode !== 'walkin' && currentStep === 4);   // Customer/Admin: Step 4 is review

    if (isReviewStep) {
      // Review step - submit booking
      setIsSubmitting(true);
      modalStore.setCanClose(false);

      try {
        const result = await submitBooking(mode, bookingStore);

        if (result.success) {
          // Update booking store with result
          bookingStore.setBookingResult(result.appointmentId, result.reference);

          // For walk-in mode: Show success toast and close modal
          if (mode === 'walkin') {
            // Get customer name from booking store
            const customerName = bookingStore.guestInfo
              ? `${bookingStore.guestInfo.firstName} ${bookingStore.guestInfo.lastName}`
              : 'Customer';

            // Show success notification
            toast.success('Walk-in appointment created successfully!', {
              description: `Booking Reference: ${result.reference} • ${customerName}`,
              duration: 4000,
            });

            // Trigger success callback
            handleSuccess(result.appointmentId);

            // Close modal after brief delay
            setTimeout(() => {
              handleClose();
            }, 1500);
          } else {
            // For customer/admin mode: Move to confirmation step
            nextStep();
            // Trigger success callback
            handleSuccess(result.appointmentId);
          }
        } else {
          // Show error to user
          console.error('Booking submission failed:', result.error);
          toast.error('Booking failed', {
            description: result.error || 'An error occurred while creating the appointment.',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Booking submission error:', error);
        toast.error('An unexpected error occurred', {
          description: 'Please try again or contact support.',
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
        modalStore.setCanClose(true);
      }
    } else {
      // Regular step navigation
      nextStep();
    }
  }, [currentStep, nextStep, modalStore, mode, bookingStore, handleSuccess, handleClose]);

  // Handle back from footer
  const handleBack = useCallback(() => {
    prevStep();
  }, [prevStep]);

  // Determine if continue button should be enabled
  const canContinue = canContinueFromStep(currentStep, bookingStore, mode);

  // Don't render on server
  if (typeof window === 'undefined') return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-[#434E54]/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Modal Container - Desktop/Tablet */}
          <motion.div
            className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4 md:p-6 pointer-events-none"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              ref={modalRef}
              className="relative w-full max-w-[700px] lg:max-w-[900px] max-h-[85vh] lg:max-h-[90vh] bg-[#FFFBF7] rounded-[20px] lg:rounded-3xl shadow-[0_25px_50px_-12px_rgba(67,78,84,0.25)] overflow-hidden flex flex-col pointer-events-auto"
              variants={desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
              tabIndex={-1}
            >
              {/* Header */}
              <BookingModalHeader
                mode={mode}
                onClose={handleClose}
                canClose={modalStore.canClose}
              />

              {/* Progress - hide on confirmation */}
              {currentStep < config.steps.length - 1 && (
                <BookingModalProgress
                  mode={mode}
                  currentStep={currentStep}
                  totalSteps={config.steps.length - 1}
                  stepLabels={config.steps.slice(0, -1)}
                />
              )}

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-4 md:px-6 lg:px-8">
                  <BookingWizard
                    embedded={true}
                    preSelectedServiceId={preSelectedServiceId || undefined}
                    mode={mode}
                  />
                </div>
              </div>

              {/* Footer */}
              <BookingModalFooter
                mode={mode}
                currentStep={currentStep}
                totalSteps={config.steps.length}
                onContinue={handleContinue}
                onBack={currentStep > 0 ? handleBack : undefined}
                canContinue={canContinue}
                isLoading={isSubmitting}
              />
            </motion.div>
          </motion.div>

          {/* Modal Container - Mobile (Bottom Sheet) */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 sm:hidden pointer-events-none"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              ref={modalRef}
              className="relative w-full h-[95vh] bg-[#FFFBF7] rounded-t-[20px] shadow-[0_-25px_50px_-12px_rgba(67,78,84,0.25)] overflow-hidden flex flex-col pointer-events-auto"
              variants={mobileModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title-mobile"
              tabIndex={-1}
            >
              {/* Drag Handle */}
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 bg-[#434E54]/20 rounded-full" />
              </div>

              {/* Header */}
              <BookingModalHeader
                mode={mode}
                onClose={handleClose}
                canClose={modalStore.canClose}
                isMobile={true}
              />

              {/* Progress - hide on confirmation */}
              {currentStep < config.steps.length - 1 && (
                <BookingModalProgress
                  mode={mode}
                  currentStep={currentStep}
                  totalSteps={config.steps.length - 1}
                  stepLabels={config.steps.slice(0, -1)}
                  isMobile={true}
                />
              )}

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-4 pb-32">
                  <BookingWizard
                    embedded={true}
                    preSelectedServiceId={preSelectedServiceId || undefined}
                    mode={mode}
                  />
                </div>
              </div>

              {/* Fixed Footer for Mobile */}
              <div className="absolute bottom-0 left-0 right-0">
                <BookingModalFooter
                  mode={mode}
                  currentStep={currentStep}
                  totalSteps={config.steps.length}
                  isMobile={true}
                  onContinue={handleContinue}
                  onBack={currentStep > 0 ? handleBack : undefined}
                  canContinue={canContinue}
                  isLoading={isSubmitting}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export default BookingModal;
