# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Puppy Day** - Full-stack dog grooming SaaS application for a business in La Mirada, CA.

### Architecture Documentation

For comprehensive technical details, refer to **[docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)** which serves as the definitive Source of Truth for:

- **Complete Tech Stack**: All dependencies with version numbers and purposes
- **Database Schema**: Full table relationships, RLS policies, and stored procedures
- **Security Model**: Authentication flows, RLS patterns, data validation
- **Route Documentation**: Detailed guides for all route modules in `docs/architecture/routes/`
- **Component Patterns**: UI components and booking flow in `docs/architecture/components/`
- **Service Integration**: Supabase and notifications in `docs/architecture/services/`

**When to use Architecture Documentation**:
- Implementing new features that touch existing systems
- Understanding data flow and state management
- Setting up integrations (Supabase, notifications, etc.)
- Reviewing security patterns and RLS policies
- Needing exact type definitions and API contracts

**After completing a task**, update any architecture files that were affected:
- Database schema changes → Update `docs/architecture/ARCHITECTURE.md` (Database Schema section)
- New/modified routes → Update relevant file in `docs/architecture/routes/`
- Component changes → Update `docs/architecture/components/`
- Service integration changes → Update `docs/architecture/services/`
- Phase completion → Update Development Phases in both `CLAUDE.md` and `ARCHITECTURE.md`

## Tech Stack

- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS + DaisyUI (https://daisyui.com/components/)
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **Email**: Resend
- **SMS**: Twilio

## Development Mode

Currently using **mock services** (`NEXT_PUBLIC_USE_MOCKS=true`). External services (Supabase, Stripe, Resend, Twilio) are stubbed with in-memory implementations.

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
├── mocks/               # Mock service implementations
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── stores/              # Zustand state stores
docs/
├── architecture/        # 📖 Comprehensive architecture documentation (Source of Truth)
│   ├── ARCHITECTURE.md  # Master document with tech stack, database, security
│   ├── routes/          # Route-specific documentation (marketing, auth, admin, etc.)
│   ├── components/      # Component architecture (UI, booking flow)
│   └── services/        # Service integration guides (Supabase, notifications)
└── specs/               # Kiro SDD specifications per phase
```

📖 **For detailed route patterns, data flow, and implementation guides**, see route-specific docs in `docs/architecture/routes/`

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

## Kiro SDD Workflow

This project uses Kiro Spec-Driven Development. For each phase:

1. **Requirements**: Create `docs/specs/{phase}/requirements.md` (EARS format)
2. **Design**: Create `docs/specs/{phase}/design.md` (architecture, data models)
3. **Tasks**: Create `docs/specs/{phase}/tasks.md` (implementation checklist)
4. **Implement**: Use `/kc:impl [task-number]` command

## Session Context

Before starting work, check `.claude/tasks/context_session_x.md` for current context. Update after each session.

## Design System

**Clean & Elegant Professional** - Warm cream (#F8EEE5) background, charcoal (#434E54) primary, soft shadows, rounded corners.

📖 **For complete design system with color codes, typography, and component patterns**, see [Global Design System](docs/architecture/ARCHITECTURE.md#global-design-system) in ARCHITECTURE.md

**Quick Reference**:
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg` (soft, blurred)
- Corners: `rounded-lg`, `rounded-xl`
- Icons: Lucide React
- NO bold borders or chunky elements

## Available Agents

### Kiro Workflow Agents
- `kiro-requirement`: Requirements analysis (EARS format)
- `kiro-design`: Technical design documents
- `kiro-plan`: Implementation task planning
- `kiro-executor`: Focused implementation

### Frontend Workflow (Two-Step Orchestration)
- `frontend-expert`: **STEP 1 - DESIGN** - Creates UI/UX design specifications (layout, visual hierarchy, user flows)
- `daisyui-expert`: **STEP 2 - IMPLEMENT** - Implements design using DaisyUI + Tailwind, writes actual code

### Specialized Agents
- `nextjs-expert`: Next.js patterns and best practices
- `code-reviewer`: Architecture and security review
- `supabase-nextjs-expert`: Supabase + Next.js integration expert for authentication flows, database patterns, realtime subscriptions, RLS policies, and React Server Components architecture

## Frontend Development Workflow

For any UI/UX work, use the **two-step orchestration**:

**Step 1 - Design (`@agent-frontend-expert`)**:
- Creates comprehensive design specifications
- Defines layout, visual hierarchy, user flows, interactions
- Outputs: `.claude/design/[name].md`
- Focus: **WHAT** to build and **WHY**

**Step 2 - Implement (`@agent-daisyui-expert`)**:
- Reads design spec from frontend-expert
- Implements using DaisyUI components + Tailwind utilities
- Writes actual React/TypeScript code
- Focus: **HOW** to build with DaisyUI/Tailwind

**Example Usage**:
```bash
# Step 1: Create design
@agent-frontend-expert "Design a booking confirmation modal"
# → Outputs: .claude/design/booking-confirmation-modal.md

# Step 2: Implement design
@agent-daisyui-expert "Implement the booking confirmation modal design"
# → Reads design spec and writes the actual component code
```

## Database Schema

**Quick Reference**: Key tables: `users`, `pets`, `breeds`, `services`, `service_prices`, `addons`, `appointments`, `appointment_addons`, `waitlist`, `report_cards`, `memberships`, `customer_memberships`, `loyalty_points`, `loyalty_transactions`, `customer_flags`, `payments`, `site_content`, `promo_banners`, `gallery_images`, `settings`, `notifications_log`, `notification_templates`, `notification_settings`, `notification_template_history`

📖 **For detailed schema with relationships, RLS policies, and stored procedures**, see [Database Schema section](docs/architecture/ARCHITECTURE.md#database-schema) in ARCHITECTURE.md

## Business Information

📖 **For complete business details** (pricing, services, features, hours, contact), see [Business Information](docs/architecture/ARCHITECTURE.md#business-information) in ARCHITECTURE.md

**Quick Reference**:
- Size-based pricing: Small (0-18 lbs), Medium (19-35 lbs), Large (36-65 lbs), X-Large (66+ lbs)
- Core packages: Basic Grooming ($40-$85), Premium Grooming ($70-$150)
- Key features: Multi-step booking, waitlist, report cards, review routing, loyalty program

## Development Phases

📖 **For complete phase details with task breakdowns**, see [Development Phases](docs/architecture/ARCHITECTURE.md#development-phases) in ARCHITECTURE.md

**Current Status**:
- ✅ Completed: Phases 1-6, 8, 9, 11 (Foundation through Calendar Error Recovery)
- ⏸️ Pending: Phase 7 (Payments & Memberships)
- 🔄 In Progress: Phase 10 (Testing & Polish)

**Phase 11 (Calendar Error Recovery)** - COMPLETED:
- Retry queue system with exponential backoff (1min → 5min → 15min)
- Error recovery UI with filtering and batch retry
- Quota tracking with daily limits and warnings
- Auto-pause system after 10 consecutive failures
- 6 critical security fixes (CSRF, auth, SQL injection, N+1 queries, XSS, memory leaks)
