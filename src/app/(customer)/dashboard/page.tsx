/**
 * Customer Dashboard Page
 * Shows upcoming appointments, loyalty status, quick actions, and membership info
 */

import { Suspense } from 'react';
import { UpcomingAppointments, QuickActions, MembershipStatus } from '@/components/customer/dashboard';
import { LoyaltyPunchCard } from '@/components/customer/loyalty';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppointmentStatus } from '@/types/database';

// Fetch dashboard data
async function getDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    // Get user's pets
    const { data: pets, error: petsError } = await (supabase as any)
      .from('pets')
      .select('*')
      .eq('owner_id', userId);

    if (petsError) {
      console.error('[Dashboard] Error fetching pets:', petsError);
    }

    // Get upcoming appointments
    const { data: appointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('*, services(name), pets(name, photo_url)')
      .eq('customer_id', userId)
      .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress'])
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (appointmentsError) {
      console.error('[Dashboard] Error fetching appointments:', appointmentsError);
    }

    // Get loyalty data (may not exist yet)
    const { data: loyaltyData, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', userId)
      .single();

    if (loyaltyError && loyaltyError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('[Dashboard] Error fetching loyalty data:', loyaltyError);
    }

    // Get loyalty settings (may not exist yet)
    const { data: loyaltySettings, error: loyaltySettingsError } = await (supabase as any)
      .from('loyalty_settings')
      .select('*')
      .single();

    if (loyaltySettingsError && loyaltySettingsError.code !== 'PGRST116') {
      console.error('[Dashboard] Error fetching loyalty settings:', loyaltySettingsError);
    }

    // Get loyalty punches (may not exist yet)
    // Join through customer_loyalty to filter by customer_id
    const { data: loyaltyPunches, error: loyaltyPunchesError } = await (supabase as any)
      .from('loyalty_punches')
      .select('*, customer_loyalty!inner(customer_id)')
      .eq('customer_loyalty.customer_id', userId)
      .order('created_at', { ascending: true });

    if (loyaltyPunchesError && loyaltyPunchesError.code !== '42P01') {
      // 42P01 = table does not exist
      console.error('[Dashboard] Error fetching loyalty punches:', loyaltyPunchesError);
    }

    // Get membership (may not exist yet)
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('customer_memberships')
      .select('*, memberships(*)')
      .eq('customer_id', userId)
      .eq('status', 'active')
      .single();

    if (membershipError && membershipError.code !== 'PGRST116' && membershipError.code !== '42P01') {
      console.error('[Dashboard] Error fetching membership:', membershipError);
    }

    return {
      pets: pets || [],
      appointments: appointments || [],
      loyalty: loyaltyData || null,
      loyaltySettings: loyaltySettings || null,
      loyaltyPunches: loyaltyPunches || [],
      membership: membership || null,
    };
  } catch (error) {
    console.error('[Dashboard] Unexpected error fetching dashboard data:', error);
    // Return empty data instead of crashing
    return {
      pets: [],
      appointments: [],
      loyalty: null,
      loyaltySettings: null,
      loyaltyPunches: [],
      membership: null,
    };
  }
}

// Get user info from session
async function getUserInfo() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Dashboard] Error getting session:', sessionError);
      return null;
    }

    if (!session?.user) {
      console.log('[Dashboard] No active session found');
      return null;
    }

    console.log('[Dashboard] Session found for user:', session.user.id);

    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('[Dashboard] Error fetching user data:', userError);
      return null;
    }

    console.log('[Dashboard] User data fetched successfully');
    return userData;
  } catch (error) {
    console.error('[Dashboard] Unexpected error in getUserInfo:', error);
    return null;
  }
}

// Transform appointments for the widget
function transformAppointments(appointments: any[]) {
  return appointments.map((apt) => ({
    id: apt.id,
    petName: apt.pets?.name || 'Unknown Pet',
    petPhotoUrl: apt.pets?.photo_url,
    serviceName: apt.services?.name || 'Grooming Service',
    scheduledAt: apt.scheduled_at,
    status: apt.status as AppointmentStatus,
    totalPrice: apt.total_price || 0,
  }));
}

// Transform loyalty punches
function transformPunches(punches: any[]) {
  return punches.map((punch) => ({
    punchNumber: punch.punch_number,
    date: punch.created_at,
    serviceName: punch.service_name,
  }));
}

export default async function CustomerDashboard() {
  const userData = await getUserInfo();

  if (!userData) {
    // Show error message instead of null
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#434E54] mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-[#434E54]/60">
            Please try refreshing the page or logging in again.
          </p>
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

  // Calculate loyalty info
  const threshold = data.loyalty?.threshold_override || data.loyaltySettings?.default_threshold || 9;
  const currentPunches = data.loyalty?.current_punches || 0;
  const freeWashesAvailable = (data.loyalty?.free_washes_earned || 0) - (data.loyalty?.free_washes_redeemed || 0);
  const isCloseToGoal = threshold - currentPunches <= 2;

  // Transform membership data if exists
  const membershipData = data.membership ? {
    planName: data.membership.memberships?.name || 'Membership',
    status: data.membership.status as 'active' | 'paused' | 'cancelled' | 'expired',
    currentPeriodEnd: data.membership.current_period_end,
    groomsRemaining: data.membership.grooms_remaining,
    groomsPerPeriod: data.membership.memberships?.grooms_per_period,
    monthlyPrice: data.membership.memberships?.monthly_price || 0,
    benefits: [
      { label: 'Discounted grooming', included: true },
      { label: 'Priority booking', included: true },
      { label: 'Free nail trims', included: true },
      { label: 'Members-only promotions', included: true },
    ],
  } : null;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#434E54]">
            Welcome back, {firstName}!
          </h1>
          <p className="text-[#434E54]/60 mt-1">
            Here&apos;s what&apos;s happening with your furry friends.
          </p>
        </div>

        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming appointments */}
            <UpcomingAppointments
              appointments={transformAppointments(data.appointments)}
              maxItems={3}
            />

            {/* Quick actions */}
            <QuickActions />
          </div>

          {/* Right column - Sidebar widgets */}
          <div className="space-y-6">
            {/* Loyalty punch card */}
            <LoyaltyPunchCard
              currentPunches={currentPunches}
              threshold={threshold}
              freeWashesAvailable={freeWashesAvailable}
              isCloseToGoal={isCloseToGoal}
              punches={transformPunches(data.loyaltyPunches)}
              compact
            />

            {/* Membership status */}
            <MembershipStatus membership={membershipData} />
          </div>
        </div>

        {/* Pet quick stats (if they have pets) */}
        {data.pets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
              <h3 className="font-bold text-[#434E54]">Your Pets</h3>
              <a
                href="/pets"
                className="text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
              >
                View All
              </a>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {data.pets.slice(0, 4).map((pet: any) => (
                  <a
                    key={pet.id}
                    href={`/pets/${pet.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#EAE0D5]/30 hover:bg-[#EAE0D5]/50 transition-colors min-w-[140px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {pet.photo_url ? (
                        <img
                          src={pet.photo_url}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-[#434E54]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#434E54]">{pet.name}</p>
                      <p className="text-xs text-[#434E54]/60">{pet.breed_name || 'Pet'}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
