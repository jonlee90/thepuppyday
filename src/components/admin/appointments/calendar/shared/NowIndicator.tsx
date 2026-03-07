'use client';

import { useState, useEffect } from 'react';
import { isToday } from 'date-fns';
import { getPositionFromTime } from '../utils';

interface NowIndicatorProps {
  date: Date;
}

export function NowIndicator({ date }: NowIndicatorProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday(date)) return null;

  const top = getPositionFromTime(now);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="relative flex items-center">
        {/* Pulse dot */}
        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        {/* Line */}
        <div className="w-full h-[2px] bg-red-500" />
      </div>
    </div>
  );
}
