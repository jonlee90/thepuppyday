# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Puppy Day** - Full-stack dog grooming SaaS application for a business in La Mirada, CA.

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
└── specs/               # Kiro SDD specifications per phase
```

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

## Available Agents

- `kiro-requirement`: Requirements analysis (EARS format)
- `kiro-design`: Technical design documents
- `kiro-plan`: Implementation task planning
- `kiro-executor`: Focused implementation
- `nextjs-expert`: Next.js patterns and best practices
- `frontend-expert`: React + TypeScript + Tailwind + DaisyUI
- `code-reviewer`: Architecture and security review

## Database Schema

Key tables: `users`, `pets`, `breeds`, `services`, `service_prices`, `addons`, `appointments`, `appointment_addons`, `waitlist`, `report_cards`, `memberships`, `customer_memberships`, `loyalty_points`, `loyalty_transactions`, `customer_flags`, `payments`, `site_content`, `promo_banners`, `gallery_images`, `settings`, `notifications_log`

## Size-Based Pricing

| Size | Weight Range |
|------|--------------|
| Small | 0-18 lbs |
| Medium | 19-35 lbs |
| Large | 36-65 lbs |
| X-Large | 66+ lbs |

## Key Features

- Multi-step booking widget with size-based pricing
- Waitlist system for fully-booked slots
- Report cards with photo before/after
- Review routing (4-5 stars → Google, 1-3 stars → private feedback)
- Loyalty program support
- Breed-based grooming reminders

## Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Database | In Progress |
| 2 | Public Marketing Site | Pending |
| 3 | Booking System | Pending |
| 4 | Customer Portal | Pending |
| 5 | Admin Panel Core | Pending |
| 6 | Admin Panel Advanced | Pending |
| 7 | Payments & Memberships | Pending |
| 8 | Notifications | Pending |
| 9 | Admin Settings | Pending |
| 10 | Testing & Polish | Pending |
