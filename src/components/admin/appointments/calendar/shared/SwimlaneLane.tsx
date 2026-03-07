'use client';

import { TimeGrid } from './TimeGrid';
import { NowIndicator } from './NowIndicator';

interface SwimlaneLaneProps {
  date: Date;
  dayOfWeek: number;
  children: React.ReactNode;
}

export function SwimlaneLane({ date, dayOfWeek, children }: SwimlaneLaneProps) {
  return (
    <div className="absolute inset-0">
      <TimeGrid dayOfWeek={dayOfWeek} />
      <NowIndicator date={date} />
      {/* Appointment cards rendered as children */}
      {children}
    </div>
  );
}
