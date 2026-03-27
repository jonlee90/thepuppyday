# Expense Tracking Feature

## Context

The Puppy Day needs a way to track business expenses (supplies, rent, payroll, equipment) to understand where money goes and stay within budget. Currently there's no financial tracking on the spending side — only revenue is visible through the analytics page. This feature adds a dedicated `/admin/expenses` page with manual expense entry, category management, budget tracking, and a dashboard widget.

**Admin-only access. Manual entry only. No receipt uploads, no recurring expenses, no payment method tracking.**

---

## Phase 1: Database

### Task 1.1 — Create migration

**Create**: `supabase/migrations/20260327_create_expense_tables.sql`

Two tables:

**`expense_categories`** — preset + custom categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| name | TEXT NOT NULL UNIQUE | Category name |
| is_preset | BOOLEAN DEFAULT false | Preset categories can't be deleted |
| created_at | TIMESTAMPTZ | `now()` |

Seed 8 preset categories: Grooming Supplies, Staff/Payroll, Equipment & Maintenance, Rent & Utilities, Marketing & Advertising, Insurance, Office Supplies, Other.

**`expenses`** — expense records
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| category_id | UUID FK → expense_categories | NOT NULL |
| amount | NUMERIC(10,2) | NOT NULL, CHECK > 0 |
| date | DATE | NOT NULL |
| notes | TEXT | Optional |
| created_by | UUID FK → auth.users | NOT NULL |
| created_at | TIMESTAMPTZ | `now()` |
| updated_at | TIMESTAMPTZ | `now()` |

Indexes on `date` and `category_id`. RLS enabled, admin-only policies. Budget settings stored in existing `settings` table with key `expense_budgets` (JSON: `{ [category_id]: monthly_amount }`).

### Task 1.2 — Apply migration + regenerate types

Run migration via Supabase MCP, then regenerate TypeScript types.

---

## Phase 2: API Routes

All routes use the two-client pattern: `createServerSupabaseClient()` + `requireAdmin()` for auth, `createServiceRoleClient()` for queries.

### Task 2.1 — Expenses CRUD

**Create**: `src/app/api/admin/expenses/route.ts`
- `GET` — List with pagination, date range filter, category filter, sort by date/amount
- `POST` — Create expense (Zod validation: category_id, amount, date, notes?)

**Create**: `src/app/api/admin/expenses/[id]/route.ts`
- `PUT` — Update expense
- `DELETE` — Delete expense

### Task 2.2 — Categories CRUD

**Create**: `src/app/api/admin/expenses/categories/route.ts`
- `GET` — List all categories
- `POST` — Create custom category (validate uniqueness)

**Create**: `src/app/api/admin/expenses/categories/[id]/route.ts`
- `DELETE` — Delete custom category only (block preset deletion, block if has expenses)

### Task 2.3 — Budget settings

**Create**: `src/app/api/admin/expenses/budgets/route.ts`
- `GET` — Read from `settings` table (key: `expense_budgets`)
- `PUT` — Save budget amounts per category

### Task 2.4 — Analytics

**Create**: `src/app/api/admin/expenses/analytics/route.ts`
- `GET` — Accepts `start`/`end` date params. Returns: `totals_by_category`, `grand_total`, `monthly_trend`, `budget_status` (spent vs budget per category)

### Task 2.5 — CSV export

**Create**: `src/app/api/admin/expenses/export/route.ts`
- `GET` — Date range + category filter → CSV download (Date, Category, Amount, Notes)

---

## Phase 3: UI Components

### Task 3.1 — Data hook

**Create**: `src/hooks/admin/use-expenses.ts`

Exposes: `expenses`, `categories`, `analytics`, `budgets`, `loading`, plus mutation functions (`createExpense`, `updateExpense`, `deleteExpense`, `createCategory`, `deleteCategory`, `saveBudgets`). Toast on every mutation.

### Task 3.2 — ExpenseTable

**Create**: `src/components/admin/expenses/ExpenseTable.tsx`

Table: Date, Category (badge), Amount ($), Notes (truncated), Actions (edit/delete). Sortable by date/amount. Pagination controls. Filter bar with date range + category dropdown.

### Task 3.3 — ExpenseFormModal

**Create**: `src/components/admin/expenses/ExpenseFormModal.tsx`

Framer Motion modal (NOT `<dialog>`). Fields: category select, amount ($ prefix), date, notes textarea. React Hook Form + Zod. Reused for create + edit (optional `expense` prop). Follow admin modal pattern: warm `bg-[#EAE0D5]` header, `AdminButton`, focus trap.

### Task 3.4 — CategoryManagement

**Create**: `src/components/admin/expenses/CategoryManagement.tsx`

Collapsible section. Preset categories as non-deletable chips. Custom categories with delete button (confirmation). "Add Category" input at bottom.

### Task 3.5 — ExpenseAnalytics

**Create**: `src/components/admin/expenses/ExpenseAnalytics.tsx`

KPI cards: Total Spent (month), Budget Usage %, vs Last Month. Category breakdown bar chart (Recharts). Budget progress bars per category — green (<75%), yellow (75-90%), red (>90%).

### Task 3.6 — BudgetSettingsModal

**Create**: `src/components/admin/expenses/BudgetSettingsModal.tsx`

Modal with all categories listed, each with a monthly budget input. Save all at once.

---

## Phase 4: Page Assembly + Navigation

### Task 4.1 — Expenses page

**Create**: `src/app/admin/expenses/page.tsx` — Server component with auth + Suspense
**Create**: `src/app/admin/expenses/ExpensesClient.tsx` — Client component composing: ExpenseAnalytics (top), action bar (Add Expense, Export CSV, Budget Settings, Manage Categories), ExpenseTable. Default date range: current month.

### Task 4.2 — Sidebar navigation

**Modify**: `src/components/admin/AdminSidebar.tsx` — Add `{ label: 'Expenses', href: '/admin/expenses', icon: Receipt, adminOnly: true }` to Overview section
**Modify**: `src/components/admin/AdminMobileNav.tsx` — Add matching nav item

---

## Phase 5: Dashboard Integration

### Task 5.1 — Dashboard expense widget

**Create**: `src/components/admin/dashboard/ExpenseWidget.tsx` — Card showing monthly total, budget usage bar, top 3 categories. Links to `/admin/expenses`.
**Modify**: `src/app/admin/dashboard/DashboardClient.tsx` — Add widget to grid
**Modify**: `src/hooks/admin/use-dashboard-data.ts` — Add expense summary to parallel fetch

---

## Key Files (Existing — for Reference)

| Pattern | Reference File |
|---------|---------------|
| Admin API route | `src/app/api/admin/customers/route.ts` |
| Admin page structure | `src/app/admin/customers/page.tsx` |
| Modal pattern | `src/components/admin/customers/PetAddModal.tsx` |
| Dashboard widget | `src/components/admin/dashboard/RevenueOverview.tsx` |
| Data hook | `src/hooks/admin/use-dashboard-data.ts` |
| Settings API | `src/app/api/admin/settings/booking/route.ts` |
| Analytics chart API | `src/app/api/admin/analytics/charts/revenue/route.ts` |
| KPI card | `src/components/admin/analytics/KPICard.tsx` |
| AdminButton | `src/components/admin/ui/AdminButton.tsx` |
| Sidebar | `src/components/admin/AdminSidebar.tsx` |
| Auth helper | `src/lib/admin/auth.ts` |

---

## Verification

1. **Migration**: Run `mcp__supabase__list_tables` — confirm `expenses` and `expense_categories` exist
2. **API**: `curl` each endpoint — CRUD operations return correct data/errors
3. **UI**: Navigate to `/admin/expenses` — add, edit, delete expenses, manage categories, set budgets
4. **Budget**: Set a budget, add expenses exceeding it — verify progress bar turns red
5. **Export**: Click CSV export — file downloads with correct data
6. **Dashboard**: Check `/admin/dashboard` — expense widget shows current month data
7. **Nav**: Sidebar shows "Expenses" item for admin users, not for groomers
8. **Build**: `npm run build` succeeds
