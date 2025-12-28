/**
 * Calendar picker component for booking wizard
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CalendarPickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      // Parse date string as YYYY-MM-DD in local timezone
      const [year, month, day] = selectedDate.split('-').map(Number);
      const selected = new Date(year, month - 1, day);
      return { year: selected.getFullYear(), month: selected.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  // Calculate min and max dates
  const minDateObj = useMemo(() => {
    if (minDate) {
      const [year, month, day] = minDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return today;
  }, [minDate]);

  const maxDateObj = useMemo(() => {
    if (maxDate) {
      const [year, month, day] = maxDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Default to 2 months ahead
    const max = new Date(today);
    max.setMonth(max.getMonth() + 2);
    return max;
  }, [maxDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date | null; dateString: string | null }> = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, dateString: null });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.year, currentMonth.month, day);
      // Format as YYYY-MM-DD without UTC conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;
      days.push({ date, dateString });
    }

    return days;
  }, [currentMonth]);

  const canGoPrev = useMemo(() => {
    const prevMonth = new Date(currentMonth.year, currentMonth.month - 1, 1);
    return prevMonth >= new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1);
  }, [currentMonth, minDateObj]);

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(currentMonth.year, currentMonth.month + 1, 1);
    return nextMonth <= new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), 1);
  }, [currentMonth, maxDateObj]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const isDateDisabled = (dateString: string | null, date: Date | null) => {
    if (!dateString || !date) return true;
    if (date < minDateObj) return true;
    if (date > maxDateObj) return true;
    if (disabledDates.includes(dateString)) return true;
    return false;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#434E54]/20 p-3 sm:p-4">
      {/* Compact month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-[#434E54] hover:bg-[#EAE0D5] transition-colors',
            !canGoPrev && 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-base sm:text-lg font-bold text-[#434E54]">
          {MONTHS[currentMonth.month]} {currentMonth.year}
        </h3>

        <button
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-[#434E54] hover:bg-[#EAE0D5] transition-colors',
            !canGoNext && 'opacity-30 cursor-not-allowed'
          )}
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Compact day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-[#434E54]/60 py-1"
          >
            {/* Show only first letter on very small screens */}
            <span className="sm:hidden">{day.charAt(0)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Enhanced calendar grid with larger touch targets */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map(({ date, dateString }, index) => {
          const disabled = isDateDisabled(dateString, date);
          const selected = dateString === selectedDate;
          const todayDate = isToday(date);

          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          return (
            <motion.button
              key={dateString}
              onClick={() => !disabled && onDateSelect(dateString!)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.92 } : {}}
              className={cn(
                // Larger minimum size for touch
                'aspect-square min-h-[44px] md:min-h-[48px] flex items-center justify-center',
                'rounded-lg text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#434E54]/50 focus-visible:ring-offset-2',
                disabled && 'opacity-30 cursor-not-allowed text-[#434E54]/40',
                !disabled && !selected && 'hover:bg-[#EAE0D5] hover:shadow-md text-[#434E54] active:bg-[#EAE0D5]/80',
                selected && 'bg-[#434E54] text-white shadow-lg shadow-[#434E54]/30 font-bold md:scale-105',
                todayDate && !selected && 'ring-2 ring-[#434E54]/40 font-semibold bg-[#434E54]/5'
              )}
              aria-label={date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
              aria-pressed={selected}
              aria-disabled={disabled}
            >
              <span className="relative z-10">{date.getDate()}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Responsive legend */}
      <div className="mt-4 pt-4 border-t border-[#434E54]/20">
        {/* Mobile: Compact horizontal layout */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#434E54] shadow-sm" />
            <span className="text-[#434E54]/70">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-2 ring-[#434E54]/40 bg-[#434E54]/5" />
            <span className="text-[#434E54]/70">Today</span>
          </div>
          {/* Hide unavailable on very small screens */}
          <div className="hidden xs:flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#EAE0D5] opacity-50" />
            <span className="text-[#434E54]/70">Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
