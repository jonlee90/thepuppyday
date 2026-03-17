# Admin UI Consistency Audit - Requirements

## EARS Format Requirements

### Ubiquitous Requirements

REQ-1: The admin UI shall use a consistent modal pattern (`AdminModal`) with AnimatePresence, fixed inset-0, rounded-2xl shadow-2xl, focus trap, escape-to-close, warm header icon in `bg-[#EAE0D5]`, and footer `bg-[#EAE0D5]/30`.

REQ-2: The admin UI shall use `AdminButton` for all interactive button actions. Raw `btn btn-primary bg-[#434E54]` patterns shall not exist.

REQ-3: All admin form inputs shall use `border-[#434E54]/20`, `focus:ring-2 focus:ring-[#434E54]/30`, `font-medium` labels, and `text-[#D4A574]` required asterisks.

REQ-4: All admin pages shall use a consistent container layout (`max-w-7xl mx-auto space-y-6`) without redundant `min-h-screen bg-[#F8EEE5]` wrappers.

REQ-5: All admin page headings shall use `text-3xl font-bold text-[#434E54]` and subtitles shall use `text-[#434E54]/60`.

REQ-6: The system shall provide a shared `formatTime12h` utility at `src/lib/utils/time.ts`.

### Unwanted Behavior Requirements

REQ-7: The admin UI shall not use `<dialog>` elements for modals. All modals shall use `<div role="dialog" aria-modal="true">`.

REQ-8: The admin UI shall not use `alert()` or `confirm()` browser dialogs. All confirmations shall use `ConfirmationModal` and all notifications shall use toast.

REQ-9: The admin UI shall not use amber/yellow button colors in the calendar section. All action buttons shall use charcoal (#434E54).

### State-Driven Requirements

REQ-10: While displaying status indicators, the admin UI shall use a generalized `StatusBadge` component that accepts custom status configurations.

REQ-11: While displaying loading states, the admin UI shall use a consistent pattern (skeleton or spinner, not mixed).

### Event-Driven Requirements

REQ-12: When a user confirms a destructive action, the system shall display a `ConfirmationModal` instead of a browser `confirm()` dialog.

REQ-13: When a mutation succeeds or fails, the system shall show a toast notification instead of a browser `alert()`.

## Gold Standard Reference

**`src/components/admin/settings/staff/`** (StaffForm + StaffDirectory) is the reference implementation for all admin UI patterns. See `memory/admin-ui-patterns.md` for the complete pattern specification.

## Scope

This audit covers all files under:
- `src/app/(admin)/`
- `src/components/admin/`
- Related shared components used by admin pages
