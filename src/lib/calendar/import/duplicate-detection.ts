/**
 * Duplicate Detection Service for Calendar Import
 * Detects if a Google Calendar event matches an existing appointment
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEventData } from './parser';

/**
 * Duplicate match result
 */
export interface DuplicateMatch {
  appointment_id: string;
  confidence: number; // 0-100
  reasons: string[];
  appointment: AppointmentSummary;
}

/**
 * Appointment summary for duplicate display
 */
export interface AppointmentSummary {
  id: string;
  scheduled_at: string;
  customer_name: string;
  customer_email?: string;
  pet_name: string;
  service_name: string;
  status: string;
}

/**
 * Confidence thresholds
 */
const CONFIDENCE_THRESHOLD = {
  HIGH: 80, // Almost certainly a duplicate
  MEDIUM: 60, // Likely a duplicate
  LOW: 40, // Possibly a duplicate
};

/**
 * Time overlap tolerance in minutes
 */
const TIME_OVERLAP_TOLERANCE_MINUTES = 30;

/**
 * Find duplicate appointment for a calendar event
 *
 * Returns the best match (highest confidence) or null
 *
 * @param supabase - Supabase client
 * @param eventData - Parsed event data
 * @returns Duplicate match or null
 *
 * @example
 * ```typescript
 * const duplicate = await findDuplicateAppointment(supabase, eventData);
 * if (duplicate && duplicate.confidence > 80) {
 *   console.log("High confidence duplicate found");
 * }
 * ```
 */
export async function findDuplicateAppointment(
  supabase: SupabaseClient,
  eventData: ParsedEventData
): Promise<DuplicateMatch | null> {
  const potentialDuplicates = await findPotentialDuplicates(supabase, eventData);

  if (potentialDuplicates.length === 0) {
    return null;
  }

  // Return the highest confidence match
  potentialDuplicates.sort((a, b) => b.confidence - a.confidence);
  return potentialDuplicates[0];
}

/**
 * Find all potential duplicate appointments
 *
 * Returns all matches above the low confidence threshold
 *
 * @param supabase - Supabase client
 * @param eventData - Parsed event data
 * @returns Array of potential duplicates, sorted by confidence (descending)
 */
export async function findPotentialDuplicates(
  supabase: SupabaseClient,
  eventData: ParsedEventData
): Promise<DuplicateMatch[]> {
  // Parse event times
  const eventStart = new Date(eventData.start);
  const eventEnd = new Date(eventData.end);

  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
    console.warn('Invalid event times for duplicate detection');
    return [];
  }

  // Calculate time range with tolerance
  const searchStart = new Date(eventStart.getTime() - TIME_OVERLAP_TOLERANCE_MINUTES * 60000);
  const searchEnd = new Date(eventEnd.getTime() + TIME_OVERLAP_TOLERANCE_MINUTES * 60000);

  // Query appointments in the time range
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      customer:users!appointments_customer_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      pet:pets!appointments_pet_id_fkey (
        id,
        name
      ),
      service:services!appointments_service_id_fkey (
        id,
        name
      )
    `)
    .gte('scheduled_at', searchStart.toISOString())
    .lte('scheduled_at', searchEnd.toISOString())
    .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress']);

  if (error) {
    console.error('Error querying appointments for duplicates:', error);
    return [];
  }

  if (!appointments || appointments.length === 0) {
    return [];
  }

  // Calculate match score for each appointment
  const matches: DuplicateMatch[] = [];

  for (const appointment of appointments) {
    const score = calculateMatchScore(eventData, appointment, eventStart, eventEnd);

    // Only include matches above low confidence threshold
    if (score.confidence >= CONFIDENCE_THRESHOLD.LOW) {
      matches.push({
        appointment_id: appointment.id,
        confidence: score.confidence,
        reasons: score.reasons,
        appointment: {
          id: appointment.id,
          scheduled_at: appointment.scheduled_at,
          customer_name: `${appointment.customer.first_name} ${appointment.customer.last_name}`,
          customer_email: appointment.customer.email,
          pet_name: appointment.pet.name,
          service_name: appointment.service.name,
          status: appointment.status,
        },
      });
    }
  }

  // Sort by confidence (descending)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Appointment data structure from database query
 */
interface AppointmentData {
  id: string;
  scheduled_at: string;
  status: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  pet: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  };
}

/**
 * Calculate match confidence score for an appointment
 *
 * @param eventData - Parsed event data
 * @param appointment - Appointment from database
 * @param eventStart - Event start time
 * @param eventEnd - Event end time
 * @returns Match score with confidence and reasons
 */
export function calculateMatchScore(
  eventData: ParsedEventData,
  appointment: AppointmentData,
  eventStart: Date,
  eventEnd: Date
): { confidence: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Time overlap check (40 points max)
  const appointmentStart = new Date(appointment.scheduled_at);
  const timeOverlap = checkTimeOverlap(
    eventStart,
    eventEnd,
    appointmentStart,
    appointmentStart // We don't store end time, so use start time
  );

  if (timeOverlap) {
    const timeDiffMinutes = Math.abs(
      (eventStart.getTime() - appointmentStart.getTime()) / 60000
    );

    if (timeDiffMinutes <= 5) {
      score += 40;
      reasons.push('Exact time match');
    } else if (timeDiffMinutes <= 15) {
      score += 30;
      reasons.push(`Time match within ${Math.round(timeDiffMinutes)} minutes`);
    } else if (timeDiffMinutes <= 30) {
      score += 20;
      reasons.push(`Time match within ${Math.round(timeDiffMinutes)} minutes`);
    } else {
      score += 10;
      reasons.push('Same time window');
    }
  }

  // Customer email match (30 points)
  if (
    eventData.customer.email &&
    appointment.customer.email &&
    eventData.customer.email.toLowerCase() === appointment.customer.email.toLowerCase()
  ) {
    score += 30;
    reasons.push('Customer email match');
  }

  // Customer phone match (25 points)
  if (
    eventData.customer.phone &&
    appointment.customer.phone
  ) {
    const eventPhone = normalizePhone(eventData.customer.phone);
    const appointmentPhone = normalizePhone(appointment.customer.phone);

    if (eventPhone === appointmentPhone) {
      score += 25;
      reasons.push('Customer phone match');
    }
  }

  // Customer name match (15 points)
  if (eventData.customer.name && appointment.customer) {
    const eventName = normalizeString(eventData.customer.name);
    const appointmentName = normalizeString(
      `${appointment.customer.first_name} ${appointment.customer.last_name}`
    );

    if (eventName === appointmentName) {
      score += 15;
      reasons.push('Customer name exact match');
    } else if (areNamesSimilar(eventName, appointmentName)) {
      score += 10;
      reasons.push('Customer name similar');
    }
  }

  // Pet name match (15 points)
  if (eventData.pet?.name && appointment.pet?.name) {
    const eventPetName = normalizeString(eventData.pet.name);
    const appointmentPetName = normalizeString(appointment.pet.name);

    if (eventPetName === appointmentPetName) {
      score += 15;
      reasons.push('Pet name match');
    } else if (areNamesSimilar(eventPetName, appointmentPetName)) {
      score += 10;
      reasons.push('Pet name similar');
    }
  }

  // Service name match (10 points)
  if (eventData.service_name && appointment.service?.name) {
    const eventService = normalizeString(eventData.service_name);
    const appointmentService = normalizeString(appointment.service.name);

    if (eventService === appointmentService) {
      score += 10;
      reasons.push('Service name match');
    } else if (appointmentService.includes(eventService) || eventService.includes(appointmentService)) {
      score += 5;
      reasons.push('Service name partial match');
    }
  }

  return {
    confidence: Math.min(100, score),
    reasons,
  };
}

/**
 * Check if two time ranges overlap
 *
 * @param start1 - Start of first range
 * @param end1 - End of first range
 * @param start2 - Start of second range
 * @param end2 - End of second range
 * @returns True if ranges overlap
 */
export function checkTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Add tolerance to account for duration estimates
  const tolerance = TIME_OVERLAP_TOLERANCE_MINUTES * 60000;

  const range1Start = start1.getTime() - tolerance;
  const range1End = end1.getTime() + tolerance;
  const range2Start = start2.getTime() - tolerance;
  const range2End = end2.getTime() + tolerance;

  // Check if ranges overlap
  return range1Start <= range2End && range2Start <= range1End;
}

/**
 * Normalize phone number to digits only
 *
 * @param phone - Phone number
 * @returns Normalized phone (digits only)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalize string for comparison
 *
 * @param str - String to normalize
 * @returns Normalized string (lowercase, trimmed, no extra spaces)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Check if two names are similar
 *
 * Uses basic fuzzy matching (checks if one contains the other, etc.)
 *
 * @param name1 - First name
 * @param name2 - Second name
 * @returns True if names are similar
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  // Already normalized by caller
  if (name1 === name2) return true;

  // Check if one contains the other
  if (name1.includes(name2) || name2.includes(name1)) return true;

  // Check if they share a significant portion of characters
  const commonChars = countCommonCharacters(name1, name2);
  const minLength = Math.min(name1.length, name2.length);

  // At least 70% of characters match
  return commonChars / minLength >= 0.7;
}

/**
 * Count common characters between two strings
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of common characters
 */
function countCommonCharacters(str1: string, str2: string): number {
  const chars1 = str1.split('');
  const chars2 = str2.split('');
  let common = 0;

  for (const char of chars1) {
    const index = chars2.indexOf(char);
    if (index !== -1) {
      common++;
      chars2.splice(index, 1); // Remove matched character
    }
  }

  return common;
}
