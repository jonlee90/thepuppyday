'use client';

import { motion } from 'framer-motion';
import { getCalendarEventColor } from '@/lib/admin/appointment-status';
import type { DragState, GroomerColorMap } from '../types';
import { formatAppointmentTime, getHeightFromDuration } from '../utils';
import { UNASSIGNED_COLOR, ANIMATION } from '../constants';

interface DragOverlayProps {
  dragState: DragState;
  groomerColorMap: GroomerColorMap;
}

export function DragOverlay({ dragState, groomerColorMap }: DragOverlayProps) {
  if (!dragState.isDragging || !dragState.appointment) return null;

  const apt = dragState.appointment;
  const statusColor = getCalendarEventColor(apt.status);
  const groomerColor = groomerColorMap[apt.groomer_id || 'unassigned'] || UNASSIGNED_COLOR;
  const height = getHeightFromDuration(apt.duration_minutes);

  const customerName = apt.customer
    ? `${apt.customer.first_name} ${apt.customer.last_name}`
    : 'Unknown';
  const serviceName = apt.service?.name || '';

  return (
    <motion.div
      className="fixed pointer-events-none z-50 rounded-md shadow-lg overflow-hidden"
      style={{
        left: dragState.currentX - dragState.offsetX,
        top: dragState.currentY - dragState.offsetY,
        width: 200,
        height: Math.max(height, 40),
        backgroundColor: statusColor + '30',
        borderLeft: `4px solid ${groomerColor}`,
      }}
      initial={{ scale: 1 }}
      animate={{ scale: 1.05 }}
      transition={{ type: 'spring', ...ANIMATION.dragSpring }}
    >
      <div className="px-2 py-1">
        <div className="text-xs font-semibold text-[#434E54]">
          {formatAppointmentTime(apt.scheduled_at)}
        </div>
        <div className="text-xs text-[#434E54] truncate">{customerName}</div>
        <div className="text-[10px] text-[#6B7280] truncate">{serviceName}</div>
      </div>
    </motion.div>
  );
}
