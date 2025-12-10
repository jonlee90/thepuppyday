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
      const selected = new Date(selectedDate + 'T00:00:00');
      return { year: selected.getFullYear(), month: selected.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  // Calculate min and max dates
  const minDateObj = useMemo(() => {
    if (minDate) return new Date(minDate + 'T00:00:00');
    return today;
  }, [minDate]);

  const maxDateObj = useMemo(() => {
    if (maxDate) return new Date(maxDate + 'T00:00:00');
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
      const dateString = date.toISOString().split('T')[0];
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
    <div className="bg-base-100 rounded-xl border border-base-300 p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={cn(
            'btn btn-ghost btn-sm btn-circle',
            !canGoPrev && 'opacity-30 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold text-base-content">
          {MONTHS[currentMonth.month]} {currentMonth.year}
        </h3>

        <button
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className={cn(
            'btn btn-ghost btn-sm btn-circle',
            !canGoNext && 'opacity-30 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-base-content/50 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
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
              whileHover={!disabled ? { scale: 1.1 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                disabled && 'opacity-30 cursor-not-allowed',
                !disabled && !selected && 'hover:bg-primary/10',
                selected && 'bg-primary text-primary-content',
                todayDate && !selected && 'ring-2 ring-primary/50'
              )}
            >
              {date.getDate()}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-base-300 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-base-content/60">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded ring-2 ring-primary/50" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-base-300 opacity-30" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
