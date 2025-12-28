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

**Playful, Dog-Themed UI/UX Guidelines**:
When working on UI/UX designs, incorporate a **playful, dog-themed vibe** that complements the professional aesthetic:

- **Dog-Themed Icons & Illustrations**:
  - Paw prints for success indicators or decorative elements
  - Dog silhouettes for navigation or empty states
  - Bone icons for loyalty points or rewards
  - Subtle dog-related illustrations in backgrounds or empty states

- **Fun Interactions & Animations**:
  - Wagging tail animations for success states
  - Bouncing paw prints during loading
  - Playful transitions (e.g., slide-in with a "bounce" like a happy dog)
  - Confetti or paw prints on appointment confirmation

- **Empty States with Personality**:
  - Dog-themed messaging when there's no content
  - Friendly illustrations of dogs waiting or playing
  - Encouraging CTAs that feel warm and inviting

- **Tone**: Maintain professional elegance while adding character - warm, inviting, and joyful without being childish

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

**Unified Modal System**: The application uses a single `BookingModal` component (`src/components/booking/BookingModal.tsx`) with mode-aware behavior for all booking entry points.

### Booking Modes & Step Flows

1. **Customer Mode** (`mode='customer'`) - Marketing page via sticky button:
   - Steps: Service → Date & Time → Customer (Login/Register) → Pet → Review (includes add-ons) → Confirmation
   - Total: 6 steps (0-5)
   - Entry: `StickyBookingButton` appears after scrolling 600px on marketing page

2. **Admin Mode** (`mode='admin'`) - Admin appointments page:
   - Steps: Service → Date & Time → Customer (Search/Create) → Pet → Review (includes add-ons) → Confirmation
   - Total: 6 steps (0-5)
   - Entry: "Create Appointment" button in `/admin/appointments`

3. **Walk-in Mode** (`mode='walkin'`) - Admin dashboard:
   - Steps: Service → Customer (Search/Create) → Pet → Review (includes add-ons) → Confirmation
   - Total: 5 steps (0-4)
   - Entry: "Walk-in" button in `/admin/dashboard`
   - Special: Date/Time auto-set to NOW, status set to `'checked_in'`, source tracked as `'walk_in'`

### Key Components

- **`BookingModal`**: Main modal container (max-w-[1000px] xl:max-w-[1200px] for tablet optimization)
- **`BookingWizard`**: Step orchestration with mode-aware rendering
- **`StickyBookingButton`**: Scroll-triggered booking trigger on marketing page (replaces embedded widget)
- **`CustomerStep`**: Mode-aware customer information collection
  - Customer mode: Login/Register UI
  - Admin/Walkin modes: Search existing + always-visible create form
- **`ReviewStep`**: Integrated add-ons selection (no separate AddonsStep)
- **Time Slots**: Generated hourly (60-minute intervals via `SLOT_INTERVAL_MINUTES = 60`)

📖 **For complete booking flow documentation**, see [Booking Flow](docs/architecture/components/booking-flow.md)

### Deprecated Components (Removed)

The following duplicate components were consolidated into the unified system:
- ❌ `src/components/admin/appointments/WalkInModal.tsx` (replaced by BookingModal with mode='walkin')
- ❌ `src/components/admin/appointments/ManualAppointmentModal.tsx` (replaced by BookingModal with mode='admin')
- ❌ `src/components/admin/appointments/steps/*.tsx` (all duplicate step components)
- ❌ Embedded booking widget on marketing page (replaced by StickyBookingButton)

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
- 🔄 In Progress: Phase 10 (Testing & Polish) - Booking modal refactor (✅), responsive admin layout (✅)

**Phase 10 (Testing & Polish)** - IN PROGRESS:
- ✅ **Booking Modal Refactor** (2025-12-26):
  - Consolidated duplicate booking components into unified `BookingModal`
  - Implemented mode-aware step flows (customer, admin, walkin)
  - Integrated add-ons into ReviewStep (removed separate AddonsStep)
  - Added `StickyBookingButton` on marketing page (replaced embedded widget)
  - Increased modal size for tablet optimization (1000px/1200px)
  - Changed time slots to hourly intervals (60 minutes)
  - Enhanced `CustomerStep` with login/register UI for customers and search/create for admin modes
  - Fixed walk-in appointment validation and persistence
- ✅ **Responsive Admin Layout** (2025-12-27):
  - Comprehensive responsive design for desktop, tablet, and mobile devices
  - Desktop: Full sidebar (256px) with collapse to icon-only (80px), dynamic content width
  - Tablet: Icon-only sidebar (72px, always visible) with tooltips and popover submenus
  - Mobile: Fixed header (56px) + bottom tab navigation (72px) + slide-in drawer
  - Bottom tabs: Home, Appointments, Walk-in (elevated center button), Customers, More
  - Walk-in button integration with BookingModal in walk-in mode
  - Eliminated dead space: Desktop collapsed sidebar gains ~496px usable space
  - Touch-optimized: 48-56px targets (WCAG AAA compliant)
  - Breakpoint utilities with React hooks for responsive behavior
  - Centralized state management with Zustand for drawer, tabs, and breakpoints
- 🔄 Comprehensive testing and performance optimization (pending)

**Phase 11 (Calendar Error Recovery)** - COMPLETED:
- Retry queue system with exponential backoff (1min → 5min → 15min)
- Error recovery UI with filtering and batch retry
- Quota tracking with daily limits and warnings
- Auto-pause system after 10 consecutive failures
- 6 critical security fixes (CSRF, auth, SQL injection, N+1 queries, XSS, memory leaks)
