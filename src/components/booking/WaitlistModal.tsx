/**
 * Waitlist modal for booking wizard
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/hooks/useBooking';
import { useBookingModal } from '@/hooks/useBookingModal';
import { formatTimeDisplay, type BusinessHours } from '@/lib/booking/availability';
import { formatTime } from '@/lib/utils/business-hours';
import { toast } from '@/hooks/use-toast';

type UITimePreference = 'selected_time' | 'morning' | 'afternoon';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time?: string;
  businessHours: BusinessHours;
}

/** Compute the midpoint of the business day for splitting morning/afternoon */
function getMidpoint(open: string, close: string): number {
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  return Math.floor((openH * 60 + openM + closeH * 60 + closeM) / 2);
}

export function WaitlistModal({ isOpen, onClose, date, time, businessHours }: WaitlistModalProps) {
  const [preference, setPreference] = useState<UITimePreference>(
    time ? 'selected_time' : 'morning'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset preference when modal opens with a new time
  useEffect(() => {
    if (isOpen) {
      setPreference(time ? 'selected_time' : 'morning');
    }
  }, [isOpen, time]);

  const { joinWaitlist } = useBooking();
  const { close: closeBookingModal } = useBookingModal();

  // Get hours for the selected date's day of week
  const dayName = new Date(date + 'T00:00:00')
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
  const dayHours = businessHours[dayName];

  // Build time range descriptions from business hours
  let morningDesc = '9:00 AM - 12:00 PM';
  let afternoonDesc = '12:00 PM - 5:00 PM';

  if (dayHours?.is_open) {
    const midMins = getMidpoint(dayHours.open, dayHours.close);
    const midH = Math.floor(midMins / 60);
    const midM = midMins % 60;
    const midStr = `${midH.toString().padStart(2, '0')}:${midM.toString().padStart(2, '0')}`;
    morningDesc = `${formatTime(dayHours.open)} - ${formatTime(midStr)}`;
    afternoonDesc = `${formatTime(midStr)} - ${formatTime(dayHours.close)}`;
  }

  /** Map UI preference to API-compatible value */
  function getApiPreference(): 'morning' | 'afternoon' | 'any' {
    if (preference === 'selected_time' && time) {
      const hour = parseInt(time.split(':')[0], 10);
      const minute = parseInt(time.split(':')[1], 10) || 0;
      const slotMins = hour * 60 + minute;

      if (dayHours?.is_open) {
        const mid = getMidpoint(dayHours.open, dayHours.close);
        return slotMins < mid ? 'morning' : 'afternoon';
      }
      return hour < 12 ? 'morning' : 'afternoon';
    }
    if (preference === 'morning') return 'morning';
    if (preference === 'afternoon') return 'afternoon';
    return 'any';
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await joinWaitlist(date, getApiPreference());

      if (result) {
        onClose();
        closeBookingModal();
        toast.success("You're on the waitlist! We'll notify you when a spot opens up.");
      } else {
        toast.error('Failed to join waitlist');
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      toast.error('Failed to join waitlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const timeOptions: { value: UITimePreference; label: string; description: string }[] = [
    ...(time
      ? [
          {
            value: 'selected_time' as UITimePreference,
            label: `${formatTimeDisplay(time)} only`,
            description: 'Notify me for this time slot only',
          },
        ]
      : []),
    { value: 'morning', label: 'Morning', description: morningDesc },
    { value: 'afternoon', label: 'Afternoon', description: afternoonDesc },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-[#434E54]/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#434E54]">Join Waitlist</h3>
                      <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-[#EAE0D5] transition-colors duration-200
                                 flex items-center justify-center text-[#434E54]"
                        aria-label="Close"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[#434E54]/70 mt-1">
                      Get notified when a slot opens up
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Selected date display */}
                    <div className="bg-[#EAE0D5] rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#434E54]/10 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-[#434E54]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="font-medium text-[#434E54]">{formatDate(date)}</p>
                      </div>
                    </div>

                    {/* Time preference */}
                    <div>
                      <label className="block text-sm font-semibold text-[#434E54] mb-3">
                        Preferred Time
                      </label>
                      <div className="space-y-2">
                        {timeOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                              ${
                                preference === opt.value
                                  ? 'border-[#434E54] bg-[#434E54]/5 shadow-md'
                                  : 'border-[#EAE0D5] hover:border-[#434E54]/50'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="timePreference"
                                value={opt.value}
                                checked={preference === opt.value}
                                onChange={() => setPreference(opt.value)}
                                className="w-5 h-5 text-[#434E54] border-2 border-[#EAE0D5] focus:ring-2 focus:ring-[#434E54]/50"
                              />
                              <div>
                                <span className="font-semibold text-[#434E54]">{opt.label}</span>
                                <span className="text-sm text-[#434E54]/60 ml-2">
                                  {opt.description}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="bg-[#434E54]/5 border border-[#434E54]/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <svg
                          className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-[#434E54]/70">
                          We&apos;ll email you immediately when a matching slot becomes available.
                          Waitlist spots are first-come, first-served.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-[#434E54]/20 bg-[#EAE0D5]/30">
                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="text-[#434E54] font-medium py-3 px-6 rounded-lg
                                 hover:bg-white transition-colors duration-200 flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#434E54] text-white font-semibold py-3 px-6 rounded-lg
                                 hover:bg-[#434E54]/90 transition-all duration-200 shadow-md hover:shadow-lg
                                 disabled:bg-[#434E54]/40 disabled:cursor-not-allowed disabled:opacity-50
                                 flex items-center justify-center gap-2 flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            </svg>
                            Join Waitlist
                          </>
                        )}
                      </button>
                    </div>
                  </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
