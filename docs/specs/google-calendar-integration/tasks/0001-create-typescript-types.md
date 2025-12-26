# Task 0001: Create TypeScript types for Google Calendar integration

## Description
Create comprehensive TypeScript types and Zod validation schemas for all calendar-related data structures.

## Files to Create
- `src/types/calendar.ts` - All calendar-related TypeScript types and Zod schemas

## Dependencies
None - This is a foundational task

## Acceptance Criteria
- [ ] `CalendarConnection` type defined with all fields from database schema
- [ ] `CalendarEventMapping` type defined with all fields from database schema
- [ ] `CalendarSyncLog` type defined with all fields from database schema
- [ ] `CalendarSyncSettings` type defined for operational settings
- [ ] `ImportPreview` type defined for import wizard data
- [ ] `SyncResult` type defined for sync operation results
- [ ] Zod schemas created for all request/response validation
- [ ] Exported types are documented with JSDoc comments
- [ ] All types align with database schema design

## Implementation Notes
- Reference database schema from `docs/specs/google-calendar-integration/design.md`
- Use Zod for runtime validation (similar to existing booking validation patterns)
- Include proper TypeScript utility types (Omit, Pick, Partial as needed)
- Export both TypeScript types and Zod schemas

## Requirements Coverage
- Req 3: Appointment-to-Calendar Event Mapping
- Req 10: Sync Preferences

## Estimated Effort
2 hours
