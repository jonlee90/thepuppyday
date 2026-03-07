'use client';

import { generateSubSlots, isBusinessHour } from '../utils';
import { SLOT_CONFIG } from '../constants';

interface TimeGridProps {
  dayOfWeek: number; // 0=Sun, 1=Mon, etc.
}

export function TimeGrid({ dayOfWeek }: TimeGridProps) {
  const subSlots = generateSubSlots();
  const slotHeight = SLOT_CONFIG.slotDurationMinutes * SLOT_CONFIG.pixelsPerMinute;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {subSlots.map((slot, i) => {
        const isBusiness = isBusinessHour(slot.hour, dayOfWeek);
        const isHourLine = slot.minute === 0;

        return (
          <div
            key={`${slot.hour}-${slot.minute}`}
            className="absolute left-0 right-0"
            style={{
              top: i * slotHeight,
              height: slotHeight,
              backgroundColor: isBusiness ? 'transparent' : '#F9FAFB',
              borderTop: isHourLine ? '1px solid #E5E7EB' : '1px dashed #F3F4F6',
            }}
          />
        );
      })}
    </div>
  );
}
