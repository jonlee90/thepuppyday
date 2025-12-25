# The Puppy Day - Master Architecture Documentation

> **Version**: 1.1
> **Last Updated**: 2025-12-22
> **Status**: Production-Ready (Phases 1-6, 8-9 Complete | Phase 7 Pending)

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

---

## Project Overview

**The Puppy Day** is a comprehensive dog grooming SaaS application for a business located in La Mirada, CA. The platform manages the complete business workflow from customer acquisition to appointment scheduling, service delivery, and customer retention.

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
6. **Payment Processing** - Stripe integration for deposits, full payments, tips, and refunds (Phase 7)
7. **Loyalty Program** - Points-based rewards system (Phase 7)

### Development Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Foundation & Database | ✅ Completed | Database schema, migrations, type system, mock services |
| 2 | Public Marketing Site | ✅ Completed | Homepage, services, gallery, SEO, promotional banners |
| 3 | Booking System | ✅ Completed | Multi-step booking wizard, availability, waitlist, guest users |
| 4 | Customer Portal | ✅ Completed | Dashboard, appointments, pets, profile, report cards |
| 5 | Admin Panel Core | ✅ Completed | Dashboard, appointments, customers, services, gallery |
| 6 | Admin Panel Advanced | ✅ Completed | Analytics, marketing campaigns, admin appointment management with CSV import and walk-in appointments |
| 7 | Payments & Memberships | 🚧 Pending | Stripe integration, memberships, loyalty program |
| 8 | Notifications | ✅ Completed | Templates, triggers, preferences, email/SMS providers, unsubscribe system |
| 9 | Admin Settings | ✅ Completed | Business settings, staff management, site content, banners |
| 10 | Testing & Polish | 🚧 Pending | Comprehensive testing, performance optimization |

---

## Technology Stack

### Core Framework & Language

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | React framework with App Router for SSR, SSG, and API routes |
| **React** | 19.2.0 | UI library for component-based interfaces |
| **TypeScript** | 5.9.3 | Type-safe JavaScript with strict mode enabled |
| **Node.js** | 20.19.26 | JavaScript runtime for server-side execution |

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

### External Services

| Service | Version/Provider | Purpose |
|---------|------------------|---------|
| **Stripe** | (Pending Phase 7) | Payment processing for deposits, full payments, tips, refunds |
| **Resend** | API | Transactional email delivery for notifications |
| **Twilio** | API | SMS delivery for appointment reminders and notifications |

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
| **@testing-library/react** | 16.3.0 | React component testing utilities |
| **@testing-library/jest-dom** | 6.9.1 | Custom matchers for DOM assertions |
| **@testing-library/user-event** | 14.6.1 | User interaction simulation |
| **happy-dom** | 20.0.11 | Lightweight DOM implementation for testing |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | ^9 | JavaScript/TypeScript linting |
| **eslint-config-next** | 16.0.7 | Next.js-specific ESLint configuration |

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

Located in `C:\Users\Jon\Documents\claude projects\thepuppyday\src\app\globals.css`:

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
- **Headings**: Nunito (Google Fonts) - Clean, rounded, professional
- **Body Text**: Inter (Google Fonts) - Highly legible, modern
- **Fallback**: Poppins, system-ui, -apple-system, sans-serif

**Font Weights**:
- Regular (400): Body text
- Semibold (600): Headings and emphasis
- **Avoid**: Bold (700+) to maintain elegant aesthetic

**CSS Implementation**:
```css
body {
  font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-nunito), 'Poppins', system-ui, sans-serif;
  font-weight: 600;
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

### Visual Assets

#### Logo
- **Style**: Simple line-art dog silhouette
- **Format**: SVG for scalability
- **Colors**: Primary charcoal (#434E54) or white for dark backgrounds

#### Imagery
- **Photography**: High-quality, well-lit dog photos
- **Style**: Clean backgrounds, professional grooming results
- **Compression**: Optimized with `browser-image-compression`

#### Decorative Elements
- **Blob Shapes**: Organic SVG shapes for visual interest (used sparingly)
- **Gradients**: Subtle gradients for backgrounds (avoid harsh gradients)

### Component Patterns

#### Alert Messages
```typescript
// Success alert
<div className="alert alert-success">
  <CheckCircle className="w-5 h-5" />
  <span>Appointment booked successfully!</span>
</div>

// Styling: Soft background (rgba), primary text color
```

#### Forms
```typescript
// Input field
<Input
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  error={errors.email?.message}
/>

// Styling:
// - border-gray-200 (subtle border)
// - focus:ring-2 focus:ring-primary (elegant focus state)
// - rounded-lg
```

### Accessibility

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 ratio)
- **Focus Indicators**: Visible focus rings on all interactive elements
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support for all interactions

---

## Project Structure

```
C:\Users\Jon\Documents\claude projects\thepuppyday\
├── src/
│   ├── app/                         # Next.js App Router (all routes)
│   │   ├── (marketing)/             # Public marketing site
│   │   │   ├── layout.tsx           # Marketing layout with header/footer
│   │   │   ├── page.tsx             # Homepage
│   │   │   └── book/                # Booking widget page
│   │   │       └── page.tsx
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
│   │   ├── (admin)/                 # Admin panel (role-protected)
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx       # Admin layout with sidebar
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── appointments/
│   │   │   │   │   ├── page.tsx     # Appointment management
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── report-card/page.tsx
│   │   │   │   ├── customers/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── services/page.tsx
│   │   │   │   ├── addons/page.tsx
│   │   │   │   ├── gallery/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── waitlist/page.tsx
│   │   │   │   ├── marketing/
│   │   │   │   │   └── campaigns/page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── templates/page.tsx
│   │   │   │   │   ├── log/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   └── settings/          # Admin settings (Phase 9)
│   │   │   │       ├── page.tsx       # Settings dashboard
│   │   │   │       ├── banners/page.tsx # Promo banner management
│   │   │   │       ├── booking/
│   │   │   │       │   ├── page.tsx   # Booking configuration
│   │   │   │       │   └── blocked-dates/page.tsx # Blocked dates
│   │   │   │       ├── business-hours/page.tsx # Operating hours
│   │   │   │       ├── loyalty/
│   │   │   │       │   ├── page.tsx   # Loyalty program settings
│   │   │   │       │   └── punch-card-demo/page.tsx
│   │   │   │       ├── site-content/page.tsx # Homepage & SEO
│   │   │   │       └── staff/page.tsx # Staff management
│   │   ├── (public)/                # Public pages (no auth required)
│   │   │   └── report-cards/
│   │   │       └── [uuid]/page.tsx  # Public report card view
│   │   ├── api/                     # API Routes
│   │   │   ├── admin/               # Admin-only API endpoints
│   │   │   │   ├── appointments/
│   │   │   │   │   ├── route.ts     # GET (list), POST (create)
│   │   │   │   │   ├── [id]/route.ts # GET, PUT, DELETE
│   │   │   │   │   ├── import/route.ts # POST (CSV import)
│   │   │   │   │   └── availability/route.ts
│   │   │   │   ├── customers/route.ts
│   │   │   │   ├── services/route.ts
│   │   │   │   ├── addons/route.ts
│   │   │   │   ├── gallery/route.ts
│   │   │   │   ├── analytics/           # Analytics API routes
│   │   │   │   │   ├── kpis/route.ts
│   │   │   │   │   ├── charts/
│   │   │   │   │   ├── groomers/route.ts
│   │   │   │   │   ├── marketing/route.ts
│   │   │   │   │   ├── report-cards/route.ts
│   │   │   │   │   └── waitlist/route.ts
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── templates/route.ts
│   │   │   │   │   ├── log/route.ts
│   │   │   │   │   └── settings/route.ts
│   │   │   │   └── settings/            # Admin settings API
│   │   │   │       ├── site-content/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── upload/route.ts
│   │   │   │       ├── banners/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   ├── [id]/route.ts
│   │   │   │       │   ├── reorder/route.ts
│   │   │   │       │   └── upload/route.ts
│   │   │   │       ├── booking/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── blocked-dates/route.ts
│   │   │   │       ├── business-hours/route.ts
│   │   │   │       ├── loyalty/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   ├── earning-rules/route.ts
│   │   │   │       │   ├── redemption-rules/route.ts
│   │   │   │       │   └── referral/route.ts
│   │   │   │       ├── staff/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   ├── [id]/route.ts
│   │   │   │       │   └── earnings/route.ts
│   │   │   │       └── templates/
│   │   │   │           └── reset/route.ts
│   │   │   ├── customer/            # Customer API endpoints
│   │   │   │   └── preferences/
│   │   │   │       └── notifications/route.ts
│   │   │   ├── appointments/route.ts
│   │   │   ├── availability/route.ts
│   │   │   ├── services/route.ts
│   │   │   ├── addons/route.ts
│   │   │   ├── pets/route.ts
│   │   │   ├── waitlist/route.ts
│   │   │   ├── unsubscribe/route.ts
│   │   │   └── webhooks/           # External service webhooks
│   │   ├── unsubscribe/            # Unsubscribe pages
│   │   │   ├── success/page.tsx
│   │   │   └── error/page.tsx
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles & DaisyUI theme
│   │   └── ErrorFilter.tsx         # Error boundary component
│   ├── components/                 # React components
│   │   ├── ui/                     # Base UI components (DaisyUI-based)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   └── loading-spinner.tsx
│   │   ├── booking/                # Booking widget components
│   │   │   ├── BookingWizard.tsx
│   │   │   ├── ServiceStep.tsx
│   │   │   ├── PetStep.tsx
│   │   │   ├── DateTimeStep.tsx
│   │   │   ├── AddonsStep.tsx
│   │   │   ├── ReviewStep.tsx
│   │   │   ├── ConfirmationStep.tsx
│   │   │   └── WaitlistModal.tsx
│   │   ├── customer/               # Customer portal components
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── PetCard.tsx
│   │   │   ├── ReportCardView.tsx
│   │   │   └── LoyaltyPointsDisplay.tsx
│   │   ├── admin/                  # Admin panel components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── AppointmentTable.tsx
│   │   │   ├── AppointmentWizard/  # Manual appointment creation
│   │   │   ├── CSVImportModal.tsx
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── Calendar.tsx
│   │   │   └── AnalyticsCharts.tsx
│   │   ├── marketing/              # Marketing site components
│   │   │   ├── Hero.tsx
│   │   │   ├── ServiceCards.tsx
│   │   │   ├── BeforeAfterSlider.tsx
│   │   │   ├── Gallery.tsx
│   │   │   └── PromoBanner.tsx
│   │   ├── providers/              # Context providers
│   │   │   └── AuthProvider.tsx
│   │   └── public/                 # Shared public components
│   │       └── Header.tsx
│   ├── lib/                        # Business logic & utilities
│   │   ├── supabase/               # Supabase client & helpers
│   │   │   ├── client.ts           # Browser client factory
│   │   │   ├── server.ts           # Server client factory
│   │   │   └── middleware.ts       # Auth middleware helpers
│   │   ├── booking/                # Booking logic
│   │   │   ├── pricing.ts          # Price calculations
│   │   │   ├── availability.ts     # Availability checking
│   │   │   └── validation.ts       # Booking validation rules
│   │   ├── admin/                  # Admin utilities
│   │   │   ├── auth.ts             # Admin auth helpers (requireAdmin, isOwner)
│   │   │   ├── appointments.ts     # Appointment management logic
│   │   │   ├── csv-processor.ts    # CSV import processing
│   │   │   └── validation.ts       # Admin-specific validation
│   │   ├── notifications/          # Notification system
│   │   │   ├── service.ts          # DefaultNotificationService (main orchestrator)
│   │   │   ├── types.ts            # TypeScript interfaces
│   │   │   ├── providers/
│   │   │   │   ├── email.ts        # Email provider (Resend)
│   │   │   │   └── sms.ts          # SMS provider (Twilio)
│   │   │   ├── template-engine.ts  # Template rendering
│   │   │   ├── logger.ts           # Notification logging
│   │   │   ├── preferences.ts      # Customer preference management
│   │   │   ├── unsubscribe.ts      # Unsubscribe token management
│   │   │   ├── errors.ts           # Error classification & retry logic
│   │   │   ├── retry-manager.ts    # Retry queue management
│   │   │   └── query-helpers.ts    # Database query helpers
│   │   ├── stripe/                 # Stripe utilities (Phase 7)
│   │   ├── resend/                 # Resend email client
│   │   ├── twilio/                 # Twilio SMS client
│   │   ├── auth/                   # Auth utilities
│   │   ├── loyalty/                # Loyalty program logic
│   │   ├── cron/                   # Scheduled job handlers
│   │   ├── validation/             # Shared validation schemas
│   │   ├── utils/                  # General utilities
│   │   │   ├── date.ts
│   │   │   ├── format.ts
│   │   │   └── sanitize.ts
│   │   ├── config.ts               # Environment config
│   │   └── utils.ts                # Shared utility functions
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-auth.ts             # Authentication hook
│   │   ├── use-booking.ts          # Booking state management
│   │   ├── use-booking-submit.ts   # Booking submission logic
│   │   ├── use-debounce.ts         # Debounce hook
│   │   └── use-media-query.ts      # Responsive design hook
│   ├── types/                      # TypeScript type definitions
│   │   ├── database.ts             # Database schema types
│   │   ├── api.ts                  # API response types
│   │   ├── admin-appointments.ts   # Admin appointment types
│   │   ├── notifications.ts        # Notification types
│   │   ├── preferences.ts          # Notification preference types
│   │   ├── settings.ts             # Settings types
│   │   ├── template.ts             # Template types
│   │   ├── analytics.ts            # Analytics types
│   │   └── index.ts                # Type exports
│   ├── stores/                     # Zustand state stores
│   │   ├── auth-store.ts           # Global auth state
│   │   ├── bookingStore.ts         # Booking wizard state
│   │   └── admin-store.ts          # Admin panel state
│   ├── mocks/                      # Mock service implementations
│   │   ├── supabase/
│   │   │   ├── client.ts           # Mock Supabase client
│   │   │   ├── store.ts            # In-memory database
│   │   │   └── seed.ts             # Mock data seeding
│   │   └── services/               # Mock external services
│   └── proxy.ts                    # Service proxy for mock/real switching
├── docs/                           # Documentation
│   ├── architecture/               # Architecture documentation (THIS DIRECTORY)
│   │   ├── ARCHITECTURE.md         # Master architecture doc (this file)
│   │   ├── routes/                 # Route-specific docs
│   │   ├── components/             # Component docs
│   │   └── services/               # Service docs
│   └── specs/                      # Kiro SDD specifications
│       ├── phase-01-foundation/
│       ├── marketing-site/
│       ├── booking-system/
│       ├── phase-4/                # Customer portal
│       ├── phase-5/                # Admin panel core
│       └── phase-8/                # Notifications
├── __tests__/                      # Test files (mirrors src structure)
│   ├── lib/
│   │   ├── notifications/
│   │   │   ├── preferences.test.ts
│   │   │   ├── unsubscribe.test.ts
│   │   │   └── service-preferences.test.ts
│   │   └── utils.test.ts
│   ├── api/
│   │   ├── customer/
│   │   │   └── preferences/
│   │   │       └── notifications.test.ts
│   │   └── unsubscribe.test.ts
│   └── setup.ts                    # Global test setup
├── scripts/                        # Database scripts & utilities
│   ├── verify-critical-fixes.sql
│   └── setup-storage-policies.sql
├── supabase/                       # Supabase configuration
│   └── test-queries.sql
├── .claude/                        # Claude Code configuration
│   ├── commands/                   # Custom slash commands
│   └── tasks/                      # Session context files
├── middleware.ts                   # Next.js middleware (route protection)
├── vitest.config.ts                # Vitest test configuration
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── CLAUDE.md                       # Project instructions for AI agents
└── README.md                       # Project README

```

### Key Structural Patterns

#### 1. Route Groups (Parentheses)
Next.js App Router uses route groups to organize routes without affecting URL structure:
- `(marketing)/` - Public pages (no auth required)
- `(auth)/` - Authentication flows
- `(customer)/` - Customer portal (requires auth, customer role)
- `(admin)/` - Admin panel (requires auth, admin/groomer role)
- `(public)/` - Public pages with specific functionality

#### 2. API Route Organization
- `/api/admin/*` - Admin-only endpoints (protected by middleware & requireAdmin)
- `/api/customer/*` - Customer-specific endpoints (protected by session auth)
- `/api/*` - Public endpoints (services, availability, booking)

#### 3. Component Hierarchy
- `ui/` - Base reusable components (buttons, inputs, modals)
- `booking/` - Domain-specific booking components
- `customer/` - Customer portal components
- `admin/` - Admin panel components
- `marketing/` - Marketing site components

#### 4. Type System
- `database.ts` - Database schema types (single source of truth)
- Domain-specific types extend base `database.ts` types
- API types define request/response shapes

---

## Database Schema

### Overview

The Puppy Day database uses **PostgreSQL** via **Supabase** with comprehensive Row-Level Security (RLS) policies and stored procedures for authorization.

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
  role: UserRole;                  // 'customer' | 'admin' | 'groomer'
  avatar_url: string | null;       // Profile photo URL
  preferences: Record<string, unknown>; // JSON column for notification preferences
  is_active: boolean;              // Account activation status
  created_by_admin: boolean;       // Whether created by admin (CSV import)
  activated_at: string | null;     // Timestamp of account activation
  created_at: string;              // Timestamp
  updated_at: string;              // Timestamp
}
```

**Indexes**:
- `email` (unique, case-insensitive)
- `role` (for filtering admin/staff)

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
  size: PetSize;                   // 'small' | 'medium' | 'large' | 'xlarge'
  weight: number | null;           // Weight in pounds
  birth_date: string | null;       // Date of birth
  notes: string | null;            // General notes
  medical_info: string | null;     // Medical information
  photo_url: string | null;        // Pet photo URL (Supabase Storage)
  is_active: boolean;              // Soft delete flag
  created_at: string;
  updated_at: string;
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
  grooming_frequency_weeks: number; // Recommended grooming frequency
  reminder_message: string | null;  // Custom reminder message
  created_at: string;
}
```

**RLS**: Public read access

#### 4. `services` Table
Grooming service types.

```typescript
interface Service {
  id: string;                      // UUID
  name: string;                    // Service name (e.g., "Basic Grooming")
  description: string | null;      // Service description
  duration_minutes: number;        // Service duration
  is_active: boolean;              // Availability flag
  display_order: number;           // Display order
  created_at: string;
  updated_at: string;
}
```

#### 5. `service_prices` Table
Size-based pricing for services.

```typescript
interface ServicePrice {
  id: string;                      // UUID
  service_id: string;              // Foreign key -> services.id
  size: PetSize;                   // 'small' | 'medium' | 'large' | 'xlarge'
  price: number;                   // Price in dollars (e.g., 40.00)
  created_at: string;
  updated_at: string;
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
  is_active: boolean;              // Availability flag
  display_order: number;           // Display order
  created_at: string;
  updated_at: string;
}
```

**Example Addons**:
- Long Hair/Sporting: $10
- Teeth Brushing: $10
- Pawdicure: $15
- Flea & Tick Treatment: $25
- Tangle Removal: $5-$30 (variable pricing)

#### 7. `appointments` Table
Scheduled grooming appointments.

```typescript
interface Appointment {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  pet_id: string;                  // Foreign key -> pets.id
  service_id: string;              // Foreign key -> services.id
  scheduled_at: string;            // ISO 8601 datetime
  duration_minutes: number;        // Appointment duration
  status: AppointmentStatus;       // Status enum
  creation_method: AppointmentCreationMethod; // 'customer_booking' | 'manual_admin' | 'csv_import'
  created_by_admin_id: string | null; // Foreign key -> users.id (admin who created)
  payment_status: PaymentStatus;   // 'pending' | 'deposit_paid' | 'paid' | 'refunded'
  total_price: number;             // Total appointment cost
  notes: string | null;            // Special instructions
  internal_notes: string | null;   // Admin-only notes
  created_at: string;
  updated_at: string;
}
```

**Status Values**:
```typescript
type AppointmentStatus =
  | 'pending'      // Initial state after booking
  | 'confirmed'    // Admin confirmed the appointment
  | 'checked_in'   // Customer arrived
  | 'in_progress'  // Service in progress
  | 'ready'        // Ready for pickup
  | 'completed'    // Completed and picked up
  | 'cancelled'    // Cancelled by customer or admin
  | 'no_show';     // Customer didn't show up
```

**Foreign Key Constraints**:
- `created_by_admin_id` uses `ON DELETE SET NULL` to preserve appointment history if admin is deleted

#### 8. `appointment_addons` Table
Many-to-many relationship for appointment addons.

```typescript
interface AppointmentAddon {
  id: string;                      // UUID
  appointment_id: string;          // Foreign key -> appointments.id
  addon_id: string;                // Foreign key -> addons.id
  price: number;                   // Price at time of booking (historical)
  created_at: string;
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
  preferred_date: string;          // Preferred date (ISO 8601)
  time_preference: TimePreference; // 'morning' | 'afternoon' | 'any'
  status: WaitlistStatus;          // Status enum
  notified_at: string | null;      // When customer was notified
  notes: string | null;            // Customer notes
  created_at: string;
  updated_at: string;
}
```

**Status Values**:
```typescript
type WaitlistStatus =
  | 'active'        // Waiting for availability
  | 'notified'      // Customer notified of opening
  | 'booked'        // Customer booked the slot
  | 'expired'       // Preferred date passed
  | 'expired_offer' // Notified but didn't book in time
  | 'cancelled';    // Customer cancelled request
```

#### 10. `report_cards` Table
Post-grooming report cards with photos.

```typescript
interface ReportCard {
  id: string;                      // UUID
  appointment_id: string;          // Foreign key -> appointments.id (unique)
  uuid: string;                    // Public sharing UUID
  mood: ReportCardMood;            // 'happy' | 'nervous' | 'calm' | 'energetic'
  coat_condition: CoatCondition;   // 'excellent' | 'good' | 'matted' | 'needs_attention'
  behavior: BehaviorRating;        // 'great' | 'some_difficulty' | 'required_extra_care'
  services_performed: string[];    // Array of performed services
  health_notes: string | null;     // Health observations
  groomer_notes: string | null;    // General notes
  before_photo_url: string | null; // Before photo (Supabase Storage)
  after_photo_url: string | null;  // After photo (Supabase Storage)
  created_at: string;
  updated_at: string;
}
```

**Public Access**: Report cards can be viewed via shareable UUID link (`/report-cards/[uuid]`)

#### 11. `memberships` Table
Membership plan definitions (Phase 7).

```typescript
interface Membership {
  id: string;                      // UUID
  name: string;                    // Plan name (e.g., "Monthly Unlimited")
  description: string | null;      // Plan description
  price: number;                   // Monthly/yearly price
  billing_frequency: BillingFrequency; // 'monthly' | 'yearly'
  included_services: number;       // Number of included services per period
  discount_percentage: number;     // Discount on additional services
  is_active: boolean;              // Availability flag
  created_at: string;
  updated_at: string;
}
```

#### 12. `customer_memberships` Table
Customer membership subscriptions (Phase 7).

```typescript
interface CustomerMembership {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  membership_id: string;           // Foreign key -> memberships.id
  status: MembershipStatus;        // 'active' | 'paused' | 'cancelled'
  started_at: string;              // Subscription start date
  expires_at: string | null;       // Expiration date (if applicable)
  stripe_subscription_id: string | null; // Stripe subscription ID
  created_at: string;
  updated_at: string;
}
```

#### 13. `loyalty_points` Table
Customer loyalty point balances (Phase 7).

```typescript
interface LoyaltyPoints {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id (unique)
  total_points: number;            // Current balance
  lifetime_points: number;         // Total earned all-time
  created_at: string;
  updated_at: string;
}
```

#### 14. `loyalty_transactions` Table
Loyalty point transaction history (Phase 7).

```typescript
interface LoyaltyTransaction {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id
  appointment_id: string | null;   // Foreign key -> appointments.id
  type: LoyaltyTransactionType;    // 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: number;                  // Points (positive for earned, negative for redeemed)
  description: string;             // Transaction description
  created_at: string;
}
```

#### 15. `customer_flags` Table
Admin flags for customer accounts.

```typescript
interface CustomerFlag {
  id: string;                      // UUID
  customer_id: string;             // Foreign key -> users.id (unique)
  is_vip: boolean;                 // VIP status
  is_flagged: boolean;             // Problem customer flag
  flag_reason: string | null;      // Reason for flag
  notes: string | null;            // Internal notes
  created_at: string;
  updated_at: string;
}
```

#### 16. `payments` Table
Payment transaction records (Phase 7).

```typescript
interface Payment {
  id: string;                      // UUID
  appointment_id: string;          // Foreign key -> appointments.id
  stripe_payment_intent_id: string | null; // Stripe Payment Intent ID
  amount: number;                  // Payment amount
  tip_amount: number;              // Tip amount
  payment_method: string | null;   // Payment method type
  status: PaymentTransactionStatus; // 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  metadata: Record<string, unknown> | null; // Additional metadata
  created_at: string;
  updated_at: string;
}
```

#### 17. `site_content` Table
CMS for marketing site content.

```typescript
interface SiteContent {
  id: string;                      // UUID
  key: string;                     // Unique key (e.g., "homepage_hero_title")
  value: string;                   // Content value
  description: string | null;      // Admin description
  created_at: string;
  updated_at: string;
}
```

#### 18. `promo_banners` Table
Promotional banner management.

```typescript
interface PromoBanner {
  id: string;                      // UUID
  title: string;                   // Banner title
  message: string;                 // Banner message
  link_url: string | null;         // Optional CTA link
  link_text: string | null;        // CTA button text
  background_color: string;        // Hex color code
  text_color: string;              // Hex color code
  is_active: boolean;              // Display flag
  display_order: number;           // Display order
  created_at: string;
  updated_at: string;
}
```

#### 19. `gallery_images` Table
Marketing gallery images.

```typescript
interface GalleryImage {
  id: string;                      // UUID
  image_url: string;               // Image URL (Supabase Storage)
  title: string | null;            // Image title
  description: string | null;      // Image description
  category: string | null;         // Category (e.g., "grooming", "facility")
  is_featured: boolean;            // Featured flag
  display_order: number;           // Display order
  created_at: string;
  updated_at: string;
}
```

#### 20. `settings` Table
Global application settings.

```typescript
interface Settings {
  id: string;                      // UUID
  key: string;                     // Unique key (e.g., "business_hours")
  value: Record<string, unknown>;  // JSON value
  description: string | null;      // Setting description
  created_at: string;
  updated_at: string;
}
```

**Example Settings**:
- `business_hours`: Operating hours
- `booking_settings`: Booking rules and constraints
- `notification_settings`: Notification preferences
- `payment_settings`: Payment configuration

#### 21. `notifications_log` Table
Notification delivery log (Phase 8).

```typescript
interface NotificationLog {
  id: string;                      // UUID
  customer_id: string | null;      // Foreign key -> users.id
  type: string;                    // Notification type (e.g., "appointment_reminder")
  channel: NotificationChannel;    // 'email' | 'sms'
  recipient: string;               // Email or phone number
  subject: string | null;          // Email subject
  message: string;                 // Message content
  status: NotificationStatus;      // 'pending' | 'sent' | 'failed'
  error_message: string | null;    // Error details if failed
  sent_at: string | null;          // Delivery timestamp
  is_test: boolean;                // Test notification flag
  created_at: string;
}
```

### Database Relationships

```
users (customers)
  ├── pets (1:many)
  ├── appointments (1:many)
  ├── waitlist entries (1:many)
  ├── loyalty_points (1:1)
  ├── customer_flags (1:1)
  └── customer_memberships (1:many)

pets
  ├── breed (many:1)
  └── appointments (1:many)

services
  ├── service_prices (1:many, one per size)
  └── appointments (1:many)

addons
  └── appointment_addons (1:many)

appointments
  ├── customer (many:1 -> users)
  ├── pet (many:1 -> pets)
  ├── service (many:1 -> services)
  ├── appointment_addons (1:many)
  ├── report_card (1:1)
  ├── payments (1:many)
  └── loyalty_transactions (1:many)

report_cards
  └── appointment (1:1)
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
2. **Admin-Created Accounts** - Admin creates customer account, user activates via email
3. **Password Reset** - Email-based password reset flow
4. **Session Management** - Server-side session validation via Supabase SSR

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

**Middleware** (`C:\Users\Jon\Documents\claude projects\thepuppyday\middleware.ts`):

```typescript
// Protected customer routes
const protectedRoutes = [
  '/dashboard',
  '/appointments',
  '/pets',
  '/profile',
  '/loyalty',
  '/membership',
  '/report-cards',
];

// Admin/groomer routes
const adminRoutes = ['/admin'];

// Admin API routes
const adminApiRoutes = ['/api/admin'];

// Auth routes (redirect if already authenticated)
const authRoutes = ['/login', '/register', '/forgot-password'];
```

**Protection Logic**:
1. Check Supabase session
2. If admin route, verify `role IN ('admin', 'groomer')`
3. Redirect unauthorized users:
   - Admin routes → `/dashboard` (customers)
   - Admin routes → `/login` (unauthenticated)
   - Admin API routes → 403 Forbidden (wrong role)
   - Admin API routes → 401 Unauthorized (not authenticated)

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

**Customer Endpoints** (`/api/customer/*`):

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with customer logic
}
```

### Row-Level Security (RLS)

**Pattern**: All tables use RLS policies with `SECURITY DEFINER` functions.

**Example Policy** (users table):
```sql
-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin());

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update all users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin());
```

**Key RLS Patterns**:
1. `auth.uid() = id` - User owns the record
2. `is_admin()` - Admin bypass
3. `is_staff()` - Admin or groomer access
4. Foreign key checks - `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND ...)`

### Data Validation

#### Input Validation (Zod Schemas)

**Example** (Appointment Creation):
```typescript
import { z } from 'zod';

const createAppointmentSchema = z.object({
  customer_id: z.string().uuid(),
  pet_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  addon_ids: z.array(z.string().uuid()).optional(),
  notes: z.string().max(500).optional(),
});

// In API route
const body = await request.json();
const validatedData = createAppointmentSchema.parse(body); // Throws if invalid
```

#### CSV Import Sanitization

**Formula Injection Prevention** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\admin\csv-processor.ts`):

```typescript
function sanitizeCSVValue(value: string): string {
  // Remove leading characters that could trigger formulas
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];

  if (dangerousChars.some(char => value.startsWith(char))) {
    return `'${value}`; // Prefix with single quote to neutralize
  }

  return value;
}
```

### Security Best Practices

#### 1. Foreign Key Constraints

**Admin Reference Protection**:
```sql
ALTER TABLE appointments
  ADD CONSTRAINT fk_created_by_admin
  FOREIGN KEY (created_by_admin_id)
  REFERENCES users(id)
  ON DELETE SET NULL; -- Preserve appointment history if admin deleted
```

#### 2. Email Uniqueness (Case-Insensitive)

```sql
CREATE UNIQUE INDEX users_email_unique
  ON users (LOWER(email));
```

#### 3. Unsubscribe Token Security (Phase 8)

**Token Generation** (`C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\notifications\unsubscribe.ts`):

```typescript
import crypto from 'crypto';

function generateUnsubscribeToken(payload: UnsubscribePayload): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const signature = hmac.digest('base64url');

  // Format: base64url(payload).base64url(signature)
  return `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;
}
```

**Token Validation**:
```typescript
function validateUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [payloadB64, signatureB64] = token.split('.');

  // Verify signature using constant-time comparison
  const expectedSignature = /* regenerate signature */;
  if (!crypto.timingSafeEqual(
    Buffer.from(signatureB64, 'base64url'),
    Buffer.from(expectedSignature, 'base64url')
  )) {
    return null; // Invalid signature
  }

  // Check expiration
  if (payload.expiresAt < Date.now()) {
    return null; // Expired
  }

  return payload;
}
```

#### 4. Payment Validation (Phase 7)

**Server-Side Verification**:
- All payment amounts calculated server-side
- Client-submitted amounts validated against database
- Stripe webhook signature verification

#### 5. File Upload Security

**Storage Policies** (Supabase Storage):
- Authenticated upload only
- File type validation (MIME types)
- File size limits (5MB for photos)
- Public read access for report card photos

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
- Mock Stripe, Resend, Twilio services
- Seeded test data
- Fast development iteration

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

1. **Requirements Phase**
   - Create `docs/specs/{phase}/requirements.md` (EARS format)
   - Define user stories and acceptance criteria

2. **Design Phase**
   - Create `docs/specs/{phase}/design.md`
   - Define architecture, data models, API contracts

3. **Task Planning Phase**
   - Create `docs/specs/{phase}/tasks.md`
   - Break down into numbered tasks (0001, 0002, etc.)

4. **Implementation Phase**
   - Use `/kc:impl [task-number]` slash command
   - Implement task with tests
   - Update task status

5. **Review Phase**
   - Code review with `code-reviewer` agent
   - Run tests (`npm test`)
   - Update documentation

### Agent Workflows

The Puppy Day uses specialized AI agents for different development tasks. Each agent is invoked with `@agent-{name}`.

#### Available Agents

**Kiro Workflow Agents** (Spec-Driven Development):
- `kiro-requirement`: Requirements analysis in EARS format
- `kiro-design`: Technical design documents with architecture and data models
- `kiro-plan`: Implementation task planning and breakdown
- `kiro-executor`: Focused task implementation

**Frontend Workflow Agents** (Two-Step Orchestration):
- `frontend-expert`: **STEP 1 - DESIGN** - UI/UX design specifications
- `daisyui-expert`: **STEP 2 - IMPLEMENT** - DaisyUI + Tailwind implementation

**Specialized Agents**:
- `nextjs-expert`: Next.js patterns and best practices
- `code-reviewer`: Architecture and security review
- `supabase-nextjs-expert`: Supabase + Next.js integration expert

#### Frontend Development Workflow

For UI/UX work, use the **two-step orchestration**:

**Step 1: Design with `@agent-frontend-expert`**
- Creates comprehensive UI/UX design specifications
- Defines layout, visual hierarchy, user flows, and interactions
- Outputs: `.claude/design/[name].md`
- Focus: **WHAT** to build and **WHY**

**Step 2: Implement with `@agent-daisyui-expert`**
- Reads design spec from frontend-expert
- Implements design using DaisyUI components + Tailwind utilities
- Writes production-ready React/TypeScript code
- Focus: **HOW** to build with DaisyUI/Tailwind

**Example Usage**:
```bash
# Step 1: Create design specification
@agent-frontend-expert "Design a booking confirmation modal with appointment details and action buttons"

# Output: .claude/design/booking-confirmation-modal.md
# Contains: Layout structure, visual design, interaction patterns, responsive behavior

# Step 2: Implement the design
@agent-daisyui-expert "Implement the booking confirmation modal design"

# Output: src/components/BookingConfirmationModal.tsx
# Contains: Working React/TypeScript component with DaisyUI + Tailwind
```

**Benefits**:
- **Separation of Concerns**: Design decisions separate from implementation
- **Review Points**: Design can be approved before implementation
- **Consistency**: Both agents reference The Puppy Day design system
- **Speed**: Direct design-to-code workflow (no intermediate planning)

**Design System Compliance**:
Both agents enforce The Puppy Day design system:
- **Colors**: Warm cream (#F8EEE5) background, charcoal (#434E54) primary
- **Shadows**: Soft, blurred (`shadow-sm`, `shadow-md`, `shadow-lg`)
- **Borders**: Subtle 1px or none, no bold borders
- **Corners**: Rounded (`rounded-lg`, `rounded-xl`)
- **Typography**: Professional hierarchy, regular to semibold weights
- **Tone**: Professional yet warm, trustworthy, never corporate

### Testing Strategy

**Unit Tests**:
- Test pure functions (pricing, validation, utilities)
- Located in `__tests__/lib/`

**Integration Tests**:
- Test API routes with mock Supabase
- Located in `__tests__/api/`

**Component Tests**:
- Test React components with Testing Library
- Located in `__tests__/components/`

**Example Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { calculatePrice } from '@/lib/booking/pricing';

describe('calculatePrice', () => {
  it('calculates correct total with service and addons', () => {
    const service = { id: '1', name: 'Basic', prices: [{ size: 'small', price: 40 }] };
    const addons = [{ id: '1', name: 'Teeth', price: 10 }];

    const result = calculatePrice(service, 'small', addons);

    expect(result.servicePrice).toBe(40);
    expect(result.addonsTotal).toBe(10);
    expect(result.total).toBe(50);
  });
});
```

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

# Unsubscribe Tokens (Phase 8)
UNSUBSCRIBE_TOKEN_SECRET=your-secret-key  # Or uses NEXTAUTH_SECRET as fallback
NEXTAUTH_SECRET=your-nextauth-secret
```

### Configuration File

**Location**: `C:\Users\Jon\Documents\claude projects\thepuppyday\src\lib\config.ts`

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

## Additional Resources

- **Project Instructions**: `C:\Users\Jon\Documents\claude projects\thepuppyday\CLAUDE.md`
- **Specifications**: `C:\Users\Jon\Documents\claude projects\thepuppyday\docs\specs\`
- **Database Queries**: `C:\Users\Jon\Documents\claude projects\thepuppyday\supabase\test-queries.sql`
- **Scripts**: `C:\Users\Jon\Documents\claude projects\thepuppyday\scripts\`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-20
**Maintained By**: Development Team
