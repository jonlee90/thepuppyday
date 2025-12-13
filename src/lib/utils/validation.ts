/**
 * Validation utilities for admin panel
 * Security: Input validation and sanitization
 */

/**
 * Validates UUID format (RFC 4122 compliant)
 * Security: Prevents SQL injection via malformed IDs
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates image URL format
 * Security: Prevents XSS via javascript: or data: URIs
 * Accepts: Full URLs (http/https) or relative paths starting with /
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return true; // Allow null/empty for optional images

  // Allow relative paths starting with / (for uploaded images)
  if (url.startsWith('/')) {
    // Basic validation: must be a valid path format
    // Prevent directory traversal
    if (url.includes('..')) return false;
    // Prevent special protocols disguised in path
    if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
      return false;
    }
    return true;
  }

  // Validate full URLs
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes text input by removing HTML and trimming whitespace
 * Security: Prevents XSS via HTML injection
 */
export function sanitizeText(text: string): string {
  // Remove HTML tags
  const withoutHtml = text.replace(/<[^>]*>/g, '');
  // Trim whitespace
  return withoutHtml.trim();
}

/**
 * Validates and sanitizes service name
 */
export function validateServiceName(name: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(name);

  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'Service name is required' };
  }

  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: 'Service name must be 100 characters or less' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes description
 */
export function validateDescription(description: string | null): { valid: boolean; sanitized: string; error?: string } {
  if (!description) {
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeText(description);

  if (sanitized.length > 500) {
    return { valid: false, sanitized, error: 'Description must be 500 characters or less' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates duration in minutes
 */
export function validateDuration(duration: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(duration)) {
    return { valid: false, error: 'Duration must be a whole number' };
  }

  if (duration < 15 || duration > 480) {
    return { valid: false, error: 'Duration must be between 15 and 480 minutes' };
  }

  return { valid: true };
}

/**
 * Validates price (must be positive with max 2 decimal places)
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (price < 0) {
    return { valid: false, error: 'Price must be a positive number' };
  }

  // Check max 2 decimal places
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { valid: false, error: 'Price must have at most 2 decimal places' };
  }

  return { valid: true };
}

/**
 * Validates size-based pricing object
 */
export function validateSizeBasedPricing(prices: { small: number; medium: number; large: number; xlarge: number }): { valid: boolean; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [size, price] of Object.entries(prices)) {
    const result = validatePrice(price);
    if (!result.valid) {
      errors[size] = result.error || 'Invalid price';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validates and sanitizes gallery caption
 */
export function validateCaption(caption: string | null): { valid: boolean; sanitized: string; error?: string } {
  if (!caption) {
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeText(caption);

  if (sanitized.length > 200) {
    return { valid: false, sanitized, error: 'Caption must be 200 characters or less' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes pet name
 */
export function validatePetName(name: string | null): { valid: boolean; sanitized: string; error?: string } {
  if (!name) {
    return { valid: true, sanitized: '' };
  }

  const sanitized = sanitizeText(name);

  if (sanitized.length > 100) {
    return { valid: false, sanitized, error: 'Pet name must be 100 characters or less' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes tags array
 */
export function validateTags(tags: string[]): { valid: boolean; sanitized: string[]; error?: string } {
  const sanitized = tags
    .map((tag) => sanitizeText(tag))
    .filter((tag) => tag.length > 0)
    .slice(0, 10); // Max 10 tags

  // Check individual tag length
  const invalidTag = sanitized.find((tag) => tag.length > 50);
  if (invalidTag) {
    return { valid: false, sanitized: [], error: 'Each tag must be 50 characters or less' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates file upload (type and size)
 */
export function validateImageFile(
  file: File
): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size must be 10MB or less.',
    };
  }

  return { valid: true };
}
