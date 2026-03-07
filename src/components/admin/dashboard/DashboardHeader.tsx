/**
 * DashboardHeader Component
 * Displays the dashboard page title, current business-timezone date,
 * and primary action buttons (New Booking, Walk-in).
 *
 * Responsive behavior:
 * - Desktop: heading + date on the left, buttons on the right
 * - Mobile: single column stack; Walk-in button hidden (FAB handles it)
 */

'use client';

import { formatDateInBusinessTimezone, getTodayDateString } from '@/lib/utils/timezone';
import { Calendar, LogIn } from 'lucide-react';

export interface DashboardHeaderProps {
  onNewBooking: () => void;
  onWalkIn: () => void;
}

export function DashboardHeader({ onNewBooking, onWalkIn }: DashboardHeaderProps) {
  const todayDateString = getTodayDateString();
  const formattedDate = formatDateInBusinessTimezone(todayDateString);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: title + date */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Dashboard</h1>
        <p className="text-[#434E54]/60 text-sm mt-0.5">{formattedDate}</p>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-3">
        {/* New Booking — visible on all breakpoints */}
        <button
          type="button"
          onClick={onNewBooking}
          aria-label="Open new booking form"
          className="inline-flex items-center gap-2 bg-[#434E54] hover:bg-[#363F44] text-white rounded-xl shadow-md px-4 py-2 text-sm font-medium transition-colors"
        >
          <Calendar className="w-4 h-4" aria-hidden="true" />
          New Booking
        </button>

        {/* Walk-in — hidden on mobile (WalkInButton FAB takes over) */}
        <button
          type="button"
          onClick={onWalkIn}
          aria-label="Open walk-in booking form"
          className="hidden md:inline-flex items-center gap-2 border border-[#434E54] text-[#434E54] hover:bg-[#434E54]/10 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          Walk-in
        </button>
      </div>
    </div>
  );
}
