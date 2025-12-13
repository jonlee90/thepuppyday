/**
 * Appointment Card Component
 * Displays appointment summary in list view
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { AppointmentStatus } from '@/types/database';

interface AppointmentCardProps {
  appointment: {
    id: string;
    scheduled_at: string;
    status: string;
    total_price?: number;
    pets?: {
      name: string;
      photo_url?: string | null;
    } | null;
    services?: {
      name: string;
    } | null;
  };
  isPast?: boolean;
  index?: number;
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Format time for display
function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function AppointmentCard({ appointment, isPast = false, index = 0 }: AppointmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/appointments/${appointment.id}`}
        className={`
          block p-4 hover:bg-[#EAE0D5]/30 transition-all duration-200
          hover:shadow-sm
          ${isPast ? 'opacity-70 hover:opacity-90' : ''}
        `}
      >
        <div className="flex items-center gap-4">
          {/* Pet avatar */}
          <div className="w-14 h-14 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {appointment.pets?.photo_url ? (
              <img
                src={appointment.pets.photo_url}
                alt={appointment.pets?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-7 h-7 text-[#434E54]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
              </svg>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-semibold text-[#434E54] truncate">
                {appointment.pets?.name || 'Unknown Pet'}
              </p>
              <StatusBadge status={appointment.status as AppointmentStatus} size="sm" />
            </div>
            <p className="text-sm text-[#434E54]/70 mb-1 truncate">
              {appointment.services?.name || 'Grooming Service'}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#434E54]/60">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(appointment.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(appointment.scheduled_at)}
              </span>
              {appointment.total_price && (
                <span className="font-medium">${appointment.total_price}</span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <svg className="w-5 h-5 text-[#434E54]/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
