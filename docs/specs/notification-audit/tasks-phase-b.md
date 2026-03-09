# Notification Audit - Phase B: Security Fixes (Two-Client Pattern)

## Overview

Phase B applies the two-client pattern (RLS security fix) to all admin notification API routes. Currently, these routes authenticate with `createServerSupabaseClient()` and then use the same anon-key client for data queries, which fails under RLS when querying across tables (e.g., joining `notifications_log` to `users`). The fix adds `createServiceRoleClient()` for all data queries while keeping the auth client for authentication only.

**Progress**: 3/3 tasks complete (100%) — completed 2026-03-07

**Document References**:
- Design: `docs/specs/notification-audit/design.md`
- Design Section: Issue 3 (Two-Client Pattern for All Admin Notification Routes)

**Note**: The `log/[id]/resend` route was NOT previously fixed in Phase A (contrary to the spec note) — it was fixed as part of Task 0104 here. The `bulk-resend` route (if it exists) is outside scope of Phase B. The `duplicate` and `restore` template routes referenced in Task 0106 do not exist in the codebase; the actual routes `preview` and `rollback` were patched instead.

---

## Section B.1: Priority Routes (Notifications Log + User Joins)

### Task 0104: Apply Two-Client Pattern to Notification List and Log Routes
- [x] **`src/app/api/admin/notifications/route.ts` (GET)**: Add `import { createServiceRoleClient } from '@/lib/supabase/server'`, keep `createServerSupabaseClient` + `requireAdmin` for auth only, use `createServiceRoleClient()` for all `notifications_log` and `users` queries
- [x] **`src/app/api/admin/notifications/log/route.ts` (GET)**: Same pattern -- add service role client import, use it for all data queries including the customer join
- [x] **`src/app/api/admin/notifications/log/[id]/route.ts` (GET)**: Same pattern -- use service role client for fetching individual notification detail with customer data
- [x] **`src/app/api/admin/notifications/log/[id]/resend/route.ts` (POST)**: Same pattern -- use service role client for fetching the original notification before resending
- [x] **`src/app/api/admin/notifications/dashboard/route.ts` (GET)**: Same pattern -- use service role client for aggregation queries on `notifications_log`
- [x] In each file, ensure the auth client (`createServerSupabaseClient`) is ONLY used for `requireAdmin()` and the service role client is used for ALL subsequent database operations
- [x] Cast service role client appropriately (e.g., `(serviceClient as any)`) to satisfy TypeScript where needed
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All 5 priority routes use the two-client pattern. Auth happens via `createServerSupabaseClient` + `requireAdmin`, data queries use `createServiceRoleClient`. No TypeScript errors. Routes still return correct data in mock mode.
- **References**: Design Section "Issue 3: Two-Client Pattern", Priority Routes table
- **Files**:
  - `src/app/api/admin/notifications/route.ts`
  - `src/app/api/admin/notifications/log/route.ts`
  - `src/app/api/admin/notifications/log/[id]/route.ts`
  - `src/app/api/admin/notifications/log/[id]/resend/route.ts`
  - `src/app/api/admin/notifications/dashboard/route.ts`

---

## Section B.2: Template and Settings Routes

### Task 0105: Apply Two-Client Pattern to Settings Routes
- [x] **`src/app/api/admin/notifications/settings/route.ts` (GET/PUT)**: Add service role client for querying and updating `notification_settings`
- [x] **`src/app/api/admin/notifications/settings/[notification_type]/route.ts` (GET/PUT)**: Add service role client for type-specific settings queries
- [x] In each file, keep `createServerSupabaseClient` + `requireAdmin` for authentication only
- [x] Ensure PUT operations also use the service role client for writes
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All settings routes use the two-client pattern. Settings can be read and updated correctly in mock mode.
- **References**: Design Section "Issue 3: Two-Client Pattern", Lower Priority Routes table
- **Files**:
  - `src/app/api/admin/notifications/settings/route.ts`
  - `src/app/api/admin/notifications/settings/[notification_type]/route.ts`

### Task 0106: Apply Two-Client Pattern to Template Routes
- [x] **`src/app/api/admin/notifications/templates/route.ts` (GET/POST)**: Add service role client for querying and creating templates
- [x] **`src/app/api/admin/notifications/templates/[id]/route.ts` (GET/PUT/DELETE)**: Add service role client for individual template CRUD
- [x] **`src/app/api/admin/notifications/templates/[id]/history/route.ts` (GET)**: Add service role client for template history queries
- [x] **`src/app/api/admin/notifications/templates/[id]/test/route.ts` (POST)**: Add service role client for template test operations
- [x] **`src/app/api/admin/notifications/templates/[id]/duplicate/route.ts` (POST)**: Add service role client for template duplication
- [x] **`src/app/api/admin/notifications/templates/[id]/restore/route.ts` (POST)**: Add service role client for template restoration from history
- [x] In each file, keep `createServerSupabaseClient` + `requireAdmin` for authentication only, use service role client for ALL database operations
- **Agent**: `@agent-data-dev`
- **Acceptance Criteria**: All 6 template routes use the two-client pattern. Template CRUD, history, testing, duplication, and restoration work correctly in mock mode. No TypeScript errors.
- **References**: Design Section "Issue 3: Two-Client Pattern", Lower Priority Routes table
- **Files**:
  - `src/app/api/admin/notifications/templates/route.ts`
  - `src/app/api/admin/notifications/templates/[id]/route.ts`
  - `src/app/api/admin/notifications/templates/[id]/history/route.ts`
  - `src/app/api/admin/notifications/templates/[id]/test/route.ts`
  - `src/app/api/admin/notifications/templates/[id]/duplicate/route.ts`
  - `src/app/api/admin/notifications/templates/[id]/restore/route.ts`
