#!/bin/bash

# Tasks 0011-0051
declare -A tasks=(
  ["0011"]="calendar-sync-settings-endpoint|Create calendar sync settings endpoint|src/app/api/admin/calendar/settings/route.ts|0006|GET/PUT handlers for sync settings|Req 10, 4"
  ["0012"]="available-calendars-endpoint|Create available calendars list endpoint|src/app/api/admin/calendar/calendars/route.ts|0004|List admin's Google Calendars|Req 9.1"
  ["0013"]="appointment-event-mapper|Create appointment-to-event mapper|src/lib/calendar/mapping.ts|0001|Convert appointment to calendar event|Req 3, 22"
  ["0014"]="sync-criteria-checker|Create sync criteria checker|src/lib/calendar/sync-criteria.ts|0011|Check if appointment should sync|Req 4, 10"
  ["0015"]="google-calendar-client-wrapper|Create Google Calendar API client wrapper|src/lib/calendar/google-client.ts|0004|API client with rate limiting|Req 17, 18"
  ["0016"]="event-mapping-repository|Create event mapping repository|src/lib/calendar/event-mapping-repository.ts|0002|Database operations for event mappings|Req 8"
  ["0017"]="push-sync-service|Create push sync service|src/lib/calendar/sync/push.ts|0013,0014,0015|Main sync function for app to calendar|Req 5"
  ["0018"]="sync-logger-utility|Create sync logger utility|src/lib/calendar/sync-logger.ts|0002|Record sync operations|Req 21, 15.6"
  ["0019"]="manual-sync-endpoint|Create manual sync API endpoint|src/app/api/admin/calendar/sync/manual/route.ts|0017|Single appointment sync|Req 11"
  ["0020"]="bulk-sync-job|Create bulk sync background job|src/lib/calendar/sync/bulk-sync-job.ts|0017|Process appointment batches|Req 6, 17"
  ["0021"]="bulk-sync-endpoint|Create bulk sync API endpoint|src/app/api/admin/calendar/sync/bulk/route.ts|0020|Initiate bulk sync|Req 6, 11.3"
  ["0022"]="sync-status-endpoint|Create sync status API endpoint|src/app/api/admin/calendar/sync/status/route.ts|0018|Return sync health status|Req 12, 26"
  ["0023"]="auto-sync-trigger|Create appointment change listener|src/lib/calendar/sync/auto-sync-trigger.ts|0017|Auto-sync on appointment changes|Req 5.1, 4.2"
  ["0024"]="integrate-status-update-sync|Integrate auto-sync into status update|src/app/api/admin/appointments/[id]/status/route.ts|0023|Trigger sync on status change|Req 4.2-4.6"
  ["0025"]="integrate-creation-sync|Integrate auto-sync into appointment creation|src/app/api/admin/appointments/route.ts|0023|Trigger sync on creation|Req 5.1, 5.8"
  ["0026"]="integrate-update-sync|Integrate auto-sync into appointment updates|src/app/api/admin/appointments/[id]/route.ts|0023|Trigger sync on updates|Req 5.2-5.5"
  ["0027"]="deletion-sync-handler|Create appointment deletion sync handler|src/lib/calendar/sync/delete-handler.ts|0016|Remove calendar events on deletion|Req 5.4, 16.1"
  ["0028"]="event-description-parser|Create event description parser|src/lib/calendar/import/parser.ts|0013|Extract data from calendar events|Req 27, 7.3"
  ["0029"]="duplicate-detection-service|Create duplicate detection service|src/lib/calendar/import/duplicate-detection.ts|0016|Find matching appointments|Req 8"
  ["0030"]="import-preview-endpoint|Create import preview endpoint|src/app/api/admin/calendar/import/preview/route.ts|0015,0028|Preview calendar events for import|Req 7, 14.2-14.3"
  ["0031"]="import-confirm-endpoint|Create import confirmation endpoint|src/app/api/admin/calendar/import/confirm/route.ts|0029,0030|Execute calendar import|Req 7.4-7.9, 27"
  ["0032"]="import-validation-service|Create import validation service|src/lib/calendar/import/validation.ts|0029|Validate import data|Req 27"
  ["0033"]="webhook-registration-service|Create webhook registration service|src/lib/calendar/webhook/registration.ts|0015|Setup push notifications|Req 23.6"
  ["0034"]="webhook-endpoint|Create webhook endpoint|src/app/api/admin/calendar/webhook/route.ts|0033|Handle calendar push notifications|Req 19"
  ["0035"]="webhook-event-processor|Create webhook event processor|src/lib/calendar/webhook/processor.ts|0034|Process webhook changes|Req 19, 4.8"
  ["0036"]="webhook-renewal-job|Create webhook renewal job|src/lib/calendar/webhook/renewal.ts|0033|Renew expiring webhooks|Req 9.4"
  ["0037"]="webhook-renewal-cron|Create webhook renewal cron endpoint|src/app/api/cron/calendar-webhook-renewal/route.ts|0036|Scheduled webhook renewal|Req 16, 26"
  ["0038"]="calendar-connection-card|Create calendar connection component|src/components/admin/calendar/CalendarConnectionCard.tsx|0010|Display connection status UI|Req 13"
  ["0039"]="google-oauth-button|Create OAuth connection handler|src/components/admin/calendar/GoogleOAuthButton.tsx|0007|Connect Google Calendar button|Req 13.2"
  ["0040"]="sync-settings-form|Create sync settings form|src/components/admin/calendar/SyncSettingsForm.tsx|0011|Sync preferences UI|Req 10"
  ["0041"]="calendar-selector|Create calendar selector|src/components/admin/calendar/CalendarSelector.tsx|0012|Calendar selection dropdown|Req 9"
  ["0042"]="calendar-settings-page|Create calendar settings page|src/app/(admin)/admin/settings/calendar/page.tsx|0038,0039,0040,0041|Main settings page|Req 13"
  ["0043"]="settings-nav-link|Add calendar to settings nav|src/components/admin/settings/SettingsNav.tsx|0042|Navigation link|Req 13.1"
  ["0044"]="import-wizard-container|Create import wizard container|src/components/admin/calendar/import/ImportWizard.tsx|0030|4-step import wizard|Req 14"
  ["0045"]="date-range-step|Create date range step|src/components/admin/calendar/import/DateRangeStep.tsx|0044|Step 1 date selection|Req 14.2"
  ["0046"]="event-selection-step|Create event selection step|src/components/admin/calendar/import/EventSelectionStep.tsx|0044,0045|Step 2 event selection|Req 14.3"
  ["0047"]="event-mapping-form|Create event mapping form|src/components/admin/calendar/import/EventMappingForm.tsx|0046|Step 3 mapping forms|Req 14.4, 27"
  ["0048"]="review-step|Create review step|src/components/admin/calendar/import/ReviewStep.tsx|0047,0031|Step 4 review and confirm|Req 14.5-14.6"
  ["0049"]="import-button|Create import button and modal|src/components/admin/calendar/ImportButton.tsx|0044|Import trigger button|Req 7"
  ["0050"]="sync-status-badge|Create sync status badge|src/components/admin/calendar/SyncStatusBadge.tsx|0022|Display sync status icon|Req 12.1-12.5"
  ["0051"]="sync-history-popover|Create sync history popover|src/components/admin/calendar/SyncHistoryPopover.tsx|0018|Show sync history|Req 12.6-12.7"
)

for task_id in $(echo "${!tasks[@]}" | tr ' ' '\n' | sort); do
  IFS='|' read -r name title files deps notes reqs <<< "${tasks[$task_id]}"
  cat > "${task_id}-${name}.md" << EOF
# Task ${task_id}: ${title}

## Description
${notes}

## Files to Create/Modify
- ${files}

## Dependencies
${deps}

## Acceptance Criteria
- [ ] Implementation complete
- [ ] Unit tests written and passing
- [ ] Integration tested
- [ ] Code reviewed

## Requirements Coverage
${reqs}

## Estimated Effort
2-3 hours
EOF
done

echo "Created all remaining task files"
