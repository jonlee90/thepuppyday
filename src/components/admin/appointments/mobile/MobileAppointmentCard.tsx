'use client';

import { motion } from 'framer-motion';
import { PawPrint } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { CalendarAppointment, AppointmentStatusType } from '../calendar/types';

export interface MobileAppointmentCardProps {
  appointment: CalendarAppointment;
  onClick: (id: string) => void;
  groomerColor?: string;
  index?: number;
}

export function MobileAppointmentCard({
  appointment,
  onClick,
  groomerColor,
  index = 0,
}: MobileAppointmentCardProps) {
  const petName = appointment.pet?.name ?? 'Unknown Pet';
  const customerName = appointment.customer
    ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
    : 'Unknown Customer';
  const serviceName = appointment.service?.name ?? '';
  const groomerName = appointment.groomer
    ? `${appointment.groomer.first_name} ${appointment.groomer.last_name}`
    : null;
  const apptDate = new Date(appointment.scheduled_at);
  const timeStr = format(apptDate, 'h:mm a');
  const dateStr = format(apptDate, 'MMM d');
  const accentColor = groomerColor ?? '#D4A574';

  const handleClick = () => onClick(appointment.id);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(appointment.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${petName} appointment at ${timeStr}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
      className="flex flex-row bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#434E54]/30"
    >
      {/* Left accent strip */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: accentColor }} />

      {/* Content */}
      <div className="flex-1 px-4 py-3 min-w-0">
        {/* Top row: time + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col flex-shrink-0">
              <span className="text-sm font-medium text-[#434E54]">{timeStr}</span>
              <span className="text-xs text-[#434E54]/50">{dateStr}</span>
            </div>
          <StatusBadge status={appointment.status as AppointmentStatusType} size="sm" />
        </div>

        {/* Pet name */}
        <p className="text-base font-semibold text-[#434E54] truncate mt-1">{petName}</p>

        {/* Customer + service */}
        <p className="text-sm text-[#434E54]/70 truncate">
          {customerName}{serviceName ? ` · ${serviceName}` : ''}
        </p>

        {/* Groomer */}
        {groomerName && (
          <div className="flex items-center gap-1 mt-1">
            <PawPrint className="w-3 h-3 text-[#434E54]/40 flex-shrink-0" />
            <span className="text-xs text-[#434E54]/50 truncate">{groomerName}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
