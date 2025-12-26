/**
 * Appointment-to-Event Mapper
 * Converts appointment data to Google Calendar event format
 */

import type { AppointmentForSync, GoogleCalendarEvent } from '@/types/calendar';

/**
 * Business location for calendar events
 */
const BUSINESS_LOCATION = 'The Puppy Day, La Mirada, CA';

/**
 * Business timezone
 */
const BUSINESS_TIMEZONE = 'America/Los_Angeles';

/**
 * Map appointment status to Google Calendar event status
 *
 * @param appointmentStatus - Appointment status
 * @returns Google Calendar event status
 */
function mapAppointmentStatusToEventStatus(
  appointmentStatus: string
): 'confirmed' | 'tentative' | 'cancelled' {
  switch (appointmentStatus) {
    case 'confirmed':
    case 'checked_in':
    case 'in_progress':
    case 'completed':
      return 'confirmed';
    case 'pending':
      return 'tentative';
    case 'cancelled':
    case 'no_show':
      return 'cancelled';
    default:
      return 'tentative';
  }
}

/**
 * Calculate appointment end time
 *
 * @param startTime - Appointment start time
 * @param durationMinutes - Total duration in minutes
 * @returns End time as ISO string
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toISOString();
}

/**
 * Format phone number for display
 *
 * @param phone - Raw phone number
 * @returns Formatted phone number or empty string
 */
function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Build event title
 *
 * @param appointment - Appointment data
 * @returns Event title (e.g., "Grooming - Buddy (John Doe)")
 */
function buildEventTitle(appointment: AppointmentForSync): string {
  const petName = appointment.pet.name;
  const customerName = `${appointment.customer.first_name} ${appointment.customer.last_name}`;
  const serviceName = appointment.service.name;

  return `${serviceName} - ${petName} (${customerName})`;
}

/**
 * Build event description with appointment details
 *
 * @param appointment - Appointment data
 * @returns Event description with customer, pet, service, and contact info
 */
function buildEventDescription(appointment: AppointmentForSync): string {
  const lines: string[] = [];

  // Customer information
  lines.push(`**Customer:** ${appointment.customer.first_name} ${appointment.customer.last_name}`);
  lines.push(`**Email:** ${appointment.customer.email}`);
  if (appointment.customer.phone) {
    lines.push(`**Phone:** ${formatPhoneNumber(appointment.customer.phone)}`);
  }

  lines.push(''); // Blank line

  // Pet information
  lines.push(`**Pet:** ${appointment.pet.name}`);
  lines.push(`**Size:** ${appointment.pet.size}`);

  lines.push(''); // Blank line

  // Service information
  lines.push(`**Service:** ${appointment.service.name}`);
  lines.push(`**Duration:** ${appointment.service.duration_minutes} minutes`);

  // Add-ons if any
  if (appointment.addons && appointment.addons.length > 0) {
    lines.push(''); // Blank line
    lines.push('**Add-ons:**');
    appointment.addons.forEach((addon) => {
      lines.push(`- ${addon.addon_name} (${addon.duration_minutes} min)`);
    });
  }

  // Appointment notes
  if (appointment.notes) {
    lines.push(''); // Blank line
    lines.push('**Notes:**');
    lines.push(appointment.notes);
  }

  lines.push(''); // Blank line
  lines.push('---');
  lines.push('*Synced from The Puppy Day appointment system*');

  return lines.join('\n');
}

/**
 * Calculate total appointment duration including add-ons
 *
 * @param appointment - Appointment data
 * @returns Total duration in minutes
 */
function calculateTotalDuration(appointment: AppointmentForSync): number {
  let totalDuration = appointment.service.duration_minutes;

  if (appointment.addons && appointment.addons.length > 0) {
    totalDuration += appointment.addons.reduce(
      (sum, addon) => sum + addon.duration_minutes,
      0
    );
  }

  return totalDuration;
}

/**
 * Convert appointment to Google Calendar event format
 *
 * @param appointment - Appointment data with joined customer, pet, and service
 * @returns Google Calendar event object
 *
 * @example
 * ```typescript
 * const event = mapAppointmentToEvent(appointment);
 * // Event ready to be created in Google Calendar
 * ```
 */
export function mapAppointmentToEvent(
  appointment: AppointmentForSync
): Omit<GoogleCalendarEvent, 'id' | 'created' | 'updated'> {
  // Calculate total duration including add-ons
  const totalDuration = calculateTotalDuration(appointment);

  // Calculate end time
  const endTime = calculateEndTime(appointment.scheduled_at, totalDuration);

  // Build event components
  const title = buildEventTitle(appointment);
  const description = buildEventDescription(appointment);
  const status = mapAppointmentStatusToEventStatus(appointment.status);

  // Construct event object
  return {
    summary: title,
    description,
    location: BUSINESS_LOCATION,
    start: {
      dateTime: appointment.scheduled_at,
      timeZone: BUSINESS_TIMEZONE,
    },
    end: {
      dateTime: endTime,
      timeZone: BUSINESS_TIMEZONE,
    },
    status,
  };
}

/**
 * Check if appointment should be deleted from calendar
 *
 * @param appointment - Appointment data
 * @returns True if event should be deleted from calendar
 */
export function shouldDeleteEvent(appointment: AppointmentForSync): boolean {
  // Delete event if appointment is cancelled or no-show
  return appointment.status === 'cancelled' || appointment.status === 'no_show';
}

/**
 * Extract customer email for event attendee
 *
 * @param appointment - Appointment data
 * @returns Customer email address
 */
export function getCustomerEmail(appointment: AppointmentForSync): string {
  return appointment.customer.email;
}

/**
 * Build event summary for display (short version)
 *
 * @param appointment - Appointment data
 * @returns Short event summary
 */
export function buildEventSummary(appointment: AppointmentForSync): string {
  return buildEventTitle(appointment);
}

/**
 * Validate appointment data for calendar sync
 *
 * @param appointment - Appointment data
 * @returns Validation result with errors if invalid
 */
export function validateAppointmentForSync(appointment: AppointmentForSync): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!appointment.id) {
    errors.push('Appointment ID is required');
  }

  if (!appointment.scheduled_at) {
    errors.push('Scheduled time is required');
  } else {
    // Validate scheduled time is a valid date
    const scheduledDate = new Date(appointment.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Scheduled time is not a valid date');
    }
  }

  if (!appointment.customer) {
    errors.push('Customer information is required');
  } else {
    if (!appointment.customer.first_name) {
      errors.push('Customer first name is required');
    }
    if (!appointment.customer.last_name) {
      errors.push('Customer last name is required');
    }
    if (!appointment.customer.email) {
      errors.push('Customer email is required');
    }
  }

  if (!appointment.pet) {
    errors.push('Pet information is required');
  } else {
    if (!appointment.pet.name) {
      errors.push('Pet name is required');
    }
  }

  if (!appointment.service) {
    errors.push('Service information is required');
  } else {
    if (!appointment.service.name) {
      errors.push('Service name is required');
    }
    if (!appointment.service.duration_minutes || appointment.service.duration_minutes <= 0) {
      errors.push('Service duration must be greater than 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
