'use client';

import { useRef, useEffect, useMemo } from 'react';
import { isToday, getDay } from 'date-fns';
import type { CalendarAppointment, Groomer, GroomerColorMap } from '../types';
import { groupByGroomer, getPositionFromTime, getTimeFromPosition, snapToInterval, getTotalDisplayMinutes, computeOverlapLayout } from '../utils';
import { SLOT_CONFIG, UNASSIGNED_COLOR } from '../constants';
import { TimeColumn } from '../shared/TimeColumn';
import { SwimlaneLane } from '../shared/SwimlaneLane';
import { AppointmentCard } from '../cards/AppointmentCard';

interface DayViewProps {
  date: Date;
  appointments: CalendarAppointment[];
  groomers: Groomer[];
  groomerColorMap: GroomerColorMap;
  hasUnassigned: boolean;
  onEventClick: (appointmentId: string) => void;
  onSlotClick?: (time: Date, groomerId: string | null) => void;
  onPreviewShow?: (e: React.MouseEvent, appointment: CalendarAppointment) => void;
  onPreviewHide?: () => void;
}

export function DayView({
  date,
  appointments,
  groomers,
  groomerColorMap,
  hasUnassigned,
  onEventClick,
  onSlotClick,
  onPreviewShow,
  onPreviewHide,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => groupByGroomer(appointments), [appointments]);
  const dayOfWeek = getDay(date);
  const totalHeight = getTotalDisplayMinutes() * SLOT_CONFIG.pixelsPerMinute;

  // Build lane list: known groomers + unassigned if needed
  const lanes = useMemo(() => {
    const result: { id: string; name: string; color: string }[] = [];

    for (const g of groomers) {
      result.push({
        id: g.id,
        name: `${g.first_name} ${g.last_name}`,
        color: groomerColorMap[g.id] || UNASSIGNED_COLOR,
      });
    }

    if (hasUnassigned || groomers.length === 0) {
      result.push({
        id: 'unassigned',
        name: 'Unassigned',
        color: UNASSIGNED_COLOR,
      });
    }

    return result;
  }, [groomers, groomerColorMap, hasUnassigned]);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (isToday(date) && scrollRef.current) {
      const now = new Date();
      const scrollTo = getPositionFromTime(now) - 100;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [date]);

  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-lg border border-[#E5E7EB] bg-white max-h-[calc(100dvh-320px)]"
    >
      <div className="flex min-w-[600px]">
        {/* Time column - sticky left */}
        <div className="flex-shrink-0 sticky left-0 z-20 bg-white border-r border-[#E5E7EB]">
          {/* Header spacer to align with groomer column headers */}
          <div className="h-10 border-b border-[#E5E7EB]" />
          <TimeColumn />
        </div>

        {/* Groomer columns - side by side */}
        {lanes.map((lane) => {
          const laneAppointments = grouped[lane.id] || [];

          return (
            <div key={lane.id} className="flex-1 min-w-[150px] border-r border-[#E5E7EB] last:border-r-0">
              {/* Column header - groomer info */}
              <div className="h-10 flex items-center justify-center gap-1.5 border-b border-[#E5E7EB] bg-[#FAFAFA] px-2 sticky top-0 z-10">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lane.color }}
                />
                <span className="text-xs font-medium text-[#434E54] truncate">
                  {lane.name}
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  ({laneAppointments.length})
                </span>
              </div>

              {/* Lane content */}
              <div
                className="relative"
                style={{ height: totalHeight }}
                onClick={(e) => {
                  if (!onSlotClick) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const time = snapToInterval(getTimeFromPosition(y, date));
                  if (time > new Date()) {
                    onSlotClick(time, lane.id === 'unassigned' ? null : lane.id);
                  }
                }}
              >
                <SwimlaneLane date={date} dayOfWeek={dayOfWeek}>
                  {(() => {
                    const overlapMap = computeOverlapLayout(laneAppointments);
                    return laneAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        groomerColorMap={groomerColorMap}
                        onClick={onEventClick}
                        onMouseEnter={onPreviewShow}
                        onMouseLeave={onPreviewHide}
                        overlapIndex={overlapMap.get(apt.id)?.columnIndex}
                        overlapTotal={overlapMap.get(apt.id)?.totalColumns}
                      />
                    ));
                  })()}
                </SwimlaneLane>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
