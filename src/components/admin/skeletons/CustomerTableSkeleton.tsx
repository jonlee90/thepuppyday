/**
 * Customer table skeleton loader
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

export function CustomerTableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-[#434E54]/10 bg-[#EAE0D5]/30">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#434E54]/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <CustomerTableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CustomerTableRowSkeleton() {
  return (
    <div className="px-6 py-4 hover:bg-[#EAE0D5]/10 transition-colors">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Name */}
        <div className="col-span-3">
          <Skeleton className="h-5 w-full max-w-[140px] mb-1" />
          <Skeleton className="h-4 w-full max-w-[180px]" />
        </div>

        {/* Email */}
        <div className="col-span-3">
          <Skeleton className="h-4 w-full max-w-[160px]" />
        </div>

        {/* Phone */}
        <div className="col-span-2">
          <Skeleton className="h-4 w-full max-w-[100px]" />
        </div>

        {/* Last Visit */}
        <div className="col-span-2">
          <Skeleton className="h-4 w-full max-w-[80px]" />
        </div>

        {/* Actions */}
        <div className="col-span-2 flex justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
