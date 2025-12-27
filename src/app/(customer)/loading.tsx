/**
 * Customer Portal Loading State
 * Task 0259: Add loading.tsx files for route transitions
 */

import { DashboardSkeleton } from '@/components/ui/skeletons';

export default function CustomerLoading() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  );
}
