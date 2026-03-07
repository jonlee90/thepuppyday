'use client';

import type { CalendarAppointment } from '../types';
import { TOUCH_CONFIG } from '../constants';

interface ResizeHandleProps {
  appointment: CalendarAppointment;
  onResizeStart: (e: React.PointerEvent, appointment: CalendarAppointment) => void;
}

export function ResizeHandle({ appointment, onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 cursor-s-resize flex items-end justify-center hover:bg-black/5 transition-colors touch-none"
      style={{ height: TOUCH_CONFIG.resizeHandleHeight }}
      onPointerDown={(e) => onResizeStart(e, appointment)}
    >
      <div className="w-8 h-1 rounded-full bg-[#6B7280]/30 mb-1" />
    </div>
  );
}
