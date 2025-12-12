/**
 * Appointment Detail Page
 * Shows full details of a single appointment
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppointmentStatus } from '@/types/database';

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>;
}

// Fetch appointment details
async function getAppointment(appointmentId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: appointment } = await (supabase as any)
    .from('appointments')
    .select('*, services(name, description, duration_minutes), pets(id, name, photo_url, breed_name, weight_lbs, size)')
    .eq('id', appointmentId)
    .eq('customer_id', userId)
    .single();

  return appointment;
}

// Fetch appointment addons
async function getAppointmentAddons(appointmentId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: addons } = await (supabase as any)
    .from('appointment_addons')
    .select('*, addons(name, description)')
    .eq('appointment_id', appointmentId);

  return addons || [];
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

// Check if appointment can be cancelled
function canCancel(appointment: any) {
  const status = appointment.status as AppointmentStatus;
  const scheduledAt = new Date(appointment.scheduled_at);
  const now = new Date();
  const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Can cancel if: status allows it AND more than 24 hours away
  return ['pending', 'confirmed'].includes(status) && hoursUntil > 24;
}

// Check if appointment can be rescheduled
function canReschedule(appointment: any) {
  const status = appointment.status as AppointmentStatus;
  const scheduledAt = new Date(appointment.scheduled_at);
  const now = new Date();
  const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  return ['pending', 'confirmed'].includes(status) && hoursUntil > 24;
}

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const resolvedParams = await params;
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const appointment = await getAppointment(resolvedParams.id, userData.id);

  if (!appointment) {
    notFound();
  }

  const addons = await getAppointmentAddons(resolvedParams.id);
  const showActions = canCancel(appointment) || canReschedule(appointment);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/appointments"
          className="inline-flex items-center gap-2 text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Appointments
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Pet avatar */}
                <div className="w-16 h-16 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden">
                  {appointment.pets?.photo_url ? (
                    <img
                      src={appointment.pets.photo_url}
                      alt={appointment.pets?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-[#434E54]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#434E54]">
                    {appointment.services?.name || 'Grooming Appointment'}
                  </h1>
                  <p className="text-[#434E54]/60 mt-1">
                    for {appointment.pets?.name || 'Unknown Pet'}
                  </p>
                </div>
              </div>
              <StatusBadge status={appointment.status as AppointmentStatus} />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date & Time */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Date & Time</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#434E54]">
                    {formatDate(appointment.scheduled_at)}
                  </p>
                  <p className="text-[#434E54]/60">
                    {formatTime(appointment.scheduled_at)}
                    {appointment.services?.duration_minutes && (
                      <span> • {appointment.services.duration_minutes} min</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Service Details</h2>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#434E54]">
                      {appointment.services?.name}
                    </p>
                    {appointment.services?.description && (
                      <p className="text-sm text-[#434E54]/60 mt-1">
                        {appointment.services.description}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-[#434E54]">
                    ${appointment.base_price || 0}
                  </p>
                </div>

                {/* Addons */}
                {addons.length > 0 && (
                  <>
                    <div className="border-t border-[#434E54]/10 pt-4">
                      <p className="text-sm font-medium text-[#434E54]/70 mb-3">Add-ons</p>
                      {addons.map((addon: any) => (
                        <div key={addon.id} className="flex items-center justify-between py-2">
                          <p className="text-[#434E54]">{addon.addons?.name}</p>
                          <p className="text-[#434E54]">${addon.price}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Total */}
                <div className="border-t border-[#434E54]/10 pt-4 flex items-center justify-between">
                  <p className="font-bold text-[#434E54]">Total</p>
                  <p className="font-bold text-lg text-[#434E54]">
                    ${appointment.total_price || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
                <h2 className="font-bold text-[#434E54] mb-4">Notes</h2>
                <p className="text-[#434E54]/80">{appointment.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pet Info */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Pet</h2>
              <Link
                href={`/pets/${appointment.pets?.id}`}
                className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-[#EAE0D5]/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden">
                  {appointment.pets?.photo_url ? (
                    <img
                      src={appointment.pets.photo_url}
                      alt={appointment.pets?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-[#434E54]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#434E54]">{appointment.pets?.name}</p>
                  <p className="text-sm text-[#434E54]/60">
                    {appointment.pets?.breed_name}
                    {appointment.pets?.weight_lbs && ` • ${appointment.pets.weight_lbs} lbs`}
                  </p>
                </div>
                <svg className="w-5 h-5 text-[#434E54]/40 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
                <h2 className="font-bold text-[#434E54] mb-4">Actions</h2>
                <div className="space-y-3">
                  {canReschedule(appointment) && (
                    <Link
                      href={`/book?reschedule=${appointment.id}`}
                      className="block w-full text-center py-2.5 px-4 rounded-lg
                               bg-[#EAE0D5] text-[#434E54] font-semibold text-sm
                               hover:bg-[#EAE0D5]/70 transition-colors"
                    >
                      Reschedule
                    </Link>
                  )}
                  {canCancel(appointment) && (
                    <button
                      className="block w-full text-center py-2.5 px-4 rounded-lg
                               border border-red-200 text-red-600 font-semibold text-sm
                               hover:bg-red-50 transition-colors"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#434E54]/50 mt-3">
                  Cancellations must be made at least 24 hours in advance.
                </p>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Location</h2>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#434E54]/60 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-[#434E54]">Puppy Day</p>
                  <p className="text-sm text-[#434E54]/60">
                    14936 Leffingwell Rd<br />
                    La Mirada, CA 90638
                  </p>
                  <a
                    href="https://maps.google.com/?q=14936+Leffingwell+Rd+La+Mirada+CA+90638"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#434E54] font-medium hover:underline mt-2 inline-block"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
