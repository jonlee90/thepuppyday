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
    bgColor: 'bg-[#434E54]/10',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]/60',
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-[#434E54]/15',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]',
  },
  in_progress: {
    label: 'In Progress',
    bgColor: 'bg-[#434E54]/25',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-[#EAE0D5]',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]',
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-[#434E54]/5',
    textColor: 'text-[#434E54]/60',
    dotColor: 'bg-[#434E54]/40',
  },
  no_show: {
    label: 'No Show',
    bgColor: 'bg-[#434E54]/10',
    textColor: 'text-[#434E54]/70',
    dotColor: 'bg-[#434E54]/50',
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
