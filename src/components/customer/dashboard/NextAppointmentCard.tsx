/**
 * Hero card showing the customer's next upcoming appointment.
 * Prominently displays pet, service, countdown, and status.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookingModal } from '@/hooks/useBookingModal';
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

interface NextAppointmentCardProps {
  appointment: AppointmentSummary | null;
}

function getCountdownLabel(scheduledAt: string): string {
  const now = new Date();
  const apptDate = new Date(scheduledAt);
  const diffMs = apptDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays <= 0) return 'Today!';
  if (diffDays === 1) return 'Tomorrow!';
  return `In ${diffDays} days`;
}

function formatDateNice(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeNice(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function PetAvatar({ petPhotoUrl, petName }: { petPhotoUrl?: string | null; petName: string }) {
  return (
    <div className="w-20 h-20 rounded-full border-4 border-white/40 shadow-lg overflow-hidden bg-amber-200/40 flex items-center justify-center flex-shrink-0">
      {petPhotoUrl ? (
        <img src={petPhotoUrl} alt={petName} className="w-full h-full object-cover" />
      ) : (
        /* Paw silhouette */
        <svg className="w-10 h-10 text-white/70" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 13.5c-2.33 0-7 1.17-7 3.5v1.5h14V17c0-2.33-4.67-3.5-7-3.5zm-3.5-5C7.12 8.5 6 9.62 6 11s1.12 2.5 2.5 2.5S11 12.38 11 11s-1.12-2.5-2.5-2.5zm7 0C14.12 8.5 13 9.62 13 11s1.12 2.5 2.5 2.5S18 12.38 18 11s-1.12-2.5-2.5-2.5zm-3.5-5C10.67 3.5 9.5 4.67 9.5 6S10.67 8.5 12 8.5s2.5-1.17 2.5-2.5S13.33 3.5 12 3.5z" />
        </svg>
      )}
    </div>
  );
}

export function NextAppointmentCard({ appointment }: NextAppointmentCardProps) {
  const { open: openBookingModal } = useBookingModal();

  if (!appointment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl overflow-hidden shadow-md bg-white border border-[#434E54]/8"
      >
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
          {/* Decorative paw */}
          <div className="w-16 h-16 rounded-full bg-[#EAE0D5]/60 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#434E54]/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 13.5c-2.33 0-7 1.17-7 3.5v1.5h14V17c0-2.33-4.67-3.5-7-3.5zm-3.5-5C7.12 8.5 6 9.62 6 11s1.12 2.5 2.5 2.5S11 12.38 11 11s-1.12-2.5-2.5-2.5zm7 0C14.12 8.5 13 9.62 13 11s1.12 2.5 2.5 2.5S18 12.38 18 11s-1.12-2.5-2.5-2.5zm-3.5-5C10.67 3.5 9.5 4.67 9.5 6S10.67 8.5 12 8.5s2.5-1.17 2.5-2.5S13.33 3.5 12 3.5z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#434E54] text-lg">No upcoming appointments</p>
            <p className="text-[#434E54]/60 text-sm mt-1">Keep your pup fresh and fluffy!</p>
          </div>
          <button
            onClick={() => openBookingModal({ mode: 'customer' })}
            className="px-6 py-2.5 bg-[#434E54] text-white rounded-xl font-semibold text-sm hover:bg-[#363F44] transition-colors shadow-sm"
          >
            Book Now
          </button>
        </div>
      </motion.div>
    );
  }

  const countdownLabel = getCountdownLabel(appointment.scheduledAt);
  const isToday = countdownLabel === 'Today!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden shadow-md"
    >
      <div className="flex flex-col sm:flex-row min-h-[160px]">
        {/* Left panel — amber gradient with pet info */}
        <div
          className="sm:w-2/5 flex flex-col items-center justify-center gap-3 px-6 py-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' }}
        >
          {/* Decorative dot pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }} />
          <PetAvatar petPhotoUrl={appointment.petPhotoUrl} petName={appointment.petName} />
          <div className="text-center relative z-10">
            <p className="text-white font-bold text-lg leading-tight">{appointment.petName}</p>
            <p className="text-amber-100/80 text-sm mt-0.5">{appointment.serviceName}</p>
            {/* Paw accent */}
            <div className="flex justify-center gap-1 mt-2 opacity-40">
              {['·', '🐾', '·'].map((s, i) => (
                <span key={i} className="text-white text-xs">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — white, appointment details */}
        <div className="flex-1 bg-white px-6 py-6 flex flex-col justify-center gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#434E54]/50 uppercase">
              Your Next Appointment
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isToday ? 'text-amber-600' : 'text-[#434E54]'}`}>
              {countdownLabel}
            </span>
          </div>

          {/* Date + time */}
          <div className="flex flex-col gap-1 text-sm text-[#434E54]/70">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateNice(appointment.scheduledAt)} · {formatTimeNice(appointment.scheduledAt)}
            </span>
          </div>

          {/* Status + link */}
          <div className="flex items-center justify-between pt-1">
            <StatusBadge status={appointment.status} size="sm" />
            <Link
              href={`/appointments/${appointment.id}`}
              className="text-sm font-semibold text-[#434E54]/70 hover:text-[#434E54] transition-colors flex items-center gap-1"
            >
              View Details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
