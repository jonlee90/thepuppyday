/**
 * Customer Dashboard Page
 * Redesigned for clarity and warmth — next appointment hero, pets grid, stats, quick actions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { NextAppointmentCard, UpcomingAppointments, DashboardStatsBar } from '@/components/customer/dashboard';
import { BookAppointmentButton } from '@/components/customer/BookAppointmentButton';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server';
import type { AppointmentStatus } from '@/types/database';

// Fetch dashboard data — parallelized for performance
async function getDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const [petsResult, appointmentsResult, completedCountResult, userResult] = await Promise.all([
      // Pets with breed info
      (supabase as any)
        .from('pets')
        .select('*, breeds(name)')
        .eq('owner_id', userId)
        .eq('is_active', true),

      // Upcoming appointments (next 5)
      (supabase as any)
        .from('appointments')
        .select('*, services(name), pets(name, photo_url)')
        .eq('customer_id', userId)
        .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress'])
        .order('scheduled_at', { ascending: true })
        .limit(5),

      // Total completed visits count
      (supabase as any)
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .eq('status', 'completed'),

      // User record for member since date
      (supabase as any)
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single(),
    ]);

    if (petsResult.error) console.error('[Dashboard] Error fetching pets:', petsResult.error);
    if (appointmentsResult.error) console.error('[Dashboard] Error fetching appointments:', appointmentsResult.error);

    const appointments = appointmentsResult.data || [];

    return {
      pets: petsResult.data || [],
      appointments,
      nextAppointment: appointments[0] || null,
      upcomingRest: appointments.slice(1),
      totalVisits: completedCountResult.count || 0,
      memberSince: userResult.data?.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Dashboard] Unexpected error:', error);
    return {
      pets: [],
      appointments: [],
      nextAppointment: null,
      upcomingRest: [],
      totalVisits: 0,
      memberSince: new Date().toISOString(),
    };
  }
}

function transformAppointment(apt: any) {
  return {
    id: apt.id,
    petName: apt.pets?.name || 'Unknown Pet',
    petPhotoUrl: apt.pets?.photo_url,
    serviceName: apt.services?.name || 'Grooming Service',
    scheduledAt: apt.scheduled_at,
    status: apt.status as AppointmentStatus,
    totalPrice: apt.total_price || 0,
  };
}

function transformAppointments(appointments: any[]) {
  return appointments.map(transformAppointment);
}

// Pets grid — inline component (server-rendered)
function PetsGrid({ pets }: { pets: any[] }) {
  if (pets.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
        <h3 className="font-bold text-[#434E54]">Your Pets</h3>
        <Link href="/pets" className="text-sm text-[#434E54]/60 hover:text-[#434E54] transition-colors">
          View All
        </Link>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {pets.map((pet: any) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#F8EEE5]/50 hover:bg-[#EAE0D5]/50 transition-all hover:shadow-sm group"
          >
            {/* Photo */}
            <div className="w-14 h-14 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-[#434E54]/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 13.5c-2.33 0-7 1.17-7 3.5v1.5h14V17c0-2.33-4.67-3.5-7-3.5zm-3.5-5C7.12 8.5 6 9.62 6 11s1.12 2.5 2.5 2.5S11 12.38 11 11s-1.12-2.5-2.5-2.5zm7 0C14.12 8.5 13 9.62 13 11s1.12 2.5 2.5 2.5S18 12.38 18 11s-1.12-2.5-2.5-2.5zm-3.5-5C10.67 3.5 9.5 4.67 9.5 6S10.67 8.5 12 8.5s2.5-1.17 2.5-2.5S13.33 3.5 12 3.5z" />
                </svg>
              )}
            </div>
            {/* Info */}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#434E54] truncate">{pet.name}</p>
              <p className="text-xs text-[#434E54]/60 truncate">{pet.breeds?.name || pet.breed_custom || 'Mixed breed'}</p>
            </div>
          </Link>
        ))}
        {/* Add pet card */}
        <Link
          href="/pets/new"
          className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-[#434E54]/20 hover:border-[#434E54]/40 text-[#434E54]/50 hover:text-[#434E54]/70 transition-all"
        >
          <div className="w-14 h-14 rounded-full bg-[#434E54]/5 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium">Add Pet</p>
        </Link>
      </div>
    </div>
  );
}

export default async function CustomerDashboard() {
  const userData = await getCurrentUser();

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#434E54] mb-2">Unable to load dashboard</h2>
          <p className="text-[#434E54]/60">Please try refreshing the page or logging in again.</p>
          <a
            href="/login"
            className="mt-4 inline-block px-6 py-2 bg-[#434E54] text-white rounded-lg hover:bg-[#363F44] transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  const data = await getDashboardData(userData.id);
  const firstName = userData.first_name || 'there';

  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-[#434E54]">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-[#434E54]/60 mt-1 text-sm">
          Here&apos;s what&apos;s happening with your furry friends.
        </p>
      </div>

      {/* Stats strip */}
      <DashboardStatsBar
        totalVisits={data.totalVisits}
        petCount={data.pets.length}
        memberSince={data.memberSince}
      />

      {/* Hero: Next appointment */}
      <NextAppointmentCard
        appointment={data.nextAppointment ? transformAppointment(data.nextAppointment) : null}
      />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Pets */}
        <PetsGrid pets={data.pets} />

        {/* Right: Additional upcoming appointments */}
        {data.upcomingRest.length > 0 && (
          <UpcomingAppointments
            appointments={transformAppointments(data.upcomingRest)}
            maxItems={3}
          />
        )}
      </div>

    </div>
  );
}
