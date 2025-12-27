/**
 * AppointmentCalendar Component
 * FullCalendar-based calendar view for appointments
 * Supports day/week/month views with 30-min slots
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { Appointment } from '@/types/database';
import { Clock } from 'lucide-react';

interface AppointmentCalendarProps {
  onEventClick: (appointmentId: string) => void;
  onDateRangeChange?: (start: Date, end: Date) => void;
  onFillFromWaitlist?: (slotTime: Date) => void;
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

// Groomer color palette
const GROOMER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
];

export function AppointmentCalendar({
  onEventClick,
  onDateRangeChange,
  onFillFromWaitlist,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [slotWaitlistCount, setSlotWaitlistCount] = useState(0);
  const [groomers, setGroomers] = useState<any[]>([]);
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>('all');
  const [groomerColorMap, setGroomerColorMap] = useState<Record<string, string>>({});

  // Load groomer filter from localStorage on mount
  useEffect(() => {
    const savedFilter = localStorage.getItem('appointmentGroomerFilter');
    if (savedFilter) {
      setSelectedGroomerId(savedFilter);
    }
  }, []);

  // Save groomer filter to localStorage when it changes
  useEffect(() => {
    if (selectedGroomerId) {
      localStorage.setItem('appointmentGroomerFilter', selectedGroomerId);
    }
  }, [selectedGroomerId]);

  // Fetch groomers and build color map
  useEffect(() => {
    fetchGroomers();
  }, []);

  const fetchGroomers = async () => {
    try {
      const response = await fetch('/api/admin/settings/staff?role=groomer&status=active');
      const result = await response.json();

      if (response.ok) {
        const groomerList = result.data || [];
        setGroomers(groomerList);

        // Build color map
        const colorMap: Record<string, string> = {};
        groomerList.forEach((groomer: any, index: number) => {
          colorMap[groomer.id] = GROOMER_COLORS[index % GROOMER_COLORS.length];
        });
        // Add color for unassigned
        colorMap['unassigned'] = '#9CA3AF';
        setGroomerColorMap(colorMap);
      }
    } catch (error) {
      console.error('Error fetching groomers:', error);
    }
  };

  // Fetch appointments for visible date range
  const fetchAppointments = useCallback(async (start: Date, end: Date) => {
    console.log('[AppointmentCalendar] Fetching appointments from', start.toISOString(), 'to', end.toISOString());
    setLoading(true);
    try {
      let appointments: any[] = [];

      // In mock mode, fetch directly from the client-side mock store
      // This avoids the server/client localStorage mismatch issue
      if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
        const { getMockStore } = await import('@/mocks/supabase/store');
        const store = getMockStore();

        // Get all appointments from the store
        let allAppointments = store.select('appointments', {
          order: { column: 'scheduled_at', ascending: true },
        }) as any[];

        console.log('[AppointmentCalendar] Total appointments in client store:', allAppointments.length);

        // Filter by date range
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Include full end date

        appointments = allAppointments.filter((apt: any) => {
          const aptDate = new Date(apt.scheduled_at);
          return aptDate >= start && aptDate <= endDate;
        });

        console.log('[AppointmentCalendar] After date filter:', appointments.length);

        // Enrich with related data
        appointments = appointments.map((apt: any) => ({
          ...apt,
          customer: store.selectById('users', apt.customer_id),
          pet: store.selectById('pets', apt.pet_id),
          service: store.selectById('services', apt.service_id),
          groomer: apt.groomer_id ? store.selectById('users', apt.groomer_id) : null,
        }));
      } else {
        // Production mode: use API
        const params = new URLSearchParams({
          dateFrom: start.toISOString(),
          dateTo: end.toISOString(),
          limit: '200', // Performance: Limit to 200 appointments to avoid UI slowdown
        });

        const response = await fetch(`/api/admin/appointments?${params}`);
        const result = await response.json();

        console.log('[AppointmentCalendar] API response:', response.ok, result);

        if (response.ok && result.data) {
          appointments = result.data;
        }
      }

      console.log('[AppointmentCalendar] Processing', appointments.length, 'appointments');

      // Filter by selected groomer
      let filteredAppointments = appointments;
      if (selectedGroomerId !== 'all') {
        filteredAppointments = appointments.filter((apt: any) => {
          if (selectedGroomerId === 'unassigned') {
            return !apt.groomer_id;
          }
          return apt.groomer_id === selectedGroomerId;
        });
      }

      const calendarEvents: CalendarEvent[] = filteredAppointments.map((apt: any) => {
        const endTime = new Date(apt.scheduled_at);
        endTime.setMinutes(endTime.getMinutes() + apt.duration_minutes);

        const color = getCalendarEventColor(apt.status);
        const customerName = apt.customer
          ? `${apt.customer.first_name} ${apt.customer.last_name}`
          : 'Unknown Customer';
        const petName = apt.pet?.name || 'Unknown Pet';
        const serviceName = apt.service?.name || 'Unknown Service';
        const groomerName = apt.groomer
          ? `${apt.groomer.first_name} ${apt.groomer.last_name}`
          : 'Unassigned';

        // Get groomer color for border
        const groomerKey = apt.groomer_id || 'unassigned';
        const groomerColor = groomerColorMap[groomerKey] || '#9CA3AF';

        return {
          id: apt.id,
          title: `${customerName} - ${petName}\n${serviceName}\n${groomerName}`,
          start: apt.scheduled_at,
          end: endTime.toISOString(),
          backgroundColor: color,
          borderColor: groomerColor,
          extendedProps: {
            appointment: apt,
            groomerColor,
            groomerName,
          },
        };
      });

      console.log('[AppointmentCalendar] Setting', calendarEvents.length, 'calendar events');
      setEvents(calendarEvents);
    } catch (error) {
      console.error('[AppointmentCalendar] Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGroomerId, groomerColorMap]);

  // Change calendar view when currentView state changes
  useEffect(() => {
    console.log('[AppointmentCalendar] View changed to:', currentView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(currentView);
      // Note: We don't need to manually call fetchAppointments here
      // because FullCalendar's datesSet callback will fire after view change
    }
  }, [currentView]);

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

  // Handle date/time selection (empty slot clicked)
  const handleDateSelect = useCallback(
    async (selectInfo: DateSelectArg) => {
      const slotTime = selectInfo.start;

      // Only allow selection in day/week view and for future slots
      if (currentView === 'dayGridMonth') {
        return;
      }

      if (slotTime < new Date()) {
        return; // Don't show modal for past times
      }

      setSelectedSlot(slotTime);

      // Fetch waitlist count for this slot
      try {
        const response = await fetch(
          `/api/admin/waitlist/count?date=${slotTime.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setSlotWaitlistCount(data.count || 0);
        } else {
          setSlotWaitlistCount(0);
        }
      } catch (error) {
        console.error('[AppointmentCalendar] Error fetching waitlist count:', error);
        setSlotWaitlistCount(0);
      }
    },
    [currentView]
  );

  // Handle event mounting to set custom CSS variables
  const handleEventDidMount = useCallback((info: any) => {
    // Set the event color as a CSS variable for the ::before pseudo-element
    if (info.event.backgroundColor) {
      info.el.style.setProperty('--event-color', info.event.backgroundColor);
    }
  }, []);

  // Handle fill from waitlist
  const handleFillSlot = useCallback(() => {
    if (selectedSlot && onFillFromWaitlist) {
      onFillFromWaitlist(selectedSlot);
      setSelectedSlot(null);
      setSlotWaitlistCount(0);
    }
  }, [selectedSlot, onFillFromWaitlist]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header with View Toggle and Groomer Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Appointment Calendar</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Groomer Filter Dropdown */}
          {groomers.length > 0 && (
            <div className="form-control w-full sm:w-auto">
              <select
                value={selectedGroomerId}
                onChange={(e) => setSelectedGroomerId(e.target.value)}
                className="select select-bordered select-sm bg-white border-[#E5E5E5] focus:border-[#434E54] text-[#434E54]"
                aria-label="Filter by groomer"
              >
                <option value="all">All Groomers</option>
                <option value="unassigned">Unassigned</option>
                {groomers.map((groomer) => (
                  <option key={groomer.id} value={groomer.id}>
                    {groomer.first_name} {groomer.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle Buttons */}
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
      </div>

      {/* Quick Groomer Filter Chips (if 5 or fewer groomers) */}
      {groomers.length > 0 && groomers.length <= 5 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedGroomerId('all')}
            className={`badge badge-lg transition-colors ${
              selectedGroomerId === 'all'
                ? 'bg-[#434E54] text-white border-[#434E54]'
                : 'bg-white text-[#434E54] border-[#434E54] hover:bg-[#EAE0D5]'
            }`}
          >
            All Groomers
          </button>
          <button
            onClick={() => setSelectedGroomerId('unassigned')}
            className={`badge badge-lg transition-colors ${
              selectedGroomerId === 'unassigned'
                ? 'bg-[#9CA3AF] text-white border-[#9CA3AF]'
                : 'bg-white text-[#9CA3AF] border-[#9CA3AF] hover:bg-gray-100'
            }`}
          >
            Unassigned
          </button>
          {groomers.map((groomer) => (
            <button
              key={groomer.id}
              onClick={() => setSelectedGroomerId(groomer.id)}
              className={`badge badge-lg transition-colors`}
              style={{
                backgroundColor: selectedGroomerId === groomer.id ? groomerColorMap[groomer.id] : 'white',
                color: selectedGroomerId === groomer.id ? 'white' : groomerColorMap[groomer.id],
                borderColor: groomerColorMap[groomer.id],
              }}
            >
              {groomer.first_name} {groomer.last_name}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="space-y-3 mb-4">
        {/* Status Legend */}
        <div>
          <p className="text-xs font-semibold text-[#6B7280] mb-2">Status</p>
          <div className="flex flex-wrap gap-4 text-sm">
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
        </div>

        {/* Groomer Legend (if multiple groomers) */}
        {groomers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] mb-2">Groomer (Border Color)</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#9CA3AF' }} />
                <span className="text-[#6B7280]">Unassigned</span>
              </div>
              {groomers.map((groomer) => (
                <div key={groomer.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border-2"
                    style={{ borderColor: groomerColorMap[groomer.id] }}
                  />
                  <span className="text-[#6B7280]">
                    {groomer.first_name} {groomer.last_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
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
          selectable={true}
          selectMirror={true}
          events={events}
          eventClick={handleEventClick}
          eventDidMount={handleEventDidMount}
          select={handleDateSelect}
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

      {/* Fill from Waitlist Modal */}
      {selectedSlot && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="font-bold text-xl text-[#434E54] mb-4">Fill Time Slot</h3>
            <p className="text-[#6B7280] mb-2">
              Selected time:{' '}
              <span className="font-semibold text-[#434E54]">
                {selectedSlot.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>

            {slotWaitlistCount > 0 && (
              <div className="alert bg-[#EAE0D5] border-none mb-4">
                <Clock className="w-5 h-5 text-[#434E54]" />
                <span className="text-[#434E54]">
                  <strong>{slotWaitlistCount}</strong> customer{slotWaitlistCount !== 1 ? 's' : ''} on
                  waitlist for this time
                </span>
              </div>
            )}

            <div className="modal-action">
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setSlotWaitlistCount(0);
                }}
                className="btn btn-ghost text-[#434E54]"
              >
                Cancel
              </button>
              {slotWaitlistCount > 0 && (
                <button
                  onClick={handleFillSlot}
                  className="btn bg-[#434E54] text-white hover:bg-[#363F44]"
                >
                  Fill from Waitlist
                </button>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => {
                setSelectedSlot(null);
                setSlotWaitlistCount(0);
              }}
            >
              close
            </button>
          </form>
        </dialog>
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
          border-left-width: 4px !important;
          border-left-style: solid !important;
        }

        .fc-event:hover {
          opacity: 0.9;
        }

        .fc-daygrid-event {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative;
          padding-left: 1.5rem !important;
          background-color: transparent !important;
          border: none !important;
        }

        .fc-daygrid-event::before {
          content: '';
          position: absolute;
          left: 0.25rem;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--event-color);
        }

        .fc-daygrid-event .fc-event-time {
          font-weight: 600;
          color: #434E54 !important;
        }
        .fc-daygrid-event-dot {
          display: none;
          margin: 0 !important;
        }
        .fc-daygrid-event .fc-event-title {
          color: #6B7280 !important;
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
