# Task 0084: Implement template validation

## Description
Add validation logic to ensure templates have all required variables defined and return helpful error messages.

## Acceptance Criteria
- [x] Add `validate()` method to check required variables are present in template
- [x] Extract variables from template content using regex
- [x] Validate required variables are defined in variables array
- [x] Return ValidationResult with errors array
- [x] Write unit tests for validation logic

## Implementation Notes
- **Validation Method** (`HandlebarsTemplateEngine.validate()`):
  - Extracts all variables from template using `/\{\{([^}]+)\}\}/g` regex
  - Checks for missing required variables
  - Warns about undefined variables (not in schema)
  - Skips warnings for business context variables (business.*)
  - Returns `TemplateValidationResult` with valid flag, errors, and warnings arrays

- **Unit Tests**:
  - Tests for valid templates with all required variables
  - Tests for detecting missing required variables
  - Tests for allowing optional variables to be missing
  - Tests for warning about undefined variables
  - Tests for skipping business context warnings
  - Tests for nested variable path validation

- Integrated into HandlebarsTemplateEngine class in template-engine.ts

## References
- Req 11.4, Req 11.5

## Complexity
Small

## Category
Template Engine Implementation
