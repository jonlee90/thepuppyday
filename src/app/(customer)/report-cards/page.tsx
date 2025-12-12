/**
 * Report Cards List Page
 * Shows all grooming report cards for customer's pets
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

// Rating to emoji mapping
const ratingEmojis: Record<number, string> = {
  1: 'Needs Work',
  2: 'Getting Better',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export default async function ReportCardsPage() {
  const userData = await getUserInfo();

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
            <EmptyState
              icon="file"
              title="No Report Cards Yet"
              description="Report cards will appear here after your pet's grooming appointments!"
              action={{
                label: 'Book Appointment',
                href: '/book',
              }}
            />
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
          {reportCard.photo_before_url ? (
            <img
              src={reportCard.photo_before_url}
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
          {reportCard.photo_after_url ? (
            <img
              src={reportCard.photo_after_url}
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

        {/* Overall Rating */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= (reportCard.overall_rating || 0) ? 'text-[#434E54] fill-current' : 'text-[#434E54]/20'}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            {reportCard.overall_rating && (
              <span className="text-sm text-[#434E54]/60">
                {ratingEmojis[reportCard.overall_rating]}
              </span>
            )}
          </div>
        </div>

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
