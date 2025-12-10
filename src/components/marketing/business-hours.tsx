'use client';

/**
 * Business hours component with real-time open/closed status
 */

import { useState, useEffect } from 'react';
import {
  isCurrentlyOpen,
  getNextOpenTime,
  formatTime,
  getCurrentDayName,
} from '@/lib/utils/business-hours';

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

type BusinessHoursType = Record<string, DayHours>;

interface BusinessHoursProps {
  hours: BusinessHoursType;
}

export function BusinessHours({ hours }: BusinessHoursProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState('');

  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isCurrentlyOpen(hours));
      setNextOpenTime(getNextOpenTime(hours));
      setCurrentDay(getCurrentDayName());
    };

    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [hours]);

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isOpen ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success' : 'bg-error'}`} />
          <span className="font-semibold">{isOpen ? 'Open Now' : 'Closed'}</span>
        </div>
        {!isOpen && nextOpenTime && (
          <div className="text-sm text-base-content/60">Opens {nextOpenTime}</div>
        )}
      </div>

      {/* Hours List */}
      <div className="space-y-2">
        {dayOrder.map((day) => {
          const dayHours = hours[day];
          const isCurrentDay = day === currentDay;

          return (
            <div
              key={day}
              className={`flex justify-between items-center py-2 px-4 rounded-lg ${
                isCurrentDay ? 'bg-primary/10 font-semibold' : 'bg-base-200/50'
              }`}
            >
              <span className="capitalize">{day}</span>
              <span className={dayHours?.is_open ? '' : 'text-base-content/60'}>
                {dayHours?.is_open
                  ? `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`
                  : 'Closed'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
