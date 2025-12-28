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
    to: 'checked_in',
    label: 'Check In',
    requiresConfirmation: false,
    isDestructive: false,
    description: 'Customer has arrived',
  },
  {
    from: 'confirmed',
    to: 'cancelled',
    label: 'Cancel',
    requiresConfirmation: true,
    isDestructive: true,
    description: 'Cancel this appointment',
  },

  // From checked_in
  {
    from: 'checked_in',
    to: 'in_progress',
    label: 'Start Service',
    requiresConfirmation: false,
    isDestructive: false,
    description: 'Begin grooming service',
  },
  {
    from: 'checked_in',
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
    to: 'checked_in',
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
 * Get status badge color for DaisyUI
 */
export function getStatusBadgeColor(status: AppointmentStatus): string {
  switch (status) {
    case 'pending':
      return 'badge-ghost';
    case 'confirmed':
      return 'badge-info';
    case 'checked_in':
      return 'badge-warning';
    case 'in_progress':
      return 'badge-primary';
    case 'completed':
      return 'badge-success';
    case 'cancelled':
      return 'badge-error';
    case 'no_show':
      return 'badge-error';
    default:
      return 'badge-ghost';
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
    case 'checked_in':
      return 'Checked In';
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
      return '#9CA3AF'; // gray
    case 'confirmed':
      return '#74B9FF'; // blue
    case 'checked_in':
      return '#FFB347'; // yellow
    case 'in_progress':
      return '#6BCB77'; // green
    case 'completed':
      return '#2D6A4F'; // dark green
    case 'cancelled':
      return '#EF4444'; // red
    case 'no_show':
      return '#DC2626'; // dark red
    default:
      return '#9CA3AF';
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
