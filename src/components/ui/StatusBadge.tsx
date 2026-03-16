/**
 * Status badge component for appointment statuses
 */

import type { AppointmentStatus } from '@/types/database';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<AppointmentStatus, {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
}> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-[#FCD34D]/20',
    textColor: 'text-[#92400E]',
    dotColor: 'bg-[#FCD34D]',
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-[#10B981]/15',
    textColor: 'text-[#065F46]',
    dotColor: 'bg-[#10B981]',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-[#3B82F6]/15',
    textColor: 'text-[#1E40AF]',
    dotColor: 'bg-[#3B82F6]',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-[#434E54]/15',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-[#EF4444]/10',
    textColor: 'text-[#991B1B]',
    dotColor: 'bg-[#EF4444]',
  },
  no_show: {
    label: 'No Show',
    bgColor: 'bg-[#DC2626]/10',
    textColor: 'text-[#7F1D1D]',
    dotColor: 'bg-[#DC2626]',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  // Fallback for legacy or unknown statuses (e.g., checked_in)
  const config = statusConfig[status] || {
    label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    bgColor: 'bg-[#434E54]/10',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]/60',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className={`${dotSizes[size]} rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

// Helper to get just the label
export function getStatusLabel(status: AppointmentStatus): string {
  return statusConfig[status]?.label || status;
}
