# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Puppy Day** - Full-stack dog grooming SaaS application for a business in La Mirada, CA.

### Architecture Documentation

**[docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)** is the definitive Source of Truth for tech stack, database schema, RLS policies, security model, and service integrations. Consult it when implementing features that touch existing systems, reviewing security patterns, or needing exact type definitions. Sub-docs live in `docs/architecture/routes/`, `docs/architecture/components/`, and `docs/architecture/services/`.

**After completing a task**, update affected architecture files:
- DB changes → `docs/architecture/ARCHITECTURE.md` (Database Schema) | Routes → `docs/architecture/routes/` | Components → `docs/architecture/components/` | Services → `docs/architecture/services/` | Phases → both `CLAUDE.md` and `ARCHITECTURE.md`

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **React**: 19.2
- **Styling**: Tailwind CSS 4 + DaisyUI 5 (https://daisyui.com/components/)
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL) — connected to live Supabase project
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe (Phase 7 - pending)
- **Email**: Resend
- **SMS**: Twilio
- **Calendar**: Google Calendar API (bidirectional sync)
- **Charts**: Chart.js, Recharts
- **Forms**: React Hook Form + Zod
- **State**: Zustand

## Development Mode

Using **live Supabase** (`NEXT_PUBLIC_USE_MOCKS=false`). All API routes connect to the real Supabase database. Mock services are available as fallback but not active.

## Tool Orchestration

**Before writing code**, gather context using the appropriate tools in parallel based on task type:

| Task Type | Tools to Use |
|---|---|
| React/Next.js components | Context7 (React/Next.js docs), Serena (`find_symbol`, `get_symbols_overview`), `/vercel-react-best-practices`, `/vercel-composition-patterns` |
| UI/UX, styling, accessibility | Serena (component analysis), `/web-design-guidelines`, `@skill design-system` |
| Database, schema, migrations, RLS | Supabase MCP tools, `/postgres-best-practices`, Serena (find types/queries) |
| Bug fix or refactor | Serena (`find_symbol`, `find_referencing_symbols`), Context7 (relevant lib docs) |
| New library/API integration | Context7 (`resolve-library-id` then `query-docs`), Serena for integration points |

### Skill Auto-Invocation Triggers

Invoke these skills **proactively** when their trigger conditions match — don't wait for user to ask:
- **`/vercel-react-best-practices`** — Any React component work, render optimization, Server vs Client component decisions
- **`/vercel-composition-patterns`** — Component API design, props patterns, compound components, composition refactors
- **`/web-design-guidelines`** — UI layouts, accessibility audits, responsive design, UX reviews
- **`/postgres-best-practices`** — SQL queries, schema design, migrations, RLS policies, indexing

### Post-Implementation Rules

- After code-producing tasks → run `@agent code-simplifier` on modified files
- After DB/schema changes → run `mcp__supabase__get_advisors` for both `security` and `performance` checks
- After component changes → use Serena `find_referencing_symbols` to verify no broken references

### Tool Usage Rules

1. Run Context7 + Serena + relevant skills **in parallel** before writing code
2. Use Serena `find_symbol`/`get_symbols_overview` for code navigation (AST-aware, prefer over grep)
3. Use Context7 for library docs — never guess API signatures
4. Skills are selective — only invoke those matching the current task type

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public marketing site
│   ├── (auth)/          # Login/register flows
│   ├── (customer)/      # Customer portal (authenticated)
│   ├── (admin)/         # Admin panel (role-protected)
│   └── api/             # API routes
├── components/
│   ├── ui/              # DaisyUI-based components
│   ├── booking/         # Booking widget components
│   ├── customer/        # Customer portal components
│   └── admin/           # Admin panel components
├── lib/
│   ├── supabase/        # Supabase client & helpers
│   ├── stripe/          # Stripe utilities
│   ├── resend/          # Email utilities
│   └── twilio/          # SMS utilities
├── mocks/               # Mock service implementations (inactive)
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── stores/              # Zustand state stores
docs/
├── architecture/        # Comprehensive architecture documentation (Source of Truth)
│   ├── ARCHITECTURE.md  # Master document with tech stack, database, security
│   ├── routes/          # Route-specific documentation (marketing, auth, admin, etc.)
│   ├── components/      # Component architecture (UI, booking flow)
│   └── services/        # Service integration guides (Supabase, notifications)
└── specs/               # Kiro SDD specifications per phase
```

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all tests
npm run test:ui      # Visual test UI
npm run test:coverage # Coverage report
```

## Kiro SDD Workflow

This project uses Kiro Spec-Driven Development. For each phase:

1. **Requirements**: Create `docs/specs/{phase}/requirements.md` (EARS format)
2. **Design**: Create `docs/specs/{phase}/design.md` (architecture, data models)
3. **Tasks**: Create `docs/specs/{phase}/tasks.md` (implementation checklist)
4. **Implement**: Use `/kc:impl [task-number]` command

## Session Context

Before starting work, check `.claude/tasks/context_session_x.md` for current context. Update after each session.

## UI Feedback Rules — Toast Notifications

**RULE: Every database mutation (create, update, delete) MUST show a toast notification.**

Use `toast` from `@/hooks/use-toast`:

```ts
import { toast } from '@/hooks/use-toast';

// Success
toast.success('Appointment confirmed');
toast.success('Customer updated');
toast.success('Record deleted');

// Error (always in catch block)
toast.error('Failed to confirm appointment');
toast.error('Failed to save changes');
```

**Required for all:**
- `POST` / `PUT` / `PATCH` / `DELETE` API calls from client components
- Supabase `.insert()`, `.update()`, `.upsert()`, `.delete()` calls from client components
- Form submissions that write to the database

**Pattern:**
```ts
try {
  const res = await fetch('/api/...', { method: 'POST', ... });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  toast.success('Done!');
} catch (err) {
  console.error('[ComponentName] action error:', err);
  toast.error('Failed to complete action');
}
```

**Message guidelines:** Keep messages short and specific (e.g. "Appointment confirmed", not "Success"). Use past tense for success, "Failed to …" for errors.

## Design System

**Clean & Elegant Professional** - Warm cream (#F8EEE5) background, charcoal (#434E54) primary, soft shadows, rounded corners.

See [Global Design System](docs/architecture/ARCHITECTURE.md#global-design-system) in ARCHITECTURE.md for complete color codes, typography, and component patterns.

**Quick Reference**: Shadows: `shadow-sm`/`shadow-md`/`shadow-lg` (soft, blurred) | Corners: `rounded-lg`/`rounded-xl` | Icons: Lucide React | NO bold borders or chunky elements

**Dog-Themed UI/UX**: Complement the professional aesthetic with playful dog-themed elements — paw prints for success/loading states, dog silhouettes for empty states, bone icons for loyalty/rewards, bouncy animations for confirmations. Tone: warm, inviting, joyful without being childish.

## Available Agents

### Kiro Workflow Agents
- `kiro-requirement`: Requirements analysis (EARS format)
- `kiro-design`: Technical design documents
- `kiro-plan`: Implementation task planning
- `kiro-executor`: Task Orchestrator

### Development Agents
- `app-dev`: Frontend development - UI/UX design, React components, Next.js pages, DaisyUI implementation, responsive design, accessibility
- `data-dev`: Backend development - Supabase integration, authentication, RLS policies, database queries, migrations (has MCP tools)
- `code-reviewer`: Code review and audits - security, performance, design system compliance (has MCP tools)

### Available Skills
Reference these for detailed specifications:
- `@skill design-system`: The Puppy Day colors, typography, spacing
- `@skill daisyui-components`: DaisyUI component patterns and theme config
- `@skill nextjs-patterns`: App Router, data fetching, Server/Client components

## Development Workflow

### Frontend Work (`@agent-app-dev`)
Use for UI/UX design AND implementation in one step:
- Creates components with DaisyUI + Tailwind
- Implements responsive layouts
- Adds animations and interactions
- Ensures accessibility compliance

```bash
@agent-app-dev "Create a booking confirmation modal with success animation"
```

### Backend/Data Work (`@agent-data-dev`)
Use for database and API work:
- Supabase queries and migrations
- Authentication flows
- RLS policies
- API routes

**CRITICAL - Admin API + RLS Pattern**:
When creating admin API routes that query customer data, use the **two-client pattern**:
1. Authenticate with `createServerSupabaseClient()` + `requireAdmin()`
2. Query data with `createServiceRoleClient()` to bypass RLS

See [Admin API + RLS Pattern](docs/architecture/ARCHITECTURE.md#admin-api--rls-pattern-critical) for full documentation and examples.

```bash
@agent-data-dev "Add RLS policy for loyalty points table"
```

### Code Review (`@agent-code-reviewer`)
Use after completing features or before PRs:
- Security and performance review
- Design system compliance
- Best practices validation

```bash
@agent-code-reviewer "Review the new booking flow implementation"
```

## Booking System Architecture

**Unified Modal System**: `BookingModal` (`src/components/booking/BookingModal.tsx`) with mode-aware behavior for all entry points.

| Mode | Entry Point | Steps | Special |
|---|---|---|---|
| `customer` | `StickyBookingButton` (marketing page, after 600px scroll) | Service → Date/Time → Customer (Login/Register) → Pet → Review+Addons → Confirmation (6 steps) | — |
| `admin` | "Create Appointment" in `/admin/appointments` | Service → Date/Time → Customer (Search/Create) → Pet → Review+Addons → Confirmation (6 steps) | — |
| `walkin` | "Walk-in" in `/admin/dashboard` | Service → Customer (Search/Create) → Pet → Review+Addons → Confirmation (5 steps) | Date/Time=NOW, status=`checked_in`, source=`walk_in` |

Key components: `BookingWizard` (step orchestration), `CustomerStep` (mode-aware: login/register for customers, search/create for admin), `ReviewStep` (integrated add-ons), time slots at 60-min intervals. See [Booking Flow](docs/architecture/components/booking-flow.md) for full docs.

## Database Schema

**Quick Reference**: Key tables: `users`, `pets`, `breeds`, `services`, `service_prices`, `addons`, `appointments`, `appointment_addons`, `waitlist`, `report_cards`, `memberships`, `customer_memberships`, `loyalty_points`, `loyalty_transactions`, `customer_flags`, `payments`, `site_content`, `promo_banners`, `gallery_images`, `settings`, `notifications_log`, `notification_templates`, `notification_settings`, `notification_template_history`

See [Database Schema](docs/architecture/ARCHITECTURE.md#database-schema) in ARCHITECTURE.md for relationships, RLS policies, and stored procedures.

## Business Information

See [Business Information](docs/architecture/ARCHITECTURE.md#business-information) in ARCHITECTURE.md for complete details.

**Quick Reference**: Size-based pricing (Small 0-18lbs, Medium 19-35lbs, Large 36-65lbs, X-Large 66+lbs) | Basic Grooming $40-$85, Premium $70-$150 | Features: multi-step booking, waitlist, report cards, review routing, loyalty program

## Development Phases

See [Development Phases](docs/architecture/ARCHITECTURE.md#development-phases) in ARCHITECTURE.md for complete phase details.

**Current Status**: Phases 1-6, 8, 9, 11 completed | Phase F (Admin Dashboard Redesign) completed | Phase 7 (Payments) pending | Phase 10 (Testing & Polish) in progress — booking modal refactor, responsive admin layout, admin API RLS fixes, query parallelization, client component memoization, admin pages performance audit, AdminButton component, AppointmentDetailModal redesign, and settings/staff route reorganization done; comprehensive testing pending.
