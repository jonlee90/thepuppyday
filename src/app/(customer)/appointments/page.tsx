/**
 * Appointments List Page
 * Shows all customer appointments with filtering
 */

import { Suspense } from 'react';
import { AppointmentCardSkeletonList } from '@/components/ui/skeletons';
import { AppointmentCard } from '@/components/customer/appointments';
import { BookAppointmentButton } from '@/components/customer/BookAppointmentButton';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server';

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
  const userData = await getCurrentUser();

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
          <BookAppointmentButton
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                     bg-[#434E54] text-white font-semibold text-sm
                     hover:bg-[#434E54]/90 transition-all duration-200
                     shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Book New
          </BookAppointmentButton>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <div className="flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-[#EAE0D5] flex items-center justify-center text-[#434E54]/60 mb-6">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#434E54] mb-2">No Appointments Yet</h3>
              <p className="text-base text-[#434E54]/70 max-w-sm mb-6">Book your first grooming appointment to get started!</p>
              <BookAppointmentButton className="px-6 py-3 font-semibold rounded-lg transition-colors bg-[#434E54] text-white hover:bg-[#363F44]">
                Book Appointment
              </BookAppointmentButton>
            </div>
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
                  {upcoming.map((apt, index) => (
                    <AppointmentCard key={apt.id} appointment={apt} index={index} />
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
                  {past.slice(0, 10).map((apt, index) => (
                    <AppointmentCard key={apt.id} appointment={apt} isPast index={index} />
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
