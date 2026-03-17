# Admin UI Consistency Audit - P4: Cleanup

## Overview

P4 handles cleanup tasks: deleting example files, fixing mock data connections, and standardizing breadcrumbs.

**Progress**: 3/3 tasks complete (100%)

**Document References**:
- Requirements: `docs/specs/admin-ui-audit/requirements.md`

---

## Section P4.1: Delete Example Files

### Task 0149: Delete Unused Example Files
- [x] Delete `src/components/admin/settings/SettingsFormExample.tsx`
- [x] Delete `src/components/admin/settings/BlockedDatesExample.tsx`
- [x] Delete `src/components/admin/settings/BusinessHoursEditorExample.tsx`
- [x] Delete `src/components/admin/settings/RecurringBlockedDaysExample.tsx`
- [x] Delete `src/components/admin/calendar/CalendarErrorRecoveryExample.tsx`
- [x] Verify no imports reference these files (search for each filename)
- [x] Run `npm run build` to confirm no broken imports
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All 5 example files deleted. Build passes. No broken imports.
- **References**: Cleanup
- **Files**: Listed above

---

## Section P4.2: Fix Mock Data

### Task 0150: Connect AddOnForm Breeds to Real API
- [x] Find mock breeds data in `AddOnForm.tsx` (hardcoded breed list)
- [x] Replace with real API call to fetch breeds from Supabase `breeds` table
- [x] Use existing breed fetching pattern from other components (check PetForm for reference)
- [x] Add loading state while breeds load
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: AddOnForm fetches breeds from Supabase instead of using hardcoded mock data.
- **References**: Cleanup
- **Files**: `src/components/admin/settings/services/AddOnForm.tsx`

---

## Section P4.3: Standardize Breadcrumbs

### Task 0151: Audit and Standardize Admin Breadcrumbs
- [x] Audit which admin pages have breadcrumbs and which do not
- [x] Decide on consistent approach: either add breadcrumbs to all detail/sub-pages or remove them entirely
- [x] If keeping: create `src/components/admin/shared/AdminBreadcrumb.tsx` with consistent styling
- [x] If removing: delete all breadcrumb implementations
- [x] Ensure consistent navigation pattern across all admin pages
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Breadcrumbs either consistently present on all sub-pages or consistently absent. No mixed approach.
- **References**: Cleanup
- **Files**: `src/components/admin/shared/AdminBreadcrumb.tsx` (if creating), various admin page files
