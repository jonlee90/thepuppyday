import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a date string or Date object
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a time string or Date object
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format a date and time together
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Pet sizes with their weight ranges
 */
export const PET_SIZES = {
  small: { label: 'Small', range: '0-18 lbs' },
  medium: { label: 'Medium', range: '19-35 lbs' },
  large: { label: 'Large', range: '36-65 lbs' },
  xlarge: { label: 'X-Large', range: '66+ lbs' },
} as const;

export type PetSize = keyof typeof PET_SIZES;

/**
 * Calculate service price based on pet size
 */
export function calculateServicePrice(
  prices: Record<PetSize, number>,
  size: PetSize
): number {
  return prices[size] ?? 0;
}

/**
 * Calculate total appointment price including add-ons
 */
export function calculateAppointmentTotal(
  servicePrice: number,
  addonPrices: number[]
): number {
  return servicePrice + addonPrices.reduce((sum, price) => sum + price, 0);
}

/**
 * Generate a random UUID (for mock data)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
}

/**
 * Placeholder email domain for walk-in customers without email addresses
 * These customers are identified by phone only
 */
export const WALKIN_EMAIL_DOMAIN = 'walkin.thepuppyday.local';

/**
 * Generate a placeholder email for walk-in customers who don't provide an email.
 * Format: walkin_<normalized_phone>@walkin.thepuppyday.local
 *
 * The placeholder email:
 * - Satisfies the NOT NULL constraint on users.email
 * - Is unique per phone number (since phone is unique for walk-ins)
 * - Is clearly identifiable as a placeholder (not a real email)
 * - Uses a .local TLD which is not routable (RFC 2606)
 *
 * @param phone - The customer's phone number
 * @returns A placeholder email address
 */
export function generateWalkinEmail(phone: string): string {
  // Normalize phone: remove all non-digit characters
  const normalizedPhone = phone.replace(/\D/g, '');
  return `walkin_${normalizedPhone}@${WALKIN_EMAIL_DOMAIN}`;
}

/**
 * Check if an email is a walk-in placeholder email
 * @param email - The email to check
 * @returns true if the email is a placeholder for walk-in customers
 */
export function isWalkinPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.endsWith(`@${WALKIN_EMAIL_DOMAIN}`);
}
