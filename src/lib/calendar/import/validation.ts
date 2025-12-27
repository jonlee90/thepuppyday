/**
 * Import Validation Service
 * Validates parsed event data before import
 */

import type { ParsedEventData } from './parser';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[]; // Blocking issues
  warnings: string[]; // Non-blocking issues
}

/**
 * Validation limits
 */
const VALIDATION_LIMITS = {
  MIN_DURATION_MINUTES: 15, // Minimum appointment duration
  MAX_DURATION_MINUTES: 480, // Maximum appointment duration (8 hours)
  MAX_DAYS_IN_PAST: 365, // Don't import events older than 1 year
  MAX_DAYS_IN_FUTURE: 365, // Don't import events more than 1 year in future
};

/**
 * Validate parsed event data for import
 *
 * Checks all required fields and business rules
 *
 * @param eventData - Parsed event data
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateEventForImport(eventData);
 * if (!result.valid) {
 *   console.error("Validation errors:", result.errors);
 * }
 * if (result.warnings.length > 0) {
 *   console.warn("Validation warnings:", result.warnings);
 * }
 * ```
 */
export function validateEventForImport(
  eventData: ParsedEventData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!eventData.title || eventData.title.trim() === '') {
    errors.push('Event title is required');
  }

  if (!eventData.start) {
    errors.push('Event start time is required');
  }

  if (!eventData.end) {
    errors.push('Event end time is required');
  }

  // Validate date/time range
  if (eventData.start && eventData.end) {
    const dateTimeErrors = validateDateTimeRange(eventData.start, eventData.end);
    errors.push(...dateTimeErrors);
  }

  // Validate customer information
  const customerErrors = validateCustomerInfo(eventData.customer);
  errors.push(...customerErrors);

  // Warn if missing customer data
  if (!eventData.customer.email && !eventData.customer.phone) {
    warnings.push('No customer email or phone found - will need manual matching');
  }

  if (!eventData.customer.name) {
    warnings.push('No customer name found - will need manual entry');
  }

  // Validate pet information (warnings only)
  const petWarnings = validatePetInfo(eventData.pet);
  warnings.push(...petWarnings);

  // Warn if service name not detected
  if (!eventData.service_name) {
    warnings.push('Service name could not be detected - will need manual selection');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate date/time range
 *
 * @param start - Start time (ISO string)
 * @param end - End time (ISO string)
 * @returns Array of error messages
 */
export function validateDateTimeRange(start: string, end: string): string[] {
  const errors: string[] = [];

  // Parse dates
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if dates are valid
  if (isNaN(startDate.getTime())) {
    errors.push('Invalid start time format');
    return errors;
  }

  if (isNaN(endDate.getTime())) {
    errors.push('Invalid end time format');
    return errors;
  }

  // Check start < end
  if (startDate >= endDate) {
    errors.push('Event start time must be before end time');
  }

  // Check duration
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;

  if (durationMinutes < VALIDATION_LIMITS.MIN_DURATION_MINUTES) {
    errors.push(
      `Event duration (${Math.round(durationMinutes)} minutes) is too short ` +
      `(minimum ${VALIDATION_LIMITS.MIN_DURATION_MINUTES} minutes)`
    );
  }

  if (durationMinutes > VALIDATION_LIMITS.MAX_DURATION_MINUTES) {
    errors.push(
      `Event duration (${Math.round(durationMinutes)} minutes) is too long ` +
      `(maximum ${VALIDATION_LIMITS.MAX_DURATION_MINUTES} minutes)`
    );
  }

  // Check if event is too far in the past
  const now = new Date();
  const maxPastDate = new Date(now.getTime() - VALIDATION_LIMITS.MAX_DAYS_IN_PAST * 24 * 60 * 60 * 1000);

  if (startDate < maxPastDate) {
    errors.push(
      `Event is too old (more than ${VALIDATION_LIMITS.MAX_DAYS_IN_PAST} days in the past)`
    );
  }

  // Check if event is too far in the future
  const maxFutureDate = new Date(now.getTime() + VALIDATION_LIMITS.MAX_DAYS_IN_FUTURE * 24 * 60 * 60 * 1000);

  if (startDate > maxFutureDate) {
    errors.push(
      `Event is too far in the future (more than ${VALIDATION_LIMITS.MAX_DAYS_IN_FUTURE} days)`
    );
  }

  return errors;
}

/**
 * Validate customer information
 *
 * @param customerInfo - Customer info from parsed event
 * @returns Array of error messages
 */
export function validateCustomerInfo(customerInfo: {
  name?: string;
  email?: string;
  phone?: string;
}): string[] {
  const errors: string[] = [];

  // Validate email format if present
  if (customerInfo.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      errors.push(`Invalid email format: ${customerInfo.email}`);
    }
  }

  // Validate phone format if present
  if (customerInfo.phone) {
    const phoneErrors = validatePhoneNumber(customerInfo.phone);
    errors.push(...phoneErrors);
  }

  // Validate name format if present
  if (customerInfo.name) {
    // Check for minimum length
    if (customerInfo.name.trim().length < 2) {
      errors.push('Customer name is too short');
    }

    // Check for reasonable maximum length
    if (customerInfo.name.length > 100) {
      errors.push('Customer name is too long');
    }
  }

  return errors;
}

/**
 * Validate pet information
 *
 * Returns warnings only (pet info is optional)
 *
 * @param petInfo - Pet info from parsed event
 * @returns Array of warning messages
 */
export function validatePetInfo(petInfo?: {
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}): string[] {
  const warnings: string[] = [];

  if (!petInfo) {
    warnings.push('No pet information found - will need manual entry');
    return warnings;
  }

  if (!petInfo.name) {
    warnings.push('Pet name not found - will need manual entry');
  } else {
    // Validate pet name length
    if (petInfo.name.length < 1) {
      warnings.push('Pet name is empty');
    }
    if (petInfo.name.length > 50) {
      warnings.push('Pet name is unusually long');
    }
  }

  if (!petInfo.size) {
    warnings.push('Pet size not found - will need manual selection');
  }

  return warnings;
}

/**
 * Validate phone number format
 *
 * @param phone - Phone number string
 * @returns Array of error messages
 */
function validatePhoneNumber(phone: string): string[] {
  const errors: string[] = [];

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if it has the right number of digits
  if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
    errors.push(
      `Invalid phone number format: ${phone} ` +
      `(expected 10 or 11 digits, got ${digitsOnly.length})`
    );
  }

  // If it's 11 digits, first digit should be 1 (US country code)
  if (digitsOnly.length === 11 && digitsOnly[0] !== '1') {
    errors.push('11-digit phone number must start with 1 (US country code)');
  }

  return errors;
}

/**
 * Validate array of parsed events
 *
 * Convenience function to validate multiple events at once
 *
 * @param events - Array of parsed event data
 * @returns Map of event index to validation result
 *
 * @example
 * ```typescript
 * const results = validateEvents(events);
 * const validEvents = events.filter((_, i) => results.get(i)?.valid);
 * ```
 */
export function validateEvents(
  events: ParsedEventData[]
): Map<number, ValidationResult> {
  const results = new Map<number, ValidationResult>();

  events.forEach((event, index) => {
    results.set(index, validateEventForImport(event));
  });

  return results;
}

/**
 * Get summary statistics for validation results
 *
 * @param validationResults - Map of validation results
 * @returns Summary statistics
 */
export function getValidationSummary(
  validationResults: Map<number, ValidationResult>
): {
  total: number;
  valid: number;
  invalid: number;
  withWarnings: number;
} {
  const total = validationResults.size;
  let valid = 0;
  let invalid = 0;
  let withWarnings = 0;

  validationResults.forEach((result) => {
    if (result.valid) {
      valid++;
      if (result.warnings.length > 0) {
        withWarnings++;
      }
    } else {
      invalid++;
    }
  });

  return {
    total,
    valid,
    invalid,
    withWarnings,
  };
}
