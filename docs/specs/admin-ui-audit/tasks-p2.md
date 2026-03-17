# Admin UI Consistency Audit - P2: Fix Violations

## Overview

P2 fixes direct violations of established patterns: `<dialog>` elements, browser `alert()`/`confirm()` calls, inconsistent form inputs, table headers, and wrong button colors.

**Progress**: 7/7 tasks complete (100%)

**Document References**:
- Requirements: `docs/specs/admin-ui-audit/requirements.md`

---

## Section P2.1: Replace dialog Elements with AdminModal

### Task 0137: Replace dialog Modals with AdminModal
- [ ] Convert `AppointmentDetailModal` to use AdminModal (if it uses `<dialog>`)
- [ ] Convert `CalendarConnectionCard` modal to use AdminModal
- [ ] Convert `PausedSyncBanner` modal to use AdminModal
- [ ] Convert `SyncErrorRecovery` modal to use AdminModal
- [ ] Verify each converted modal: focus trap works, escape closes, animations play, no `<dialog>` element remains
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Zero `<dialog>` elements exist in admin components. All modals use AdminModal or the equivalent div-based pattern.
- **References**: REQ-7
- **Files**: `src/components/admin/appointments/AppointmentDetailModal.tsx`, `src/components/admin/calendar/CalendarConnectionCard.tsx`, `src/components/admin/calendar/PausedSyncBanner.tsx`, `src/components/admin/calendar/SyncErrorRecovery.tsx`

---

## Section P2.2: Replace alert() and confirm() with Toast/ConfirmationModal

### Task 0138: Replace alert()/confirm() in Banner and Content Components
- [ ] Replace 3x `alert()` in `BannerList.tsx` with `toast.success()` or `toast.error()`
- [ ] Replace 1x `confirm()` in `BannerEditor.tsx` with `ConfirmationModal`
- [ ] Add ConfirmationModal state management (isOpen, onConfirm callback, pending item)
- [ ] Ensure toast messages follow project convention: short, past tense for success, "Failed to..." for errors
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No `alert()` or `confirm()` calls in BannerList or BannerEditor. All use toast/ConfirmationModal.
- **References**: REQ-8, REQ-12, REQ-13
- **Files**: `src/components/admin/settings/banners/BannerList.tsx`, `src/components/admin/settings/banners/BannerEditor.tsx`

### Task 0139: Replace alert()/confirm() in Service and AddOn Forms
- [ ] Replace 1x `confirm()` in `AddOnForm.tsx` with `ConfirmationModal`
- [ ] Replace 1x `confirm()` in `ServiceForm.tsx` with `ConfirmationModal`
- [ ] Add ConfirmationModal state (isOpen, onConfirm, pendingAction) to each
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No `confirm()` calls in AddOnForm or ServiceForm. Destructive actions use ConfirmationModal.
- **References**: REQ-8, REQ-12
- **Files**: `src/components/admin/settings/services/AddOnForm.tsx`, `src/components/admin/settings/services/ServiceForm.tsx`

### Task 0140: Replace alert()/confirm() in Notification Components
- [ ] Replace 2x `confirm()` in `CampaignList.tsx` with `ConfirmationModal`
- [ ] Replace 1x `alert()` in `BulkActions.tsx` with `toast.error()` or `toast.success()`
- [ ] Replace 1x `alert()` in `NotificationDetailModal.tsx` with toast
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No `alert()` or `confirm()` calls in notification components.
- **References**: REQ-8, REQ-12, REQ-13
- **Files**: `src/components/admin/notifications/CampaignList.tsx`, `src/components/admin/notifications/BulkActions.tsx`, `src/components/admin/notifications/NotificationDetailModal.tsx`

### Task 0141: Replace alert() in ExportMenu
- [ ] Replace 5x `alert()` in `ExportMenu.tsx` with `toast.success()` or `toast.error()` as appropriate
- [ ] Ensure export success/failure messages are descriptive (e.g., "Export downloaded", "Failed to export data")
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No `alert()` calls in ExportMenu. All feedback uses toast.
- **References**: REQ-8, REQ-13
- **Files**: `src/components/admin/notifications/ExportMenu.tsx`

---

## Section P2.3: Standardize Form Inputs

### Task 0142: Standardize Form Input Styling Across Admin Components
- [ ] Update `GalleryImageEditModal` inputs: `border-[#434E54]/20`, `focus:ring-2 focus:ring-[#434E54]/30`, `font-medium` labels, `text-[#D4A574]` required asterisks
- [ ] Update `AddOnForm` inputs to match (if not already matching after Task 0139)
- [ ] Update `ServiceForm` inputs to match
- [ ] Update `BannerEditor` inputs to match
- [ ] Update `CustomerTable` inline edit inputs to match (if applicable)
- [ ] Verify all updated inputs match StaffForm gold standard styling
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All admin form inputs use consistent border, focus ring, label weight, and asterisk color matching the gold standard.
- **References**: REQ-3
- **Files**: `src/components/admin/gallery/GalleryImageEditModal.tsx`, `src/components/admin/settings/services/AddOnForm.tsx`, `src/components/admin/settings/services/ServiceForm.tsx`, `src/components/admin/settings/banners/BannerEditor.tsx`, `src/components/admin/customers/CustomerTable.tsx`

---

## Section P2.4: Fix Table Headers and Button Colors

### Task 0143: Standardize Table Headers and Fix Amber Buttons
- [ ] Update `NotificationTable` table headers to use `bg-[#EAE0D5]` with consistent text styling
- [ ] Fix amber/yellow buttons in `ImportButton.tsx` to use charcoal (`bg-[#434E54]` or `AdminButton`)
- [ ] Fix amber/yellow buttons in `SyncSettingsForm.tsx` to use charcoal
- [ ] Verify all table headers across admin use consistent `bg-[#EAE0D5]` background
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: NotificationTable headers match other admin tables. No amber buttons remain in calendar section.
- **References**: REQ-9
- **Files**: `src/components/admin/notifications/NotificationTable.tsx`, `src/components/admin/calendar/ImportButton.tsx`, `src/components/admin/calendar/SyncSettingsForm.tsx`
