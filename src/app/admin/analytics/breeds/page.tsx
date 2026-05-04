/**
 * Breed Analytics Deep-Dive Page
 * /admin/analytics/breeds
 *
 * Full table + chart for breed-level revenue, ABV, and visit-frequency-vs-benchmark.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, PawPrint } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { BreedAnalyticsClient } from './BreedAnalyticsClient';

export const metadata = {
  title: 'Breed Analytics | The Puppy Day',
  description: 'Breed-level revenue, booking value, and visit frequency analytics',
};

export const dynamic = 'force-dynamic';

function BreedAnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-96 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default async function BreedAnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Link
        href="/admin/analytics"
        className="inline-flex items-center gap-1 text-sm text-[#434E54]/70 hover:text-[#434E54] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Analytics
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#434E54] rounded-lg flex items-center justify-center">
          <PawPrint className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#434E54]">Breed Insights</h1>
          <p className="text-sm text-[#434E54]/60">Revenue, booking value, and visit cadence per breed</p>
        </div>
      </div>

      <Suspense fallback={<BreedAnalyticsSkeleton />}>
        <BreedAnalyticsClient />
      </Suspense>
    </div>
  );
}
