'use client';

import React from 'react';

export interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StatusBadgeProps {
  status: string;
  statusConfig: Record<string, StatusConfig>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, statusConfig, size = 'md', className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    bgColor: 'bg-[#434E54]/10',
    textColor: 'text-[#434E54]',
    dotColor: 'bg-[#434E54]/40',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.icon ? (
        <config.icon className={dotSizeClasses[size]} />
      ) : (
        <span className={`rounded-full flex-shrink-0 ${dotSizeClasses[size]} ${config.dotColor}`} />
      )}
      {config.label}
    </span>
  );
}

export const APPOINTMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: 'Pending', bgColor: 'bg-[#FCD34D]/20', textColor: 'text-[#92400E]', dotColor: 'bg-[#FCD34D]' },
  confirmed: { label: 'Confirmed', bgColor: 'bg-[#10B981]/15', textColor: 'text-[#065F46]', dotColor: 'bg-[#10B981]' },
  in_progress: { label: 'In Progress', bgColor: 'bg-[#3B82F6]/15', textColor: 'text-[#1E40AF]', dotColor: 'bg-[#3B82F6]' },
  completed: { label: 'Completed', bgColor: 'bg-[#434E54]/15', textColor: 'text-[#434E54]', dotColor: 'bg-[#434E54]' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-[#EF4444]/10', textColor: 'text-[#991B1B]', dotColor: 'bg-[#EF4444]' },
  no_show: { label: 'No Show', bgColor: 'bg-[#DC2626]/10', textColor: 'text-[#7F1D1D]', dotColor: 'bg-[#DC2626]' },
  checked_in: { label: 'Checked In', bgColor: 'bg-[#8B5CF6]/15', textColor: 'text-[#5B21B6]', dotColor: 'bg-[#8B5CF6]' },
};

export const NOTIFICATION_STATUS_CONFIG: Record<string, StatusConfig> = {
  sent: { label: 'Sent', bgColor: 'bg-[#10B981]/15', textColor: 'text-[#065F46]', dotColor: 'bg-[#10B981]' },
  failed: { label: 'Failed', bgColor: 'bg-[#EF4444]/10', textColor: 'text-[#991B1B]', dotColor: 'bg-[#EF4444]' },
  pending: { label: 'Pending', bgColor: 'bg-[#FCD34D]/20', textColor: 'text-[#92400E]', dotColor: 'bg-[#FCD34D]' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-[#434E54]/10', textColor: 'text-[#434E54]', dotColor: 'bg-[#434E54]/60' },
};

export const WAITLIST_STATUS_CONFIG: Record<string, StatusConfig> = {
  waiting: { label: 'Waiting', bgColor: 'bg-[#FCD34D]/20', textColor: 'text-[#92400E]', dotColor: 'bg-[#FCD34D]' },
  notified: { label: 'Notified', bgColor: 'bg-[#3B82F6]/15', textColor: 'text-[#1E40AF]', dotColor: 'bg-[#3B82F6]' },
  booked: { label: 'Booked', bgColor: 'bg-[#10B981]/15', textColor: 'text-[#065F46]', dotColor: 'bg-[#10B981]' },
  expired: { label: 'Expired', bgColor: 'bg-[#EF4444]/10', textColor: 'text-[#991B1B]', dotColor: 'bg-[#EF4444]' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-[#434E54]/10', textColor: 'text-[#434E54]', dotColor: 'bg-[#434E54]/60' },
};

export const BANNER_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: { label: 'Draft', bgColor: 'bg-[#434E54]/10', textColor: 'text-[#434E54]', dotColor: 'bg-[#434E54]/60' },
  scheduled: { label: 'Scheduled', bgColor: 'bg-[#3B82F6]/15', textColor: 'text-[#1E40AF]', dotColor: 'bg-[#3B82F6]' },
  active: { label: 'Active', bgColor: 'bg-[#10B981]/15', textColor: 'text-[#065F46]', dotColor: 'bg-[#10B981]' },
  expired: { label: 'Expired', bgColor: 'bg-[#EF4444]/10', textColor: 'text-[#991B1B]', dotColor: 'bg-[#EF4444]' },
};
