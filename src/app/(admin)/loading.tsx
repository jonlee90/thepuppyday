/**
 * Loading state for admin panel
 */

import { DashboardSkeleton } from '@/components/ui/skeletons';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
