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
      <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-[#EAE0D5] rounded animate-pulse" />
          <div className="h-6 w-16 bg-[#EAE0D5] rounded-full animate-pulse" />
        </div>

        {/* Match actual grid layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-[52px] bg-[#EAE0D5] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-6 text-center">
        <div className="w-12 h-12 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-[#434E54]/60"
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
        <p className="text-sm text-[#434E54]/60 mt-1">
          Please select a different date or join the waitlist
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-[#434E54] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Available Times
        </h4>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAE0D5] text-[#434E54] border border-[#434E54]/20">
          {availableSlots.length} slots
        </span>
      </div>

      {/* Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      {availableSlots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {availableSlots.map((slot) => (
            <motion.button
              key={slot.time}
              onClick={() => onTimeSelect(slot.time)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                // Enhanced touch targets
                'py-3 px-4 rounded-lg font-medium transition-all duration-200',
                'min-h-[52px] flex items-center justify-center', // Larger minimum height
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
                selectedTime === slot.time
                  ? 'bg-[#434E54] text-white shadow-lg shadow-[#434E54]/30 font-bold'
                  : 'bg-[#EAE0D5] hover:bg-[#EAE0D5]/80 text-[#434E54] active:bg-[#EAE0D5]/60'
              )}
              aria-pressed={selectedTime === slot.time}
              aria-label={`Book appointment at ${formatTimeDisplay(slot.time)}`}
            >
              <span className="text-base font-bold">
                {formatTimeDisplay(slot.time)}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Enhanced waitlist section */}
      {unavailableSlots.length > 0 && onJoinWaitlist && (
        <div className="mt-6 pt-6 border-t border-[#434E54]/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[#434E54]/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h5 className="text-sm font-semibold text-[#434E54]">
              Join Waitlist
            </h5>
          </div>

          <p className="text-xs text-[#434E54]/60 mb-3">
            Get notified if a spot opens up at these fully booked times
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {unavailableSlots.slice(0, 6).map((slot) => (
              <motion.button
                key={slot.time}
                onClick={() => onJoinWaitlist(slot.time)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'py-3 px-3 rounded-lg transition-all duration-200 min-h-[56px]',
                  'bg-white border-2 border-dashed border-[#434E54]/40',
                  'hover:border-[#434E54] hover:bg-[#EAE0D5]/30 active:bg-[#EAE0D5]/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
                  'flex flex-col items-center justify-center gap-1'
                )}
                aria-label={`Join waitlist for ${formatTimeDisplay(slot.time)}`}
              >
                <span className="text-sm text-[#434E54]/50 line-through font-medium">
                  {formatTimeDisplay(slot.time)}
                </span>
                <span className="text-xs text-[#434E54] font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Waitlist
                </span>
              </motion.button>
            ))}
          </div>

          {unavailableSlots.length > 6 && (
            <p className="text-xs text-[#434E54]/60 mt-3 text-center">
              +{unavailableSlots.length - 6} more fully booked slots
            </p>
          )}
        </div>
      )}
    </div>
  );
}
