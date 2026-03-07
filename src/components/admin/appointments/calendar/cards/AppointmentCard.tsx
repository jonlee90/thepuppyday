'use client';

import { motion } from 'framer-motion';
import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { CalendarAppointment, GroomerColorMap } from '../types';
import { getPositionFromTime, getHeightFromDuration, formatAppointmentTime } from '../utils';
import { UNASSIGNED_COLOR, ANIMATION } from '../constants';

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  groomerColorMap: GroomerColorMap;
  onClick: (appointmentId: string) => void;
  onDragStart?: (e: React.PointerEvent, appointment: CalendarAppointment) => void;
  onMouseEnter?: (e: React.MouseEvent, appointment: CalendarAppointment) => void;
  onMouseLeave?: () => void;
  isDragging?: boolean;
}

export function AppointmentCard({
  appointment,
  groomerColorMap,
  onClick,
  onDragStart,
  onMouseEnter,
  onMouseLeave,
  isDragging = false,
}: AppointmentCardProps) {
  const scheduledDate = new Date(appointment.scheduled_at);
  const top = getPositionFromTime(scheduledDate);
  const height = getHeightFromDuration(appointment.duration_minutes);
  const statusColor = getCalendarEventColor(appointment.status);
  const groomerColor = groomerColorMap[appointment.groomer_id || 'unassigned'] || UNASSIGNED_COLOR;
  const minHeight = 30; // Minimum visible height

  const customerName = appointment.customer
    ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
    : 'Unknown';
  const petName = appointment.pet?.name || '';
  const serviceName = appointment.service?.name || '';
  const timeLabel = formatAppointmentTime(appointment.scheduled_at);

  const isCompact = height < 60;

  return (
    <motion.div
      layoutId={`appointment-${appointment.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      transition={{ duration: ANIMATION.cardAppear.duration }}
      className={`absolute left-1 right-1 rounded-md cursor-pointer overflow-hidden select-none ${
        isDragging ? 'opacity-40' : 'hover:brightness-95'
      }`}
      style={{
        top,
        height: Math.max(height, minHeight),
        backgroundColor: statusColor + '20', // 12% opacity tint
        borderLeft: `4px solid ${groomerColor}`,
        zIndex: isDragging ? 5 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(appointment.id);
      }}
      onPointerDown={(e) => onDragStart?.(e, appointment)}
      onMouseEnter={(e) => onMouseEnter?.(e, appointment)}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-2 py-1 h-full flex flex-col justify-center">
        {isCompact ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-xs font-medium text-[#434E54] truncate">
              {timeLabel} {customerName}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-xs font-semibold text-[#434E54] truncate">
                {timeLabel}
              </span>
            </div>
            <span className="text-xs text-[#434E54] truncate mt-0.5 font-medium">
              {customerName}{petName ? ` - ${petName}` : ''}
            </span>
            {height >= 80 && (
              <span className="text-[10px] text-[#6B7280] truncate mt-0.5">
                {serviceName}
              </span>
            )}
          </>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-black/5 transition-colors"
        onPointerDown={(e) => {
          e.stopPropagation();
          // Resize handled by parent drag system
        }}
      />
    </motion.div>
  );
}
