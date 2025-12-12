/**
 * Upcoming Appointments widget for dashboard
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AppointmentStatus } from '@/types/database';

interface AppointmentSummary {
  id: string;
  petName: string;
  petPhotoUrl?: string | null;
  serviceName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  totalPrice: number;
}

interface UpcomingAppointmentsProps {
  appointments: AppointmentSummary[];
  maxItems?: number;
}

export function UpcomingAppointments({ appointments, maxItems = 3 }: UpcomingAppointmentsProps) {
  const displayAppointments = appointments.slice(0, maxItems);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#434E54]/10">
          <h3 className="font-bold text-[#434E54]">Upcoming Appointments</h3>
        </div>
        <EmptyState
          icon="calendar"
          title="No Upcoming Appointments"
          description="Book your next grooming session to keep your pup looking great!"
          action={{
            label: 'Book Appointment',
            href: '/book',
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
        <h3 className="font-bold text-[#434E54]">Upcoming Appointments</h3>
        {appointments.length > maxItems && (
          <Link
            href="/appointments"
            className="text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
          >
            View All
          </Link>
        )}
      </div>

      {/* Appointments list */}
      <div className="divide-y divide-[#434E54]/10">
        {displayAppointments.map((appointment, index) => (
          <motion.div
            key={appointment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/appointments/${appointment.id}`}
              className="block p-4 hover:bg-[#EAE0D5]/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Pet avatar */}
                <div className="w-12 h-12 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {appointment.petPhotoUrl ? (
                    <img
                      src={appointment.petPhotoUrl}
                      alt={appointment.petName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-[#434E54]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-[#434E54] truncate">
                      {appointment.petName}
                    </p>
                    <StatusBadge status={appointment.status} size="sm" />
                  </div>
                  <p className="text-sm text-[#434E54]/70 mb-1">
                    {appointment.serviceName}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-[#434E54]/60">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(appointment.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(appointment.scheduledAt)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-[#434E54]/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
