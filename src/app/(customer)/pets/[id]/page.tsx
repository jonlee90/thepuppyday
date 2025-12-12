/**
 * Pet Detail Page
 * Shows full details of a single pet with edit/delete options
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface PetDetailPageProps {
  params: Promise<{ id: string }>;
}

// Fetch pet details
async function getPet(petId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: pet } = await (supabase as any)
    .from('pets')
    .select('*')
    .eq('id', petId)
    .eq('owner_id', userId)
    .single();

  return pet;
}

// Fetch pet's recent appointments
async function getPetAppointments(petId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select('*, services(name)')
    .eq('pet_id', petId)
    .order('scheduled_at', { ascending: false })
    .limit(5);

  return appointments || [];
}

// Fetch pet's report cards
async function getPetReportCards(petId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: reportCards } = await (supabase as any)
    .from('report_cards')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false })
    .limit(3);

  return reportCards || [];
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
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Size to label mapping
const sizeLabels: Record<string, string> = {
  small: 'Small (0-18 lbs)',
  medium: 'Medium (19-35 lbs)',
  large: 'Large (36-65 lbs)',
  xlarge: 'X-Large (66+ lbs)',
};

export default async function PetDetailPage({ params }: PetDetailPageProps) {
  const resolvedParams = await params;
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const pet = await getPet(resolvedParams.id, userData.id);

  if (!pet) {
    notFound();
  }

  const [appointments, reportCards] = await Promise.all([
    getPetAppointments(resolvedParams.id),
    getPetReportCards(resolvedParams.id),
  ]);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/pets"
          className="inline-flex items-center gap-2 text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pets
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
          <div className="md:flex">
            {/* Pet image */}
            <div className="md:w-1/3 aspect-square md:aspect-auto bg-[#EAE0D5]">
              {pet.photo_url ? (
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                  <svg className="w-32 h-32 text-[#434E54]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                    <circle cx="9" cy="11" r="1" fill="currentColor" />
                    <circle cx="15" cy="11" r="1" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 15h4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Pet info */}
            <div className="p-6 md:flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#434E54]">{pet.name}</h1>
                  <p className="text-[#434E54]/60 mt-1">
                    {pet.breed_name || 'Breed not specified'}
                  </p>
                </div>
                <Link
                  href={`/pets/${pet.id}/edit`}
                  className="px-4 py-2 rounded-lg bg-[#EAE0D5] text-[#434E54] font-semibold text-sm
                           hover:bg-[#EAE0D5]/70 transition-colors"
                >
                  Edit
                </Link>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                {pet.weight_lbs && (
                  <div>
                    <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Weight</p>
                    <p className="font-semibold text-[#434E54]">{pet.weight_lbs} lbs</p>
                  </div>
                )}
                {pet.size && (
                  <div>
                    <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Size</p>
                    <p className="font-semibold text-[#434E54] capitalize">{pet.size}</p>
                  </div>
                )}
                {pet.gender && (
                  <div>
                    <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Gender</p>
                    <p className="font-semibold text-[#434E54] capitalize">{pet.gender}</p>
                  </div>
                )}
                {pet.birthday && (
                  <div>
                    <p className="text-xs text-[#434E54]/50 uppercase tracking-wide mb-1">Birthday</p>
                    <p className="font-semibold text-[#434E54]">{formatDate(pet.birthday)}</p>
                  </div>
                )}
              </div>

              {/* Quick action */}
              <div className="mt-6 pt-6 border-t border-[#434E54]/10">
                <Link
                  href={`/book?pet=${pet.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                           bg-[#434E54] text-white font-semibold text-sm
                           hover:bg-[#434E54]/90 transition-all duration-200
                           shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grooming Notes */}
          {pet.grooming_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Grooming Notes</h2>
              <p className="text-[#434E54]/80">{pet.grooming_notes}</p>
            </div>
          )}

          {/* Medical Notes */}
          {pet.medical_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-6">
              <h2 className="font-bold text-[#434E54] mb-4">Medical Notes</h2>
              <p className="text-[#434E54]/80">{pet.medical_notes}</p>
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
            <h2 className="font-bold text-[#434E54]">Recent Appointments</h2>
            <Link
              href={`/appointments?pet=${pet.id}`}
              className="text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
            >
              View All
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#434E54]/60">No appointments yet</p>
              <Link
                href={`/book?pet=${pet.id}`}
                className="text-[#434E54] font-medium hover:underline mt-2 inline-block"
              >
                Book first appointment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#434E54]/10">
              {appointments.map((apt: any) => (
                <Link
                  key={apt.id}
                  href={`/appointments/${apt.id}`}
                  className="block px-5 py-4 hover:bg-[#EAE0D5]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#434E54]">
                        {apt.services?.name || 'Grooming'}
                      </p>
                      <p className="text-sm text-[#434E54]/60">
                        {formatDate(apt.scheduled_at)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize
                      ${apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-[#EAE0D5] text-[#434E54]'
                      }
                    `}>
                      {apt.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Report Cards */}
        {reportCards.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
              <h2 className="font-bold text-[#434E54]">Report Cards</h2>
              <Link
                href={`/report-cards?pet=${pet.id}`}
                className="text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportCards.map((card: any) => (
                <Link
                  key={card.id}
                  href={`/report-cards/${card.id}`}
                  className="block p-4 rounded-lg bg-[#EAE0D5]/30 hover:bg-[#EAE0D5]/50 transition-colors"
                >
                  <p className="font-semibold text-[#434E54] mb-1">
                    {formatDate(card.created_at)}
                  </p>
                  <div className="flex items-center gap-1 text-[#434E54]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= (card.overall_rating || 0) ? 'fill-current' : 'text-[#434E54]/30'}`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
