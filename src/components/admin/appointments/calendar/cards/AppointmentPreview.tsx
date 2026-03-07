'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getCalendarEventColor, getStatusLabel } from '@/lib/admin/appointment-status';
import type { CalendarAppointment, GroomerColorMap } from '../types';
import { formatAppointmentTime, formatAppointmentEndTime, getGroomerDisplayName } from '../utils';
import { UNASSIGNED_COLOR } from '../constants';
import { Clock, User, PawPrint, Scissors } from 'lucide-react';

interface AppointmentPreviewProps {
  appointment: CalendarAppointment | null;
  position: { x: number; y: number } | null;
  groomerColorMap: GroomerColorMap;
}

export function AppointmentPreview({ appointment, position, groomerColorMap }: AppointmentPreviewProps) {
  return (
    <AnimatePresence>
      {appointment && position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 w-72 bg-white rounded-xl shadow-xl border border-[#E5E7EB] overflow-hidden pointer-events-none"
          style={{
            left: Math.min(position.x + 12, window.innerWidth - 300),
            top: Math.min(position.y - 20, window.innerHeight - 300),
          }}
        >
          {/* Status bar */}
          <div
            className="h-1.5"
            style={{ backgroundColor: getCalendarEventColor(appointment.status) }}
          />

          <div className="p-3 space-y-2.5">
            {/* Time & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#434E54]">
                <Clock className="w-3.5 h-3.5" />
                {formatAppointmentTime(appointment.scheduled_at)} -{' '}
                {formatAppointmentEndTime(appointment.scheduled_at, appointment.duration_minutes)}
              </div>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: getCalendarEventColor(appointment.status) }}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#6B7280]" />
              <div>
                <div className="text-sm font-medium text-[#434E54]">
                  {appointment.customer
                    ? `${appointment.customer.first_name} ${appointment.customer.last_name}`
                    : 'Unknown Customer'}
                </div>
                {appointment.customer?.phone && (
                  <div className="text-[10px] text-[#6B7280]">{appointment.customer.phone}</div>
                )}
              </div>
            </div>

            {/* Pet */}
            <div className="flex items-center gap-2">
              <PawPrint className="w-3.5 h-3.5 text-[#6B7280]" />
              <div className="text-sm text-[#434E54]">
                {appointment.pet?.name || 'Unknown Pet'}
                {appointment.pet?.breed && (
                  <span className="text-[#6B7280]"> ({appointment.pet.breed})</span>
                )}
              </div>
            </div>

            {/* Service & Groomer */}
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-[#6B7280]" />
              <div className="text-sm text-[#434E54]">
                {appointment.service?.name || 'Unknown Service'}
              </div>
            </div>

            {/* Groomer */}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    groomerColorMap[appointment.groomer_id || 'unassigned'] || UNASSIGNED_COLOR,
                }}
              />
              <span className="text-xs text-[#6B7280]">
                {getGroomerDisplayName(appointment.groomer)}
              </span>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="text-[10px] text-[#6B7280] bg-[#F9FAFB] rounded p-2 line-clamp-2">
                {appointment.notes}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
