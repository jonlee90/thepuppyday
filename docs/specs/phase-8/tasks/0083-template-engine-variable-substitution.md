# Task 0083: Implement template engine with variable substitution

## Description
Create a template engine that supports variable substitution with nested objects and business context injection.

## Acceptance Criteria
- [x] Create `HandlebarsTemplateEngine` class implementing `TemplateEngine` interface
- [x] Implement `render()` method with `{{variable}}` substitution including nested objects (e.g., `{{business.phone}}`)
- [x] Add business context data (name, address, phone, email, hours, website) to all templates automatically
- [x] Implement character count and SMS segment calculation
- [x] Write unit tests for variable substitution, nested objects, missing variables
- [x] Place in `src/lib/notifications/template-engine.ts`

## Implementation Notes
- **Template Engine** (`src/lib/notifications/template-engine.ts`, 330 lines):
  - `HandlebarsTemplateEngine` class with full TemplateEngine interface implementation
  - `render()` method supports {{variable}} syntax with nested paths (e.g., {{user.profile.name}})
  - Auto-injects DEFAULT_BUSINESS_CONTEXT into all templates
  - `getNestedValue()` helper for traversing object paths
  - `extractVariables()` helper for regex-based variable extraction
  - `calculateSegmentCount()` for SMS segments (160 single, 153 multi-segment)
  - `createTemplateEngine()` factory function

- **Helper Functions**:
  - `renderTemplateWithMetadata()` - Full rendering with warnings
  - `escapeHtml()` - XSS prevention for HTML templates
  - `detectAndShortenUrls()` - URL optimization placeholder
  - `calculateMaxSmsLength()` - Template analysis utility

- **Unit Tests** (`src/lib/notifications/__tests__/template-engine.test.ts`, 680 lines):
  - 60+ test cases covering all functionality
  - Tests for simple variables, nested variables, business context
  - Tests for null/undefined handling, number conversion
  - Tests for deeply nested objects

- All code passes TypeScript compilation and ESLint checks

## References
- Req 2.3, Req 2.6, Req 3.3, Req 3.5, Req 17.1

## Complexity
Medium

## Category
Template Engine Implementation
