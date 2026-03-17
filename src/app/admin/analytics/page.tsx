/**
 * Analytics Dashboard Page
 * Task 0048: Admin analytics overview
 */

import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';
import { BarChart3 } from 'lucide-react';

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-base-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-base-200 rounded-xl" />
    </div>
  );
}

export const metadata = {
  title: 'Analytics Dashboard | The Puppy Day',
  description: 'Business analytics and performance metrics',
};

// Force dynamic rendering to allow authentication checks
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  // Require admin authentication
  await requireAdmin(supabase);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#434E54] rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="hidden lg:block text-3xl font-bold text-[#434E54]">Analytics Dashboard</h1>
          <p className="text-[#434E54]/60">Business performance and operational metrics</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
