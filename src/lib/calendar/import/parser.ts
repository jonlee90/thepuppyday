/**
 * Google Calendar Event Parser
 * Parses Google Calendar events and extracts appointment data
 */

import type { calendar_v3 } from 'googleapis';
import type { PetSize } from '@/types/database';

/**
 * Parsed event data structure
 */
export interface ParsedEventData {
  title: string;
  start: string;
  end: string;
  service_name?: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
  };
  pet?: {
    name?: string;
    size?: PetSize;
  };
  notes?: string;
  raw_description?: string;
}

/**
 * Parse Google Calendar event to extract appointment data
 *
 * @param event - Google Calendar event
 * @returns Parsed event data
 *
 * @example
 * ```typescript
 * const parsed = parseCalendarEvent(event);
 * console.log(parsed.service_name); // "Basic Grooming"
 * console.log(parsed.customer.name); // "John Doe"
 * ```
 */
export function parseCalendarEvent(
  event: calendar_v3.Schema$Event
): ParsedEventData {
  const title = event.summary || '';
  const description = event.description || '';

  // Extract start and end times
  const start = event.start?.dateTime || event.start?.date || '';
  const end = event.end?.dateTime || event.end?.date || '';

  // Extract service from title
  const service_name = extractServiceFromTitle(title);

  // Extract customer info
  const customer = extractCustomerInfo(event);

  // Extract pet info from description
  const pet = extractPetInfo(description);

  // Parse event description for notes
  const { notes, customData } = parseEventDescription(description);

  // Merge any custom data into customer info
  if (customData.email && !customer.email) {
    customer.email = customData.email;
  }
  if (customData.phone && !customer.phone) {
    customer.phone = customData.phone;
  }

  return {
    title,
    start,
    end,
    service_name,
    customer,
    pet,
    notes,
    raw_description: description,
  };
}

/**
 * Extract service name from event title
 *
 * Attempts to match common service names in the title
 *
 * @param title - Event title
 * @returns Service name or null
 *
 * @example
 * ```typescript
 * extractServiceFromTitle("Basic Grooming - Max"); // "Basic Grooming"
 * extractServiceFromTitle("Premium Grooming for Buddy"); // "Premium Grooming"
 * ```
 */
export function extractServiceFromTitle(title: string): string | null {
  if (!title) return null;

  // Common service patterns (case-insensitive)
  const servicePatterns = [
    /basic\s+grooming/i,
    /premium\s+grooming/i,
    /deluxe\s+grooming/i,
    /full\s+grooming/i,
    /bath\s+(&|and)\s+brush/i,
    /bath/i,
    /nail\s+trim/i,
    /grooming/i,
  ];

  for (const pattern of servicePatterns) {
    const match = title.match(pattern);
    if (match) {
      // Capitalize first letter of each word
      return match[0]
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }

  return null;
}

/**
 * Extract customer information from event
 *
 * Looks at attendees list and event description
 *
 * @param event - Google Calendar event
 * @returns Customer information
 */
export function extractCustomerInfo(event: calendar_v3.Schema$Event): {
  name?: string;
  email?: string;
  phone?: string;
} {
  const customer: { name?: string; email?: string; phone?: string } = {};

  // Try to extract from attendees
  if (event.attendees && event.attendees.length > 0) {
    const attendee = event.attendees[0];

    if (attendee.email) {
      customer.email = attendee.email;
    }

    // Extract name from displayName or email
    if (attendee.displayName) {
      customer.name = attendee.displayName;
    } else if (attendee.email) {
      // Use email username as name fallback
      const emailName = attendee.email.split('@')[0];
      customer.name = emailName
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  // Try to extract from description
  const description = event.description || '';

  // Look for email pattern
  const emailMatch = description.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch && !customer.email) {
    customer.email = emailMatch[0];
  }

  // Look for phone pattern (various formats)
  const phonePatterns = [
    /(?:phone|tel|mobile|cell):\s*([0-9\s\-\(\)\.]+)/i,
    /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/,
    /\b(\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/,
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = description.match(pattern);
    if (phoneMatch) {
      // Clean up phone number
      customer.phone = phoneMatch[1].replace(/[^\d]/g, '');
      if (customer.phone.length === 10) {
        // Format as (XXX) XXX-XXXX
        customer.phone = `(${customer.phone.slice(0, 3)}) ${customer.phone.slice(3, 6)}-${customer.phone.slice(6)}`;
      }
      break;
    }
  }

  // Look for customer name pattern
  if (!customer.name) {
    const namePatterns = [
      /(?:customer|client|owner):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /(?:for|with)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    ];

    for (const pattern of namePatterns) {
      const nameMatch = description.match(pattern);
      if (nameMatch) {
        customer.name = nameMatch[1].trim();
        break;
      }
    }
  }

  return customer;
}

/**
 * Extract pet information from event description
 *
 * Looks for pet name and size indicators
 *
 * @param description - Event description
 * @returns Pet information
 *
 * @example
 * ```typescript
 * extractPetInfo("Pet: Max (Large)"); // { name: "Max", size: "large" }
 * extractPetInfo("Small dog named Buddy"); // { name: "Buddy", size: "small" }
 * ```
 */
export function extractPetInfo(description: string): {
  name?: string;
  size?: PetSize;
} | undefined {
  if (!description) return undefined;

  const pet: { name?: string; size?: PetSize } = {};

  // Look for pet name patterns
  const namePatterns = [
    /(?:pet|dog):\s*([A-Z][a-z]+)/i,
    /(?:for|named)\s+([A-Z][a-z]+)/,
    /^([A-Z][a-z]+)\s+(?:-|–)/,
  ];

  for (const pattern of namePatterns) {
    const match = description.match(pattern);
    if (match) {
      pet.name = match[1].trim();
      break;
    }
  }

  // Look for size indicators
  const sizePatterns: { pattern: RegExp; size: PetSize }[] = [
    { pattern: /\bsmall\b/i, size: 'small' },
    { pattern: /\b(?:medium|med)\b/i, size: 'medium' },
    { pattern: /\blarge\b/i, size: 'large' },
    { pattern: /\b(?:xlarge|x-large|extra\s+large)\b/i, size: 'xlarge' },
    { pattern: /\b(?:0-18|under\s+18)\s*lbs?\b/i, size: 'small' },
    { pattern: /\b(?:19-35|20-35)\s*lbs?\b/i, size: 'medium' },
    { pattern: /\b(?:36-65|35-65)\s*lbs?\b/i, size: 'large' },
    { pattern: /\b(?:66\+|over\s+65)\s*lbs?\b/i, size: 'xlarge' },
  ];

  for (const { pattern, size } of sizePatterns) {
    if (pattern.test(description)) {
      pet.size = size;
      break;
    }
  }

  // Only return pet object if we found at least one piece of info
  return pet.name || pet.size ? pet : undefined;
}

/**
 * Parse event description to extract notes and custom data
 *
 * Separates structured data from freeform notes
 *
 * @param description - Event description
 * @returns Parsed description with notes and custom data
 *
 * @example
 * ```typescript
 * const result = parseEventDescription("Pet: Max\nEmail: john@example.com\nSpecial notes here");
 * console.log(result.notes); // "Special notes here"
 * console.log(result.customData.email); // "john@example.com"
 * ```
 */
export function parseEventDescription(description: string): {
  notes: string;
  customData: Record<string, string>;
} {
  if (!description) {
    return { notes: '', customData: {} };
  }

  const customData: Record<string, string> = {};
  const noteLines: string[] = [];

  // Split by lines
  const lines = description.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for key-value patterns (e.g., "Key: Value")
    const kvMatch = trimmedLine.match(/^([A-Za-z\s]+):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
      const value = kvMatch[2].trim();

      // Store in customData if it looks like metadata
      const metadataKeys = [
        'email', 'phone', 'customer', 'client', 'owner',
        'pet', 'dog', 'service', 'size', 'breed'
      ];

      if (metadataKeys.some(k => key.includes(k))) {
        customData[key] = value;
      } else {
        // Otherwise, keep as notes
        noteLines.push(trimmedLine);
      }
    } else {
      // Not a key-value pair, treat as notes
      noteLines.push(trimmedLine);
    }
  }

  return {
    notes: noteLines.join('\n').trim(),
    customData,
  };
}
