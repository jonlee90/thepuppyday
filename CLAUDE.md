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

## Design System

**Clean & Elegant Professional** - A refined, warm, trustworthy design aesthetic.

### Color Palette
- **Background**: #F8EEE5 (warm cream)
- **Primary/Buttons**: #434E54 (charcoal)
- **Primary Hover**: #363F44
- **Secondary**: #EAE0D5 (lighter cream)
- **Text Primary**: #434E54
- **Text Secondary**: #6B7280
- **Cards**: #FFFFFF or #FFFBF7

### Design Principles
- **Soft Shadows**: Use blurred shadows (`shadow-sm`, `shadow-md`, `shadow-lg`)
- **Subtle Borders**: Very thin (1px) or no borders (`border-gray-200`)
- **Gentle Corners**: `rounded-lg`, `rounded-xl`
- **Professional Typography**: Regular to semibold weights (Nunito, Poppins, Inter)
- **Clean Components**: Refined, uncluttered layouts with purposeful whitespace

### Visual Style
- Simple line-art dog silhouette logo
- Clean, professional icons (Lucide React)
- Organic blob shapes for visual interest
- Soft, subtle hover transitions
- NO bold borders, solid offset shadows, or chunky elements

## Business Information

- **Name**: Puppy Day
- **Location**: 14936 Leffingwell Rd, La Mirada, CA 90638
- **Phone**: (657) 252-2903
- **Email**: puppyday14936@gmail.com
- **Hours**: Monday-Saturday, 9:00 AM - 5:00 PM
- **Social Media**:
  - Instagram: @puppyday_lm
  - Yelp: Puppy Day La Mirada

## Available Agents

- `kiro-requirement`: Requirements analysis (EARS format)
- `kiro-design`: Technical design documents
- `kiro-plan`: Implementation task planning
- `daisyui-expert`: All task related to UI building & tweaking HAVE TO consult this agent
- `kiro-executor`: Focused implementation
- `nextjs-expert`: Next.js patterns and best practices
- `frontend-expert`: React + TypeScript + Tailwind + DaisyUI (Clean & Elegant Professional design)
- `code-reviewer`: Architecture and security review
- `supabase-nextjs-expert`: Supabase + Next.js integration expert for authentication flows, database patterns, realtime subscriptions, RLS policies, and React Server Components architecture
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

## Services & Pricing

### Grooming Packages

**Basic Grooming** - Shampoo, conditioner, nail trimming, filing, ear plucking, anal gland sanitizing, sanitary cut
- Small (0-18 lbs): $40
- Medium (19-35 lbs): $55
- Large (36-65 lbs): $70
- X-Large (66+ lbs): $85

**Premium Grooming** - Basic services plus styling
- Small: $70
- Medium: $95
- Large: $125
- X-Large: $150

### Add-ons
- Long Hair/Sporting: $10
- Teeth Brushing: $10
- Pawdicure: $15
- Flea & Tick Treatment: $25
- Tangle Removal: $5-$30

### Additional Services
- Day Care - Supervised playtime in safe, social environment

## Development Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Database | Completed |
| 2 | Public Marketing Site | Completed |
| 3 | Booking System | Completed |
| 4 | Customer Portal | Completed |
| 5 | Admin Panel Core | Completed |
| 6 | Admin Panel Advanced | Pending |
| 7 | Payments & Memberships | Pending |
| 8 | Notifications | Pending |
| 9 | Admin Settings | Pending |
| 10 | Testing & Polish | Pending |
