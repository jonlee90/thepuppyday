# Admin UI Consistency Audit - P1: Page Layout Standardization

## Overview

P1 standardizes the page-level layout patterns across all admin pages: removing redundant background wrappers, unifying container widths, and normalizing heading/subtitle styles.

**Progress**: 4/4 tasks complete (100%)

**Document References**:
- Requirements: `docs/specs/admin-ui-audit/requirements.md`

---

## Section P1.1: Remove Redundant Background Wrappers

### Task 0133: Remove Redundant min-h-screen bg-[#F8EEE5] from Admin Pages
- [ ] Search all files under `src/app/(admin)/` for `min-h-screen` and/or `bg-[#F8EEE5]` on page wrappers
- [ ] Remove these classes where the admin layout already provides them (verify in `src/app/(admin)/layout.tsx`)
- [ ] Expected files: approximately 10+ page.tsx files across admin routes
- [ ] Verify no visual change after removal (layout handles background)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: No admin page.tsx file contains redundant `min-h-screen bg-[#F8EEE5]` wrappers. Layout provides these globally.
- **References**: REQ-4
- **Files**: `src/app/(admin)/layout.tsx`, all `page.tsx` files under `src/app/(admin)/`

---

## Section P1.2: Standardize Container Pattern

### Task 0134: Standardize Admin Page Container to max-w-7xl mx-auto space-y-6
- [ ] Audit all admin page.tsx files for inconsistent container patterns (varying max-w, padding, spacing)
- [ ] Standardize all to `max-w-7xl mx-auto space-y-6 p-6` (or the pattern used by the majority/gold standard)
- [ ] Ensure consistent padding on mobile (`px-4 sm:px-6`)
- [ ] Document any pages that intentionally need different widths (e.g., full-width calendar)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All standard admin pages use the same container pattern. Exceptions are documented.
- **References**: REQ-4
- **Files**: All `page.tsx` files under `src/app/(admin)/`

---

## Section P1.3: Standardize Headings and Subtitles

### Task 0135: Standardize Admin Page Headings to text-3xl font-bold text-[#434E54]
- [ ] Search all admin pages and components for page-level headings (h1, h2 used as page titles)
- [ ] Standardize all to `text-3xl font-bold text-[#434E54]`
- [ ] Fix any that use different sizes (text-2xl, text-4xl) or colors
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All admin page headings use `text-3xl font-bold text-[#434E54]` consistently.
- **References**: REQ-5
- **Files**: All page-level heading elements across `src/app/(admin)/` and `src/components/admin/`

### Task 0136: Standardize Admin Subtitle Color to text-[#434E54]/60
- [ ] Search for subtitle/description text under page headings across admin
- [ ] Standardize all to `text-[#434E54]/60` (replace `text-gray-500`, `text-gray-600`, `text-[#434E54]/50`, etc.)
- [ ] Ensure consistent `text-sm` or `text-base` sizing for subtitles
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All admin page subtitles use `text-[#434E54]/60`. No gray-500/600 variants remain for subtitle text.
- **References**: REQ-5
- **Files**: All subtitle elements across `src/app/(admin)/` and `src/components/admin/`
