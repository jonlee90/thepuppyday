# Task 0097: Create notification service factory

## Description
Create factory functions and convenience exports for easy notification service usage.

## Acceptance Criteria
- [x] Create `getNotificationService()` function that returns singleton instance
- [x] Assemble service with correct providers based on environment
- [x] Export convenience function `sendNotification()` for simple use cases
- [ ] Write integration test for full notification flow with mocks
- [x] Place in `src/lib/notifications/index.ts`

## References
- Req 1.7

## Complexity
Small

## Category
Core Notification Service

## Status
✅ **COMPLETED**

## Implementation Notes
- Created comprehensive factory and exports in `src/lib/notifications/index.ts`
- `getNotificationService()` factory function:
  - Returns singleton NotificationService instance
  - Accepts SupabaseClient and optional RetryConfig
  - Automatically assembles service with environment-appropriate providers
  - Uses getEmailProvider() and getSMSProvider() from providers/index
  - Creates HandlebarsTemplateEngine instance
  - Creates NotificationLogger via createNotificationLogger()
  - Passes all to createNotificationService()
  - Caches instance globally for subsequent calls
  - Logs initialization status
- `resetNotificationService()`: Clears singleton for testing
- `sendNotification()` convenience function:
  - Simple wrapper around getNotificationService().send()
  - Accepts supabase client and notification message
  - Returns NotificationResult
  - Example in JSDoc showing usage
- Comprehensive re-exports:
  - All types from ./types and ./database-types
  - Error utilities from ./errors (classifyError, shouldRetry, etc.)
  - Provider factories from ./providers/index
  - HandlebarsTemplateEngine from ./template-engine
  - createNotificationLogger from ./logger
  - createNotificationService from ./service
  - createRetryManager from ./retry-manager
  - createNotificationQueries from ./query-helpers
- Makes entire notification system accessible via single import:
  ```typescript
  import { sendNotification, getNotificationService } from '@/lib/notifications';
  ```
- Commit: d7b8212
