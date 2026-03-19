'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MobileChipRow } from '@/components/admin/mobile/MobileChipRow';
import { MobileEmptyState } from '@/components/admin/mobile/MobileEmptyState';
import { MobileAppointmentCard } from './MobileAppointmentCard';
import { toast } from '@/hooks/use-toast';
import type { CalendarAppointment, Groomer } from '../calendar/types';
import { GROOMER_COLORS, UNASSIGNED_COLOR } from '../calendar/constants';

export interface MobileAgendaViewProps {
  onAppointmentClick: (appointmentId: string) => void;
  refreshKey?: number;
}

interface TimeGroup {
  label: string;
  hour: number;
  appointments: CalendarAppointment[];
}

export function MobileAgendaView({ onAppointmentClick, refreshKey }: MobileAgendaViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [groomerColorMap, setGroomerColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedGroomerId, setSelectedGroomerId] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const params = new URLSearchParams({
        dateFrom: `${dateStr}T00:00:00.000Z`,
        dateTo: `${dateStr}T23:59:59.999Z`,
        limit: '200',
      });

      const [appointmentsRes, groomersRes] = await Promise.all([
        fetch(`/api/admin/appointments?${params}`),
        fetch('/api/admin/settings/staff?role=all&status=active'),
      ]);

      const [apptData, groomerData] = await Promise.all([
        appointmentsRes.json(),
        groomersRes.json(),
      ]);

      if (appointmentsRes.ok && apptData.data) {
        setAppointments(apptData.data);
      }

      if (groomersRes.ok && groomerData.data) {
        const list: Groomer[] = groomerData.data;
        setGroomers(list);
        const colorMap: Record<string, string> = {};
        list.forEach((g, i) => {
          colorMap[g.id] = GROOMER_COLORS[i % GROOMER_COLORS.length];
        });
        colorMap['unassigned'] = UNASSIGNED_COLOR;
        setGroomerColorMap(colorMap);
      }
    } catch {
      setError(true);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Filter by groomer
  const filtered = appointments.filter((apt) => {
    if (selectedGroomerId === 'all') return true;
    if (selectedGroomerId === 'unassigned') return !apt.groomer_id;
    return apt.groomer_id === selectedGroomerId;
  });

  // Group by hour slot
  const grouped: TimeGroup[] = [];
  const hourMap = new Map<number, CalendarAppointment[]>();
  for (const apt of filtered) {
    const hour = new Date(apt.scheduled_at).getHours();
    if (!hourMap.has(hour)) hourMap.set(hour, []);
    hourMap.get(hour)!.push(apt);
  }
  const sortedHours = Array.from(hourMap.keys()).sort((a, b) => a - b);
  for (const hour of sortedHours) {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    grouped.push({
      label: format(date, 'h:00 a'),
      hour,
      appointments: hourMap.get(hour)!,
    });
  }

  // Groomer chip options
  const groomerChips = [
    { value: 'all', label: 'All' },
    ...groomers.map((g) => ({
      value: g.id,
      label: `${g.first_name} ${g.last_name}`,
    })),
    ...(appointments.some((a) => !a.groomer_id)
      ? [{ value: 'unassigned', label: 'Unassigned' }]
      : []),
  ];

  const dateLabel = isToday(currentDate)
    ? 'Today'
    : format(currentDate, 'EEE, MMM d');

  return (
    <div className="flex flex-col">
      {/* Date nav header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F8EEE5]">
        <button
          onClick={() => setCurrentDate((d) => subDays(d, 1))}
          aria-label="Previous day"
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[#EAE0D5] transition-colors text-[#434E54]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[#434E54]">{dateLabel}</span>
          {!isToday(currentDate) && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-sm font-medium text-[#434E54] px-3 py-1.5 rounded-lg bg-[#EAE0D5]/50 hover:bg-[#EAE0D5] transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setCurrentDate((d) => addDays(d, 1))}
          aria-label="Next day"
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-[#EAE0D5] transition-colors text-[#434E54]"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Groomer filter */}
      {groomerChips.length > 1 && (
        <div className="px-4 pb-2">
          <MobileChipRow
            options={groomerChips}
            value={selectedGroomerId}
            onChange={setSelectedGroomerId}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="px-4 space-y-3 py-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="animate-pulse bg-[#EAE0D5]/30 rounded-xl h-20 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <MobileEmptyState
          title="Failed to load appointments"
          description="Something went wrong. Please try again."
          action={{ label: 'Retry', onClick: fetchData }}
        />
      ) : grouped.length === 0 ? (
        <MobileEmptyState
          title={`No appointments on ${format(currentDate, 'MMM d')}`}
          description="Nothing scheduled for this day."
        />
      ) : (
        <div className="pb-32">
          {grouped.map((group) => (
            <div key={group.hour}>
              {/* Sticky time header */}
              <div
                role="heading"
                aria-level={3}
                className="sticky top-0 z-10 bg-[#F8EEE5]/95 backdrop-blur-sm flex items-center py-2 px-4"
              >
                <span className="text-xs font-semibold text-[#434E54]/50 uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-[#E5E5E5] ml-3" />
              </div>

              {/* Cards */}
              <div className="px-4 space-y-2 pb-2">
                {group.appointments.map((apt, i) => (
                  <MobileAppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={onAppointmentClick}
                    groomerColor={apt.groomer_id ? groomerColorMap[apt.groomer_id] : UNASSIGNED_COLOR}
                    index={i}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
