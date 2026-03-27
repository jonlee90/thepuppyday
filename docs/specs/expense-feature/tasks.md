# Expense Tracking — Implementation Tasks

> **Feature:** Expense Tracking (Admin-Only)
> **Status:** Draft
> **Created:** 2026-03-27
> **Design:** `docs/specs/expense-feature/design.md`
> **Plan:** `.claude/plans/expense-tracking-feature.md`

---

## Overview

Admin-only expense tracking with manual entry, category management, budget tracking per category, analytics with charts, and CSV export. Two new DB tables, 5 API route files, 6 UI components, 1 new page, sidebar/dashboard modifications.

**Progress**: 0/14 tasks complete (0%)

## Requirement Traceability

| Requirement | Task(s) | Status |
|-------------|---------|--------|
| Expense CRUD (create, edit, delete) | Task 0189, 0192, 0195, 0196 | Pending |
| Category management (preset + custom) | Task 0189, 0193, 0198 | Pending |
| Budget settings per category | Task 0194, 0200 | Pending |
| Analytics (totals, trends, budget status) | Task 0195, 0199 | Pending |
| CSV export | Task 0196, 0201 | Pending |
| Dashboard widget | Task 0202 | Pending |
| Admin-only access | Task 0189, 0192-0196 | Pending |
| Sidebar/mobile nav | Task 0201 | Pending |

---

## Phase 1: Database + Types

### Task 0189: Create Expense Tables Migration and Apply
- [ ] Create `supabase/migrations/20260327_create_expense_tables.sql` with `expense_categories` and `expenses` tables, indexes, RLS policies, updated_at trigger, and 8 preset category seeds (use exact SQL from design Section 4)
- [ ] Verify `update_updated_at_column()` and `is_admin()` functions exist before running
- [ ] Apply migration via Supabase MCP
- [ ] Verify tables exist with `mcp__supabase__list_tables`, confirm 8 preset categories seeded
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 4 (Data Models)
- **Files**: `supabase/migrations/20260327_create_expense_tables.sql`
- **Acceptance Criteria**: Both tables exist in Supabase, 8 preset categories seeded, RLS enabled with admin-only policies
- **Depends On**: None
- **Verification**: Query `expense_categories` — returns 8 rows. Query `expenses` — empty. Non-admin query is blocked by RLS.

### Task 0190: Create TypeScript Types and Zod Schemas
- [ ] Create `src/types/expenses.ts` with all interfaces and Zod schemas from design Section 3
- [ ] Include: `ExpenseCategory`, `Expense`, `ExpenseWithCategory`, `ExpenseListResponse`, `ExpenseAnalyticsResponse`, `CategoryTotal`, `MonthlyTrendPoint`, `BudgetStatusItem`, `BudgetSettings`, `ExpenseSummaryWidget`, `ExpenseFilters`
- [ ] Include Zod schemas: `CreateExpenseSchema`, `UpdateExpenseSchema`, `CreateCategorySchema`, `BudgetSettingsSchema`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (Components & Interfaces)
- **Files**: `src/types/expenses.ts`
- **Acceptance Criteria**: All types compile without errors, Zod schemas validate correctly
- **Depends On**: None
- **Verification**: `npx tsc --noEmit src/types/expenses.ts` passes

---

## Phase 2: API Routes

### Task 0191: Create Expenses List and Create API Route
- [ ] Create `src/app/api/admin/expenses/route.ts`
- [ ] `GET`: List expenses with pagination, date range filter, category filter, sort by date/amount. Join with `expense_categories` to return `ExpenseWithCategory`. Use two-client pattern.
- [ ] `POST`: Create expense with `CreateExpenseSchema` Zod validation. Set `created_by` from authenticated user. Return created expense with category join.
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/route.ts`
- **Acceptance Criteria**: GET returns paginated expenses with category data; POST creates expense with validation
- **Depends On**: Task 0189, Task 0190
- **Verification**: curl GET returns `{ expenses: [], total: 0, ... }`; curl POST with valid body returns 201

### Task 0192: Create Expense Update and Delete API Route
- [ ] Create `src/app/api/admin/expenses/[id]/route.ts`
- [ ] `PUT`: Update expense with `UpdateExpenseSchema` validation. Return updated expense with category.
- [ ] `DELETE`: Delete expense by ID. Return 404 if not found.
- [ ] Both use two-client pattern with `requireAdmin()`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/[id]/route.ts`
- **Acceptance Criteria**: PUT updates and returns expense; DELETE removes expense; 404 for missing IDs
- **Depends On**: Task 0191
- **Verification**: Create expense via POST, update via PUT, delete via DELETE — all return correct responses

### Task 0193: Create Categories CRUD API Routes
- [ ] Create `src/app/api/admin/expenses/categories/route.ts` — GET (list all) + POST (create custom, validate unique name)
- [ ] Create `src/app/api/admin/expenses/categories/[id]/route.ts` — DELETE (block preset deletion, block if category has expenses)
- [ ] Both use two-client pattern with `requireAdmin()`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/categories/route.ts`, `src/app/api/admin/expenses/categories/[id]/route.ts`
- **Acceptance Criteria**: GET lists 8+ categories; POST creates custom; DELETE blocks preset/in-use categories with clear error messages
- **Depends On**: Task 0189, Task 0190
- **Verification**: GET returns 8 presets; POST new category returns 201; DELETE preset returns 400

### Task 0194: Create Budget Settings API Route
- [ ] Create `src/app/api/admin/expenses/budgets/route.ts`
- [ ] `GET`: Read from `settings` table where key = `expense_budgets`, return JSON value (or empty object)
- [ ] `PUT`: Validate with `BudgetSettingsSchema`, upsert to `settings` table with key `expense_budgets`
- [ ] Use two-client pattern with `requireAdmin()`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/budgets/route.ts`
- **Acceptance Criteria**: GET returns budget settings; PUT saves and persists; empty state returns `{}`
- **Depends On**: Task 0189, Task 0190
- **Verification**: PUT budgets, GET returns same data

### Task 0195: Create Analytics API Route
- [ ] Create `src/app/api/admin/expenses/analytics/route.ts`
- [ ] `GET`: Accept `start` and `end` query params. Aggregate expenses by category (totals + counts), compute monthly trend, join with budget settings for budget status.
- [ ] Return `ExpenseAnalyticsResponse` with `grandTotal`, `totalsByCategory`, `monthlyTrend`, `budgetStatus`
- [ ] Use two-client pattern with `requireAdmin()`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/analytics/route.ts`
- **Acceptance Criteria**: Returns correct aggregations; handles zero-expense periods; budget status shows correct percentages
- **Depends On**: Task 0194
- **Verification**: Add test expenses, call analytics endpoint, verify totals match

### Task 0196: Create CSV Export API Route
- [ ] Create `src/app/api/admin/expenses/export/route.ts`
- [ ] `GET`: Accept same filters as list (dateFrom, dateTo, categoryId). Query expenses with category join.
- [ ] Return CSV with headers `Date,Category,Amount,Notes` and `Content-Type: text/csv`, `Content-Disposition: attachment; filename="expenses-YYYY-MM-DD.csv"`
- [ ] Use two-client pattern with `requireAdmin()`
- **Agent**: `@agent-data-dev`
- **Design Ref**: Section 3 (API Route Specifications)
- **Files**: `src/app/api/admin/expenses/export/route.ts`
- **Acceptance Criteria**: Downloads valid CSV file with correct data; empty result returns headers only
- **Depends On**: Task 0191
- **Verification**: Call endpoint, verify CSV content matches database records

---

## Phase 3: UI Components

### Task 0197: Create useExpenses Data Hook
- [ ] Create `src/hooks/admin/use-expenses.ts`
- [ ] Implement fetchers: `fetchExpenses(filters)`, `fetchCategories()`, `fetchAnalytics(start, end)`, `fetchBudgets()`
- [ ] Implement mutations: `createExpense`, `updateExpense`, `deleteExpense`, `createCategory`, `deleteCategory`, `saveBudgets` — each with `toast.success()` / `toast.error()` and data refetch
- [ ] Export loading/error states, filter state management
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 5 (State Management), Section 7 (Toast Notifications)
- **Files**: `src/hooks/admin/use-expenses.ts`
- **Acceptance Criteria**: Hook fetches all data, mutations trigger toasts and refetch, loading states work
- **Depends On**: Task 0190, Task 0191, Task 0192, Task 0193, Task 0194, Task 0195
- **Verification**: Use hook in a test component, verify all CRUD operations work with toasts

### Task 0198: Create ExpenseTable and ExpenseFormModal Components
- [ ] Create `src/components/admin/expenses/ExpenseTable.tsx` — sortable by date/amount, filterable by date range + category dropdown, paginated, truncated notes, edit/delete action buttons, dog-themed empty state
- [ ] Create `src/components/admin/expenses/ExpenseFormModal.tsx` — Framer Motion modal (AnimatePresence + fixed inset-0, NOT `<dialog>`), React Hook Form + Zod, fields: category select, amount ($ prefix), date (no `input-sm`/`input-xs`), notes textarea. Reused for create + edit via optional `expense` prop. Warm `bg-[#EAE0D5]` header, `AdminButton`, focus trap.
- [ ] Follow admin modal pattern from `src/components/admin/settings/staff/` reference
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 6 (UI Specifications), Section 7 (Edge Cases)
- **Files**: `src/components/admin/expenses/ExpenseTable.tsx`, `src/components/admin/expenses/ExpenseFormModal.tsx`
- **Acceptance Criteria**: Table renders expenses with sorting/filtering/pagination; modal creates and edits expenses with validation; design system compliant
- **Depends On**: Task 0197
- **Verification**: Render table with sample data, verify sort/filter/pagination; open modal, submit form, verify toast

### Task 0199: Create ExpenseAnalytics Component
- [ ] Create `src/components/admin/expenses/ExpenseAnalytics.tsx`
- [ ] KPI cards: Total Spent (month), Budget Usage %, vs Last Month — using card pattern with accent strip
- [ ] Category breakdown bar chart using Recharts `BarChart` (dynamic import with `next/dynamic` to manage bundle size)
- [ ] Budget progress bars per category: green (<75%), yellow (75-90%), red (>90%) with `role="progressbar"` and aria attributes
- [ ] Handle edge cases: no expenses ($0.00), no budget set ("No budget set" text)
- [ ] Responsive: stack on mobile, 2-col on tablet, full on desktop
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 6 (UI Specifications, Component Hierarchy)
- **Files**: `src/components/admin/expenses/ExpenseAnalytics.tsx`
- **Acceptance Criteria**: KPI cards show correct data; chart renders category breakdown; budget bars color-coded correctly; accessible
- **Depends On**: Task 0197
- **Verification**: Render with mock analytics data, verify KPI values, chart rendering, budget bar colors

### Task 0200: Create CategoryManagement and BudgetSettingsModal Components
- [ ] Create `src/components/admin/expenses/CategoryManagement.tsx` — collapsible section, preset categories as non-deletable chips, custom categories with delete (confirmation), inline "Add Category" input
- [ ] Create `src/components/admin/expenses/BudgetSettingsModal.tsx` — Framer Motion modal, list all categories with monthly budget $ input each, save all at once, warm header/footer, focus trap, `AdminButton`
- [ ] Follow admin modal pattern; no `input-sm`/`input-xs` on inputs
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 6 (UI Specifications)
- **Files**: `src/components/admin/expenses/CategoryManagement.tsx`, `src/components/admin/expenses/BudgetSettingsModal.tsx`
- **Acceptance Criteria**: Categories display as chips; presets not deletable; custom categories deletable with confirmation; budget modal saves all budgets; toasts on all mutations
- **Depends On**: Task 0197
- **Verification**: Add/delete custom categories, verify toasts; open budget modal, set values, save, verify persistence

---

## Phase 4: Page Assembly + Navigation

### Task 0201: Create Expenses Page and Add Sidebar Navigation
- [ ] Create `src/app/(admin)/admin/expenses/page.tsx` — server component with auth check + Suspense boundary
- [ ] Create `src/app/(admin)/admin/expenses/ExpensesClient.tsx` — client component composing: ExpenseAnalytics (top), action bar (Add Expense, Export CSV, Budget Settings, Manage Categories using `AdminButton` + Lucide icons), CategoryManagement (collapsible), ExpenseTable. Default date range: current month.
- [ ] Export CSV button triggers browser download via fetch to `/api/admin/expenses/export`
- [ ] Modify `src/components/admin/AdminSidebar.tsx` — add `{ label: 'Expenses', href: '/admin/expenses', icon: Receipt, adminOnly: true }` in Operations section
- [ ] Modify `src/components/admin/AdminMobileNav.tsx` — add matching nav item
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 6 (Component Hierarchy), Section 8 (Phase 4)
- **Files**: `src/app/(admin)/admin/expenses/page.tsx`, `src/app/(admin)/admin/expenses/ExpensesClient.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/admin/AdminMobileNav.tsx`
- **Acceptance Criteria**: Page loads at `/admin/expenses` with all sections; sidebar shows "Expenses" for admins; mobile nav includes item; CSV export downloads file
- **Depends On**: Task 0198, Task 0199, Task 0200
- **Verification**: Navigate to `/admin/expenses`, verify all sections render; check sidebar link; test on mobile viewport

---

## Phase 5: Dashboard Integration

### Task 0202: Create ExpenseWidget and Integrate into Dashboard
- [ ] Create `src/components/admin/dashboard/ExpenseWidget.tsx` — card with monthly total (large number), budget usage progress bar, top 3 categories list, "View Details" link to `/admin/expenses`. Follow dashboard widget card pattern (accent strip, shadow-sm).
- [ ] Modify `src/app/(admin)/admin/dashboard/DashboardClient.tsx` — add ExpenseWidget to dashboard grid
- [ ] Modify `src/hooks/admin/use-dashboard-data.ts` — add expense summary fetch to parallel data loading (call analytics endpoint for current month)
- **Agent**: `@agent-app-dev`
- **Design Ref**: Section 6 (Component Hierarchy), Section 8 (Phase 5)
- **Files**: `src/components/admin/dashboard/ExpenseWidget.tsx`, `src/app/(admin)/admin/dashboard/DashboardClient.tsx`, `src/hooks/admin/use-dashboard-data.ts`
- **Acceptance Criteria**: Widget shows on dashboard with current month data; budget bar color-coded; links to expenses page
- **Depends On**: Task 0195, Task 0201
- **Verification**: Navigate to `/admin/dashboard`, verify widget renders with data, click "View Details" navigates to expenses

---

## Phase 6: Code Review

### Task 0203: Run Code Review on All Expense Feature Files
- [ ] Run `@agent-code-reviewer` on all new/modified files
- [ ] Verify design system compliance (colors, shadows, corners, AdminButton, modal pattern)
- [ ] Verify security patterns (two-client pattern, requireAdmin, RLS, Zod validation on all inputs)
- [ ] Verify toast notifications on all DB mutations
- [ ] Verify no `input-sm`/`input-xs` on date inputs
- [ ] Verify no `<dialog>` elements in modals
- [ ] Verify `npm run build` succeeds
- **Agent**: `@agent-code-reviewer`
- **Requirements**: All
- **Acceptance Criteria**: No critical issues found; all patterns compliant; build passes
- **Depends On**: All prior tasks
- **Verification**: Clean review output, successful build
