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
            <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {isSuccess ? (
                // Success state
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg
                      className="w-8 h-8 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-base-content mb-2">
                    You&apos;re on the Waitlist!
                  </h3>
                  <p className="text-base-content/70">
                    We&apos;ll notify you if a spot opens up.
                  </p>
                </div>
              ) : (
                // Form state
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-base-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-base-content">Join Waitlist</h3>
                      <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle"
                        aria-label="Close"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-base-content/70 mt-1">
                      Get notified when a slot opens up
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Selected date display */}
                    <div className="bg-base-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-base-content">{formatDate(date)}</p>
                          {time && (
                            <p className="text-sm text-base-content/70">
                              Preferred: {formatTimeDisplay(time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time preference */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-3">
                        Preferred Time
                      </label>
                      <div className="space-y-2">
                        {timePreferences.map((pref) => (
                          <label
                            key={pref.value}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors
                              ${
                                timePreference === pref.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-base-300 hover:border-primary/50'
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
                                className="radio radio-primary"
                              />
                              <div>
                                <span className="font-medium text-base-content">{pref.label}</span>
                                <span className="text-sm text-base-content/60 ml-2">
                                  {pref.description}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                      <div className="flex gap-3">
                        <svg
                          className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm text-base-content/70">
                          We&apos;ll email you immediately when a matching slot becomes available.
                          Waitlist spots are first-come, first-served.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-base-300 bg-base-200/50">
                    <div className="flex gap-3">
                      <button onClick={onClose} className="btn btn-ghost flex-1">
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn btn-primary flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="loading loading-spinner loading-sm" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
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
