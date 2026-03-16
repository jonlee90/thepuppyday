'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  generateTimeSlots,
  getDayName,
  formatTimeDisplay,
  type BusinessHours,
  DEFAULT_BUSINESS_HOURS,
} from '@/lib/booking/availability';

interface AdminFreeTimeInputProps {
  selectedDate: string | null;
  selectedTime: string | null;
  onTimeChange: (time: string) => void;
  isBackdated: boolean;
  businessHours?: BusinessHours;
}

export function AdminFreeTimeInput({
  selectedDate,
  selectedTime,
  onTimeChange,
  isBackdated,
  businessHours = DEFAULT_BUSINESS_HOURS,
}: AdminFreeTimeInputProps) {
  const [conflictCount, setConflictCount] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate time slots from business hours for the selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayName = getDayName(date);
    const dayHours = businessHours[dayName];
    if (!dayHours.is_open) return [];
    return generateTimeSlots(dayHours.open, dayHours.close);
  }, [selectedDate, businessHours]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!selectedDate || !selectedTime) {
      debounceRef.current = setTimeout(() => setConflictCount(null), 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/appointments/conflicts?date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        setConflictCount(json.count ?? 0);
      } catch {
        // Non-blocking: silently ignore errors
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedDate, selectedTime]);

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-6 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-[#EAE0D5] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#434E54]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[#434E54]/70">Select a date to see available times</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[#434E54] flex items-center gap-2">
          <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select Time
        </h4>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAE0D5] text-[#434E54] border border-[#434E54]/20">
          {timeSlots.length} slots
        </span>
      </div>

      {timeSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {timeSlots.map((time) => (
            <motion.button
              key={time}
              onClick={() => onTimeChange(time)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'py-3 px-4 rounded-lg font-medium transition-all duration-200',
                'min-h-[52px] flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
                selectedTime === time
                  ? 'bg-[#434E54] text-white shadow-lg shadow-[#434E54]/30 font-bold'
                  : 'bg-[#EAE0D5] hover:bg-[#EAE0D5]/80 text-[#434E54] active:bg-[#EAE0D5]/60'
              )}
              aria-pressed={selectedTime === time}
              aria-label={`Select time ${formatTimeDisplay(time)}`}
            >
              <span className="text-base font-bold">
                {formatTimeDisplay(time)}
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[#434E54]/60 text-sm">Business is closed on this day</p>
        </div>
      )}

      {isBackdated && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Backdating — this appointment will be marked as completed</span>
        </div>
      )}

      {conflictCount !== null && conflictCount > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {conflictCount} existing appointment{conflictCount !== 1 ? 's' : ''} at this time
          </span>
        </div>
      )}
    </div>
  );
}
