'use client';

import { generateTimeSlots } from '../utils';
import { SLOT_CONFIG } from '../constants';

export function TimeColumn() {
  const slots = generateTimeSlots();
  const slotHeight = 60 * SLOT_CONFIG.pixelsPerMinute; // 1 hour in pixels

  return (
    <div className="flex-shrink-0 w-[60px] relative">
      {slots.map((slot, index) => (
        <div
          key={`${slot.hour}-${slot.minute}`}
          className="relative"
          style={{ height: slotHeight }}
        >
          <span
            className="absolute right-2 text-xs text-[#6B7280] select-none"
            style={{ top: index === 0 ? 2 : -10 }}
          >
            {slot.label}
          </span>
        </div>
      ))}
    </div>
  );
}
