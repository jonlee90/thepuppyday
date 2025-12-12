/**
 * Waitlist modal for booking wizard
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooking } from '@/hooks/useBooking';
import { formatTimeDisplay } from '@/lib/booking/availability';
import type { TimePreference } from '@/types/database';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time?: string;
}

export function WaitlistModal({ isOpen, onClose, date, time }: WaitlistModalProps) {
  const [timePreference, setTimePreference] = useState<TimePreference>(
    time
      ? parseInt(time.split(':')[0], 10) < 12
        ? 'morning'
        : 'afternoon'
      : 'any'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { joinWaitlist } = useBooking();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await joinWaitlist(date, timePreference);

      if (result) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 2000);
      } else {
        console.error('Failed to join waitlist');
      }
    } catch (error) {
      console.error('Waitlist error:', error);
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

  const timePreferences: { value: TimePreference; label: string; description: string }[] = [
    { value: 'morning', label: 'Morning', description: '9 AM - 12 PM' },
    { value: 'afternoon', label: 'Afternoon', description: '12 PM - 6 PM' },
    { value: 'any', label: 'Any Time', description: 'First available' },
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
              {isSuccess ? (
                // Success state
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-16 h-16 bg-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg
                      className="w-8 h-8 text-[#434E54]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#434E54] mb-2">
                    You&apos;re on the Waitlist!
                  </h3>
                  <p className="text-[#434E54]/70">
                    We&apos;ll notify you if a spot opens up.
                  </p>
                </div>
              ) : (
                // Form state
                <>
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
                        <div>
                          <p className="font-medium text-[#434E54]">{formatDate(date)}</p>
                          {time && (
                            <p className="text-sm text-[#434E54]/70">
                              Preferred: {formatTimeDisplay(time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time preference */}
                    <div>
                      <label className="block text-sm font-semibold text-[#434E54] mb-3">
                        Preferred Time
                      </label>
                      <div className="space-y-2">
                        {timePreferences.map((pref) => (
                          <label
                            key={pref.value}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                              ${
                                timePreference === pref.value
                                  ? 'border-[#434E54] bg-[#434E54]/5 shadow-md'
                                  : 'border-[#EAE0D5] hover:border-[#434E54]/50'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="timePreference"
                                value={pref.value}
                                checked={timePreference === pref.value}
                                onChange={() => setTimePreference(pref.value)}
                                className="w-5 h-5 text-[#434E54] border-2 border-[#EAE0D5] focus:ring-2 focus:ring-[#434E54]/50"
                              />
                              <div>
                                <span className="font-semibold text-[#434E54]">{pref.label}</span>
                                <span className="text-sm text-[#434E54]/60 ml-2">
                                  {pref.description}
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
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
