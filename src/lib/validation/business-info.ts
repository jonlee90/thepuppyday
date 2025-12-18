/**
 * Business Info Validation
 * Task 0165: Zod schemas and validation functions for business information
 */

import { z } from 'zod';

/**
 * Validates US phone number format: (XXX) XXX-XXXX
 */
export const phoneSchema = z
  .string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone number format. Use (XXX) XXX-XXXX');

/**
 * Validates email format
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Validates US ZIP code (5 digits or 5+4 format)
 */
export const zipSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code. Use 5 digits (e.g., 90638) or 5+4 format (e.g., 90638-1234)');

/**
 * Validates US state code (2 uppercase letters)
 */
export const stateSchema = z
  .string()
  .length(2, 'State must be 2 characters (e.g., CA)')
  .regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters');

/**
 * Validates HTTPS URL (required for social links)
 */
export const httpsUrlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => url.startsWith('https://'), {
    message: 'URL must use HTTPS',
  })
  .optional()
  .or(z.literal(''));

/**
 * Social links schema
 */
export const socialLinksSchema = z.object({
  instagram: httpsUrlSchema,
  facebook: httpsUrlSchema,
  yelp: httpsUrlSchema,
  twitter: httpsUrlSchema,
});

/**
 * Full business info schema
 */
export const businessInfoSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100, 'Business name must be 100 characters or less'),
  address: z.string().min(1, 'Street address is required').max(200, 'Address must be 200 characters or less'),
  city: z.string().min(1, 'City is required').max(100, 'City must be 100 characters or less'),
  state: stateSchema,
  zip: zipSchema,
  phone: phoneSchema,
  email: emailSchema,
  social_links: socialLinksSchema,
});

export type BusinessInfoValidation = z.infer<typeof businessInfoSchema>;

/**
 * Validates entire business info object
 * Returns validation result with detailed errors
 */
export function validateBusinessInfo(data: unknown): {
  success: boolean;
  data?: BusinessInfoValidation;
  errors?: Record<string, string[]>;
} {
  const result = businessInfoSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into field-level error messages
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(err.message);
  });

  return { success: false, errors };
}

/**
 * Validates single field
 */
export function validateField(
  fieldName: keyof BusinessInfoValidation | 'social_links.instagram' | 'social_links.facebook' | 'social_links.yelp' | 'social_links.twitter',
  value: unknown
): { valid: boolean; error?: string } {
  try {
    // Handle nested social_links fields
    if (fieldName.startsWith('social_links.')) {
      const socialField = fieldName.split('.')[1] as 'instagram' | 'facebook' | 'yelp' | 'twitter';
      httpsUrlSchema.parse(value);
      return { valid: true };
    }

    const fieldSchema = businessInfoSchema.shape[fieldName as keyof typeof businessInfoSchema.shape];
    if (!fieldSchema) {
      return { valid: false, error: 'Unknown field' };
    }

    fieldSchema.parse(value);
    return { valid: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { valid: false, error: err.errors[0]?.message || 'Invalid value' };
    }
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Helper: Format phone number as user types
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format: (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Helper: Generate Google Maps search URL from address
 */
export function generateMapsUrl(businessInfo: Partial<BusinessInfoValidation>): string | null {
  const { address, city, state, zip } = businessInfo;

  if (!address || !city || !state || !zip) {
    return null;
  }

  const fullAddress = `${address}, ${city}, ${state} ${zip}`;
  const encoded = encodeURIComponent(fullAddress);

  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
