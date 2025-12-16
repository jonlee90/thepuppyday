/**
 * Phase 8: Notification System Template Engine
 * Implements template rendering, validation, and SMS optimization
 */

import type {
  TemplateEngine,
  TemplateVariable,
  TemplateValidationResult,
  RenderedTemplate,
  BusinessContext,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * SMS segment length constants (GSM 7-bit encoding)
 */
const SMS_SINGLE_SEGMENT_LENGTH = 160;
const SMS_MULTI_SEGMENT_LENGTH = 153;

/**
 * URL shortening placeholder length (approximate)
 */
const SHORTENED_URL_LENGTH = 23;

/**
 * Default business context
 */
const DEFAULT_BUSINESS_CONTEXT: BusinessContext = {
  name: 'Puppy Day',
  address: '14936 Leffingwell Rd, La Mirada, CA 90638',
  phone: '(657) 252-2903',
  email: 'puppyday14936@gmail.com',
  hours: 'Monday-Saturday, 9:00 AM - 5:00 PM',
  website: 'https://thepuppyday.com',
};

// ============================================================================
// HANDLEBARS TEMPLATE ENGINE
// ============================================================================

/**
 * Template engine using Handlebars-style {{variable}} syntax
 */
export class HandlebarsTemplateEngine implements TemplateEngine {
  /**
   * Render a template with variables
   */
  render(
    template: string,
    data: Record<string, unknown>,
    businessContext?: BusinessContext
  ): string {
    // Merge business context with user data
    const context = businessContext ?? DEFAULT_BUSINESS_CONTEXT;
    const mergedData: Record<string, unknown> = {
      ...data,
      business: context,
    };

    // Replace {{variable}} with values, supporting nested paths like {{business.name}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
      const trimmedPath = path.trim();
      const value = this.getNestedValue(mergedData, trimmedPath);

      if (value === undefined || value === null) {
        return match; // Keep original placeholder if value not found
      }

      return String(value);
    });
  }

  /**
   * Validate template syntax and required variables
   */
  validate(
    template: string,
    requiredVariables: TemplateVariable[]
  ): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract all variables from template
    const templateVariables = this.extractVariables(template);

    // Check for missing required variables
    for (const required of requiredVariables) {
      if (required.required) {
        const found = templateVariables.some((v) =>
          v === required.name || v.startsWith(`${required.name}.`)
        );

        if (!found) {
          errors.push(`Required variable '${required.name}' is missing from template`);
        }
      }
    }

    // Check for undefined variables (variables in template but not in requiredVariables)
    for (const templateVar of templateVariables) {
      // Skip business context variables as they're always available
      if (templateVar.startsWith('business.')) {
        continue;
      }

      const baseName = templateVar.split('.')[0];
      const isDefined = requiredVariables.some((v) => v.name === baseName);

      if (!isDefined) {
        warnings.push(`Variable '${templateVar}' is not defined in template variables list`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate character count with max variable lengths
   */
  calculateCharacterCount(
    template: string,
    variables: TemplateVariable[]
  ): number {
    let maxLength = template.length;

    // Replace each variable placeholder with its maximum length
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = placeholderRegex.exec(template)) !== null) {
      const placeholder = match[0];
      const variablePath = match[1].trim();
      const baseName = variablePath.split('.')[0];

      // Find the variable definition
      const variable = variables.find((v) => v.name === baseName);

      if (variable?.maxLength) {
        // Calculate difference: maxLength - placeholder length
        const lengthDiff = variable.maxLength - placeholder.length;
        maxLength += lengthDiff;
      }
    }

    // Detect URLs and replace with shortened length
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = template.match(urlRegex) || [];

    for (const url of urls) {
      if (url.length > SHORTENED_URL_LENGTH) {
        maxLength -= (url.length - SHORTENED_URL_LENGTH);
      }
    }

    return maxLength;
  }

  /**
   * Calculate SMS segment count
   */
  calculateSegmentCount(text: string): number {
    const length = text.length;

    if (length === 0) {
      return 0;
    }

    if (length <= SMS_SINGLE_SEGMENT_LENGTH) {
      return 1;
    }

    // Multi-segment messages use 153 characters per segment
    return Math.ceil(length / SMS_MULTI_SEGMENT_LENGTH);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get nested value from object using dot notation
   * Example: getNestedValue({ business: { name: 'Puppy Day' } }, 'business.name') => 'Puppy Day'
   */
  private getNestedValue(
    obj: Record<string, unknown>,
    path: string
  ): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current === 'object' && !Array.isArray(current)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Extract all variable names from template
   * Returns array of variable paths (e.g., ['customer_name', 'business.name'])
   */
  private extractVariables(template: string): string[] {
    const variables: string[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const variablePath = match[1].trim();
      if (!variables.includes(variablePath)) {
        variables.push(variablePath);
      }
    }

    return variables;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new template engine instance
 */
export function createTemplateEngine(): TemplateEngine {
  return new HandlebarsTemplateEngine();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render a template and return full rendering result with metadata
 */
export function renderTemplateWithMetadata(
  engine: TemplateEngine,
  subjectTemplate: string | undefined,
  htmlTemplate: string | undefined,
  textTemplate: string,
  data: Record<string, unknown>,
  businessContext?: BusinessContext
): RenderedTemplate {
  const subject = subjectTemplate
    ? engine.render(subjectTemplate, data, businessContext)
    : undefined;

  const html = htmlTemplate
    ? engine.render(htmlTemplate, data, businessContext)
    : undefined;

  const text = engine.render(textTemplate, data, businessContext);

  const characterCount = text.length;
  const segmentCount = engine.calculateSegmentCount(text);
  const warnings: string[] = [];

  // Add warnings for long SMS
  if (characterCount > SMS_SINGLE_SEGMENT_LENGTH) {
    warnings.push(`Message is ${characterCount} characters (${segmentCount} SMS segments)`);
  }

  return {
    subject,
    html,
    text,
    characterCount,
    segmentCount,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Escape HTML to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Detect and shorten URLs in text (placeholder for actual URL shortening service)
 */
export function detectAndShortenUrls(text: string): string {
  const urlRegex = /https?:\/\/[^\s]+/g;

  return text.replace(urlRegex, (url) => {
    // In production, this would call a URL shortening service (e.g., Bitly)
    // For now, return placeholder indicating URL would be shortened
    if (url.length > SHORTENED_URL_LENGTH) {
      return `[SHORT_URL:${url.substring(0, 20)}...]`;
    }
    return url;
  });
}

/**
 * Calculate maximum possible SMS length for a template
 */
export function calculateMaxSmsLength(
  template: string,
  variables: TemplateVariable[]
): { maxLength: number; wouldExceedSingleSegment: boolean; estimatedSegments: number } {
  const engine = createTemplateEngine();
  const maxLength = engine.calculateCharacterCount(template, variables);
  const wouldExceedSingleSegment = maxLength > SMS_SINGLE_SEGMENT_LENGTH;
  const estimatedSegments = engine.calculateSegmentCount(
    'x'.repeat(maxLength) // Simulate worst-case scenario
  );

  return {
    maxLength,
    wouldExceedSingleSegment,
    estimatedSegments,
  };
}
