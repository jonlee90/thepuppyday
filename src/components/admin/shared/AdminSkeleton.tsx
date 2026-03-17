import React from 'react';

interface AdminSkeletonProps {
  variant: 'table' | 'card' | 'stats' | 'form';
  rows?: number;
  cards?: number;
  className?: string;
}

export function AdminSkeleton({ variant, rows = 5, cards = 3, className = '' }: AdminSkeletonProps) {
  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-xl overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex gap-4 px-4 py-3 border-b border-[#F0EAE0]">
          {[40, 25, 15, 15, 5].map((w, i) => (
            <div key={i} className="animate-pulse h-4 rounded bg-[#EAE0D5]/80" style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#F0EAE0] last:border-0">
            <div className="animate-pulse w-8 h-8 rounded-full bg-[#EAE0D5]/60 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="animate-pulse h-3.5 rounded bg-[#EAE0D5]/60 w-1/3" />
              <div className="animate-pulse h-3 rounded bg-[#F0EAE0] w-1/4" />
            </div>
            <div className="animate-pulse h-5 rounded-full bg-[#EAE0D5]/60 w-16" />
            <div className="animate-pulse h-4 rounded bg-[#F0EAE0] w-20" />
            <div className="animate-pulse h-4 rounded bg-[#F0EAE0] w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden">
            <div className="animate-pulse h-40 bg-[#EAE0D5]/60" />
            <div className="p-4 space-y-2">
              <div className="animate-pulse h-4 rounded bg-[#EAE0D5]/60 w-3/4" />
              <div className="animate-pulse h-3 rounded bg-[#F0EAE0] w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`flex items-center bg-white rounded-xl overflow-hidden ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-8 bg-[#F0EAE0] flex-shrink-0" />}
            <div className="flex-1 p-4 space-y-2">
              <div className="animate-pulse h-3 rounded bg-[#EAE0D5]/60 w-8" />
              <div className="animate-pulse h-6 rounded bg-[#EAE0D5]/80 w-16" />
              <div className="animate-pulse h-2.5 rounded bg-[#F0EAE0] w-12" />
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // form
  return (
    <div className={`space-y-5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="animate-pulse h-3.5 rounded bg-[#EAE0D5]/60 w-24" />
          <div className="animate-pulse h-10 rounded-lg bg-[#EAE0D5]/40 w-full" />
        </div>
      ))}
    </div>
  );
}
