/**
 * Analytics Dashboard Loading Skeleton
 * Task 0073: Clean & Elegant Professional loading state for analytics
 */

'use client';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Date Range Selector Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-[#EAE0D5] rounded-lg" />
        <div className="h-10 w-64 bg-[#EAE0D5] rounded-lg" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-24 bg-[#EAE0D5] rounded" />
              <div className="h-8 w-8 bg-[#EAE0D5] rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-[#EAE0D5] rounded mb-2" />
            <div className="h-4 w-16 bg-[#EAE0D5] rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="h-6 w-40 bg-[#EAE0D5] rounded mb-6" />
            <div className="h-64 bg-[#F8EEE5] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Large Chart Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-6 w-48 bg-[#EAE0D5] rounded mb-6" />
        <div className="h-80 bg-[#F8EEE5] rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="h-6 w-40 bg-[#EAE0D5] rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-12 bg-[#EAE0D5] rounded" />
              <div className="h-4 flex-1 bg-[#EAE0D5] rounded" />
              <div className="h-4 w-20 bg-[#EAE0D5] rounded" />
              <div className="h-4 w-24 bg-[#EAE0D5] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
