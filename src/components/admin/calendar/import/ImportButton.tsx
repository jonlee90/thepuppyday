/**
 * Import Button Component
 * Task 0049: Trigger button for calendar import wizard
 */

'use client';

import { Upload } from 'lucide-react';

interface ImportButtonProps {
  isConnected: boolean;
  onOpen: () => void;
}

export function ImportButton({ isConnected, onOpen }: ImportButtonProps) {
  // Only render when calendar is connected
  if (!isConnected) {
    return null;
  }

  return (
    <button
      onClick={onOpen}
      className="btn btn-primary bg-[#F59E0B] hover:bg-[#D97706] border-none text-white shadow-md hover:shadow-lg transition-all duration-200"
    >
      <Upload className="w-5 h-5" />
      Import from Calendar
    </button>
  );
}
