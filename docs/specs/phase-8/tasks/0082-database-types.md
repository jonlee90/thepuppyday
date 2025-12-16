# Task 0082: Define database types for notification tables

## Description
Extend Supabase generated types with notification-specific tables and create type-safe query helpers.

## Acceptance Criteria
- [x] Extend Supabase generated types with notification_templates, notification_settings, notification_template_history
- [x] Create type-safe query helpers for notification tables

## Implementation Notes
- **Database Types** (`src/lib/notifications/database-types.ts`):
  - NotificationTemplateRow/Insert/Update types
  - NotificationSettingsRow/Insert/Update types
  - NotificationTemplateHistoryRow/Insert types
  - Enhanced NotificationLogRow with Phase 8 fields
  - NotificationDatabaseSchema extension interface

- **Query Helpers** (`src/lib/notifications/query-helpers.ts`):
  - NotificationTemplateQueries class (10 methods)
  - NotificationSettingsQueries class (7 methods)
  - NotificationLogQueries class (11 methods)
  - Combined NotificationQueries helper
  - createNotificationQueries factory function

- **Entry Point** (`src/lib/notifications/index.ts`):
  - Exports all types, database types, and query helpers

- All types pass linter and TypeScript checks

## References
- Req 1.8

## Complexity
Small

## Category
Core Type Definitions & Interfaces
