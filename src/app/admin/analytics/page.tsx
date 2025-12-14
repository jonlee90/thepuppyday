/**
 * Analytics Dashboard Page
 * Task 0048: Admin analytics overview
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';
import { BarChart3 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#434E54] rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#434E54]">Analytics Dashboard</h1>
            <p className="text-gray-600">Business performance and operational metrics</p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
