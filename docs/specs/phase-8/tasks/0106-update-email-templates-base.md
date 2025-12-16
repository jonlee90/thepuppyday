# Task 0106: Update email templates to use base template

## Description
Refactor all email templates to extend the responsive base template for consistency.

## Acceptance Criteria
- [x] Refactor all email templates to extend base template
- [x] Ensure content sections are properly formatted
- [x] Support basic formatting: bold, italic, links, lists
- [x] Generate both HTML and plain text versions
- [x] Write visual regression tests or manual test checklist

## Status
✅ Completed - Implemented in commit bdd20e2

## Implementation Notes
- Created `src/lib/notifications/email-base.ts` with TypeScript wrapper functions:
  - `wrapEmailContent()` - Wraps content in base template, generates HTML and text
  - `htmlToPlainText()` - Converts HTML to plain text with formatting preservation
  - `escapeHtml()` - XSS protection via HTML entity escaping
  - Helper functions: `createCard()`, `createButton()`, `createContentBox()`, `createAlert()`, `createInfoRow()`, `createImage()`
- Refactored all 7 email templates in `email-templates.ts`:
  1. Booking Confirmation
  2. Report Card Notification
  3. Retention Reminder
  4. Payment Failed
  5. Payment Reminder
  6. Payment Success
  7. Payment Final Notice
- Each template now has:
  - Separate content generation function (returns HTML string)
  - Separate text generation function (returns plain text)
  - Main export function that uses `wrapEmailContent()`
- Maintained all existing functionality and XSS security measures
- Created comprehensive test suite in `__tests__/email-templates.test.ts`:
  - Tests for all 7 email templates
  - HTML escaping verification
  - Base template integration tests
  - Design system color verification
- Fixed TypeScript compatibility (replaced 's' regex flag with [\s\S])
- Successful production build verification

## Files Created/Modified
- `src/lib/notifications/email-base.ts` - New wrapper module
- `src/lib/notifications/email-templates.ts` - Refactored to use base template
- `src/lib/notifications/__tests__/email-templates.test.ts` - Test suite

## References
- Req 17.7, Req 17.8

## Complexity
Medium

## Category
Email HTML Formatting
