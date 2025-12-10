# Requirements Document - Phase 1: Foundation & Database

## Introduction

Phase 1 establishes the foundational infrastructure for The Puppy Day SaaS application. This includes the Next.js project configuration, complete database schema design, authentication system, mock service layer for development, and a base component library built with DaisyUI and Framer Motion.

## Requirements

### Requirement 1: Project Configuration

**User Story:** As a developer, I want a fully configured Next.js 14+ project with TypeScript, Tailwind CSS, and DaisyUI, so that I can build a modern, type-safe application with consistent styling.

#### Acceptance Criteria

1. WHEN the project is started THEN the system SHALL use Next.js 14+ with App Router architecture
2. WHEN TypeScript is compiled THEN the system SHALL enforce strict mode with no implicit any
3. WHEN styles are applied THEN the system SHALL use Tailwind CSS v4 with DaisyUI v5 plugin
4. WHEN animations are needed THEN the system SHALL use Framer Motion for mount/unmount transitions
5. WHEN code is committed THEN the system SHALL pass ESLint and TypeScript checks
6. WHEN environment variables are needed THEN the system SHALL load from .env.local with typed access

### Requirement 2: Database Schema

**User Story:** As a system administrator, I want a comprehensive database schema that supports all application features including users, pets, services, appointments, and business operations, so that data is properly structured with enforced relationships.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL create a record with id, email, phone, first_name, last_name, role, avatar_url, preferences, created_at, updated_at
2. WHEN a user role is set THEN the system SHALL validate it is one of: customer, admin, groomer
3. WHEN a pet is created THEN the system SHALL store id, owner_id, name, breed, size, weight, birth_date, notes, photo_url, is_active
4. WHEN a pet size is set THEN the system SHALL validate it is one of: small (0-18 lbs), medium (19-35 lbs), large (36-65 lbs), xlarge (66+ lbs)
5. WHEN a service is defined THEN the system SHALL store id, name, description, base_duration_minutes, image_url, prices (by size), is_add_on, is_active
6. WHEN service prices are set THEN the system SHALL store separate prices for each size category
7. WHEN an add-on is created THEN the system SHALL store id, name, description, price, upsell_prompt, upsell_breeds[], is_active
8. WHEN an appointment is created THEN the system SHALL store customer_id, pet_id, groomer_id, service_id, scheduled_at, status, total_price, notes
9. WHEN appointment status changes THEN the system SHALL validate it is one of: pending, confirmed, checked_in, in_progress, ready, completed, cancelled, no_show
10. WHEN a waitlist entry is created THEN the system SHALL store customer_id, pet_id, service_id, preferred_date, time_preference, status
11. WHEN a report card is created THEN the system SHALL store appointment_id, mood, coat_condition, behavior, health_observations[], groomer_notes, before_photo_url, after_photo_url
12. WHEN a membership is defined THEN the system SHALL store name, description, price, billing_frequency, benefits[], is_active
13. WHEN loyalty points are tracked THEN the system SHALL store customer_id, points_balance, lifetime_points with transaction history
14. WHEN a customer is flagged THEN the system SHALL store customer_id, reason, notes, flagged_by, created_at
15. WHEN a payment is recorded THEN the system SHALL store appointment_id, stripe_payment_intent_id, amount, status, payment_method, tip_amount
16. WHEN site content is updated THEN the system SHALL store section, content (JSONB), updated_at
17. WHEN breeds are seeded THEN the system SHALL include grooming_frequency_weeks and reminder_message for retention marketing

### Requirement 3: Authentication System

**User Story:** As a user, I want to securely authenticate using email/password, so that my account and data are protected.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL create an account with email and hashed password
2. WHEN a user logs in THEN the system SHALL validate credentials and create a session
3. WHEN a user logs out THEN the system SHALL invalidate the session
4. WHEN a session expires THEN the system SHALL redirect to login preserving the return URL
5. IF a user has role "admin" or "groomer" THEN the system SHALL grant access to /admin routes
6. IF a user has role "customer" THEN the system SHALL restrict access to /(customer) routes only
7. WHEN authentication fails THEN the system SHALL display user-friendly error messages
8. WHEN a user forgets password THEN the system SHALL send a reset link via email
9. IF a protected route is accessed without authentication THEN the system SHALL redirect to login

### Requirement 4: Mock Service Layer

**User Story:** As a developer, I want mock implementations of Supabase, Stripe, Resend, and Twilio, so that I can develop and test without external dependencies.

#### Acceptance Criteria

1. WHEN NEXT_PUBLIC_USE_MOCKS is true THEN the system SHALL use mock implementations
2. WHEN NEXT_PUBLIC_USE_MOCKS is false THEN the system SHALL use real service clients
3. WHEN mock Supabase is active THEN the system SHALL provide in-memory data storage with localStorage persistence
4. WHEN mock Stripe is active THEN the system SHALL simulate checkout flows and return test payment intents
5. WHEN mock Resend is active THEN the system SHALL log emails to console instead of sending
6. WHEN mock Twilio is active THEN the system SHALL log SMS to console instead of sending
7. WHEN mock services are used THEN the system SHALL seed default data (services, breeds, settings)
8. WHEN switching between mock and real services THEN the system SHALL use the same interface/API

### Requirement 5: Base Component Library

**User Story:** As a developer, I want a set of reusable UI components built with DaisyUI and Framer Motion, so that I can build consistent, animated interfaces efficiently.

#### Acceptance Criteria

1. WHEN building forms THEN the system SHALL provide: Button, Input, Select, Textarea, Checkbox, Radio components
2. WHEN displaying content THEN the system SHALL provide: Card, Badge, Avatar, Alert components
3. WHEN building overlays THEN the system SHALL provide: Modal, Drawer, Dropdown components
4. WHEN showing navigation THEN the system SHALL provide: Navbar, Tabs, Breadcrumb components
5. WHEN indicating loading THEN the system SHALL provide: Spinner, Skeleton components
6. WHEN showing feedback THEN the system SHALL provide: Toast notification system
7. WHEN components mount/unmount THEN the system SHALL apply Framer Motion animations
8. WHEN components are used on mobile THEN the system SHALL be fully responsive
9. WHEN a Button is clicked THEN the system SHALL show loading state during async operations
10. WHEN an Input has errors THEN the system SHALL display validation messages with error styling

### Requirement 6: Application Shell

**User Story:** As a developer, I want route group layouts for marketing, auth, customer portal, and admin panel, so that each section has appropriate navigation and styling.

#### Acceptance Criteria

1. WHEN accessing /(marketing) routes THEN the system SHALL display public navigation with "Book Now" CTA
2. WHEN accessing /(auth) routes THEN the system SHALL display minimal layout for login/register
3. WHEN accessing /(customer) routes THEN the system SHALL display customer dashboard navigation with user menu
4. WHEN accessing /(admin) routes THEN the system SHALL display admin sidebar navigation with role-based menu items
5. WHEN the user is on mobile THEN the system SHALL show responsive navigation (hamburger menu or drawer)
6. WHEN theme preference is set THEN the system SHALL apply light or dark DaisyUI theme
