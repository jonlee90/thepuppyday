'use client';

import { PawPrint } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';

export interface MobileEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function MobileEmptyState({ icon, title, description, action }: MobileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 text-[#D4A574]/40 flex items-center justify-center">
        {icon ?? <PawPrint className="w-16 h-16" />}
      </div>
      <p className="text-lg font-semibold text-[#434E54] mt-4">{title}</p>
      {description && (
        <p className="text-sm text-[#434E54]/60 mt-2 max-w-[280px]">{description}</p>
      )}
      {action && (
        <AdminButton variant="secondary" className="mt-6" onClick={action.onClick}>
          {action.label}
        </AdminButton>
      )}
    </div>
  );
}
