# The Puppy Day - Master Architecture Documentation

> **Version**: 1.4
> **Last Updated**: 2026-03-07
> **Status**: Production-Ready (Phases 1-6, 8-9, 11 Complete | Admin Dashboard Redesign Complete | Phase 7 Pending | Phase 10 In Progress)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Global Design System](#global-design-system)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Security Model](#security-model)
7. [Module Documentation](#module-documentation)
8. [Development Workflow](#development-workflow)
9. [Environment Configuration](#environment-configuration)
10. [Deployment](#deployment)

---

## Project Overview

**The Puppy Day** is a comprehensive dog grooming SaaS application for a business located in La Mirada, CA. The platform manages the complete business workflow from customer acquisition to appointment scheduling, service delivery, and customer retention.

**Production Domain**: `thepuppyday.com`

### Business Information

- **Name**: Puppy Day
- **Location**: 14936 Leffingwell Rd, La Mirada, CA 90638
- **Phone**: (657) 252-2903
- **Email**: puppyday14936@gmail.com
- **Hours**: Monday-Saturday, 9:00 AM - 5:00 PM
- **Social Media**:
  - Instagram: @puppyday_lm
  - Yelp: Puppy Day La Mirada

### Core Features

1. **Public Marketing Site** - SEO-optimized landing pages with service information, gallery, and booking CTAs
2. **Customer Booking System** - Multi-step booking wizard with size-based pricing, real-time availability, and waitlist
3. **Customer Portal** - Self-service dashboard for managing appointments, pets, profiles, and viewing report cards
4. **Admin Panel** - Complete business management including appointments, customers, services, analytics, and notifications
5. **Notification System** - Multi-channel (Email/SMS) notifications with template management and customer preferences
6. **Google Calendar Integration** - Bidirectional sync with error recovery, retry queue, and quota tracking
7. **Payment Processing** - Stripe integration for deposits, full payments, tips, and refunds (Phase 7)
8. **Loyalty Program** - Punch-card based rewards system with referral program

### Development Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation & Database | Completed | Database schema, migrations, type system, mock services |
| 2 | Public Marketing Site | Completed | Homepage, services, gallery, SEO, promotional banners |
| 3 | Booking System | Completed | Multi-step booking wizard, availability, waitlist, guest users |
| 4 | Customer Portal | Completed | Dashboard, appointments, pets, profile, report cards |
| 5 | Admin Panel Core | Completed | Dashboard, appointments, customers, services, gallery |
| 6 | Admin Panel Advanced | Completed | Analytics, marketing campaigns, admin appointment management with CSV import and walk-in appointments |
| 7 | Payments & Memberships | Pending | Stripe integration, memberships, loyalty program |
| 8 | Notifications | Completed | Templates, triggers, preferences, email/SMS providers, unsubscribe system |
| 9 | Admin Settings | Completed | Business settings, staff management, site content, banners |
| 10 | Testing & Polish | In Progress | Booking modal refactor (done), responsive admin layout (done), admin RLS fixes (done), comprehensive testing, performance optimization |
| 11 | Calendar Error Recovery | Completed | Retry queue, error recovery UI, quota tracking, auto-pause system |
| F | Admin Dashboard Redesign | Completed | Replaced DashboardStats/TodayAppointments/PendingAppointments with RevenueOverview, DashboardTimeline, ProductivityWidget, WaitlistWidget, PendingActionsWidget, QuickAccess pills; useDashboardData hook; revenue-overview API endpoint |

---

## Technology Stack

### Core Framework & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | React framework with App Router for SSR, SSG, and API routes |
| **React** | 19.2.0 | UI library for component-based interfaces |
| **TypeScript** | 5.9.3 | Type-safe JavaScript with strict mode enabled |
| **Node.js** | 20+ | JavaScript runtime for server-side execution |

### Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | ^4 | Utility-first CSS framework for rapid styling |
| **DaisyUI** | 5.5.8 | Component library built on Tailwind with Clean & Elegant theme |
| **Framer Motion** | 12.23.25 | Animation library for smooth transitions and interactions |
| **Lucide React** | 0.560.0 | Icon library with clean, professional SVG icons |
| **clsx** | 2.1.1 | Utility for conditional className construction |
| **tailwind-merge** | 3.4.0 | Merges Tailwind classes without conflicts |

### Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.86.2 | PostgreSQL database, authentication, storage, and real-time subscriptions |
| **@supabase/ssr** | 0.8.0 | Server-side rendering utilities for Supabase in Next.js |
| **googleapis** | 169.0.0 | Google Calendar API integration for bidirectional sync |

### External Services

| Service | Version | Purpose |
|---------|---------|---------|
| **Stripe** | (Pending Phase 7) | Payment processing for deposits, full payments, tips, refunds |
| **Resend** | 6.9.3 | Transactional email delivery for notifications (from: `noreply@thepuppyday.com`) |
| **Twilio** | 5.12.2 | SMS delivery for appointment reminders and notifications |

### State Management & Forms

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.9 | Lightweight state management for global app state |
| **React Hook Form** | 7.68.0 | Performant form handling with minimal re-renders |
| **Zod** | 4.1.13 | TypeScript-first schema validation for forms and APIs |
| **@hookform/resolvers** | 5.2.2 | Zod resolver integration for React Hook Form |

### Data Visualization & Calendar

| Technology | Version | Purpose |
|------------|---------|---------|
| **FullCalendar** | 6.1.19 | Interactive calendar for appointment scheduling |
| **Chart.js** | 4.5.1 | Chart library for analytics dashboards |
| **react-chartjs-2** | 5.3.1 | React wrapper for Chart.js |
| **Recharts** | 3.5.1 | Composable charting library for analytics |

### File Handling & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **PapaParse** | 5.5.3 | CSV parsing for bulk appointment imports |
| **jsPDF** | 3.0.4 | PDF generation for reports and exports |
| **jspdf-autotable** | 5.0.2 | Table generation for PDF exports |
| **browser-image-compression** | 2.0.2 | Client-side image compression for photo uploads |
| **react-dropzone** | 14.3.8 | Drag-and-drop file upload component |
| **react-compare-image** | 3.5.13 | Before/after image comparison slider |
| **isomorphic-dompurify** | 2.34.0 | HTML sanitization for user-generated content |

### Date & Time

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 4.1.0 | Modern JavaScript date utility library |
| **date-fns-tz** | 3.2.0 | Timezone support for date-fns |

### Drag & Drop

| Technology | Version | Purpose |
|------------|---------|---------|
| **@dnd-kit/core** | 6.3.1 | Modern drag-and-drop toolkit |
| **@dnd-kit/sortable** | 10.0.0 | Sortable list functionality |
| **@dnd-kit/utilities** | 3.2.2 | Utilities for dnd-kit |

### UI Components

| Technology | Version | Purpose |
|------------|---------|---------|
| **Swiper** | 12.0.3 | Modern touch slider for image galleries |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 4.0.15 | Fast unit test framework with Vite-native support |
| **@vitest/ui** | 4.0.15 | Visual UI for running and debugging tests |
| **@vitest/coverage-v8** | 4.0.15 | Code coverage reporting |
| **@vitest/browser** | 4.0.15 | Browser-based test runner |
| **@testing-library/react** | 16.3.0 | React component testing utilities |
| **@testing-library/jest-dom** | 6.9.1 | Custom matchers for DOM assertions |
| **@testing-library/user-event** | 14.6.1 | User interaction simulation |
| **happy-dom** | 20.0.11 | Lightweight DOM implementation for testing |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | ^9 | JavaScript/TypeScript linting |
| **eslint-config-next** | 16.0.7 | Next.js-specific ESLint configuration |
| **tsx** | 4.21.0 | TypeScript execution for scripts |
| **pg** | 8.16.3 | PostgreSQL client for database scripts |

---

## Global Design System

### Design Philosophy: Clean & Elegant Professional

The Puppy Day brand aesthetic is **refined, warm, and trustworthy** - a professional pet care service that emphasizes cleanliness, expertise, and customer care.

### Color Palette

```typescript
// Primary Colors
const colors = {
  background: '#F8EEE5',      // Warm cream background
  primary: '#434E54',         // Charcoal for buttons and primary text
  primaryHover: '#363F44',    // Darker charcoal for hover states
  secondary: '#EAE0D5',       // Lighter cream for secondary elements
  accent: '#4ECDC4',          // Sky blue for playful accents (kept from original)

  // Text Colors
  textPrimary: '#434E54',     // Primary text (charcoal)
  textSecondary: '#6B7280',   // Secondary text (gray-500)

  // Card Colors
  cardBackground: '#FFFFFF',  // White cards for contrast
  cardAlt: '#FFFBF7',         // Slightly warm white alternative

  // Utility Colors
  info: '#74B9FF',            // Information blue
  success: '#6BCB77',         // Success green
  warning: '#FFB347',         // Warning orange
  error: '#FF6B6B',           // Error red
};
```

### DaisyUI Theme Configuration

Located in `src/app/globals.css`:

```css
[data-theme="light"] {
  --p: 67 78 84;           /* Primary: Charcoal */
  --pf: 54 63 68;          /* Primary Focus: Darker charcoal */
  --s: 234 224 213;        /* Secondary: Lighter cream */
  --a: 78 205 196;         /* Accent: Sky Blue */
  --n: 67 78 84;           /* Neutral: Charcoal */
  --b1: 248 238 229;       /* Base: Warm cream */
  --b2: 234 224 213;       /* Base-200: Darker cream */
  --b3: 220 210 199;       /* Base-300: Even darker */
  --rounded-box: 1rem;     /* Card border radius */
  --rounded-btn: 0.5rem;   /* Button border radius */
}
```

### Typography

**Font Families**:
- **Headings**: Variable `--font-heading` (Nunito/system) - Clean, rounded, professional
- **Body Text**: Variable `--font-body` (Inter/system) - Highly legible, modern
- **Fallback**: system-ui, -apple-system, sans-serif

**Font Weights**:
- Regular (400): Body text
- Bold (700): Headings

**CSS Implementation**:
```css
body {
  font-family: var(--font-body), system-ui, -apple-system, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
  font-weight: 700;
}
```

### Design Principles

#### 1. Soft Shadows (NO harsh shadows)
```typescript
// Tailwind CSS shadow classes
shadow-sm   // Subtle shadow for cards
shadow-md   // Medium shadow for interactive elements
shadow-lg   // Larger shadow for modals and popovers
```

#### 2. Subtle Borders
```typescript
// Prefer minimal or no borders
border-0        // No border (default for clean look)
border          // 1px border when needed
border-gray-200 // Light gray when border is required
```

#### 3. Gentle Rounded Corners
```typescript
rounded-lg   // 0.5rem - Default for cards
rounded-xl   // 0.75rem - Larger containers
rounded-full // Pills and badges
```

#### 4. Professional Spacing
```typescript
// Purposeful whitespace using Tailwind spacing scale
p-4, p-6, p-8      // Padding
gap-4, gap-6       // Flexbox/Grid gaps
space-y-4, space-x-4 // Stack spacing
```

#### 5. Smooth Transitions
```typescript
transition-all duration-200 ease-in-out  // Button hover states
transition-opacity duration-300          // Fade effects
```

### Visual Components

#### Buttons
```typescript
// Primary button example
<Button variant="primary" size="md">
  Book Appointment
</Button>

// Rendered with:
// - background: #434E54 (charcoal)
// - color: white
// - rounded-lg (0.5rem corners)
// - shadow-sm
// - hover:shadow-md transition
```

#### Cards
```typescript
// Card component styling
<div className="card bg-white shadow-md rounded-lg p-6">
  <h3 className="text-lg font-semibold text-primary">Card Title</h3>
  <p className="text-sm text-gray-600">Card description</p>
</div>

// Hover state: shadow-lg
```

#### Icons
- **Library**: Lucide React (clean, professional SVG icons)
- **Size**: 16px (sm), 20px (md), 24px (lg)
- **Color**: Inherits from parent or explicit color classes
- **Style**: Minimalist line art matching brand aesthetic

### Custom Animations

Defined in `src/app/globals.css`:

- **slide-in-right**: Toast notifications slide in from right
- **scale-in**: Modal scale-in entrance
- **slideDown**: Quota warning slide down
- **slideDownShake**: Paused sync banner with attention shake
- **shake**: Error state shake animation

### Accessibility

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 ratio)
- **Focus Indicators**: Visible focus rings on all interactive elements
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support for all interactions

### Playful, Dog-Themed UI/UX Guidelines

The Puppy Day embraces a **playful, dog-themed personality** that complements the clean, professional design system. When creating UI/UX, incorporate these elements to add warmth and character:

#### Playful Copy & Microcopy

Use warm, friendly language with occasional dog-related terminology:

**Loading States**: "Fetching your appointment...", "Sniffing out available times..."
**Empty States**: "No appointments yet - time to pamper your pup!"
**Success Messages**: "Woof! Appointment booked successfully!"
**Error Messages** (keep friendly): "Ruff! Something went wrong. Let's try that again."

#### Tone Guidelines

- **High Delight Moments**: Booking confirmation, success states, empty states -> More playful
- **Transactional Moments**: Payment processing, account settings -> More professional
- **Error/Help States**: Error messages, support -> Friendly but helpful, not overly playful

---

## Project Structure

```
thepuppyday/
├── src/
│   ├── app/                         # Next.js App Router (all routes)
│   │   ├── (marketing)/             # Public marketing site
│   │   │   ├── layout.tsx           # Marketing layout with header/footer
│   │   │   ├── page.tsx             # Homepage
│   │   │   └── book/page.tsx        # Booking widget page
│   │   ├── (auth)/                  # Authentication flows
│   │   │   ├── layout.tsx           # Auth layout (centered, minimal)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (customer)/              # Customer portal (authenticated)
│   │   │   ├── layout.tsx           # Customer layout with sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx         # Appointment list
│   │   │   │   └── [id]/page.tsx    # Appointment detail
│   │   │   ├── pets/
│   │   │   │   ├── page.tsx         # Pet list
│   │   │   │   └── [id]/page.tsx    # Pet profile
│   │   │   ├── profile/page.tsx
│   │   │   ├── loyalty/page.tsx
│   │   │   ├── membership/page.tsx
│   │   │   └── report-cards/page.tsx
│   │   ├── admin/                   # Admin panel (role-protected)
│   │   │   ├── layout.tsx           # Admin layout with sidebar
│   │   │   ├── page.tsx             # Admin home
│   │   │   ├── dashboard/           # Admin dashboard
│   │   │   ├── appointments/        # Appointment management
│   │   │   │   └── [id]/report-card/page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── addons/page.tsx
│   │   │   ├── gallery/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── waitlist/page.tsx
│   │   │   ├── marketing/campaigns/
│   │   │   ├── notifications/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── templates/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   ├── log/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx         # Settings dashboard
│   │   │       ├── banners/page.tsx
│   │   │       ├── booking/
│   │   │       │   ├── page.tsx
│   │   │       │   └── blocked-dates/page.tsx
│   │   │       ├── business-hours/page.tsx
│   │   │       ├── calendar/page.tsx  # Google Calendar settings
│   │   │       ├── loyalty/
│   │   │       │   ├── page.tsx
│   │   │       │   └── punch-card-demo/page.tsx
│   │   │       ├── site-content/page.tsx
│   │   │       └── staff/page.tsx
│   │   ├── api/                     # API Routes (see API Routes section)
│   │   ├── robots.ts                # SEO robots.txt generation
│   │   ├── sitemap.ts               # SEO sitemap.xml generation
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles & DaisyUI theme
│   │   └── ErrorFilter.tsx          # Error boundary component
│   ├── components/
│   │   ├── ui/                      # Base UI components (DaisyUI-based)
│   │   ├── booking/                 # Booking widget components
│   │   │   ├── BookingModal.tsx     # Unified modal (customer/admin/walkin modes)
│   │   │   ├── BookingWizard.tsx    # Step orchestration
│   │   │   ├── ServiceCard.tsx      # Service selection card
│   │   │   ├── StickyBookingButton.tsx # Floating booking CTA
│   │   │   └── steps/              # Booking wizard steps
│   │   │       ├── ServiceStep.tsx
│   │   │       ├── DateTimeStep.tsx
│   │   │       ├── DetailsStep.tsx  # Consolidated customer/pet details
│   │   │       ├── AddonsStep.tsx
│   │   │       ├── ReviewStep.tsx
│   │   │       ├── WalkinReviewStep.tsx
│   │   │       └── ConfirmationStep.tsx
│   │   ├── customer/               # Customer portal components
│   │   ├── admin/                  # Admin panel components
│   │   ├── marketing/              # Marketing site components
│   │   └── providers/              # Context providers
│   ├── lib/                        # Business logic & utilities
│   │   ├── supabase/               # Supabase client & helpers
│   │   │   ├── client.ts           # Browser client factory
│   │   │   ├── server.ts           # Server client factory + service role client
│   │   │   └── middleware.ts       # Auth middleware helpers
│   │   ├── booking/                # Booking logic
│   │   ├── admin/                  # Admin utilities
│   │   ├── notifications/          # Notification system
│   │   │   ├── service.ts          # DefaultNotificationService
│   │   │   ├── types.ts            # TypeScript interfaces
│   │   │   ├── database-types.ts   # Notification table types
│   │   │   ├── providers/          # Email/SMS providers
│   │   │   ├── template-engine.ts  # Template rendering
│   │   │   ├── logger.ts           # Notification logging
│   │   │   ├── preferences.ts      # Customer preferences
│   │   │   ├── unsubscribe.ts      # Unsubscribe tokens
│   │   │   ├── errors.ts           # Error classification
│   │   │   ├── retry-manager.ts    # Retry queue management
│   │   │   └── query-helpers.ts    # Database query helpers
│   │   ├── calendar/               # Google Calendar integration
│   │   ├── resend/                 # Resend email client & provider
│   │   ├── twilio/                 # Twilio SMS client
│   │   ├── stripe/                 # Stripe utilities (Phase 7)
│   │   ├── auth/                   # Auth utilities
│   │   ├── loyalty/                # Loyalty program logic
│   │   ├── cron/                   # Scheduled job handlers
│   │   ├── cache/                  # Caching utilities
│   │   ├── db/                     # Database utilities
│   │   ├── api/                    # API utilities
│   │   ├── security/               # Security utilities
│   │   ├── accessibility/          # Accessibility helpers
│   │   ├── performance/            # Performance utilities
│   │   ├── error-tracking/         # Error tracking
│   │   ├── errors/                 # Error handling
│   │   ├── validation/             # Shared validation schemas
│   │   ├── validations/            # Additional validations
│   │   ├── utils/                  # General utilities
│   │   ├── config.ts               # Environment config
│   │   ├── utils.ts                # Shared utility functions
│   │   ├── rate-limit.ts           # Rate limiting
│   │   ├── site-content.ts         # Site content helpers
│   │   ├── campaign-templates.ts   # Campaign template helpers
│   │   └── campaign-validation.ts  # Campaign validation
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-auth.ts             # Authentication hook
│   │   ├── useBooking.ts           # Booking state management
│   │   ├── useBookingSubmit.ts     # Booking submission logic
│   │   ├── useBookingModal.ts      # Booking modal control
│   │   ├── useServices.ts          # Services data hook
│   │   ├── useAddons.ts            # Addons data hook
│   │   ├── useAvailability.ts      # Availability checking
│   │   ├── usePets.ts              # Pets data hook
│   │   ├── usePhoneMask.ts         # Phone input mask
│   │   ├── use-toast.ts            # Toast notifications
│   │   └── use-create-campaign.ts  # Campaign creation
│   ├── types/                      # TypeScript type definitions
│   │   ├── supabase.ts             # Auto-generated Supabase types (SOURCE OF TRUTH)
│   │   ├── database.ts             # Database enums and helpers
│   │   ├── calendar.ts             # Calendar integration types
│   │   ├── settings.ts             # Settings types (booking, loyalty, staff, etc.)
│   │   └── index.ts                # Type exports
│   ├── stores/                     # Zustand state stores
│   │   ├── auth-store.ts           # Global auth state
│   │   ├── bookingStore.ts         # Booking wizard state
│   │   └── admin-store.ts          # Admin panel state
│   └── mocks/                      # Mock service implementations
│       ├── supabase/
│       │   ├── client.ts           # Mock Supabase client
│       │   ├── store.ts            # In-memory database
│       │   └── seed.ts             # Mock data seeding
│       └── resend/                 # Mock Resend client
├── docs/                           # Documentation
│   ├── architecture/               # Architecture documentation (THIS DIRECTORY)
│   │   ├── ARCHITECTURE.md         # Master architecture doc (this file)
│   │   ├── routes/                 # Route-specific docs
│   │   ├── components/             # Component docs
│   │   └── services/               # Service docs
│   └── specs/                      # Kiro SDD specifications
├── nginx/                          # Nginx configuration
│   └── thepuppyday.conf            # Production Nginx config
├── deploy.sh                       # Deployment script
├── ecosystem.config.cjs            # PM2 process manager config
├── middleware.ts                    # Next.js middleware (route protection)
├── vitest.config.ts                # Vitest test configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── CLAUDE.md                       # Project instructions for AI agents
└── README.md                       # Project README
```

### Key Structural Patterns

#### 1. Route Groups
Next.js App Router uses route groups to organize routes without affecting URL structure:
- `(marketing)/` - Public pages (no auth required)
- `(auth)/` - Authentication flows
- `(customer)/` - Customer portal (requires auth, customer role)
- `admin/` - Admin panel (requires auth, admin/groomer role)

#### 2. API Route Organization
- `/api/admin/*` - Admin-only endpoints (protected by middleware & requireAdmin)
- `/api/customer/*` - Customer-specific endpoints (protected by session auth)
- `/api/cron/*` - Scheduled job endpoints
- `/api/webhooks/*` - External service webhooks
- `/api/*` - Public endpoints (services, availability, booking)

#### 3. Type System
- `supabase.ts` - Auto-generated Supabase types (source of truth for DB schema)
- `database.ts` - Database enums and helper types
- `calendar.ts` - Calendar integration types
- `settings.ts` - Settings, booking, loyalty, and staff types

#### 4. SEO Files
- `src/app/robots.ts` - Generates robots.txt (allows `/`, disallows `/api/`, `/admin/`, `/dashboard/`, `/profile/`)
- `src/app/sitemap.ts` - Generates sitemap.xml for `thepuppyday.com` (home, services, gallery, about, contact)

---

## Database Schema

### Overview

The Puppy Day database uses **PostgreSQL** via **Supabase** with comprehensive Row-Level Security (RLS) policies and stored procedures for authorization. The source of truth for table schemas is `src/types/supabase.ts`.

### Core Tables

#### 1. `users` Table
Extends Supabase Auth with business-specific fields.

```typescript
interface User {
  id: string;                      // UUID (primary key, matches auth.users)
  email: string;                   // Unique, case-insensitive
  phone: string | null;            // Phone number
  first_name: string;              // First name
  last_name: string;               // Last name
  role: string | null;             // 'customer' | 'admin' | 'groomer'
  avatar_url: string | null;       // Profile photo URL
  preferences: Json | null;        // JSON column for notification preferences
  created_at: string | null;
  updated_at: string | null;
}
```

**RLS Policies**:
- Users can read their own data
- Admins can read/update all users
- Public can create customers during registration

#### 2. `pets` Table
Pet profiles owned by customers.

```typescript
interface Pet {
  id: string;                      // UUID (primary key)
  owner_id: string;                // Foreign key -> users.id
  name: string;                    // Pet name
  breed_id: string | null;         // Foreign key -> breeds.id
  breed_custom: string | null;     // Custom breed name (if breed_id is null)
  size: string;                    // 'small' | 'medium' | 'large' | 'xlarge'
  weight: number | null;           // Weight in pounds
  birth_date: string | null;       // Date of birth
  notes: string | null;            // General notes
  medical_info: string | null;     // Medical information
  photo_url: string | null;        // Pet photo URL (Supabase Storage)
  is_active: boolean | null;       // Soft delete flag
  created_at: string | null;
  updated_at: string | null;
}
```

**Size Weight Ranges**:
```typescript
const SIZE_WEIGHT_RANGES = {
  small: { min: 0, max: 18 },      // 0-18 lbs
  medium: { min: 19, max: 35 },    // 19-35 lbs
  large: { min: 36, max: 65 },     // 36-65 lbs
  xlarge: { min: 66, max: Infinity } // 66+ lbs
};
```

**RLS Policies**:
- Users can CRUD their own pets
- Admins can read all pets

#### 3. `breeds` Table
Reference table for dog breeds.

```typescript
interface Breed {
  id: string;                      // UUID
  name: string;                    // Breed name (e.g., "Golden Retriever")
  grooming_frequency_weeks: number | null; // Recommended grooming frequency
  reminder_message: string | null;  // Custom reminder message
  created_at: string | null;
}
```

#### 4. `services` Table
Grooming service types.

```typescript
interface Service {
  id: string;                      // UUID
  name: string;                    // Service name (e.g., "Basic Grooming")
  description: string | null;      // Service description
  duration_minutes: number;        // Service duration
  image_url: string | null;        // Service image URL
  is_active: boolean | null;       // Availability flag
  display_order: number | null;    // Display order
  created_at: string | null;
}
```

#### 5. `service_prices` Table
Size-based pricing for services.

```typescript
interface ServicePrice {
  id: string;                      // UUID
  service_id: string;              // Foreign key -> services.id
  size: string;                    // 'small' | 'medium' | 'large' | 'xlarge'
  price: number;                   // Price in dollars (e.g., 40.00)
}
```

**Example Pricing**:
- Basic Grooming: Small ($40), Medium ($55), Large ($65), X-Large ($85)
- Premium Grooming: Small ($70), Medium ($95), Large ($125), X-Large ($150)

#### 6. `addons` Table
Optional add-on services.

```typescript
interface Addon {
  id: string;                      // UUID
  name: string;                    // Addon name (e.g., "Teeth Brushing")
  description: string | null;      // Description
  price: number;                   // Fixed price
  is_active: boolean | null;       // Availability flag
  display_order: number | null;    // Display order
  upsell_breeds: string[] | null;  // Breeds to upsell to
  upsell_prompt: string | null;    // Upsell prompt text
  created_at: string | null;
}
```

#### 7. `appointments` Table
Scheduled grooming appointments.

```typescript
interface Appointment {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  pet_id: string;                  // Foreign key -> pets.id
  service_id: string;              // Foreign key -> services.id
  groomer_id: string | null;       // Foreign key -> users.id (assigned groomer)
  booking_reference: string | null; // Human-readable booking reference code
  scheduled_at: string;            // ISO 8601 datetime
  duration_minutes: number;        // Appointment duration
  status: string | null;           // Appointment status
  payment_status: string | null;   // Payment status
  total_price: number;             // Total appointment cost
  notes: string | null;            // Special instructions / notes
  created_at: string | null;
  updated_at: string | null;
}
```

**Relationships**:
- `customer_id` -> `users.id`
- `groomer_id` -> `users.id`
- `pet_id` -> `pets.id`
- `service_id` -> `services.id`

**Status Values**:
```typescript
type AppointmentStatus =
  | 'pending'      // Initial state after booking
  | 'confirmed'    // Admin confirmed the appointment
  | 'checked_in'   // Customer arrived
  | 'in_progress'  // Service in progress
  | 'completed'    // Completed and picked up
  | 'cancelled'    // Cancelled by customer or admin
  | 'no_show';     // Customer didn't show up
```

#### 8. `appointment_addons` Table
Many-to-many relationship for appointment addons.

```typescript
interface AppointmentAddon {
  id: string;                      // UUID
  appointment_id: string;          // Foreign key -> appointments.id
  addon_id: string;                // Foreign key -> addons.id
  price: number;                   // Price at time of booking (historical)
}
```

#### 9. `waitlist` Table
Waitlist entries for fully-booked time slots.

```typescript
interface WaitlistEntry {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  pet_id: string;                  // Foreign key -> pets.id
  service_id: string;              // Foreign key -> services.id
  requested_date: string;          // Requested date (ISO 8601)
  time_preference: string | null;  // 'morning' | 'afternoon' | 'any'
  status: string | null;           // Status enum
  notified_at: string | null;      // When customer was notified
  created_at: string | null;
}
```

**Status Values**: `active`, `notified`, `booked`, `expired`, `expired_offer`, `cancelled`

#### 10. `report_cards` Table
Post-grooming report cards with photos.

```typescript
interface ReportCard {
  id: string;                      // UUID
  appointment_id: string;          // Foreign key -> appointments.id (unique, 1:1)
  mood: string | null;             // 'happy' | 'nervous' | 'calm' | 'energetic'
  coat_condition: string | null;   // 'excellent' | 'good' | 'matted' | 'needs_attention'
  behavior: string | null;         // 'great' | 'some_difficulty' | 'required_extra_care'
  health_observations: string[] | null; // Array of health observations
  groomer_notes: string | null;    // General notes
  before_photo_url: string | null; // Before photo (Supabase Storage)
  after_photo_url: string | null;  // After photo (Supabase Storage)
  rating: number | null;           // Customer rating
  feedback: string | null;         // Customer feedback
  created_at: string | null;
}
```

#### 11. `memberships` Table
Membership plan definitions.

```typescript
interface Membership {
  id: string;                      // UUID
  name: string;                    // Plan name (e.g., "Monthly Unlimited")
  description: string | null;      // Plan description
  price: number;                   // Monthly/yearly price
  billing_frequency: string | null; // 'monthly' | 'yearly'
  benefits: Json | null;           // JSONB - plan benefits/perks
  is_active: boolean | null;       // Availability flag
  created_at: string | null;
}
```

#### 12. `customer_memberships` Table
Customer membership subscriptions.

```typescript
interface CustomerMembership {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  membership_id: string;           // Foreign key -> memberships.id
  status: string | null;           // 'active' | 'paused' | 'cancelled'
  current_period_end: string | null; // Current billing period end date
  stripe_subscription_id: string | null; // Stripe subscription ID
  created_at: string | null;
}
```

#### 13. `loyalty_points` Table
Customer loyalty point balances.

```typescript
interface LoyaltyPoints {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id (unique, 1:1)
  points_balance: number | null;   // Current balance
  lifetime_points: number | null;  // Total earned all-time
}
```

#### 14. `loyalty_transactions` Table
Loyalty point transaction history.

```typescript
interface LoyaltyTransaction {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  type: string | null;             // 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: number;                  // Points (positive for earned, negative for redeemed)
  reference_type: string | null;   // Reference type (e.g., 'appointment')
  reference_id: string | null;     // Reference ID
  notes: string | null;            // Transaction notes
  created_at: string | null;
}
```

#### 15. `customer_flags` Table
Admin flags for customer accounts. Uses a **flag-per-row** model.

```typescript
interface CustomerFlag {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  reason: string;                  // Flag reason (required)
  flagged_by: string | null;       // Foreign key -> users.id (admin who flagged)
  notes: string | null;            // Internal notes
  is_active: boolean | null;       // Whether the flag is currently active
  created_at: string | null;
}
```

**Database Enums** (defined in `src/types/database.ts`):
```typescript
type customer_flag_color = 'red' | 'yellow' | 'green';
type customer_flag_type = 'aggressive_dog' | 'payment_issues' | 'vip' | 'special_needs' | 'grooming_notes' | 'other';
```

#### 16. `payments` Table
Payment transaction records.

```typescript
interface Payment {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  appointment_id: string | null;   // Foreign key -> appointments.id
  amount: number;                  // Payment amount
  tip_amount: number | null;       // Tip amount
  payment_method: string | null;   // Payment method type
  stripe_payment_intent_id: string | null; // Stripe Payment Intent ID
  status: string | null;           // 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  created_at: string | null;
}
```

#### 17. `site_content` Table
CMS for marketing site content. Uses **section-based JSON storage**.

```typescript
interface SiteContent {
  id: string;                      // UUID
  section: string;                 // Section key (e.g., "hero", "seo", "business_info")
  content: Json;                   // JSON content for the section
  updated_at: string | null;
}
```

#### 18. `promo_banners` Table
Image-based promotional banner management.

```typescript
interface PromoBanner {
  id: string;                      // UUID
  image_url: string;               // Banner image URL (required)
  alt_text: string | null;         // Image alt text
  click_url: string | null;        // URL when banner is clicked
  click_count: number | null;      // Click tracking counter
  is_active: boolean | null;       // Display flag
  display_order: number | null;    // Display order
  start_date: string | null;       // Scheduled start date
  end_date: string | null;         // Scheduled end date
  created_at: string | null;
}
```

#### 19. `gallery_images` Table
Marketing gallery images with metadata.

```typescript
interface GalleryImage {
  id: string;                      // UUID
  image_url: string;               // Image URL (Supabase Storage)
  caption: string | null;          // Image caption
  dog_name: string | null;         // Name of the dog
  breed: string | null;            // Breed of the dog
  tags: string[] | null;           // Tags for filtering
  is_before_after: boolean | null; // Whether this is a before/after pair
  before_image_url: string | null; // Before image (if is_before_after)
  is_published: boolean | null;    // Published flag
  display_order: number | null;    // Display order
  created_at: string | null;
}
```

#### 20. `settings` Table
Global application settings (key-value JSON store).

```typescript
interface Settings {
  id: string;                      // UUID
  key: string;                     // Unique key (e.g., "business_hours", "booking_settings")
  value: Json;                     // JSON value
  updated_at: string | null;
}
```

**Common Settings Keys**:
- `business_hours` - Operating hours (uses `BusinessHours` type)
- `booking_settings` - Booking rules (uses `BookingSettings` type)
- `phase6_settings` - Report card, waitlist, marketing settings
- `notification_templates` - Notification template content
- `loyalty_settings` - Loyalty program configuration
- `calendar_sync_settings` - Calendar sync configuration

#### 21. `notifications_log` Table
Notification delivery log.

```typescript
interface NotificationLog {
  id: string;                      // UUID
  customer_id: string | null;      // Foreign key -> users.id
  type: string;                    // Notification type (e.g., "appointment_reminder")
  channel: string | null;          // 'email' | 'sms'
  recipient: string;               // Email or phone number
  subject: string | null;          // Email subject
  content: string | null;          // Message content
  status: string | null;           // 'pending' | 'sent' | 'failed'
  error_message: string | null;    // Error details if failed
  sent_at: string | null;          // Delivery timestamp
  created_at: string | null;
}
```

**Extended fields** (defined in `src/lib/notifications/database-types.ts`):
- `template_id`, `template_data` - Template reference and rendered data
- `campaign_id`, `campaign_send_id` - Marketing campaign tracking
- `tracking_id`, `clicked_at`, `delivered_at` - Email engagement tracking
- `retry_count`, `retry_after` - Retry management
- `is_test`, `message_id`, `cost_cents` - Operational metadata

### Additional Tables (defined in types and mock store)

#### 22. `notification_templates` Table
Versioned notification templates.

```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;                    // notification_type (e.g., 'booking_confirmation')
  trigger_event: string;           // (e.g., 'appointment_created')
  channel: string;                 // 'email' | 'sms'
  subject_template: string | null; // For email only
  html_template: string | null;    // For email only
  text_template: string;           // For SMS or email plain text
  variables: Json;                 // JSONB array of template variables
  is_active: boolean;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
```

#### 23. `notification_settings` Table
Per-type notification configuration.

```typescript
interface NotificationSettings {
  notification_type: string;       // Primary key
  email_enabled: boolean;
  sms_enabled: boolean;
  email_template_id: string | null;
  sms_template_id: string | null;
  schedule_cron: string | null;
  schedule_enabled: boolean;
  max_retries: number;
  retry_delays_seconds: number[];  // Array of retry delays
  last_sent_at: string | null;
  total_sent_count: number;
  total_failed_count: number;
  created_at: string;
  updated_at: string;
}
```

#### 24. `notification_template_history` Table
Version history for notification templates (read-only audit trail).

```typescript
interface NotificationTemplateHistory {
  id: string;
  template_id: string;
  version: number;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string;
  channel: string;
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: Json | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}
```

#### 25. `marketing_campaigns` Table
Marketing campaign definitions.

#### 26. `campaign_sends` Table
Individual campaign send records.

#### 27. `marketing_unsubscribes` Table
Marketing email unsubscribe records.

#### 28. `reviews` Table
Customer reviews.

#### 29. `before_after_pairs` Table
Before/after grooming photo pairs.

#### 30. `staff_commissions` Table
Staff commission rate configuration.

#### 31. `settings_audit_log` Table
Audit trail for settings changes.

#### 32. Calendar Integration Tables (defined in `src/types/calendar.ts`)

**`calendar_connections`** - OAuth tokens and Google Calendar metadata:
```typescript
interface CalendarConnection {
  id: string;
  admin_id: string;
  access_token: string;            // OAuth (encrypted at rest)
  refresh_token: string;           // OAuth (encrypted at rest)
  token_expiry: string;
  calendar_id: string;
  calendar_email: string;
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expiration: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**`calendar_event_mappings`** - Maps appointments to Google Calendar events:
```typescript
interface CalendarEventMapping {
  id: string;
  appointment_id: string;
  connection_id: string;
  google_event_id: string;
  last_synced_at: string;
  sync_direction: 'push' | 'pull';
  created_at: string;
  updated_at: string;
}
```

**`calendar_sync_logs`** - Audit trail for all sync operations:
```typescript
interface CalendarSyncLog {
  id: string;
  connection_id: string | null;
  sync_type: 'push' | 'pull' | 'bulk' | 'webhook';
  operation: 'create' | 'update' | 'delete' | 'import';
  appointment_id: string | null;
  google_event_id: string | null;
  status: 'success' | 'failed' | 'partial';
  error_message: string | null;
  error_code: string | null;
  details: Json | null;
  duration_ms: number | null;
  created_at: string;
}
```

### Database Relationships

```
users (customers/admins/groomers)
  ├── pets (1:many)
  ├── appointments (1:many as customer)
  ├── appointments (1:many as groomer)
  ├── waitlist entries (1:many)
  ├── loyalty_points (1:1)
  ├── customer_flags (1:many, flag-per-row)
  ├── customer_memberships (1:many)
  └── notifications_log (1:many)

pets
  ├── breed (many:1)
  ├── appointments (1:many)
  └── waitlist entries (1:many)

services
  ├── service_prices (1:many, one per size)
  ├── appointments (1:many)
  └── waitlist entries (1:many)

addons
  └── appointment_addons (1:many)

appointments
  ├── customer (many:1 -> users)
  ├── groomer (many:1 -> users, nullable)
  ├── pet (many:1 -> pets)
  ├── service (many:1 -> services)
  ├── appointment_addons (1:many)
  ├── report_card (1:1)
  ├── payments (1:many)
  └── calendar_event_mappings (1:many)

report_cards
  └── appointment (1:1)

notification_templates
  ├── notification_settings (referenced by)
  └── notification_template_history (1:many)
```

### Database Functions (Stored Procedures)

#### `is_admin()`
Returns `TRUE` if current user is an admin, used in RLS policies.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;
```

**Security**: `SECURITY DEFINER` prevents infinite recursion in RLS policies.

#### `is_staff()`
Returns `TRUE` if current user is admin or groomer (staff).

```sql
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'groomer')
  );
$$;
```

### Indexes

Key indexes for performance:
- `users.email` (unique, case-insensitive)
- `users.role` (for admin/staff queries)
- `appointments.customer_id` (customer appointment lookup)
- `appointments.scheduled_at` (date range queries)
- `appointments.status` (status filtering)
- `pets.owner_id` (owner pet lookup)
- `waitlist.customer_id` (customer waitlist lookup)
- `notifications_log.customer_id` (notification history)

---

## Security Model

### Authentication

**Provider**: Supabase Auth

**Flows**:
1. **Customer Registration** - Email/password signup with email verification
2. **Guest Users** - Guest checkout creates a user record for booking
3. **Admin-Created Accounts** - Admin creates customer account via CSV import or manual entry
4. **Password Reset** - Email-based password reset flow
5. **Session Management** - Server-side session validation via Supabase SSR

### Authorization (Role-Based Access Control)

#### Roles
```typescript
type UserRole = 'customer' | 'admin' | 'groomer';
```

**Role Hierarchy**:
- `customer` - Standard customers (lowest privilege)
- `groomer` - Staff members (limited admin access)
- `admin` - Full system access (highest privilege)

#### Route Protection

**Middleware** (`middleware.ts`):

```typescript
// Protected customer routes
const protectedRoutes = [
  '/dashboard', '/appointments', '/pets',
  '/profile', '/loyalty', '/membership', '/report-cards',
];

// Admin/groomer routes
const adminRoutes = ['/admin'];

// Admin API routes
const adminApiRoutes = ['/api/admin'];
```

#### API Route Protection

**Admin Endpoints** (`/api/admin/*`):

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, role } = await requireAdmin(supabase); // Throws if not admin/groomer

  // Proceed with admin logic
}
```

#### Admin API + RLS Pattern (CRITICAL)

**Issue**: Admin endpoints that use `createServerSupabaseClient()` for data queries are subject to RLS policies designed for customers. This blocks admins from accessing other customers' data.

**Solution**: Use the **two-client pattern** with separate clients for authentication and data queries:

```typescript
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  // 1. Authenticate using regular client (respects RLS)
  const authSupabase = await createServerSupabaseClient();
  await requireAdmin(authSupabase);

  // 2. Use service role client for data queries (bypasses RLS)
  const supabase = createServiceRoleClient();

  // 3. Perform queries - now has access to all customer data
  const { data } = await supabase
    .from('appointments')
    .select('*, addons:appointment_addons(*)');

  return NextResponse.json({ data });
}
```

**When to Use Service Role Client**:
- Admin viewing/managing customer data (appointments, addons, report cards, memberships)
- Admin analytics and reports requiring cross-customer queries
- Background jobs and automated processes
- **NEVER** for customer-facing or public endpoints

### Supabase Client Patterns

Three client factories are available in `src/lib/supabase/server.ts`:

1. **`createServerSupabaseClient()`** - For Server Components and API routes. Cookie-based auth, respects RLS.
2. **`createServiceRoleClient()`** - Bypasses RLS entirely. Only for trusted server-side admin operations.
3. **`createClient()` (alias)** - Alias for `createServerSupabaseClient()`.

Browser client in `src/lib/supabase/client.ts`:
- **`createClient()`** - Singleton browser client for client components.

### Row-Level Security (RLS)

**Pattern**: All tables use RLS policies with `SECURITY DEFINER` functions.

**Key RLS Patterns**:
1. `auth.uid() = id` - User owns the record
2. `is_admin()` - Admin bypass
3. `is_staff()` - Admin or groomer access
4. Foreign key checks - `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND ...)`

### Data Validation

#### Input Validation (Zod Schemas)
All API inputs validated with Zod before processing. Schemas defined in `src/lib/validation/` and `src/types/settings.ts`.

#### CSV Import Sanitization
Formula injection prevention in `src/lib/admin/csv-processor.ts` strips dangerous leading characters (`=`, `+`, `-`, `@`, `\t`, `\r`).

#### Unsubscribe Token Security
HMAC-SHA256 signed tokens with expiration for email unsubscribe links.

---

## API Routes

### Complete API Route Map

#### Public Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/services` | List active services with prices |
| GET | `/api/addons` | List active add-ons |
| GET | `/api/breeds` | List dog breeds |
| GET | `/api/availability` | Check available time slots |
| POST | `/api/appointments` | Create a new appointment (booking) |
| POST | `/api/waitlist` | Join the waitlist |
| GET | `/api/booking/settings` | Get public booking settings |
| POST | `/api/users/guest` | Create guest user for booking |
| GET | `/api/reviews` | Get customer reviews |
| GET | `/api/report-cards/[uuid]` | View public report card |
| POST | `/api/banners/[id]/click` | Track banner click |
| POST | `/api/banners/[id]/impression` | Track banner impression |
| GET | `/api/track/[trackingId]` | Email tracking pixel |
| POST | `/api/unsubscribe` | Process email unsubscribe |
| GET | `/api/health` | Health check endpoint |
| GET | `/api/auth/debug` | Auth debug info |

#### Customer Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/customer/appointments/[id]` | View/modify own appointment |
| GET/PUT | `/api/customer/preferences/notifications` | Notification preferences |
| GET/POST | `/api/pets` | List/create customer pets |

#### Admin Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/admin/appointments` | List/create appointments |
| GET/PUT/DELETE | `/api/admin/appointments/[id]` | Manage appointment |
| PUT | `/api/admin/appointments/[id]/status` | Update appointment status |
| GET | `/api/admin/appointments/availability` | Check admin availability |
| POST | `/api/admin/appointments/complete-past` | Bulk complete past appointments |
| POST | `/api/admin/appointments/import` | CSV import |
| GET | `/api/admin/appointments/import/template` | Download CSV template |
| POST | `/api/admin/appointments/import/validate` | Validate CSV data |
| GET | `/api/admin/appointments/sync-status` | Calendar sync status |
| GET/POST | `/api/admin/customers` | List/create customers |
| GET/PUT | `/api/admin/customers/[id]` | View/update customer |
| GET | `/api/admin/customers/[id]/appointments` | Customer appointments |
| GET/POST | `/api/admin/customers/[id]/flags` | Customer flags |
| DELETE | `/api/admin/customers/[id]/flags/[flagId]` | Remove flag |
| GET | `/api/admin/customers/[id]/pets` | Customer pets |
| GET/POST | `/api/admin/services` | List/create services |
| GET/PUT/DELETE | `/api/admin/services/[id]` | Manage service |
| POST | `/api/admin/services/upload-image` | Upload service image |
| GET/POST | `/api/admin/addons` | List/create add-ons |
| GET/PUT/DELETE | `/api/admin/addons/[id]` | Manage add-on |
| GET/POST | `/api/admin/gallery` | List/create gallery images |
| PUT/DELETE | `/api/admin/gallery/[id]` | Manage gallery image |
| POST | `/api/admin/gallery/upload` | Upload gallery image |
| GET/POST | `/api/admin/report-cards` | List/create report cards |
| POST | `/api/admin/report-cards/[id]/send` | Send report card notification |
| GET | `/api/admin/report-cards/analytics` | Report card analytics |
| POST | `/api/admin/report-cards/upload` | Upload report card photo |
| GET | `/api/admin/waitlist` | List waitlist entries |
| POST | `/api/admin/waitlist/[id]/book` | Book from waitlist |
| POST | `/api/admin/waitlist/fill-slot` | Fill slot from waitlist |
| GET | `/api/admin/waitlist/match` | Match waitlist entries |
| GET | `/api/admin/groomers` | List groomers |
| GET | `/api/admin/breeds` | List/manage breeds |
| GET | `/api/admin/users` | List all users |

#### Admin Analytics
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/analytics/kpis` | Key performance indicators |
| GET | `/api/admin/analytics/charts/appointments-trend` | Appointment trends |
| GET | `/api/admin/analytics/charts/customers` | Customer analytics |
| GET | `/api/admin/analytics/charts/operations` | Operations analytics |
| GET | `/api/admin/analytics/charts/revenue` | Revenue analytics |
| GET | `/api/admin/analytics/charts/services` | Service analytics |
| GET | `/api/admin/analytics/groomers` | Groomer performance |
| GET | `/api/admin/analytics/marketing` | Marketing analytics |
| GET | `/api/admin/analytics/report-cards` | Report card analytics |
| GET | `/api/admin/analytics/waitlist` | Waitlist analytics |

#### Admin Dashboard
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/dashboard/revenue-overview` | Today/week/month revenue with change percentages (admin-dashboard-redesign) |
| GET | `/api/admin/dashboard/appointments` | Today's appointments with customer/pet/service joins |
| GET | `/api/admin/dashboard/pending-appointments` | Pending appointments |
| GET | `/api/admin/dashboard/stats` | Legacy stats endpoint (retained, not used by new dashboard) |
| GET | `/api/admin/dashboard/activity` | Recent activity |

#### Admin Notifications
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/notifications` | List notifications |
| POST | `/api/admin/notifications/[id]/resend` | Resend notification |
| POST | `/api/admin/notifications/bulk-resend` | Bulk resend |
| GET | `/api/admin/notifications/dashboard` | Notification dashboard |
| POST | `/api/admin/notifications/jobs/reminders/trigger` | Trigger reminders |
| POST | `/api/admin/notifications/jobs/retention/trigger` | Trigger retention |
| GET | `/api/admin/notifications/log` | Notification log |
| GET | `/api/admin/notifications/log/[id]` | Log detail |
| POST | `/api/admin/notifications/log/[id]/resend` | Resend from log |
| GET/PUT | `/api/admin/notifications/settings` | Notification settings |
| GET/PUT | `/api/admin/notifications/settings/[notification_type]` | Per-type settings |
| GET/POST | `/api/admin/notifications/templates` | List/create templates |
| GET/PUT/DELETE | `/api/admin/notifications/templates/[id]` | Manage template |
| GET | `/api/admin/notifications/templates/[id]/history` | Template history |
| POST | `/api/admin/notifications/templates/[id]/preview` | Preview template |
| POST | `/api/admin/notifications/templates/[id]/rollback` | Rollback template |
| POST | `/api/admin/notifications/templates/[id]/test` | Send test |

#### Admin Settings
| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/api/admin/settings/booking` | Booking settings |
| GET/PUT | `/api/admin/settings/booking/blocked-dates` | Blocked dates |
| GET/PUT | `/api/admin/settings/business-hours` | Business hours |
| GET/PUT | `/api/admin/settings/site-content` | Site content CMS |
| POST | `/api/admin/settings/site-content/upload` | Upload site image |
| GET/POST | `/api/admin/settings/banners` | List/create banners |
| PUT/DELETE | `/api/admin/settings/banners/[id]` | Manage banner |
| GET | `/api/admin/settings/banners/[id]/analytics` | Banner analytics |
| POST | `/api/admin/settings/banners/reorder` | Reorder banners |
| POST | `/api/admin/settings/banners/upload` | Upload banner image |
| GET/PUT | `/api/admin/settings/loyalty` | Loyalty settings |
| GET/PUT | `/api/admin/settings/loyalty/earning-rules` | Earning rules |
| GET/PUT | `/api/admin/settings/loyalty/redemption-rules` | Redemption rules |
| GET/PUT | `/api/admin/settings/loyalty/referral` | Referral program |
| GET | `/api/admin/settings/phase6` | Phase 6 settings |
| GET/PUT | `/api/admin/settings/templates` | Notification templates |
| POST | `/api/admin/settings/templates/reset` | Reset templates |
| GET/POST | `/api/admin/settings/staff` | List/create staff |
| GET/PUT/DELETE | `/api/admin/settings/staff/[id]` | Manage staff member |
| GET/PUT | `/api/admin/settings/staff/[id]/commission` | Staff commission |
| GET | `/api/admin/settings/staff/earnings` | Staff earnings report |

#### Admin Calendar Integration
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/calendar/auth/start` | Start OAuth flow |
| GET | `/api/admin/calendar/auth/callback` | OAuth callback |
| POST | `/api/admin/calendar/auth/disconnect` | Disconnect calendar |
| POST | `/api/admin/calendar/auth/service-account` | Service account auth |
| GET | `/api/admin/calendar/calendars` | List available calendars |
| GET | `/api/admin/calendar/connection` | Get connection status |
| POST | `/api/admin/calendar/connection/resume` | Resume paused sync |
| GET/PUT | `/api/admin/calendar/settings` | Calendar sync settings |
| GET | `/api/admin/calendar/quota` | API quota status |
| POST | `/api/admin/calendar/sync/manual` | Manual sync |
| POST | `/api/admin/calendar/sync/bulk` | Bulk sync |
| GET | `/api/admin/calendar/sync/status` | Sync status |
| GET | `/api/admin/calendar/sync/errors` | Sync errors |
| GET | `/api/admin/calendar/sync/history/[appointmentId]` | Sync history |
| GET | `/api/admin/calendar/sync/queue-stats` | Queue stats |
| POST | `/api/admin/calendar/sync/resync` | Resync failed |
| POST | `/api/admin/calendar/sync/retry` | Retry failed |
| POST | `/api/admin/calendar/import/preview` | Import preview |
| POST | `/api/admin/calendar/import/confirm` | Confirm import |
| POST | `/api/admin/calendar/webhook` | Google webhook receiver |

#### Admin Campaigns
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/admin/campaigns` | List/create campaigns |
| GET | `/api/admin/campaigns/[id]/analytics` | Campaign analytics |
| POST | `/api/admin/campaigns/[id]/send` | Send campaign |
| POST | `/api/admin/campaigns/segment-preview` | Preview segment |

#### Cron Jobs
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/cron/analytics-refresh` | Refresh analytics cache |
| POST | `/api/cron/breed-reminders` | Send breed-based reminders |
| POST | `/api/cron/calendar-webhook-renewal` | Renew calendar webhooks |
| POST | `/api/cron/notifications/reminders` | Send appointment reminders |
| POST | `/api/cron/notifications/retention` | Send retention emails |
| POST | `/api/cron/notifications/retry` | Retry failed notifications |
| POST | `/api/cron/waitlist-expiration` | Expire old waitlist entries |

#### Webhooks
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/webhooks/appointment-completed` | Post-completion processing |
| POST | `/api/webhooks/twilio/incoming` | Twilio incoming SMS |

---

## Module Documentation

Detailed documentation for each module is available in separate files:

### Routes
- [Marketing Site Routes](./routes/marketing.md) - Public pages, homepage, services, gallery
- [Authentication Routes](./routes/auth.md) - Login, register, password reset
- [Customer Portal Routes](./routes/customer-portal.md) - Dashboard, appointments, pets, profile
- [Admin Panel Routes](./routes/admin-panel.md) - All admin routes and features
- [API Routes](./routes/api.md) - API endpoint patterns and conventions

### Components
- [UI Components](./components/ui-components.md) - Base DaisyUI components (Button, Input, Modal, etc.)
- [Booking Flow](./components/booking-flow.md) - Booking wizard architecture
- [Admin Components](./components/admin-components.md) - Admin-specific components

### Services
- [Supabase Service](./services/supabase.md) - Client setup, RLS, migrations, real-time
- [Notification Service](./services/notifications.md) - Email/SMS providers, templates, preferences
- [Payment Service](./services/payments.md) - Stripe integration (Phase 7)

---

## Development Workflow

### Development Mode

**Mock Services** (Default):
```bash
# .env.local
NEXT_PUBLIC_USE_MOCKS=true
```

**Features**:
- In-memory database (no Supabase required)
- Mock Resend, Twilio services
- Seeded test data (users, services, pets, appointments, etc.)
- Fast development iteration

**Mock Store Tables** (defined in `src/mocks/supabase/store.ts`):
All core tables plus: `reviews`, `before_after_pairs`, `loyalty_settings`, `customer_loyalty`, `loyalty_punches`, `loyalty_redemptions`, `marketing_campaigns`, `campaign_sends`, `marketing_unsubscribes`, `staff_commissions`, `settings_audit_log`

### Commands

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Testing
npm run test              # Run all tests
npm run test:ui           # Visual test UI
npm run test:coverage     # Coverage report
```

### Kiro SDD Workflow

**Spec-Driven Development** process:

1. **Requirements Phase** - Create `docs/specs/{phase}/requirements.md` (EARS format)
2. **Design Phase** - Create `docs/specs/{phase}/design.md` (architecture, data models)
3. **Task Planning Phase** - Create `docs/specs/{phase}/tasks.md` (numbered tasks)
4. **Implementation Phase** - Use `/kc:impl [task-number]` slash command
5. **Review Phase** - Code review with `code-reviewer` agent

### Agent Workflows

The Puppy Day uses specialized AI agents for different development tasks.

#### Available Agents

**Kiro Workflow Agents** (Spec-Driven Development):
- `kiro-requirement`: Requirements analysis in EARS format
- `kiro-design`: Technical design documents with architecture and data models
- `kiro-plan`: Implementation task planning and breakdown
- `kiro-executor`: Task orchestrator

**Development Agents**:
- `app-dev`: Frontend development - UI/UX design, React components, Next.js pages, DaisyUI implementation, responsive design, accessibility
- `data-dev`: Backend development - Supabase integration, authentication, RLS policies, database queries, migrations
- `code-reviewer`: Code review and audits - security, performance, design system compliance

### Testing Strategy

**Unit Tests** (Vitest):
- Test pure functions (pricing, validation, utilities)
- Located in `__tests__/lib/` and co-located `*.test.ts` files

**Integration Tests**:
- Test API routes with mock Supabase
- Located in `__tests__/api/`

**Component Tests** (Testing Library):
- Test React components with user interaction simulation
- Located in `__tests__/components/`

**E2E Tests** (Playwright - planned):
- Full browser-based end-to-end testing

---

## Environment Configuration

### Required Environment Variables

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=The Puppy Day

# Development Mode
NEXT_PUBLIC_USE_MOCKS=true  # Set to 'false' for production

# Supabase (required if USE_MOCKS=false)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Phase 7)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email)
RESEND_API_KEY=re_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Google Calendar (OAuth)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# Unsubscribe Tokens
UNSUBSCRIBE_TOKEN_SECRET=your-secret-key

# Cron Job Authentication
CRON_SECRET=your-cron-secret
```

### Configuration File

**Location**: `src/lib/config.ts`

```typescript
export const config = {
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },

  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'The Puppy Day',
  },
} as const;
```

---

## Deployment

### Production Setup

**Domain**: `thepuppyday.com`
**Server**: Linux VPS with Nginx reverse proxy

**PM2 Process Manager** (`ecosystem.config.cjs`):
```javascript
module.exports = {
  apps: [{
    name: 'thepuppyday',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/thepuppyday',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

**Nginx**: Configuration in `nginx/thepuppyday.conf` handles SSL termination, static file serving, and reverse proxy to the Next.js application on port 3000.

**Deployment Script**: `deploy.sh` automates the build and deployment process.

---

## Additional Resources

- **Project Instructions**: `CLAUDE.md`
- **Specifications**: `docs/specs/`
- **Database Queries**: `supabase/test-queries.sql`
- **Scripts**: `scripts/`

---

**Document Version**: 1.3
**Last Updated**: 2026-03-06
**Maintained By**: Development Team

## Changelog

### Version 1.3 (2026-03-06)
- **Full rewrite** for accuracy against actual codebase
- **Database schema corrections** based on `src/types/supabase.ts` (source of truth):
  - `appointments`: Added `booking_reference`, `groomer_id`; removed `creation_method`, `created_by_admin_id`, `internal_notes`
  - `customer_flags`: Corrected to flag-per-row model with `reason`, `flagged_by`, `notes`, `is_active` (not boolean `is_vip`/`is_flagged`)
  - `loyalty_points`: Uses `points_balance` not `total_points`
  - `customer_memberships`: Uses `current_period_end` not `expires_at`; no `started_at`
  - `memberships`: Uses `benefits` JSONB not separate `included_services`/`discount_percentage`
  - `waitlist`: Uses `requested_date` not `preferred_date`
  - `site_content`: Actual columns are `section` + `content` (JSON), not `key`/`value`/`description`
  - `promo_banners`: Corrected to image-based with `image_url`, `click_url`, `alt_text`, `click_count`, `start_date`, `end_date`
  - `gallery_images`: Corrected with `caption`, `dog_name`, `breed`, `tags`, `is_before_after`, `is_published`, `before_image_url`
  - `services`: Added `image_url`
  - `report_cards`: Removed `uuid` field; uses `health_observations` not `health_notes`; added `rating`/`feedback`
  - `notifications_log`: Uses `content` not `message`
  - Added `addons.upsell_breeds` and `addons.upsell_prompt`
- **Added missing tables**: notification_templates, notification_settings, notification_template_history, marketing_campaigns, campaign_sends, reviews, before_after_pairs, calendar_connections, calendar_event_mappings, calendar_sync_logs, staff_commissions, settings_audit_log
- **Fixed all paths** from Windows absolute paths to relative paths
- **Updated agent names**: `app-dev`, `data-dev`, `code-reviewer` (not `frontend-expert`, `daisyui-expert`)
- **Added new files**: robots.ts, sitemap.ts, deploy.sh, ecosystem.config.cjs, nginx/
- **Fixed heading font-weight**: Actual is 700, not 600
- **Updated project structure tree** with all lib/ subdirectories, booking steps, and deployment files
- **Added complete API route map** with all 120+ endpoints
- **Added Deployment section** with PM2 and Nginx documentation
- **Documented `createServiceRoleClient()`** in Supabase patterns section
- **Added production domain** `thepuppyday.com`
- **Added Playwright E2E testing** mention
- **Updated tech stack versions** from package.json
- **Added new dependencies**: googleapis, isomorphic-dompurify, tsx, pg

### Version 1.2 (2025-12-26)
- **Phase 11: Calendar Error Recovery** - Complete implementation
  - Added `calendar_sync_retry_queue` table for retry queue management
  - Added `calendar_api_quota` table for daily API usage tracking
  - Updated `calendar_connections` table with error tracking fields
  - New stored procedures: `increment_quota()`, `cleanup_retry_queue()`, `cleanup_quota_records()`
  - New database views: `retry_queue_summary`, `calendar_health_summary`
  - 6 new API endpoints for error recovery and quota management
  - 3 new UI components: `QuotaWarning`, `SyncErrorRecovery`, `PausedSyncBanner`
  - Calendar settings page with error recovery features
  - 6 critical security fixes (CSRF, auth verification, SQL injection, N+1 queries, XSS, memory leaks)
  - Next.js 16 compatibility updates

### Version 1.1 (2025-12-22)
- Phase 9 Admin Settings completion
- Phase 6 enhancements (walk-in appointments, CSV import)
- Notification system (Phase 8) documentation

### Version 1.0 (2025-12-20)
- Initial comprehensive architecture documentation
- Phases 1-6 complete documentation
- Database schema, security model, and service integration docs
