/**
 * Appointments List Page
 * Shows all customer appointments with filtering
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppointmentCardSkeletonList } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppointmentStatus } from '@/types/database';

// Fetch appointments
async function getAppointments(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('*, services(name), pets(name, photo_url)')
    .eq('customer_id', userId)
    .order('scheduled_at', { ascending: false });

  return appointments || [];
}

// Get user info from session
async function getUserInfo() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: userData } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userData;
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

// Group appointments by status
function groupAppointments(appointments: any[]) {
  const now = new Date();
  const upcoming: any[] = [];
  const past: any[] = [];

  appointments.forEach((apt) => {
    const isCompleted = ['completed', 'cancelled', 'no_show'].includes(apt.status);
    const isPast = new Date(apt.scheduled_at) < now;

    if (isCompleted || isPast) {
      past.push(apt);
    } else {
      upcoming.push(apt);
    }
  });

  // Sort upcoming by date ascending, past by date descending
  upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  past.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return { upcoming, past };
}

export default async function AppointmentsPage() {
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const appointments = await getAppointments(userData.id);
  const { upcoming, past } = groupAppointments(appointments);

  return (
    <Suspense fallback={<AppointmentCardSkeletonList count={5} />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#434E54]">Appointments</h1>
            <p className="text-[#434E54]/60 mt-1">
              View and manage your grooming appointments
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                     bg-[#434E54] text-white font-semibold text-sm
                     hover:bg-[#434E54]/90 transition-all duration-200
                     shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Book New
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <EmptyState
              icon="calendar"
              title="No Appointments Yet"
              description="Book your first grooming appointment to get started!"
              action={{
                label: 'Book Appointment',
                href: '/book',
              }}
            />
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            {upcoming.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#434E54]/10">
                  <h2 className="font-bold text-[#434E54]">
                    Upcoming ({upcoming.length})
                  </h2>
                </div>
                <div className="divide-y divide-[#434E54]/10">
                  {upcoming.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {past.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#434E54]/10">
                  <h2 className="font-bold text-[#434E54]">
                    Past ({past.length})
                  </h2>
                </div>
                <div className="divide-y divide-[#434E54]/10">
                  {past.slice(0, 10).map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} isPast />
                  ))}
                  {past.length > 10 && (
                    <div className="px-5 py-4 text-center">
                      <p className="text-sm text-[#434E54]/60">
                        Showing 10 of {past.length} past appointments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Suspense>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment, isPast = false }: { appointment: any; isPast?: boolean }) {
  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className={`block p-4 hover:bg-[#EAE0D5]/30 transition-colors ${isPast ? 'opacity-70' : ''}`}
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
            <p className="font-semibold text-[#434E54]">
              {appointment.pets?.name || 'Unknown Pet'}
            </p>
            <StatusBadge status={appointment.status as AppointmentStatus} size="sm" />
          </div>
          <p className="text-sm text-[#434E54]/70 mb-1">
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
  );
}
