# Admin UI Consistency Audit - P3: Reduce Duplication

## Overview

P3 extracts repeated patterns into reusable shared components: generalized StatusBadge, SortableList wrapper, SearchFilterBar, StatsCard, and standardized loading states.

**Progress**: 0/5 tasks complete (0%)

**Document References**:
- Requirements: `docs/specs/admin-ui-audit/requirements.md`

---

## Section P3.1: Generalize StatusBadge

### Task 0144: Create Generalized StatusBadge with Custom Status Configs
- [ ] Refactor `src/components/admin/shared/StatusBadge.tsx` (or create if not generalized) to accept a `statusConfig` map: `Record<string, { label: string; color: string; icon?: LucideIcon }>`
- [ ] Provide default configs for common status types: appointment statuses, notification statuses, waitlist statuses
- [ ] Export config presets: `APPOINTMENT_STATUS_CONFIG`, `NOTIFICATION_STATUS_CONFIG`, `WAITLIST_STATUS_CONFIG`
- [ ] Migrate existing StatusBadge usages across 18+ files to use the generalized version
- [ ] Remove any inline status badge styling/logic that duplicates this component
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Single StatusBadge component handles all admin status display. Custom configs supported. No inline status badge duplication.
- **References**: REQ-10
- **Files**: `src/components/admin/shared/StatusBadge.tsx`, all files currently rendering status badges inline

---

## Section P3.2: Create SortableList Wrapper

### Task 0145: Create SortableList DnD Wrapper Component
- [ ] Create `src/components/admin/shared/SortableList.tsx` wrapping common DnD Kit patterns (DndContext, SortableContext, closestCenter, arrayMove)
- [ ] Props: `items`, `onReorder`, `renderItem`, `keyExtractor`, `direction?` (vertical/grid)
- [ ] Include drag handle styling, active item overlay, accessibility announcements
- [ ] Migrate `ServicesList` to use SortableList
- [ ] Migrate `AddOnsList` to use SortableList
- [ ] Migrate `GalleryGrid` (admin) to use SortableList
- [ ] Migrate `BannerList` to use SortableList
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All 4 DnD list implementations use SortableList. DnD behavior preserved. Reduced code duplication.
- **References**: Duplication reduction
- **Files**: `src/components/admin/shared/SortableList.tsx`, `src/components/admin/settings/services/ServicesList.tsx`, `src/components/admin/settings/services/AddOnsList.tsx`, `src/components/admin/gallery/GalleryGrid.tsx`, `src/components/admin/settings/banners/BannerList.tsx`

---

## Section P3.3: Create SearchFilterBar

### Task 0146: Create SearchFilterBar Shared Component
- [ ] Create `src/components/admin/shared/SearchFilterBar.tsx` with props: `searchValue`, `onSearchChange`, `searchPlaceholder`, `filters?` (array of filter configs with label, options, value, onChange), `actions?` (ReactNode slot for right-side buttons)
- [ ] Style with gold standard: charcoal border inputs, search icon prefix, consistent spacing
- [ ] Migrate search+filter bars from 7 admin pages to use this component
- [ ] Expected pages: customers, appointments, notifications, waitlist, gallery, and any others with search
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: Consistent search/filter bar across all admin list pages. Single component, configurable per page.
- **References**: Duplication reduction
- **Files**: `src/components/admin/shared/SearchFilterBar.tsx`, various admin list page components

---

## Section P3.4: Create StatsCard and Standardize Loading

### Task 0147: Create StatsCard Shared Component
- [ ] Create `src/components/admin/shared/StatsCard.tsx` with props: `icon`, `value`, `label`, `trend?` (up/down with percentage), `color?`
- [ ] Style matching gold standard: horizontal flex, `w-px h-8 bg-[#F0EAE0]` dividers between cards, `text-2xl font-bold` values, `text-[10px] uppercase tracking-wider` labels
- [ ] Migrate dashboard stats, customer stats, and appointment stats to use StatsCard
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: All stat displays use StatsCard. Consistent visual pattern across dashboard, customer detail, and appointment views.
- **References**: Duplication reduction
- **Files**: `src/components/admin/shared/StatsCard.tsx`, dashboard and stats components

### Task 0148: Standardize Loading States to Skeleton Pattern
- [ ] Audit admin components for mixed loading patterns (some use spinners, some use skeletons)
- [ ] Pick skeleton as the standard (matches modern admin patterns)
- [ ] Create `src/components/admin/shared/AdminSkeleton.tsx` with variants: `table`, `card`, `stats`, `form`
- [ ] Migrate the most visible loading states to use AdminSkeleton (dashboard, appointments list, customer list)
- **Agent**: `@agent-app-dev`
- **Acceptance Criteria**: High-traffic admin pages use consistent skeleton loading. AdminSkeleton provides reusable variants.
- **References**: REQ-11
- **Files**: `src/components/admin/shared/AdminSkeleton.tsx`, dashboard/appointments/customer loading components
