/**
 * DashboardHeader Component
 * Displays the dashboard page title, current business-timezone date,
 * and primary action buttons (New Booking, Walk-in).
 *
 * Responsive behavior:
 * - All breakpoints: heading + date on the left, status pill + buttons on the right (single row)
 * - Walk-in button hidden on mobile/tablet; only New Booking shown at small sizes
 */

'use client';

import { formatDateInBusinessTimezone, getTodayDateString } from '@/lib/utils/timezone';
import { Calendar, LogIn } from 'lucide-react';

export interface DashboardHeaderProps {
  onNewBooking: () => void;
  onWalkIn: () => void;
  isConnected?: boolean;
  isPolling?: boolean;
}

export function DashboardHeader({ onNewBooking, onWalkIn, isConnected, isPolling }: DashboardHeaderProps) {
  const todayDateString = getTodayDateString();
  const formattedDate = formatDateInBusinessTimezone(todayDateString);

  const showLive = isConnected && process.env.NEXT_PUBLIC_USE_MOCKS !== 'true';
  const showPolling = !isConnected && isPolling;

  return (
    <div className="flex flex-row items-center justify-between gap-3">
      {/* Left: title + date */}
      <div>
        <h1 className="text-3xl font-bold text-[#434E54]">Dashboard</h1>
        <p className="text-[#434E54]/60 text-sm mt-0.5">{formattedDate}</p>
      </div>

      {/* Right: action buttons + connection status */}
      <div className="flex items-center gap-3">
        {/* Connection status pill */}
        {showPolling && (
          <span
            role="status"
            aria-live="polite"
            title="Connection lost — refreshing every 30 seconds"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Polling</span>
          </span>
        )}
        {showLive && (
          <span
            role="status"
            aria-live="polite"
            title="Real-time updates active"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Live</span>
          </span>
        )}

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

        {/* Walk-in — hidden on mobile */}
        <button
          type="button"
          onClick={onWalkIn}
          aria-label="Open walk-in booking form"
          className="hidden lg:inline-flex items-center gap-2 border border-[#434E54] text-[#434E54] hover:bg-[#434E54]/10 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          Walk-in
        </button>
      </div>
    </div>
  );
}
