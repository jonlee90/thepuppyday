/**
 * AppointmentCalendar Component
 * FullCalendar-based calendar view for appointments
 * Supports day/week/month views with 30-min slots
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { Appointment } from '@/types/database';

interface AppointmentCalendarProps {
  onEventClick: (appointmentId: string) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    appointment: Appointment;
  };
}

export function AppointmentCalendar({
  onEventClick,
  onDateRangeChange,
}: AppointmentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridDay');

  // Fetch appointments for visible date range
  const fetchAppointments = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateFrom: start.toISOString(),
        dateTo: end.toISOString(),
        limit: '200', // Performance: Limit to 200 appointments to avoid UI slowdown
      });

      const response = await fetch(`/api/admin/appointments?${params}`);
      const result = await response.json();

      if (response.ok && result.data) {
        const calendarEvents: CalendarEvent[] = result.data.map((apt: any) => {
          const endTime = new Date(apt.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + apt.duration_minutes);

          const color = getCalendarEventColor(apt.status);
          const customerName = apt.customer
            ? `${apt.customer.first_name} ${apt.customer.last_name}`
            : 'Unknown Customer';
          const petName = apt.pet?.name || 'Unknown Pet';
          const serviceName = apt.service?.name || 'Unknown Service';

          return {
            id: apt.id,
            title: `${customerName} - ${petName}\n${serviceName}`,
            start: apt.scheduled_at,
            end: endTime.toISOString(),
            backgroundColor: color,
            borderColor: color,
            extendedProps: {
              appointment: apt,
            },
          };
        });

        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('[AppointmentCalendar] Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle date range change
  const handleDatesSet = useCallback(
    (info: any) => {
      fetchAppointments(info.start, info.end);
      if (onDateRangeChange) {
        onDateRangeChange(info.start, info.end);
      }
    },
    [fetchAppointments, onDateRangeChange]
  );

  // Handle event click
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      onEventClick(info.event.id);
    },
    [onEventClick]
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Appointment Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('timeGridDay')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'timeGridDay'
                ? 'bg-[#434E54] text-white'
                : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#DCD2C7]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setCurrentView('timeGridWeek')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'timeGridWeek'
                ? 'bg-[#434E54] text-white'
                : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#DCD2C7]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('dayGridMonth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'dayGridMonth'
                ? 'bg-[#434E54] text-white'
                : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#DCD2C7]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9CA3AF' }} />
          <span className="text-[#6B7280]">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#74B9FF' }} />
          <span className="text-[#6B7280]">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFB347' }} />
          <span className="text-[#6B7280]">Checked In</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#6BCB77' }} />
          <span className="text-[#6B7280]">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2D6A4F' }} />
          <span className="text-[#6B7280]">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-[#6B7280]">Cancelled/No Show</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
            startTime: '09:00',
            endTime: '17:00',
          }}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          allDaySlot={false}
          nowIndicator={true}
          height="auto"
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          loading={(isLoading) => setLoading(isLoading)}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-lg text-[#434E54]" />
        </div>
      )}

      <style jsx global>{`
        .calendar-wrapper {
          font-family: inherit;
        }

        .fc {
          background: white;
        }

        .fc .fc-button {
          background-color: #434E54 !important;
          border-color: #434E54 !important;
          color: white !important;
          text-transform: capitalize;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .fc .fc-button:hover {
          background-color: #363F44 !important;
          border-color: #363F44 !important;
        }

        .fc .fc-button:disabled {
          background-color: #9CA3AF !important;
          border-color: #9CA3AF !important;
          opacity: 0.5;
        }

        .fc .fc-button-active {
          background-color: #363F44 !important;
        }

        .fc-theme-standard th,
        .fc-theme-standard td {
          border-color: #E5E7EB !important;
        }

        .fc-col-header-cell {
          background-color: #F8EEE5 !important;
          padding: 0.75rem 0.5rem;
          font-weight: 600;
          color: #434E54 !important;
        }

        .fc-timegrid-slot {
          height: 3rem !important;
        }

        .fc-timegrid-slot-label {
          color: #6B7280 !important;
        }

        .fc-event {
          cursor: pointer;
          border-radius: 0.375rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          white-space: pre-wrap;
        }

        .fc-event:hover {
          opacity: 0.9;
        }

        .fc-daygrid-event {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fc-day-today {
          background-color: #FFFBF7 !important;
        }

        .fc-timegrid-now-indicator-line {
          border-color: #434E54 !important;
        }

        .fc-timegrid-now-indicator-arrow {
          border-color: #434E54 !important;
        }

        /* Gray out non-business hours */
        .fc-non-business {
          background-color: #F3F4F6 !important;
        }
      `}</style>
    </div>
  );
}
