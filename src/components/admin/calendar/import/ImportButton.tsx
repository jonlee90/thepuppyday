/**
 * Import Button Component
 * Task 0049: Trigger button for calendar import wizard
 */

'use client';

import { Upload } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';

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
    <AdminButton
      variant="primary"
      onClick={onOpen}
      className="shadow-md hover:shadow-lg transition-all duration-200"
    >
      <Upload className="w-5 h-5" />
      Import from Calendar
    </AdminButton>
  );
}
