/**
 * Walk-In Button Component
 * Responsive button for quick walk-in appointment creation
 * Desktop: Inline button in dashboard header
 * Mobile: Floating Action Button (FAB) at bottom-right
 */

'use client';

import { Footprints } from 'lucide-react';

interface WalkInButtonProps {
  onClick: () => void;
}

export function WalkInButton({ onClick }: WalkInButtonProps) {
  return (
    <>
      {/* Desktop Inline Button (hidden on mobile) */}
      <button
        onClick={onClick}
        className="hidden md:flex items-center gap-2 bg-[#434E54] text-white h-12 px-6 rounded-xl shadow-md hover:bg-[#363F44] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium"
        aria-label="Create walk-in appointment"
      >
        <Footprints className="w-5 h-5" />
        <span>Walk In</span>
      </button>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={onClick}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#434E54] text-white rounded-full shadow-lg hover:bg-[#363F44] hover:shadow-xl active:scale-95 transition-all duration-200 flex items-center justify-center z-50"
        aria-label="Create walk-in appointment"
      >
        <Footprints className="w-6 h-6" />
      </button>
    </>
  );
}
