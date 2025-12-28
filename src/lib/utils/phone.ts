/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number string to (XXX) XXX-XXXX format
 * @param value - Raw input value
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 10 digits
  const truncated = digits.slice(0, 10);

  // Format based on length
  if (truncated.length === 0) return '';
  if (truncated.length <= 3) return `(${truncated}`;
  if (truncated.length <= 6) return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
}

/**
 * Removes phone number formatting, leaving only digits
 * @param value - Formatted phone number
 * @returns Unformatted phone number (digits only)
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
