/**
 * String sanitization utilities for XSS protection
 */

/**
 * Sanitize error messages before displaying to users
 * Removes HTML tags, JavaScript protocols, and limits length
 *
 * @param message - The error message to sanitize
 * @returns Sanitized message safe for display
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'An error occurred';
  }

  return message
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .slice(0, 500); // Limit length to prevent display issues
}

/**
 * Sanitize user input for display
 * More aggressive than error message sanitization
 *
 * @param input - User input to sanitize
 * @returns Sanitized input safe for display
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .slice(0, 1000); // Limit length
}
