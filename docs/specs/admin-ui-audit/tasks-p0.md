# Admin UI Consistency Audit - P0: Shared Components

## Overview

P0 creates the foundational shared components that all subsequent tasks depend on. These have the highest impact since they fix patterns across 40+ files.

**Progress**: 6/6 tasks complete (100%)

**Document References**:
- Requirements: `docs/specs/admin-ui-audit/requirements.md`
- Gold Standard: `src/components/admin/settings/staff/StaffForm.tsx`

---

## Section P0.1: AdminModal Wrapper

### Task 0127: Create AdminModal Shared Component
- [x] Create `src/components/admin/shared/AdminModal.tsx` extracting the modal pattern from StaffForm
- [x] Props: `isOpen`, `onClose`, `title`, `icon` (Lucide icon component), `iconColor?` (default `text-[#434E54]`), `children`, `footer?`, `maxWidth?` (default `max-w-2xl`), `className?`
- [x] Include: AnimatePresence, fixed inset-0 backdrop (`bg-black/50`), Framer Motion scale+fade, `createFocusTrap` from `@/lib/utils/focus-trap`, escape key handler, scroll lock
- [x] Use `<div role="dialog" aria-modal="true">` (never `<dialog>`)
- [x] Warm header: icon in `bg-[#EAE0D5] rounded-xl p-3`, title in `text-xl font-semibold text-[#434E54]`
- [x] Footer slot: `bg-[#EAE0D5]/30 px-6 py-4 rounded-b-2xl` with flex layout for buttons
- [x] Export from `src/components/admin/shared/index.ts` barrel file
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: AdminModal renders with all gold-standard styling, traps focus, closes on escape, prevents body scroll. Matches StaffForm modal exactly.
- **References**: REQ-1, REQ-7
- **Files**: `src/components/admin/shared/AdminModal.tsx`, `src/components/admin/shared/index.ts`

### Task 0128: Migrate StaffForm to Use AdminModal
- [x]Refactor `StaffForm.tsx` to use `AdminModal` instead of inline modal markup
- [x]Verify all existing behavior is preserved (focus trap, escape, animations)
- [x]This serves as validation that AdminModal works correctly before mass migration
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: StaffForm renders identically before and after refactor. No visual or behavioral regression.
- **References**: REQ-1
- **Files**: `src/components/admin/settings/staff/StaffForm.tsx`

---

## Section P0.2: Extract formatTime12h Utility

### Task 0129: Extract formatTime12h to Shared Utility
- [x]Create `src/lib/utils/time.ts` with `formatTime12h(time: string): string` function
- [x]Migrate usage in `src/components/admin/waitlist/WaitlistRow.tsx`
- [x]Migrate usage in `src/components/admin/waitlist/WaitlistTable.tsx`
- [x]Migrate usage in `src/components/admin/waitlist/MatchingWaitlistList.tsx`
- [x]Migrate usage in `src/components/admin/waitlist/EditWaitlistModal.tsx`
- [x]Remove all inline `formatTime12h` definitions from above files
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Single `formatTime12h` definition in `src/lib/utils/time.ts`. All 4 waitlist files import from shared utility. No duplicate definitions remain.
- **References**: REQ-6
- **Files**: `src/lib/utils/time.ts`, `src/components/admin/waitlist/WaitlistRow.tsx`, `src/components/admin/waitlist/WaitlistTable.tsx`, `src/components/admin/waitlist/MatchingWaitlistList.tsx`, `src/components/admin/waitlist/EditWaitlistModal.tsx`

---

## Section P0.3: Wire AdminButton Everywhere

### Task 0130: Audit and List All Raw Button Patterns in Admin Components
- [x]Search all files under `src/components/admin/` and `src/app/(admin)/` for raw `btn btn-primary`, `bg-[#434E54]` on buttons, and `btn btn-ghost` patterns that should use `AdminButton`
- [x]Create a checklist file at `docs/specs/admin-ui-audit/button-audit.md` listing every file and line needing conversion
- [x]Categorize by component area (settings, appointments, customers, notifications, calendar, gallery, etc.)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Complete inventory of all files with raw button patterns. Each entry has file path and approximate count of buttons to convert.
- **References**: REQ-2
- **Files**: `docs/specs/admin-ui-audit/button-audit.md`

### Task 0131: Replace Raw Button Patterns with AdminButton (Batch 1 - High-traffic pages)
- [x]Convert buttons in `src/components/admin/appointments/` (all files)
- [x]Convert buttons in `src/components/admin/customers/` (all files)
- [x]Convert buttons in `src/components/admin/dashboard/` (all files)
- [x]Ensure correct `variant` prop usage: `primary` for main actions, `secondary` for cancel/back, `danger` for destructive
- [x]Ensure correct `size` prop usage based on context
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No raw `btn btn-primary bg-[#434E54]` patterns remain in appointments, customers, or dashboard components. All use `AdminButton`.
- **References**: REQ-2
- **Files**: All files under `src/components/admin/appointments/`, `src/components/admin/customers/`, `src/components/admin/dashboard/`

### Task 0132: Replace Raw Button Patterns with AdminButton (Batch 2 - Remaining pages)
- [x]Convert buttons in `src/components/admin/notifications/` (all files)
- [x]Convert buttons in `src/components/admin/calendar/` (all files)
- [x]Convert buttons in `src/components/admin/gallery/` (all files)
- [x]Convert buttons in `src/components/admin/settings/` (excluding staff/ which already uses it)
- [x]Convert buttons in any remaining admin component files identified in Task 0130
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No raw `btn btn-primary bg-[#434E54]` patterns remain anywhere in admin components. All use `AdminButton`.
- **References**: REQ-2
- **Files**: All remaining files under `src/components/admin/`
