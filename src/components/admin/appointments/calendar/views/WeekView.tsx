'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { eachDayOfInterval, startOfWeek, endOfWeek, format, isToday, getDay } from 'date-fns';
import type { CalendarAppointment, Groomer, GroomerColorMap } from '../types';
import { filterAppointmentsForDay, groupByGroomer, getPositionFromTime, getTotalDisplayMinutes } from '../utils';
import { SLOT_CONFIG, UNASSIGNED_COLOR } from '../constants';
import { TimeColumn } from '../shared/TimeColumn';
import { SwimlaneLane } from '../shared/SwimlaneLane';
import { AppointmentCard } from '../cards/AppointmentCard';

interface WeekViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
  groomers: Groomer[];
  groomerColorMap: GroomerColorMap;
  hasUnassigned: boolean;
  onEventClick: (appointmentId: string) => void;
  onSlotClick?: (time: Date, groomerId: string | null) => void;
  onPreviewShow?: (e: React.MouseEvent, appointment: CalendarAppointment) => void;
  onPreviewHide?: () => void;
}

export function WeekView({
  currentDate,
  appointments,
  groomers,
  groomerColorMap,
  hasUnassigned,
  onEventClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSlotClick,
  onPreviewShow,
  onPreviewHide,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // For many groomers, use day tabs. For few, show all days side by side.
  const useTabs = groomers.length > 3;
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    days.findIndex((d) => isToday(d))
  );

  // Ensure valid day index
  const activeDayIndex = selectedDayIndex >= 0 ? selectedDayIndex : 0;

  const totalHeight = getTotalDisplayMinutes() * SLOT_CONFIG.pixelsPerMinute;

  // Build lane list
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
      result.push({ id: 'unassigned', name: 'Unassigned', color: UNASSIGNED_COLOR });
    }
    return result;
  }, [groomers, groomerColorMap, hasUnassigned]);

  // Auto-scroll to current time
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = getPositionFromTime(now) - 100;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, []);

  // Tab-based layout (many groomers) — single day with groomer columns
  if (useTabs) {
    const activeDay = days[activeDayIndex];
    const dayAppointments = filterAppointmentsForDay(appointments, activeDay);
    const grouped = groupByGroomer(dayAppointments);

    return (
      <div>
        {/* Day tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {days.map((day, i) => {
            const dayApts = filterAppointmentsForDay(appointments, day);
            const today = isToday(day);
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[60px] transition-colors min-h-[44px] ${
                  i === activeDayIndex
                    ? 'bg-[#434E54] text-white'
                    : today
                      ? 'bg-[#EAE0D5] text-[#434E54]'
                      : 'bg-white text-[#434E54] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">{format(day, 'EEE')}</span>
                <span className="text-sm font-bold">{format(day, 'd')}</span>
                {dayApts.length > 0 && (
                  <span className={`text-[9px] ${i === activeDayIndex ? 'text-white/70' : 'text-[#6B7280]'}`}>
                    {dayApts.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Groomer columns for selected day */}
        <div
          ref={scrollRef}
          className="overflow-auto rounded-lg border border-[#E5E7EB] bg-white max-h-[calc(100dvh-370px)]"
        >
          <div className="flex min-w-[600px]">
            {/* Time column - sticky left */}
            <div className="flex-shrink-0 sticky left-0 z-20 bg-white border-r border-[#E5E7EB]">
              <div className="h-10 border-b border-[#E5E7EB]" />
              <TimeColumn />
            </div>

            {/* Groomer columns */}
            {lanes.map((lane) => {
              const laneApts = grouped[lane.id] || [];
              return (
                <div key={lane.id} className="flex-1 min-w-[150px] border-r border-[#E5E7EB] last:border-r-0">
                  {/* Column header */}
                  <div className="h-10 flex items-center justify-center gap-1.5 border-b border-[#E5E7EB] bg-[#FAFAFA] px-2 sticky top-0 z-10">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lane.color }}
                    />
                    <span className="text-xs font-medium text-[#434E54] truncate">
                      {lane.name}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      ({laneApts.length})
                    </span>
                  </div>

                  {/* Lane content */}
                  <div className="relative" style={{ height: totalHeight }}>
                    <SwimlaneLane date={activeDay} dayOfWeek={getDay(activeDay)}>
                      {laneApts.map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          groomerColorMap={groomerColorMap}
                          onClick={onEventClick}
                          onMouseEnter={onPreviewShow}
                          onMouseLeave={onPreviewHide}
                        />
                      ))}
                    </SwimlaneLane>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Side-by-side layout (few groomers) — 7 day columns, each with stacked appointments
  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-lg border border-[#E5E7EB] bg-white max-h-[calc(100dvh-320px)]"
    >
      <div className="flex min-w-[900px]">
        {/* Time column */}
        <div className="flex-shrink-0 sticky left-0 z-20 bg-white border-r border-[#E5E7EB]">
          <div className="h-10 border-b border-[#E5E7EB]" /> {/* Header spacer */}
          <TimeColumn />
        </div>

        {/* Day columns */}
        {days.map((day, i) => {
          const dayApts = filterAppointmentsForDay(appointments, day);
          const today = isToday(day);

          return (
            <div
              key={i}
              className={`flex-1 min-w-[100px] border-r border-[#E5E7EB] last:border-r-0 ${
                today ? 'bg-[#FFFBF7]' : ''
              }`}
            >
              {/* Day header */}
              <div
                className={`h-10 flex items-center justify-center border-b border-[#E5E7EB] text-xs font-semibold sticky top-0 z-10 ${
                  today ? 'bg-[#EAE0D5] text-[#434E54]' : 'bg-[#F8EEE5] text-[#434E54]'
                }`}
              >
                <span>{format(day, 'EEE d')}</span>
                {dayApts.length > 0 && (
                  <span className="ml-1 text-[9px] text-[#6B7280]">({dayApts.length})</span>
                )}
              </div>

              {/* Time grid with appointments */}
              <div className="relative" style={{ height: totalHeight }}>
                <SwimlaneLane date={day} dayOfWeek={getDay(day)}>
                  {dayApts.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      groomerColorMap={groomerColorMap}
                      onClick={onEventClick}
                      onMouseEnter={onPreviewShow}
                      onMouseLeave={onPreviewHide}
                    />
                  ))}
                </SwimlaneLane>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
