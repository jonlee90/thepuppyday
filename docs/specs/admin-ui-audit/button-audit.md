# AdminButton Audit — Raw Button Patterns

**Total files needing conversion: 31**

Files already using `AdminButton` are excluded. Files marked with `*` already import AdminButton but have additional raw buttons.

---

## Calendar (9 files) — HIGH PRIORITY

- [ ] `calendar/CalendarConnectionCard.tsx` — 3 buttons (outline, ghost)
- [ ] `calendar/CalendarSelector.tsx` — ghost buttons
- [ ] `calendar/GoogleOAuthButton.tsx` — 1 primary `bg-[#F59E0B]` (amber, wrong color)
- [ ] `calendar/PausedSyncBanner.tsx` — 2 buttons (primary charcoal, ghost)
- [ ] `calendar/SyncErrorRecovery.tsx` — ~6 buttons (3 primary, 3 ghost)
- [ ] `calendar/SyncSettingsForm.tsx` — 1 primary `bg-[#F59E0B]` (amber, wrong color)
- [ ] `calendar/import/EventMappingForm.tsx` — ghost buttons
- [ ] `calendar/import/ImportButton.tsx` — 1 primary `bg-[#F59E0B]` (amber, wrong color)
- [ ] `calendar/import/ImportWizard.tsx` — ghost + primary `bg-[#F59E0B]` (amber)

## Appointments (7 files)

- [ ] `appointments/AppointmentCalendar.tsx` — ghost buttons
- [ ] `appointments/AppointmentListView.tsx` — ghost buttons
- [ ] `appointments/CSVImportModal.tsx` — ghost buttons
- [ ] `appointments/csv/DuplicateHandler.tsx`* — ghost buttons
- [ ] `appointments/csv/FileUploadStep.tsx`* — ghost buttons
- [ ] `appointments/csv/ImportSummary.tsx` — ghost buttons
- [ ] `appointments/csv/ValidationPreview.tsx` — ghost buttons

## Dashboard (1 file)

- [ ] `dashboard/CalendarSyncWidget.tsx` — 1 primary, 1 secondary

## Marketing (2 files)

- [ ] `marketing/CampaignList.tsx` — ~6 buttons (primary + ghost)
- [ ] `marketing/CreateCampaignModal.tsx` — primary buttons

## Notifications (3 files)

- [ ] `notifications/BulkActions.tsx` — 1 outline, 1 primary, ghost
- [ ] `notifications/NotificationDetailModal.tsx`* — 1 primary, 1 outline, ghost
- [ ] `notifications/NotificationTable.tsx` — ghost buttons

## Report Cards (1 file)

- [ ] `report-cards/ReportCardActions.tsx`* — 1 primary, 1 outline

## Settings (7 files)

- [ ] `settings/SettingsCard.tsx` — `bg-[#F59E0B]` (decorative, review)
- [ ] `settings/booking/BlockedDatesCalendar.tsx` — ghost buttons
- [ ] `settings/booking/BlockedDatesManager.tsx` — ghost buttons
- [ ] `settings/booking/RecurringBlockedDays.tsx` — ghost buttons
- [ ] `settings/staff/CommissionSettings.tsx` — ghost buttons
- [ ] `settings/staff/EarningsReport.tsx` — 1 outline
- [ ] `settings/staff/StaffDirectory.tsx`* — 1 primary

## Analytics (1 file)

- [ ] `analytics/GroomerSelector.tsx` — ghost buttons

---

## Key Issues

1. **Amber buttons (wrong brand)**: 4 calendar files use `bg-[#F59E0B]` instead of charcoal
2. **5 files** already import AdminButton but still have unconverted raw buttons
3. **24 files** use `btn btn-ghost` — candidates for `AdminButton variant="ghost"`
