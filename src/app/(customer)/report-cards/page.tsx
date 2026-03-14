/**
 * Report Cards List Page
 * Shows all grooming report cards for customer's pets
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { BookAppointmentButton } from '@/components/customer/BookAppointmentButton';
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server';

// Fetch report cards with appointment and pet info
async function getReportCards(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get report cards through appointments (customer's appointments only)
  const { data: reportCards } = await (supabase as any)
    .from('report_cards')
    .select(`
      *,
      appointments!inner(
        id,
        customer_id,
        pets(id, name, photo_url)
      )
    `)
    .eq('appointments.customer_id', userId)
    .order('created_at', { ascending: false });

  return reportCards || [];
}


// Format date for display
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Mood to label/emoji mapping
const moodLabels: Record<string, { label: string; emoji: string }> = {
  happy:     { label: 'Happy',     emoji: '😄' },
  calm:      { label: 'Calm',      emoji: '😌' },
  energetic: { label: 'Energetic', emoji: '⚡' },
  nervous:   { label: 'Nervous',   emoji: '😟' },
};

export default async function ReportCardsPage() {
  const userData = await getCurrentUser();

  if (!userData) {
    return null;
  }

  const reportCards = await getReportCards(userData.id);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#434E54]">Report Cards</h1>
          <p className="text-[#434E54]/60 mt-1">
            See how your pets did during their grooming sessions
          </p>
        </div>

        {reportCards.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <div className="flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-[#EAE0D5] flex items-center justify-center text-[#434E54]/60 mb-6">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#434E54] mb-2">No Report Cards Yet</h3>
              <p className="text-base text-[#434E54]/70 max-w-sm mb-6">{"Report cards will appear here after your pet's grooming appointments!"}</p>
              <BookAppointmentButton className="px-6 py-3 font-semibold rounded-lg transition-colors bg-[#434E54] text-white hover:bg-[#363F44]">
                Book Appointment
              </BookAppointmentButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCards.map((card: any) => (
              <ReportCard key={card.id} reportCard={card} />
            ))}
          </div>
        )}
      </div>
    </Suspense>
  );
}

// Report Card Component
function ReportCard({ reportCard }: { reportCard: any }) {
  return (
    <Link
      href={`/report-cards/${reportCard.id}`}
      className="block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden
               hover:shadow-md transition-all duration-200"
    >
      {/* Before/After Images */}
      <div className="grid grid-cols-2 gap-1">
        <div className="aspect-square bg-[#EAE0D5] relative">
          {reportCard.before_photo_url ? (
            <img
              src={reportCard.before_photo_url}
              alt="Before"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-[#434E54]/40">Before</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/50 text-white px-2 py-0.5 rounded">
            Before
          </span>
        </div>
        <div className="aspect-square bg-[#EAE0D5] relative">
          {reportCard.after_photo_url ? (
            <img
              src={reportCard.after_photo_url}
              alt="After"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs text-[#434E54]/40">After</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/50 text-white px-2 py-0.5 rounded">
            After
          </span>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4">
        {/* Pet name and date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EAE0D5] overflow-hidden flex-shrink-0">
              {reportCard.appointments?.pets?.photo_url ? (
                <img
                  src={reportCard.appointments.pets.photo_url}
                  alt={reportCard.appointments?.pets?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#434E54]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c-1.5 0-3 .5-4 1.5l-2 2c-.5.5-1 1.5-1 2.5v5c0 1 .5 2 1.5 2.5l1.5 1 1-2h6l1 2 1.5-1c1-.5 1.5-1.5 1.5-2.5v-5c0-1-.5-2-1-2.5l-2-2c-1-1-2.5-1.5-4-1.5z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="font-semibold text-[#434E54]">
              {reportCard.appointments?.pets?.name || 'Unknown'}
            </span>
          </div>
          <span className="text-xs text-[#434E54]/50">
            {formatDate(reportCard.created_at)}
          </span>
        </div>

        {/* Mood */}
        {reportCard.mood && moodLabels[reportCard.mood] && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-[#434E54]/70">
              <span>{moodLabels[reportCard.mood].emoji}</span>
              <span>{moodLabels[reportCard.mood].label}</span>
            </span>
          </div>
        )}

        {/* Preview of notes */}
        {reportCard.groomer_notes && (
          <p className="text-sm text-[#434E54]/70 line-clamp-2">
            {reportCard.groomer_notes}
          </p>
        )}
      </div>
    </Link>
  );
}
