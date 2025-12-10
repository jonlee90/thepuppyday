# Implementation Tasks - Phase 1: Foundation & Database

## Overview

This document contains the implementation tasks for Phase 1. Each task should be implemented in order, as later tasks depend on earlier ones.

---

## Task 1: Project Structure Setup

**Objective**: Create the complete directory structure and configuration files.

### Subtasks

- [ ] 1.1 Create src/lib/ directory with config.ts for environment configuration
- [ ] 1.2 Create src/types/ directory with database.ts for TypeScript types
- [ ] 1.3 Create src/mocks/ directory structure (supabase/, stripe/, resend/, twilio/)
- [ ] 1.4 Create src/hooks/ directory with placeholder files
- [ ] 1.5 Create src/stores/ directory with placeholder files
- [ ] 1.6 Create src/components/ui/ directory for base components
- [ ] 1.7 Create src/components/layouts/ directory for layout components
- [ ] 1.8 Update tsconfig.json with strict mode and path aliases

### Acceptance Criteria

- All directories exist with proper structure
- config.ts exports typed environment variables
- TypeScript compilation passes

---

## Task 2: Database Types and Schema

**Objective**: Create complete TypeScript types and SQL migration files.

### Subtasks

- [ ] 2.1 Create src/types/database.ts with all entity types (User, Pet, Service, Appointment, etc.)
- [ ] 2.2 Create src/types/api.ts with API request/response types
- [ ] 2.3 Create supabase/migrations/ directory
- [ ] 2.4 Create 001_initial_schema.sql with all tables from design doc
- [ ] 2.5 Create 002_seed_data.sql with default services, breeds, and settings
- [ ] 2.6 Create src/types/index.ts exporting all types

### Acceptance Criteria

- All 21 database tables defined in SQL
- TypeScript types match SQL schema
- Seed data includes services, breeds, add-ons, and default settings

---

## Task 3: Mock Supabase Implementation

**Objective**: Create a mock Supabase client with in-memory storage.

### Subtasks

- [ ] 3.1 Create src/mocks/supabase/store.ts with MockStore class
- [ ] 3.2 Implement CRUD operations (select, insert, update, delete)
- [ ] 3.3 Implement query builder pattern (.eq(), .order(), .limit())
- [ ] 3.4 Add localStorage persistence for data between refreshes
- [ ] 3.5 Create src/mocks/supabase/seed.ts with seed data function
- [ ] 3.6 Create src/mocks/supabase/client.ts exporting mock client
- [ ] 3.7 Create src/mocks/supabase/auth.ts for mock authentication

### Acceptance Criteria

- Mock client matches Supabase client interface
- Data persists in localStorage
- Auth mock handles sign in/up/out

---

## Task 4: Mock Stripe Implementation

**Objective**: Create a mock Stripe client for development.

### Subtasks

- [ ] 4.1 Create src/mocks/stripe/client.ts
- [ ] 4.2 Implement mock checkout session creation
- [ ] 4.3 Implement mock payment intent handling
- [ ] 4.4 Log all operations to console for debugging

### Acceptance Criteria

- createCheckoutSession returns mock session
- retrievePaymentIntent returns mock data
- All operations logged to console

---

## Task 5: Mock Email/SMS Implementation

**Objective**: Create mock Resend and Twilio clients.

### Subtasks

- [ ] 5.1 Create src/mocks/resend/client.ts
- [ ] 5.2 Implement mock sendEmail that logs to console
- [ ] 5.3 Create src/mocks/twilio/client.ts
- [ ] 5.4 Implement mock sendSMS that logs to console
- [ ] 5.5 Store sent messages in mock store for dev dashboard viewing

### Acceptance Criteria

- sendEmail logs email content to console
- sendSMS logs SMS content to console
- Messages stored for later viewing

---

## Task 6: Service Factory Setup

**Objective**: Create the service factory pattern for switching between mock and real services.

### Subtasks

- [ ] 6.1 Create src/lib/supabase/client.ts with createClient factory
- [ ] 6.2 Create src/lib/supabase/server.ts for server-side client
- [ ] 6.3 Create src/lib/stripe/client.ts with factory pattern
- [ ] 6.4 Create src/lib/resend/client.ts with factory pattern
- [ ] 6.5 Create src/lib/twilio/client.ts with factory pattern
- [ ] 6.6 Export all clients from src/lib/index.ts

### Acceptance Criteria

- config.useMocks determines which client is used
- Same interface for mock and real clients
- Type-safe client exports

---

## Task 7: Authentication System

**Objective**: Implement authentication with auth context and route protection.

### Subtasks

- [ ] 7.1 Create src/stores/auth-store.ts with Zustand
- [ ] 7.2 Create src/hooks/use-auth.ts hook
- [ ] 7.3 Create src/components/providers/auth-provider.tsx
- [ ] 7.4 Create src/lib/supabase/middleware.ts for route protection
- [ ] 7.5 Update src/middleware.ts with auth middleware
- [ ] 7.6 Create src/app/(auth)/login/page.tsx
- [ ] 7.7 Create src/app/(auth)/register/page.tsx
- [ ] 7.8 Create src/app/(auth)/forgot-password/page.tsx
- [ ] 7.9 Create src/app/(auth)/layout.tsx

### Acceptance Criteria

- Login form validates and authenticates
- Register creates new user
- Session persists across page reloads
- Protected routes redirect unauthenticated users

---

## Task 8: Base UI Components

**Objective**: Create reusable UI components with DaisyUI and Framer Motion.

### Subtasks

- [ ] 8.1 Create src/components/ui/button.tsx with variants and loading state
- [ ] 8.2 Create src/components/ui/input.tsx with label and error display
- [ ] 8.3 Create src/components/ui/select.tsx
- [ ] 8.4 Create src/components/ui/textarea.tsx
- [ ] 8.5 Create src/components/ui/checkbox.tsx
- [ ] 8.6 Create src/components/ui/card.tsx
- [ ] 8.7 Create src/components/ui/modal.tsx with Framer Motion
- [ ] 8.8 Create src/components/ui/drawer.tsx with Framer Motion
- [ ] 8.9 Create src/components/ui/badge.tsx
- [ ] 8.10 Create src/components/ui/avatar.tsx
- [ ] 8.11 Create src/components/ui/alert.tsx
- [ ] 8.12 Create src/components/ui/spinner.tsx
- [ ] 8.13 Create src/components/ui/skeleton.tsx
- [ ] 8.14 Create src/components/ui/index.ts barrel export

### Acceptance Criteria

- All components use DaisyUI classes
- Modal/Drawer animate with Framer Motion
- Components are fully typed with proper props
- Components are responsive

---

## Task 9: Toast Notification System

**Objective**: Implement a toast notification system for user feedback.

### Subtasks

- [ ] 9.1 Create src/stores/toast-store.ts with Zustand
- [ ] 9.2 Create src/hooks/use-toast.ts hook
- [ ] 9.3 Create src/components/ui/toast.tsx component
- [ ] 9.4 Create src/components/providers/toast-provider.tsx
- [ ] 9.5 Add toast provider to root layout

### Acceptance Criteria

- Toast can show success, error, warning, info messages
- Toasts auto-dismiss after configurable time
- Multiple toasts can stack
- Toasts animate in/out

---

## Task 10: Application Shell and Layouts

**Objective**: Create route group layouts for each section.

### Subtasks

- [ ] 10.1 Create src/components/layouts/marketing-nav.tsx
- [ ] 10.2 Create src/components/layouts/customer-nav.tsx
- [ ] 10.3 Create src/components/layouts/admin-sidebar.tsx
- [ ] 10.4 Create src/app/(marketing)/layout.tsx
- [ ] 10.5 Create src/app/(marketing)/page.tsx (placeholder)
- [ ] 10.6 Create src/app/(customer)/layout.tsx with auth protection
- [ ] 10.7 Create src/app/(customer)/dashboard/page.tsx (placeholder)
- [ ] 10.8 Create src/app/(admin)/layout.tsx with admin role protection
- [ ] 10.9 Create src/app/(admin)/dashboard/page.tsx (placeholder)
- [ ] 10.10 Update src/app/layout.tsx with providers
- [ ] 10.11 Update src/app/page.tsx to redirect to marketing

### Acceptance Criteria

- Each route group has appropriate navigation
- Protected routes require authentication
- Admin routes require admin/groomer role
- Layouts are responsive

---

## Task 11: Form Components and Validation

**Objective**: Create form field wrapper components with React Hook Form integration.

### Subtasks

- [ ] 11.1 Create src/components/forms/form-field.tsx wrapper
- [ ] 11.2 Create src/components/forms/form-error.tsx for error display
- [ ] 11.3 Create src/lib/validations/auth.ts with Zod schemas
- [ ] 11.4 Create src/lib/validations/pet.ts with Zod schemas
- [ ] 11.5 Create src/lib/validations/index.ts barrel export

### Acceptance Criteria

- FormField integrates with react-hook-form
- Validation errors display correctly
- Schemas are reusable across forms

---

## Task 12: Utility Functions

**Objective**: Create common utility functions.

### Subtasks

- [ ] 12.1 Create src/lib/utils.ts with cn() for className merging
- [ ] 12.2 Add formatCurrency() function
- [ ] 12.3 Add formatDate() and formatTime() functions
- [ ] 12.4 Add calculateServicePrice() for size-based pricing
- [ ] 12.5 Create src/hooks/use-media-query.ts for responsive logic

### Acceptance Criteria

- cn() properly merges Tailwind classes
- Price formatting uses USD locale
- Date formatting is consistent

---

## Task 13: Copy Logo and Static Assets

**Objective**: Add the logo and set up public assets.

### Subtasks

- [ ] 13.1 Copy logo from /Users/jonathanlee/Downloads/puppy_day_logo_main.png to public/images/
- [ ] 13.2 Create public/images/ directory if needed
- [ ] 13.3 Add favicon based on logo
- [ ] 13.4 Update src/app/layout.tsx metadata

### Acceptance Criteria

- Logo accessible at /images/puppy_day_logo_main.png
- Favicon visible in browser tab
- Metadata includes app name and description

---

## Task 14: Session Context File

**Objective**: Create the session context file for Kiro SDD workflow.

### Subtasks

- [ ] 14.1 Create .claude/tasks/context_session_1.md
- [ ] 14.2 Document completed Phase 1 work
- [ ] 14.3 List key files and decisions

### Acceptance Criteria

- Context file documents current progress
- Key decisions are recorded
- File structure matches Kiro SDD template

---

## Task 15: Verification and Testing

**Objective**: Verify all Phase 1 work is complete and functional.

### Subtasks

- [ ] 15.1 Run npm run build and verify no errors
- [ ] 15.2 Run npm run dev and test authentication flow
- [ ] 15.3 Verify mock data loads correctly
- [ ] 15.4 Test route protection (unauthenticated access)
- [ ] 15.5 Test admin route protection (non-admin access)
- [ ] 15.6 Verify all UI components render correctly
- [ ] 15.7 Test toast notifications
- [ ] 15.8 Verify responsive layouts on mobile viewport

### Acceptance Criteria

- Build passes with no errors
- All routes accessible with proper auth
- Mock services functioning
- UI components display correctly

---

## Summary

| Task | Description | Priority |
|------|-------------|----------|
| 1 | Project Structure Setup | High |
| 2 | Database Types and Schema | High |
| 3 | Mock Supabase Implementation | High |
| 4 | Mock Stripe Implementation | Medium |
| 5 | Mock Email/SMS Implementation | Medium |
| 6 | Service Factory Setup | High |
| 7 | Authentication System | High |
| 8 | Base UI Components | High |
| 9 | Toast Notification System | Medium |
| 10 | Application Shell and Layouts | High |
| 11 | Form Components and Validation | Medium |
| 12 | Utility Functions | Medium |
| 13 | Copy Logo and Static Assets | Low |
| 14 | Session Context File | Low |
| 15 | Verification and Testing | High |
