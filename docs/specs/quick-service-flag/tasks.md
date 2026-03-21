# Quick Service Flag (`is_quick_service`) — Implementation Tasks

> **Feature:** is_quick_service database column and admin toggle
> **Status:** Draft
> **Created:** 2026-03-21
> **Design:** `docs/specs/quick-service-flag/design.md`

---

## Overview

Replace the hardcoded `QUICK_SERVICE_NAMES` array in `ServiceStep.tsx` with a database-driven `is_quick_service` boolean column on the `services` table, exposed as a toggle in the admin ServiceForm.

**Progress**: 0/5 tasks complete (0%)

## Requirement Traceability

| Requirement | Task(s) | Status |
|-------------|---------|--------|
| REQ-1: Database column for quick service flag | Task 0174 | Pending |
| REQ-2: TypeScript type update | Task 0175 | Pending |
| REQ-3: Admin API accepts new field | Task 0176 | Pending |
| REQ-4: Admin form toggle | Task 0177 | Pending |
| REQ-5: Booking step uses DB flag instead of hardcoded names | Task 0178 | Pending |

---

## Phase 1: Database Migration

### Task 0174: Add is_quick_service Column to Services Table
- [ ] Run migration SQL in Supabase dashboard:
  ```sql
  ALTER TABLE services ADD COLUMN is_quick_service BOOLEAN NOT NULL DEFAULT false;
  UPDATE services SET is_quick_service = true WHERE name = 'Nail Trim';
  ```
- [ ] Verify with `SELECT name, is_quick_service FROM services`
- [ ] Update `docs/architecture/ARCHITECTURE.md` database schema section to include `is_quick_service` column
- **Agent**: `@agent-data-dev`
- **Requirements**: REQ-1
- **Design Ref**: Section 4 (Data Models)
- **Files**: Supabase dashboard (no code file), `docs/architecture/ARCHITECTURE.md`
- **Acceptance Criteria**: Column exists on `services` table; Nail Trim row has `is_quick_service = true`; all other rows have `false`
- **Depends On**: None
- **Verification**: Run `SELECT name, is_quick_service FROM services` in Supabase SQL editor

---

## Phase 2: Type Update

### Task 0175: Add is_quick_service to Service TypeScript Interface
- [ ] Add `is_quick_service: boolean` to the `Service` interface in `src/types/database.ts`
- [ ] Run `npm run build` to verify no type errors
- **Agent**: `@agent-data-dev`
- **Requirements**: REQ-2
- **Design Ref**: Section 3 (Components & Interfaces)
- **Files**: `src/types/database.ts`
- **Acceptance Criteria**: `Service` interface includes `is_quick_service: boolean`; build passes
- **Depends On**: Task 0174
- **Verification**: `npm run build` succeeds

---

## Phase 3: API Routes

### Task 0176: Accept is_quick_service in Admin Service API Routes
- [ ] In `src/app/api/admin/services/route.ts` POST handler: destructure `is_quick_service = false` from body, include in Supabase insert
- [ ] In `src/app/api/admin/services/[id]/route.ts` PATCH handler: accept `is_quick_service`, include in update object when defined
- [ ] Verify both routes use two-client pattern (auth client + service role client)
- **Agent**: `@agent-data-dev`
- **Requirements**: REQ-3
- **Design Ref**: Section 3 (Admin POST/PATCH payload)
- **Files**: `src/app/api/admin/services/route.ts`, `src/app/api/admin/services/[id]/route.ts`
- **Acceptance Criteria**: POST creates service with `is_quick_service`; PATCH updates it; both return updated record
- **Depends On**: Task 0175
- **Verification**: cURL POST with `"is_quick_service": true`, verify in DB; cURL PATCH to toggle it off, verify in DB

---

## Phase 4: Admin Form

### Task 0177: Add Quick Service Toggle to ServiceForm
- [ ] Add `is_quick_service: boolean` to `FormData` interface with default `false`
- [ ] Load `is_quick_service` from existing service data in `useEffect`
- [ ] Add checkbox UI below the `is_active` toggle, matching its styling pattern
- [ ] Include `is_quick_service` in the POST/PATCH payload sent to the API
- [ ] Ensure `toast.success()` / `toast.error()` are already present on save (no new toasts needed)
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-4
- **Design Ref**: Section 6 (UI Specifications)
- **Files**: `src/components/admin/services/ServiceForm.tsx`
- **Acceptance Criteria**: Toggle appears in admin service form; checked state persists after save; Nail Trim shows checked by default
- **Depends On**: Task 0176
- **Verification**: Open admin Settings > Services, edit Nail Trim — toggle is checked; create new service with toggle on — verify in DB

---

## Phase 5: Booking Step

### Task 0178: Replace Hardcoded QUICK_SERVICE_NAMES with Database Flag
- [ ] In `src/components/booking/steps/ServiceStep.tsx`, replace `QUICK_SERVICE_NAMES.includes(s.name)` filter with `s.is_quick_service`
- [ ] Remove the `QUICK_SERVICE_NAMES` constant entirely
- [ ] Verify main services grid and quick services section render correctly
- **Agent**: `@agent-app-dev`
- **Requirements**: REQ-5
- **Design Ref**: Section 8 Phase 5
- **Files**: `src/components/booking/steps/ServiceStep.tsx`
- **Acceptance Criteria**: Nail Trim appears in "Quick Services" section; other services in main grid; no hardcoded service names remain
- **Depends On**: Task 0177
- **Verification**: Open booking modal — Nail Trim in quick section; mark another service as quick in admin — it moves to quick section on refresh
