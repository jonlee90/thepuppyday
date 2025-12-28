/**
 * Appointment status transition utilities
 * Defines allowed transitions and validation logic
 */

import type { AppointmentStatus } from '@/types/database';

export interface StatusTransition {
  from: AppointmentStatus;
  to: AppointmentStatus;
  label: string;
  requiresConfirmation: boolean;
  isDestructive: boolean;
  description?: string;
}

/**
 * All allowed appointment status transitions
 */
export const ALLOWED_TRANSITIONS: StatusTransition[] = [
  // From pending
  {
    from: 'pending',
    to: 'confirmed',
    label: 'Confirm',
    requiresConfirmation: false,
    isDestructive: false,
    description: 'Send confirmation email to customer',
  },
  {
    from: 'pending',
    to: 'cancelled',
    label: 'Cancel',
    requiresConfirmation: true,
    isDestructive: true,
    description: 'Cancel this appointment',
  },

  // From confirmed
  {
    from: 'confirmed',
    to: 'in_progress',
    label: 'Start Service',
    requiresConfirmation: false,
    isDestructive: false,
    description: 'Begin grooming service',
  },
  {
    from: 'confirmed',
    to: 'cancelled',
    label: 'Cancel',
    requiresConfirmation: true,
    isDestructive: true,
    description: 'Cancel this appointment',
  },

  // From in_progress
  {
    from: 'in_progress',
    to: 'completed',
    label: 'Complete',
    requiresConfirmation: false,
    isDestructive: false,
    description: 'Service is complete',
  },
  {
    from: 'in_progress',
    to: 'cancelled',
    label: 'Cancel',
    requiresConfirmation: true,
    isDestructive: true,
    description: 'Cancel this appointment',
  },

  // From cancelled (reverse transitions)
  {
    from: 'cancelled',
    to: 'pending',
    label: 'Restore to Pending',
    requiresConfirmation: true,
    isDestructive: false,
    description: 'Restore this cancelled appointment to pending status',
  },

  // From completed (reverse transitions)
  {
    from: 'completed',
    to: 'in_progress',
    label: 'Reopen',
    requiresConfirmation: true,
    isDestructive: false,
    description: 'Reopen this completed appointment',
  },
];

/**
 * Get allowed transitions for a given status
 */
export function getAllowedTransitions(
  currentStatus: AppointmentStatus
): StatusTransition[] {
  return ALLOWED_TRANSITIONS.filter((t) => t.from === currentStatus);
}

/**
 * Check if a transition is allowed
 */
export function isTransitionAllowed(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return ALLOWED_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * Check if an appointment is in a terminal state
 */
export function isTerminalStatus(status: AppointmentStatus): boolean {
  return status === 'completed' || status === 'cancelled' || status === 'no_show';
}

/**
 * Check if an appointment is in the past
 */
export function isAppointmentInPast(scheduledAt: string): boolean {
  return new Date(scheduledAt) < new Date();
}

/**
 * Get status badge color for DaisyUI - matches calendar event colors
 * Returns Tailwind classes with hex colors that match getCalendarEventColor()
 */
export function getStatusBadgeColor(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-[#FCD34D] text-[#92400E] border-[#FCD34D]'; // yellow
    case 'confirmed':
      return 'bg-[#10B981] text-white border-[#10B981]'; // green
    case 'in_progress':
      return 'bg-[#6B7280] text-white border-[#6B7280]'; // gray
    case 'completed':
      return 'bg-[#434E54] text-white border-[#434E54]'; // theme primary
    case 'cancelled':
      return 'bg-[#EF4444] text-white border-[#EF4444]'; // red
    case 'no_show':
      return 'bg-[#DC2626] text-white border-[#DC2626]'; // dark red
    default:
      return 'bg-[#FCD34D] text-[#92400E] border-[#FCD34D]';
  }
}

/**
 * Get status display label
 */
export function getStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
}

/**
 * Get calendar event color for status
 */
export function getCalendarEventColor(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return '#FCD34D'; // yellow
    case 'confirmed':
      return '#10B981'; // green
    case 'in_progress':
      return '#6B7280'; // gray
    case 'completed':
      return '#434E54'; // theme primary
    case 'cancelled':
      return '#EF4444'; // red
    case 'no_show':
      return '#DC2626'; // dark red
    default:
      return '#FCD34D';
  }
}

/**
 * Cancellation reasons
 */
export const CANCELLATION_REASONS = [
  'Customer request',
  'Customer no-show',
  'Emergency',
  'Double booking',
  'Pet health issue',
  'Staff unavailable',
  'Other',
] as const;

export type CancellationReason = typeof CANCELLATION_REASONS[number];
