'use client';

import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { CalendarAppointment, GroomerColorMap } from '../types';
import { formatAppointmentTime } from '../utils';
import { UNASSIGNED_COLOR } from '../constants';

interface AppointmentChipProps {
  appointment: CalendarAppointment;
  groomerColorMap: GroomerColorMap;
  onClick: (appointmentId: string) => void;
}

export function AppointmentChip({ appointment, groomerColorMap, onClick }: AppointmentChipProps) {
  const statusColor = getCalendarEventColor(appointment.status);
  const groomerColor = groomerColorMap[appointment.groomer_id || 'unassigned'] || UNASSIGNED_COLOR;
  const time = formatAppointmentTime(appointment.scheduled_at);
  const customerName = appointment.customer
    ? `${appointment.customer.first_name}`
    : 'Unknown';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(appointment.id);
      }}
      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate flex items-center gap-1 hover:brightness-90 transition-all min-h-[22px]"
      style={{
        backgroundColor: statusColor + '20',
        borderLeft: `3px solid ${groomerColor}`,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      <span className="text-[#434E54] font-medium truncate">
        {time} {customerName}
      </span>
    </button>
  );
}
