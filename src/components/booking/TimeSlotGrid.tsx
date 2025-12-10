/**
 * Time slot grid component for booking wizard
 */

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatTimeDisplay } from '@/lib/booking/availability';
import type { TimeSlot } from '@/lib/booking/availability';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  onJoinWaitlist?: (time: string) => void;
  loading?: boolean;
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onTimeSelect,
  onJoinWaitlist,
  loading = false,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div className="bg-base-100 rounded-xl border border-base-300 p-4">
        <h4 className="font-medium text-base-content mb-4">Available Times</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-12 bg-base-300 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-base-100 rounded-xl border border-base-300 p-6 text-center">
        <div className="w-12 h-12 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-base-content/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-base-content/70">No available times for this date</p>
        <p className="text-sm text-base-content/50 mt-1">
          Please select a different date or join the waitlist
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-4">
      <h4 className="font-medium text-base-content mb-4">
        Available Times
        <span className="text-sm font-normal text-base-content/60 ml-2">
          ({availableSlots.length} available)
        </span>
      </h4>

      {/* Available slots */}
      {availableSlots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {availableSlots.map((slot) => (
            <motion.button
              key={slot.time}
              onClick={() => onTimeSelect(slot.time)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-colors min-h-[48px]',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                selectedTime === slot.time
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 hover:bg-primary/10 text-base-content'
              )}
            >
              {formatTimeDisplay(slot.time)}
            </motion.button>
          ))}
        </div>
      )}

      {/* Unavailable slots with waitlist */}
      {unavailableSlots.length > 0 && onJoinWaitlist && (
        <div className="mt-4 pt-4 border-t border-base-300">
          <h5 className="text-sm font-medium text-base-content/70 mb-3">
            Fully Booked Times
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {unavailableSlots.slice(0, 6).map((slot) => (
              <motion.button
                key={slot.time}
                onClick={() => onJoinWaitlist(slot.time)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm transition-colors min-h-[52px]',
                  'bg-base-200/50 border border-base-300 border-dashed',
                  'hover:border-warning hover:bg-warning/10',
                  'focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2'
                )}
              >
                <span className="text-base-content/60 line-through">
                  {formatTimeDisplay(slot.time)}
                </span>
                <span className="block text-xs text-warning mt-1">Join Waitlist</span>
              </motion.button>
            ))}
          </div>
          {unavailableSlots.length > 6 && (
            <p className="text-xs text-base-content/50 mt-2 text-center">
              +{unavailableSlots.length - 6} more fully booked slots
            </p>
          )}
        </div>
      )}
    </div>
  );
}
