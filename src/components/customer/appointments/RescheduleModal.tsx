/**
 * Reschedule Appointment Modal
 * Allows customers to pick a new date/time for an existing appointment
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarPicker } from '@/components/booking/CalendarPicker';
import { TimeSlotGrid } from '@/components/booking/TimeSlotGrid';
import { useAvailability } from '@/hooks/useAvailability';
import { createFocusTrap } from '@/lib/accessibility/focus';
import { toast } from '@/hooks/use-toast';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  currentScheduledAt: string;
  serviceId: string;
  serviceDuration: number;
  petName: string;
  serviceName: string;
}

function formatDisplayDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function RescheduleModal({
  isOpen,
  onClose,
  appointmentId,
  currentScheduledAt,
  serviceId,
  serviceDuration,
  petName,
  serviceName,
}: RescheduleModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { slots, isLoading: slotsLoading } = useAvailability({
    date: selectedDate,
    serviceId,
  });

  // Derive canConfirm during render
  const canConfirm = selectedDate && selectedTime && !isSubmitting;

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(null);
      setSelectedTime(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen && modalRef.current) {
      document.body.style.overflow = 'hidden';
      const focusTrap = createFocusTrap(modalRef.current);
      focusTrap.activate();

      return () => {
        focusTrap.deactivate();
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Reset time when date changes
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Build new scheduled_at ISO string from date + time
      const newScheduledAt = `${selectedDate}T${selectedTime}:00`;

      const response = await fetch(`/api/customer/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: newScheduledAt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule appointment');
      }

      toast.success('Appointment Rescheduled', {
        description: `Your appointment has been moved to the new date and time.`,
      });

      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Reschedule Failed', {
        description: error instanceof Error ? error.message : 'Failed to reschedule. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reschedule-modal-title"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-[#434E54]/10">
                <div className="flex items-center justify-between">
                  <h2 id="reschedule-modal-title" className="text-xl font-bold text-[#434E54]">
                    Reschedule Appointment
                  </h2>
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#434E54]/60 hover:bg-[#EAE0D5] transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Current appointment info */}
                <div className="mt-3 p-3 rounded-lg bg-[#EAE0D5]/30">
                  <p className="text-sm text-[#434E54]/70">Current appointment</p>
                  <p className="font-semibold text-[#434E54]">
                    {serviceName} for {petName}
                  </p>
                  <p className="text-sm text-[#434E54]/70">
                    {formatDisplayDate(currentScheduledAt)} at {formatDisplayTime(currentScheduledAt)}
                    {serviceDuration ? ` (${serviceDuration} min)` : null}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Date picker */}
                <div>
                  <h3 className="font-semibold text-[#434E54] mb-3">Select New Date</h3>
                  <CalendarPicker
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    minDate={minDate}
                  />
                </div>

                {/* Time slots */}
                {selectedDate ? (
                  <div>
                    <h3 className="font-semibold text-[#434E54] mb-3">Select New Time</h3>
                    <TimeSlotGrid
                      slots={slots}
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                      loading={slotsLoading}
                    />
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-[#434E54]/10 bg-[#EAE0D5]/30 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-[#434E54]
                           hover:bg-white transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold
                           bg-[#434E54] text-white hover:bg-[#434E54]/90
                           transition-all duration-200 shadow-md hover:shadow-lg
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rescheduling...
                    </>
                  ) : (
                    'Confirm Reschedule'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
