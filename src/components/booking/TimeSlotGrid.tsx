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
      <div className="bg-white rounded-xl shadow-md p-4">
        <h4 className="font-medium text-[#434E54] mb-4">Available Times</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-12 bg-[#EAE0D5] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 text-center">
        <div className="w-12 h-12 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-[#6B7280]"
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
        <p className="text-[#434E54] font-medium">No available times for this date</p>
        <p className="text-sm text-[#6B7280] mt-1">
          Please select a different date or join the waitlist
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h4 className="font-medium text-[#434E54] mb-4">
        Available Times
        <span className="text-sm font-normal text-[#6B7280] ml-2">
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
                'py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px]',
                'focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:ring-offset-2',
                selectedTime === slot.time
                  ? 'bg-[#434E54] text-white shadow-md'
                  : 'bg-[#F8EEE5] hover:bg-[#EAE0D5] text-[#434E54]'
              )}
            >
              {formatTimeDisplay(slot.time)}
            </motion.button>
          ))}
        </div>
      )}

      {/* Unavailable slots with waitlist */}
      {unavailableSlots.length > 0 && onJoinWaitlist && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-[#6B7280] mb-3">
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
                  'py-2 px-3 rounded-lg text-sm transition-all duration-200 min-h-[52px]',
                  'bg-white border-2 border-dashed border-[#FFB347]/40',
                  'hover:border-[#FFB347] hover:bg-[#FFB347]/10',
                  'focus:outline-none focus:ring-2 focus:ring-[#FFB347]/20 focus:ring-offset-2'
                )}
              >
                <span className="text-[#6B7280] line-through">
                  {formatTimeDisplay(slot.time)}
                </span>
                <span className="block text-xs text-[#FFB347] font-medium mt-1">Join Waitlist</span>
              </motion.button>
            ))}
          </div>
          {unavailableSlots.length > 6 && (
            <p className="text-xs text-[#6B7280] mt-2 text-center">
              +{unavailableSlots.length - 6} more fully booked slots
            </p>
          )}
        </div>
      )}
    </div>
  );
}
