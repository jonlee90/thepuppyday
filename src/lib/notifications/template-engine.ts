/**
 * Phase 8: Notification System Template Engine
 * Implements template rendering and validation
 */

import type {
  TemplateEngine,
  TemplateVariable,
  TemplateValidationResult,
  RenderedTemplate,
  BusinessContext,
} from './types';

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

  return {
    subject,
    html,
    text,
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

