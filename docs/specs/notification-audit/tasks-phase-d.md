# Notification Audit - Phase D: Provider Factory Error Handling

## Overview

Phase D fixes the provider factory's overly broad error suppression. Currently, the `try/catch` blocks around dynamic `require()` calls for Resend and Twilio providers swallow ALL errors including syntax errors, missing dependencies, and configuration issues. Only `MODULE_NOT_FOUND` errors (for the provider file itself) should be silently suppressed.

**Progress**: 1/1 tasks complete (100%)

**Document References**:
- Design: `docs/specs/notification-audit/design.md`
- Design Section: Issue 5 (Provider Factory Error Handling)

---

## Section D.1: Provider Factory Hardening

### Task 0111: Fix Provider Factory Catch Blocks to Only Suppress MODULE_NOT_FOUND
- [x] In `src/lib/notifications/providers/index.ts`, update the Resend provider `catch` block to: accept `error: unknown`, check if it is an `Error` instance with a `code` property equal to `'MODULE_NOT_FOUND'`, log with `console.debug('[Provider Factory] Resend provider module not found, skipping')` for MODULE_NOT_FOUND, and log with `console.error('[Provider Factory] Failed to load Resend provider:', error)` for all other errors
- [x] Apply the same fix to the Twilio provider `catch` block with appropriate `[Provider Factory] Twilio provider module not found, skipping` / `Failed to load Twilio provider` messages
- [x] Remove the existing empty comments (`// Production provider not available`) and replace with the proper error discrimination logic
- [x] Ensure the `eslint-disable-next-line @typescript-eslint/no-require-imports` comments are preserved on the `require()` calls
- [x] Verify mock mode still works correctly (providers should load without hitting the catch blocks in mock mode since mock providers are imported statically at the top of the file)
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: MODULE_NOT_FOUND errors are silently logged at debug level. All other errors (syntax errors, missing SDK dependencies, configuration issues) are logged at error level and visible in monitoring. Mock mode is unaffected. No TypeScript errors.
- **References**: Design Section "Issue 5: Provider Factory Error Handling"
- **Files**: `src/lib/notifications/providers/index.ts`
