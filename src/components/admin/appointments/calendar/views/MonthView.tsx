'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { CalendarAppointment, GroomerColorMap } from '../types';
import { generateMonthGrid } from '../utils';
import { MONTH_CONFIG } from '../constants';
import { AppointmentChip } from '../cards/AppointmentChip';

interface MonthViewProps {
  currentDate: Date;
  appointments: CalendarAppointment[];
  groomerColorMap: GroomerColorMap;
  onEventClick: (appointmentId: string) => void;
  onDayClick: (date: Date) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthView({
  currentDate,
  appointments,
  groomerColorMap,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const grid = useMemo(
    () => generateMonthGrid(currentDate, appointments),
    [currentDate, appointments]
  );

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold text-[#434E54] bg-[#F8EEE5]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {grid.map((cell, i) => {
          const visibleApts = cell.appointments.slice(0, MONTH_CONFIG.maxVisibleAppointments);
          const overflowCount = cell.appointments.length - MONTH_CONFIG.maxVisibleAppointments;

          return (
            <div
              key={i}
              className={`border-b border-r border-[#E5E7EB] min-h-[100px] p-1.5 cursor-pointer transition-colors ${
                cell.isCurrentMonth
                  ? cell.isToday
                    ? 'bg-[#FFFBF7]'
                    : 'bg-white hover:bg-[#FAFAFA]'
                  : 'bg-[#F9FAFB]'
              }`}
              onClick={() => onDayClick(cell.date)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm leading-none ${
                    cell.isToday
                      ? 'bg-[#434E54] text-white w-6 h-6 rounded-full flex items-center justify-center font-bold'
                      : cell.isCurrentMonth
                        ? 'text-[#434E54] font-medium'
                        : 'text-[#9CA3AF]'
                  }`}
                >
                  {format(cell.date, 'd')}
                </span>
              </div>

              {/* Appointment chips */}
              <div className="space-y-0.5">
                <AnimatePresence mode="popLayout">
                  {visibleApts.map((apt) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AppointmentChip
                        appointment={apt}
                        groomerColorMap={groomerColorMap}
                        onClick={onEventClick}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {overflowCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(cell.date);
                    }}
                    className="text-[10px] text-[#6B7280] hover:text-[#434E54] font-medium pl-1"
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
