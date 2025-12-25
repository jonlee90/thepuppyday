/**
 * Dashboard Walk-In Button Component
 * Responsive button wrapper for quick walk-in appointment creation
 * Uses the booking modal in walkin mode
 * Desktop: Inline button in dashboard header
 * Mobile: Floating Action Button (FAB) at bottom-right
 */

'use client';

import { Footprints } from 'lucide-react';
import { useBookingModal } from '@/hooks/useBookingModal';

interface DashboardWalkInButtonProps {
  onSuccess?: (appointmentId: string) => void;
}

export function DashboardWalkInButton({ onSuccess }: DashboardWalkInButtonProps) {
  const { open } = useBookingModal();

  const handleClick = () => {
    open({
      mode: 'walkin',
      onSuccess,
    });
  };

  return (
    <>
      {/* Desktop Inline Button (hidden on mobile) */}
      <button
        onClick={handleClick}
        className="hidden md:flex items-center gap-2 bg-amber-500 text-white h-12 px-6 rounded-xl shadow-md hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
        aria-label="Create walk-in appointment"
      >
        <Footprints className="w-5 h-5" />
        <span>Walk In</span>
      </button>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleClick}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Create walk-in appointment"
      >
        <Footprints className="w-6 h-6" />
      </button>
    </>
  );
}
