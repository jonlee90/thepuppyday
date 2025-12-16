/**
 * Phase 8: Notification System Template Engine Tests
 * Unit tests for template rendering, validation, and SMS optimization
 */

import { describe, it, expect } from 'vitest';
import {
  HandlebarsTemplateEngine,
  createTemplateEngine,
  renderTemplateWithMetadata,
  escapeHtml,
  detectAndShortenUrls,
  calculateMaxSmsLength,
} from '../template-engine';
import type { TemplateVariable, BusinessContext } from '../types';

// ============================================================================
// HANDLEBARS TEMPLATE ENGINE TESTS
// ============================================================================

describe('HandlebarsTemplateEngine', () => {
  const engine = new HandlebarsTemplateEngine();

  // ==========================================================================
  // RENDER METHOD TESTS (Task 0083)
  // ==========================================================================

  describe('render', () => {
    it('should render simple variables', () => {
      const template = 'Hello {{customer_name}}!';
      const data = { customer_name: 'John Doe' };

      const result = engine.render(template, data);

      expect(result).toBe('Hello John Doe!');
    });

    it('should render nested variables', () => {
      const template = 'Welcome to {{business.name}}!';
      const data = {};

      const result = engine.render(template, data);

      expect(result).toBe('Welcome to Puppy Day!');
    });

    it('should render multiple variables', () => {
      const template =
        'Hi {{customer_name}}, your appointment is on {{appointment_date}} at {{appointment_time}}.';
      const data = {
        customer_name: 'Jane Smith',
        appointment_date: '2024-12-20',
        appointment_time: '10:00 AM',
      };

      const result = engine.render(template, data);

      expect(result).toBe(
        'Hi Jane Smith, your appointment is on 2024-12-20 at 10:00 AM.'
      );
    });

    it('should render business context variables', () => {
      const template =
        'Contact us at {{business.phone}} or email {{business.email}}.';
      const data = {};

      const result = engine.render(template, data);

      expect(result).toContain('(657) 252-2903');
      expect(result).toContain('puppyday14936@gmail.com');
    });

    it('should use custom business context when provided', () => {
      const template = 'Visit {{business.name}} at {{business.address}}.';
      const data = {};
      const customContext: BusinessContext = {
        name: 'Custom Grooming',
        address: '123 Main St',
        phone: '555-1234',
        email: 'info@custom.com',
        hours: '9-5',
      };

      const result = engine.render(template, data, customContext);

      expect(result).toBe('Visit Custom Grooming at 123 Main St.');
    });

    it('should keep placeholder if variable not found', () => {
      const template = 'Hello {{missing_variable}}!';
      const data = { other_variable: 'value' };

      const result = engine.render(template, data);

      expect(result).toBe('Hello {{missing_variable}}!');
    });

    it('should handle null and undefined values', () => {
      const template = 'Value: {{value}}';
      const data = { value: null };

      const result = engine.render(template, data);

      expect(result).toBe('Value: {{value}}');
    });

    it('should convert numbers to strings', () => {
      const template = 'Total: ${{total_price}}';
      const data = { total_price: 70 };

      const result = engine.render(template, data);

      expect(result).toBe('Total: $70');
    });

    it('should handle deeply nested objects', () => {
      const template = '{{user.profile.name}} from {{user.profile.location.city}}';
      const data = {
        user: {
          profile: {
            name: 'Alice',
            location: {
              city: 'Los Angeles',
            },
          },
        },
      };

      const result = engine.render(template, data);

      expect(result).toBe('Alice from Los Angeles');
    });
  });

  // ==========================================================================
  // VALIDATE METHOD TESTS (Task 0084)
  // ==========================================================================

  describe('validate', () => {
    it('should validate template with all required variables present', () => {
      const template = 'Hello {{customer_name}}, your pet {{pet_name}} is ready!';
      const requiredVariables: TemplateVariable[] = [
        { name: 'customer_name', description: 'Customer name', required: true },
        { name: 'pet_name', description: 'Pet name', required: true },
      ];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      const template = 'Hello {{customer_name}}!';
      const requiredVariables: TemplateVariable[] = [
        { name: 'customer_name', description: 'Customer name', required: true },
        { name: 'pet_name', description: 'Pet name', required: true },
      ];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('pet_name');
    });

    it('should allow optional variables to be missing', () => {
      const template = 'Hello {{customer_name}}!';
      const requiredVariables: TemplateVariable[] = [
        { name: 'customer_name', description: 'Customer name', required: true },
        { name: 'pet_name', description: 'Pet name', required: false },
      ];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about undefined variables', () => {
      const template = 'Hello {{undefined_var}}!';
      const requiredVariables: TemplateVariable[] = [];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('undefined_var');
    });

    it('should not warn about business context variables', () => {
      const template = 'Contact {{business.name}} at {{business.phone}}';
      const requiredVariables: TemplateVariable[] = [];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate nested variable paths', () => {
      const template = 'Hello {{customer.name}}!';
      const requiredVariables: TemplateVariable[] = [
        { name: 'customer', description: 'Customer object', required: true },
      ];

      const result = engine.validate(template, requiredVariables);

      expect(result.valid).toBe(true);
    });
  });

  // ==========================================================================
  // CHARACTER COUNT TESTS (Task 0085)
  // ==========================================================================

  describe('calculateCharacterCount', () => {
    it('should calculate basic character count', () => {
      const template = 'Hello World';
      const variables: TemplateVariable[] = [];

      const count = engine.calculateCharacterCount(template, variables);

      expect(count).toBe(11);
    });

    it('should account for maximum variable lengths', () => {
      const template = 'Hello {{customer_name}}!';
      const variables: TemplateVariable[] = [
        {
          name: 'customer_name',
          description: 'Customer name',
          required: true,
          maxLength: 50,
        },
      ];

      const count = engine.calculateCharacterCount(template, variables);

      // "Hello " (6) + maxLength (50) + "!" (1) = 57
      expect(count).toBe(57);
    });

    it('should handle multiple variables with max lengths', () => {
      const template = '{{customer_name}}, your pet {{pet_name}} is ready!';
      const variables: TemplateVariable[] = [
        { name: 'customer_name', description: 'Customer', required: true, maxLength: 30 },
        { name: 'pet_name', description: 'Pet', required: true, maxLength: 20 },
      ];

      const count = engine.calculateCharacterCount(template, variables);

      // 30 + ", your pet " (12) + 20 + " is ready!" (10) = 72
      expect(count).toBe(72);
    });

    it('should shorten URLs in character count', () => {
      const template = 'Visit https://www.verylongdomainname.com/path/to/page for details';
      const variables: TemplateVariable[] = [];

      const count = engine.calculateCharacterCount(template, variables);

      // "Visit " (6) + 23 (shortened URL) + " for details" (12) = 41
      expect(count).toBeLessThan(template.length);
    });

    it('should not shorten URLs shorter than 23 chars', () => {
      const template = 'Visit http://short.co for info';
      const variables: TemplateVariable[] = [];

      const count = engine.calculateCharacterCount(template, variables);

      expect(count).toBe(template.length);
    });
  });

  // ==========================================================================
  // SEGMENT COUNT TESTS (Task 0085)
  // ==========================================================================

  describe('calculateSegmentCount', () => {
    it('should return 0 for empty string', () => {
      const count = engine.calculateSegmentCount('');

      expect(count).toBe(0);
    });

    it('should return 1 for short messages', () => {
      const text = 'Hello, your appointment is confirmed!';

      const count = engine.calculateSegmentCount(text);

      expect(count).toBe(1);
    });

    it('should return 1 for messages at exactly 160 characters', () => {
      const text = 'x'.repeat(160);

      const count = engine.calculateSegmentCount(text);

      expect(count).toBe(1);
    });

    it('should return 2 for messages over 160 characters', () => {
      const text = 'x'.repeat(161);

      const count = engine.calculateSegmentCount(text);

      expect(count).toBe(2);
    });

    it('should calculate multiple segments correctly', () => {
      // 153 chars per segment for multi-part messages
      const text = 'x'.repeat(307); // Exactly 2 segments (153 * 2)

      const count = engine.calculateSegmentCount(text);

      expect(count).toBe(3); // 307 / 153 = 2.007, rounds up to 3
    });

    it('should handle typical SMS confirmation message', () => {
      const text =
        'Hi Jane, your appointment with Puppy Day is confirmed for 12/20/24 at 10:00 AM. Reply CANCEL to cancel. - Puppy Day';

      const count = engine.calculateSegmentCount(text);

      expect(count).toBe(1);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('createTemplateEngine', () => {
  it('should create a HandlebarsTemplateEngine instance', () => {
    const engine = createTemplateEngine();

    expect(engine).toBeInstanceOf(HandlebarsTemplateEngine);
  });

  it('should create a working engine', () => {
    const engine = createTemplateEngine();
    const result = engine.render('Hello {{name}}!', { name: 'World' });

    expect(result).toBe('Hello World!');
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('renderTemplateWithMetadata', () => {
  const engine = createTemplateEngine();

  it('should render all template parts', () => {
    const result = renderTemplateWithMetadata(
      engine,
      'Appointment Confirmation',
      '<p>Hello {{customer_name}}</p>',
      'Hello {{customer_name}}',
      { customer_name: 'John' }
    );

    expect(result.subject).toBe('Appointment Confirmation');
    expect(result.html).toBe('<p>Hello John</p>');
    expect(result.text).toBe('Hello John');
    expect(result.characterCount).toBe(10);
    expect(result.segmentCount).toBe(1);
  });

  it('should handle missing subject and html', () => {
    const result = renderTemplateWithMetadata(
      engine,
      undefined,
      undefined,
      'SMS message',
      {}
    );

    expect(result.subject).toBeUndefined();
    expect(result.html).toBeUndefined();
    expect(result.text).toBe('SMS message');
  });

  it('should add warnings for long SMS', () => {
    const longText = 'x'.repeat(200);
    const result = renderTemplateWithMetadata(engine, undefined, undefined, longText, {});

    expect(result.warnings).toBeDefined();
    expect(result.warnings?.[0]).toContain('200 characters');
    expect(result.warnings?.[0]).toContain('2 SMS segments');
  });

  it('should not add warnings for short SMS', () => {
    const result = renderTemplateWithMetadata(
      engine,
      undefined,
      undefined,
      'Short message',
      {}
    );

    expect(result.warnings).toBeUndefined();
  });
});

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    const text = '<script>alert("XSS")</script>';

    const result = escapeHtml(text);

    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    const text = 'Cats & Dogs';

    const result = escapeHtml(text);

    expect(result).toBe('Cats &amp; Dogs');
  });

  it('should escape quotes', () => {
    const text = `He said "Hello" and she said 'Hi'`;

    const result = escapeHtml(text);

    expect(result).toBe('He said &quot;Hello&quot; and she said &#x27;Hi&#x27;');
  });

  it('should not modify safe text', () => {
    const text = 'Safe text with no special characters';

    const result = escapeHtml(text);

    expect(result).toBe(text);
  });
});

describe('detectAndShortenUrls', () => {
  it('should detect and shorten long URLs', () => {
    const text = 'Visit https://www.verylongdomainname.com/path/to/page for more info';

    const result = detectAndShortenUrls(text);

    expect(result).toContain('[SHORT_URL:');
    expect(result).toContain('for more info');
  });

  it('should not shorten short URLs', () => {
    const text = 'Visit http://short.co';

    const result = detectAndShortenUrls(text);

    expect(result).toBe(text);
  });

  it('should handle multiple URLs', () => {
    const text =
      'Visit https://www.verylongdomainname.com/path and https://www.anotherlongurl.com/page';

    const result = detectAndShortenUrls(text);

    expect(result).toContain('[SHORT_URL:');
    expect((result.match(/\[SHORT_URL:/g) || []).length).toBe(2);
  });

  it('should handle text without URLs', () => {
    const text = 'No URLs here';

    const result = detectAndShortenUrls(text);

    expect(result).toBe(text);
  });
});

describe('calculateMaxSmsLength', () => {
  it('should calculate max SMS length with variables', () => {
    const template = 'Hi {{customer_name}}, your appointment is on {{date}}.';
    const variables: TemplateVariable[] = [
      { name: 'customer_name', description: 'Customer', required: true, maxLength: 30 },
      { name: 'date', description: 'Date', required: true, maxLength: 20 },
    ];

    const result = calculateMaxSmsLength(template, variables);

    expect(result.maxLength).toBeGreaterThan(template.length);
    expect(result.wouldExceedSingleSegment).toBe(false);
    expect(result.estimatedSegments).toBe(1);
  });

  it('should detect when message would exceed single segment', () => {
    const template = 'Long message: {{long_content}}';
    const variables: TemplateVariable[] = [
      { name: 'long_content', description: 'Content', required: true, maxLength: 200 },
    ];

    const result = calculateMaxSmsLength(template, variables);

    expect(result.wouldExceedSingleSegment).toBe(true);
    expect(result.estimatedSegments).toBeGreaterThan(1);
  });

  it('should handle template with no variables', () => {
    const template = 'Static message with no variables.';
    const variables: TemplateVariable[] = [];

    const result = calculateMaxSmsLength(template, variables);

    expect(result.maxLength).toBe(template.length);
    expect(result.wouldExceedSingleSegment).toBe(false);
    expect(result.estimatedSegments).toBe(1);
  });
});
