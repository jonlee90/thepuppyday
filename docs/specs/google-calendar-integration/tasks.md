# Implementation Tasks: Google Calendar Integration

This document contains the implementation task list for the admin-only Google Calendar integration feature. Each task is designed to be completed by a code-generation LLM in a test-driven manner, building incrementally on previous work.

**Reference Documents:**
- Requirements: `docs/specs/google-calendar-integration/requirements.md`
- Design: `docs/specs/google-calendar-integration/design.md`

---

## Phase 1: Foundation (Database, Types, and Core Utilities)

- [ ] 1. Create TypeScript types for Google Calendar integration
  - Create `src/types/calendar.ts` with all calendar-related types
  - Define `CalendarConnection`, `CalendarEventMapping`, `CalendarSyncLog` database types
  - Define `CalendarSyncSettings`, `ImportPreview`, `SyncResult` operational types
  - Add Zod validation schemas for API request/response validation
  - Ref: Req 3 (Appointment-to-Calendar Event Mapping), Req 10 (Sync Preferences)

- [ ] 1.1. Create database migration for calendar tables
  - Create `supabase/migrations/YYYYMMDD_calendar_integration.sql`
  - Add `calendar_connections` table with encrypted token storage
  - Add `calendar_event_mapping` table for bidirectional sync tracking
  - Add `calendar_sync_log` table for audit trail
  - Add all required indexes for performance
  - Insert default `calendar_sync_settings` into settings table
  - Ref: Req 1 (OAuth Authentication), Req 21 (Audit Logging), Req 28 (Performance)

- [ ] 1.2. Create token encryption utilities
  - Create `src/lib/calendar/encryption.ts`
  - Implement `encryptToken()` using AES-256-GCM
  - Implement `decryptToken()` for secure token retrieval
  - Add error handling for decryption failures
  - Write unit tests in `src/lib/calendar/__tests__/encryption.test.ts`
  - Ref: Req 15 (Data Privacy and Security)

- [ ] 1.3. Create Google OAuth client factory
  - Create `src/lib/calendar/oauth.ts`
  - Implement `createOAuth2Client()` factory function
  - Add scope constants for calendar.events permission
  - Implement `generateAuthUrl()` with offline access and consent prompt
  - Implement `exchangeCodeForTokens()` for token exchange
  - Implement `revokeTokens()` for disconnection
  - Write unit tests with mocked googleapis
  - Ref: Req 1 (OAuth Authentication), Req 6.1 (Minimum scopes)

- [ ] 1.4. Create token manager with auto-refresh
  - Create `src/lib/calendar/token-manager.ts`
  - Implement `getValidAccessToken()` that checks expiry and refreshes if needed
  - Implement `refreshAccessToken()` using refresh token
  - Implement `storeTokens()` for encrypted token persistence
  - Add token refresh error handling with automatic disconnection
  - Write unit tests for refresh logic
  - Ref: Req 1.3 (Token refresh), Req 15 (Token encryption)

- [ ] 1.5. Create calendar connection service
  - Create `src/lib/calendar/connection.ts`
  - Implement `getActiveConnection()` to fetch admin's calendar connection
  - Implement `createConnection()` to store new OAuth connection
  - Implement `deleteConnection()` to revoke and clean up
  - Implement `updateConnectionMetadata()` for calendar selection changes
  - Write unit tests with mocked Supabase
  - Ref: Req 1 (OAuth), Req 9 (Calendar Selection)

---

## Phase 2: OAuth Flow and Settings API

- [ ] 2. Create OAuth start endpoint
  - Create `src/app/api/admin/calendar/auth/start/route.ts`
  - Implement POST handler to generate OAuth authorization URL
  - Use `requireAdmin()` middleware for access control
  - Include admin user ID in state parameter for callback verification
  - Check for existing connection and return conflict if exists
  - Return redirect URL to Google OAuth consent screen
  - Ref: Req 1.1 (OAuth redirect), Req 2 (Admin access control)

- [ ] 2.1. Create OAuth callback endpoint
  - Create `src/app/api/admin/calendar/auth/callback/route.ts`
  - Implement GET handler for OAuth callback
  - Validate state parameter matches admin user ID
  - Exchange authorization code for tokens
  - Encrypt and store tokens in `calendar_connections`
  - Fetch and store calendar metadata (email, calendar ID)
  - Redirect to `/admin/settings/calendar?status=success` or `?status=error`
  - Handle OAuth errors gracefully
  - Ref: Req 1.1-1.5 (OAuth flow), Req 15 (Secure storage)

- [ ] 2.2. Create OAuth disconnect endpoint
  - Create `src/app/api/admin/calendar/auth/disconnect/route.ts`
  - Implement POST handler to disconnect Google Calendar
  - Revoke tokens with Google OAuth API
  - Delete all `calendar_event_mapping` entries
  - Delete `calendar_connections` entry
  - Stop any active webhook channels
  - Log disconnection event for audit
  - Ref: Req 1.4 (Token revocation), Req 16 (Data cleanup)

- [ ] 2.3. Create connection status endpoint
  - Create `src/app/api/admin/calendar/connection/route.ts`
  - Implement GET handler to return connection status
  - Return `isConnected`, calendar email, calendar ID, last sync time
  - Include webhook status (active, expiring_soon, expired, none)
  - Handle missing connection gracefully
  - Ref: Req 13 (Settings UI), Req 12 (Sync status)

- [ ] 2.4. Create calendar sync settings endpoint
  - Create `src/app/api/admin/calendar/settings/route.ts`
  - Implement GET handler to fetch sync settings from settings table
  - Implement PUT handler to update sync settings
  - Use Zod schema validation for settings
  - Return defaults if no settings configured
  - Log settings changes for audit
  - Follow existing `booking/route.ts` patterns
  - Ref: Req 10 (Sync Preferences), Req 4 (Status-based sync)

- [ ] 2.5. Create available calendars list endpoint
  - Create `src/app/api/admin/calendar/calendars/route.ts`
  - Implement GET handler to list admin's Google Calendars
  - Fetch calendar list using Google Calendar API
  - Return primary and secondary calendars with names and IDs
  - Handle API errors and token refresh
  - Ref: Req 9.1 (Display available calendars)

---

## Phase 3: Appointment-to-Event Mapping

- [ ] 3. Create appointment-to-event mapper
  - Create `src/lib/calendar/mapping.ts`
  - Implement `mapAppointmentToEvent()` to convert appointment to Google Calendar event
  - Calculate event duration from service + addons
  - Build event title: "[Service] - [Pet] ([Customer])"
  - Build event description with customer info, pet details, addons, notes
  - Set location to business address
  - Set timezone to America/Los_Angeles
  - Implement `getEventColor()` for status-based colors
  - Write unit tests for various appointment scenarios
  - Ref: Req 3 (Appointment-to-Calendar Event Mapping), Req 22 (Timezone)

- [ ] 3.1. Create sync criteria checker
  - Create `src/lib/calendar/sync-criteria.ts`
  - Implement `shouldSyncAppointment()` checking status, settings, dates
  - Implement `getAppointmentsToSync()` for bulk sync filtering
  - Check auto_sync_enabled setting
  - Check sync_statuses includes appointment status
  - Check sync_past_appointments setting
  - Check sync_completed_appointments setting
  - Write unit tests for all criteria combinations
  - Ref: Req 4 (Status-Based Conditional Sync), Req 10 (Sync Preferences)

- [ ] 3.2. Create Google Calendar API client wrapper
  - Create `src/lib/calendar/google-client.ts`
  - Implement `getCalendarClient()` factory with automatic token refresh
  - Implement `createEvent()`, `updateEvent()`, `deleteEvent()` wrappers
  - Implement `listEvents()` for import preview
  - Add rate limit handling with exponential backoff
  - Add retry logic for transient failures (up to 3 retries)
  - Write integration tests with mocked Google API
  - Ref: Req 17 (Rate Limiting), Req 18 (Network Failure Handling)

- [ ] 3.3. Create event mapping repository
  - Create `src/lib/calendar/event-mapping-repository.ts`
  - Implement `findMappingByAppointmentId()`
  - Implement `findMappingByGoogleEventId()`
  - Implement `createMapping()`
  - Implement `deleteMapping()`
  - Implement `updateMappingLastSynced()`
  - Write unit tests with mocked Supabase
  - Ref: Req 8 (Duplicate Detection)

---

## Phase 4: Push Sync (App to Google Calendar)

- [ ] 4. Create push sync service
  - Create `src/lib/calendar/sync/push.ts`
  - Implement `syncAppointmentToGoogle()` main function
  - Fetch appointment with all relations (customer, pet, service, addons)
  - Check sync criteria before syncing
  - Check for existing mapping to determine create vs update
  - Handle cancelled/no_show by deleting event
  - Create or update mapping after sync
  - Log sync operation to `calendar_sync_log`
  - Write unit tests for create, update, delete scenarios
  - Ref: Req 5 (Appointment Create/Update/Delete Sync)

- [ ] 4.1. Create sync logger utility
  - Create `src/lib/calendar/sync-logger.ts`
  - Implement `logSync()` to record sync operations
  - Store sync_type, operation, status, error details
  - Calculate and store operation duration_ms
  - Exclude sensitive data from logs
  - Implement `getRecentSyncLogs()` for dashboard
  - Implement `getSyncLogsForAppointment()` for history
  - Ref: Req 21 (Audit Logging), Req 15.6 (Exclude sensitive data)

- [ ] 4.2. Create manual sync API endpoint
  - Create `src/app/api/admin/calendar/sync/manual/route.ts`
  - Implement POST handler for single appointment sync
  - Accept appointmentId and optional force flag
  - Use `requireAdmin()` middleware
  - Validate appointment exists
  - Call `syncAppointmentToGoogle()` from push service
  - Return operation result (created, updated, deleted, skipped)
  - Handle and log errors
  - Ref: Req 11 (Manual Sync Triggers)

- [ ] 4.3. Create bulk sync background job
  - Create `src/lib/calendar/sync/bulk-sync-job.ts`
  - Implement `executeBulkSync()` for processing appointment batches
  - Process in batches of 10 to respect rate limits
  - Track progress (total, completed, failed)
  - Continue on individual failures
  - Return summary when complete
  - Write unit tests for batch processing
  - Ref: Req 6 (Bulk Sync Operations), Req 17 (Rate Limiting)

- [ ] 4.4. Create bulk sync API endpoint
  - Create `src/app/api/admin/calendar/sync/bulk/route.ts`
  - Implement POST handler to initiate bulk sync
  - Accept dateFrom, dateTo, force parameters
  - Default to today + 30 days if not specified
  - Start background job and return job ID
  - Return estimated duration
  - Ref: Req 6 (Bulk Sync), Req 11.3 (Sync All Now)

- [ ] 4.5. Create sync status API endpoint
  - Create `src/app/api/admin/calendar/sync/status/route.ts`
  - Implement GET handler for sync status
  - If jobId provided, return job progress and errors
  - Return overall sync health (connected, last sync, errors, webhook status)
  - Calculate recent error rate from sync logs
  - Ref: Req 12 (Sync Status Tracking), Req 26 (Admin Dashboard)

---

## Phase 5: Automatic Sync Triggers

- [ ] 5. Create appointment change listener for auto-sync
  - Create `src/lib/calendar/sync/auto-sync-trigger.ts`
  - Implement `triggerAutoSync()` called on appointment changes
  - Check if auto_sync_enabled and calendar connected
  - Check if appointment matches sync criteria
  - Queue sync operation (non-blocking)
  - Handle sync failures gracefully
  - Write unit tests for trigger conditions
  - Ref: Req 5.1 (New appointment sync within 30 seconds), Req 4.2 (Status change sync)

- [ ] 5.1. Integrate auto-sync into appointment status update
  - Modify `src/app/api/admin/appointments/[id]/status/route.ts`
  - After status update, call `triggerAutoSync()` with appointment ID
  - Handle calendar sync errors without failing status update
  - Log any sync errors for debugging
  - Ref: Req 4.2-4.6 (Status change triggers)

- [ ] 5.2. Integrate auto-sync into appointment creation
  - Modify `src/app/api/admin/appointments/route.ts` POST handler
  - After appointment creation, call `triggerAutoSync()` if status matches
  - Handle sync errors without failing appointment creation
  - Ref: Req 5.1 (New appointment sync), Req 5.8 (Customer-created appointments)

- [ ] 5.3. Integrate auto-sync into appointment updates
  - Modify `src/app/api/admin/appointments/[id]/route.ts` PUT handler
  - After appointment update, call `triggerAutoSync()` for field changes
  - Detect time, service, addons changes and sync
  - Ref: Req 5.2-5.5 (Update sync)

- [ ] 5.4. Create appointment deletion sync handler
  - Create `src/lib/calendar/sync/delete-handler.ts`
  - Implement `handleAppointmentDeletion()` to remove calendar event
  - Find mapping and delete Google Calendar event
  - Remove mapping from database
  - Log deletion operation
  - Ref: Req 5.4 (Appointment deletion sync), Req 16.1 (Event removal)

---

## Phase 6: Pull Sync (Import from Google Calendar)

- [ ] 6. Create event description parser
  - Create `src/lib/calendar/import/parser.ts`
  - Implement `parseEventDescription()` to extract data from event
  - Extract customer name, phone, email from description
  - Extract pet name, service name if present
  - Handle various description formats
  - Implement `parseEventTitle()` for service/pet hints
  - Write unit tests for parsing scenarios
  - Ref: Req 27 (Import Validation), Req 7.3 (Map event details)

- [ ] 6.1. Create duplicate detection service
  - Create `src/lib/calendar/import/duplicate-detection.ts`
  - Implement `findDuplicateAppointment()` by time and customer
  - Implement `findSuggestedCustomer()` by name, phone, email
  - Implement `findSuggestedPet()` by name and customer
  - Return match confidence scores
  - Write unit tests for matching logic
  - Ref: Req 8 (Duplicate Detection and Conflict Resolution)

- [ ] 6.2. Create import preview endpoint
  - Create `src/app/api/admin/calendar/import/preview/route.ts`
  - Implement POST handler for import preview
  - Accept dateFrom and dateTo parameters
  - Fetch events from Google Calendar
  - Parse each event and find matches/suggestions
  - Filter out events already mapped to appointments
  - Filter out past events older than 7 days
  - Return structured preview data
  - Ref: Req 7 (Import from Google Calendar), Req 14.2-14.3 (Wizard steps)

- [ ] 6.3. Create import confirmation endpoint
  - Create `src/app/api/admin/calendar/import/confirm/route.ts`
  - Implement POST handler to execute import
  - Accept array of import specifications (event ID, customer, pet, service)
  - Validate required fields (customer, pet, service selected)
  - Validate pet belongs to customer
  - Validate service is active
  - Create appointments with status "pending"
  - Create event mappings with sync_direction "pull"
  - Return results summary (successful, failed)
  - Ref: Req 7.4-7.9 (Import requirements), Req 27 (Validation)

- [ ] 6.4. Create import validation service
  - Create `src/lib/calendar/import/validation.ts`
  - Implement `validateImportData()` for single event
  - Check customer, pet, service selection
  - Verify pet belongs to customer
  - Verify service is active
  - Detect time conflicts with existing appointments
  - Check if event time is in the past (warn but allow)
  - Compare event duration vs service duration (warn if mismatch)
  - Return validation result with errors and warnings
  - Write unit tests
  - Ref: Req 27 (Import Validation and Data Completeness)

---

## Phase 7: Webhook Integration (Real-time Updates)

- [ ] 7. Create webhook registration service
  - Create `src/lib/calendar/webhook/registration.ts`
  - Implement `registerWebhook()` to set up push notifications
  - Generate unique channel ID and token
  - Register with Google Calendar watch API
  - Store channel info in `calendar_connections`
  - Calculate and store expiration time
  - Implement `stopWebhook()` to unregister
  - Ref: Req 23.6 (Realtime updates)

- [ ] 7.1. Create webhook endpoint
  - Create `src/app/api/admin/calendar/webhook/route.ts`
  - Implement POST handler for Google Calendar push notifications
  - Validate webhook authenticity (channel ID, token)
  - Return 200 immediately (async processing)
  - Parse X-Goog-* headers for channel and resource info
  - Queue event processing (non-blocking)
  - Ref: Req 19 (Sync Conflict Resolution)

- [ ] 7.2. Create webhook event processor
  - Create `src/lib/calendar/webhook/processor.ts`
  - Implement `processWebhookNotification()` for change handling
  - Fetch updated event from Google Calendar
  - Find mapping by google_event_id
  - If mapped, check for conflicts with app data
  - App data takes precedence (re-sync if conflict)
  - If event deleted in Google, recreate from app data
  - Log webhook processing
  - Ref: Req 19 (Sync Conflict Resolution), Req 4.8 (Calendar deletion handling)

- [ ] 7.3. Create webhook renewal job
  - Create `src/lib/calendar/webhook/renewal.ts`
  - Implement `renewExpiringWebhooks()` for scheduled renewal
  - Find connections with webhooks expiring in next 24 hours
  - Stop old webhook and register new one
  - Update connection with new channel info
  - Log renewal operations
  - Ref: Req 9.4 (Calendar access revocation handling)

- [ ] 7.4. Create webhook renewal cron endpoint
  - Create `src/app/api/cron/calendar-webhook-renewal/route.ts`
  - Implement POST handler for scheduled webhook renewal
  - Use cron auth middleware
  - Call `renewExpiringWebhooks()`
  - Return summary of renewals
  - Ref: Req 16 (Data Retention), Req 26 (Monitoring)

---

## Phase 8: Admin Settings UI

- [ ] 8. Create calendar connection component
  - Create `src/components/admin/calendar/CalendarConnectionCard.tsx`
  - Display connection status (connected/disconnected)
  - Show connected email and calendar name when connected
  - Show "Connect Google Calendar" button when disconnected
  - Show "Disconnect" button when connected
  - Display last sync timestamp
  - Display total synced appointments count
  - Handle loading and error states
  - Ref: Req 13 (Settings UI and Connection Management)

- [ ] 8.1. Create OAuth connection handler component
  - Create `src/components/admin/calendar/GoogleOAuthButton.tsx`
  - Implement "Connect Google Calendar" button
  - Call `/api/admin/calendar/auth/start` on click
  - Redirect to Google OAuth URL
  - Handle connection errors with user-friendly messages
  - Show loading state during redirect
  - Ref: Req 13.2 (Connect button)

- [ ] 8.2. Create sync settings form component
  - Create `src/components/admin/calendar/SyncSettingsForm.tsx`
  - Display toggle for auto-sync enabled/disabled
  - Display multi-select for sync statuses (confirmed, pending, etc.)
  - Display toggle for sync past appointments
  - Display toggle for sync completed appointments
  - Handle form submission with optimistic updates
  - Show validation errors
  - Ref: Req 10 (Sync Preferences)

- [ ] 8.3. Create calendar selector component
  - Create `src/components/admin/calendar/CalendarSelector.tsx`
  - Fetch available calendars from API
  - Display dropdown/select for calendar selection
  - Show primary calendar as default
  - Handle calendar change with confirmation dialog
  - Save selected calendar to connection
  - Ref: Req 9 (Calendar Selection)

- [ ] 8.4. Create calendar settings page
  - Create `src/app/(admin)/admin/settings/calendar/page.tsx`
  - Compose page with CalendarConnectionCard
  - Add SyncSettingsForm when connected
  - Add CalendarSelector when connected
  - Handle OAuth callback status (success/error) from URL params
  - Show success toast on connection
  - Show error messages on failures
  - Ref: Req 13 (Settings UI)

- [ ] 8.5. Add calendar settings to admin settings navigation
  - Modify `src/components/admin/settings/SettingsNav.tsx`
  - Add "Calendar Integration" link to settings menu
  - Use Calendar icon from Lucide
  - Only show if user is admin
  - Ref: Req 13.1 (Calendar Integration section)

---

## Phase 9: Import Wizard UI

- [ ] 9. Create import wizard container component
  - Create `src/components/admin/calendar/import/ImportWizard.tsx`
  - Implement 4-step wizard flow with step indicator
  - Step 1: Date range selection
  - Step 2: Event selection
  - Step 3: Mapping forms
  - Step 4: Review and confirm
  - Track wizard state and navigation
  - Handle cancel to discard all selections
  - Ref: Req 14 (Import Wizard Flow)

- [ ] 9.1. Create date range step component
  - Create `src/components/admin/calendar/import/DateRangeStep.tsx`
  - Display date range picker (dateFrom, dateTo)
  - Default to next 30 days
  - Validate date range
  - Fetch preview on "Next" click
  - Show loading state during fetch
  - Ref: Req 14.2 (Step 1 - date range)

- [ ] 9.2. Create event selection step component
  - Create `src/components/admin/calendar/import/EventSelectionStep.tsx`
  - Display fetched events with checkboxes
  - Show event title, start time, duration, description preview
  - Show warning badge for potential duplicates
  - Show suggestion for matched customers/pets
  - Allow multi-select for batch import
  - Ref: Req 14.3 (Step 2 - event selection)

- [ ] 9.3. Create event mapping form component
  - Create `src/components/admin/calendar/import/EventMappingForm.tsx`
  - For each selected event, display mapping form
  - Customer selector (search existing or create new)
  - Pet selector (filtered by customer, or create new)
  - Service selector (from active services)
  - Addon selector (multi-select)
  - Notes input
  - Show validation errors inline
  - Ref: Req 14.4 (Step 3 - mapping), Req 27 (Validation)

- [ ] 9.4. Create review step component
  - Create `src/components/admin/calendar/import/ReviewStep.tsx`
  - Display summary of all appointments to be created
  - Show customer, pet, service, date/time for each
  - Show warnings (past events, duration mismatch)
  - "Confirm Import" button to execute
  - Show import progress and results
  - Ref: Req 14.5-14.6 (Review and confirm)

- [ ] 9.5. Create import button and modal trigger
  - Create `src/components/admin/calendar/ImportButton.tsx`
  - Display "Import from Calendar" button
  - Only show when calendar is connected
  - Open ImportWizard in modal on click
  - Ref: Req 7 (Import from Google Calendar)

---

## Phase 10: Sync Status Indicators

- [ ] 10. Create sync status badge component
  - Create `src/components/admin/calendar/SyncStatusBadge.tsx`
  - Display sync status icon (checkmark, clock, error, none)
  - Green checkmark for synced
  - Clock/pending for sync in progress
  - Red error icon for failed with tooltip
  - No indicator for not eligible
  - Show last sync timestamp on hover
  - Ref: Req 12.1-12.5 (Sync Status Indicators)

- [ ] 10.1. Create sync history popover component
  - Create `src/components/admin/calendar/SyncHistoryPopover.tsx`
  - Display sync history for appointment on click
  - Show timestamps, actions (created, updated, deleted), results
  - Link to Google Calendar event if synced
  - Handle loading and empty states
  - Ref: Req 12.6-12.7 (Sync history)

- [ ] 10.2. Integrate sync status into appointments table
  - Modify `src/components/admin/appointments/AppointmentsTable.tsx`
  - Add SyncStatusBadge column when calendar connected
  - Fetch sync status for visible appointments
  - Update status after manual sync
  - Ref: Req 12 (Sync Status Tracking)

- [ ] 10.3. Add manual sync button to appointment row
  - Modify `src/components/admin/appointments/AppointmentRow.tsx`
  - Add "Sync to Calendar" button when auto-sync disabled
  - Show sync status after manual trigger
  - Handle loading and error states
  - Ref: Req 11.1-11.2 (Manual sync triggers)

- [ ] 10.4. Create dashboard sync health widget
  - Create `src/components/admin/dashboard/CalendarSyncWidget.tsx`
  - Display connection status
  - Display synced count, pending count, failed count
  - Show last sync time
  - Link to calendar settings
  - Show "Sync All Now" shortcut button
  - Ref: Req 26 (Admin Dashboard), Req 12.8 (Sync health metrics)

---

## Phase 11: Error Handling and Recovery

- [ ] 11. Create retry mechanism for failed syncs
  - Create `src/lib/calendar/sync/retry-queue.ts`
  - Implement `queueForRetry()` for failed sync operations
  - Store retry attempts with exponential backoff timing
  - Maximum 3 retries before marking as failed
  - Process retry queue periodically
  - Ref: Req 5.6 (Retry logic), Req 18 (Network Failure Handling)

- [ ] 11.1. Create sync error recovery UI
  - Create `src/components/admin/calendar/SyncErrorRecovery.tsx`
  - Display list of failed syncs with error messages
  - Show "Retry" button for individual failures
  - Show "Retry All" button for batch retry
  - Show "Resync" button to delete and recreate event
  - Handle rollback option for bulk sync failures
  - Ref: Req 20 (Rollback and Error Recovery)

- [ ] 11.2. Create quota warning component
  - Create `src/components/admin/calendar/QuotaWarning.tsx`
  - Display warning when API quota exceeds 80%
  - Show estimated time until quota reset
  - Suggest throttling non-critical operations
  - Link to Google Cloud Console for quota monitoring
  - Ref: Req 17.4-17.5 (Quota management), Req 26.5 (Alert threshold)

- [ ] 11.3. Implement pause on consecutive failures
  - Modify `src/lib/calendar/sync/auto-sync-trigger.ts`
  - Track consecutive failures per connection
  - If 10 consecutive failures, pause auto-sync
  - Send notification to admin
  - Require manual re-enable of auto-sync
  - Ref: Req 16.3 (Pause on failures)

---

## Phase 12: Testing

- [ ] 12. Create unit tests for core calendar utilities
  - Create tests in `src/lib/calendar/__tests__/`
  - Test encryption/decryption (encryption.test.ts)
  - Test OAuth client (oauth.test.ts)
  - Test token manager (token-manager.test.ts)
  - Test event mapping (mapping.test.ts)
  - Test sync criteria (sync-criteria.test.ts)
  - Ref: Req 29.1-29.4 (Testing requirements)

- [ ] 12.1. Create integration tests for API routes
  - Create tests in `src/app/api/admin/calendar/__tests__/`
  - Test OAuth flow with mocked Google API
  - Test sync endpoints with mocked calendar client
  - Test import endpoints with sample events
  - Test settings endpoints
  - Test webhook endpoint with sample notifications
  - Ref: Req 29.2 (Integration tests)

- [ ] 12.2. Create mock Google Calendar API
  - Create `src/mocks/google-calendar.ts`
  - Mock events.list, events.insert, events.update, events.delete
  - Mock calendar list for calendar selection
  - Mock OAuth token exchange
  - Support configurable responses for test scenarios
  - Ref: Req 29.2 (Mocked Google Calendar API)

- [ ] 12.3. Create E2E tests for calendar integration
  - Create `e2e/calendar-integration.spec.ts`
  - Test OAuth connection flow
  - Test calendar settings modification
  - Test manual sync operation
  - Test import wizard flow
  - Test sync status display
  - Ref: Req 29.1-29.8 (Test coverage)

---

## Phase 13: Documentation and Deployment

- [ ] 13. Update architecture documentation
  - Update `docs/architecture/ARCHITECTURE.md`
  - Add calendar integration section with data flow diagrams
  - Document new database tables and relationships
  - Document new API routes
  - Add to service integration guides
  - Ref: Req 30.5-30.6 (Architecture documentation)

- [ ] 13.1. Create user-facing help documentation
  - Create `docs/help/calendar-integration.md`
  - Include step-by-step setup instructions with screenshots
  - Include troubleshooting guide for common errors
  - Document sync behavior and settings
  - Document import wizard usage
  - Ref: Req 30.1-30.3 (User documentation)

- [ ] 13.2. Create environment variable documentation
  - Update `.env.example` with new variables
  - Document GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - Document CALENDAR_TOKEN_ENCRYPTION_KEY generation
  - Document webhook URL requirements
  - Ref: Req 30.4 (API documentation)

- [ ] 13.3. Create deployment checklist
  - Create `docs/deploy/calendar-integration-checklist.md`
  - Pre-deployment: Database migration, env vars, Google Cloud setup
  - Deployment: Feature flag, gradual rollout
  - Post-deployment: Verify OAuth, test sync, monitor errors
  - Rollback instructions
  - Ref: Req 30 (Documentation)

---

## Requirements Traceability Matrix

| Task | Requirements Covered |
|------|---------------------|
| 1-1.5 | Req 1, 2, 15, 21, 28 |
| 2-2.5 | Req 1, 2, 9, 10, 13 |
| 3-3.3 | Req 3, 4, 8, 17, 18, 22 |
| 4-4.5 | Req 4, 5, 6, 11, 12, 21, 26 |
| 5-5.4 | Req 4, 5, 16 |
| 6-6.4 | Req 7, 8, 14, 27 |
| 7-7.4 | Req 9, 16, 19, 23, 26 |
| 8-8.5 | Req 9, 10, 13 |
| 9-9.5 | Req 7, 14, 27 |
| 10-10.4 | Req 11, 12, 26 |
| 11-11.3 | Req 16, 17, 18, 20 |
| 12-12.3 | Req 29 |
| 13-13.3 | Req 30 |

All 30 requirements are covered across the implementation tasks.
