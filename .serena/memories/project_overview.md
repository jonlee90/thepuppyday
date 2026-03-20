# The Puppy Day - Project Overview

Full-stack dog grooming SaaS for a business in La Mirada, CA.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **React**: 19.2
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL) — live connection
- **Auth**: Supabase Auth
- **Payments**: Stripe (pending)
- **Email**: Resend
- **Calendar**: Google Calendar API
- **Charts**: Chart.js, Recharts
- **Forms**: React Hook Form + Zod
- **State**: Zustand

## Project Structure
```
src/app/(marketing)/     - Public marketing site
src/app/(auth)/          - Login/register flows
src/app/(customer)/      - Customer portal (authenticated)
src/app/(admin)/         - Admin panel (role-protected)
src/app/api/             - API routes
src/components/ui/       - DaisyUI-based components
src/components/booking/  - Booking widget
src/components/customer/ - Customer portal
src/components/admin/    - Admin panel
src/lib/supabase/        - Supabase client & helpers
src/hooks/               - Custom React hooks
src/types/               - TypeScript types
src/stores/              - Zustand stores
docs/architecture/       - Architecture docs (source of truth)
docs/specs/              - Kiro SDD specs per phase
```
