/**
 * Appointment-specific skeleton loaders for admin panel
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

/**
 * Skeleton for appointment calendar day cell
 */
export function AppointmentCalendarDaySkeleton() {
  return (
    <div className="bg-white rounded-lg p-3 border border-[#434E54]/10">
      <Skeleton className="h-5 w-8 mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-16 w-full rounded" />
        <Skeleton className="h-16 w-full rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton for full month calendar view
 */
export function AppointmentCalendarSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Calendar grid (5 weeks) */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <AppointmentCalendarDaySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for appointment list view row
 */
export function AppointmentListRowSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-[#434E54]/10 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          {/* Time */}
          <Skeleton className="h-5 w-24" />

          {/* Customer & Pet */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Service */}
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Status badge */}
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for appointment detail modal
 */
export function AppointmentDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Customer info */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>

      {/* Pet info */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#434E54]/10">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
