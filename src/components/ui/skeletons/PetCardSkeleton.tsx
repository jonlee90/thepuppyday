/**
 * Skeleton loader for pet cards
 */

import { Skeleton } from './Skeleton';

export function PetCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#434E54]/10">
      <div className="flex items-center gap-4 mb-4">
        {/* Pet photo skeleton */}
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Pet name */}
          <Skeleton className="h-6 w-28 mb-2" />
          {/* Breed */}
          <Skeleton className="h-4 w-36 mb-1" />
          {/* Size/weight */}
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Appointment count */}
      <div className="pt-4 border-t border-[#434E54]/10">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function PetCardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PetCardSkeleton key={i} />
      ))}
    </div>
  );
}
